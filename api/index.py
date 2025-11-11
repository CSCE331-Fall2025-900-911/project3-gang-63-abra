"""Vercel serverless entrypoint for the Flask backend."""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure the backend package is importable when running on Vercel
ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import app  # noqa: E402  pylint: disable=wrong-import-position

# Vercel looks for a top-level `app` callable.
# The imported Flask instance from backend/app.py already satisfies this.
