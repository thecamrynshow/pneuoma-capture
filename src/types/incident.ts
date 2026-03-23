export interface Incident {
  id: string
  createdAt: string
  updatedAt: string
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
  teacherNotified: boolean
  parentNotified: boolean
  counselorNotified: boolean
  principalNotified: boolean
  deanNotified: boolean
  supportStaffNotified: boolean
  hrNotified: boolean
  managerNotified: boolean
  personalNotified: boolean
  deEscalationStrategies: string
  studentLabels: Record<number, string>
  witnessLabels: Record<number, string>
  mode: string
  reportedBy: string
  status: string
  rawTranscript: string | null
  notes: string
}

export interface IncidentFormData {
  date: string
  time: string
  location: string
  incidentType: string
  severity: string
  studentsInvolved: string[]
  staffInvolved: string[]
  witnesses: string[]
  studentLabels?: Record<number, string>
  witnessLabels?: Record<number, string>
  description: string
  immediateAction: string
  followUpNeeded: string
  deEscalationStrategies?: string
  reportedBy: string
  status: string
  rawTranscript?: string
  notes: string
}

export const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const

export const STATUS_OPTIONS = ['open', 'in-progress', 'resolved', 'closed'] as const
