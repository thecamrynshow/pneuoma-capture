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

// Load .env from repo root if vars missing (no dotenv package required)
function loadEnvVar(name) {
  if (process.env[name]) return
  const envPath = join(root, '.env')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split('\n')) {
    const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*)$`))
    if (m) {
      let v = m[1].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      process.env[name] = v
      return
    }
  }
}

loadEnvVar('DATABASE_URL')
loadEnvVar('DIRECT_URL')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Use .env in project root or:')
  console.error('  DATABASE_URL="postgresql://..." npm run db:push')
  process.exit(1)
}

// prisma db push uses DIRECT_URL when set; fallback to DATABASE_URL for local direct-only setups
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL
}

const r = spawnSync(
  'npx',
  ['prisma', 'db', 'push', '--schema', schema],
  { cwd: root, stdio: 'inherit', env: process.env, shell: true },
)
process.exit(r.status ?? 1)
