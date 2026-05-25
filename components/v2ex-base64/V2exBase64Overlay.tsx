import { Check, Copy, KeyRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { encodeUtf8Base64 } from '@/lib/base64'

type CopyState = 'idle' | 'copying' | 'copied' | 'failed'

export type V2exBase64OverlayProps = {
  entries: string[]
  copyText?: (value: string) => Promise<void>
}

const COPY_RESET_DELAY_MS = 1600

async function writeClipboard(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard unavailable')
  }

  await navigator.clipboard.writeText(value)
}

export function V2exBase64Overlay({
  entries,
  copyText = writeClipboard,
}: V2exBase64OverlayProps) {
  const [open, setOpen] = useState(false)
  const [copyStates, setCopyStates] = useState<Record<number, CopyState>>({})
  const [statusMessage, setStatusMessage] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const resetTimersRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      for (const timer of resetTimersRef.current) {
        window.clearTimeout(timer)
      }
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    closeButtonRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }

      const rootNode = panelRef.current?.getRootNode()
      const shadowHost =
        rootNode instanceof ShadowRoot ? rootNode.host : undefined

      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target) ||
        target === shadowHost
      ) {
        return
      }

      closePanel()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePanel()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function closePanel() {
    setOpen(false)
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus()
    })
  }

  async function handleCopy(entry: string, index: number) {
    setCopyStates((current) => ({ ...current, [index]: 'copying' }))

    try {
      await copyText(encodeUtf8Base64(entry))
      setCopyStates((current) => ({ ...current, [index]: 'copied' }))
      setStatusMessage(`第 ${index + 1} 行已复制`)
    } catch {
      setCopyStates((current) => ({ ...current, [index]: 'failed' }))
      setStatusMessage(`第 ${index + 1} 行复制失败`)
    }

    const timer = window.setTimeout(() => {
      setCopyStates((current) => ({ ...current, [index]: 'idle' }))
    }, COPY_RESET_DELAY_MS)
    resetTimersRef.current.push(timer)
  }

  return (
    <div className="qhelper-v2ex-base64">
      <button
        ref={triggerRef}
        type="button"
        className="qhelper-v2ex-base64__trigger"
        aria-label={open ? '关闭 V2EX Base64' : '打开 V2EX Base64'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <KeyRound aria-hidden="true" />
      </button>

      {open ? (
        <div
          ref={panelRef}
          className="qhelper-v2ex-base64__panel"
          role="dialog"
          aria-label="V2EX Base64"
        >
          <div className="qhelper-v2ex-base64__header">
            <h2 className="qhelper-v2ex-base64__title">V2EX Base64</h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="qhelper-v2ex-base64__close"
              aria-label="关闭 V2EX Base64"
              onClick={closePanel}
            >
              <X aria-hidden="true" />
            </button>
          </div>

          <div className="qhelper-v2ex-base64__rows">
            {entries.length > 0 ? (
              entries.map((entry, index) => {
                const state = copyStates[index] || 'idle'
                const copied = state === 'copied'
                const failed = state === 'failed'

                return (
                  <div className="qhelper-v2ex-base64__row" key={`${entry}-${index}`}>
                    <span className="qhelper-v2ex-base64__source" title={entry}>
                      {entry}
                    </span>
                    <button
                      type="button"
                      className="qhelper-v2ex-base64__copy"
                      aria-label={`复制第 ${index + 1} 行 Base64`}
                      disabled={state === 'copying'}
                      data-state={state}
                      onClick={() => void handleCopy(entry, index)}
                    >
                      {copied ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Copy aria-hidden="true" />
                      )}
                      <span>
                        {copied ? '已复制' : failed ? '复制失败' : '复制'}
                      </span>
                    </button>
                  </div>
                )
              })
            ) : (
              <p className="qhelper-v2ex-base64__empty">
                没有可复制的字符串
              </p>
            )}
          </div>

          <p className="qhelper-v2ex-base64__live" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      ) : null}
    </div>
  )
}
