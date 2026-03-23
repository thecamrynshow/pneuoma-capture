import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const emailLower = email.toLowerCase().trim()
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash,
        name: (name || '').trim() || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup failed:', error)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
