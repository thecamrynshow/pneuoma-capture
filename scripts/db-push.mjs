#!/usr/bin/env node
/**
 * Run Prisma db push from repo root (fixes "schema.prisma not found" when cwd is wrong).
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/db-push.mjs
 *   npm run db:push   (from repo root, uses .env if present)
 */
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { spawnSync } from 'child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schema = join(root, 'prisma', 'schema.prisma')

if (!existsSync(schema)) {
  console.error('Could not find prisma/schema.prisma at:', schema)
  process.exit(1)
}

// Load .env from repo root if DATABASE_URL not set (no dotenv package required)
if (!process.env.DATABASE_URL) {
  const envPath = join(root, '.env')
  if (existsSync(envPath)) {
    const text = readFileSync(envPath, 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.*)$/)
      if (m) {
        let v = m[1].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1)
        }
        process.env.DATABASE_URL = v
        break
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Use .env in project root or:')
  console.error('  DATABASE_URL="postgresql://..." npm run db:push')
  process.exit(1)
}

const r = spawnSync(
  'npx',
  ['prisma', 'db', 'push', '--schema', schema],
  { cwd: root, stdio: 'inherit', env: process.env, shell: true },
)
process.exit(r.status ?? 1)
