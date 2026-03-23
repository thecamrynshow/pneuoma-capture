"""Local ingestion script — run directly without the server.

Usage: python ingest_local.py /path/to/conversations-*.json
"""

import glob
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault("CHROMADB_PATH", os.path.join(os.path.dirname(__file__), "data", "chromadb"))
os.environ.setdefault("PROFILES_PATH", os.path.join(os.path.dirname(__file__), "data", "profiles"))

from app.services.ingest import parse_chatgpt_export
from app.services import memory


def main():
    if len(sys.argv) < 2:
        print("Usage: python ingest_local.py /path/to/export/dir/or/files")
        sys.exit(1)

    target = sys.argv[1]
    if os.path.isdir(target):
        files = sorted(glob.glob(os.path.join(target, "conversations-*.json")))
    else:
        files = sorted(sys.argv[1:])

    if not files:
        print(f"No conversations-*.json files found in {target}")
        sys.exit(1)

    print(f"Found {len(files)} conversation files")
    print(f"ChromaDB path: {os.environ['CHROMADB_PATH']}")
    print()

    total_convos = 0
    total_chunks = 0

    for i, filepath in enumerate(files, 1):
        filename = os.path.basename(filepath)
        size_mb = os.path.getsize(filepath) / (1024 * 1024)
        print(f"[{i}/{len(files)}] Processing {filename} ({size_mb:.1f} MB)...")

        start = time.time()
        with open(filepath, "rb") as f:
            raw = f.read()

        stats = parse_chatgpt_export(raw)
        elapsed = time.time() - start

        total_convos += stats["conversations_processed"]
        total_chunks += stats["chunks_stored"]

        print(f"         {stats['conversations_processed']} conversations → {stats['chunks_stored']} chunks ({elapsed:.1f}s)")

    print()
    print(f"Done. {total_convos} conversations → {total_chunks} memory chunks")
    print(f"Total memories in ChromaDB: {memory.count()}")


if __name__ == "__main__":
    main()
