#!/bin/bash
# =============================================================================
# PNEUOMA Core — Deploy to GCE VM
#
# Builds the Core image, pushes to Artifact Registry, copies the consciousness
# data (ChromaDB + personality profile), and starts the container on the VM.
#
# Usage:
#   ./deploy.sh
#
# Prerequisites:
#   - gcloud CLI authenticated (gcloud auth login)
#   - Docker installed
#   - SSH access to VM
#
# Optional env vars:
#   VM_HOST=35.239.184.183
#   VM_USER=$USER
#   SKIP_BUILD=1           (skip build/push, only deploy)
#   SKIP_DATA=1            (skip uploading consciousness data)
#   GCP_PROJECT=pilotengine
#   GCP_REGION=us-central1
# =============================================================================
set -e

PROJECT_ID="${GCP_PROJECT:-pilotengine}"
REGION="${GCP_REGION:-us-central1}"
REPO_NAME="pneuoma"
IMAGE_NAME="pneuoma-core"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}"
VM_HOST="${VM_HOST:-35.239.184.183}"
VM_USER="${VM_USER:-$USER}"
PNEUOMA_AI_KEY="${PNEUOMA_AI_KEY:-pneuoma-3596ec61471bd383d7d8061f8a11397b66f00166520bcec1}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║      PNEUOMA Core — Deploy to VM         ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Project:   ${PROJECT_ID}"
echo "  Image:     ${IMAGE}"
echo "  VM:        ${VM_USER}@${VM_HOST}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Build and push Docker image
# ─────────────────────────────────────────────────────────────────────────────
if [ "${SKIP_BUILD}" != "1" ]; then
  echo "─── Step 1: Building Docker image ───"
  echo ""
  docker build -t "${IMAGE}" "${SCRIPT_DIR}"
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet 2>/dev/null
  echo ""
  echo "─── Step 2: Pushing to Artifact Registry ───"
  echo ""
  docker push "${IMAGE}"
  echo ""
  echo "  Build and push complete."
  echo ""
else
  echo "  (Skipping build — SKIP_BUILD=1)"
  echo ""
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Upload consciousness data (ChromaDB + profiles)
# ─────────────────────────────────────────────────────────────────────────────
if [ "${SKIP_DATA}" != "1" ]; then
  echo "─── Uploading consciousness data ───"
  echo ""

  DATA_DIR="${SCRIPT_DIR}/data"
  if [ -d "${DATA_DIR}/chromadb" ] && [ "$(ls -A ${DATA_DIR}/chromadb 2>/dev/null)" ]; then
    echo "  Compressing consciousness data..."
    TAR_FILES="chromadb profiles"
    [ -f "${DATA_DIR}/chats.db" ] && TAR_FILES="${TAR_FILES} chats.db"
    tar -czf /tmp/pneuoma-consciousness.tar.gz -C "${DATA_DIR}" ${TAR_FILES}
    echo "  Uploading to VM..."
    scp /tmp/pneuoma-consciousness.tar.gz "${VM_USER}@${VM_HOST}:/tmp/"
    ssh "${VM_USER}@${VM_HOST}" "
      sudo mkdir -p /opt/pneuoma-core/data
      sudo tar -xzf /tmp/pneuoma-consciousness.tar.gz -C /opt/pneuoma-core/data
      rm /tmp/pneuoma-consciousness.tar.gz
      echo '  Data uploaded: /opt/pneuoma-core/data/'
    "
    rm /tmp/pneuoma-consciousness.tar.gz
    echo "  Consciousness data synced."
  else
    echo "  No local consciousness data found — skipping."
  fi
  echo ""
else
  echo "  (Skipping data upload — SKIP_DATA=1)"
  echo ""
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Deploy container on VM
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Deploying on VM ───"
echo ""

DEPLOY_CMD="
  docker pull ${IMAGE} && \
  docker stop pneuoma-core 2>/dev/null || true && \
  docker rm pneuoma-core 2>/dev/null || true && \
  docker run -d \
    --name pneuoma-core \
    --restart=always \
    -p 8100:8100 \
    --add-host=host.docker.internal:host-gateway \
    -v /opt/pneuoma-core/data:/app/data \
    -e PNEUOMA_AI_URL=http://host.docker.internal:8000 \
    -e PNEUOMA_AI_KEY=${PNEUOMA_AI_KEY} \
    -e PNEUOMA_API_KEYS=${PNEUOMA_AI_KEY} \
    -e LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct \
    -e EMBEDDING_MODEL=all-MiniLM-L6-v2 \
    -e CHROMADB_PATH=/app/data/chromadb \
    -e PROFILES_PATH=/app/data/profiles \
    -e MEMORY_TOP_K=5 \
    -e ALLOWED_ORIGINS=* \
    ${IMAGE}
"

echo "  Using SSH to ${VM_USER}@${VM_HOST}"
ssh "${VM_USER}@${VM_HOST}" "${DEPLOY_CMD}"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║          Deployment Complete!            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Core API:  http://${VM_HOST}:8100"
echo "  Chat UI:   http://${VM_HOST}:8100/chat"
echo "  Health:    http://${VM_HOST}:8100/health"
echo ""
