#!/bin/bash
# =============================================================================
# PNEUOMA AI — One-command setup and deploy to GCP Cloud Run
#
# Usage:
#   ./setup.sh
#
# Prerequisites:
#   - gcloud CLI installed and authenticated (run: gcloud auth login)
#   - A Hugging Face account with access to meta-llama/Llama-3.1-8B-Instruct
#     (accept the license at https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct)
#   - A Hugging Face access token (https://huggingface.co/settings/tokens)
# =============================================================================
set -e

PROJECT_ID="pilotengine"
REGION="us-central1"
SERVICE_NAME="pneuoma-ai"
REPO_NAME="pneuoma"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║       PNEUOMA AI — Setup & Deploy        ║"
echo "  ║   Self-hosted AI for school-safe apps    ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Project:  ${PROJECT_ID}"
echo "  Region:   ${REGION}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 1: Collect secrets upfront
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Step 1/6: Collect credentials ───"
echo ""

# Generate a random API key for the PNEUOMA AI service
API_KEY="pneuoma-$(openssl rand -hex 24)"
echo "  Generated PNEUOMA AI API key."

# Prompt for Hugging Face token
echo ""
echo "  You need a Hugging Face token to download Llama 3.1."
echo "  Get one at: https://huggingface.co/settings/tokens"
echo ""
read -sp "  Paste your Hugging Face token: " HF_TOKEN
echo ""

if [ -z "$HF_TOKEN" ]; then
  echo ""
  echo "  ERROR: Hugging Face token is required."
  echo "  Get one at https://huggingface.co/settings/tokens"
  exit 1
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 2: Enable GCP APIs
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Step 2/6: Enable GCP APIs ───"
echo ""

APIS=(
  "run.googleapis.com"
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
  "secretmanager.googleapis.com"
)

for api in "${APIS[@]}"; do
  echo "  Enabling ${api}..."
  gcloud services enable "${api}" --project "${PROJECT_ID}" --quiet
done
echo "  Done."
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 3: Create Artifact Registry repo (for Docker images)
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Step 3/6: Create Artifact Registry ───"
echo ""

if gcloud artifacts repositories describe "${REPO_NAME}" \
  --location="${REGION}" --project="${PROJECT_ID}" &>/dev/null; then
  echo "  Repository '${REPO_NAME}' already exists. Skipping."
else
  gcloud artifacts repositories create "${REPO_NAME}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --description="PNEUOMA container images" \
    --quiet
  echo "  Created repository '${REPO_NAME}'."
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 4: Store secrets in Secret Manager
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Step 4/6: Store secrets ───"
echo ""

create_or_update_secret() {
  local name=$1
  local value=$2
  if gcloud secrets describe "${name}" --project="${PROJECT_ID}" &>/dev/null; then
    echo -n "${value}" | gcloud secrets versions add "${name}" \
      --data-file=- --project="${PROJECT_ID}" --quiet
    echo "  Updated secret '${name}'."
  else
    echo -n "${value}" | gcloud secrets create "${name}" \
      --data-file=- --project="${PROJECT_ID}" \
      --replication-policy="automatic" --quiet
    echo "  Created secret '${name}'."
  fi
}

create_or_update_secret "pneuoma-api-keys" "${API_KEY}"
create_or_update_secret "hf-token" "${HF_TOKEN}"

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for secret in "pneuoma-api-keys" "hf-token"; do
  gcloud secrets add-iam-policy-binding "${secret}" \
    --member="serviceAccount:${SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="${PROJECT_ID}" --quiet &>/dev/null
done
echo "  Granted Cloud Run access to secrets."
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 5: Build container image
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Step 5/6: Build container image ───"
echo "  This may take 10-15 minutes on first build..."
echo ""

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet 2>/dev/null

gcloud builds submit \
  --tag "${IMAGE}" \
  --project "${PROJECT_ID}" \
  --timeout=1800 \
  --machine-type=e2-highcpu-8

echo ""
echo "  Build complete."
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Step 6: Deploy to Cloud Run with GPU
# ─────────────────────────────────────────────────────────────────────────────
echo "─── Step 6/6: Deploy to Cloud Run ───"
echo ""

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --gpu 1 \
  --gpu-type nvidia-l4 \
  --cpu 8 \
  --memory 32Gi \
  --max-instances 3 \
  --min-instances 0 \
  --port 8000 \
  --timeout 300 \
  --set-env-vars "WHISPER_MODEL=large-v3,WHISPER_DEVICE=cuda,WHISPER_COMPUTE_TYPE=float16,LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct,VLLM_BASE_URL=http://localhost:8001/v1" \
  --set-secrets "PNEUOMA_API_KEYS=pneuoma-api-keys:latest,HUGGING_FACE_HUB_TOKEN=hf-token:latest" \
  --no-allow-unauthenticated \
  --quiet

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format 'value(status.url)')

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║          Deployment Complete!            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Service URL:  ${SERVICE_URL}"
echo "  API Key:      ${API_KEY}"
echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  SAVE THESE VALUES — you'll need them   │"
echo "  │  for your app's .env file:              │"
echo "  │                                         │"
echo "  │  PNEUOMA_AI_URL=${SERVICE_URL}"
echo "  │  PNEUOMA_AI_KEY=${API_KEY}"
echo "  │                                         │"
echo "  └─────────────────────────────────────────┘"
echo ""
echo "  Test it:"
echo "  curl -H 'X-API-Key: ${API_KEY}' ${SERVICE_URL}/health"
echo ""
