import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .auth import verify_api_key
from .config import settings
from .models import (
    ChatRequest,
    ChatSaveRequest,
    HealthResponse,
    IngestResponse,
    MemorySearchResponse,
    MemoryResult,
    ProfileResponse,
    ProfileUpdateRequest,
)
from .services import memory
from .services import chats as chats_service
from .services.consciousness import complete
from .services.embeddings import get_model
from .services.ingest import parse_chatgpt_export, parse_raw_conversations
from .services.personality import (
    extract_personality_from_memories,
    load_profile,
    profile_exists,
    save_profile,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_model()
    yield


app = FastAPI(
    title="PNEUOMA Core",
    version="1.0.0",
    description="Personal AI consciousness service. Personality, knowledge, and memory via RAG.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


STATIC_DIR = Path(__file__).parent / "static"


@app.get("/chat")
async def chat_ui():
    return FileResponse(STATIC_DIR / "chat.html", media_type="text/html")


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        memories_count=memory.count(),
        profile_loaded=profile_exists(),
    )


@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatRequest,
    _: str = Depends(verify_api_key),
):
    return await complete(request)


@app.post("/v1/ingest", response_model=IngestResponse)
async def ingest_data(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    _: str = Depends(verify_api_key),
):
    """Upload a ChatGPT export (conversations.json) or generic conversation JSON."""
    raw = await file.read()

    content_type = file.content_type or ""
    filename = file.filename or ""

    if "chatgpt" in filename.lower() or "conversations" in filename.lower():
        stats = parse_chatgpt_export(raw)
    else:
        try:
            stats = parse_chatgpt_export(raw)
        except (KeyError, TypeError):
            stats = parse_raw_conversations(raw)

    if stats["chunks_stored"] > 0:
        background_tasks.add_task(_maybe_extract_personality)

    return IngestResponse(
        status="complete",
        conversations_processed=stats["conversations_processed"],
        chunks_stored=stats["chunks_stored"],
        message=f"Ingested {stats['conversations_processed']} conversations into {stats['chunks_stored']} memory chunks.",
    )


async def _maybe_extract_personality():
    """Auto-extract personality if enough memories exist and no custom profile."""
    if memory.count() < 20:
        return
    profile = load_profile()
    if profile.get("auto_extracted"):
        return
    samples = memory.search("personal style communication patterns", top_k=30)
    if samples:
        texts = [s["content"] for s in samples]
        await extract_personality_from_memories(texts)


@app.get("/v1/memory/search", response_model=MemorySearchResponse)
async def search_memory(
    q: str,
    top_k: int = 10,
    source: str | None = None,
    _: str = Depends(verify_api_key),
):
    where = {"source": source} if source else None
    results = memory.search(q, top_k=top_k, where=where)
    return MemorySearchResponse(
        results=[
            MemoryResult(
                content=r["content"],
                metadata=r["metadata"],
                score=r["score"],
            )
            for r in results
        ],
        total=memory.count(),
    )


@app.get("/v1/profile", response_model=ProfileResponse)
async def get_profile(_: str = Depends(verify_api_key)):
    profile = load_profile()
    return ProfileResponse(
        personality=profile,
        last_updated=profile.get("last_updated"),
        source_stats={"total_memories": memory.count()},
    )


@app.put("/v1/profile", response_model=ProfileResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    _: str = Depends(verify_api_key),
):
    save_profile(request.personality)
    profile = load_profile()
    return ProfileResponse(
        personality=profile,
        last_updated=profile.get("last_updated"),
        source_stats={"total_memories": memory.count()},
    )


# ── Chat persistence (in-house SQLite) ──

@app.get("/v1/chats")
async def list_chats(_: str = Depends(verify_api_key)):
    """List all chats, newest first."""
    return chats_service.list_chats()


@app.get("/v1/chats/{chat_id}")
async def get_chat(chat_id: str, _: str = Depends(verify_api_key)):
    """Get a single chat by id."""
    from fastapi import HTTPException
    chat = chats_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@app.post("/v1/chats")
async def save_chat(
    request: ChatSaveRequest,
    _: str = Depends(verify_api_key),
):
    """Save or update a chat."""
    chats_service.save_chat(request.model_dump())
    return {"ok": True}


@app.delete("/v1/chats/{chat_id}")
async def delete_chat(chat_id: str, _: str = Depends(verify_api_key)):
    """Delete a chat."""
    from fastapi import HTTPException
    deleted = chats_service.delete_chat(chat_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"ok": True}
