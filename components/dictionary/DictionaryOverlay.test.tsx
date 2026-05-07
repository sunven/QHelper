import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DictionaryOverlay } from './DictionaryOverlay'
import { ballStore, panelStore, resetDictionaryStores } from '@/lib/dictionary/stores'

const dictionaryData = {
  simple: { query: 'hello' },
  ec: {
    exam_type: ['CET4'],
    word: [
      {
        usphone: 'həˈloʊ',
        ukphone: 'həˈləʊ',
        trs: [
          {
            tr: [{ l: { i: ['int. 你好'] } }],
          },
        ],
        wfs: [{ wf: { name: '复数', value: 'hellos' } }],
      },
    ],
  },
  rel_word: {
    stem: 'hello',
    rels: [
      {
        rel: {
          pos: 'n.',
          words: [{ word: 'hello', tran: '问候' }],
        },
      },
    ],
  },
}

describe('DictionaryOverlay', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetDictionaryStores()
  })

  it('renders the cranberry icon when ball state is visible', () => {
    ballStore.setBall({ show: true, x: 10, y: 20, onActive: vi.fn() })

    render(<DictionaryOverlay />)

    expect(screen.getByRole('img')).toHaveClass('saladbowl')
  })

  it('renders old-style dictionary fields', () => {
    panelStore.mergeData({ show: true, x: 20, y: 30, data: dictionaryData })

    render(<DictionaryOverlay />)

    expect(screen.getByText('Cranberry Dict')).toBeInTheDocument()
    expect(screen.getAllByText('hello')).toHaveLength(2)
    expect(screen.getByText('美/həˈloʊ/')).toBeInTheDocument()
    expect(screen.getByText('英/həˈləʊ/')).toBeInTheDocument()
    expect(screen.getByText('你好')).toBeInTheDocument()
    expect(screen.getByText('CET4')).toBeInTheDocument()
    expect(screen.getByText('复数:')).toBeInTheDocument()
    expect(screen.getByText('hellos')).toBeInTheDocument()
    expect(screen.getByText('hello:问候')).toBeInTheDocument()
  })

  it('renders the panel shell while dictionary data is pending', () => {
    panelStore.mergeData({ show: true, x: 20, y: 30, query: 'hello' })

    render(<DictionaryOverlay />)

    expect(screen.getByText('Cranberry Dict')).toBeInTheDocument()
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('closes the panel when the close control is clicked', () => {
    panelStore.mergeData({ show: true, x: 20, y: 30, data: dictionaryData })
    render(<DictionaryOverlay />)

    fireEvent.click(screen.getByTestId('dictionary-close'))

    expect(panelStore.getSnapshot().show).toBe(false)
  })

  it('moves the panel while dragging the drag handle', () => {
    panelStore.mergeData({ show: true, x: 20, y: 30, data: dictionaryData })
    render(<DictionaryOverlay />)
    const panel = screen.getByText('Cranberry Dict').closest('.dictpanel') as HTMLElement
    Object.defineProperty(panel, 'offsetLeft', { value: 20 })
    Object.defineProperty(panel, 'offsetTop', { value: 30 })

    fireEvent.mouseDown(screen.getByTestId('dictionary-drag-handle'), {
      clientX: 30,
      clientY: 40,
    })
    fireEvent.mouseMove(document, { clientX: 50, clientY: 70 })
    fireEvent.mouseUp(document)

    expect(panel.style.left).toBe('40px')
    expect(panel.style.top).toBe('60px')
  })
})
