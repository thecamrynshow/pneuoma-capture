# PNEUOMA AI

Self-hosted AI service for PNEUOMA apps. Runs open-source models on your own infrastructure — no student data is sent to third-party AI providers.

> **Quick start:** `./setup-and-run.sh` — creates venv, installs deps, starts server. See **[../PNEUOMA_SYSTEM_GUIDE.md](../PNEUOMA_SYSTEM_GUIDE.md)** for full system docs.

## Models

| Capability | Model | Framework |
|------------|-------|-----------|
| Speech-to-text | Whisper large-v3 | faster-whisper (CTranslate2) |
| Text processing | Llama 3.1 8B Instruct | vLLM |

## API Endpoints

All endpoints require an `X-API-Key` header (unless auth is disabled for local dev).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/v1/transcribe` | Audio file → transcript text |
| `POST` | `/v1/parse` | Transcript → structured incident JSON |
| `POST` | `/v1/templates` | Incident data → communication templates |
| `POST` | `/v1/refine` | Incident + chat → refined incident |
| `POST` | `/v1/chat/completions` | Generic chat — OpenAI-compatible for any app |

### Chat completions (for PNEUOMA GPT, assistants, etc.)

```bash
curl -X POST "https://your-pneuoma-ai-url/v1/chat/completions" \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'
```

Returns an OpenAI-compatible response with `choices[0].message.content`.

## Local Development

Requires an NVIDIA GPU with Docker and the NVIDIA Container Toolkit.

```bash
cp .env.example .env
# Edit .env with your Hugging Face token and API key

docker compose up --build
```

The API will be available at `http://localhost:8000`. You can test with:

```bash
curl http://localhost:8000/health
```

For CPU-only local testing (Whisper only, no LLM), run the API directly:

```bash
pip install -r requirements.txt
WHISPER_DEVICE=cpu WHISPER_COMPUTE_TYPE=int8 WHISPER_MODEL=tiny \
  uvicorn app.main:app --reload
```

## Deploy to GCP Cloud Run

Prerequisites:
- Google Cloud project with billing enabled
- `gcloud` CLI authenticated
- GPU quota for Cloud Run in your region

```bash
export GCP_PROJECT_ID=your-project-id
export GCP_REGION=us-central1

# Create secrets (one-time)
echo -n "your-api-key" | gcloud secrets create pneuoma-api-keys --data-file=-
echo -n "hf_your_token" | gcloud secrets create hf-token --data-file=-

# Deploy
./deploy.sh
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PNEUOMA_API_KEYS` | Comma-separated valid API keys | _(none — auth disabled)_ |
| `WHISPER_MODEL` | Whisper model size | `large-v3` |
| `WHISPER_DEVICE` | `cuda` or `cpu` | `cuda` |
| `WHISPER_COMPUTE_TYPE` | `float16`, `int8`, etc. | `float16` |
| `VLLM_BASE_URL` | vLLM server URL | `http://localhost:8001/v1` |
| `LLM_MODEL` | Hugging Face model ID | `meta-llama/Llama-3.1-8B-Instruct` |
| `HUGGING_FACE_HUB_TOKEN` | HF token for gated models | _(required for Llama)_ |
| `ALLOWED_ORIGINS` | CORS origins | `*` |
