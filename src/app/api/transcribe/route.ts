import { transcribeAudio } from '@/lib/ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const arrayBuffer = await audioFile.arrayBuffer()
    const transcript = await transcribeAudio(arrayBuffer, audioFile.type || 'audio/webm')

    return NextResponse.json({ transcript })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transcription failed'
    console.error('Transcription error:', message)

    if (message.includes('not configured')) {
      return NextResponse.json(
        { error: 'AI not configured. Add REPLICATE_API_TOKEN (recommended) or PNEUOMA_AI_URL to your env.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
