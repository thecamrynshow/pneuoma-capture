import { generateTemplates } from '@/lib/ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const incident = await request.json()
    const templates = await generateTemplates(incident)
    return NextResponse.json(templates)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Template generation failed'
    console.error('Template generation error:', message)

    if (message.includes('PNEUOMA_AI_URL')) {
      return NextResponse.json(
        { error: 'PNEUOMA AI service not configured. Please add PNEUOMA_AI_URL to your .env file.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
