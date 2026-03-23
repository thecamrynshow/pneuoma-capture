import { parseTranscript } from '@/lib/ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }

    const parsed = await parseTranscript(transcript)
    return NextResponse.json(parsed)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Parsing failed'
    console.error('Parse error:', message)

    if (message.includes('PNEUOMA_AI_URL')) {
      return NextResponse.json(
        { error: 'PNEUOMA AI service not configured. Please add PNEUOMA_AI_URL to your .env file.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
