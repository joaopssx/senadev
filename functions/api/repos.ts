import type { Repo } from '../../src/types'

interface Env {
  GITHUB_TOKEN?: string
}

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

async function fetchGithubRepos(token: string | undefined): Promise<Response> {
  return fetch(GITHUB_REPOS_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'senadev-site',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cacheKey = new Request(context.request.url)
  const cached = await caches.default.match(cacheKey)
  if (cached) return cached

  const github = await fetchGithubRepos(context.env.GITHUB_TOKEN)
  if (!github.ok) return Response.json({ error: 'github_unavailable' }, { status: 502 })

  const response = Response.json(toRepos(await github.json<GithubRepo[]>()), {
    headers: { 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
  })
  context.waitUntil(caches.default.put(cacheKey, response.clone()))
  return response
}
