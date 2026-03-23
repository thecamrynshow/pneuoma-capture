#!/usr/bin/env node
/**
 * Migrate users and incidents from VM SQLite (prod.db) to Supabase PostgreSQL.
 *
 * Prerequisites:
 *   1. Start the GCP VM
 *   2. Copy prod.db from the container (see MIGRATE_DATA.md)
 *   3. Set env: SQLITE_PATH, DATABASE_URL (Supabase)
 *
 * Run: SQLITE_PATH=./prod.db node scripts/migrate-to-supabase.mjs
 */

import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const sqlitePath = process.env.SQLITE_PATH || './prod.db'
const legacyPassword = process.env.LEGACY_PASSWORD || 'legacy-view-only-' + Date.now()
const dbUrl = process.env.DATABASE_URL

if (!dbUrl || !dbUrl.startsWith('postgresql')) {
  console.error('Set DATABASE_URL (Supabase PostgreSQL connection string)')
  process.exit(1)
}

const sqlite = new Database(sqlitePath, { readonly: true })
const prisma = new PrismaClient()

const LEGACY_EMAIL = 'legacy-import@pneuoma.local'

async function migrate() {
  console.log('Reading from SQLite:', sqlitePath)
  console.log('Writing to Supabase')
  console.log('')

  // Check if User table exists (schema might be pre-auth)
  const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('User', 'Incident')").all()
  const hasUser = tables.some((t) => t.name === 'User')
  const hasIncident = tables.some((t) => t.name === 'Incident')

  if (!hasIncident) {
    console.error('No Incident table found in SQLite. Is this the correct file?')
    process.exit(1)
  }

  let legacyUserId = null

  if (hasUser) {
    const users = sqlite.prepare('SELECT * FROM User').all()
    console.log(`Found ${users.length} user(s)`)

    for (const u of users) {
      try {
        await prisma.user.upsert({
          where: { id: u.id },
          create: {
            id: u.id,
            email: u.email,
            passwordHash: u.passwordHash,
            name: u.name,
            createdAt: new Date(u.createdAt),
          },
          update: {},
        })
        console.log('  Migrated user:', u.email)
      } catch (err) {
        if (err.code === 'P2002') {
          console.log('  Skipped (exists):', u.email)
        } else throw err
      }
    }
  } else {
    console.log('No User table (pre-auth schema). Creating legacy user for orphaned incidents.')
  }

  // Create legacy user for incidents with null userId
  const existingLegacy = await prisma.user.findUnique({ where: { email: LEGACY_EMAIL } })
  if (existingLegacy) {
    legacyUserId = existingLegacy.id
  } else {
    const hash = await bcrypt.hash(legacyPassword, 12)
    const legacy = await prisma.user.create({
      data: {
        email: LEGACY_EMAIL,
        passwordHash: hash,
        name: 'Legacy Import (pre-auth incidents)',
      },
    })
    legacyUserId = legacy.id
    console.log('Created legacy user for unassigned incidents:', LEGACY_EMAIL)
  }

  const incidents = sqlite.prepare('SELECT * FROM Incident').all()
  console.log(`\nFound ${incidents.length} incident(s)`)

  let migrated = 0
  let skipped = 0

  for (const inc of incidents) {
    try {
      const userId = inc.userId || legacyUserId
      await prisma.incident.create({
        data: {
          id: inc.id,
          createdAt: new Date(inc.createdAt),
          updatedAt: new Date(inc.updatedAt),
          date: new Date(inc.date),
          time: inc.time,
          location: inc.location,
          incidentType: inc.incidentType,
          severity: inc.severity,
          studentsInvolved: inc.studentsInvolved ?? '[]',
          staffInvolved: inc.staffInvolved ?? '[]',
          witnesses: inc.witnesses ?? '[]',
          description: inc.description,
          immediateAction: inc.immediateAction ?? '',
          followUpNeeded: inc.followUpNeeded ?? '',
          deEscalationStrategies: inc.deEscalationStrategies ?? '',
          teacherNotified: !!inc.teacherNotified,
          parentNotified: !!inc.parentNotified,
          counselorNotified: !!inc.counselorNotified,
          principalNotified: !!inc.principalNotified,
          deanNotified: !!inc.deanNotified,
          supportStaffNotified: !!inc.supportStaffNotified,
          hrNotified: !!inc.hrNotified,
          managerNotified: !!inc.managerNotified,
          personalNotified: !!inc.personalNotified,
          studentLabels: inc.studentLabels ?? '{}',
          witnessLabels: inc.witnessLabels ?? '{}',
          mode: inc.mode ?? 'education',
          reportedBy: inc.reportedBy,
          status: inc.status ?? 'open',
          rawTranscript: inc.rawTranscript,
          notes: inc.notes ?? '',
          userId,
        },
      })
      migrated++
      if (migrated % 10 === 0) process.stdout.write('.')
    } catch (err) {
      if (err.code === 'P2002') {
        skipped++
      } else {
        console.error('\nError migrating incident', inc.id, err.message)
      }
    }
  }

  sqlite.close()
  await prisma.$disconnect()

  console.log('\n')
  console.log('Done.')
  console.log(`  Migrated: ${migrated} incidents`)
  if (skipped) console.log(`  Skipped (already exist): ${skipped}`)
  if (legacyUserId && !existingLegacy) {
    console.log(`  Legacy incidents: login as ${LEGACY_EMAIL}`)
    console.log(`  Password: ${legacyPassword}`)
    console.log('  (Change this password after first login)')
  } else if (legacyUserId) {
    console.log(`  Legacy incidents: login as ${LEGACY_EMAIL} (reset password in Supabase if needed)`)
  }
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
