import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './markdown'

vi.mock('@/components/tool/ToolPageShell', () => ({
  ToolPageShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}))

const maliciousMarkdown = `# Title

<a href="javascript:alert(1)" onclick="alert(1)">bad link</a>
<img src="x" onerror="alert(1)">
<script>alert(1)</script>`

const originalCreateObjectURL = URL.createObjectURL
const originalRevokeObjectURL = URL.revokeObjectURL

function restoreUrlStatics() {
  if (originalCreateObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectURL,
    })
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL')
  }

  if (originalRevokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectURL,
    })
  } else {
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  }
}

function getPreview(container: HTMLElement): HTMLElement {
  const preview = container.querySelector('.prose')

  if (!(preview instanceof HTMLElement)) {
    throw new Error('Preview not found')
  }

  return preview
}

describe('markdown/App', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    restoreUrlStatics()
  })

  it('sanitizes rendered markdown before injecting preview HTML', async () => {
    const { container } = render(<App />)

    fireEvent.change(screen.getByPlaceholderText('输入 Markdown 内容...'), {
      target: { value: maliciousMarkdown },
    })

    await waitFor(() => {
      expect(getPreview(container).innerHTML).toContain('<h1>Title</h1>')
    })

    const previewHtml = getPreview(container).innerHTML

    expect(previewHtml).toContain('bad link')
    expect(previewHtml).not.toContain('<script')
    expect(previewHtml).not.toContain('onclick')
    expect(previewHtml).not.toContain('onerror')
    expect(previewHtml).not.toContain('javascript:')
  })

  it('exports sanitized markdown HTML', async () => {
    const createObjectURL = vi.fn((object: Blob | MediaSource) => {
      void object
      return 'blob:markdown-export'
    })
    const revokeObjectURL = vi.fn((url: string) => {
      void url
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })

    render(<App />)

    fireEvent.change(screen.getByPlaceholderText('输入 Markdown 内容...'), {
      target: { value: maliciousMarkdown },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /导出 HTML/ })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /导出 HTML/ }))

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob | undefined
    expect(blob).toBeInstanceOf(Blob)

    const exportedHtml = await blob?.text()

    expect(exportedHtml).toContain('<h1>Title</h1>')
    expect(exportedHtml).toContain('bad link')
    expect(exportedHtml).not.toContain('<script')
    expect(exportedHtml).not.toContain('onclick')
    expect(exportedHtml).not.toContain('onerror')
    expect(exportedHtml).not.toContain('javascript:')
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:markdown-export')
  })
})
