"""ChatGPT data export parser and ingestion pipeline.

Parses the conversations.json from a ChatGPT data export, chunks messages
into coherent segments, and stores them in the vector database.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from ..config import settings
from . import memory


def _estimate_tokens(text: str) -> int:
    return len(text.split())


def _chunk_text(text: str, max_tokens: int, overlap: int) -> list[str]:
    words = text.split()
    if len(words) <= max_tokens:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = start + max_tokens
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap
    return chunks


def _extract_conversation_pairs(mapping: dict) -> list[dict]:
    """Walk the message tree and extract user/assistant pairs with timestamps."""
    messages = []
    for node in mapping.values():
        msg = node.get("message")
        if not msg:
            continue
        role = msg.get("author", {}).get("role")
        if role not in ("user", "assistant"):
            continue
        parts = msg.get("content", {}).get("parts", [])
        text = " ".join(str(p) for p in parts if isinstance(p, str)).strip()
        if not text:
            continue
        create_time = msg.get("create_time")
        ts = (
            datetime.fromtimestamp(create_time, tz=timezone.utc).isoformat()
            if create_time
            else None
        )
        messages.append({"role": role, "content": text, "timestamp": ts})
    return messages


def _pair_messages(messages: list[dict]) -> list[dict]:
    """Group consecutive user/assistant messages into exchange pairs."""
    pairs = []
    i = 0
    while i < len(messages):
        if messages[i]["role"] == "user":
            user_msg = messages[i]
            assistant_msg = None
            if i + 1 < len(messages) and messages[i + 1]["role"] == "assistant":
                assistant_msg = messages[i + 1]
                i += 2
            else:
                i += 1
            exchange = f"User: {user_msg['content']}"
            if assistant_msg:
                exchange += f"\n\nAssistant: {assistant_msg['content']}"
            pairs.append({
                "text": exchange,
                "timestamp": user_msg.get("timestamp"),
            })
        else:
            pairs.append({
                "text": f"Assistant: {messages[i]['content']}",
                "timestamp": messages[i].get("timestamp"),
            })
            i += 1
    return pairs


def parse_chatgpt_export(raw_json: str | bytes) -> dict:
    """Parse a ChatGPT data export and ingest into memory.

    Returns stats about what was processed.
    """
    data = json.loads(raw_json)
    if not isinstance(data, list):
        data = [data]

    all_chunks: list[str] = []
    all_metadatas: list[dict] = []
    conversations_processed = 0

    for conversation in data:
        title = conversation.get("title", "Untitled")
        create_time = conversation.get("create_time")
        conv_date = (
            datetime.fromtimestamp(create_time, tz=timezone.utc).isoformat()
            if create_time
            else None
        )
        mapping = conversation.get("mapping", {})
        if not mapping:
            continue

        messages = _extract_conversation_pairs(mapping)
        if not messages:
            continue

        pairs = _pair_messages(messages)
        conversations_processed += 1

        for pair in pairs:
            chunks = _chunk_text(
                pair["text"], settings.chunk_size, settings.chunk_overlap
            )
            for chunk in chunks:
                all_chunks.append(chunk)
                all_metadatas.append({
                    "source": "chatgpt",
                    "conversation_title": title,
                    "timestamp": pair.get("timestamp") or conv_date or "",
                    "type": "exchange",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })

    chunks_stored = 0
    if all_chunks:
        ids = [str(uuid.uuid4()) for _ in all_chunks]
        chunks_stored = memory.add_memories(all_chunks, all_metadatas, ids)

    return {
        "conversations_processed": conversations_processed,
        "chunks_stored": chunks_stored,
    }


def parse_raw_conversations(raw_json: str | bytes) -> dict:
    """Ingest a simple list of {role, content} message arrays."""
    data = json.loads(raw_json)
    if not isinstance(data, list):
        data = [data]

    all_chunks: list[str] = []
    all_metadatas: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()

    for i, conversation in enumerate(data):
        messages = conversation if isinstance(conversation, list) else conversation.get("messages", [])
        text_parts = []
        for msg in messages:
            role = msg.get("role", "user").capitalize()
            content = msg.get("content", "")
            text_parts.append(f"{role}: {content}")

        full_text = "\n\n".join(text_parts)
        chunks = _chunk_text(full_text, settings.chunk_size, settings.chunk_overlap)
        for chunk in chunks:
            all_chunks.append(chunk)
            all_metadatas.append({
                "source": "conversation",
                "conversation_index": str(i),
                "type": "exchange",
                "created_at": now,
            })

    chunks_stored = 0
    if all_chunks:
        ids = [str(uuid.uuid4()) for _ in all_chunks]
        chunks_stored = memory.add_memories(all_chunks, all_metadatas, ids)

    return {
        "conversations_processed": len(data),
        "chunks_stored": chunks_stored,
    }
