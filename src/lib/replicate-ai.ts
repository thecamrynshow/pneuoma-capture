/**
 * Replicate-powered AI (Whisper + Llama) — pay-per-use, no VM needed.
 * Set REPLICATE_API_TOKEN to use. Falls back to PNEUOMA_AI_URL when not set.
 */
import Replicate from 'replicate'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

const WHISPER_MODEL = 'openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e'
const LLAMA_MODEL = 'meta/meta-llama-3-8b-instruct'

function getToday() {
  return new Date().toISOString().split('T')[0]
}

export async function transcribeAudioReplicate(
  audioBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const base64 = Buffer.from(audioBuffer).toString('base64')
  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
  const dataUri = `data:audio/${ext};base64,${base64}`

  const output = await replicate.run(WHISPER_MODEL, {
    input: { audio: dataUri },
  })

  if (typeof output === 'string') return output
  const o = output as Record<string, unknown>
  if (o.transcription && typeof o.transcription === 'string') return o.transcription
  if (o.text && typeof o.text === 'string') return o.text
  const segs = o.segments as Array<{ text?: string }> | undefined
  if (segs?.length) return segs.map((s) => s.text || '').join(' ').trim()
  return ''
}

const PARSE_SYSTEM = `You are a K-12 school administration assistant that converts voice notes about incidents into structured data. Extract all available information. Use today's date ({today}) if no date is mentioned. Estimate time from context clues if not explicitly stated.

Return ONLY valid JSON:
{
  "date": "YYYY-MM-DD",
  "time": "H:MM AM/PM",
  "location": "specific location in school",
  "incidentType": "one of: Physical Altercation, Verbal Altercation, Disruption, Insubordination, Bullying, Vandalism, Theft, Drug/Alcohol, Weapons, Threat, Truancy, Dress Code, Technology Misuse, Other",
  "severity": "one of: Low, Medium, High, Critical",
  "studentsInvolved": ["full names if given"],
  "staffInvolved": ["staff names mentioned"],
  "witnesses": ["witness names if mentioned"],
  "description": "clear factual summary",
  "immediateAction": "actions already taken or empty string",
  "followUpNeeded": "next steps or empty string"
}`

const TEMPLATES_SYSTEM = `You are a school administrator assistant. Generate professional, legally safe communication templates. Use neutral, factual language. Never assign blame. Return ONLY valid JSON with all fields (use "" for roles not needed):
{
  "teacherEmail": "Subject: ...\\n\\n[body]",
  "parentEmail": "Subject: ...\\n\\n[body]",
  "counselorReferral": "COUNSELOR REFERRAL\\n\\n[content]",
  "principalEmail": "Subject: ...\\n\\n[body]",
  "deanEmail": "Subject: ...\\n\\n[body]",
  "supportStaffEmail": "Subject: ...\\n\\n[body]",
  "hrEmail": "Subject: ...\\n\\n[body]",
  "managerEmail": "Subject: ...\\n\\n[body]",
  "personalContact": "[personal documentation text]"
}`

export async function parseTranscriptReplicate(transcript: string) {
  const system = PARSE_SYSTEM.replace('{today}', getToday())
  const prompt = `[System instructions]\n${system}\n\n[User transcript to parse]\n${transcript}`
  const output = await replicate.run(LLAMA_MODEL, {
    input: {
      prompt,
      max_tokens: 1024,
      temperature: 0.1,
    },
  })

  const text = Array.isArray(output) ? output.join('') : typeof output === 'string' ? output : String(output)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  const now = new Date()
  return {
    date: parsed.date || getToday(),
    time: parsed.time || now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    location: parsed.location || '',
    incidentType: parsed.incidentType || 'Other',
    severity: parsed.severity || 'Medium',
    studentsInvolved: parsed.studentsInvolved || [],
    staffInvolved: parsed.staffInvolved || [],
    witnesses: parsed.witnesses || [],
    description: parsed.description || transcript,
    immediateAction: parsed.immediateAction || '',
    followUpNeeded: parsed.followUpNeeded || '',
  }
}

export async function generateTemplatesReplicate(incident: {
  date: string
  time: string
  location: string
  incidentType: string
  studentsInvolved: string[]
  description: string
  immediateAction: string
  followUpNeeded: string
  reportedBy: string
  mode?: string
}) {
  const user = `Incident details:
Date: ${incident.date}
Time: ${incident.time}
Location: ${incident.location}
Type: ${incident.incidentType}
Students: ${incident.studentsInvolved.join(', ')}
Description: ${incident.description}
Action Taken: ${incident.immediateAction}
Follow-up: ${incident.followUpNeeded}
Reported by: ${incident.reportedBy}`

  const prompt = `[System instructions]\n${TEMPLATES_SYSTEM}\n\n[Incident details]\n${user}`
  const output = await replicate.run(LLAMA_MODEL, {
    input: {
      prompt,
      max_tokens: 2048,
      temperature: 0.2,
    },
  })

  const text = Array.isArray(output) ? output.join('') : typeof output === 'string' ? output : String(output)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

  return {
    teacherEmail: parsed.teacherEmail || '',
    parentEmail: parsed.parentEmail || '',
    counselorReferral: parsed.counselorReferral || '',
    principalEmail: parsed.principalEmail || '',
    deanEmail: parsed.deanEmail || '',
    supportStaffEmail: parsed.supportStaffEmail || '',
    hrEmail: parsed.hrEmail || '',
    managerEmail: parsed.managerEmail || '',
    personalContact: parsed.personalContact || '',
  }
}

export async function refineIncidentReplicate(
  incidentJson: string,
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
) {
  const system = `You are a K-12 school administration assistant that helps refine incident reports. The user will send you a JSON object of an incident and a message asking for changes. Return ONLY valid JSON with two keys:
- "updated_incident": the full incident object with any requested changes applied
- "assistant_message": a brief friendly message confirming what you changed

Preserve all fields from the original unless the user explicitly asks to change them.`

  let prompt = `Current incident:\n${incidentJson}\n\nUser request: ${userMessage}`
  if (conversationHistory.length > 0) {
    prompt =
      'Previous context:\n' +
      conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n') +
      '\n\n' +
      prompt
  }

  const fullPrompt = `[System instructions]\n${system}\n\n[Request]\n${prompt}`
  const output = await replicate.run(LLAMA_MODEL, {
    input: {
      prompt: fullPrompt,
      max_tokens: 2048,
      temperature: 0.2,
    },
  })

  const text = Array.isArray(output) ? output.join('') : typeof output === 'string' ? output : String(output)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  return {
    updated_incident: parsed.updated_incident || {},
    assistant_message: parsed.assistant_message || "I've updated the incident.",
  }
}
