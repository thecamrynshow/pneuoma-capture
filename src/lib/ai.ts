/**
 * AI layer: Uses Replicate (pay-per-use) when REPLICATE_API_TOKEN is set,
 * otherwise falls back to self-hosted PNEUOMA_AI_URL.
 */
import {
  transcribeAudioReplicate,
  parseTranscriptReplicate,
  generateTemplatesReplicate,
  refineIncidentReplicate,
} from './replicate-ai'

const USE_REPLICATE = !!process.env.REPLICATE_API_TOKEN

function getPneuomaConfig() {
  const url = process.env.PNEUOMA_AI_URL
  const key = process.env.PNEUOMA_AI_KEY
  if (!url) throw new Error('PNEUOMA_AI_URL is not configured.')
  return { url: url.replace(/\/$/, ''), key }
}

// --- Transcription ---
export async function transcribeAudio(audioBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  if (USE_REPLICATE) {
    return transcribeAudioReplicate(audioBuffer, mimeType)
  }
  const { url, key } = getPneuomaConfig()
  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
  const formData = new FormData()
  formData.append('file', new File([audioBuffer], `recording.${ext}`, { type: mimeType }))
  const headers: Record<string, string> = {}
  if (key) headers['X-API-Key'] = key
  const response = await fetch(`${url}/v1/transcribe`, { method: 'POST', headers, body: formData })
  if (!response.ok) throw new Error(`Transcription failed: ${await response.text()}`)
  const data = await response.json()
  return data.text
}

// --- Parse ---
export interface ParsedIncident {
  date: string
  time: string
  location: string
  incidentType: string
  severity: string
  studentsInvolved: string[]
  staffInvolved: string[]
  witnesses: string[]
  description: string
  immediateAction: string
  followUpNeeded: string
}

export async function parseTranscript(transcript: string): Promise<ParsedIncident> {
  if (USE_REPLICATE) {
    return parseTranscriptReplicate(transcript)
  }
  const { url, key } = getPneuomaConfig()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (key) headers['X-API-Key'] = key
  const response = await fetch(`${url}/v1/parse`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ transcript }),
  })
  if (!response.ok) throw new Error(`Parsing failed: ${await response.text()}`)
  return response.json()
}

// --- Templates ---
export interface CommunicationTemplates {
  teacherEmail: string
  parentEmail: string
  counselorReferral: string
  principalEmail: string
  deanEmail: string
  supportStaffEmail: string
  hrEmail: string
  managerEmail: string
  personalContact: string
}

export async function generateTemplates(incident: {
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
}): Promise<CommunicationTemplates> {
  if (USE_REPLICATE) {
    return generateTemplatesReplicate(incident)
  }
  const { url, key } = getPneuomaConfig()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (key) headers['X-API-Key'] = key
  const response = await fetch(`${url}/v1/templates`, { method: 'POST', headers, body: JSON.stringify(incident) })
  if (!response.ok) throw new Error(`Template generation failed: ${await response.text()}`)
  return response.json()
}

// --- Refine ---
export async function refineIncident(
  incidentJson: string,
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<{ updated_incident: Record<string, unknown>; assistant_message: string }> {
  if (USE_REPLICATE) {
    return refineIncidentReplicate(incidentJson, userMessage, conversationHistory)
  }
  const { url, key } = getPneuomaConfig()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (key) headers['X-API-Key'] = key
  const response = await fetch(`${url}/v1/refine`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ incident_json: incidentJson, user_message: userMessage, conversation_history: conversationHistory }),
  })
  if (!response.ok) throw new Error(`Refine failed: ${await response.text()}`)
  return response.json()
}
