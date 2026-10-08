import {
  ArrowRightLeft,
  Clock,
  Download,
  FileJson,
  FileWarning,
  Minus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactJsonViewModule from 'react-json-view'
import { ToolHistoryList } from '@/components/tool/ToolHistoryList'
import {
  useCurrentToolSession,
  useSessionState,
} from '@/components/tool/ToolSessionContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  type KeyboardShortcut,
  useKeyboardShortcuts,
} from '@/hooks/useKeyboardShortcuts'
import { useToolHistory } from '@/hooks/useToolHistory'
import { JsonDiffPanel } from './JsonDiffPanel'

// The UMD package can retain its default wrapper in production builds.
const ReactJsonView =
  (ReactJsonViewModule as unknown as { default?: typeof ReactJsonViewModule })
    .default ?? ReactJsonViewModule

// 文件大小阈值
const SIZE_THRESHOLDS = {
  SMALL: 100 * 1024, // 100KB
  MEDIUM: 1024 * 1024, // 1MB
  LARGE: 10 * 1024 * 1024, // 10MB
  WARNING: 5 * 1024 * 1024, // 5MB - 显示警告
}

// 获取文件大小描述
function getFileSizeDescription(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 10 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// 防抖函数
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function JsonTool() {
  const session = useCurrentToolSession()
  const [jsoncon, setJsoncon] = useSessionState('jsoncon', '')
  const [newjsoncon, setNewjsoncon] = useSessionState('newjsoncon', '')
  const [baseview, setBaseview] = useSessionState<'formatter' | 'diff'>(
    'baseview',
    'formatter',
  )
  const [view, setView] = useState<'code' | 'error' | 'empty' | 'compress'>(
    'empty',
  )
  const [jsonhtml, setJsonhtml] = useState<object | null>(null)
  const [compressStr, setCompressStr] = useState('')
  const [error, setError] = useState('')
  const [isSaveShow, setIsSaveShow] = useState(false)
  const [historyName, setHistoryName] = useState('')
  const [isExportTxtShow, setIsExportTxtShow] = useState(false)
  const [exTxtName, setExTxtName] = useState('')

  // 性能优化相关状态
  const [processingTime, setProcessingTime] = useState<number>(0)
  const [inputSize, setInputSize] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const parsingStartTimeRef = useRef<number>(0)

  // 使用防抖输入，对于大文件延迟解析
  const debouncedJsoncon = useDebounce(
    jsoncon,
    inputSize > SIZE_THRESHOLDS.MEDIUM ? 500 : 200,
  )

  // 使用工具历史记录 Hook
  const {
    history,
    loading: historyLoading,
    add,
    remove: removeHistoryEntry,
  } = useToolHistory<string>('json', { max: 50 })

  // 处理 JSON 输入变化
  useEffect(() => {
    // 更新输入大小
    setInputSize(jsoncon.length)

    if (baseview === 'formatter' && debouncedJsoncon) {
      setIsProcessing(true)
      parsingStartTimeRef.current = performance.now()

      // 使用 setTimeout 让 UI 有机会更新加载状态
      const timeoutId = setTimeout(() => {
        try {
          const parsed = JSON.parse(debouncedJsoncon)
          const endTime = performance.now()
          setProcessingTime(endTime - parsingStartTimeRef.current)
          setJsonhtml(parsed)
          setView('code')
          setError('')
        } catch (e) {
          setProcessingTime(0)
          setError(
            `JSON 解析错误：${e instanceof Error ? e.message : String(e)}`,
          )
          setView('error')
          setJsonhtml(null)
        } finally {
          setIsProcessing(false)
        }
      }, 0)

      return () => clearTimeout(timeoutId)
    } else if (!debouncedJsoncon) {
      setJsonhtml(null)
      setView('empty')
      setError('')
      setProcessingTime(0)
      setIsProcessing(false)
    }
  }, [debouncedJsoncon, baseview])

  // 压缩
  const compress = useCallback(() => {
    try {
      const parsed = JSON.parse(jsoncon)
      setCompressStr(JSON.stringify(parsed))
      setView('compress')
    } catch (e) {
      setError(`JSON 解析错误：${e instanceof Error ? e.message : String(e)}`)
    }
  }, [jsoncon])

  // 美化
  const beauty = useCallback(() => {
    try {
      const parsed = JSON.parse(jsoncon)
      setJsonhtml(parsed)
      setCompressStr('')
      setView('code')
      setError('')
    } catch (e) {
      setError(`JSON 解析错误：${e instanceof Error ? e.message : String(e)}`)
      setView('error')
      setJsonhtml(null)
    }
  }, [jsoncon])

  // 清空
  const clearAll = useCallback(() => {
    setJsoncon('')
    setNewjsoncon('')
    setJsonhtml(null)
    setCompressStr('')
    setError('')
    setView('empty')
  }, [setJsoncon, setNewjsoncon])

  // 切换到 Diff 视图
  const baseViewToDiff = useCallback(() => {
    setBaseview('diff')
  }, [setBaseview])

  // 切换到格式化视图
  const baseViewToFormatter = useCallback(() => {
    setBaseview('formatter')
  }, [setBaseview])

  // 注册键盘快捷键
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        description: '清空输入',
        action: clearAll,
      },
      {
        key: 'Enter',
        ctrlKey: true,
        metaKey: true,
        description: '执行格式化',
        action: () => {
          if (baseview === 'formatter') beauty()
        },
      },
      {
        key: 's',
        ctrlKey: true,
        metaKey: true,
        description: '保存历史',
        action: () => {
          if (jsoncon) setIsSaveShow(true)
        },
      },
      {
        key: 'd',
        ctrlKey: true,
        metaKey: true,
        description: '切换到 Diff',
        action: baseViewToDiff,
      },
      {
        key: 'f',
        ctrlKey: true,
        metaKey: true,
        description: '切换到格式化',
        action: baseViewToFormatter,
      },
    ],
    [jsoncon, baseview, clearAll, beauty, baseViewToDiff, baseViewToFormatter],
  )

  // 使用键盘快捷键 Hook
  useKeyboardShortcuts({ shortcuts, isEnabled: true })

  // 保存历史记录
  function saveHistory() {
    if (session?.temporary) {
      void session.saveSnapshot?.()
      setIsSaveShow(false)
      return
    }
    if (!historyName || !jsoncon) return
    try {
      JSON.parse(jsoncon)
      add(jsoncon, { name: historyName })
      setIsSaveShow(false)
      setHistoryName('')
    } catch {
      // 忽略无效 JSON
    }
  }

  // 导出文本文件
  function exportTxt() {
    if (!exTxtName || !jsoncon) return
    const blob = new Blob([jsoncon], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exTxtName}.txt`
    link.click()
    URL.revokeObjectURL(url)
    setIsExportTxtShow(false)
    setExTxtName('')
  }

  // 性能指示器组件
  const PerformanceIndicator = useMemo(() => {
    if (!jsoncon && !inputSize) return null

    const showWarning = inputSize >= SIZE_THRESHOLDS.WARNING
    const sizeText = getFileSizeDescription(inputSize)

    return (
      <div
        className={`flex items-center gap-2 text-xs ${
          showWarning
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-muted-foreground'
        }`}
      >
        {showWarning && <FileWarning className="w-3 h-3" />}
        <span>{sizeText}</span>
        {processingTime > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{processingTime.toFixed(1)}ms</span>
            </div>
          </>
        )}
        {isProcessing && (
          <>
            <span className="text-muted-foreground">•</span>
            <span className="animate-pulse">处理中...</span>
          </>
        )}
      </div>
    )
  }, [inputSize, processingTime, isProcessing, jsoncon])

  return (
    <>
      <div className="flex min-h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-none border border-slate-200/80 bg-white/92 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 bg-muted/40 p-2">
          <Button
            variant={baseview === 'formatter' ? 'default' : 'outline'}
            size="sm"
            onClick={baseViewToFormatter}
            className="gap-1.5"
          >
            <FileJson className="w-4 h-4" />
            格式化
          </Button>
          <Button
            variant={baseview === 'diff' ? 'default' : 'outline'}
            size="sm"
            onClick={baseViewToDiff}
            className="gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Diff
          </Button>

          {/* 性能指示器 */}
          {PerformanceIndicator}

          {baseview === 'formatter' && (
            <>
              <div className="w-px h-6 bg-border mx-2" />
              <Button
                variant="outline"
                size="sm"
                onClick={compress}
                className="gap-1.5"
              >
                <Minus className="w-4 h-4" />
                压缩
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={beauty}
                className="gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                美化
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                清空
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportTxtShow(true)}
                className="gap-1.5"
              >
                <Download className="w-4 h-4" />
                导出
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSaveShow(true)}
                className="gap-1.5"
              >
                <Save className="w-4 h-4" />
                保存
              </Button>
            </>
          )}
        </div>

        {/* 主内容区 */}
        {baseview === 'diff' ? (
          <JsonDiffPanel
            original={jsoncon}
            modified={newjsoncon}
            onOriginalChange={setJsoncon}
            onModifiedChange={setNewjsoncon}
          />
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 border-r">
              <Textarea
                value={jsoncon}
                onChange={(e) => setJsoncon(e.target.value)}
                placeholder="请输入 JSON 字符串"
                data-testid="json-input"
                className="w-full h-full border-0 rounded-none resize-none font-mono text-sm"
              />
            </div>

            {/* 右侧结果 */}
            <div className="flex-1 overflow-auto">
              {isProcessing && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-current mb-4" />
                  <p className="text-sm">处理中...</p>
                  {inputSize > SIZE_THRESHOLDS.MEDIUM && (
                    <p className="text-xs mt-2">大文件处理可能需要较长时间</p>
                  )}
                </div>
              )}

              {!isProcessing && view === 'code' && jsonhtml && (
                <div className="p-2.5">
                  <ReactJsonView
                    src={jsonhtml}
                    theme="monokai"
                    enableClipboard
                    shouldCollapse={(field) => {
                      // 对于大型对象，默认折叠以提高性能
                      if (inputSize > SIZE_THRESHOLDS.MEDIUM) {
                        return typeof field !== 'string'
                      }
                      return false
                    }}
                    displayObjectSize={inputSize <= SIZE_THRESHOLDS.LARGE}
                    displayDataTypes={inputSize <= SIZE_THRESHOLDS.LARGE}
                  />
                </div>
              )}

              {view === 'empty' && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <FileJson className="mx-auto mb-1 h-8 w-8 opacity-50" />
                  <p>请输入 JSON 字符串</p>
                </div>
              )}

              {view === 'compress' && (
                <Textarea
                  value={compressStr}
                  readOnly
                  className="w-full h-full border-0 rounded-none resize-none font-mono text-sm bg-muted/30"
                />
              )}

              {view === 'error' && (
                <div className="whitespace-pre-wrap p-2.5 font-mono text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ToolHistoryList
        entries={history}
        onRemove={(id) => void removeHistoryEntry(id)}
        onSelect={(entry) => setJsoncon(entry.input)}
        renderItem={(entry) => (
          <div className="line-clamp-1 font-mono text-xs text-muted-foreground">
            {(entry.metadata?.name as string) ||
              `历史记录 ${new Date(entry.timestamp).toLocaleString()}`}
          </div>
        )}
      />

      {/* 保存对话框 */}
      {isSaveShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-base">保存历史</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={historyName}
                onChange={(e) => setHistoryName(e.target.value)}
                placeholder="请输入辨识名称"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSaveShow(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button onClick={saveHistory} className="flex-1">
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 导出对话框 */}
      {isExportTxtShow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-80">
            <CardHeader>
              <CardTitle className="text-base">导出为 .txt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={exTxtName}
                onChange={(e) => setExTxtName(e.target.value)}
                placeholder="请输入文件名"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsExportTxtShow(false)}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button onClick={exportTxt} className="flex-1">
                  下载
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
