import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DICTIONARY_SETTINGS_STORAGE_KEY } from '@/lib/dictionary/settings'
import { JSON_STRING_SETTINGS_STORAGE_KEY } from '@/lib/fe-tools/json-string'
import { GOOGLE_SEARCH_SETTINGS_STORAGE_KEY } from '@/lib/google-search/settings'
import { V2EX_BASE64_SETTINGS_STORAGE_KEY } from '@/lib/v2ex-base64/settings'
import { SettingsPage } from './settings'

function primeStoredSettings(key: string, value: unknown) {
  vi.mocked(chrome.storage.sync.get).mockImplementation(
    () => Promise.resolve({ [key]: value }) as never,
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    primeStoredSettings(V2EX_BASE64_SETTINGS_STORAGE_KEY, {
      entries: ['user@example.com'],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the settings controls from stored settings', async () => {
    render(<SettingsPage />)

    const dictionaryCheckbox = await screen.findByRole('checkbox', {
      name: '启用字典划词翻译',
    })
    const googleOpenInCheckbox = screen.getByRole('checkbox', {
      name: '在 Google 搜索结果中显示 Open in',
    })
    const jsonStringCheckbox = screen.getByRole('checkbox', {
      name: '启用 Json String',
    })

    expect(dictionaryCheckbox).not.toBeChecked()
    expect(dictionaryCheckbox).toHaveAccessibleDescription('已停用')
    expect(googleOpenInCheckbox).toBeChecked()
    expect(googleOpenInCheckbox).toHaveAccessibleDescription('已启用')
    expect(jsonStringCheckbox).not.toBeChecked()
    expect(jsonStringCheckbox).toHaveAccessibleDescription('已停用')
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
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [DICTIONARY_SETTINGS_STORAGE_KEY]: { selectionLookupEnabled: true },
      })
    })
    expect(checkbox).toHaveAccessibleDescription('已启用')
  })

  it('persists Google search Open in changes', async () => {
    render(<SettingsPage />)

    const checkbox = await screen.findByRole('checkbox', {
      name: '在 Google 搜索结果中显示 Open in',
    })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [GOOGLE_SEARCH_SETTINGS_STORAGE_KEY]: { openInEnabled: false },
      })
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
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [JSON_STRING_SETTINGS_STORAGE_KEY]: { enabled: true },
      })
    })
    expect(checkbox).toHaveAccessibleDescription('已启用')
  })

  it('shows the local fallback notice when the sync save fails', async () => {
    vi.mocked(chrome.storage.sync.set).mockImplementationOnce(
      () => Promise.reject(new Error('sync quota exceeded')) as never,
    )
    render(<SettingsPage />)

    const checkbox = await screen.findByRole('checkbox', {
      name: '启用字典划词翻译',
    })
    fireEvent.click(checkbox)

    expect(
      await screen.findByText('已保存到本机，暂未同步'),
    ).toBeInTheDocument()
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

    expect(screen.getByText('等待自动保存...')).toBeInTheDocument()
    expect(chrome.storage.sync.set).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500)
    })

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({
      [V2EX_BASE64_SETTINGS_STORAGE_KEY]: {
        entries: ['user@example.com', '13800138000'],
      },
    })
    expect(textarea).toHaveValue('user@example.com\n13800138000')
    expect(screen.getByText('2 行已保存')).toBeInTheDocument()
  })
})
