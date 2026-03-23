from __future__ import annotations

import uuid
from datetime import datetime, timezone

import chromadb

from ..config import settings
from . import embeddings

_client: chromadb.PersistentClient | None = None
COLLECTION_NAME = "consciousness"


def get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chromadb_path)
    return _client


def get_collection() -> chromadb.Collection:
    client = get_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def add_memories(
    texts: list[str],
    metadatas: list[dict] | None = None,
    ids: list[str] | None = None,
) -> int:
    collection = get_collection()
    if ids is None:
        ids = [str(uuid.uuid4()) for _ in texts]
    if metadatas is None:
        now = datetime.now(timezone.utc).isoformat()
        metadatas = [{"source": "unknown", "created_at": now} for _ in texts]

    vecs = embeddings.embed_texts(texts)

    batch_size = 500
    stored = 0
    for i in range(0, len(texts), batch_size):
        end = min(i + batch_size, len(texts))
        collection.add(
            ids=ids[i:end],
            documents=texts[i:end],
            embeddings=vecs[i:end],
            metadatas=metadatas[i:end],
        )
        stored += end - i
    return stored


def search(query: str, top_k: int = 10, where: dict | None = None) -> list[dict]:
    collection = get_collection()
    query_vec = embeddings.embed_query(query)

    kwargs: dict = {
        "query_embeddings": [query_vec],
        "n_results": min(top_k, collection.count() or 1),
        "include": ["documents", "metadatas", "distances"],
    }
    if where:
        kwargs["where"] = where

    if collection.count() == 0:
        return []

    results = collection.query(**kwargs)

    out = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        out.append({
            "content": doc,
            "metadata": meta,
            "score": round(1.0 - dist, 4),
        })
    return out


def count() -> int:
    return get_collection().count()


def delete_by_source(source: str) -> int:
    collection = get_collection()
    before = collection.count()
    collection.delete(where={"source": source})
    return before - collection.count()
