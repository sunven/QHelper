import { CirclePlus, Eraser, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MAX_WORKSPACE_TABS, type WorkspaceTab } from '@/lib/text-preview/workspace'
import { cn } from '@/lib/utils'
import { IconTooltip } from './IconTooltip'

type WorkspaceTabsProps = {
  activeTabId: string
  closeConfirmTabId: string | null
  editingTabId: string | null
  onAddTab: () => void
  onClearWorkspace: () => void
  onCloseTab: (tabId: string) => void
  onRenameTab: (tabId: string, title: string) => void
  onSelectTab: (tabId: string) => void
  onStartEditing: (tabId: string | null) => void
  tabResultCounts: Record<string, number>
  tabs: WorkspaceTab[]
}

export function WorkspaceTabs({
  activeTabId,
  closeConfirmTabId,
  editingTabId,
  onAddTab,
  onClearWorkspace,
  onCloseTab,
  onRenameTab,
  onSelectTab,
  onStartEditing,
  tabResultCounts,
  tabs,
}: WorkspaceTabsProps) {
  return (
    <nav
      className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-transparent p-2 max-[860px]:flex-col max-[860px]:items-stretch"
      aria-label="本地工作区标签"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 max-[860px]:w-full">
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:thin]">
          <Tabs
            className="min-w-max flex-none"
            value={activeTabId}
            onValueChange={(tabId) => {
              onStartEditing(null)
              onSelectTab(tabId)
            }}
          >
            <TabsList variant="line" aria-label="项目标签">
              {tabs.map((tab) =>
                tab.id === editingTabId && tab.source.kind === 'manual' ? (
                  <div
                    className={cn(
                      'relative flex h-[calc(100%-1px)] w-56 min-w-0 items-center gap-0.5 px-1.5 after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground',
                      tab.id === activeTabId
                        ? 'after:opacity-100'
                        : 'after:opacity-0',
                    )}
                    key={tab.id}
                  >
                    <TabTitleInput
                      onRename={(title) => onRenameTab(tab.id, title)}
                      tab={tab}
                    />
                    <TabDeleteButton
                      isConfirming={closeConfirmTabId === tab.id}
                      onCloseTab={() => onCloseTab(tab.id)}
                      tab={tab}
                    />
                  </div>
                ) : (
                  <WorkspaceTabTrigger
                    isActive={tab.id === activeTabId}
                    isCloseConfirming={closeConfirmTabId === tab.id}
                    itemCount={tabResultCounts[tab.id] ?? 0}
                    key={tab.id}
                    onCloseTab={() => onCloseTab(tab.id)}
                    onStartEditing={() =>
                      onStartEditing(tab.source.kind === 'manual' ? tab.id : null)
                    }
                    tab={tab}
                  />
                ),
              )}
            </TabsList>
          </Tabs>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="新建标签"
          title="新建标签"
          disabled={tabs.length >= MAX_WORKSPACE_TABS}
          onClick={onAddTab}
        >
          <CirclePlus data-icon="inline-start" aria-hidden="true" />
          <span>新建</span>
        </Button>
      </div>
      <div className="flex flex-none items-center gap-1.5 max-[860px]:self-end">
        <Button type="button" variant="destructive" onClick={onClearWorkspace}>
          <Eraser data-icon="inline-start" aria-hidden="true" />
          清空全部
        </Button>
      </div>
    </nav>
  )
}

type WorkspaceTabTriggerProps = {
  isActive: boolean
  isCloseConfirming: boolean
  itemCount: number
  onCloseTab: () => void
  onStartEditing: () => void
  tab: WorkspaceTab
}

function WorkspaceTabTrigger({
  isActive,
  isCloseConfirming,
  itemCount,
  onCloseTab,
  onStartEditing,
  tab,
}: WorkspaceTabTriggerProps) {
  return (
    <div
      className={cn(
        'group/tab-item relative flex h-[calc(100%-1px)] min-w-0 items-center gap-0.5 after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground',
        isActive ? 'after:opacity-100' : 'after:opacity-0',
      )}
      role="presentation"
    >
      <TabsTrigger
        value={tab.id}
        aria-label={`${tab.title}，${itemCount} 个对象`}
        className="min-w-0 flex-1 after:hidden"
        title={tab.title}
        onDoubleClick={onStartEditing}
      >
        <span className="max-w-40 truncate max-[620px]:max-w-[7.5rem]">
          {tab.title}
        </span>
        <Badge className="min-w-5 px-1" variant="secondary">
          {itemCount}
        </Badge>
        {tab.source.kind === 'local-file' ? (
          <Badge className="px-1" variant="outline" title="本地文件">
            本地文件
          </Badge>
        ) : null}
        {tab.source.kind === 'local-file' && tab.fileStatus.kind !== 'clean' ? (
          <Badge className="px-1" variant="outline">
            {fileStatusLabel(tab.fileStatus.kind)}
          </Badge>
        ) : null}
      </TabsTrigger>
      {tab.source.kind === 'manual' ? (
        <IconTooltip label={`重命名 ${tab.title}`}>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`重命名 ${tab.title}`}
            title={`重命名 ${tab.title}`}
            onClick={(event) => {
              event.stopPropagation()
              onStartEditing()
            }}
          >
            <Pencil data-icon="inline-start" aria-hidden="true" />
          </Button>
        </IconTooltip>
      ) : null}
      <TabDeleteButton
        isConfirming={isCloseConfirming}
        onCloseTab={onCloseTab}
        tab={tab}
      />
    </div>
  )
}

function fileStatusLabel(status: WorkspaceTab['fileStatus']['kind']) {
  switch (status) {
    case 'dirty':
      return '未保存'
    case 'saving':
      return '保存中'
    case 'conflict':
      return '冲突'
    case 'permission-needed':
      return '需授权'
    case 'handle-missing':
      return '需重开'
    case 'save-failed':
      return '失败'
    default:
      return ''
  }
}

type TabDeleteButtonProps = {
  isConfirming: boolean
  onCloseTab: () => void
  tab: WorkspaceTab
}

function TabDeleteButton({
  isConfirming,
  onCloseTab,
  tab,
}: TabDeleteButtonProps) {
  return (
    <IconTooltip
      label={isConfirming ? '再次点击确认删除' : `删除 ${tab.title}`}
    >
      <Button
        type="button"
        variant={isConfirming ? 'destructive' : 'ghost'}
        size="icon-xs"
        aria-label={
          isConfirming ? `确认删除 ${tab.title}` : `删除 ${tab.title}`
        }
        title={isConfirming ? '再次点击确认删除' : `删除 ${tab.title}`}
        onClick={(event) => {
          event.stopPropagation()
          onCloseTab()
        }}
      >
        <X data-icon="inline-start" aria-hidden="true" />
      </Button>
    </IconTooltip>
  )
}

type TabTitleInputProps = {
  onRename: (title: string) => void
  tab: WorkspaceTab
}

function TabTitleInput({ onRename, tab }: TabTitleInputProps) {
  const [draftTitle, setDraftTitle] = useState(tab.title)

  return (
    <Input
      aria-label={`重命名 ${tab.title}`}
      autoFocus
      className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-[var(--text)]"
      value={draftTitle}
      onBlur={() => onRename(draftTitle)}
      onChange={(event) => setDraftTitle(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onRename(draftTitle)
        }
        if (event.key === 'Escape') {
          onRename(tab.title)
        }
      }}
    />
  )
}
