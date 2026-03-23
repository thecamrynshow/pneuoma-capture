#!/bin/bash
# Ingest ChatGPT export from a local path into the deployed PNEUOMA Core.
#
# Usage: ./ingest-to-deployed.sh /path/to/export/dir
#
# Example: ./ingest-to-deployed.sh "/Users/camrynjackson/PNEUOMA/Legal/Data/3da6a2b2bb0f71940fffcd648eb1e9a9d1b928373b240c3f88b5e0fe41afc377-2026-03-11-14-42-53-d4c844f0d5774b928c3875915ece4d05"
#
set -e

DATA_DIR="${1:?Usage: $0 /path/to/export/dir}"
API_URL="${PNEUOMA_CORE_URL:-http://35.239.184.183:8100}"
API_KEY="${PNEUOMA_AI_KEY:-pneuoma-3596ec61471bd383d7d8061f8a11397b66f00166520bcec1}"

if [ ! -d "$DATA_DIR" ]; then
  echo "Error: Directory not found: $DATA_DIR"
  exit 1
fi

FILES=($(ls "$DATA_DIR"/conversations-*.json 2>/dev/null | sort))
if [ ${#FILES[@]} -eq 0 ]; then
  echo "Error: No conversations-*.json files in $DATA_DIR"
  exit 1
fi

echo "Ingesting ${#FILES[@]} files to $API_URL"
echo ""

total_convos=0
total_chunks=0

for i in "${!FILES[@]}"; do
  f="${FILES[$i]}"
  name=$(basename "$f")
  num=$((i + 1))
  echo "[$num/${#FILES[@]}] $name ..."
  res=$(curl -s -X POST "$API_URL/v1/ingest" \
    -H "X-API-Key: $API_KEY" \
    -F "file=@$f")
  convos=$(echo "$res" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('conversations_processed',0))" 2>/dev/null || echo "0")
  chunks=$(echo "$res" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('chunks_stored',0))" 2>/dev/null || echo "0")
  total_convos=$((total_convos + convos))
  total_chunks=$((total_chunks + chunks))
  echo "         → $convos conversations, $chunks chunks"
done

echo ""
echo "Done. Total: $total_convos conversations → $total_chunks memory chunks"
echo ""
echo "Verify: curl -s $API_URL/health -H \"X-API-Key: $API_KEY\""
