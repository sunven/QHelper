import {
  createMemoryDataStore,
  createToolDataStore,
  type DataStore,
} from './tool-data/storage'

export type ToolSession = {
  id: string
  toolId: string
  temporary: boolean
  values: Record<string, unknown>
  storage: DataStore
  saveSnapshot?: () => Promise<void>
}

export function createToolSession(
  toolId: string,
  temporary = false,
  values: Record<string, unknown> = {},
): ToolSession {
  return {
    id: crypto.randomUUID(),
    toolId,
    temporary,
    values: structuredClone(values),
    storage: temporary ? createMemoryDataStore() : createToolDataStore(toolId),
  }
}

export function serializeSession(
  session: ToolSession,
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(session.values)) as Record<string, unknown>
}
