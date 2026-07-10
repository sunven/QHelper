import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TextDiffTool } from '@/components/tool/text-diff'

const monaco = vi.hoisted(() => {
  function createModel(initialValue: string) {
    let value = initialValue
    let input: HTMLTextAreaElement | null = null
    const listeners = new Set<() => void>()

    return {
      bind(nextInput: HTMLTextAreaElement) {
        input = nextInput
        input.value = value
        input.addEventListener('input', () => {
          value = input?.value ?? ''
          listeners.forEach((listener) => {
            listener()
          })
        })
      },
      dispose() {},
      getFullModelRange: () => ({}),
      getValue: () => value,
      onDidChangeContent(listener: () => void) {
        listeners.add(listener)
        return { dispose: () => listeners.delete(listener) }
      },
      pushEditOperations(
        _beforeCursorState: null,
        operations: Array<{ text: string }>,
      ) {
        value = operations[0]?.text ?? value
        if (input) {
          input.value = value
        }
        listeners.forEach((listener) => {
          listener()
        })
        return null
      },
    }
  }

  return {
    editor: {
      createDiffEditor(
        host: HTMLElement,
        options: { modifiedAriaLabel: string; originalAriaLabel: string },
      ) {
        const originalInput = document.createElement('textarea')
        const modifiedInput = document.createElement('textarea')
        originalInput.setAttribute('aria-label', options.originalAriaLabel)
        modifiedInput.setAttribute('aria-label', options.modifiedAriaLabel)
        host.replaceChildren(originalInput, modifiedInput)

        let models: {
          modified: ReturnType<typeof createModel>
          original: ReturnType<typeof createModel>
        } | null = null
        const diffListeners = new Set<() => void>()

        return {
          dispose() {},
          getLineChanges: () =>
            models?.original.getValue() === models?.modified.getValue()
              ? []
              : [{}],
          onDidUpdateDiff(listener: () => void) {
            diffListeners.add(listener)
            return { dispose: () => diffListeners.delete(listener) }
          },
          setModel(nextModels: typeof models) {
            models = nextModels
            if (!models) {
              return
            }
            models.original.bind(originalInput)
            models.modified.bind(modifiedInput)
            models.original.onDidChangeContent(() => {
              queueMicrotask(() => {
                diffListeners.forEach((listener) => {
                  listener()
                })
              })
            })
            models.modified.onDidChangeContent(() => {
              queueMicrotask(() => {
                diffListeners.forEach((listener) => {
                  listener()
                })
              })
            })
          },
          updateOptions() {},
        }
      },
      createModel,
      setTheme() {},
    },
  }
})

vi.mock('monaco-editor/esm/vs/editor/edcore.main.js', () => monaco)
vi.mock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({
  default: class EditorWorker {},
}))

describe('TextDiffTool', () => {
  it('updates the visible status as the user edits both texts', async () => {
    render(<TextDiffTool />)

    const original = await screen.findByRole('textbox', {
      name: '原始文本',
    })
    const modified = screen.getByRole('textbox', { name: '修改后文本' })

    fireEvent.input(original, { target: { value: 'same' } })
    fireEvent.input(modified, { target: { value: 'same' } })

    await waitFor(() => {
      expect(screen.getByText('无差异')).toBeVisible()
    })

    fireEvent.input(modified, { target: { value: 'changed' } })

    await waitFor(() => {
      expect(screen.getByText('存在差异')).toBeVisible()
    })
  })

  it('lets the user swap and clear both texts', async () => {
    render(<TextDiffTool />)

    const original = await screen.findByRole('textbox', {
      name: '原始文本',
    })
    const modified = screen.getByRole('textbox', { name: '修改后文本' })

    fireEvent.input(original, { target: { value: 'before' } })
    fireEvent.input(modified, { target: { value: 'after' } })
    await waitFor(() => {
      expect(screen.getByText('存在差异')).toBeVisible()
    })
    fireEvent.click(screen.getByRole('button', { name: '交换文本' }))

    expect(original).toHaveValue('after')
    expect(modified).toHaveValue('before')

    fireEvent.click(screen.getByRole('button', { name: '清空文本' }))

    expect(original).toHaveValue('')
    expect(modified).toHaveValue('')
    await waitFor(() => {
      expect(screen.getByText('等待输入')).toBeVisible()
    })
  })
})
