import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { MergeView } from '@codemirror/merge'
import type { Extension } from '@codemirror/state'
import {
  drawSelection,
  EditorView,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { ArrowLeftRight, ArrowRight, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type DiffStatus = 'empty' | 'comparing' | 'same' | 'different'

const STATUS_TEXT: Record<DiffStatus, string> = {
  empty: '等待输入',
  comparing: '比较中',
  same: '无差异',
  different: '存在差异',
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    minWidth: '0',
    color: 'var(--text)',
    backgroundColor: 'transparent',
    fontSize: '13px',
  },
  '&.cm-merge-b': {
    borderLeft: '1px solid var(--border)',
  },
  '.cm-scroller': {
    fontFamily:
      "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '8px 0',
  },
  '.cm-gutters': {
    borderRight: '1px solid var(--border)',
    backgroundColor: 'var(--surface-soft)',
    color: 'var(--text-muted)',
  },
  '&.cm-focused': {
    outline: '1px solid var(--ring)',
    outlineOffset: '-1px',
  },
})

const editorExtensions: Extension = [
  lineNumbers(),
  history(),
  drawSelection(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
  editorTheme,
]

function replaceText(view: EditorView, value: string) {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: value },
  })
}

export function TextDiffTool() {
  const editorHostRef = useRef<HTMLDivElement>(null)
  const mergeViewRef = useRef<MergeView | null>(null)
  const [status, setStatus] = useState<DiffStatus>('empty')

  useEffect(() => {
    const host = editorHostRef.current
    if (!host) {
      return
    }

    let mergeView: MergeView
    const trackChanges = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return
      }

      setStatus('comparing')
      queueMicrotask(() => {
        if (mergeViewRef.current !== mergeView) {
          return
        }

        const original = mergeView.a.state.doc
        const modified = mergeView.b.state.doc
        setStatus(
          original.length === 0 && modified.length === 0
            ? 'empty'
            : original.eq(modified)
              ? 'same'
              : 'different',
        )
      })
    })

    mergeView = new MergeView({
      a: {
        doc: '',
        extensions: [
          editorExtensions,
          trackChanges,
          EditorView.contentAttributes.of({ 'aria-label': '原始文本' }),
        ],
      },
      b: {
        doc: '',
        extensions: [
          editorExtensions,
          trackChanges,
          EditorView.contentAttributes.of({ 'aria-label': '修改后文本' }),
        ],
      },
      parent: host,
    })
    mergeViewRef.current = mergeView

    return () => {
      mergeViewRef.current = null
      mergeView.destroy()
    }
  }, [])

  function replaceBoth(original: string, modified: string) {
    const mergeView = mergeViewRef.current
    if (!mergeView) {
      return
    }

    replaceText(mergeView.a, original)
    replaceText(mergeView.b, modified)
  }

  function swapTexts() {
    const mergeView = mergeViewRef.current
    if (!mergeView) {
      return
    }

    const original = mergeView.a.state.doc.toString()
    replaceBoth(mergeView.b.state.doc.toString(), original)
  }

  function clearTexts() {
    replaceBoth('', '')
  }

  return (
    <ToolPageShell toolId="text-diff" className="h-full">
      <section className="flex h-full min-h-[32rem] flex-col overflow-hidden border border-border bg-background">
        <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/30 px-3">
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium">
            <span>原始文本</span>
            <ArrowRight aria-hidden className="size-3 text-muted-foreground" />
            <span>修改后文本</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge aria-live="polite" variant="outline">
              {STATUS_TEXT[status]}
            </Badge>
            <Button
              aria-label="交换文本"
              disabled={status === 'empty'}
              onClick={swapTexts}
              size="icon-sm"
              title="交换文本"
              type="button"
              variant="outline"
            >
              <ArrowLeftRight aria-hidden />
            </Button>
            <Button
              aria-label="清空文本"
              disabled={status === 'empty'}
              onClick={clearTexts}
              size="icon-sm"
              title="清空文本"
              type="button"
              variant="outline"
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        </header>
        <div className="relative min-h-0 flex-1">
          <div
            ref={editorHostRef}
            className="h-full overflow-hidden [&_.cm-mergeView]:h-full [&_.cm-mergeViewEditors]:min-h-full"
            data-testid="text-diff-editor"
          />
        </div>
      </section>
    </ToolPageShell>
  )
}

export function App() {
  return (
    <ToolErrorBoundary toolId="text-diff" toolName="文本 Diff">
      <TextDiffTool />
    </ToolErrorBoundary>
  )
}
