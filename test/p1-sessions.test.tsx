import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToolSessionContext } from '@/components/tool/ToolSessionContext'
import { ToolSessionToolbar } from '@/components/tool/ToolSessionToolbar'
import { toolRoutes } from '@/components/tool/tool-routes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { getToolSnapshots } from '@/lib/tool-data/manager'
import { createToolSession, serializeSession } from '@/lib/tool-sessions'
import { installToolDataStorage } from './tool-data-storage'

const cases: [string, Record<string, unknown>, string][] = [
  ['json', { jsoncon: '{"private":17}' }, '{"private":17}'],
  ['convert', { srcText: 'cHJpdmF0ZQ==' }, 'cHJpdmF0ZQ=='],
  [
    'urlparser',
    { input: 'https://example.test/private?q=17' },
    'https://example.test/private?q=17',
  ],
  ['timestamp', { srcStamp: '1700000017' }, '1700000017'],
  ['qrcode', { text: 'private-qr-17' }, 'private-qr-17'],
  ['markdown', { state: { input: '# private-17' } }, '# private-17'],
  [
    'formatter',
    { input: '.private { color: red; }', language: 'css' },
    '.private { color: red; }',
  ],
  ['cron', { state: { expression: '17 * * * *' } }, '17 * * * *'],
  ['toml', { input: 'private = 17' }, 'private = 17'],
  [
    'svgoptimizer',
    {
      input:
        '<svg xmlns="http://www.w3.org/2000/svg"><text>private17</text></svg>',
    },
    '<svg xmlns="http://www.w3.org/2000/svg"><text>private17</text></svg>',
  ],
  [
    'jsonschema',
    { state: { jsonData: '{"private":17}', jsonSchema: '{}' } },
    '{"private":17}',
  ],
]

describe('temporary tool inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    installToolDataStorage()
  })

  it.each(cases)(
    '%s edits and restores a snapshot without automatic persistent writes',
    async (id, values, input) => {
      const Component = toolRoutes.find((route) => route.id === id)!.Component
      const session = createToolSession(id, true, values)
      const view = render(
        <MemoryRouter>
          <TooltipProvider>
            <ToolSessionContext.Provider value={session}>
              <Component />
            </ToolSessionContext.Provider>
          </TooltipProvider>
        </MemoryRouter>,
      )
      const editor = (await screen.findAllByDisplayValue(input))[0]
      const edited = `edited:${input}`
      fireEvent.change(editor, { target: { value: edited } })
      await waitFor(() => expect(editor).toHaveValue(edited))
      const snapshot = serializeSession(session)
      expect(JSON.stringify(snapshot)).toContain(
        JSON.stringify(edited).slice(1, -1),
      )
      expect(chrome.storage.local.set).not.toHaveBeenCalled()
      expect(chrome.storage.sync.set).not.toHaveBeenCalled()
      expect(localStorage.length).toBe(0)
      view.unmount()
      const restored = createToolSession(id, true, snapshot)
      render(
        <MemoryRouter>
          <TooltipProvider>
            <ToolSessionContext.Provider value={restored}>
              <Component />
            </ToolSessionContext.Provider>
          </TooltipProvider>
        </MemoryRouter>,
      )
      expect((await screen.findAllByDisplayValue(edited))[0]).toHaveValue(
        edited,
      )
    },
  )

  it('explicit save persists a separate snapshot without promoting temporary input', async () => {
    const storage = installToolDataStorage()
    storage.local.tool_convert_srcText = 'ordinary draft'
    const session = createToolSession('convert', true, {
      srcText: 'temporary input',
    })
    render(
      <ToolSessionToolbar
        session={session}
        onStart={vi.fn()}
        onEnd={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '保存一份' }))
    await screen.findByText('已保存一份快照，当前编辑模式不变。')
    expect((await getToolSnapshots('convert'))[0].values).toEqual({
      srcText: 'temporary input',
    })
    expect(storage.local.tool_convert_srcText).toBe('ordinary draft')
    expect(session.temporary).toBe(true)
  })
})
