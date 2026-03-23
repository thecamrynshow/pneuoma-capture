import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { Incident } from '@/types/incident'

const BRAND_COLOR: [number, number, number] = [15, 23, 42]
const ACCENT_COLOR: [number, number, number] = [245, 158, 11]

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(...BRAND_COLOR)
  doc.rect(0, 0, 210, 32, 'F')
  doc.setFillColor(...ACCENT_COLOR)
  doc.rect(0, 32, 210, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('PNEUOMA INCIDENT CAPTURE & CONTAINMENT SYSTEM', 14, 10)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, 22)

  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, 14, 29)
  }

  doc.setTextColor(0, 0, 0)
  return 42
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `CONFIDENTIAL - Generated ${format(new Date(), 'MM/dd/yyyy h:mm a')} - Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    )
  }
}

function addSection(doc: jsPDF, y: number, title: string, content: string, maxWidth = 182): number {
  if (!content) return y
  if (y > 260) { doc.addPage(); y = 20 }

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BRAND_COLOR)
  doc.text(title, 14, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  const lines = doc.splitTextToSize(content, maxWidth)
  doc.text(lines, 14, y)
  y += lines.length * 4 + 6

  return y
}

export function generateIncidentPDF(incident: Incident): jsPDF {
  const doc = new jsPDF()
  const dateStr = format(new Date(incident.date), 'MM/dd/yyyy')

  let y = addHeader(doc, 'Incident Report', `ID: ${incident.id.slice(0, 8)}... | ${dateStr} ${incident.time}`)

  autoTable(doc, {
    startY: y,
    body: [
      ['Date', dateStr, 'Time', incident.time],
      ['Location', incident.location, 'Type', incident.incidentType],
      ['Severity', incident.severity, 'Status', incident.status.toUpperCase()],
      ['Reported By', incident.reportedBy, '', ''],
    ],
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 30, textColor: BRAND_COLOR },
      2: { fontStyle: 'bold', cellWidth: 30, textColor: BRAND_COLOR },
    },
  })

  y = (doc as unknown as Record<string, { finalY: number }>).lastAutoTable.finalY + 8

  if (incident.studentsInvolved.length > 0) {
    const sLabels = incident.studentLabels || {}
    const studentDisplay = incident.studentsInvolved.map((_, i) =>
      sLabels[i] ?? `Student ${String.fromCharCode(65 + i)}`
    )
    y = addSection(doc, y, 'Students Involved', studentDisplay.join(', '))
  }
  if (incident.staffInvolved.length > 0) {
    y = addSection(doc, y, 'Staff Involved', incident.staffInvolved.join(', '))
  }
  if (incident.witnesses.length > 0) {
    const wLabels = incident.witnessLabels || {}
    const offset = incident.studentsInvolved.length
    const witnessDisplay = incident.witnesses.map((_, i) =>
      wLabels[i] ?? `Student ${String.fromCharCode(65 + offset + i)}`
    )
    y = addSection(doc, y, 'Witnesses', witnessDisplay.join(', '))
  }

  y = addSection(doc, y, 'Incident Description', incident.description)
  y = addSection(doc, y, 'Immediate Action Taken', incident.immediateAction)
  y = addSection(doc, y, 'Follow-Up Required', incident.followUpNeeded)

  if (incident.deEscalationStrategies) {
    y = addSection(doc, y, 'De-Escalation Strategies', incident.deEscalationStrategies)
  }

  if (incident.notes) {
    y = addSection(doc, y, 'Additional Notes', incident.notes)
  }

  const comms: string[] = []
  if (incident.teacherNotified) comms.push('Teacher')
  if (incident.parentNotified) comms.push('Parent')
  if (incident.counselorNotified) comms.push('Counselor')
  if (incident.principalNotified) comms.push('Principal')
  if (incident.deanNotified) comms.push('Dean')
  if (incident.supportStaffNotified) comms.push('Support Staff')
  if (incident.hrNotified) comms.push('HR')
  if (incident.managerNotified) comms.push('Manager')
  if (incident.personalNotified) comms.push('Personal Contact')
  if (comms.length > 0) {
    addSection(doc, y, 'Communications Sent', comms.join(' | '))
  }

  addFooter(doc)
  return doc
}

export function generateDailyReport(incidents: Incident[], date: string): jsPDF {
  const doc = new jsPDF()
  const dateStr = format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')

  let y = addHeader(doc, 'Daily Incident Report', dateStr)

  const severityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 }
  const statusCounts = { open: 0, 'in-progress': 0, resolved: 0, closed: 0 }
  const typeCounts: Record<string, number> = {}

  incidents.forEach((inc) => {
    severityCounts[inc.severity as keyof typeof severityCounts] =
      (severityCounts[inc.severity as keyof typeof severityCounts] || 0) + 1
    statusCounts[inc.status as keyof typeof statusCounts] =
      (statusCounts[inc.status as keyof typeof statusCounts] || 0) + 1
    typeCounts[inc.incidentType] = (typeCounts[inc.incidentType] || 0) + 1
  })

  autoTable(doc, {
    startY: y,
    head: [['Summary', '', '', '']],
    body: [
      ['Total Incidents', String(incidents.length), 'Open', String(statusCounts.open)],
      ['In Progress', String(statusCounts['in-progress']), 'Resolved', String(statusCounts.resolved + statusCounts.closed)],
      ['High/Critical', String(severityCounts.High + severityCounts.Critical), 'Low/Medium', String(severityCounts.Low + severityCounts.Medium)],
    ],
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLOR, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      2: { fontStyle: 'bold' },
    },
  })

  y = (doc as unknown as Record<string, { finalY: number }>).lastAutoTable.finalY + 8

  autoTable(doc, {
    startY: y,
    head: [['#', 'Time', 'Type', 'Location', 'Severity', 'Students', 'Status']],
    body: incidents.map((inc, i) => [
      String(i + 1),
      inc.time,
      inc.incidentType,
      inc.location,
      inc.severity,
      (() => {
        const sLabels = inc.studentLabels || {}
        return inc.studentsInvolved.map((_, i) => sLabels[i] ?? `Student ${String.fromCharCode(65 + i)}`).join(', ')
      })(),
      inc.status,
    ]),
    theme: 'striped',
    headStyles: { fillColor: BRAND_COLOR, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = String((data.row.raw as string[])?.[4] ?? '')
        if (val === 'Critical') data.cell.styles.textColor = [220, 38, 38]
        else if (val === 'High') data.cell.styles.textColor = [234, 88, 12]
      }
    },
  })

  y = (doc as unknown as Record<string, { finalY: number }>).lastAutoTable.finalY + 12

  incidents.forEach((inc, i) => {
    if (y > 245) { doc.addPage(); y = 20 }

    doc.setFillColor(248, 250, 252)
    doc.rect(14, y - 4, 182, 8, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BRAND_COLOR)
    doc.text(`Incident ${i + 1}: ${inc.incidentType} — ${inc.severity}`, 16, y + 1)
    y += 10

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`${inc.time} | ${inc.location} | Reported by: ${inc.reportedBy}`, 14, y)
    y += 5

    if (inc.studentsInvolved.length > 0) {
      const sLabels = inc.studentLabels || {}
      const studentDisplay = inc.studentsInvolved.map((_, si) => sLabels[si] ?? `Student ${String.fromCharCode(65 + si)}`).join(', ')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text('Students: ', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(studentDisplay, 14 + doc.getTextWidth('Students: '), y)
      y += 5
    }

    doc.setTextColor(40, 40, 40)
    doc.setFontSize(8.5)
    const descLines = doc.splitTextToSize(inc.description, 182)
    doc.text(descLines, 14, y)
    y += descLines.length * 3.5 + 3

    if (inc.immediateAction) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(8)
      doc.text('Action: ', 14, y)
      doc.setFont('helvetica', 'normal')
      const actionLines = doc.splitTextToSize(inc.immediateAction, 170)
      doc.text(actionLines, 14 + doc.getTextWidth('Action: '), y)
      y += actionLines.length * 3.5 + 3
    }

    if (inc.followUpNeeded) {
      doc.setFont('helvetica', 'bold')
      doc.text('Follow-up: ', 14, y)
      doc.setFont('helvetica', 'normal')
      const followLines = doc.splitTextToSize(inc.followUpNeeded, 166)
      doc.text(followLines, 14 + doc.getTextWidth('Follow-up: '), y)
      y += followLines.length * 3.5 + 3
    }

    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(14, y, 196, y)
    y += 8
  })

  addFooter(doc)
  return doc
}

export function generateClipboardText(incident: Incident): string {
  const dateStr = format(new Date(incident.date), 'MM/dd/yyyy')
  return [
    '═══════════════════════════════════════',
    'INCIDENT REPORT',
    '═══════════════════════════════════════',
    `Date: ${dateStr}`,
    `Time: ${incident.time}`,
    `Location: ${incident.location}`,
    `Type: ${incident.incidentType}`,
    `Severity: ${incident.severity}`,
    `Status: ${incident.status.toUpperCase()}`,
    '',
    `Students Involved: ${incident.studentsInvolved.length > 0
      ? incident.studentsInvolved.map((_, i) => (incident.studentLabels || {})[i] ?? `Student ${String.fromCharCode(65 + i)}`).join(', ')
      : 'N/A'}`,
    `Staff Involved: ${incident.staffInvolved.join(', ') || 'N/A'}`,
    `Witnesses: ${incident.witnesses.length > 0
      ? incident.witnesses.map((_, i) => (incident.witnessLabels || {})[i] ?? `Student ${String.fromCharCode(65 + incident.studentsInvolved.length + i)}`).join(', ')
      : 'N/A'}`,
    '',
    'DESCRIPTION:',
    incident.description,
    '',
    'IMMEDIATE ACTION:',
    incident.immediateAction || 'N/A',
    '',
    'FOLLOW-UP NEEDED:',
    incident.followUpNeeded || 'N/A',
    '',
    incident.deEscalationStrategies ? `DE-ESCALATION STRATEGIES:\n${incident.deEscalationStrategies}\n` : '',
    incident.notes ? `NOTES:\n${incident.notes}\n` : '',
    `Reported By: ${incident.reportedBy}`,
    '═══════════════════════════════════════',
  ].filter(Boolean).join('\n')
}
