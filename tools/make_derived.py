#!/usr/bin/env python3
"""
Derived (lighter) variants of P0 assets for the balanced/low quality tiers.

    python3 tools/make_derived.py

Writes public/assets/p0-derived/** plus public/assets/p0-derived/derived-index.json recording, for
every output, the P0 source file + its sha256, the operation applied and the output sha256 — so a
derived file is always traceable to (and licensed like) its CC0 / Pexels / Mixkit source.
Originals in public/assets/p0 are never modified.
"""
import hashlib, json, os
os.environ["OPENCV_IO_ENABLE_OPENEXR"] = "1"
import cv2  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "public", "assets")
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()

RGBM_RANGE = 16.0
WEB_MODELS = ['p0/models/lantern-chandelier-01.glb', 'p0/models/brass-goblets.glb', 'p0/models/brass-vase-02.glb', 'p0/models/flower-empodium.glb', 'p0/models/lantern-01.glb']
JOBS = [
    # (source, output, operation)
    ("p0/hdri/courtyard-2k.exr", "p0-derived/hdri/courtyard-1k.exr", "resize 2048x1024 -> 1024x512 (INTER_AREA), RGB float, EXR"),
    # Web-servable HDR: RGBM16 in an 8-bit RGBA PNG (decoded by three.js RGBMLoader, maxRange 16).
    # Linear radiance, values above 16 clipped (affects only the brightest sky texels; the scene dims and tints the env).
    ("p0/hdri/courtyard-2k.exr", "p0-derived/hdri/courtyard-2k-rgbm16.png", "RGBM16 encode (linear, maxRange 16, clip >16), 2048x1024 PNG"),
    ("p0/hdri/courtyard-2k.exr", "p0-derived/hdri/courtyard-1k-rgbm16.png", "resize to 1024x512 (INTER_AREA) + RGBM16 encode (linear, maxRange 16), PNG"),
]

def rgbm(img):
    import numpy as np
    v = np.clip(img.astype("float32"), 0, RGBM_RANGE)
    m = np.clip(v.max(axis=2, keepdims=True) / RGBM_RANGE, 1 / 255, 1)
    m = np.ceil(m * 255) / 255
    rgb = np.clip(np.round(v / (m * RGBM_RANGE) * 255), 0, 255)
    return np.concatenate([rgb, np.round(m * 255)], axis=2).astype("uint8")  # BGR + A (cv2 order)

def run():
    out_index = []
    for src, dst, op in JOBS:
        s, d = os.path.join(A, src), os.path.join(A, dst)
        os.makedirs(os.path.dirname(d), exist_ok=True)
        img = cv2.imread(s, cv2.IMREAD_UNCHANGED)[:, :, :3]
        if "1k" in dst:
            img = cv2.resize(img, (1024, 512), interpolation=cv2.INTER_AREA)
        if dst.endswith(".exr"):
            cv2.imwrite(d, img, [cv2.IMWRITE_EXR_TYPE, cv2.IMWRITE_EXR_TYPE_HALF])
        else:
            cv2.imwrite(d, rgbm(img), [cv2.IMWRITE_PNG_COMPRESSION, 9])
        out_index.append({"output": "public/assets/" + dst, "bytes": os.path.getsize(d), "sha256": sha(d),
                          "source": "public/assets/" + src, "sourceSha256": sha(s), "operation": op,
                          "license": "inherits source (see asset-index.json)"})
        print("[derived]", dst, os.path.getsize(d), "bytes")
    idx_path = os.path.join(A, "p0-derived", "derived-index.json")
    prev = json.load(open(idx_path))["derived"] if os.path.exists(idx_path) else []
    keep = [d for d in prev if d["output"] not in {o["output"] for o in out_index}]
    json.dump({"derived": keep + out_index}, open(idx_path, "w"), indent=2)
    # web-servable glTF packages of the GLBs the production scenes use
    import subprocess, sys
    subprocess.check_call([sys.executable, os.path.join(ROOT, "tools", "glb_to_web.py"), *WEB_MODELS])

if __name__ == "__main__":
    run()
