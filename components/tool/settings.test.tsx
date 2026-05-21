import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from './settings'

const dictionarySettingsMocks = vi.hoisted(() => ({
  getDictionarySettings: vi.fn(),
  setDictionarySettings: vi.fn(),
  subscribeDictionarySettings: vi.fn(),
}))
const jsonStringSettingsMocks = vi.hoisted(() => ({
  getJsonStringSettings: vi.fn(),
  setJsonStringSettings: vi.fn(),
  subscribeJsonStringSettings: vi.fn(),
}))

vi.mock('@/lib/dictionary/settings', () => ({
  DEFAULT_DICTIONARY_SETTINGS: { selectionLookupEnabled: true },
  getDictionarySettings: dictionarySettingsMocks.getDictionarySettings,
  setDictionarySettings: dictionarySettingsMocks.setDictionarySettings,
  subscribeDictionarySettings:
    dictionarySettingsMocks.subscribeDictionarySettings,
}))

vi.mock('@/lib/fe-tools/json-string', () => ({
  DEFAULT_JSON_STRING_SETTINGS: { enabled: true },
  getJsonStringSettings: jsonStringSettingsMocks.getJsonStringSettings,
  setJsonStringSettings: jsonStringSettingsMocks.setJsonStringSettings,
  subscribeJsonStringSettings:
    jsonStringSettingsMocks.subscribeJsonStringSettings,
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dictionarySettingsMocks.getDictionarySettings.mockResolvedValue({
      selectionLookupEnabled: true,
    })
    dictionarySettingsMocks.setDictionarySettings.mockImplementation(
      async (nextSettings) => ({
        settings: nextSettings,
        storageArea: 'sync',
      }),
    )
    dictionarySettingsMocks.subscribeDictionarySettings.mockReturnValue(
      () => undefined,
    )
    jsonStringSettingsMocks.getJsonStringSettings.mockResolvedValue({
      enabled: true,
    })
    jsonStringSettingsMocks.setJsonStringSettings.mockImplementation(
      async (nextSettings) => ({
        settings: nextSettings,
        storageArea: 'sync',
      }),
    )
    jsonStringSettingsMocks.subscribeJsonStringSettings.mockReturnValue(
      () => undefined,
    )
  })

  it('renders the settings toggles', async () => {
    render(<SettingsPage />)

    const dictionaryCheckbox = await screen.findByRole('checkbox', {
      name: '启用字典划词翻译',
    })
    const jsonStringCheckbox = screen.getByRole('checkbox', {
      name: '启用 Json String',
    })

    expect(dictionaryCheckbox).toBeChecked()
    expect(dictionaryCheckbox).toHaveAccessibleDescription('已启用')
    expect(jsonStringCheckbox).toBeChecked()
    expect(jsonStringCheckbox).toHaveAccessibleDescription('已启用')
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
    expect(checkbox).toHaveAccessibleDescription('已停用')
  })

  it('persists Json String enabled changes', async () => {
    render(<SettingsPage />)

    const checkbox = await screen.findByRole('checkbox', {
      name: '启用 Json String',
    })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(jsonStringSettingsMocks.setJsonStringSettings).toHaveBeenCalledWith(
        { enabled: false },
      )
    })
    expect(checkbox).toHaveAccessibleDescription('已停用')
  })

  it('shows a local fallback notice when sync save is unavailable', async () => {
    dictionarySettingsMocks.setDictionarySettings.mockResolvedValueOnce({
      settings: { selectionLookupEnabled: false },
      storageArea: 'local',
    })
    render(<SettingsPage />)

    const checkbox = await screen.findByRole('checkbox', {
      name: '启用字典划词翻译',
    })
    fireEvent.click(checkbox)

    expect(await screen.findByText('已保存到本机，暂未同步')).toHaveTextContent(
      '已保存到本机，暂未同步',
    )
  })
})
