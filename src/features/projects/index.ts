import { fallbackRepos, repoDescriptions } from '../../data/projects'
import { getLocale, onLocaleChange, t } from '../../i18n'
import { createElement } from '../../lib/dom'
import type { Repo } from '../../types'

async function loadRepos(): Promise<Repo[]> {
  try {
    const response = await fetch('/api/repos')
    if (!response.ok) return fallbackRepos
    const repos: unknown = await response.json()
    return Array.isArray(repos) && repos.length > 0 ? (repos as Repo[]) : fallbackRepos
  } catch {
    return fallbackRepos
  }
}

function describe(repo: Repo): string {
  return (
    repoDescriptions[repo.name]?.[getLocale()] ?? repo.description ?? t('projects.noDescription')
  )
}

function createCard(repo: Repo): HTMLElement {
  const card = createElement('article', 'project-card glass')
  const link = createElement('a', 'project-card__link', t('projects.viewRepo'))
  link.href = repo.url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'

  card.append(
    createElement('h3', 'project-card__name', repo.name),
    createElement('p', 'project-card__description', describe(repo)),
  )
  if (repo.language) card.append(createElement('p', 'project-card__tech', repo.language))
  card.append(link)
  return card
}

export async function initProjects(): Promise<void> {
  const grid = document.querySelector('.projects__grid')
  if (!grid) return

  const repos = await loadRepos()
  const render = () => grid.replaceChildren(...repos.map(createCard))
  render()
  grid.removeAttribute('aria-busy')
  onLocaleChange(render)
}
