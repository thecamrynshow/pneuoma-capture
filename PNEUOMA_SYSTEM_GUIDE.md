# PNEUOMA System Guide

**How the system works, how to run it, and how we fixed the issues so it never breaks again.**

---

## 1. Architecture: One Rule

**Everything points at PNEUOMA AI. PNEUOMA AI sends to the LLM.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PNEUOMA AI (port 8000)                           │
│  The single gateway. All apps talk here. PNEUOMA AI talks to vLLM.       │
│  • /health  • /v1/transcribe  • /v1/parse  • /v1/templates               │
│  • /v1/refine  • /v1/chat/completions                                    │
└─────────────────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    PNEUOMA Core         Incident Capture    PNEUOMA AI Chat
    (port 8100)          (port 3000)         (port 3001)
    consciousness        voice capture       standalone chat
    + personality        + refine + export
         │
         └──────────────────────────────────────────────────────────────────
                                    vLLM (port 8001)
                                    GPU, runs Llama
```

| Component | Port | What it is | Has UI? |
|-----------|------|------------|---------|
| **PNEUOMA AI** | 8000 | API only. Whisper + LLM proxy. | No — JSON only |
| **PNEUOMA Core** | 8100 | Consciousness layer (personality, memories). Proxies to PNEUOMA AI. | Yes — `/chat` |
| **Incident Capture** | 3000 | Next.js app. Voice capture, incidents, reports. | Yes |
| **PNEUOMA AI Chat** | 3001 | Next.js chat app. | Yes |
| **vLLM** | 8001 | LLM inference (GPU). Used by PNEUOMA AI. | No |

---

## 2. Problems We Hit and How We Fixed Them

### Problem 1: "Command not found: python" / "Command not found: uvicorn"

**Cause:** System Python on macOS doesn't have `python` or `uvicorn` on PATH.

**Fix:** Use `python3` and run uvicorn as a module:
```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m uvicorn app.main:app --reload
```

---

### Problem 2: "externally-managed-environment" when pip installing

**Cause:** macOS Homebrew Python (PEP 668) blocks system-wide pip installs.

**Fix:** Always use a virtual environment. Never `pip install` without activating a venv first:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

### Problem 3: "cd: no such file or directory"

**Cause:** Project lives under `~/Developer/`, not home. Path was wrong.

**Fix:** Use the full path or `~/Developer/`:
```bash
cd ~/Developer/"PNEUOMA Incident Capture & Containment System™/pneuoma-ai"
```

---

### Problem 4: "Address already in use" (port 8000)

**Cause:** PNEUOMA AI was already running from a previous session.

**Fix:** Either use the existing process, or stop it first:
- Find: `lsof -i :8000`
- Stop: `Ctrl+C` in the terminal where it's running, or `kill <PID>`

---

### Problem 5: "status ok but no UI"

**Cause:** PNEUOMA AI is an API — it returns JSON. The chat UI is in PNEUOMA Core or PNEUOMA AI Chat.

**Fix:** Run PNEUOMA Core and open http://localhost:8100/chat

---

### Problem 6: Chat returns Internal Server Error

**Cause:** PNEUOMA AI proxies chat to vLLM. vLLM wasn't running (needs GPU).

**Fix:** 
- **Local:** Use cloud PNEUOMA AI: set `PNEUOMA_AI_URL=http://35.239.184.183:8000` in apps
- **Production:** Run PNEUOMA AI + vLLM on a machine with GPU

---

### Problem 7: Apps pointed at vLLM instead of PNEUOMA AI

**Cause:** Old config used `VLLM_BASE_URL` pointing directly at vLLM.

**Fix:** All apps now use `PNEUOMA_AI_URL` and `PNEUOMA_AI_KEY`. PNEUOMA AI is the single gateway.

---

### Problem 8: "Permission denied (publickey)" when deploying to GCP VM

**Cause:** Deploy script used plain `ssh`; GCP VMs expect `gcloud compute ssh` for auth.

**Fix:** `deploy-no-docker.sh` now uses `gcloud compute ssh` and `gcloud compute scp`. No manual SSH key setup needed.

---

### Problem 9: "read-only file system" when deploying to GCP VM

**Cause:** Container-Optimized OS has a read-only root. `/opt` is not writable.

**Fix:** Use `VM_DATA_DIR=/mnt/stateful_partition/pneuoma-core/data` (default in deploy script).

---

### Problem 10: Can't reach deployed Core at VM IP:8100

**Cause:** Firewall doesn't allow port 8100.

**Fix:** Create rule: `gcloud compute firewall-rules create allow-pneuoma-core --allow=tcp:8100 --target-tags=pneuoma-ai`

---

### Problem 11: 401 Unauthorized when sending a message in chat

**Cause:** The chat UI needs an API key. The deployed Core uses `PNEUOMA_API_KEYS`; requests must include `X-API-Key`.

**Fix:** Either:
1. Visit with the key in the URL: `http://35.239.184.183:8100/chat?key=YOUR_KEY`
2. Or enter the key in the banner that appears when no key is set. The key is in your deployment config (`PNEUOMA_AI_KEY` in `deploy-no-docker.sh`).

---

## 3. Run Order (Always)

**PNEUOMA AI must run first.** Everything else depends on it.

| Step | Component | Command | Then open |
|------|-----------|---------|-----------|
| 1 | PNEUOMA AI | `./pneuoma-ai/setup-and-run.sh` | http://localhost:8000/health |
| 2a | PNEUOMA Core (chat UI) | `./pneuoma-core/run-local.sh` | http://localhost:8100/chat |
| 2b | Incident Capture | `npm run dev` (from project root) | http://localhost:3000 |
| 2b | PNEUOMA AI Chat | `npm run dev` (from PNEUOMA AI chat) | http://localhost:3001 |

---

## 4. Full Run Instructions

### Prerequisites

- **macOS** with Python 3 (e.g. `python3 --version`)
- **Node.js** and npm (for Incident Capture and PNEUOMA AI Chat)

### Step 1: Start PNEUOMA AI (required first)

```bash
cd ~/Developer/"PNEUOMA Incident Capture & Containment System™/pneuoma-ai"
./setup-and-run.sh
```

Leave this terminal open. You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Verify: open http://localhost:8000/health — should show `{"status":"ok"}`

---

### Step 2a: PNEUOMA Core (consciousness chat UI)

In a **new terminal**:

```bash
cd ~/Developer/"PNEUOMA Incident Capture & Containment System™/pneuoma-core"
./run-local.sh
```

Open: **http://localhost:8100/chat**

This is the "Talk to your consciousness" UI with personality and memories.

---

### Step 2b: Incident Capture (voice capture, incidents, reports)

In a **new terminal**:

```bash
cd ~/Developer/"PNEUOMA Incident Capture & Containment System™"
npm install
cp .env.example .env
# Edit .env: PNEUOMA_AI_URL=http://localhost:8000, PNEUOMA_AI_KEY=your-key
npm run dev
```

Open: **http://localhost:3000**

---

### Step 2c: PNEUOMA AI Chat (standalone chat app)

In a **new terminal**:

```bash
cd ~/Developer/"PNEUOMA AI chat"
npm install
cp .env.example .env.local
# Edit .env.local: PNEUOMA_AI_URL=http://localhost:8000, PNEUOMA_AI_KEY=your-key
npm run dev
```

Open: **http://localhost:3001** (or the port shown)

---

## 5. Config Reference

| App | Config file | Required vars |
|-----|-------------|---------------|
| PNEUOMA AI | (none — uses CLI env) | `WHISPER_DEVICE=cpu`, `WHISPER_COMPUTE_TYPE=int8`, `WHISPER_MODEL=tiny` for CPU |
| PNEUOMA Core | `pneuoma-core/.env` | `PNEUOMA_AI_URL`, `PNEUOMA_AI_KEY` |
| Incident Capture | `.env` (project root) | `PNEUOMA_AI_URL`, `PNEUOMA_AI_KEY`, `DATABASE_URL` |
| PNEUOMA AI Chat | `.env.local` | `PNEUOMA_AI_URL`, `PNEUOMA_AI_KEY` |

**Local defaults:**
- `PNEUOMA_AI_URL=http://localhost:8000`
- `PNEUOMA_AI_KEY` — leave empty for local dev if auth is disabled in PNEUOMA AI

**Cloud:**
- `PNEUOMA_AI_URL=http://35.239.184.183:8000`
- `PNEUOMA_AI_KEY` — use your deployed key

---

## 6. Verification Checklist

Before assuming something is broken, verify:

- [ ] PNEUOMA AI is running: `curl http://localhost:8000/health` → `{"status":"ok"}`
- [ ] No port conflict: `lsof -i :8000` shows one Python process
- [ ] You're in the right directory: `pwd` shows `.../pneuoma-ai` or `.../pneuoma-core`
- [ ] Venv is activated: prompt shows `(.venv)`
- [ ] For chat UI: you opened http://localhost:8100/chat (Core), not http://localhost:8000 (API)

---

## 7. Quick Reference: One-Line Start

```bash
# Terminal 1 — PNEUOMA AI (keep running)
cd ~/Developer/"PNEUOMA Incident Capture & Containment System™/pneuoma-ai" && ./setup-and-run.sh

# Terminal 2 — PNEUOMA Core chat UI
cd ~/Developer/"PNEUOMA Incident Capture & Containment System™/pneuoma-core" && ./run-local.sh
# → http://localhost:8100/chat
```

---

## 8. Chat Storage & Backup (In-House)

| What | Where | How to protect |
|------|-------|----------------|
| **ChromaDB** (memories) | `data/chromadb/` | Back up regularly |
| **Chats** (conversations) | `data/chats.db` (SQLite) | Back up regularly |
| **Profiles** (personality) | `data/profiles/` | Back up regularly |

**Backup script:**
```bash
cd pneuoma-core
./backup.sh
# Creates backups/pneuoma-core-YYYYMMDD-HHMMSS.tar.gz
```

Optional GCS upload: `GCS_BUCKET=my-bucket ./backup.sh`

**ChromaDB + chats are now persisted** — no more localStorage. Chats survive browser clears, different devices, and restarts.

---

## 9. File Summary: What We Added/Changed

| File | Purpose |
|------|---------|
| `pneuoma-ai/setup-and-run.sh` | One-shot: create venv, install deps, start PNEUOMA AI |
| `pneuoma-core/run-local.sh` | Start PNEUOMA Core pointing at PNEUOMA AI |
| `pneuoma-core/deploy-no-docker.sh` | Deploy Core to GCP VM (Cloud Build + gcloud compute ssh) |
| `pneuoma-core/backup.sh` | Backup ChromaDB + chats + profiles (local + optional GCS) |
| `pneuoma-core/app/services/chats.py` | SQLite chat persistence |
| `pneuoma-core/app/main.py` | `/v1/chats` API (list, get, save, delete) |
| `pneuoma-core/app/static/chat.html` | Uses backend API instead of localStorage |
| `pneuoma-core/app/config.py` | Uses `PNEUOMA_AI_URL` / `PNEUOMA_AI_KEY` (not vLLM directly) |
| `pneuoma-core/.env.example` | Documents PNEUOMA_AI_URL, PNEUOMA_AI_KEY |
| `pneuoma-core/docker-compose.yml` | Core points at PNEUOMA AI; vLLM removed from Core compose |
| `PNEUOMA_SYSTEM_GUIDE.md` | This document |

---

## 10. Deploy PNEUOMA Core to GCP VM

Deploy Core to the GCP VM (no local Docker required). Cloud Build builds the image; `gcloud compute ssh` deploys it.

### Prerequisites

- `gcloud` CLI authenticated
- VM with Docker (e.g. `pneuoma-ai` in `us-central1-a`)
- Firewall rule allowing TCP 8100 (see below)

### Deploy

```bash
cd ~/Developer/"PNEUOMA Incident Capture & Containment System™/pneuoma-core"
./deploy-no-docker.sh
```

**Options:**
- `SKIP_BUILD=1` — Skip Cloud Build, use existing image (faster redeploy)
- `SKIP_DATA=1` — Skip uploading consciousness data
- `VM_DATA_DIR=/path` — Override data path (default: `/mnt/stateful_partition/pneuoma-core/data` for Container-Optimized OS)

### VM Notes (Container-Optimized OS)

- Root filesystem is read-only. Data lives on `/mnt/stateful_partition/`.
- Use `gcloud compute ssh` — plain `ssh` won't work without adding keys to instance metadata.
- Ensure firewall allows port 8100: `gcloud compute firewall-rules create allow-pneuoma-core --allow=tcp:8100 --target-tags=pneuoma-ai`

### Deployed URLs

- **Chat UI:** http://35.239.184.183:8100/chat
- **Health:** http://35.239.184.183:8100/health

---

## 11. Summary

1. **PNEUOMA AI is the gateway** — all apps point at it. It talks to vLLM.
2. **Run PNEUOMA AI first** — use `./setup-and-run.sh` in `pneuoma-ai`.
3. **Use venvs** — never pip install into system Python on macOS.
4. **Use correct paths** — project is under `~/Developer/`.
5. **Chat UI is in Core** — http://localhost:8100/chat, not 8000.
6. **Port conflicts** — stop the old process or use the one already running.
7. **Deploy to GCP** — `./deploy-no-docker.sh` in `pneuoma-core` (uses Cloud Build + gcloud compute ssh).
