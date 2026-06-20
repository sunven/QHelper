import { useMemo, useState } from 'react'
import { ArrowUpRight, ClipboardCheck, Eraser, Info, ShieldCheck } from 'lucide-react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { detectContextInput } from '@/lib/context-hub/detect'
import { parseJwt } from '@/lib/context-hub/jwt'
import { getContextRecommendations } from '@/lib/context-hub/recommend'
import type { ContextDetectionResult } from '@/lib/context-hub/types'
import { getToolNavigationPath } from '@/lib/tool-catalog'

const kindLabels: Record<ContextDetectionResult['kind'], string> = {
  json: 'JSON',
  url: 'URL',
  base64: 'Base64',
  timestamp: '时间戳',
  jwt: 'JWT',
  cron: 'Cron',
  unknown: '未知格式',
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function FactList({ detection }: { detection: ContextDetectionResult }) {
  if (detection.facts.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        暂无可安全展示的结构化字段。
      </p>
    )
  }

  return (
    <dl className="grid gap-1.5">
      {detection.facts.map((fact) => (
        <div
          key={`${fact.label}-${fact.value}`}
          className="grid gap-1 rounded-none border border-border/70 bg-muted/40 px-2 py-1.5 sm:grid-cols-[9rem_minmax(0,1fr)]"
        >
          <dt className="text-muted-foreground text-xs">{fact.label}</dt>
          <dd className="min-w-0 break-all font-mono text-xs">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function JwtPreview({ input }: { input: string }) {
  const parsed = parseJwt(input)
  if (!parsed) {
    return null
  }

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <div className="min-w-0 rounded-none border border-border/70 bg-muted/40 p-2">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Header
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs">
          {formatJson(parsed.header)}
        </pre>
      </div>
      <div className="min-w-0 rounded-none border border-border/70 bg-muted/40 p-2">
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          Payload
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs">
          {formatJson(parsed.payload)}
        </pre>
      </div>
    </div>
  )
}

function ContextHub() {
  const [input, setInput] = useState('')
  const trimmedInput = input.trim()
  const detection = useMemo(() => detectContextInput(input), [input])
  const recommendations = useMemo(
    () => getContextRecommendations(detection),
    [detection],
  )

  return (
    <ToolPageShell toolId="context-hub">
      <div className="mx-auto grid max-w-[1440px] gap-2 xl:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.1fr)]">
        <Card className="min-h-0">
          <CardHeader className="border-border/70 border-b">
            <CardTitle>Context Hub</CardTitle>
            <CardDescription>
              粘贴开发数据，QHelper 会在本地识别格式并推荐下一步。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="context-hub-input"
                className="text-sm font-medium"
              >
                输入
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="清空输入"
                disabled={!input}
                onClick={() => setInput('')}
              >
                <Eraser className="h-4 w-4" />
                清空
              </Button>
            </div>
            <Textarea
              id="context-hub-input"
              aria-label="Context input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="粘贴 JSON、URL、Base64、时间戳、JWT 或 Cron 表达式"
              className="min-h-[320px] resize-y font-mono text-sm xl:min-h-[calc(100vh-15rem)]"
            />
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>本地优先</AlertTitle>
              <AlertDescription>
                内容仅在本地识别，默认不会保存历史。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid content-start gap-2">
          <Card>
            <CardHeader className="border-border/70 border-b">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>识别结果</CardTitle>
                <Badge variant={trimmedInput ? 'secondary' : 'outline'}>
                  {trimmedInput ? kindLabels[detection.kind] : '等待输入'}
                </Badge>
              </div>
              <CardDescription>
                {trimmedInput
                  ? detection.summary
                  : '粘贴内容后会显示格式、置信度和可执行动作。'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {trimmedInput ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">
                      {kindLabels[detection.kind]}
                    </Badge>
                    <Badge variant="ghost">
                      {`置信度：${detection.confidence}`}
                    </Badge>
                  </div>
                  <FactList detection={detection} />
                </>
              ) : (
                <div className="flex min-h-32 items-center justify-center rounded-none border border-dashed text-muted-foreground text-sm">
                  等待输入
                </div>
              )}
            </CardContent>
          </Card>

          {trimmedInput && detection.kind === 'jwt' ? (
            <Card>
              <CardHeader className="border-border/70 border-b">
                <CardTitle>JWT 预览</CardTitle>
                <CardDescription>
                  仅解码 header 和 payload，不验证签名。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JwtPreview input={trimmedInput} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="border-border/70 border-b">
              <CardTitle>推荐操作</CardTitle>
              <CardDescription>
                优先跳转到现有工具；不会自动传递或保存输入。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-1.5">
              {recommendations.map((recommendation) => {
                if (!recommendation.toolId) {
                  return (
                    <div
                      key={recommendation.id}
                      className="rounded-none border border-border/70 px-2.5 py-2"
                    >
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        {recommendation.kind === 'local' ? (
                          <ClipboardCheck className="h-4 w-4" />
                        ) : (
                          <Info className="h-4 w-4" />
                        )}
                        {recommendation.label}
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs">
                        {recommendation.description}
                      </p>
                    </div>
                  )
                }

                return (
                  <a
                    key={recommendation.id}
                    href={getToolNavigationPath(recommendation.toolId)}
                    aria-label={recommendation.label}
                    className="group rounded-none border border-border/70 px-2.5 py-2 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {recommendation.label}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {recommendation.description}
                    </p>
                  </a>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolPageShell>
  )
}

export function App() {
  return (
    <ToolErrorBoundary toolId="context-hub" toolName="Context Hub">
      <ContextHub />
    </ToolErrorBoundary>
  )
}
