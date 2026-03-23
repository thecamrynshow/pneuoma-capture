import json
from datetime import datetime

import httpx

from ..config import settings
from ..models import (
    ChatRequest,
    ParseResponse,
    RefineRequest,
    RefineResponse,
    TemplatesRequest,
    TemplatesResponse,
)

PARSE_SYSTEM_PROMPT = """You are a K-12 school administration assistant that converts voice notes about incidents into structured data. Extract all available information. Use today's date ({today}) if no date is mentioned. Estimate time from context clues if not explicitly stated.

Return ONLY valid JSON:
{{
  "date": "YYYY-MM-DD",
  "time": "H:MM AM/PM",
  "location": "specific location in school",
  "incidentType": "one of: Physical Altercation, Verbal Altercation, Disruption, Insubordination, Bullying, Vandalism, Theft, Drug/Alcohol, Weapons, Threat, Truancy, Dress Code, Technology Misuse, Other",
  "severity": "one of: Low, Medium, High, Critical",
  "studentsInvolved": ["full names if given, partial names otherwise"],
  "staffInvolved": ["staff names mentioned"],
  "witnesses": ["witness names if mentioned"],
  "description": "clear factual summary of the incident",
  "immediateAction": "actions already taken, empty string if not mentioned",
  "followUpNeeded": "recommended or stated next steps, empty string if not mentioned"
}}"""

TEMPLATES_SYSTEM_PROMPT = """You are a school administrator assistant. Generate professional, legally safe communication templates for an incident. Rules:
- Use neutral, factual language. Never assign blame.
- Teacher: Inform about the incident and classroom impact. Include monitoring and de-escalation guidance.
- Parent: Use first name and last initial only. NEVER name other students. Be factual but empathetic.
- Counselor: Include behavioral context for support planning.
- Principal: Brief executive summary with key facts and actions.
- Dean: Administrative summary with follow-up expectations.
- Support Staff: Relevant details for support team coordination.
- HR (corporate): Professional workplace incident summary.
- Manager: Concise summary for management awareness.
- Personal: Private documentation for personal records.

Return ONLY valid JSON with all requested fields. Use empty string "" for roles not requested:
{{
  "teacherEmail": "Subject: ...\\n\\n[body]",
  "parentEmail": "Subject: ...\\n\\n[body]",
  "counselorReferral": "COUNSELOR REFERRAL\\n\\n[content]",
  "principalEmail": "Subject: ...\\n\\n[body]",
  "deanEmail": "Subject: ...\\n\\n[body]",
  "supportStaffEmail": "Subject: ...\\n\\n[body]",
  "hrEmail": "Subject: ...\\n\\n[body]",
  "managerEmail": "Subject: ...\\n\\n[body]",
  "personalContact": "[personal documentation text]"
}}"""


class LLMService:
    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url=settings.vllm_base_url, timeout=120.0
        )

    async def _chat_completion(self, system_prompt: str, user_content: str) -> str:
        response = await self._client.post(
            "/chat/completions",
            json={
                "model": settings.llm_model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                "temperature": 0.1,
                "max_tokens": 2048,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def parse_incident(self, transcript: str) -> ParseResponse:
        today = datetime.now().strftime("%Y-%m-%d")
        system_prompt = PARSE_SYSTEM_PROMPT.format(today=today)
        result_text = await self._chat_completion(system_prompt, transcript)
        parsed = json.loads(result_text)

        now = datetime.now()
        return ParseResponse(
            date=parsed.get("date", today),
            time=parsed.get("time", now.strftime("%-I:%M %p")),
            location=parsed.get("location", ""),
            incidentType=parsed.get("incidentType", "Other"),
            severity=parsed.get("severity", "Medium"),
            studentsInvolved=parsed.get("studentsInvolved", []),
            staffInvolved=parsed.get("staffInvolved", []),
            witnesses=parsed.get("witnesses", []),
            description=parsed.get("description", transcript),
            immediateAction=parsed.get("immediateAction", ""),
            followUpNeeded=parsed.get("followUpNeeded", ""),
        )

    async def generate_templates(
        self, request: TemplatesRequest
    ) -> TemplatesResponse:
        user_content = (
            f"Incident details:\n"
            f"Date: {request.date}\n"
            f"Time: {request.time}\n"
            f"Location: {request.location}\n"
            f"Type: {request.incidentType}\n"
            f"Students: {', '.join(request.studentsInvolved)}\n"
            f"Description: {request.description}\n"
            f"Action Taken: {request.immediateAction}\n"
            f"Follow-up: {request.followUpNeeded}\n"
            f"Reported by: {request.reportedBy}"
        )

        result_text = await self._chat_completion(
            TEMPLATES_SYSTEM_PROMPT, user_content
        )
        parsed = json.loads(result_text)

        return TemplatesResponse(
            teacherEmail=parsed.get("teacherEmail", ""),
            parentEmail=parsed.get("parentEmail", ""),
            counselorReferral=parsed.get("counselorReferral", ""),
            principalEmail=parsed.get("principalEmail", ""),
            deanEmail=parsed.get("deanEmail", ""),
            supportStaffEmail=parsed.get("supportStaffEmail", ""),
            hrEmail=parsed.get("hrEmail", ""),
            managerEmail=parsed.get("managerEmail", ""),
            personalContact=parsed.get("personalContact", ""),
        )

    async def refine_incident(self, request: RefineRequest) -> RefineResponse:
        """Conversational refinement of incident data."""
        system_prompt = """You are a K-12 school administration assistant that helps refine incident reports. The user will send you a JSON object of an incident and a message asking for changes. Use the conversation history for context. Return ONLY valid JSON with two keys:
- "updated_incident": the full incident object with any requested changes applied
- "assistant_message": a brief friendly message confirming what you changed

Preserve all fields from the original incident unless the user explicitly asks to change them. If the user asks to clarify, add, or remove something, update the relevant field accordingly."""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in request.conversation_history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": f"Current incident:\n{request.incident_json}\n\nUser request: {request.user_message}"})

        response = await self._client.post(
            "/chat/completions",
            json={
                "model": settings.llm_model,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 2048,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        return RefineResponse(
            updated_incident=parsed.get("updated_incident", {}),
            assistant_message=parsed.get("assistant_message", "I've updated the incident."),
        )

    async def chat(self, request: ChatRequest) -> dict:
        """Generic chat completion — OpenAI-compatible for use in any PNEUOMA app."""
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        body: dict = {
            "model": settings.llm_model,
            "messages": messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        if request.response_format:
            body["response_format"] = request.response_format
        response = await self._client.post("/chat/completions", json=body)
        response.raise_for_status()
        return response.json()