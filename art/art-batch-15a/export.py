"""Rebuild the first six partners' localized expression cels."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from expression_art import export_batch

CHARACTERS = ("bluewhale", "qwen", "llama", "mistral", "gpt", "claude")

if __name__ == "__main__":
    export_batch("15a", "12a", CHARACTERS)
