import hashlib
import json
import os
from pathlib import Path

CACHE_DIR = Path(__file__).parent / "cache"


def _ensure_dir():
    CACHE_DIR.mkdir(exist_ok=True)


def _key(prompt: str, system: str = "") -> str:
    raw = json.dumps({"prompt": prompt, "system": system}, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()


def get(prompt: str, system: str = "") -> str | None:
    """Return cached response if it exists, else None."""
    _ensure_dir()
    k = _key(prompt, system)
    f = CACHE_DIR / f"{k}.txt"
    if f.exists():
        return f.read_text()
    return None


def put(prompt: str, system: str, response: str) -> None:
    """Store a response in the cache."""
    _ensure_dir()
    k = _key(prompt, system)
    f = CACHE_DIR / f"{k}.txt"
    f.write_text(response)
