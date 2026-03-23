import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Health check for debugging auth/DB setup.
 * Visit /api/health to verify configuration.
 */
export async function GET() {
  const hasDbUrl = !!process.env.DATABASE_URL
  const hasDirectUrl = !!process.env.DIRECT_URL
  const hasAuthSecret = !!process.env.NEXTAUTH_SECRET
  const hasAuthUrl = !!process.env.NEXTAUTH_URL

  let dbOk = false
  if (hasDbUrl) {
    try {
      await prisma.$connect()
      await prisma.user.count()
      dbOk = true
    } catch (e) {
      console.error('Health check DB error:', e)
    }
  }

  return NextResponse.json({
    ok: hasDbUrl && hasDirectUrl && hasAuthSecret && dbOk,
    config: {
      hasDatabaseUrl: hasDbUrl,
      hasDirectUrl,
      hasNextAuthSecret: hasAuthSecret,
      hasNextAuthUrl: hasAuthUrl,
      nextAuthUrl: hasAuthUrl ? process.env.NEXTAUTH_URL : undefined,
      databaseConnected: dbOk,
    },
  })
}
