import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from './settings'

const dictionarySettingsMocks = vi.hoisted(() => ({
  getDictionarySettings: vi.fn(),
  setDictionarySettings: vi.fn(),
  subscribeDictionarySettings: vi.fn(),
}))

vi.mock('@/lib/dictionary/settings', () => ({
  DEFAULT_DICTIONARY_SETTINGS: { selectionLookupEnabled: true },
  getDictionarySettings: dictionarySettingsMocks.getDictionarySettings,
  setDictionarySettings: dictionarySettingsMocks.setDictionarySettings,
  subscribeDictionarySettings:
    dictionarySettingsMocks.subscribeDictionarySettings,
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dictionarySettingsMocks.getDictionarySettings.mockResolvedValue({
      selectionLookupEnabled: true,
    })
    dictionarySettingsMocks.setDictionarySettings.mockImplementation(
      async (nextSettings) => nextSettings,
    )
    dictionarySettingsMocks.subscribeDictionarySettings.mockReturnValue(
      () => undefined,
    )
  })

  it('renders the dictionary selection lookup setting', async () => {
    render(<SettingsPage />)

    const checkbox = await screen.findByRole('checkbox', {
      name: '启用字典划词翻译',
    })

    expect(checkbox).toBeChecked()
    expect(screen.getByText('已启用')).toBeVisible()
  })

  it('persists dictionary selection lookup changes', async () => {
    render(<SettingsPage />)

    const checkbox = await screen.findByRole('checkbox', {
      name: '启用字典划词翻译',
    })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(dictionarySettingsMocks.setDictionarySettings).toHaveBeenCalledWith(
        { selectionLookupEnabled: false },
      )
    })
    expect(screen.getByText('已停用')).toBeVisible()
  })
})
