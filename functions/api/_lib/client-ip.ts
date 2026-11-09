const encoder = new TextEncoder()

function matchesSecret(value: string | null, secret: string | undefined): boolean {
  if (!value || !secret) return false
  const received = encoder.encode(value)
  const expected = encoder.encode(secret)
  return (
    received.byteLength === expected.byteLength && crypto.subtle.timingSafeEqual(received, expected)
  )
}

// Behind the Vercel rewrite, CF-Connecting-IP is Vercel's address. x-real-ip is only trusted
// with the shared secret, otherwise anyone calling the API directly could fake their IP.
export function getClientIp(request: Request, originSecret: string | undefined): string {
  const headers = request.headers
  const proxiedIp = matchesSecret(headers.get('x-origin-secret'), originSecret)
    ? headers.get('x-real-ip')
    : null
  return proxiedIp ?? headers.get('CF-Connecting-IP') ?? 'unknown'
}
