import { EditorView } from '@codemirror/view'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { TextDiffTool } from '@/components/tool/text-diff'

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('TextDiffTool', () => {
  it('updates the visible status as the user edits both texts', async () => {
    const user = userEvent.setup()
    render(<TextDiffTool />)

    const original = await screen.findByRole('textbox', {
      name: '原始文本',
    })
    const modified = screen.getByRole('textbox', { name: '修改后文本' })

    await user.type(original, 'same')
    await user.type(modified, 'same')

    await waitFor(() => {
      expect(screen.getByText('无差异')).toBeVisible()
    })

    await user.type(modified, 'changed')

    await waitFor(() => {
      expect(screen.getByText('存在差异')).toBeVisible()
    })
  })

  it('lets the user swap and clear both texts', async () => {
    const user = userEvent.setup()
    render(<TextDiffTool />)

    const original = await screen.findByRole('textbox', {
      name: '原始文本',
    })
    const modified = screen.getByRole('textbox', { name: '修改后文本' })

    await user.type(original, 'before')
    await user.type(modified, 'after')
    await waitFor(() => {
      expect(screen.getByText('存在差异')).toBeVisible()
    })
    await user.click(screen.getByRole('button', { name: '交换文本' }))

    expect(original).toHaveTextContent('after')
    expect(modified).toHaveTextContent('before')

    await user.click(screen.getByRole('button', { name: '清空文本' }))

    await waitFor(() => {
      expect(screen.getByText('等待输入')).toBeVisible()
    })
  })

  it('moves to the previous and next changed chunks', async () => {
    const user = userEvent.setup()
    render(<TextDiffTool />)

    const original = await screen.findByRole('textbox', {
      name: '原始文本',
    })
    const modified = screen.getByRole('textbox', { name: '修改后文本' })
    const previous = screen.getByRole('button', { name: '上一个差异' })
    const next = screen.getByRole('button', { name: '下一个差异' })
    const unchanged = Array.from({ length: 10 }, (_, index) => `keep${index}`)
    const originalText = ['same', 'first', ...unchanged, 'second'].join('\n')
    const modifiedText = ['same', 'FIRST', ...unchanged, 'SECOND'].join('\n')

    expect(previous).toBeDisabled()
    expect(next).toBeDisabled()

    await user.type(original, originalText.split('\n').join('{Enter}'))
    await user.type(modified, modifiedText.split('\n').join('{Enter}'))
    await waitFor(() => {
      expect(previous).toBeEnabled()
      expect(next).toBeEnabled()
    })

    const originalView = EditorView.findFromDOM(original)
    if (!originalView) {
      throw new Error('Original editor was not rendered')
    }

    await user.click(previous)
    expect(originalView.state.selection.main.head).toBe(
      originalText.indexOf('first'),
    )

    await user.click(previous)
    expect(originalView.state.selection.main.head).toBe(
      originalText.indexOf('second'),
    )

    await user.click(next)
    expect(originalView.state.selection.main.head).toBe(
      originalText.indexOf('first'),
    )
  })

  it('adapts both editors when the color theme changes', async () => {
    render(<TextDiffTool />)

    const original = await screen.findByRole('textbox', {
      name: '原始文本',
    })
    const modified = screen.getByRole('textbox', { name: '修改后文本' })

    document.documentElement.classList.add('dark')

    await waitFor(() => {
      expect(
        EditorView.findFromDOM(original)?.state.facet(EditorView.darkTheme),
      ).toBe(true)
      expect(
        EditorView.findFromDOM(modified)?.state.facet(EditorView.darkTheme),
      ).toBe(true)
    })
  })
})
