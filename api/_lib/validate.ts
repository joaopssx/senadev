const MAX_NAME_LENGTH = 30
const MAX_MESSAGE_LENGTH = 200
const MAX_LINKS = 1

export type ValidationError =
  'invalid_request' | 'invalid_name' | 'invalid_message' | 'too_many_links'

export type ValidationResult =
  { ok: true; name: string; message: string; token: string } | { ok: false; error: ValidationError }

// Control characters plus the bidirectional overrides that can make text display misleadingly.
const FORBIDDEN_CHARACTERS = /[\p{Cc}\u202A-\u202E\u2066-\u2069]/u
const LINK = /\b(?:https?:\/\/|www\.)\S+/gi

// Line breaks and tabs count as whitespace here, so they collapse instead of being rejected.
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function isValidText(text: string, maxLength: number): boolean {
  return text.length > 0 && text.length <= maxLength && !FORBIDDEN_CHARACTERS.test(text)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function validateEntry(body: unknown): ValidationResult {
  if (!isRecord(body)) return { ok: false, error: 'invalid_request' }
  const { name, message, website, token } = body
  if (typeof name !== 'string' || typeof message !== 'string' || typeof token !== 'string') {
    return { ok: false, error: 'invalid_request' }
  }
  if (website) return { ok: false, error: 'invalid_request' }

  const cleanName = normalize(name)
  const cleanMessage = normalize(message)
  if (!isValidText(cleanName, MAX_NAME_LENGTH)) return { ok: false, error: 'invalid_name' }
  if (!isValidText(cleanMessage, MAX_MESSAGE_LENGTH)) return { ok: false, error: 'invalid_message' }
  if ((cleanMessage.match(LINK) ?? []).length > MAX_LINKS) {
    return { ok: false, error: 'too_many_links' }
  }
  return { ok: true, name: cleanName, message: cleanMessage, token }
}
