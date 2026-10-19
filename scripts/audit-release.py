#!/usr/bin/env python3
"""Fail closed on unexpected public files; never print matched content."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tarfile

root = Path(__file__).resolve().parent.parent
allowed = {
    '.gitignore', 'LICENSE', 'README.md', 'CHANGELOG.md', 'package.json', 'package-lock.json',
    'client.js', 'cordis.patch.yml', 'src/aggregate.mjs', 'src/collect.mjs', 'src/host.mjs',
    'scripts/installed.sh', 'scripts/audit-release.py',
    'test/aggregate.test.mjs', 'test/collect.test.mjs', 'test/client.test.mjs',
    'test/installed.test.mjs', 'test/native-render.test.mjs', 'test/release.test.mjs',
    'examples/synthetic-events.json',
}
ignored = {'node_modules', 'graphify-out', '.git'}
actual = {p.relative_to(root).as_posix() for p in root.rglob('*')
          if p.is_file() and not (set(p.relative_to(root).parts) & ignored)
          and p.suffix != '.tgz'}
assert actual == allowed, f'Unexpected/missing files: {sorted(actual ^ allowed)}'
rules = {
    'personal-home': re.compile(rb'/(?:Users|home)/[^/\s\x27\x22]+/'),
    'private-key': re.compile(rb'-----BEGIN [A-Z ]*PRIVATE KEY-----'),
    'credential-prefix': re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{24,})'),
    'uuid-record': re.compile(rb'\b[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\b', re.I),
}
for name in sorted(actual):
    p = root / name
    assert not p.is_symlink(), f'Symlink forbidden: {name}'
    data = p.read_bytes()
    for rule, pattern in rules.items():
        assert not pattern.search(data), f'Privacy scan failed: {rule} in {name}'
manifest = json.loads(subprocess.check_output(
    ['npm', 'pack', '--dry-run', '--json', '--ignore-scripts'], cwd=root))[0]
expected_pack = {'LICENSE','README.md','CHANGELOG.md','package.json','client.js','cordis.patch.yml',
                 'src/aggregate.mjs','src/collect.mjs','src/host.mjs','examples/synthetic-events.json'}
assert {f['path'] for f in manifest['files']} == expected_pack
assert manifest['bundled'] == []
for archive in root.glob('*.tgz'):
    with tarfile.open(archive) as tar:
        names = {m.name.removeprefix('package/') for m in tar.getmembers() if m.isfile()}
        assert names == expected_pack, 'Archive contents differ'
        assert all(m.isfile() or m.isdir() for m in tar.getmembers()), 'Archive link forbidden'
        for member in tar.getmembers():
            if member.isfile():
                name = member.name.removeprefix('package/')
                assert tar.extractfile(member).read() == (root / name).read_bytes(), f'Stale archive file: {name}'
    print(archive.name, 'sha256', hashlib.sha256(archive.read_bytes()).hexdigest())
print(json.dumps({'public_source_files':len(actual), 'package_files':manifest['entryCount'],
                  'privacy_rules_passed':list(rules), 'bundled_dependencies':manifest['bundled']}))
