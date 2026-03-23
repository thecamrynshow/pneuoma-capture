# PNEUOMA Core

Personal AI consciousness service. Carries your personality, knowledge, and conversational memory — extracted from your conversation history and grown through every interaction. Self-hosted, self-sovereign. No third-party AI services.

> **Quick start:** Run PNEUOMA AI first, then `./run-local.sh`. Chat UI: http://localhost:8100/chat. See **[../PNEUOMA_SYSTEM_GUIDE.md](../PNEUOMA_SYSTEM_GUIDE.md)** for full system docs.

## Quick Start

### With Docker (GPU required for vLLM)

```bash
cp .env.example .env
# Edit .env with your HUGGING_FACE_HUB_TOKEN
docker compose up --build
```

Core runs on `http://localhost:8100`. vLLM runs on port 8001.

### Without Docker (local dev)

```bash
pip install -r requirements.txt

# Point at PNEUOMA AI (the single LLM gateway)
export PNEUOMA_AI_URL=http://localhost:8000
export PNEUOMA_AI_KEY=your-key
export CHROMADB_PATH=./data/chromadb
export PROFILES_PATH=./data/profiles

uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
```

### Using cloud PNEUOMA AI

```bash
export PNEUOMA_AI_URL=http://35.239.184.183:8000
export PNEUOMA_AI_KEY=your-key
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
```

## Deploy to GCP VM

Deploy Core to a GCP VM without local Docker. Cloud Build builds the image; `gcloud compute ssh` deploys it.

**Prerequisites:** `gcloud` CLI authenticated, VM with Docker, firewall rule for port 8100.

```bash
./deploy-no-docker.sh
```

**Options:**

| Variable | Default | Description |
|----------|---------|-------------|
| `SKIP_BUILD` | `0` | Set `1` to skip Cloud Build (faster redeploy) |
| `SKIP_DATA` | `0` | Set `1` to skip uploading consciousness data |
| `VM_DATA_DIR` | `/mnt/stateful_partition/pneuoma-core/data` | Data path on VM (use writable path for Container-Optimized OS) |
| `GCP_PROJECT` | `pilotengine` | GCP project ID |
| `VM_INSTANCE` | `pneuoma-ai` | VM instance name |
| `VM_ZONE` | `us-central1-a` | VM zone |

**Firewall (one-time):**
```bash
gcloud compute firewall-rules create allow-pneuoma-core \
  --allow=tcp:8100 --target-tags=pneuoma-ai --project=pilotengine
```

**Deployed URLs:** http://35.239.184.183:8100/chat | http://35.239.184.183:8100/health

See **[../PNEUOMA_SYSTEM_GUIDE.md](../PNEUOMA_SYSTEM_GUIDE.md)** §10 for full deployment notes.

## Ingesting Your Conversation Data

1. Export your conversation history (e.g. from ChatGPT: Settings → Data Controls → Export Data)
2. Download and unzip — you want the `conversations.json` file
3. Upload it:

```bash
curl -X POST http://localhost:8100/v1/ingest \
  -H "X-API-Key: your-key" \
  -F "file=@conversations.json"
```

This parses every conversation, chunks it into ~500-token segments, generates embeddings, and stores everything in ChromaDB. After ingestion, it auto-extracts your personality profile from the data.

## API

All endpoints use the PNEUOMA Core protocol. Standard chat completion format for broad compatibility.

### `POST /v1/chat/completions`

Primary consciousness endpoint. Automatically enriches prompts with your personality and relevant memories.

```bash
curl -X POST http://localhost:8100/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-key" \
  -d '{
    "messages": [{"role": "user", "content": "What do you think about building AI systems?"}],
    "temperature": 0.7
  }'
```

Set `"consciousness": false` to bypass RAG enrichment (raw LLM passthrough).

### `POST /v1/ingest`

Upload conversation export or generic conversation JSON.

### `GET /v1/memory/search?q=...&top_k=10`

Search memories directly. Optional `source` filter (`chatgpt`, `live`, `conversation`).

### `GET /v1/profile`

View the current personality profile.

### `PUT /v1/profile`

Override the personality profile with a custom one.

### `GET /health`

Returns status, memory count, and whether a profile is loaded.

## Connecting Other PNEUOMA Apps

Any PNEUOMA app can use Core as its AI backend. Point the app's base URL to Core instead of directly to vLLM.

**Example — PNEUOMA Incident Capture:**

In your Incident Capture app, point `PNEUOMA_AI_URL` at PNEUOMA AI (or at Core if you want consciousness enrichment):

```
PNEUOMA_AI_URL=http://localhost:8000
```

Now every LLM call from Incident Capture flows through Core, enriched with your consciousness.

**Example — any Python app:**

```python
import httpx

response = httpx.post(
    "http://localhost:8100/v1/chat/completions",
    headers={"X-API-Key": "your-key"},
    json={
        "messages": [{"role": "user", "content": "Help me draft an email"}],
    },
)
print(response.json()["choices"][0]["message"]["content"])
```

**Example — JavaScript/Node:**

```javascript
const response = await fetch("http://localhost:8100/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "your-key",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "What's on my mind?" }],
  }),
});
const data = await response.json();
console.log(data.choices[0].message.content);
```

## Architecture

Everything points at PNEUOMA AI. PNEUOMA AI sends to the LLM.

```
Any PNEUOMA App
  │
  │  POST /v1/chat/completions
  ▼
PNEUOMA Core (port 8100)
  ├── Embed query → search ChromaDB for relevant memories
  ├── Load personality profile
  ├── Assemble enriched prompt (personality + memories + request)
  ├── Forward to PNEUOMA AI
  └── Store the exchange as new memory
        │
        ▼
  PNEUOMA AI (port 8000)
        │
        ▼
      vLLM (port 8001)
        └── Qwen 2.5 7B Instruct (or any model)
```

All AI processing runs on PNEUOMA infrastructure. No data leaves your servers.

## Data Storage

- **ChromaDB** (`data/chromadb/`): Vector store holding all memories. This is the "brain". Back it up.
- **Profiles** (`data/profiles/`): Personality profile JSON. Human-readable and editable.

Both directories are mounted as a Docker volume (`consciousness-data`) for persistence.

## Path to PNEUOMA OS

Core is designed as a system-level service:

1. Run Core as a systemd service on any Linux box
2. Bind to `localhost:8100` — every app on the system talks to it
3. Mount `consciousness-data` as a persistent volume or partition
4. Any desktop app, CLI tool, or daemon on the OS can hit the PNEUOMA Core API
5. The personality and memories travel with the volume — back up, sync, or migrate across machines

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PNEUOMA_API_KEYS` | (empty, no auth) | Comma-separated API keys |
| `PNEUOMA_AI_URL` | `http://localhost:8000` | PNEUOMA AI gateway (all apps point here) |
| `PNEUOMA_AI_KEY` | (empty) | API key for PNEUOMA AI |
| `LLM_MODEL` | `Qwen/Qwen2.5-7B-Instruct` | Model name (PNEUOMA AI uses this) |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence-transformers model |
| `CHROMADB_PATH` | `/app/data/chromadb` | ChromaDB persistence path |
| `PROFILES_PATH` | `/app/data/profiles` | Personality profiles path |
| `MEMORY_TOP_K` | `10` | Number of memories to retrieve per query |
| `CHUNK_SIZE` | `500` | Token limit per memory chunk |
| `CHUNK_OVERLAP` | `50` | Overlap tokens between chunks |
| `ALLOWED_ORIGINS` | `*` | CORS origins |
