import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorState, type Extension } from '@codemirror/state'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder as editorPlaceholder,
  rectangularSelection,
  type ViewUpdate,
} from '@codemirror/view'
import { useEffect, useRef } from 'react'

type SourceTextEditorProps = {
  onChange: (value: string) => void
  placeholder: string
  value: string
}

const sourceEditorSetup: Extension = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...lintKeymap,
  ]),
]

const qhelperEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    minHeight: '0',
    color: 'var(--text)',
    backgroundColor: 'transparent',
    fontSize: '13px',
  },
  '.cm-editor': {
    height: '100%',
  },
  '.cm-scroller': {
    overflowX: 'hidden',
    fontFamily:
      "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '12px 14px',
    caretColor: 'var(--text)',
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '.cm-placeholder': {
    color: 'var(--text-muted)',
  },
  '.cm-gutters': {
    borderRight: '1px solid var(--border)',
    backgroundColor: 'var(--surface-soft)',
    color: 'var(--text-muted)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--surface-muted)',
    color: 'var(--text)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--surface-soft)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklch, var(--primary) 22%, transparent)',
  },
  '&.cm-focused': {
    outline: '1px solid var(--ring)',
    outlineOffset: '-1px',
  },
})

export function SourceTextEditor({
  onChange,
  placeholder,
  value,
}: SourceTextEditorProps) {
  const editorParentRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const isSyncingExternalValueRef = useRef(false)
  const onChangeRef = useRef(onChange)
  const initialPlaceholderRef = useRef(placeholder)
  const initialValueRef = useRef(value)
  const labelId = 'source-text-editor-label'

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!editorParentRef.current) {
      return
    }

    const editorView = new EditorView({
      parent: editorParentRef.current,
      state: EditorState.create({
        doc: initialValueRef.current,
        extensions: [
          sourceEditorSetup,
          qhelperEditorTheme,
          editorPlaceholder(initialPlaceholderRef.current),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged && !isSyncingExternalValueRef.current) {
              onChangeRef.current(update.state.doc.toString())
            }
          }),
        ],
      }),
    })

    editorViewRef.current = editorView

    return () => {
      editorView.destroy()
      editorViewRef.current = null
    }
  }, [])

  useEffect(() => {
    const editorView = editorViewRef.current
    if (!editorView) {
      return
    }

    const currentValue = editorView.state.doc.toString()
    if (currentValue === value) {
      return
    }

    isSyncingExternalValueRef.current = true
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: value,
      },
    })
    isSyncingExternalValueRef.current = false
  }, [value])

  return (
    <section
      className="min-h-0 flex-1 overflow-hidden bg-transparent"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="sr-only">
        粘贴原始文本
      </span>
      <div
        ref={editorParentRef}
        data-testid="source-text-editor"
        className="h-full min-h-0"
      />
    </section>
  )
}
