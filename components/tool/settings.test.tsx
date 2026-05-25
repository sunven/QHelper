import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
const v2exBase64SettingsMocks = vi.hoisted(() => ({
  getV2exBase64Settings: vi.fn(),
  setV2exBase64Settings: vi.fn(),
  subscribeV2exBase64Settings: vi.fn(),
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

vi.mock('@/lib/v2ex-base64/settings', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/lib/v2ex-base64/settings')>()

  return {
    ...actual,
    DEFAULT_V2EX_BASE64_SETTINGS: { entries: [] },
    getV2exBase64Settings: v2exBase64SettingsMocks.getV2exBase64Settings,
    setV2exBase64Settings: v2exBase64SettingsMocks.setV2exBase64Settings,
    subscribeV2exBase64Settings:
      v2exBase64SettingsMocks.subscribeV2exBase64Settings,
  }
})

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
    v2exBase64SettingsMocks.getV2exBase64Settings.mockResolvedValue({
      entries: ['user@example.com'],
    })
    v2exBase64SettingsMocks.setV2exBase64Settings.mockImplementation(
      async (nextSettings) => ({
        settings: {
          entries: nextSettings.entries ?? [],
        },
        storageArea: 'sync',
      }),
    )
    v2exBase64SettingsMocks.subscribeV2exBase64Settings.mockReturnValue(
      () => undefined,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
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
    expect(
      screen.queryByRole('checkbox', { name: '启用 V2EX Base64' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: '可转 Base64 的字符串' }),
    ).toHaveValue('user@example.com')
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

  it('auto-saves V2EX Base64 draft edits after a short delay', async () => {
    render(<SettingsPage />)

    const textarea = await screen.findByRole('textbox', {
      name: '可转 Base64 的字符串',
    })
    vi.useFakeTimers()
    fireEvent.change(textarea, {
      target: { value: ' user@example.com \n\n 13800138000 ' },
    })

    expect(v2exBase64SettingsMocks.setV2exBase64Settings).not.toHaveBeenCalled()
    expect(screen.getByText('等待自动保存...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '保存' })).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(499)
    })
    expect(v2exBase64SettingsMocks.setV2exBase64Settings).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(v2exBase64SettingsMocks.setV2exBase64Settings).toHaveBeenCalledWith({
      entries: ['user@example.com', '13800138000'],
    })
    expect(textarea).toHaveValue('user@example.com\n13800138000')
    expect(screen.getByText('2 行已保存')).toBeInTheDocument()
  })

  it('keeps the V2EX Base64 draft editable when auto-save fails', async () => {
    v2exBase64SettingsMocks.setV2exBase64Settings.mockRejectedValueOnce(
      new Error('sync failed'),
    )
    render(<SettingsPage />)

    const textarea = await screen.findByRole('textbox', {
      name: '可转 Base64 的字符串',
    })
    vi.useFakeTimers()
    fireEvent.change(textarea, {
      target: { value: 'changed@example.com' },
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(screen.getByText('保存失败，请重试')).toBeInTheDocument()
    expect(screen.getByText('自动保存失败，修改后重试')).toBeInTheDocument()
    expect(textarea).toHaveValue('changed@example.com')

    fireEvent.change(textarea, {
      target: { value: 'changed@example.com\n13800138000' },
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(v2exBase64SettingsMocks.setV2exBase64Settings).toHaveBeenCalledWith({
      entries: ['changed@example.com', '13800138000'],
    })
    expect(screen.getByText('2 行已保存')).toBeInTheDocument()
  })
})
