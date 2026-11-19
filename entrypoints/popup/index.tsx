import { GearSixIcon, WrenchIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { AutoRefreshPanel } from '@/components/AutoRefreshPanel'
import { ToolDiscovery } from '@/components/ToolDiscovery'
import { getToolIcon } from '@/components/tool-icons'
import { Button } from '@/components/ui/button'
import { create, getCurrent } from '@/lib/chrome/tabs'
import { getSiteOrigin } from '@/lib/site-data/target'
import {
  getLaunchDirectory,
  getLaunchEntry,
  TOOL_SETTINGS_ID,
  type ToolCatalogLaunchEntry,
} from '@/lib/tool-catalog'
import '@fontsource-variable/jetbrains-mono'
import '../../index.css'
import './popup.css'

const CLEAR_SITE_DATA_TOOL_ID = 'clear-site-data'
const POPUP_DIRECTORY = getLaunchDirectory('popup-main')
const SETTINGS_ENTRY = getLaunchEntry(TOOL_SETTINGS_ID, {
  visibleOn: 'popup-header',
})

async function getSiteDataLaunchPath(extensionPath: string): Promise<string> {
  const tab = await getCurrent()
  const origin = getSiteOrigin(tab?.url)
  if (!origin) {
    return extensionPath
  }

  const params = new URLSearchParams({ origin })
  if (tab?.id !== undefined) {
    params.set('tabId', String(tab.id))
  }

  return `${extensionPath}?${params.toString()}`
}

async function handleLaunchEntryClick(entry: ToolCatalogLaunchEntry) {
  try {
    switch (entry.intent.kind) {
      case 'ordinary-tool-page': {
        const extensionPath =
          entry.id === CLEAR_SITE_DATA_TOOL_ID
            ? await getSiteDataLaunchPath(entry.intent.extensionPath)
            : entry.intent.extensionPath
        await create(extensionPath)
        return
      }
      case 'system-page':
      case 'extension-page':
        await create(entry.intent.extensionPath)
        return
      case 'side-panel-action':
        await chrome.runtime.sendMessage({ type: 'OPEN_WEB_SUMMARY' })
        return
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    alert(message)
  }
}

function App() {
  const [searching, setSearching] = useState(false)

  return (
    <main className="flex flex-col gap-3 px-4 py-3">
      <header className="flex h-7 items-center justify-between">
        <h1 className="flex items-center gap-2 text-base font-medium">
          <span className="grid size-6 place-items-center rounded-sm bg-primary text-primary-foreground">
            <WrenchIcon aria-hidden className="size-4" weight="duotone" />
          </span>
          QHelper
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="打开设置"
          data-testid="popup-settings-link"
          title={SETTINGS_ENTRY?.name ?? '设置'}
          onClick={() => {
            if (SETTINGS_ENTRY) void handleLaunchEntryClick(SETTINGS_ENTRY)
          }}
        >
          <GearSixIcon aria-hidden />
        </Button>
      </header>

      <AutoRefreshPanel />

      <ToolDiscovery
        surface="popup"
        entries={POPUP_DIRECTORY.entries}
        onLaunch={handleLaunchEntryClick}
        onSearchingChange={setSearching}
      />

      {!searching && (
        <nav
          aria-label="工具目录"
          className="popup-directory grid gap-x-1 gap-y-2"
        >
          {POPUP_DIRECTORY.groups.map((group) => (
            <section
              key={group.category}
              className="col-span-full grid grid-cols-subgrid"
            >
              <h2 className="col-span-full flex items-center gap-2 text-xs font-medium after:h-px after:flex-1 after:bg-border">
                {group.name}
                <span className="font-mono font-normal text-muted-foreground tabular-nums">
                  {group.entries.length}
                </span>
              </h2>
              {group.entries.map((entry) => (
                <ToolButton key={entry.id} entry={entry} />
              ))}
            </section>
          ))}
        </nav>
      )}
    </main>
  )
}

function ToolButton({ entry }: { entry: ToolCatalogLaunchEntry }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-testid={`tool-${entry.id}`}
      aria-label={`${entry.name}: ${entry.description ?? ''}`}
      title={entry.description}
      onClick={() => handleLaunchEntryClick(entry)}
      className="h-8 justify-start gap-2 px-1 font-normal"
    >
      <span
        aria-hidden="true"
        className="grid size-4 shrink-0 place-items-center text-muted-foreground"
      >
        {getToolIcon(entry.icon)}
      </span>
      <span>{entry.name}</span>
    </Button>
  )
}

const root = document.getElementById('app')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}
