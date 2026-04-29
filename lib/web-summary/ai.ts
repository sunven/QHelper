import type { WebSummaryConfig, WebSummaryPageContent } from '@/types/web-summary'

export const WEB_SUMMARY_SYSTEM_PROMPT =
  '你是网页阅读助手。请基于用户提供的网页内容，输出 Markdown，总结为“总结”“关键要点”“建议行动”三个部分；信息不足时明确说明，不要编造。'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '未知错误'
}

export function buildWebSummaryPrompt(pageContent: WebSummaryPageContent): string {
  return [
    `网页标题：${pageContent.title}`,
    `网页地址：${pageContent.url}`,
    `正文来源：${pageContent.source}`,
    `正文长度：${pageContent.charCount} 字符${pageContent.truncated ? '（已截断）' : ''}`,
    '',
    '请围绕下面的网页正文进行总结：',
    pageContent.content,
  ].join('\n')
}

export function buildWebSummaryRequest(
  config: WebSummaryConfig,
  pageContent: WebSummaryPageContent,
) {
  return {
    model: config.model,
    stream: true,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: WEB_SUMMARY_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: buildWebSummaryPrompt(pageContent),
      },
    ],
  }
}

function extractContentFromChoice(choice: Record<string, any> | undefined): string {
  const deltaContent = choice?.delta?.content
  if (typeof deltaContent === 'string') {
    return deltaContent
  }

  const messageContent = choice?.message?.content
  if (typeof messageContent === 'string') {
    return messageContent
  }

  return ''
}

export function parseWebSummaryEventBlock(block: string): {
  done: boolean
  delta: string
} | null {
  const dataLines = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean)

  if (dataLines.length === 0) {
    return null
  }

  const data = dataLines.join('\n')
  if (data === '[DONE]') {
    return { done: true, delta: '' }
  }

  try {
    const payload = JSON.parse(data)
    const delta = extractContentFromChoice(payload?.choices?.[0])

    return {
      done: false,
      delta,
    }
  } catch (error) {
    console.warn('Failed to parse web summary stream chunk:', error)
    return null
  }
}

export async function readWebSummaryStream(
  response: Response,
  onDelta?: (delta: string) => void,
): Promise<string> {
  if (!response.body) {
    throw new Error('AI 响应没有可读取的数据流。')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let summary = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''

    for (const block of blocks) {
      const event = parseWebSummaryEventBlock(block)
      if (!event) {
        continue
      }

      if (event.done) {
        return summary
      }

      if (event.delta) {
        summary += event.delta
        onDelta?.(event.delta)
      }
    }
  }

  buffer += decoder.decode()
  if (buffer.trim()) {
    const finalEvent = parseWebSummaryEventBlock(buffer)
    if (finalEvent?.delta) {
      summary += finalEvent.delta
      onDelta?.(finalEvent.delta)
    }
  }

  if (!summary.trim()) {
    throw new Error('AI 未返回任何摘要内容。')
  }

  return summary
}

async function readWebSummaryJson(
  response: Response,
  onDelta?: (delta: string) => void,
): Promise<string> {
  const payload = await response.json()
  const content = extractContentFromChoice(payload?.choices?.[0])

  if (!content.trim()) {
    throw new Error('AI 未返回任何摘要内容。')
  }

  onDelta?.(content)
  return content
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const bodyText = await response.text()
    return bodyText.slice(0, 200)
  } catch {
    return ''
  }
}

export async function streamWebPageSummary({
  pageContent,
  config,
  signal,
  onDelta,
}: {
  pageContent: WebSummaryPageContent
  config: WebSummaryConfig
  signal?: AbortSignal
  onDelta?: (delta: string) => void
}): Promise<string> {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(buildWebSummaryRequest(config, pageContent)),
    signal,
  }).catch((error) => {
    throw new Error(`调用总结接口失败：${getErrorMessage(error)}`)
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    const suffix = errorBody ? `：${errorBody}` : ''
    throw new Error(`总结接口返回 ${response.status}${suffix}`)
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('application/json')) {
    return readWebSummaryJson(response, onDelta)
  }

  return readWebSummaryStream(response, onDelta)
}
