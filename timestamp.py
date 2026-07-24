#!/usr/bin/env python3
"""
timestamp.py — thin root wrapper for the shared timestamp helper.

Keeps the documented `python3 timestamp.py` entrypoint stable while the
implementation lives under server_tools/scripts/.
"""

from pathlib import Path
import runpy


if __name__ == "__main__":
    script_path = Path(__file__).resolve().parent / "server_tools" / "scripts" / "timestamp.py"
    runpy.run_path(str(script_path), run_name="__main__")
