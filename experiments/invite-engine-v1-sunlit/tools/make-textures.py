"""Procedural material textures (plaster, linen, cotton paper, sandstone, grain).
Writes PNG masters into tools/.build/textures; build-assets.mjs converts them to responsive WebP.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

OUT = os.path.join(os.path.dirname(__file__), '.build', 'textures')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def value_noise(h, w, scale, octaves=4, persistence=0.5, seed=0):
    r = np.random.default_rng(seed)
    total = np.zeros((h, w))
    amp, freq, norm = 1.0, 1.0, 0.0
    for _ in range(octaves):
        gh, gw = max(2, int(h / scale * freq)), max(2, int(w / scale * freq))
        g = r.random((gh, gw))
        up = ndimage.zoom(g, (h / gh, w / gw), order=3)[:h, :w]
        total += up * amp
        norm += amp
        amp *= persistence
        freq *= 2
    t = total / norm
    return (t - t.min()) / (t.max() - t.min() + 1e-9)


def tint(gray, dark, light):
    dark = np.array(dark, float)[None, None, :]
    light = np.array(light, float)[None, None, :]
    return (dark + (light - dark) * gray[..., None]).clip(0, 255).astype(np.uint8)


def save(arr, name):
    Image.fromarray(arr).save(os.path.join(OUT, name))
    print('texture', name, arr.shape)


# 1. Lime plaster wall — warm ivory sandstone, soft mottling + trowel marks
H, W = 2000, 2000
n = value_noise(H, W, 420, 5, 0.55, 1) * 0.6 + value_noise(H, W, 60, 3, 0.5, 2) * 0.3 + rng.random((H, W)) * 0.1
trowel = ndimage.gaussian_filter(rng.random((H, W)), (1, 18)) * 1.0
g = (n * 0.8 + (trowel - trowel.mean()) * 1.6 + 0.2).clip(0, 1)
save(tint(g, (214, 199, 176), (243, 235, 222)), 'plaster.png')

# 2. Sandstone (plinth / ledge) — denser grain, slightly darker
H, W = 1200, 1200
n = value_noise(H, W, 180, 4, 0.5, 3) * 0.55 + ndimage.gaussian_filter(rng.random((H, W)), 0.8) * 0.45
save(tint(n, (196, 176, 148), (232, 219, 198)), 'sandstone.png')

# 3. Linen — plain weave with slubs, then soft folds (for the fabric reveal)
H, W = 1600, 1600
warp = ndimage.gaussian_filter(rng.random((H, W)), (0.6, 5))
weft = ndimage.gaussian_filter(rng.random((H, W)), (5, 0.6))
yy, xx = np.mgrid[0:H, 0:W]
weave = 0.5 + 0.5 * np.sin(xx * np.pi / 2.2) * np.sin(yy * np.pi / 2.2)
slub = ndimage.gaussian_filter(rng.random((H, W)), (0.8, 30))
base = (warp * 0.35 + weft * 0.35 + weave * 0.18 + slub * 0.4)
base = (base - base.min()) / (base.max() - base.min())
folds = (np.sin((xx * 0.6 + yy) / 210.0 + 0.8) * 0.5 + 0.5) ** 1.6 * 0.55 + (np.sin((xx - yy * 0.3) / 140.0) * 0.5 + 0.5) * 0.25
folds = ndimage.gaussian_filter(folds, 12)
lin = (base * 0.35 + folds * 0.75).clip(0, 1)
save(tint(lin, (205, 194, 176), (246, 241, 232)), 'linen.png')

# 4. Cotton paper — fine fibres, very low contrast (card stock)
H, W = 1960, 1400
fib = ndimage.gaussian_filter(rng.random((H, W)), (0.5, 2.5)) * 0.5 + ndimage.gaussian_filter(rng.random((H, W)), (2.5, 0.5)) * 0.5
cloud = value_noise(H, W, 300, 3, 0.5, 5)
p = (fib * 0.55 + cloud * 0.45)
p = (p - p.min()) / (p.max() - p.min())
paper = tint(p * 0.5 + 0.5, (228, 220, 206), (250, 246, 238))
# soft edge darkening (hand-made paper feel)
Y, X = np.mgrid[0:H, 0:W]
edge = np.minimum.reduce([X, Y, W - 1 - X, H - 1 - Y]).astype(float)
shade = 1 - 0.05 * np.exp(-edge / 18.0)
save((paper * shade[..., None]).clip(0, 255).astype(np.uint8), 'paper-cotton.png')

# 5. Film / paper grain tile (RGBA, neutral, used as an overlay)
H, W = 512, 512
gr = rng.normal(0.5, 0.18, (H, W)).clip(0, 1)
rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., :3] = (gr[..., None] * 255).astype(np.uint8)
rgba[..., 3] = (np.abs(gr - 0.5) * 2 * 60).astype(np.uint8)
save(rgba, 'grain.png')

# 6. Terrazzo-free gallery wall (modern white gallery) — nearly flat, faint cloud
H, W = 1200, 1200
w = value_noise(H, W, 500, 3, 0.5, 11)
save(tint(w * 0.6 + 0.4, (226, 226, 222), (246, 246, 243)), 'gallery-wall.png')
