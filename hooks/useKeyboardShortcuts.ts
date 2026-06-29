/**
 * 键盘快捷键 Hook
 *
 * 提供统一的键盘快捷键处理
 */

import { useCallback, useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
  preventDefault?: boolean
}

export interface KeyboardShortcuts {
  shortcuts: KeyboardShortcut[]
  isEnabled?: boolean
}

export function useKeyboardShortcuts({
  shortcuts,
  isEnabled = true,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled) return

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch =
          shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey
        const metaMatch =
          shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey
        const shiftMatch =
          shortcut.shiftKey === undefined ||
          event.shiftKey === shortcut.shiftKey
        const altMatch =
          shortcut.altKey === undefined || event.altKey === shortcut.altKey

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.action()
          return
        }
      }
    },
    [shortcuts, isEnabled],
  )

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [handleKeyDown, isEnabled])

  return { shortcuts }
}
