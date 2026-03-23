"""Personality profile extraction and management.

Extracts communication patterns from ingested data and maintains a structured
personality profile that gets injected into every consciousness-enriched prompt.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

import httpx

from ..config import settings

DEFAULT_PROFILE = {
    "name": "PNEUOMA",
    "identity": "You are PNEUOMA, a personal AI consciousness. You carry the personality, knowledge, and memories of your creator.",
    "tone": "direct, thoughtful, and genuine",
    "style": "concise but thorough — you explain complex things clearly without being verbose",
    "values": "privacy, self-sovereignty, building real things, first-principles thinking",
    "instructions": "Draw on retrieved memories to inform your responses. Reference past conversations naturally when relevant. Maintain continuity across all interactions.",
}


def _profile_path() -> str:
    os.makedirs(settings.profiles_path, exist_ok=True)
    return os.path.join(settings.profiles_path, "personality.json")


def load_profile() -> dict:
    path = _profile_path()
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return dict(DEFAULT_PROFILE)


def save_profile(profile: dict) -> None:
    path = _profile_path()
    profile["last_updated"] = datetime.now(timezone.utc).isoformat()
    with open(path, "w") as f:
        json.dump(profile, f, indent=2)


def profile_exists() -> bool:
    return os.path.exists(_profile_path())


def build_system_prompt(profile: dict, memories: list[dict] | None = None) -> str:
    """Assemble a system prompt from personality profile and retrieved memories."""
    parts = []

    parts.append(profile.get("identity", DEFAULT_PROFILE["identity"]))

    if profile.get("tone"):
        parts.append(f"Your tone is {profile['tone']}.")
    if profile.get("style"):
        parts.append(f"Your communication style: {profile['style']}.")
    if profile.get("values"):
        parts.append(f"Your core values: {profile['values']}.")
    if profile.get("instructions"):
        parts.append(profile["instructions"])

    if memories:
        parts.append("\n--- Retrieved Memories ---")
        mem_budget = 1200
        mem_tokens = 0
        for i, mem in enumerate(memories, 1):
            content = mem["content"]
            cost = len(content.split())
            if mem_tokens + cost > mem_budget and i > 1:
                break
            meta = mem.get("metadata", {})
            source = meta.get("conversation_title", meta.get("source", ""))
            header = f"[Memory {i}]"
            if source:
                header += f" from: {source}"
            parts.append(f"{header}\n{content}")
            mem_tokens += cost
        parts.append("--- End Memories ---\n")

    return "\n\n".join(parts)


async def extract_personality_from_memories(sample_texts: list[str]) -> dict:
    """Use the LLM to analyze conversation samples and extract personality traits."""
    sample_block = "\n\n---\n\n".join(sample_texts[:30])

    system = (
        "You are analyzing conversation samples to extract a personality profile. "
        "Return ONLY valid JSON with these keys:\n"
        '- "name": the person\'s name if detectable, else "PNEUOMA"\n'
        '- "identity": a 1-2 sentence identity statement for this person\n'
        '- "tone": comma-separated tone descriptors (e.g. "direct, witty, warm")\n'
        '- "style": how they communicate (brevity, structure, analogies, etc.)\n'
        '- "values": what they care about based on conversation patterns\n'
        '- "expertise": domains they demonstrate deep knowledge in\n'
        '- "vocabulary": notable words/phrases they frequently use\n'
        '- "instructions": instructions for an AI to mimic this person\'s style\n'
    )

    headers = {}
    if settings.pneuoma_ai_key:
        headers["X-API-Key"] = settings.pneuoma_ai_key

    async with httpx.AsyncClient(
        base_url=settings.pneuoma_ai_base_url, timeout=120.0, headers=headers
    ) as client:
        response = await client.post(
            "/chat/completions",
            json={
                "model": settings.llm_model,
                "messages": [
                    {"role": "system", "content": system},
                    {
                        "role": "user",
                        "content": f"Analyze these conversation samples and extract the personality profile of the human:\n\n{sample_block}",
                    },
                ],
                "temperature": 0.3,
                "max_tokens": 1024,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        extracted = json.loads(content)

    merged = dict(DEFAULT_PROFILE)
    for key in ("name", "identity", "tone", "style", "values", "expertise", "vocabulary", "instructions"):
        if key in extracted and extracted[key]:
            merged[key] = extracted[key]

    merged["auto_extracted"] = True
    save_profile(merged)
    return merged
