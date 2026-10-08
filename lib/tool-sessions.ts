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
  const values = { ...session.values }
  const state = values.state as Record<string, unknown> | undefined
  if (state && session.toolId === 'markdown')
    values.state = { input: state.input }
  if (state && session.toolId === 'cron')
    values.state = { expression: state.expression, interval: state.interval }
  if (state && session.toolId === 'jsonschema')
    values.state = { jsonData: state.jsonData, jsonSchema: state.jsonSchema }
  if (session.toolId === 'text-preview' && values.workspace) {
    const workspace = values.workspace as { tabs: Record<string, unknown>[] }
    values.workspace = {
      ...workspace,
      tabs: workspace.tabs.map((tab) => ({
        ...tab,
        source: { kind: 'manual' },
        fileStatus: { kind: 'manual' },
      })),
    }
  }
  return JSON.parse(JSON.stringify(values)) as Record<string, unknown>
}
