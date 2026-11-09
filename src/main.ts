import { initI18n } from './i18n'
import { initAbout } from './features/about'
import { initBlobs } from './features/blob'
import { initNav } from './features/nav'
import { initProjects } from './features/projects'

initI18n()
initNav()
initAbout()
initBlobs()
void initProjects()
void import('./features/dots').then(({ initDots }) => initDots())
