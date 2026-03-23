"""Persistent chat storage — SQLite, in-house. Backed up with ChromaDB."""

from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from ..config import settings


def _ensure_db() -> None:
    Path(settings.chats_db_path).parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(settings.chats_db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                messages TEXT NOT NULL,
                created INTEGER NOT NULL
            )
        """)
        conn.commit()


def list_chats() -> list[dict]:
    """Return all chats, newest first."""
    _ensure_db()
    with sqlite3.connect(settings.chats_db_path) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT id, title, messages, created FROM chats ORDER BY created DESC"
        ).fetchall()
    return [
        {
            "id": r["id"],
            "title": r["title"],
            "messages": json.loads(r["messages"]),
            "created": r["created"],
        }
        for r in rows
    ]


def get_chat(chat_id: str) -> dict | None:
    """Return a single chat by id."""
    _ensure_db()
    with sqlite3.connect(settings.chats_db_path) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            "SELECT id, title, messages, created FROM chats WHERE id = ?",
            (chat_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "title": row["title"],
        "messages": json.loads(row["messages"]),
        "created": row["created"],
    }


def save_chat(chat: dict) -> None:
    """Insert or replace a chat."""
    _ensure_db()
    with sqlite3.connect(settings.chats_db_path) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO chats (id, title, messages, created)
            VALUES (?, ?, ?, ?)
            """,
            (
                chat["id"],
                chat.get("title", "New chat"),
                json.dumps(chat.get("messages", [])),
                chat.get("created", 0),
            ),
        )
        conn.commit()


def delete_chat(chat_id: str) -> bool:
    """Delete a chat. Returns True if deleted."""
    _ensure_db()
    with sqlite3.connect(settings.chats_db_path) as conn:
        cur = conn.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
        conn.commit()
    return cur.rowcount > 0
