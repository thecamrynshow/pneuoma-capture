#!/bin/bash
# Backup ChromaDB + chats. In-house, local by default. Optional GCS upload.
#
# Usage:
#   ./backup.sh                    # backup to ./backups/
#   ./backup.sh /path/to/dest       # backup to custom path
#   GCS_BUCKET=my-bucket ./backup.sh  # also upload to Google Cloud Storage
#
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="${DATA_DIR:-${SCRIPT_DIR}/data}"
BACKUP_ROOT="${1:-${SCRIPT_DIR}/backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/pneuoma-core-${TIMESTAMP}"

echo "=== PNEUOMA Core Backup ==="
echo "  Source:  ${DATA_DIR}"
echo "  Dest:    ${BACKUP_DIR}"
echo ""

mkdir -p "${BACKUP_DIR}"

# ChromaDB
if [ -d "${DATA_DIR}/chromadb" ]; then
  echo "  Backing up chromadb/..."
  cp -a "${DATA_DIR}/chromadb" "${BACKUP_DIR}/"
else
  echo "  (no chromadb/ found)"
fi

# Chats DB
if [ -f "${DATA_DIR}/chats.db" ]; then
  echo "  Backing up chats.db..."
  cp -a "${DATA_DIR}/chats.db" "${BACKUP_DIR}/"
else
  echo "  (no chats.db found)"
fi

# Profiles
if [ -d "${DATA_DIR}/profiles" ]; then
  echo "  Backing up profiles/..."
  cp -a "${DATA_DIR}/profiles" "${BACKUP_DIR}/"
else
  echo "  (no profiles/ found)"
fi

# Compress
ARCHIVE="${BACKUP_DIR}.tar.gz"
tar -czf "${ARCHIVE}" -C "${BACKUP_ROOT}" "$(basename "${BACKUP_DIR}")"
rm -rf "${BACKUP_DIR}"
echo ""
echo "  Created: ${ARCHIVE}"
echo ""

# Optional GCS upload
if [ -n "${GCS_BUCKET}" ]; then
  if command -v gsutil &>/dev/null; then
    echo "  Uploading to gs://${GCS_BUCKET}/..."
    gsutil cp "${ARCHIVE}" "gs://${GCS_BUCKET}/pneuoma-core-backups/$(basename "${ARCHIVE}")"
    echo "  Done."
  else
    echo "  GCS_BUCKET set but gsutil not found. Install Google Cloud SDK."
  fi
fi

echo ""
echo "  Backup complete."
