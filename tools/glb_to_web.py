#!/usr/bin/env python3
"""
Lossless repackaging of GLB models into web-servable glTF:

    python3 tools/glb_to_web.py p0/models/brass-goblets.glb [...]

Some static hosts (including the artifact host this prototype is published on) do not serve .glb/.bin.
For each model this writes  public/assets/p0-derived/models/<name>/
    <name>.gltf.json   glTF 2.0 JSON; geometry buffer embedded as a base64 data URI
    img<N>.jpg|png     the embedded textures, byte-identical to the GLB's images
and appends the conversion to p0-derived/derived-index.json (source sha256 → outputs).
No geometry, material or texture data is changed. GLTFLoader loads the .gltf.json directly.
"""
import base64, hashlib, json, os, struct, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "public", "assets")
sha = lambda b: hashlib.sha256(b).hexdigest()


def convert(rel):
    src = os.path.join(A, rel)
    raw = open(src, "rb").read()
    magic, version, length = struct.unpack("<4sII", raw[:12])
    assert magic == b"glTF" and version == 2, rel
    jlen, jtype = struct.unpack("<I4s", raw[12:20]); assert jtype == b"JSON"
    j = json.loads(raw[20:20 + jlen])
    off = 20 + jlen
    blen, btype = struct.unpack("<I4s", raw[off:off + 8]); assert btype == b"BIN\x00"
    binary = raw[off + 8: off + 8 + blen]

    name = os.path.splitext(os.path.basename(rel))[0]
    out_dir = os.path.join(A, "p0-derived", "models", name)
    os.makedirs(out_dir, exist_ok=True)
    image_views = {im["bufferView"] for im in j.get("images", []) if "bufferView" in im}
    outputs = []
    for i, im in enumerate(j.get("images", [])):
        if "bufferView" not in im:
            continue
        bv = j["bufferViews"][im["bufferView"]]
        data = binary[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]]
        ext = "png" if im.get("mimeType") == "image/png" else "jpg"
        fn = f"img{i}.{ext}"
        open(os.path.join(out_dir, fn), "wb").write(data)
        outputs.append(fn)
        im.pop("bufferView"); im.pop("mimeType", None); im["uri"] = fn

    # rebuild the binary with only the non-image buffer views (4-byte aligned), remap indices
    remap, new_bin, new_views = {}, bytearray(), []
    for idx, bv in enumerate(j["bufferViews"]):
        if idx in image_views:
            continue
        data = binary[bv.get("byteOffset", 0): bv.get("byteOffset", 0) + bv["byteLength"]]
        while len(new_bin) % 4:
            new_bin.append(0)
        nb = dict(bv); nb["byteOffset"] = len(new_bin); nb["buffer"] = 0
        new_bin += data
        remap[idx] = len(new_views); new_views.append(nb)
    j["bufferViews"] = new_views
    for acc in j.get("accessors", []):
        if "bufferView" in acc:
            acc["bufferView"] = remap[acc["bufferView"]]
        sp = acc.get("sparse")
        if sp:
            sp["indices"]["bufferView"] = remap[sp["indices"]["bufferView"]]
            sp["values"]["bufferView"] = remap[sp["values"]["bufferView"]]
    j["buffers"] = [{"byteLength": len(new_bin), "uri": "data:application/octet-stream;base64," + base64.b64encode(bytes(new_bin)).decode()}]
    j.setdefault("asset", {})["extras"] = {"derivedFrom": "public/assets/" + rel, "sourceSha256": sha(raw), "tool": "tools/glb_to_web.py (lossless repack)"}
    out_json = os.path.join(out_dir, f"{name}.gltf.json")
    open(out_json, "w").write(json.dumps(j, separators=(",", ":")))
    total = sum(os.path.getsize(os.path.join(out_dir, f)) for f in os.listdir(out_dir))
    print(f"[glb→web] {rel} ({len(raw)} B) → p0-derived/models/{name}/ ({total} B, {len(outputs)} textures)")
    return {"output": f"public/assets/p0-derived/models/{name}/{name}.gltf.json", "files": [f"{name}.gltf.json"] + outputs,
            "bytes": total, "sha256": sha(open(out_json, "rb").read()), "source": "public/assets/" + rel, "sourceSha256": sha(raw),
            "operation": "lossless GLB → glTF JSON (geometry base64-embedded, textures extracted byte-identical)",
            "license": "inherits source (see asset-index.json)"}


if __name__ == "__main__":
    idx_path = os.path.join(A, "p0-derived", "derived-index.json")
    idx = json.load(open(idx_path)) if os.path.exists(idx_path) else {"derived": []}
    for rel in sys.argv[1:]:
        rec = convert(rel)
        idx["derived"] = [d for d in idx["derived"] if d["output"] != rec["output"]] + [rec]
    json.dump(idx, open(idx_path, "w"), indent=2)
