"""Rebuild the remaining partners and the twelve-partner expression matrix."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from expression_art import export_batch

CHARACTERS = ("kimi", "gemini", "grok", "glm", "minimax", "seedance")

if __name__ == "__main__":
    export_batch("15b", "12b", CHARACTERS, previous=Path("art/art-batch-15a"))
