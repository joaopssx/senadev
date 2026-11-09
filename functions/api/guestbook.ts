import type { GuestbookEntry } from '../../src/types'
import { hashIp } from './_lib/hash-ip'
import { verifyTurnstile } from './_lib/turnstile'
import { validateEntry } from './_lib/validate'

interface Env {
  DB: D1Database
  TURNSTILE_SECRET_KEY: string
  IP_HASH_SALT: string
}

const MAX_BODY_BYTES = 4096
const MAX_ENTRIES = 50
const MAX_PER_HOUR = 3

const SELECT_ENTRIES = `
  SELECT id, name, message, created_at FROM guestbook
  WHERE hidden = 0
  ORDER BY created_at DESC, id DESC
  LIMIT ?`

// The limit lives inside the INSERT so simultaneous requests can't slip past a separate count.
const INSERT_IF_UNDER_LIMIT = `
  INSERT INTO guestbook (name, message, created_at, ip_hash)
  SELECT ?1, ?2, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), ?3
  WHERE (
    SELECT COUNT(*) FROM guestbook
    WHERE ip_hash = ?3 AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')
  ) < ?4
  RETURNING id, name, message, created_at`

// The hash only matters during the rate limit window, so older ones are dropped (LGPD).
const CLEAR_OLD_HASHES = `
  UPDATE guestbook SET ip_hash = ''
  WHERE ip_hash <> '' AND created_at <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')`

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

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(SELECT_ENTRIES).bind(MAX_ENTRIES).all<GuestbookEntry>()
  return Response.json(results, { headers: { 'Cache-Control': 'no-store' } })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const parsed = await readJson(request)
  if (parsed instanceof Response) return parsed

  const entry = validateEntry(parsed.body)
  if (!entry.ok) return errorResponse(entry.error, 400)

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
  if (!(await verifyTurnstile(entry.token, env.TURNSTILE_SECRET_KEY, ip))) {
    return errorResponse('captcha_failed', 403)
  }

  const created = await env.DB.prepare(INSERT_IF_UNDER_LIMIT)
    .bind(entry.name, entry.message, await hashIp(ip, env.IP_HASH_SALT), MAX_PER_HOUR)
    .first<GuestbookEntry>()
  if (!created) return errorResponse('rate_limited', 429)

  waitUntil(env.DB.prepare(CLEAR_OLD_HASHES).run())
  return Response.json(created, { status: 201 })
}
