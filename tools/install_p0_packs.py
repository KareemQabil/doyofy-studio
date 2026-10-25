#!/usr/bin/env python3
"""
Install the P0 production asset packs into public/assets/p0/ and (re)write the provenance indexes.

    python3 tools/install_p0_packs.py \
        /path/to/invite-engine-p0-pack-a1-3d-hdri-pbr.zip \
        /path/to/invite-engine-p0-pack-a2-images-audio-canva.zip \
        /path/to/invite-engine-p0-pack-b-video.zip

Then:  npm run assets:check   (expects present 63/63, required missing 0, READY)

What it does
  * extracts each pack's  production/p0-mediterranean/<kind>/...  into  public/assets/p0/<kind>/...
  * verifies every file against the byte count in the pack's P0_PACK_*_MANIFEST.json
  * computes sha256 for every file
  * writes asset-index.json and license-index.json at the project root from the manifests plus
    tools/p0_provenance.json (licences / authors / verification status traced during the audit)

Nothing is downloaded. Assets that are not in a supplied pack are reported missing, never faked.
"""
import hashlib, json, os, shutil, sys, zipfile, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST = os.path.join(ROOT, "public", "assets", "p0")
PREFIX = "production/p0-mediterranean/"
PROV = json.load(open(os.path.join(ROOT, "tools", "p0_provenance.json"), encoding="utf-8"))


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def local_path(pack_file):
    assert pack_file.startswith(PREFIX), pack_file
    return "p0/" + pack_file[len(PREFIX):]


def install(zips):
    entries, problems = [], []
    for z in zips:
        with zipfile.ZipFile(z) as zf:
            manifest_name = next(n for n in zf.namelist() if n.startswith("P0_PACK_") and n.endswith(".json"))
            manifest = json.loads(zf.read(manifest_name))
            pack = manifest_name[len("P0_PACK_"):-len("_MANIFEST.json")]
            for a in manifest["assets"]:
                rel = local_path(a["file"])
                out = os.path.join(ROOT, "public", "assets", rel)
                os.makedirs(os.path.dirname(out), exist_ok=True)
                with zf.open(a["file"]) as src, open(out, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                size = os.path.getsize(out)
                if "bytes" in a and size != a["bytes"]:
                    problems.append(f"{rel}: {size} bytes, manifest says {a['bytes']}")
                entries.append({"pack": pack, "packCreatedAt": manifest.get("createdAt"), "manifest": a, "local": rel, "bytes": size, "sha256": sha256(out)})
            print(f"[p0] {os.path.basename(z)}: {len(manifest['assets'])} files ({pack})")
    return entries, problems


def build_indexes(entries):
    # Group PBR maps into one logical asset per material set; every other file is one logical asset.
    logical = {}
    for e in entries:
        m = e["manifest"]
        key = ("pbr:" + m["id"]) if m["type"] == "pbr-map" else (m["type"] + ":" + m["id"])
        logical.setdefault(key, []).append(e)

    assets, licenses = [], {}
    for key, files in sorted(logical.items()):
        first = files[0]["manifest"]
        kind = {"glb": "model", "hdri": "hdri", "pbr-map": "pbr", "video": "video", "image": "image", "audio": "audio", "canva-design": "canva"}[first["type"]]
        prov = PROV["byId"].get(first["id"]) or PROV["byKind"][kind]
        src = first.get("source") or prov.get("sourceTemplate", "").format(sourceId=first.get("sourceId", first["id"]))
        rec = {
            "id": first["id"], "kind": kind, "pack": files[0]["pack"],
            "provider": prov["provider"], "license": prov["license"], "licenseUrl": prov.get("licenseUrl"),
            "author": prov.get("author", "not recorded in pack manifest — verify on source page"),
            "attributionRequired": prov.get("attributionRequired", False),
            "licenseVerification": prov.get("verification", "pending"),
            "source": src, "sourceId": first.get("sourceId"),
            "downloadDate": (files[0]["packCreatedAt"] or "")[:10],
            "modifications": prov.get("modifications", "none recorded"),
            "notes": prov.get("notes"),
            "canonical": prov.get("canonical", True),
            "files": [{"path": "public/assets/" + f["local"], "bytes": f["bytes"], "sha256": f["sha256"],
                       **({"slot": f["manifest"].get("slot"), "md5Source": f["manifest"].get("md5")} if kind == "pbr" else {})} for f in files],
            "usedBy": PROV.get("usedBy", {}).get(first["id"], []),
        }
        assets.append(rec)
        lic = licenses.setdefault(rec["license"], {"license": rec["license"], "url": rec["licenseUrl"], "attributionRequired": rec["attributionRequired"], "assets": []})
        lic["assets"].append(rec["id"])

    expected = PROV["expected"]
    present = len(assets)
    index = {
        "generated": datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "expectedLogicalAssets": expected["total"], "presentLogicalAssets": present,
        "byKind": {k: sum(1 for a in assets if a["kind"] == k) for k in expected["byKind"]},
        "expectedByKind": expected["byKind"],
        "assets": assets,
    }
    json.dump(index, open(os.path.join(ROOT, "asset-index.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    json.dump({"generated": index["generated"], "licenses": list(licenses.values()), "rejected": PROV.get("rejected", [])},
              open(os.path.join(ROOT, "license-index.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    return index


if __name__ == "__main__":
    zips = sys.argv[1:]
    if not zips:
        print(__doc__); sys.exit(1)
    missing = [z for z in zips if not os.path.exists(z)]
    if missing:
        print("[p0] not found:", *missing, sep="\n  "); sys.exit(1)
    entries, problems = install(zips)
    index = build_indexes(entries)
    print(f"[p0] logical assets {index['presentLogicalAssets']}/{index['expectedLogicalAssets']}  by kind {index['byKind']}")
    for p in problems:
        print("[p0] SIZE MISMATCH", p)
    print("[p0] wrote asset-index.json, license-index.json — run `npm run assets:check`")
    sys.exit(1 if problems else 0)
