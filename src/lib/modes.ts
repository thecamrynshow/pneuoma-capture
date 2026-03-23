export type AppMode = 'education' | 'corporate' | 'individual'

export const MODE_CONFIG: Record<
  AppMode,
  {
    label: string
    subtitle: string
    description: string
    incidentTypes: readonly string[]
    locations: readonly string[]
    templateRoles: readonly string[]
  }
> = {
  education: {
    label: 'Education',
    subtitle: 'K-12 & Campus Admin',
    description: 'Incident documentation, parent communication, compliance reporting',
    incidentTypes: [
      'Physical Altercation',
      'Verbal Altercation',
      'Disruption',
      'Insubordination',
      'Bullying',
      'Vandalism',
      'Theft',
      'Drug/Alcohol',
      'Weapons',
      'Threat',
      'Truancy',
      'Dress Code',
      'Technology Misuse',
      'Other',
    ],
    locations: [
      'Hallway - Main',
      'Hallway - East Wing',
      'Hallway - West Wing',
      'Hallway - Near Gym',
      'Cafeteria',
      'Gymnasium',
      'Playground',
      'Parking Lot',
      'Main Office',
      'Classroom',
      'Restroom',
      'Library',
      'Auditorium',
      'Bus Loading Zone',
      'Stairwell',
      'Entrance - Front',
      'Entrance - Side',
      'Athletic Field',
      'Other',
    ],
    templateRoles: ['teacher', 'parent', 'counselor', 'principal', 'dean', 'supportStaff'],
  },
  corporate: {
    label: 'Corporate',
    subtitle: 'Teams & Management',
    description: 'Workplace reports, HR documentation, stakeholder communication',
    incidentTypes: [
      'Harassment',
      'Discrimination',
      'Workplace Violence',
      'Policy Violation',
      'Performance Issue',
      'Conflict Between Employees',
      'Theft',
      'Safety Incident',
      'Confidentiality Breach',
      'Attendance Issue',
      'Other',
    ],
    locations: [
      'Office - Main',
      'Office - Department',
      'Conference Room',
      'Break Room',
      'Parking Lot',
      'Lobby',
      'Warehouse',
      'Production Floor',
      'Remote / Off-site',
      'Other',
    ],
    templateRoles: ['manager', 'hr', 'supportStaff'],
  },
  individual: {
    label: 'Individual',
    subtitle: 'Personal & Freelance',
    description: 'Quick capture, personal documentation, client communication',
    incidentTypes: [
      'Conflict',
      'Miscommunication',
      'Boundary Violation',
      'Contract Dispute',
      'Safety Concern',
      'Other',
    ],
    locations: [
      'Home',
      'Client Site',
      'Public Space',
      'Vehicle',
      'Other',
    ],
    templateRoles: ['personal'],
  },
}

export const MODE_STORAGE_KEY = 'pneuoma-capture-mode'

export function getStoredMode(): AppMode {
  if (typeof window === 'undefined') return 'education'
  const m = localStorage.getItem(MODE_STORAGE_KEY)
  if (m === 'corporate' || m === 'individual') return m
  return 'education'
}
