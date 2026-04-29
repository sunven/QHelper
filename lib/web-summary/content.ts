import type { WebSummaryPageContent } from '@/types/web-summary'

export const WEB_SUMMARY_MAX_CONTENT_CHARS = 16000

const PRIMARY_SELECTORS = [
  'article',
  'main',
  '[role="main"]',
  '.article',
  '.article-content',
  '.post-content',
  '.entry-content',
  '.markdown-body',
] as const

function getElementText(element: Element | null): string {
  if (!element) {
    return ''
  }

  const htmlElement = element as HTMLElement
  return htmlElement.innerText ?? htmlElement.textContent ?? ''
}

export function normalizePageText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

function getSourceType(element: Element | null): WebSummaryPageContent['source'] {
  if (!element) {
    return 'body'
  }

  const tagName = element.tagName.toLowerCase()
  if (tagName === 'article') {
    return 'article'
  }

  if (tagName === 'main' || element.getAttribute('role') === 'main') {
    return 'main'
  }

  return 'body'
}

function pickBestContentElement(doc: Document): {
  element: Element | null
  source: WebSummaryPageContent['source']
  text: string
} {
  const candidates = Array.from(
    new Set(PRIMARY_SELECTORS.flatMap((selector) => Array.from(doc.querySelectorAll(selector)))),
  )

  const rankedCandidates = candidates
    .map((element) => ({
      element,
      source: getSourceType(element),
      text: normalizePageText(getElementText(element)),
    }))
    .filter((candidate) => candidate.text.length > 0)
    .sort((left, right) => right.text.length - left.text.length)

  const bestCandidate = rankedCandidates.find((candidate) => candidate.text.length >= 400)
  if (bestCandidate) {
    return bestCandidate
  }

  const bodyText = normalizePageText(getElementText(doc.body))
  return {
    element: doc.body,
    source: 'body',
    text: bodyText,
  }
}

function truncateText(text: string, maxChars: number): {
  text: string
  truncated: boolean
} {
  if (text.length <= maxChars) {
    return { text, truncated: false }
  }

  return {
    text: text.slice(0, maxChars),
    truncated: true,
  }
}

export function extractPageContent(
  win: Window = window,
  doc: Document = document,
  maxChars = WEB_SUMMARY_MAX_CONTENT_CHARS,
): WebSummaryPageContent {
  const fallbackText = normalizePageText(getElementText(doc.body))
  const candidate = pickBestContentElement(doc)
  const baseText = candidate.text || fallbackText
  const { text, truncated } = truncateText(baseText, maxChars)

  return {
    title: doc.title || '未命名网页',
    url: win.location.href,
    content: text,
    source: candidate.source,
    truncated,
    charCount: text.length,
  }
}
