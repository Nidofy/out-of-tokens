"""Export the final Phase 3 cohort with Batch 10A's existing pixel and rig rules."""
from importlib import import_module
import json
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image

phase3 = import_module("export-art-batch10a")
BATCH = phase3.ROOT / "art/art-batch-10b"
REVIEW = BATCH / "review"
PREVIOUS = ("bluewhale", "qwen", "llama", "mistral", "gpt", "claude")
MOTION = {
    "kimi": (0.98, 9, 3.0, 0.05, 0.023),
    "gemini": (1.04, 10, 3.25, 0.058, 0.025),
    "grok": (1.06, 10.5, 3.35, 0.06, 0.026),
    "glm": (0.94, 8, 2.8, 0.045, 0.021),
    "minimax": (1.02, 9.5, 3.15, 0.055, 0.025),
    "seedance": (1.05, 10, 3.3, 0.058, 0.025),
}


def lineup(previous, current):
    # Use the same 512 px coordinate system, guide positions and panel scale on both rows.
    with TemporaryDirectory() as directory:
        paths = [Path(directory) / name for name in ("first.png", "last.png")]
        phase3.review_sheet("All 12 studio partners   /   1 of 2", previous, paths[0])
        phase3.review_sheet("All 12 studio partners   /   2 of 2", current, paths[1])
        with Image.open(paths[0]) as top, Image.open(paths[1]) as bottom:
            assert top.size == bottom.size
            sheet = Image.new("RGB", (top.width, top.height * 2))
            sheet.paste(top, (0, 0))
            sheet.paste(bottom, (0, top.height))
            sheet.save(REVIEW / "all-12-lineup.png")


def main():
    # Configure the imported exporter's destination and profiles before writing any files.
    phase3.BATCH = BATCH
    phase3.MOTION = MOTION
    jobs = json.loads((BATCH / "generation.json").read_bytes())
    assert set(jobs) == set(MOTION)
    previous = []
    for character in PREVIOUS:
        with Image.open(phase3.CHARACTERS / character / "stand_3q.webp") as image:
            previous.append((character, image.convert("RGBA"), False))

    entries, current = [], []
    notes = ["# Art-Batch 10B generation record", "",
             "All masters are untouched transparent PNGs from the built-in image_gen tool. "
             "The tool did not report a backend model identifier. Every selected reference is pinned by SHA256.",
             "", "Masters retain original alpha. The master ink check uses alpha ≥ 14. "
             "Decoded runtime WebPs must have zero pure black pixels at every nonzero alpha.", ""]
    for character in MOTION:
        standing = phase3.export_character(character, jobs, entries, notes)
        current.append((character, standing, False))
    phase3.review_sheet("Art-Batch 10B   /   standing lineup", [previous[0], *current], REVIEW / "batch10b-overview.png")
    lineup(previous, current)
    notes.extend(["## Visual review of the selected artwork", "",
                  "The six individual sheets, the bluewhale comparison and both rows of the final lineup "
                  "were reviewed. All rear poses turn to the right with the face turned away. Both hands "
                  "in every typing pose clear the red desktop guide. Hair, ears, bags, ribbons, tails "
                  "and Seedance's halo remain identifiable across the relevant views. The review found "
                  "no cropped limbs, painted floor shadows, furniture or visible white edge halos.", ""])
    phase3.phase1["save_json"](BATCH / "manifest.json", entries)
    (BATCH / "PROMPTS.md").write_text("\n".join(notes).rstrip() + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
