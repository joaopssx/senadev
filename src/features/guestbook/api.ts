import type { GuestbookEntry } from '../../types'

const ENDPOINT = '/api/guestbook'

export interface NewEntry {
  name: string
  message: string
  website: string
  token: string
}

export type PostResult = { ok: true; entry: GuestbookEntry } | { ok: false; error: string }

export async function fetchEntries(): Promise<GuestbookEntry[] | null> {
  try {
    const response = await fetch(ENDPOINT)
    return response.ok ? ((await response.json()) as GuestbookEntry[]) : null
  } catch {
    return null
  }
}

export async function postEntry(entry: NewEntry): Promise<PostResult> {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    const data = (await response.json()) as GuestbookEntry & { error: string }
    return response.ok ? { ok: true, entry: data } : { ok: false, error: data.error }
  } catch {
    return { ok: false, error: 'network' }
  }
}
