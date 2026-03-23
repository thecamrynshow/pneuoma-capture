#!/bin/bash
# Deploy PNEUOMA AI to Google Cloud Run with GPU
set -e

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="pneuoma-ai"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "==> Building container image..."
gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}"

echo "==> Deploying to Cloud Run with L4 GPU..."
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
  --set-env-vars "WHISPER_MODEL=large-v3,WHISPER_DEVICE=cuda,WHISPER_COMPUTE_TYPE=float16" \
  --set-secrets "PNEUOMA_API_KEYS=pneuoma-api-keys:latest,HUGGING_FACE_HUB_TOKEN=hf-token:latest" \
  --no-allow-unauthenticated

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --format 'value(status.url)')

echo ""
echo "==> Deployed successfully!"
echo "    Service URL: ${SERVICE_URL}"
echo ""
echo "Before your first deploy, create the required secrets:"
echo "  gcloud secrets create pneuoma-api-keys --data-file=- <<< 'your-key'"
echo "  gcloud secrets create hf-token --data-file=- <<< 'your-hf-token'"
