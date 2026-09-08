import { useCallback, useMemo, useState, type ComponentType } from 'react'
import { ArrowLeftRight, Download, FileCode, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CopyButton } from '@/components/tool/CopyButton'
import { useToolHistory } from '@/hooks/useToolHistory'

/** 一对转换方向：mode 决定转换方向，其余字段决定界面文案与图标 */
export type TransformDirection<Mode extends string> = {
  mode: Mode
  label: string
  inputLabel: string
  outputLabel: string
  icon?: React.ReactNode
}

/** transform 的统一返回：Error 即转换失败，错误信息在输出栏内联展示 */
export type TransformResult = string | Error

export type TransformToolPageConfig<Mode extends string, Options extends object> = {
  toolId: string
  /** 纯函数转换：输入 + 当前选项 → 输出或错误 */
  transform: (input: string, options: Omit<Options, 'mode'> & { mode: Mode }) => TransformResult
  /** 初始示例输入 */
  defaultInput: string
  /** 初始选项（不含 mode；mode 取 directions 第一项） */
  defaultOptions: Omit<Options, 'mode'>
  /** 转换方向列表；两项及以上时渲染方向按钮与交换按钮 */
  directions: TransformDirection<Mode>[]
  /** options 插槽：渲染工具特有控件（缩进选择等） */
  renderOptions?: (
    options: Omit<Options, 'mode'> & { mode: Mode },
    setOptions: (patch: Partial<Omit<Options, 'mode'>>) => void,
  ) => React.ReactNode
  /** 下载文件名：前缀与按 mode 的扩展名 */
  download: { prefix: string; extension: (mode: Mode) => string }
}

const FALLBACK_DIRECTION_ICON = <FileCode className="w-4 h-4" />

/**
 * Transform Tool Page 工厂：一个输入文本 → 一个派生输出的普通工具页。
 * 工厂拥有 state 形状（output 与 error 每次渲染派生，不进 state）、
 * 历史 key 推导与"成功才快照"守卫、下载与复制、双栏布局与内联错误展示；
 * transform 函数与 options 面板属于各工具的声明。
 */
export function createTransformToolPage<Mode extends string, Options extends object>(
  config: TransformToolPageConfig<Mode, Options>,
): ComponentType {
  const {
    toolId,
    transform,
    defaultInput,
    defaultOptions,
    directions,
    renderOptions,
    download,
  } = config

  function TransformToolPage() {
    // options 由 defaultOptions（工具特有字段）与 mode（方向）组成
    const [input, setInput] = useState(defaultInput)
    const [options, setOptions] = useState<Omit<Options, 'mode'> & { mode: Mode }>(
      () => ({
        ...defaultOptions,
        mode: directions[0].mode,
      }),
    )
    const { add, history } = useToolHistory<{
      input: string
      options: Omit<Options, 'mode'> & { mode: Mode }
    }>(toolId, {
      max: 10,
      key: `${toolId}-state`,
    })

    // directions/transform/download 来自工厂闭包，组件生命周期内稳定，不进依赖数组
    const direction = useMemo(
      () => directions.find((d) => d.mode === options.mode) ?? directions[0],
      [options.mode],
    )

    // output 与 error 是派生值：不入 state，也不入历史快照
    const result = useMemo<TransformResult>(() => {
      if (!input.trim()) {
        return ''
      }
      return transform(input, options)
    }, [input, options])

    const output = typeof result === 'string' ? result : ''
    const error = result instanceof Error ? result.message : null

    const handleDirectionChange = useCallback((mode: Mode) => {
      setOptions((prev) => ({ ...prev, mode }))
    }, [])

    const handleSwap = useCallback(() => {
      setOptions((prev) => {
        const index = directions.findIndex((d) => d.mode === prev.mode)
        const next = directions[(index + 1) % directions.length]
        return { ...prev, mode: next.mode }
      })
      setInput(output)
    }, [output])

    const handleOptionsChange = useCallback(
      (patch: Partial<Omit<Options, 'mode'>>) => {
        setOptions((prev) => ({ ...prev, ...patch }))
      },
      [],
    )

    const handleClear = useCallback(() => {
      setInput('')
    }, [])

    const handleDownload = useCallback(() => {
      if (!output || error) {
        return
      }
      const blob = new Blob([output], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = url
        a.download = `${download.prefix}-${Date.now()}.${download.extension(options.mode)}`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } finally {
        URL.revokeObjectURL(url)
      }
      add({ input, options })
    }, [output, error, input, options, add])

    return (
      <div className="mx-auto max-w-[1520px] space-y-2">
        {/* 顶栏：方向切换 + 交换 + 工具选项插槽 */}
        {(directions.length > 1 || renderOptions) && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 p-2">
              <div className="flex items-center gap-1.5">
                {directions.map((d) => (
                  <Button
                    key={d.mode}
                    type="button"
                    onClick={() => handleDirectionChange(d.mode)}
                    variant={options.mode === d.mode ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5"
                  >
                    {d.icon ?? FALLBACK_DIRECTION_ICON}
                    {d.label}
                  </Button>
                ))}
                {directions.length > 1 && (
                  <Button
                    type="button"
                    onClick={handleSwap}
                    variant="outline"
                    size="sm"
                    className="px-2"
                    title="交换方向"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {renderOptions?.(options, handleOptionsChange)}
              {error && (
                <div className="flex min-w-0 items-center gap-1.5 truncate text-xs text-red-600 dark:text-red-400">
                  <Zap className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 双栏编辑区 */}
        <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-2 lg:grid-cols-2">
          <Card className="min-h-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 py-2">
              <CardTitle className="text-sm">{direction.inputLabel}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 px-2 text-xs"
              >
                清空
              </Button>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 p-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`输入${direction.inputLabel}...`}
                className="h-full min-h-[360px] w-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0 lg:min-h-0"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          <Card className="min-h-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 py-2">
              <CardTitle className="text-sm">{direction.outputLabel}</CardTitle>
              <div className="flex gap-1.5">
                <CopyButton
                  content={error ? '' : output}
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!output || !!error}
                  className="h-7 gap-1 px-2 text-xs"
                >
                  <Download className="w-3 h-3" />
                  下载
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 p-0">
              <Textarea
                value={error ?? output}
                readOnly
                className={`h-full min-h-[360px] w-full resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0 lg:min-h-0 ${
                  error
                    ? 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-200'
                    : 'bg-muted/50'
                }`}
              />
            </CardContent>
          </Card>
        </div>

        {/* 统计信息 */}
        {!error && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>输入字符: {input.length}</span>
            <span>输出字符: {output.length}</span>
            {input.length > 0 && (
              <span>
                压缩率: {Math.round((1 - output.length / input.length) * 100)}%
              </span>
            )}
          </div>
        )}

        {/* 历史记录 */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">历史记录</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
                {history.map((entry, index) => (
                  <div
                    key={entry.id ?? index}
                    className="cursor-pointer rounded bg-muted p-2 transition-colors hover:bg-muted/70"
                    onClick={() => setInput(entry.input.input)}
                  >
                    <div className="line-clamp-1 font-mono text-xs text-muted-foreground">
                      {entry.input.input.slice(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  TransformToolPage.displayName = `TransformToolPage(${toolId})`
  return TransformToolPage
}
