import { en, type TranslationKey } from './en'
import { pt } from './pt'

type Locale = 'en' | 'pt'

const STORAGE_KEY = 'locale'
const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, pt }
const htmlLang: Record<Locale, string> = { en: 'en', pt: 'pt-BR' }

let locale: Locale = 'en'
const localeListeners: Array<() => void> = []

export function onLocaleChange(listener: () => void): void {
  localeListeners.push(listener)
}

export function t(key: TranslationKey): string {
  return dictionaries[locale][key]
}

// Storage access throws when the browser blocks site data.
function readSavedLocale(): Locale {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'pt' ? 'pt' : 'en'
  } catch {
    return 'en'
  }
}

function saveLocale(value: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    return
  }
}

function applyTranslations(): void {
  document.documentElement.lang = htmlLang[locale]
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.getAttribute('data-i18n') as TranslationKey)
  }
  for (const element of document.querySelectorAll('[data-i18n-label]')) {
    element.setAttribute('aria-label', t(element.getAttribute('data-i18n-label') as TranslationKey))
  }
}

function toggleLocale(): void {
  locale = locale === 'en' ? 'pt' : 'en'
  saveLocale(locale)
  applyTranslations()
  localeListeners.forEach((listener) => listener())
}

export function initI18n(): void {
  locale = readSavedLocale()
  applyTranslations()
  document.querySelector('.nav__lang')?.addEventListener('click', toggleLocale)
}
