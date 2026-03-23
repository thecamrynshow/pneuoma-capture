import os


def _pneuoma_ai_base_url() -> str:
    """PNEUOMA AI is the single LLM gateway. All apps point here; PNEUOMA AI sends to vLLM."""
    url = (os.getenv("PNEUOMA_AI_URL") or os.getenv("VLLM_BASE_URL") or "").rstrip("/")
    if url:
        return url + "/v1" if not url.endswith("/v1") else url
    return "http://localhost:8000/v1"  # PNEUOMA AI default


class Settings:
    def __init__(self):
        self.api_keys: list[str] = [
            k.strip()
            for k in os.getenv("PNEUOMA_API_KEYS", "").split(",")
            if k.strip()
        ]
        self.pneuoma_ai_base_url: str = _pneuoma_ai_base_url()
        self.pneuoma_ai_key: str = os.getenv("PNEUOMA_AI_KEY") or os.getenv("VLLM_API_KEY", "")
        self.llm_model: str = os.getenv(
            "LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct"
        )
        self.embedding_model: str = os.getenv(
            "EMBEDDING_MODEL", "all-MiniLM-L6-v2"
        )
        self.chromadb_path: str = os.getenv(
            "CHROMADB_PATH", "/app/data/chromadb"
        )
        self.profiles_path: str = os.getenv(
            "PROFILES_PATH", "/app/data/profiles"
        )
        _data_dir = os.path.dirname(self.chromadb_path)
        self.chats_db_path: str = os.getenv(
            "CHATS_DB_PATH", os.path.join(_data_dir, "chats.db")
        )
        self.allowed_origins: list[str] = [
            o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")
        ]
        self.memory_top_k: int = int(os.getenv("MEMORY_TOP_K", "10"))
        self.memory_min_score: float = float(os.getenv("MEMORY_MIN_SCORE", "0.35"))
        self.chunk_size: int = int(os.getenv("CHUNK_SIZE", "500"))
        self.chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "50"))


settings = Settings()
