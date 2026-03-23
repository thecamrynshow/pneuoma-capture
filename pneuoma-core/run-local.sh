#!/bin/bash
# Run PNEUOMA Core — points at PNEUOMA AI (run pneuoma-ai first)

set -e
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  echo "Creating venv..."
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  source .venv/bin/activate
fi

# Load .env if present (paths, keys)
[ -f .env ] && set -a && source .env && set +a

# Default: local PNEUOMA AI. Override with PNEUOMA_AI_URL for cloud.
export PNEUOMA_AI_URL="${PNEUOMA_AI_URL:-http://localhost:8000}"

echo "Starting PNEUOMA Core on http://localhost:8100 (→ PNEUOMA AI at $PNEUOMA_AI_URL)"
echo "Chat UI: http://localhost:8100/chat"
exec uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
