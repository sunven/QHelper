import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useContext,
  useState,
} from 'react'
import type { ToolSession } from '@/lib/tool-sessions'

export const ToolSessionContext = createContext<ToolSession | null>(null)
export const ToolSessionActions = createContext<{
  openTemporarySession: (
    toolId: string,
    values?: Record<string, unknown>,
  ) => void
} | null>(null)

export function useCurrentToolSession() {
  return useContext(ToolSessionContext)
}

/** Bind a tool's resumable input/options to its page-local session. */
export function useSessionState<T>(
  key: string,
  initial: T | (() => T),
  content?: true | readonly string[],
): [T, Dispatch<SetStateAction<T>>] {
  const session = useCurrentToolSession()
  const [value, setValue] = useState<T>(() => {
    let defaults =
      typeof initial === 'function' ? (initial as () => T)() : initial
    if (session?.temporary) {
      if (content === true) defaults = '' as T
      else if (content)
        defaults = {
          ...defaults,
          ...Object.fromEntries(content.map((field) => [field, ''])),
        }
    }
    if (session && key in session.values) {
      const saved = session.values[key]
      return defaults &&
        typeof defaults === 'object' &&
        !Array.isArray(defaults)
        ? { ...defaults, ...(saved as object) }
        : (saved as T)
    }
    return defaults
  })
  if (session) session.values[key] = value
  const update = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      setValue((previous) => {
        const result =
          typeof next === 'function'
            ? (next as (previous: T) => T)(previous)
            : next
        if (session) session.values[key] = result
        return result
      })
    },
    [key, session],
  )
  return [value, update]
}
