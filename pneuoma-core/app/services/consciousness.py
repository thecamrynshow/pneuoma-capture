"""Core RAG engine — retrieve, assemble, generate, store.

The central orchestrator that makes /v1/chat/completions consciousness-aware.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from ..config import settings
from ..models import ChatMessage, ChatRequest
from . import memory
from .personality import build_system_prompt, load_profile

log = logging.getLogger(__name__)

MAX_PROMPT_TOKENS = 3200


def _estimate_tokens(text: str) -> int:
    return len(text.split()) + len(text) // 4


def _estimate_messages_tokens(messages: list[dict]) -> int:
    return sum(_estimate_tokens(m["content"]) for m in messages)


def _trim_conversation(messages: list[dict], budget: int) -> list[dict]:
    """Keep the system message and as many recent messages as fit in the budget."""
    system = [m for m in messages if m["role"] == "system"]
    non_system = [m for m in messages if m["role"] != "system"]

    system_cost = _estimate_messages_tokens(system)
    remaining = budget - system_cost

    kept = []
    for m in reversed(non_system):
        cost = _estimate_tokens(m["content"])
        if remaining - cost < 0 and kept:
            break
        kept.insert(0, m)
        remaining -= cost

    return system + kept


async def complete(request: ChatRequest) -> dict:
    """Process a chat completion with optional consciousness enrichment."""
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    if request.consciousness:
        messages = _enrich_with_consciousness(messages)

    messages = _trim_conversation(messages, MAX_PROMPT_TOKENS)

    body: dict = {
        "model": request.model or settings.llm_model,
        "messages": messages,
        "temperature": request.temperature,
        "max_tokens": min(request.max_tokens, 800),
    }
    if request.response_format:
        body["response_format"] = request.response_format

    headers = {}
    if settings.pneuoma_ai_key:
        headers["X-API-Key"] = settings.pneuoma_ai_key

    async with httpx.AsyncClient(
        base_url=settings.pneuoma_ai_base_url, timeout=120.0, headers=headers
    ) as client:
        response = await client.post("/chat/completions", json=body)

        if response.status_code >= 500:
            log.warning("Upstream LLM error %s, retrying with trimmed context", response.status_code)
            body["messages"] = _trim_conversation(body["messages"], MAX_PROMPT_TOKENS // 2)
            body["max_tokens"] = min(body["max_tokens"], 512)
            response = await client.post("/chat/completions", json=body)

        response.raise_for_status()
        result = response.json()

    _store_exchange(request.messages, result)

    return result


def _enrich_with_consciousness(messages: list[dict]) -> list[dict]:
    """Inject personality profile and retrieved memories into the message list."""
    user_messages = [m["content"] for m in messages if m["role"] == "user"]
    query = user_messages[-1] if user_messages else ""

    retrieved = []
    if query and memory.count() > 0:
        raw = memory.search(query, top_k=settings.memory_top_k)
        retrieved = [r for r in raw if r["score"] >= settings.memory_min_score]

    profile = load_profile()
    system_prompt = build_system_prompt(profile, retrieved if retrieved else None)

    enriched = []
    has_system = any(m["role"] == "system" for m in messages)

    if has_system:
        for m in messages:
            if m["role"] == "system":
                enriched.append({
                    "role": "system",
                    "content": system_prompt + "\n\n" + m["content"],
                })
            else:
                enriched.append(m)
    else:
        enriched.append({"role": "system", "content": system_prompt})
        enriched.extend(messages)

    return enriched


def _store_exchange(request_messages: list[ChatMessage], response: dict) -> None:
    """Store the latest exchange in memory for future recall."""
    try:
        user_msgs = [m for m in request_messages if m.role == "user"]
        if not user_msgs:
            return

        last_user = user_msgs[-1].content
        assistant_content = response["choices"][0]["message"]["content"]

        exchange = f"User: {last_user}\n\nAssistant: {assistant_content}"
        now = datetime.now(timezone.utc).isoformat()

        memory.add_memories(
            texts=[exchange],
            metadatas=[{
                "source": "live",
                "type": "exchange",
                "timestamp": now,
                "created_at": now,
            }],
        )
    except Exception:
        pass
