from __future__ import annotations

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str | None = None
    messages: list[ChatMessage]
    temperature: float = 0.7
    max_tokens: int = 2048
    response_format: dict | None = None
    consciousness: bool = Field(
        default=True,
        description="When True, inject personality and retrieved memories into the prompt.",
    )


class IngestRequest(BaseModel):
    source: str = Field(
        default="chatgpt",
        description="Data source type: chatgpt, conversation, or raw.",
    )


class IngestResponse(BaseModel):
    status: str
    conversations_processed: int
    chunks_stored: int
    message: str


class MemorySearchRequest(BaseModel):
    query: str
    top_k: int = 10
    source_filter: str | None = None


class MemoryResult(BaseModel):
    content: str
    metadata: dict
    score: float


class MemorySearchResponse(BaseModel):
    results: list[MemoryResult]
    total: int


class ProfileResponse(BaseModel):
    personality: dict
    last_updated: str | None = None
    source_stats: dict | None = None


class ProfileUpdateRequest(BaseModel):
    personality: dict


class HealthResponse(BaseModel):
    status: str
    memories_count: int
    profile_loaded: bool


class ChatSaveRequest(BaseModel):
    id: str
    title: str = "New chat"
    messages: list[dict]
    created: int
