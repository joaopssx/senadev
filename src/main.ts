import { initI18n } from './i18n'
import { initAbout } from './features/about'
import { initBlobs } from './features/blob'
import { initNav } from './features/nav'

initI18n()
initNav()
initAbout()
initBlobs()
void import('./features/dots').then(({ initDots }) => initDots())
