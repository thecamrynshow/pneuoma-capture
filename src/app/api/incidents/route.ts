import { prisma } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { userId }

    if (date) {
      const start = new Date(date + 'T00:00:00')
      const end = new Date(date + 'T23:59:59.999')
      where.date = { gte: start, lte: end }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    let parsed = incidents.map((i) => ({
      ...i,
      studentsInvolved: JSON.parse(i.studentsInvolved),
      staffInvolved: JSON.parse(i.staffInvolved),
      witnesses: JSON.parse(i.witnesses),
      studentLabels: JSON.parse(i.studentLabels || '{}'),
      witnessLabels: JSON.parse(i.witnessLabels || '{}'),
    }))

    if (search) {
      const q = search.toLowerCase()
      parsed = parsed.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.studentsInvolved.some((s: string) => s.toLowerCase().includes(q)) ||
          i.staffInvolved.some((s: string) => s.toLowerCase().includes(q)) ||
          i.location.toLowerCase().includes(q) ||
          i.incidentType.toLowerCase().includes(q)
      )
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Failed to fetch incidents:', error)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.description || !body.reportedBy) {
      return NextResponse.json({ error: 'Description and reporter are required' }, { status: 400 })
    }

    const incident = await prisma.incident.create({
      data: {
        userId,
        date: new Date(body.date),
        time: body.time,
        location: body.location,
        incidentType: body.incidentType,
        severity: body.severity || 'Medium',
        studentsInvolved: JSON.stringify(body.studentsInvolved || []),
        staffInvolved: JSON.stringify(body.staffInvolved || []),
        witnesses: JSON.stringify(body.witnesses || []),
        description: body.description,
        immediateAction: body.immediateAction || '',
        followUpNeeded: body.followUpNeeded || '',
        deEscalationStrategies: body.deEscalationStrategies || '',
        studentLabels: JSON.stringify(body.studentLabels || {}),
        witnessLabels: JSON.stringify(body.witnessLabels || {}),
        mode: body.mode || 'education',
        reportedBy: body.reportedBy,
        status: body.status || 'open',
        rawTranscript: body.rawTranscript || null,
        notes: body.notes || '',
      },
    })

    return NextResponse.json({
      ...incident,
      studentsInvolved: JSON.parse(incident.studentsInvolved),
      staffInvolved: JSON.parse(incident.staffInvolved),
      witnesses: JSON.parse(incident.witnesses),
      studentLabels: JSON.parse(incident.studentLabels || '{}'),
      witnessLabels: JSON.parse(incident.witnessLabels || '{}'),
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create incident:', error)
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}
