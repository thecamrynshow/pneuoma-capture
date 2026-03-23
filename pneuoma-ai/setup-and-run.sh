#!/bin/bash
# One-shot setup and run for PNEUOMA AI
set -e

cd "$(dirname "$0")"

echo "=== Creating venv (if needed) ==="
python3 -m venv .venv

echo "=== Installing dependencies ==="
.venv/bin/pip install -q --upgrade pip
.venv/bin/pip install -q -r requirements.txt

echo "=== Starting PNEUOMA AI on http://localhost:8000 ==="
echo "  Health: http://localhost:8000/health"
echo "  Docs:   http://localhost:8000/docs"
echo ""
WHISPER_DEVICE=cpu WHISPER_COMPUTE_TYPE=int8 WHISPER_MODEL=tiny \
  .venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
