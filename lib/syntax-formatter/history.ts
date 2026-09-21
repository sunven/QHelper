import {
  getLocalPersistedData,
  getToolStateStorageKey,
  removeLocalPersistedData,
  setLocalPersistedData,
} from '@/lib/chrome/local-persisted-data'
import type { HistoryEntry } from '@/lib/tool-history-store'
import {
  type FormatterDirection,
  type FormatterLanguage,
  SYNTAX_FORMATTER_ALIASES,
  SYNTAX_FORMATTER_ID,
} from './aliases'
import { DEFAULT_HTML_OPTIONS, type HtmlFormatterOptions } from './html'

export const FORMATTER_HISTORY_KEY = `${SYNTAX_FORMATTER_ID}-state`
export const FORMATTER_HISTORY_MAX = 10

export const formatterHistoryStorageKey = getToolStateStorageKey(
  SYNTAX_FORMATTER_ID,
  FORMATTER_HISTORY_KEY,
)
export const formatterHistoryMigratedKey = getToolStateStorageKey(
  SYNTAX_FORMATTER_ID,
  'history-migrated',
)

export type FormatterHistorySnapshot = {
  input: string
  language: FormatterLanguage
  mode: FormatterDirection
  htmlOptions: HtmlFormatterOptions
}

const LEGACY_SOURCES = SYNTAX_FORMATTER_ALIASES.map((alias) => ({
  language: alias.language,
  storageKey: getToolStateStorageKey(alias.id, `${alias.id}-state`),
}))

function isDirection(value: unknown): value is FormatterDirection {
  return value === 'beautify' || value === 'minify'
}

function readHtmlOptions(options: unknown): HtmlFormatterOptions {
  if (!options || typeof options !== 'object') {
    return DEFAULT_HTML_OPTIONS
  }

  const record = options as Record<string, unknown>
  return {
    indentSize:
      typeof record.indentSize === 'number'
        ? record.indentSize
        : DEFAULT_HTML_OPTIONS.indentSize,
    indentChar: record.indentChar === 'tab' ? 'tab' : 'space',
    wrapLineLength:
      typeof record.wrapLineLength === 'number'
        ? record.wrapLineLength
        : DEFAULT_HTML_OPTIONS.wrapLineLength,
  }
}

export function snapshotFromLegacyEntry(
  language: FormatterLanguage,
  entry: HistoryEntry<unknown>,
): HistoryEntry<FormatterHistorySnapshot> | null {
  const raw = entry.input
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as { input?: unknown; options?: unknown }
  if (typeof record.input !== 'string') {
    return null
  }

  const options =
    record.options && typeof record.options === 'object'
      ? (record.options as Record<string, unknown>)
      : {}

  return {
    id: entry.id,
    timestamp: entry.timestamp,
    metadata: entry.metadata,
    input: {
      input: record.input,
      language,
      mode: isDirection(options.mode) ? options.mode : 'beautify',
      htmlOptions: readHtmlOptions(record.options),
    },
  }
}

function mergeByTimestamp(
  entries: HistoryEntry<FormatterHistorySnapshot>[],
): HistoryEntry<FormatterHistorySnapshot>[] {
  const byId = new Map<string, HistoryEntry<FormatterHistorySnapshot>>()
  for (const entry of entries) {
    byId.set(entry.id, entry)
  }

  return [...byId.values()]
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(-FORMATTER_HISTORY_MAX)
}

export async function migrateLegacyFormatterHistory(): Promise<
  HistoryEntry<FormatterHistorySnapshot>[] | null
> {
  const alreadyMigrated = await getLocalPersistedData<boolean>(
    formatterHistoryMigratedKey,
  )
  if (alreadyMigrated) {
    return null
  }

  const current =
    (await getLocalPersistedData<HistoryEntry<FormatterHistorySnapshot>[]>(
      formatterHistoryStorageKey,
      [],
    )) ?? []

  const migrated: HistoryEntry<FormatterHistorySnapshot>[] = []
  for (const source of LEGACY_SOURCES) {
    const legacy =
      (await getLocalPersistedData<HistoryEntry<unknown>[]>(
        source.storageKey,
        [],
      )) ?? []
    for (const entry of legacy) {
      const snapshot = snapshotFromLegacyEntry(source.language, entry)
      if (snapshot) {
        migrated.push(snapshot)
      }
    }
  }

  const merged = mergeByTimestamp([...current, ...migrated])
  await setLocalPersistedData(formatterHistoryStorageKey, merged)
  await setLocalPersistedData(formatterHistoryMigratedKey, true)

  await Promise.all(
    LEGACY_SOURCES.map((source) => removeLocalPersistedData(source.storageKey)),
  )

  return merged
}
