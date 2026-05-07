import { afterEach, describe, expect, it, vi } from 'vitest'
import { installDictionarySelectionLookup } from './content'
import { ballStore, panelStore, resetDictionaryStores } from './stores'
import { DICTIONARY_FETCH_MESSAGE } from './types'

function mockSelection(text: string, range?: Range) {
  vi.spyOn(window, 'getSelection').mockReturnValue({
    toString: () => text,
    rangeCount: range ? 1 : 0,
    getRangeAt: () => range as Range,
  } as unknown as Selection)
}

describe('dictionary/content', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetDictionaryStores()
    document.body.innerHTML = ''
    document.documentElement.querySelector('#qhelper-dictionary-root')?.remove()
  })

  it('hides the cranberry icon for empty or non-English selections', () => {
    const setBall = vi.spyOn(ballStore, 'setBall')

    installDictionarySelectionLookup(window, document, {
      createRoot: () => ({ render: vi.fn(), unmount: vi.fn() }),
    })
    mockSelection('中文')

    document.dispatchEvent(new MouseEvent('mouseup'))

    expect(setBall).toHaveBeenCalledWith({
      show: false,
      onActive: expect.any(Function),
    })
  })

  it('shows the cranberry icon and fetches dictionary data when activated', () => {
    document.body.innerHTML = '<p>hello</p>'
    const range = document.createRange()
    const textNode = document.querySelector('p')?.firstChild as Text
    range.setStart(textNode, 0)
    range.setEnd(textNode, 5)
    Object.defineProperty(range, 'getBoundingClientRect', {
      value: () => ({
        right: 120,
        top: 80,
      }),
    })
    mockSelection('hello', range)
    const runtime = {
      sendMessage: vi.fn((_message, callback?: (response: unknown) => void) => {
        callback?.('{"simple":{"query":"hello"},"ec":{"word":[{}]}}')
      }),
    }

    installDictionarySelectionLookup(window, document, {
      runtime,
      createRoot: () => ({ render: vi.fn(), unmount: vi.fn() }),
    })

    document.dispatchEvent(new MouseEvent('mouseup'))
    expect(ballStore.getSnapshot()).toMatchObject({
      show: true,
      x: 120,
      y: 64,
    })

    ballStore.getSnapshot().onActive()

    expect(runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: DICTIONARY_FETCH_MESSAGE,
      }),
      expect.any(Function),
    )
    expect(panelStore.getSnapshot()).toMatchObject({
      show: true,
      x: 120,
      y: 0,
      query: 'hello',
      data: {
        simple: { query: 'hello' },
      },
    })
  })

  it('opens the panel immediately before dictionary data returns', () => {
    document.body.innerHTML = '<p>hello</p>'
    const range = document.createRange()
    const textNode = document.querySelector('p')?.firstChild as Text
    range.setStart(textNode, 0)
    range.setEnd(textNode, 5)
    Object.defineProperty(range, 'getBoundingClientRect', {
      value: () => ({
        right: 120,
        top: 80,
      }),
    })
    mockSelection('hello', range)
    const runtime = {
      sendMessage: vi.fn(),
    }

    installDictionarySelectionLookup(window, document, {
      runtime,
      createRoot: () => ({ render: vi.fn(), unmount: vi.fn() }),
    })

    document.dispatchEvent(new MouseEvent('mouseup'))
    ballStore.getSnapshot().onActive()

    expect(panelStore.getSnapshot()).toMatchObject({
      show: true,
      x: 120,
      y: 0,
      query: 'hello',
      data: undefined,
      range,
    })
  })

  it('closes the panel on outside clicks but not inside the dictionary panel', () => {
    installDictionarySelectionLookup(window, document, {
      createRoot: () => ({ render: vi.fn(), unmount: vi.fn() }),
    })
    panelStore.mergeData({ show: true })

    const inside = document.createElement('div')
    inside.className = 'cranberry-panel'
    document.body.appendChild(inside)
    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    expect(panelStore.getSnapshot().show).toBe(true)

    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(panelStore.getSnapshot().show).toBe(false)
  })
})
