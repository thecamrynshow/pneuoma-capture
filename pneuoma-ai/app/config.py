import os


class Settings:
    def __init__(self):
        self.api_keys: list[str] = [
            k.strip()
            for k in os.getenv("PNEUOMA_API_KEYS", "").split(",")
            if k.strip()
        ]
        self.whisper_model: str = os.getenv("WHISPER_MODEL", "large-v3")
        self.whisper_device: str = os.getenv("WHISPER_DEVICE", "cuda")
        self.whisper_compute_type: str = os.getenv("WHISPER_COMPUTE_TYPE", "float16")
        self.vllm_base_url: str = os.getenv(
            "VLLM_BASE_URL", "http://localhost:8001/v1"
        )
        self.llm_model: str = os.getenv(
            "LLM_MODEL", "Qwen/Qwen2.5-7B-Instruct"
        )
        self.allowed_origins: list[str] = [
            o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")
        ]


settings = Settings()
