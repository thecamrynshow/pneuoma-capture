import { refineIncident } from '@/lib/ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { incidentJson, userMessage, conversationHistory } = await request.json()

    if (!incidentJson || !userMessage) {
      return NextResponse.json(
        { error: 'incidentJson and userMessage are required' },
        { status: 400 }
      )
    }

    const result = await refineIncident(
      incidentJson,
      userMessage,
      conversationHistory || []
    )
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refine failed'
    console.error('Refine error:', message)

    if (message.includes('PNEUOMA_AI_URL')) {
      return NextResponse.json(
        {
          error:
            'PNEUOMA AI service not configured. Please add PNEUOMA_AI_URL to your .env file.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
