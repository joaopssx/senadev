const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const response = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  })
  if (!response.ok) return false
  const result = await response.json<{ success: boolean }>()
  return result.success
}
