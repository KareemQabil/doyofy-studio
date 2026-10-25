#!/usr/bin/env python3
"""Verify the original exported snapshot before editing, without extra packages."""
from pathlib import Path
import hashlib
import json
import sys

root = Path(__file__).resolve().parent
current = root / 'INTEGRITY_MANIFEST.json'
if current.exists():
    manifest = json.loads(current.read_text(encoding='utf-8'))
    manifest['files'] = [dict(path=name, **entry) for name, entry in manifest['files'].items()]
else:
    manifest = json.loads((root / 'DELIVERY_MANIFEST.json').read_text(encoding='utf-8'))
failures = []
for item in manifest['files']:
    p = root / item['path']
    if not p.is_file():
        failures.append('missing: ' + item['path'])
        continue
    if p.stat().st_size != item['bytes'] or hashlib.sha256(p.read_bytes()).hexdigest() != item['sha256']:
        failures.append('changed: ' + item['path'])
if failures:
    print('\n'.join(failures))
    print('If you intentionally edited or rebuilt the project, hashes are expected to change.')
    sys.exit(1)
print(f"PASS: {len(manifest['files'])} files match the delivered snapshot.")
if 'source_commit' in manifest:
    print('Source commit: ' + manifest['source_commit'])
