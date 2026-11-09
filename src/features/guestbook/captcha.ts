interface TurnstileOptions {
  sitekey: string
  theme: 'dark'
  language: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export interface Captcha {
  getToken: () => string
  reset: () => void
  render: (language: string) => void
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstile(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error()))
    script.onerror = reject
    document.head.append(script)
  })
}

export async function createCaptcha(container: HTMLElement, siteKey: string): Promise<Captcha> {
  const turnstile = await loadTurnstile()
  let token = ''
  let widgetId: string | null = null

  return {
    getToken: () => token,
    reset() {
      token = ''
      if (widgetId) turnstile.reset(widgetId)
    },
    render(language) {
      if (widgetId) turnstile.remove(widgetId)
      token = ''
      const clearToken = () => {
        token = ''
      }
      widgetId = turnstile.render(container, {
        sitekey: siteKey,
        theme: 'dark',
        language,
        callback: (value) => {
          token = value
        },
        'expired-callback': clearToken,
        'error-callback': clearToken,
      })
    },
  }
}
