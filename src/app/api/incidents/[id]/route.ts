import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const incident = await prisma.incident.findFirst({
      where: { id, userId },
    })

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...incident,
      studentsInvolved: JSON.parse(incident.studentsInvolved),
      staffInvolved: JSON.parse(incident.staffInvolved),
      witnesses: JSON.parse(incident.witnesses),
      studentLabels: JSON.parse(incident.studentLabels || '{}'),
      witnessLabels: JSON.parse(incident.witnessLabels || '{}'),
    })
  } catch (error) {
    console.error('Failed to fetch incident:', error)
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.date !== undefined) data.date = new Date(body.date)
    if (body.time !== undefined) data.time = body.time
    if (body.location !== undefined) data.location = body.location
    if (body.incidentType !== undefined) data.incidentType = body.incidentType
    if (body.severity !== undefined) data.severity = body.severity
    if (body.studentsInvolved !== undefined) data.studentsInvolved = JSON.stringify(body.studentsInvolved)
    if (body.staffInvolved !== undefined) data.staffInvolved = JSON.stringify(body.staffInvolved)
    if (body.witnesses !== undefined) data.witnesses = JSON.stringify(body.witnesses)
    if (body.description !== undefined) data.description = body.description
    if (body.immediateAction !== undefined) data.immediateAction = body.immediateAction
    if (body.followUpNeeded !== undefined) data.followUpNeeded = body.followUpNeeded
    if (body.teacherNotified !== undefined) data.teacherNotified = body.teacherNotified
    if (body.parentNotified !== undefined) data.parentNotified = body.parentNotified
    if (body.counselorNotified !== undefined) data.counselorNotified = body.counselorNotified
    if (body.principalNotified !== undefined) data.principalNotified = body.principalNotified
    if (body.deanNotified !== undefined) data.deanNotified = body.deanNotified
    if (body.supportStaffNotified !== undefined) data.supportStaffNotified = body.supportStaffNotified
    if (body.hrNotified !== undefined) data.hrNotified = body.hrNotified
    if (body.managerNotified !== undefined) data.managerNotified = body.managerNotified
    if (body.personalNotified !== undefined) data.personalNotified = body.personalNotified
    if (body.deEscalationStrategies !== undefined) data.deEscalationStrategies = body.deEscalationStrategies
    if (body.studentLabels !== undefined) data.studentLabels = JSON.stringify(body.studentLabels)
    if (body.witnessLabels !== undefined) data.witnessLabels = JSON.stringify(body.witnessLabels)
    if (body.mode !== undefined) data.mode = body.mode
    if (body.rawTranscript !== undefined) data.rawTranscript = body.rawTranscript
    if (body.reportedBy !== undefined) data.reportedBy = body.reportedBy
    if (body.status !== undefined) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes

    const incident = await prisma.incident.update({ where: { id }, data })

    return NextResponse.json({
      ...incident,
      studentsInvolved: JSON.parse(incident.studentsInvolved),
      staffInvolved: JSON.parse(incident.staffInvolved),
      witnesses: JSON.parse(incident.witnesses),
      studentLabels: JSON.parse(incident.studentLabels || '{}'),
      witnessLabels: JSON.parse(incident.witnessLabels || '{}'),
    })
  } catch (error) {
    console.error('Failed to update incident:', error)
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.incident.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    await prisma.incident.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete incident:', error)
    return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 })
  }
}
