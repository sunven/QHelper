import { Clipboard, FolderOpen, Save, SaveAll } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TooltipProvider } from '@/components/ui/tooltip'
import { copyText } from '@/lib/text-preview/copy'
import { parseText } from '@/lib/text-preview/parser/pipeline'
import { CANONICAL_SAMPLE } from '@/lib/text-preview/sample'
import { DebugPanel } from './DebugPanel'
import { FileStatusPanel } from './FileStatusPanel'
import { ResultList } from './ResultList'
import { SourceTextEditor } from './SourceTextEditor'
import { Warnings, WorkspaceWarning } from './StatusMessages'
import { WorkspaceTabs } from './WorkspaceTabs'
import { useMediaQuery } from './useMediaQuery'
import { useWorkspaceController } from './useWorkspaceController'

const CLOSE_CONFIRM_MS = 3000
const STACKED_LAYOUT_QUERY = '(max-width: 860px)'

export function App() {
  const {
    actions,
    activeTab,
    fileAccessSupported,
    liveMessage,
    setLiveMessage,
    workspace,
    workspaceWarning,
  } = useWorkspaceController()
  const [copyState, setCopyState] = useState<Record<string, 'copied' | 'failed'>>(
    {},
  )
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [closeConfirmTabId, setCloseConfirmTabId] = useState<string | null>(null)

  const activeInput = activeTab.input
  const result = useMemo(() => parseText(activeInput), [activeInput])
  const tabResultCounts = useMemo(
    () =>
      Object.fromEntries(
        workspace.tabs.map((tab) => [
          tab.id,
          tab.id === activeTab.id
            ? result.items.length
            : parseText(tab.input).items.length,
        ]),
      ),
    [activeTab.id, result.items.length, workspace.tabs],
  )
  const showDebug = useMemo(
    () => new URLSearchParams(window.location.search).has('debug'),
    [],
  )
  const hasInput = activeInput.trim().length > 0
  const isStackedLayout = useMediaQuery(STACKED_LAYOUT_QUERY)
  const canSaveActive =
    activeTab.source.kind === 'local-file' &&
    ['dirty', 'permission-needed', 'save-failed'].includes(
      activeTab.fileStatus.kind,
    )
  const canSaveAny = workspace.tabs.some(
    (tab) =>
      tab.source.kind === 'local-file' &&
      ['dirty', 'permission-needed', 'save-failed'].includes(
        tab.fileStatus.kind,
      ),
  )

  function handleSelectTab(tabId: string) {
    actions.selectTab(tabId)
    setCopyState({})
  }

  function handleAddTab() {
    actions.addTab()
    setCopyState({})
  }

  function handleUpdateActiveInput(input: string) {
    actions.updateActiveInput(input)
  }

  function handleRenameTab(tabId: string, title: string) {
    actions.renameTab(tabId, title)
    setEditingTabId(null)
  }

  function handleCloseTab(tabId: string) {
    const targetTab = workspace.tabs.find((tab) => tab.id === tabId)
    if (!targetTab) {
      return
    }

    if (targetTab.input.trim().length > 0 && closeConfirmTabId !== tabId) {
      setCloseConfirmTabId(tabId)
      setLiveMessage('再次点击删除按钮会删除这个标签。')
      window.setTimeout(() => {
        setCloseConfirmTabId((current) => (current === tabId ? null : current))
      }, CLOSE_CONFIRM_MS)
      return
    }

    actions.closeTab(tabId)
    setCopyState({})
    setCloseConfirmTabId(null)
    setEditingTabId(null)
  }

  function handleClearWorkspace() {
    void actions.clearWorkspace()
    setCopyState({})
    setEditingTabId(null)
    setCloseConfirmTabId(null)
  }

  async function handleCopy(key: string, value: string) {
    const result = await copyText(value)
    if (result.ok) {
      setCopyState((state) => ({ ...state, [key]: 'copied' }))
      setLiveMessage('已复制。')
      window.setTimeout(() => {
        setCopyState((state) => {
          const next = { ...state }
          delete next[key]
          return next
        })
      }, 1500)
      return
    }

    setCopyState((state) => ({ ...state, [key]: 'failed' }))
    setLiveMessage('浏览器阻止了自动复制。请手动复制下方完整内容。')
  }

  return (
    <TooltipProvider>
      <ToolPageShell
        toolId="text-preview"
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="z-10 flex-none bg-white/90 backdrop-blur-[14px]">
            <header className="flex min-h-12 items-center justify-between gap-4 border-b border-[var(--border)] bg-transparent p-2 max-[860px]:flex-col max-[860px]:items-start">
              <div className="min-w-0">
                <h2 className="m-0 text-lg font-semibold leading-tight">
                  文本预览
                </h2>
                <p className="m-0 text-xs text-[var(--text-muted)]">
                  本地提取 IP、URL、命令和路径；不上传文本。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!fileAccessSupported}
                    title={
                      fileAccessSupported
                        ? '打开可按文本读取的本地文件'
                        : '当前浏览器不支持打开并保存本地文件'
                    }
                    onClick={() => void actions.openFiles()}
                  >
                    <FolderOpen data-icon="inline-start" aria-hidden="true" />
                    打开文件
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canSaveActive}
                    onClick={() => void actions.saveActiveFile()}
                  >
                    <Save data-icon="inline-start" aria-hidden="true" />
                    保存
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canSaveAny}
                    onClick={() => void actions.saveAllFiles()}
                  >
                    <SaveAll data-icon="inline-start" aria-hidden="true" />
                    保存全部
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateActiveInput(CANONICAL_SAMPLE)}
                  >
                    <Clipboard data-icon="inline-start" aria-hidden="true" />
                    填入示例
                  </Button>
                </div>
              </div>
            </header>

            <WorkspaceTabs
              activeTabId={activeTab.id}
              closeConfirmTabId={closeConfirmTabId}
              editingTabId={editingTabId}
              onAddTab={handleAddTab}
              onClearWorkspace={handleClearWorkspace}
              onCloseTab={handleCloseTab}
              onRenameTab={handleRenameTab}
              onSelectTab={handleSelectTab}
              onStartEditing={setEditingTabId}
              tabResultCounts={tabResultCounts}
              tabs={workspace.tabs}
            />
          </div>

          <ResizablePanelGroup
            className="min-h-0 flex-1 gap-1"
            orientation={isStackedLayout ? 'vertical' : 'horizontal'}
          >
            <ResizablePanel
              className="flex min-h-0 min-w-0 flex-col overflow-hidden"
              defaultSize={33}
              minSize={25}
            >
              <section
                className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--surface)] ring-1 ring-foreground/10"
                aria-label="原始文本"
              >
                <FileStatusPanel
                  tab={activeTab}
                  onDownloadCopy={actions.downloadActiveFileCopy}
                  onForceOverwrite={() => void actions.saveActiveFile(true)}
                  onReload={() => void actions.reloadActiveFile()}
                />
                <SourceTextEditor
                  value={activeInput}
                  onChange={handleUpdateActiveInput}
                  placeholder="粘贴当前项目文本后，右侧会在本地提取 IP、URL、路径、命令。内容会保存在本机浏览器。"
                />
                {workspaceWarning ? (
                  <WorkspaceWarning message={workspaceWarning} />
                ) : null}
                {!fileAccessSupported ? (
                  <WorkspaceWarning message="当前浏览器不支持打开并保存本地文件。请使用 Chrome 或 Edge；粘贴和复制功能仍可继续使用。" />
                ) : null}
                <Warnings result={result} />
              </section>
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="bg-transparent data-[orientation=horizontal]:py-1.5 data-[orientation=vertical]:px-1.5 [&>div]:bg-[var(--border-strong)]"
            />

            <ResizablePanel
              className="flex min-h-0 min-w-0 flex-col overflow-hidden"
              defaultSize={67}
              minSize={30}
            >
              <section
                className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--surface)] ring-1 ring-foreground/10"
                aria-label="提取结果"
              >
                <ScrollArea
                  className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]]:[scrollbar-gutter:stable]"
                  aria-label="提取结果内容"
                >
                  <ResultList
                    result={result}
                    copyState={copyState}
                    onCopy={handleCopy}
                    hasInput={hasInput}
                    tabId={activeTab.id}
                  />

                  {showDebug ? (
                    <div className="mt-4">
                      <DebugPanel result={result} />
                    </div>
                  ) : null}
                </ScrollArea>
              </section>
            </ResizablePanel>
          </ResizablePanelGroup>

          <div className="sr-only" role="status" aria-live="polite">
            {liveMessage}
          </div>
        </div>
      </ToolPageShell>
    </TooltipProvider>
  )
}
