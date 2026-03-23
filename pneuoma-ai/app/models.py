from pydantic import BaseModel


class TranscribeResponse(BaseModel):
    text: str


class ParseRequest(BaseModel):
    transcript: str


class ParseResponse(BaseModel):
    date: str
    time: str
    location: str
    incidentType: str
    severity: str
    studentsInvolved: list[str]
    staffInvolved: list[str]
    witnesses: list[str]
    description: str
    immediateAction: str
    followUpNeeded: str


class TemplatesRequest(BaseModel):
    date: str
    time: str
    location: str
    incidentType: str
    studentsInvolved: list[str]
    description: str
    immediateAction: str
    followUpNeeded: str
    reportedBy: str
    mode: str = "education"


class TemplatesResponse(BaseModel):
    teacherEmail: str = ""
    parentEmail: str = ""
    counselorReferral: str = ""
    principalEmail: str = ""
    deanEmail: str = ""
    supportStaffEmail: str = ""
    hrEmail: str = ""
    managerEmail: str = ""
    personalContact: str = ""


class RefineRequest(BaseModel):
    incident_json: str
    user_message: str
    conversation_history: list[dict[str, str]] = []


class RefineResponse(BaseModel):
    updated_incident: dict
    assistant_message: str


class ChatMessage(BaseModel):
    role: str  # "system", "user", "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str | None = None  # ignored, uses configured LLM
    temperature: float = 0.7
    max_tokens: int = 2048
    response_format: dict | None = None  # e.g. {"type": "json_object"}
