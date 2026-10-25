"""Synthesised audio packs (ambient loop + semantic one-shots) → MP3.

Packs: modern_romantic, arabic_oud, cinematic_luxury.
Cues:  ambient, reveal, transition, page, click, seal, finale, success, decline.
All sound is generated here (no samples), so the packs are license-clean and reproducible.
"""
import os
import subprocess
import tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'assets', 'audio')
rng = np.random.default_rng(21)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, d=0.0, s=1.0, r=0.3, total=None):
    total = total or n / SR
    t = np.arange(n) / SR
    e = np.ones(n) * s
    e[t < a] = t[t < a] / max(a, 1e-6)
    dec = (t >= a) & (t < a + d)
    e[dec] = 1 - (1 - s) * (t[dec] - a) / max(d, 1e-6)
    rel = t > total - r
    e[rel] *= np.clip((total - t[rel]) / max(r, 1e-6), 0, 1)
    return e


def piano(f, dur=2.5, vel=0.5):
    t = t_(dur)
    out = np.zeros_like(t)
    for k, amp in enumerate([1, 0.45, 0.22, 0.12, 0.06, 0.03], start=1):
        fk = f * k * (1 + 0.0004 * k * k)
        out += amp * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.6 + k * 0.9))
    atk = np.clip(t / 0.004, 0, 1)
    return out * atk * vel


def bell(f, dur=3.0, vel=0.4):
    t = t_(dur)
    out = np.zeros_like(t)
    for ratio, amp, dec in [(1, 1, 1.6), (2.76, 0.45, 2.8), (5.4, 0.25, 4.5), (8.93, 0.12, 7)]:
        out += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    return out * np.clip(t / 0.002, 0, 1) * vel


def lowpass(x, fc, order=2):
    b, a = signal.butter(order, min(fc / (SR / 2), 0.99), 'low')
    return signal.lfilter(b, a, x)


def bandpass(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi / (SR / 2), 0.99)], 'band')
    return signal.lfilter(b, a, x)


def pad(freqs, dur, cutoff=1200, detune=0.006, vib=0.0):
    t = t_(dur)
    out = np.zeros_like(t)
    for f in freqs:
        for d in (-detune, 0, detune):
            ph = 2 * np.pi * f * (1 + d) * t + (vib * np.sin(2 * np.pi * 5.1 * t) if vib else 0)
            out += signal.sawtooth(ph) * 0.3
    out = lowpass(out, cutoff, 2)
    return out / (len(freqs) * 3) * env(len(t), a=dur * 0.3, r=dur * 0.35)


def noise_swish(dur=0.5, lo=500, hi=3500, vel=0.3, rise=0.35):
    n = int(SR * dur)
    x = rng.normal(0, 1, n)
    x = bandpass(x, lo, hi)
    e = env(n, a=dur * rise, r=dur * (1 - rise))
    return x * e * vel


def thump(f0=110, f1=45, dur=0.5, vel=0.8):
    t = t_(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * vel


def ks_pluck(f, dur=2.2, vel=0.6, bright=0.5, slide=0.0):
    """Karplus-Strong with a short upward slide (oud-style) and body resonances."""
    n = int(SR * dur)
    period = int(SR / f)
    buf = rng.uniform(-1, 1, period) * vel
    buf = lowpass(buf, 1500 + 4000 * bright, 1)
    out = np.zeros(n)
    idx = 0
    damp = 0.996
    for i in range(n):
        cur = buf[idx]
        nxt = buf[(idx + 1) % period]
        buf[idx] = damp * 0.5 * (cur + nxt)
        out[i] = cur
        idx = (idx + 1) % period
    body = bandpass(out, 90, 5000) + 0.6 * bandpass(out, 180, 420) + 0.3 * bandpass(out, 900, 1500)
    return body * np.clip(np.arange(n) / (SR * 0.003), 0, 1)


def reverb(x, secs=2.4, wet=0.3, stereo=True):
    n = int(SR * secs)
    t = np.arange(n) / SR
    chans = []
    for s in (0, 1):
        ir = np.random.default_rng(100 + s).normal(0, 1, n) * np.exp(-t * (6.9 / secs))
        ir = lowpass(ir, 5200, 1)
        ir /= np.sqrt(np.sum(ir ** 2))
        c = signal.fftconvolve(x, ir)
        c = np.pad(c, (0, max(0, len(x) + n - len(c))))[: len(x) + n]
        chans.append(c)
    dry = np.pad(x, (0, n))
    L = dry * (1 - wet) + chans[0] * wet * 2.2
    R = dry * (1 - wet) + chans[1] * wet * 2.2
    return np.stack([L, R], axis=1)


def place(buf, x, at):
    i = int(at * SR)
    end = min(len(buf), i + len(x))
    buf[i:end] += x[: end - i]


def loopify(stereo, length):
    n = int(length * SR)
    out = stereo[:n].copy()
    tail = stereo[n:]
    m = min(len(tail), n)
    out[:m] += tail[:m]
    return out


def normalize(x, peak_db=-3.0):
    p = np.max(np.abs(x)) + 1e-9
    return x / p * 10 ** (peak_db / 20)


def write(pack, cue, stereo, kbps=96):
    os.makedirs(os.path.join(OUT, pack), exist_ok=True)
    if stereo.ndim == 1:
        stereo = np.stack([stereo, stereo], axis=1)
    fade = int(SR * 0.004)
    stereo[:fade] *= np.linspace(0, 1, fade)[:, None]
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        wavfile.write(f.name, SR, (np.clip(stereo, -1, 1) * 32767).astype(np.int16))
        dst = os.path.join(OUT, pack, f'{cue}.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f.name, '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', dst], check=True)
        os.unlink(f.name)
    print(f'  {pack}/{cue}.mp3', f'{os.path.getsize(dst) // 1024}KB')


def oneshot(x, secs=1.6, wet=0.28, db=-4):
    return normalize(reverb(x, secs, wet), db)


# ---------------------------------------------------------------- modern romantic
def modern_romantic():
    P = 'modern_romantic'
    L = 24.0
    buf = np.zeros(int(SR * (L + 4)))
    chords = [[50, 54, 57, 61, 64], [47, 50, 54, 57, 61], [43, 47, 50, 54, 57], [45, 50, 52, 57, 59]]
    for i, ch in enumerate(chords):
        place(buf, pad([midi(m) for m in ch[:3]], 7.5, cutoff=900) * 0.55, i * 6)
        # sparse piano: broken chord, rubato
        for j, m in enumerate([ch[0] + 12, ch[2] + 12, ch[4] + 12, ch[3] + 12]):
            place(buf, piano(midi(m), 3.2, 0.22 - j * 0.03), i * 6 + 0.35 + j * 0.62 + (0.08 if j % 2 else 0))
        place(buf, piano(midi(ch[4] + 24), 3.5, 0.08), i * 6 + 3.6)
    write(P, 'ambient', normalize(loopify(reverb(buf, 3.2, 0.42), L), -9), 112)
    rev = noise_swish(1.6, 300, 4200, 0.25, 0.8)
    x = np.zeros(int(SR * 3.2)); place(x, rev, 0)
    for k, m in enumerate([74, 78, 81, 86]):
        place(x, bell(midi(m), 2.2, 0.16), 1.25 + k * 0.11)
    write(P, 'reveal', oneshot(x, 2.4, 0.4))
    write(P, 'transition', oneshot(noise_swish(0.7, 400, 2600, 0.4, 0.45), 1.2, 0.25, -8))
    pg = noise_swish(0.28, 1200, 6000, 0.5, 0.2)
    pg[: int(SR * 0.18)] += noise_swish(0.18, 300, 900, 0.15, 0.3)
    write(P, 'page', oneshot(pg, 0.8, 0.18, -10))
    click = bandpass(rng.normal(0, 1, int(SR * 0.03)), 1800, 4200) * np.exp(-np.arange(int(SR * 0.03)) / (SR * 0.006))
    write(P, 'click', oneshot(click, 0.5, 0.12, -12))
    s = np.zeros(int(SR * 1.2)); place(s, thump(95, 48, 0.6, 0.9), 0); place(s, noise_swish(0.08, 1500, 5000, 0.3, 0.1), 0.0)
    write(P, 'seal', oneshot(s, 1.4, 0.22, -4))
    f = np.zeros(int(SR * 4.5))
    for k, m in enumerate([62, 66, 69, 73, 74, 78, 81]):
        place(f, piano(midi(m), 3.5, 0.22), k * 0.16)
    place(f, pad([midi(50), midi(57), midi(62)], 4.2, 1000) * 0.5, 0)
    write(P, 'finale', oneshot(f, 3.0, 0.4, -5))
    ss = np.zeros(int(SR * 2.2)); place(ss, bell(midi(81), 2, 0.3), 0); place(ss, bell(midi(86), 2, 0.25), 0.14)
    write(P, 'success', oneshot(ss, 2.0, 0.35, -6))
    d = np.zeros(int(SR * 2.4)); place(d, piano(midi(69), 2.2, 0.3), 0); place(d, piano(midi(66), 2.2, 0.28), 0.32)
    write(P, 'decline', oneshot(d, 2.0, 0.35, -7))


# ---------------------------------------------------------------- arabic oud (maqam hijaz on D)
def arabic_oud():
    P = 'arabic_oud'
    L = 24.0
    hijaz = [50, 51, 54, 55, 57, 58, 60, 62]  # D Eb F# G A Bb C D
    buf = np.zeros(int(SR * (L + 4)))
    place(buf, pad([midi(38), midi(45)], L + 1, cutoff=420, detune=0.003) * 0.9, 0)
    phrase = [(0, 4, .9), (.5, 5, .5), (.75, 4, .5), (1.0, 2, .9), (1.75, 1, .5), (2.0, 2, .8), (2.5, 0, 1.2),
              (4.0, 4, .6), (4.4, 5, .4), (4.7, 6, .4), (5.0, 7, 1.0), (6.0, 6, .5), (6.3, 5, .5), (6.6, 4, 1.0),
              (8.0, 2, .6), (8.4, 3, .5), (8.8, 4, .6), (9.3, 2, .5), (9.7, 1, .5), (10.1, 0, 1.4)]
    for rep in range(2):
        for at, deg, _ in phrase:
            m = hijaz[deg] + 12
            place(buf, ks_pluck(midi(m), 2.0, 0.45, 0.45) * 0.5, rep * 12 + at + 0.3)
    for b in np.arange(0, L, 1.5):
        place(buf, thump(80, 52, 0.4, 0.25), b)
    write(P, 'ambient', normalize(loopify(reverb(buf, 2.6, 0.3), L), -9), 112)
    x = np.zeros(int(SR * 3))
    for k, deg in enumerate([0, 2, 4, 5, 7]):
        place(x, ks_pluck(midi(hijaz[deg] + 12), 1.8, 0.6, 0.55), k * 0.13)
    place(x, noise_swish(1.2, 300, 2500, 0.12, 0.8), 0)
    write(P, 'reveal', oneshot(x, 2.0, 0.3))
    write(P, 'transition', oneshot(noise_swish(0.6, 300, 2200, 0.35, 0.4), 1.0, 0.2, -8))
    write(P, 'page', oneshot(ks_pluck(midi(69), 0.9, 0.35, 0.6), 1.0, 0.2, -10))
    write(P, 'click', oneshot(ks_pluck(midi(74), 0.35, 0.25, 0.8), 0.6, 0.1, -12))
    s = np.zeros(int(SR * 1.2)); place(s, thump(90, 50, 0.6, 1.0), 0); place(s, bandpass(rng.normal(0, 1, int(SR * .12)), 1500, 6000) * np.exp(-np.arange(int(SR * .12)) / (SR * .02)) * .4, 0)
    write(P, 'seal', oneshot(s, 1.3, 0.2, -4))
    f = np.zeros(int(SR * 4.5))
    for k, deg in enumerate([7, 6, 5, 4, 2, 1, 0]):
        place(f, ks_pluck(midi(hijaz[deg] + 12), 2.2, 0.5, 0.5), k * 0.22)
    place(f, ks_pluck(midi(50), 3.0, 0.6, 0.4), 1.7)
    write(P, 'finale', oneshot(f, 2.6, 0.32, -5))
    ss = np.zeros(int(SR * 2)); place(ss, ks_pluck(midi(62), 1.6, 0.5, .6), 0); place(ss, ks_pluck(midi(69), 1.6, 0.5, .6), 0.12)
    write(P, 'success', oneshot(ss, 1.6, 0.3, -6))
    d = np.zeros(int(SR * 2)); place(d, ks_pluck(midi(57), 1.6, 0.45, .4), 0); place(d, ks_pluck(midi(54), 1.6, 0.45, .4), 0.3)
    write(P, 'decline', oneshot(d, 1.6, 0.3, -7))


# ---------------------------------------------------------------- cinematic luxury (strings + piano, D minor)
def cinematic_luxury():
    P = 'cinematic_luxury'
    L = 24.0
    buf = np.zeros(int(SR * (L + 5)))
    chords = [[38, 50, 53, 57], [34, 50, 53, 58], [41, 48, 53, 57], [36, 48, 52, 55]]
    for i, ch in enumerate(chords):
        place(buf, pad([midi(m) for m in ch], 7.6, cutoff=700, detune=0.004, vib=0.004) * 0.8, i * 6)
        place(buf, piano(midi(ch[3] + 12), 4, 0.16), i * 6 + 1.2)
        place(buf, piano(midi(ch[2] + 12), 4, 0.1), i * 6 + 3.9)
    write(P, 'ambient', normalize(loopify(reverb(buf, 4.0, 0.45), L), -10), 112)
    x = np.zeros(int(SR * 3.5)); place(x, noise_swish(2.0, 120, 1800, 0.3, 0.85), 0); place(x, thump(70, 36, 1.2, 0.5), 1.9)
    place(x, pad([midi(50), midi(57), midi(62)], 2.4, 1400) * 0.8, 1.2)
    write(P, 'reveal', oneshot(x, 3.0, 0.45, -3))
    write(P, 'transition', oneshot(noise_swish(0.9, 200, 1600, 0.35, 0.55), 1.4, 0.3, -8))
    write(P, 'page', oneshot(noise_swish(0.22, 800, 3000, 0.4, 0.2), 0.8, 0.2, -11))
    click = bandpass(rng.normal(0, 1, int(SR * 0.04)), 600, 2400) * np.exp(-np.arange(int(SR * 0.04)) / (SR * 0.008))
    write(P, 'click', oneshot(click, 0.6, 0.15, -12))
    s = np.zeros(int(SR * 2)); place(s, thump(80, 32, 1.4, 1.0), 0)
    write(P, 'seal', oneshot(s, 2.2, 0.3, -3))
    f = np.zeros(int(SR * 6)); place(f, pad([midi(38), midi(50), midi(54), midi(57)], 5.5, 1600) * 0.9, 0)
    for k, m in enumerate([74, 78, 81, 86]):
        place(f, bell(midi(m), 2.5, 0.12), 1.4 + k * 0.18)
    write(P, 'finale', oneshot(f, 3.5, 0.45, -4))
    ss = np.zeros(int(SR * 2.5)); place(ss, piano(midi(74), 2.2, .3), 0); place(ss, piano(midi(78), 2.2, .28), 0.18); place(ss, piano(midi(81), 2.2, .26), 0.36)
    write(P, 'success', oneshot(ss, 2.2, 0.4, -6))
    d = np.zeros(int(SR * 2.5)); place(d, piano(midi(65), 2.2, .3), 0); place(d, piano(midi(62), 2.2, .3), 0.35)
    write(P, 'decline', oneshot(d, 2.2, 0.4, -7))


if __name__ == '__main__':
    print('[audio] modern_romantic'); modern_romantic()
    print('[audio] arabic_oud'); arabic_oud()
    print('[audio] cinematic_luxury'); cinematic_luxury()
