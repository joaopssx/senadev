import { onLocaleChange, t } from '../../i18n'
import type { TranslationKey } from '../../i18n/en'
import { createElement } from '../../lib/dom'
import { formatGuestbookDate } from '../../lib/format-date'
import type { GuestbookEntry } from '../../types'
import { fetchEntries, postEntry } from './api'
import { createCaptcha, type Captcha } from './captcha'

type ListState = 'loading' | 'ready' | 'failed'

const MAX_ENTRIES = 50
const LOAD_AHEAD_MARGIN = '600px'

const errorKeys: Record<string, TranslationKey> = {
  rate_limited: 'guestbook.error.rateLimited',
  invalid_name: 'guestbook.error.invalidName',
  invalid_message: 'guestbook.error.invalidMessage',
  too_many_links: 'guestbook.error.tooManyLinks',
  captcha_failed: 'guestbook.error.captchaFailed',
  invalid_request: 'guestbook.error.invalidRequest',
}

function createEntryItem(entry: GuestbookEntry): HTMLLIElement {
  const item = createElement('li', 'guestbook__entry')
  item.append(
    createElement('span', 'guestbook__date', `${formatGuestbookDate(entry.created_at)} `),
    createElement('strong', '', `${entry.name}: `),
    entry.message,
  )
  return item
}

function bindCounter(field: HTMLInputElement | HTMLTextAreaElement, counter: Element): () => void {
  const update = () => {
    counter.textContent = `${field.value.length}/${field.maxLength}`
  }
  field.addEventListener('input', update)
  return update
}

export function initGuestbook(): void {
  const section = document.querySelector('#guestbook')
  const form = document.querySelector<HTMLFormElement>('.guestbook__form')
  const list = document.querySelector<HTMLElement>('.guestbook__list')
  const listNote = document.querySelector<HTMLElement>('.guestbook__empty')
  const status = document.querySelector<HTMLElement>('.guestbook__status')
  const button = form?.querySelector<HTMLButtonElement>('button[type="submit"]')
  const slot = document.querySelector<HTMLElement>('.captcha-slot')
  if (!section || !form || !list || !listNote || !status || !button || !slot) return

  const nameField = form.elements.namedItem('name') as HTMLInputElement
  const messageField = form.elements.namedItem('message') as HTMLTextAreaElement
  const honeypot = form.elements.namedItem('website') as HTMLInputElement
  const counters = form.querySelectorAll('.field__count')
  const updateCounters = [
    bindCounter(nameField, counters[0] as Element),
    bindCounter(messageField, counters[1] as Element),
  ]

  let entries: GuestbookEntry[] = []
  let listState: ListState = 'loading'
  let statusKey: TranslationKey | null = null
  let captcha: Captcha | null = null

  function renderList(): void {
    list?.replaceChildren(...entries.map(createEntryItem))
    if (list) list.hidden = entries.length === 0
    if (!listNote) return
    listNote.hidden = entries.length > 0
    if (listState === 'loading') listNote.textContent = t('guestbook.loading')
    if (listState === 'failed') listNote.textContent = t('guestbook.error.load')
    if (listState === 'ready') listNote.textContent = t('guestbook.empty')
  }

  function showStatus(key: TranslationKey | null, isError = false): void {
    statusKey = key
    if (!status) return
    status.textContent = key ? t(key) : ''
    status.classList.toggle('guestbook__status--error', isError)
  }

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault()
    const token = captcha?.getToken()
    if (!token) {
      showStatus('guestbook.error.captchaFailed', true)
      return
    }
    if (!button) return
    button.disabled = true
    showStatus('guestbook.sending')

    const result = await postEntry({
      name: nameField.value,
      message: messageField.value,
      website: honeypot.value,
      token,
    })
    if (result.ok) {
      entries = [result.entry, ...entries].slice(0, MAX_ENTRIES)
      listState = 'ready'
      renderList()
      form?.reset()
      updateCounters.forEach((update) => update())
      showStatus('guestbook.sent')
    } else {
      showStatus(errorKeys[result.error] ?? 'guestbook.error.network', true)
    }
    captcha?.reset()
    button.disabled = false
  }

  async function load(): Promise<void> {
    const loaded = await fetchEntries()
    entries = loaded ?? []
    listState = loaded ? 'ready' : 'failed'
    renderList()

    const siteKey: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey || !slot) return
    try {
      captcha = await createCaptcha(slot, siteKey)
      captcha.render(document.documentElement.lang.toLowerCase())
    } catch {
      showStatus('guestbook.error.captchaUnavailable', true)
    }
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      observer.disconnect()
      void load()
    },
    { rootMargin: LOAD_AHEAD_MARGIN },
  )
  observer.observe(section)

  form.addEventListener('submit', (event) => void submit(event))
  button.disabled = false
  renderList()
  onLocaleChange(() => {
    renderList()
    if (statusKey) status.textContent = t(statusKey)
    captcha?.render(document.documentElement.lang.toLowerCase())
  })
}
