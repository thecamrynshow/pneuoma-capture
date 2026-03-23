#!/bin/bash
# =============================================================================
# PNEUOMA Capture — Deploy to GCE VM
#
# Builds the Next.js app, pushes the Docker image to Artifact Registry,
# and restarts the Capture container on the VM at 35.239.184.183.
#
# Usage:
#   ./deploy.sh
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (gcloud auth login)
#   - Docker installed
#   - SSH access to the VM (your public key in GCE metadata, or use
#     gcloud compute ssh if the instance is in project pilotengine)
#
# Optional env vars:
#   VM_HOST=35.239.184.183   (default)
#   VM_USER=your_username    (default: $USER or the user from gcloud config)
#   VM_INSTANCE, VM_ZONE     (for gcloud compute ssh)
#   SKIP_BUILD=1             (skip build/push, only deploy to VM)
#   GCP_PROJECT=pilotengine
#   GCP_REGION=us-central1
# =============================================================================
set -e

PROJECT_ID="${GCP_PROJECT:-pilotengine}"
REGION="${GCP_REGION:-us-central1}"
REPO_NAME="pneuoma"
IMAGE_NAME="pneuoma-capture"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}"
VM_HOST="${VM_HOST:-35.239.184.183}"
VM_USER="${VM_USER:-$USER}"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     PNEUOMA Capture — Deploy to VM      ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Project:   ${PROJECT_ID}"
echo "  Image:     ${IMAGE}"
echo "  VM:        ${VM_USER}@${VM_HOST}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Build Docker image (skip if SKIP_BUILD=1)
# ─────────────────────────────────────────────────────────────────────────────
if [ "${SKIP_BUILD}" != "1" ]; then
echo "─── Step 1/3: Building Docker image ───"
echo ""

if command -v docker &>/dev/null; then
  docker build -t "${IMAGE}" .
  gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet 2>/dev/null
  echo ""
  echo "─── Step 2/3: Pushing to Artifact Registry ───"
  echo ""
  docker push "${IMAGE}"
else
  echo "  (Docker not found — using Cloud Build)"
  gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}" --timeout=1200
fi

echo ""
echo "  Build and push complete."
echo ""
else
  echo "  (Skipping build — SKIP_BUILD=1)"
  echo ""
fi

# ─────────────────────────────────────────────────────────────────────────────
# Step 2 (or 3): Deploy on VM (pull + restart)
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Deploying on VM ───"
echo ""

# Deploy on VM: pull image, restart container
# Use VM_INSTANCE + VM_ZONE for gcloud compute ssh, or VM_HOST + VM_USER for direct SSH
PNEUOMA_AI_KEY="${PNEUOMA_AI_KEY:-pneuoma-3596ec61471bd383d7d8061f8a11397b66f00166520bcec1}"
# Set NEXTAUTH_SECRET before deploy for production (e.g. openssl rand -base64 32)
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-pneuoma-capture-auth-secret-change-in-production}"
NEXTAUTH_URL="${NEXTAUTH_URL:-https://capture.pneuoma.com}"
# Use host.docker.internal so Capture container can reach PNEUOMA AI on host port 8000
# Stop pneuoma-capture, pneuoma-web (legacy name), and any container on port 3000
DEPLOY_CMD="docker pull ${IMAGE} && docker stop pneuoma-capture pneuoma-web 2>/dev/null || true; docker rm pneuoma-capture pneuoma-web 2>/dev/null || true; for id in \$(docker ps -q --filter 'publish=3000'); do docker stop \$id; done 2>/dev/null || true; docker run -d --name pneuoma-capture --restart=always -p 3000:3000 --add-host=host.docker.internal:host-gateway -e DATABASE_URL=file:./prod.db -e PNEUOMA_AI_URL=http://host.docker.internal:8000 -e PNEUOMA_AI_KEY=${PNEUOMA_AI_KEY} -e NEXTAUTH_SECRET=${NEXTAUTH_SECRET} -e NEXTAUTH_URL=${NEXTAUTH_URL} ${IMAGE}"

if [ -n "${VM_INSTANCE}" ] && [ -n "${VM_ZONE}" ]; then
  echo "  Using gcloud compute ssh (instance: ${VM_INSTANCE})"
  gcloud compute ssh "${VM_INSTANCE}" --zone="${VM_ZONE}" --project="${PROJECT_ID}" --command="${DEPLOY_CMD}"
else
  echo "  Using SSH to ${VM_USER}@${VM_HOST}"
  echo "  (Set VM_INSTANCE and VM_ZONE to use gcloud compute ssh instead)"
  ssh "${VM_USER}@${VM_HOST}" "${DEPLOY_CMD}"
fi

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║          Deployment Complete!            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Capture is live at: http://${VM_HOST}:3000"
echo "  TestFlight will load the restored features on next app launch."
echo ""
