import { neon } from '@neondatabase/serverless'
import type { GuestbookEntry } from '../src/types.js'
import { requireEnv } from './_lib/env.js'
import { hashIp } from './_lib/hash-ip.js'
import { verifyTurnstile } from './_lib/turnstile.js'
import { validateEntry } from './_lib/validate.js'

const MAX_BODY_BYTES = 4096
const MAX_ENTRIES = 50
const MAX_PER_HOUR = 3

function errorResponse(error: string, status: number): Response {
  return Response.json({ error }, { status })
}

async function readJson(request: Request): Promise<{ body: unknown } | Response> {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return errorResponse('invalid_request', 415)
  }
  if (Number(request.headers.get('Content-Length')) > MAX_BODY_BYTES) {
    return errorResponse('invalid_request', 413)
  }
  const text = await request.text()
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    return errorResponse('invalid_request', 413)
  }
  try {
    return { body: JSON.parse(text) as unknown }
  } catch {
    return errorResponse('invalid_request', 400)
  }
}

// Postgres runs concurrent statements side by side, so the lock makes requests from the same
// visitor wait for each other. Without it, two of them could both pass the hourly count.
async function insertUnderLimit(
  name: string,
  message: string,
  ipHash: string,
): Promise<GuestbookEntry | undefined> {
  const sql = neon(requireEnv('DATABASE_URL'))
  const [, inserted] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${ipHash}::text, 0))`,
    sql`
      INSERT INTO guestbook (name, message, ip_hash)
      SELECT ${name}::text, ${message}::text, ${ipHash}::text
      WHERE (
        SELECT COUNT(*) FROM guestbook
        WHERE ip_hash = ${ipHash}::text AND created_at > now() - interval '1 hour'
      ) < ${MAX_PER_HOUR}::int
      RETURNING id, name, message, created_at`,
    // The hash only matters during the rate limit window, so older ones are dropped (LGPD).
    sql`
      UPDATE guestbook SET ip_hash = ''
      WHERE ip_hash <> '' AND created_at <= now() - interval '1 hour'`,
  ])
  return (inserted as GuestbookEntry[])[0]
}

export async function GET(): Promise<Response> {
  const sql = neon(requireEnv('DATABASE_URL'))
  const entries = await sql`
    SELECT id, name, message, created_at FROM guestbook
    WHERE hidden = 0
    ORDER BY created_at DESC, id DESC
    LIMIT ${MAX_ENTRIES}`
  return Response.json(entries, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request): Promise<Response> {
  const parsed = await readJson(request)
  if (parsed instanceof Response) return parsed

  const entry = validateEntry(parsed.body)
  if (!entry.ok) return errorResponse(entry.error, 400)

  const ip = request.headers.get('x-real-ip') ?? 'unknown'
  if (!(await verifyTurnstile(entry.token, requireEnv('TURNSTILE_SECRET_KEY'), ip))) {
    return errorResponse('captcha_failed', 403)
  }

  const ipHash = await hashIp(ip, requireEnv('IP_HASH_SALT'))
  const created = await insertUnderLimit(entry.name, entry.message, ipHash)
  if (!created) return errorResponse('rate_limited', 429)

  return Response.json(created, { status: 201 })
}
