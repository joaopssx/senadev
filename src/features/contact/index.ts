import { t } from '../../i18n'

const EMAIL = 'joaopdssx@gmail.com'
const COPIED_MS = 2000

export function initContact(): void {
  const button = document.querySelector<HTMLButtonElement>('.contact__copy')
  if (!button) return

  let resetTimer = 0
  button.addEventListener('click', () => {
    // writeText rejects when the browser denies clipboard access; the mailto link still works.
    navigator.clipboard.writeText(EMAIL).then(
      () => {
        button.textContent = t('contact.copied')
        clearTimeout(resetTimer)
        resetTimer = window.setTimeout(() => {
          button.textContent = t('contact.copy')
        }, COPIED_MS)
      },
      () => undefined,
    )
  })
}
