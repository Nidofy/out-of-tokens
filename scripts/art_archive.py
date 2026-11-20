"""Shared bookkeeping for deterministic art exports and isolated verification builds."""
import argparse
import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]


def digest(data):
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def record(root, relative):
    return {"file": relative.as_posix(), **digest((root / relative).read_bytes())}


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes((json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode())


def publish(export, *, finalize=None):
    parser = argparse.ArgumentParser(description=export.__doc__)
    parser.add_argument("--output-root", type=Path, default=ROOT)
    target = parser.parse_args().output_root
    with TemporaryDirectory() as temp:
        stage = Path(temp)
        export(stage)
        if finalize:
            finalize(stage, target)
        # Finish decoding and validating every file before publishing any of them.
        for src in sorted(p for p in stage.rglob("*") if p.is_file()):
            dest = target / src.relative_to(stage)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(src.read_bytes())
