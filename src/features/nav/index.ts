function setCurrentSection(links: NodeListOf<HTMLAnchorElement>, id: string): void {
  for (const link of links) {
    if (link.hash === `#${id}`) {
      link.setAttribute('aria-current', 'location')
    } else {
      link.removeAttribute('aria-current')
    }
  }
}

function trackCurrentSection(): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('.nav__link, .rail__link')
  // A zero-height band at mid-screen means exactly one section matches at any scroll position.
  const observer = new IntersectionObserver(
    (entries) => {
      const current = entries.find((entry) => entry.isIntersecting)
      if (current) setCurrentSection(links, current.target.id)
    },
    { rootMargin: '-50% 0px -50% 0px' },
  )
  document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section))
}

function closeMenuOnNavigate(): void {
  const menu = document.querySelector<HTMLElement>('#nav-menu')
  menu?.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) menu.hidePopover()
  })
}

export function initNav(): void {
  trackCurrentSection()
  closeMenuOnNavigate()
}
