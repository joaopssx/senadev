import type { Repo } from '../src/types.js'

interface GithubRepo {
  name: string
  description: string | null
  language: string | null
  html_url: string
  fork: boolean
  archived: boolean
  stargazers_count: number
  pushed_at: string
}

const GITHUB_REPOS_URL =
  'https://api.github.com/users/joaopssx/repos?per_page=100&type=owner&sort=pushed'
const PROFILE_REPO = 'joaopssx'
const MAX_REPOS = 6
const CACHE_SECONDS = 3600

function toRepos(repos: GithubRepo[]): Repo[] {
  return repos
    .filter((repo) => !repo.fork && !repo.archived && repo.name !== PROFILE_REPO)
    .sort(
      (a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at),
    )
    .slice(0, MAX_REPOS)
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      url: repo.html_url,
    }))
}

export async function GET(): Promise<Response> {
  const token = process.env.GITHUB_TOKEN
  const github = await fetch(GITHUB_REPOS_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'senadev-site',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!github.ok) return Response.json({ error: 'github_unavailable' }, { status: 502 })

  return Response.json(toRepos((await github.json()) as GithubRepo[]), {
    headers: { 'Cache-Control': `public, s-maxage=${CACHE_SECONDS}` },
  })
}
