import type { Repo } from '../types'

interface LocalizedText {
  en: string
  pt: string
}

const repoUrl = (name: string) => `https://github.com/joaopssx/${name}`

// GitHub only stores one description per repository, so the translated ones live here.
export const repoDescriptions: Record<string, LocalizedText> = {
  'spike-compiler': { en: 'A compiler for Portugol.', pt: 'Compilador de Portugol.' },
  pulse: {
    en: 'Distributed services monitoring system.',
    pt: 'Sistema de monitoramento de serviços distribuídos.',
  },
  goleiro: { en: 'Brazilian CPF API.', pt: 'API de CPF brasileiro.' },
  ponto: { en: 'Worked hours tracking system.', pt: 'Sistema de controle de horas trabalhadas.' },
  amortizacao: {
    en: 'Calculates loan amortization.',
    pt: 'Programa que calcula amortização de empréstimos.',
  },
  'bunhttp-cache': { en: 'HTTP cache for Bun.', pt: 'Cache HTTP para Bun.' },
  url: { en: 'URL shortener.', pt: 'Encurtador de URL.' },
}

export const fallbackRepos: Repo[] = [
  { name: 'spike-compiler', description: null, language: 'C++', url: repoUrl('spike-compiler') },
  { name: 'pulse', description: null, language: 'Go', url: repoUrl('pulse') },
  { name: 'goleiro', description: null, language: 'Go', url: repoUrl('goleiro') },
  { name: 'ponto', description: null, language: 'COBOL', url: repoUrl('ponto') },
  { name: 'amortizacao', description: null, language: 'COBOL', url: repoUrl('amortizacao') },
  {
    name: 'bunhttp-cache',
    description: null,
    language: 'TypeScript',
    url: repoUrl('bunhttp-cache'),
  },
]
