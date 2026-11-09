export interface Repo {
  name: string
  description: string | null
  language: string | null
  url: string
}

export interface GuestbookEntry {
  id: number
  name: string
  message: string
  created_at: string
}
