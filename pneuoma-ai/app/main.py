from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .auth import verify_api_key
from .config import settings
from .models import (
    ChatRequest,
    ParseRequest,
    ParseResponse,
    RefineRequest,
    RefineResponse,
    TemplatesRequest,
    TemplatesResponse,
    TranscribeResponse,
)
from .services.llm import LLMService
from .services.transcription import TranscriptionService

transcription_service = TranscriptionService()
llm_service = LLMService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    transcription_service.load_model()
    yield


app = FastAPI(
    title="PNEUOMA AI",
    version="1.0.0",
    description="Self-hosted AI service for PNEUOMA apps. No third-party AI providers.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/v1/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    _: str = Depends(verify_api_key),
):
    audio_bytes = await file.read()
    text = await transcription_service.transcribe(
        audio_bytes, file.content_type or "audio/webm"
    )
    return TranscribeResponse(text=text)


@app.post("/v1/parse", response_model=ParseResponse)
async def parse_transcript(
    request: ParseRequest,
    _: str = Depends(verify_api_key),
):
    return await llm_service.parse_incident(request.transcript)


@app.post("/v1/templates", response_model=TemplatesResponse)
async def generate_templates(
    request: TemplatesRequest,
    _: str = Depends(verify_api_key),
):
    return await llm_service.generate_templates(request)


@app.post("/v1/refine", response_model=RefineResponse)
async def refine_incident(
    request: RefineRequest,
    _: str = Depends(verify_api_key),
):
    return await llm_service.refine_incident(request)


@app.post("/v1/chat/completions")
async def chat_completions(
    request: ChatRequest,
    _: str = Depends(verify_api_key),
):
    """Generic chat completion — OpenAI-compatible. Use in any PNEUOMA app (GPT, assistants, etc.)."""
    return await llm_service.chat(request)
