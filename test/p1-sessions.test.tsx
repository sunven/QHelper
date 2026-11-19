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

describe('temporary tool inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    installToolDataStorage()
  })

  it('qrcode edits and restores a snapshot without automatic persistent writes', async () => {
    const input = 'private-qr-17'
    const Component = toolRoutes.find(
      (route) => route.id === 'qrcode',
    )!.Component
    const session = createToolSession('qrcode', true, { text: input })
    const view = render(
      <MemoryRouter>
        <TooltipProvider>
          <ToolSessionContext.Provider value={session}>
            <Component />
          </ToolSessionContext.Provider>
        </TooltipProvider>
      </MemoryRouter>,
    )
    // 工具组件按路由懒加载，首次渲染需等待动态 import 完成
    const editor = (
      await screen.findAllByDisplayValue(input, {}, { timeout: 5000 })
    )[0]
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
    const restored = createToolSession('qrcode', true, snapshot)
    render(
      <MemoryRouter>
        <TooltipProvider>
          <ToolSessionContext.Provider value={restored}>
            <Component />
          </ToolSessionContext.Provider>
        </TooltipProvider>
      </MemoryRouter>,
    )
    expect((await screen.findAllByDisplayValue(edited))[0]).toHaveValue(edited)
  })

  it('explicit save persists a separate snapshot without promoting temporary input', async () => {
    const storage = installToolDataStorage()
    storage.local.tool_qrcode_text = 'ordinary draft'
    const session = createToolSession('qrcode', true, {
      text: 'temporary input',
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
    expect((await getToolSnapshots('qrcode'))[0].values).toEqual({
      text: 'temporary input',
    })
    expect(storage.local.tool_qrcode_text).toBe('ordinary draft')
    expect(session.temporary).toBe(true)
  })
})
