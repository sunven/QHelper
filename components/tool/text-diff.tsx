import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeftRight, ArrowRight, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type DiffStatus = 'loading' | 'empty' | 'comparing' | 'same' | 'different'

const STATUS_TEXT: Record<DiffStatus, string> = {
  loading: '加载中',
  empty: '等待输入',
  comparing: '比较中',
  same: '无差异',
  different: '存在差异',
}

function replaceText(
  model: import('monaco-editor').editor.ITextModel,
  value: string,
) {
  model.pushEditOperations(
    null,
    [{ range: model.getFullModelRange(), text: value }],
    () => null,
  )
}

export function TextDiffTool() {
  const editorHostRef = useRef<HTMLDivElement>(null)
  const diffEditorRef = useRef<
    import('monaco-editor').editor.IStandaloneDiffEditor | null
  >(null)
  const modelsRef = useRef<{
    original: import('monaco-editor').editor.ITextModel
    modified: import('monaco-editor').editor.ITextModel
  } | null>(null)
  const [status, setStatus] = useState<DiffStatus>('loading')
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const host = editorHostRef.current
    if (!host) {
      return
    }

    let disposed = false
    let disposeEditor: (() => void) | undefined

    void (async () => {
      try {
        const { default: EditorWorker } = await import(
          'monaco-editor/esm/vs/editor/editor.worker?worker'
        )
        self.MonacoEnvironment = {
          getWorker: () => new EditorWorker(),
        }

        const monaco = await import(
          'monaco-editor/esm/vs/editor/edcore.main.js'
        )
        if (disposed) {
          return
        }

        const originalModel = monaco.editor.createModel('', 'plaintext')
        const modifiedModel = monaco.editor.createModel('', 'plaintext')
        modelsRef.current = {
          original: originalModel,
          modified: modifiedModel,
        }
        const diffEditor = monaco.editor.createDiffEditor(host, {
          automaticLayout: true,
          diffWordWrap: 'off',
          ignoreTrimWhitespace: false,
          minimap: { enabled: false },
          modifiedAriaLabel: '修改后文本',
          originalAriaLabel: '原始文本',
          originalEditable: true,
          renderSideBySide: true,
          scrollBeyondLastLine: false,
          useInlineViewWhenSpaceIsLimited: true,
          wordWrap: 'off',
        })
        diffEditorRef.current = diffEditor

        diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel,
        })

        const updateStatus = () => {
          if (!originalModel.getValue() && !modifiedModel.getValue()) {
            setStatus('empty')
            return
          }

          const changes = diffEditor.getLineChanges()
          setStatus(changes?.length ? 'different' : 'same')
        }
        const contentSubscriptions = [originalModel, modifiedModel].map(
          (model) => model.onDidChangeContent(() => setStatus('comparing')),
        )
        const diffSubscription = diffEditor.onDidUpdateDiff(updateStatus)
        const applyTheme = () => {
          monaco.editor.setTheme(
            document.documentElement.classList.contains('dark')
              ? 'vs-dark'
              : 'vs',
          )
        }
        const themeObserver = new MutationObserver(applyTheme)
        themeObserver.observe(document.documentElement, {
          attributeFilter: ['class'],
          attributes: true,
        })

        applyTheme()
        updateStatus()

        disposeEditor = () => {
          diffEditorRef.current = null
          modelsRef.current = null
          themeObserver.disconnect()
          diffSubscription.dispose()
          contentSubscriptions.forEach((subscription) => {
            subscription.dispose()
          })
          diffEditor.dispose()
          originalModel.dispose()
          modifiedModel.dispose()
        }
      } catch {
        if (!disposed) {
          setLoadError(true)
        }
      }
    })()

    return () => {
      disposed = true
      disposeEditor?.()
    }
  }, [])

  function replaceBoth(original: string, modified: string) {
    const diffEditor = diffEditorRef.current
    const models = modelsRef.current
    if (!diffEditor || !models) {
      return
    }

    diffEditor.setModel(null)
    replaceText(models.original, original)
    replaceText(models.modified, modified)
    diffEditor.setModel(models)
  }

  function swapTexts() {
    const models = modelsRef.current
    if (!models) {
      return
    }

    const original = models.original.getValue()
    replaceBoth(models.modified.getValue(), original)
  }

  function clearTexts() {
    const models = modelsRef.current
    if (!models) {
      return
    }

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
              disabled={status === 'loading' || status === 'empty' || loadError}
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
              disabled={status === 'loading' || status === 'empty' || loadError}
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
            className="h-full"
            data-testid="text-diff-editor"
          />
          {status === 'loading' && !loadError ? (
            <Skeleton className="absolute inset-0" />
          ) : null}
          {loadError ? (
            <div
              className="absolute inset-0 grid place-items-center p-4 text-sm text-destructive"
              role="alert"
            >
              Monaco 编辑器加载失败
            </div>
          ) : null}
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
