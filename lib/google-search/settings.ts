import { defineSetting } from '@/lib/settings'

export const GOOGLE_SEARCH_SETTINGS_STORAGE_KEY = 'googleSearchSettings'

export type GoogleSearchSettings = {
  openInEnabled: boolean
}

export const googleSearchSettings = defineSetting(
  GOOGLE_SEARCH_SETTINGS_STORAGE_KEY,
  {
    openInEnabled: true,
  },
)
