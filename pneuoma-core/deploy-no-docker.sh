#!/bin/bash
# Deploy PNEUOMA Core without local Docker — uses Cloud Build to build the image.
#
# Prerequisites: gcloud CLI, SSH access to VM
# Usage: ./deploy-no-docker.sh
#
set -e

PROJECT_ID="${GCP_PROJECT:-pilotengine}"
REGION="${GCP_REGION:-us-central1}"
REPO_NAME="pneuoma"
IMAGE_NAME="pneuoma-core"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}"
VM_HOST="${VM_HOST:-35.239.184.183}"
VM_USER="${VM_USER:-$USER}"
VM_INSTANCE="${VM_INSTANCE:-pneuoma-ai}"
VM_ZONE="${VM_ZONE:-us-central1-a}"
VM_DATA_DIR="${VM_DATA_DIR:-/mnt/stateful_partition/pneuoma-core/data}"
PNEUOMA_AI_KEY="${PNEUOMA_AI_KEY:-pneuoma-3596ec61471bd383d7d8061f8a11397b66f00166520bcec1}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   PNEUOMA Core — Deploy (no Docker)     ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Project:   ${PROJECT_ID}"
echo "  Image:     ${IMAGE}"
echo "  VM:        ${VM_USER}@${VM_HOST}"
echo ""

# Step 1: Build with Cloud Build (skip with SKIP_BUILD=1)
if [ "${SKIP_BUILD}" != "1" ]; then
  echo "─── Step 1: Building image with Cloud Build ───"
  gcloud builds submit --tag "${IMAGE}" "${SCRIPT_DIR}" --project "${PROJECT_ID}"
  echo ""
else
  echo "  (Skipping build — SKIP_BUILD=1)"
  echo ""
fi

# Step 2: Upload consciousness data
if [ "${SKIP_DATA}" != "1" ]; then
  echo "─── Step 2: Uploading consciousness data ───"
  DATA_DIR="${SCRIPT_DIR}/data"
  if [ -d "${DATA_DIR}/chromadb" ] && [ "$(ls -A ${DATA_DIR}/chromadb 2>/dev/null)" ]; then
    TAR_FILES="chromadb profiles"
    [ -f "${DATA_DIR}/chats.db" ] && TAR_FILES="${TAR_FILES} chats.db"
    tar -czf /tmp/pneuoma-consciousness.tar.gz -C "${DATA_DIR}" ${TAR_FILES}
    gcloud compute scp /tmp/pneuoma-consciousness.tar.gz "${VM_INSTANCE}:/tmp/" --zone="${VM_ZONE}" --project="${PROJECT_ID}"
    gcloud compute ssh "${VM_INSTANCE}" --zone="${VM_ZONE}" --project="${PROJECT_ID}" --command="
      mkdir -p ${VM_DATA_DIR}
      tar -xzf /tmp/pneuoma-consciousness.tar.gz -C ${VM_DATA_DIR}
      rm /tmp/pneuoma-consciousness.tar.gz
      echo '  Data uploaded.'
    "
    rm /tmp/pneuoma-consciousness.tar.gz
  else
    echo "  No local consciousness data — skipping."
  fi
  echo ""
else
  echo "  (Skipping data — SKIP_DATA=1)"
  echo ""
fi

# Step 3: Deploy container
echo "─── Step 3: Deploying on VM ───"
DEPLOY_CMD="
  docker pull ${IMAGE} && \
  docker stop pneuoma-core 2>/dev/null || true && \
  docker rm pneuoma-core 2>/dev/null || true && \
  docker run -d \
    --name pneuoma-core \
    --restart=always \
    -p 8100:8100 \
    --add-host=host.docker.internal:host-gateway \
    -v ${VM_DATA_DIR}:/app/data \
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
gcloud compute ssh "${VM_INSTANCE}" --zone="${VM_ZONE}" --project="${PROJECT_ID}" --command="${DEPLOY_CMD}"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║          Deployment Complete!            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Chat UI:   http://${VM_HOST}:8100/chat"
echo "  Health:    http://${VM_HOST}:8100/health"
echo ""
