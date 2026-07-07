import type { WebSummaryPageContent } from '@/types/web-summary'

export const WEB_SUMMARY_MAX_CONTENT_CHARS = 16000

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

export function extractPageContent(
  win: Window = window,
  doc: Document = document,
  maxChars = 16000,
): WebSummaryPageContent {
  // Keep helpers inside this function so chrome.scripting can serialize it.
  const primarySelectors = [
    'article',
    'main',
    '[role="main"]',
    '.article',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.markdown-body',
  ] as const

  const getElementText = (element: Element | null): string => {
    if (!element) {
      return ''
    }

    const htmlElement = element as HTMLElement
    return htmlElement.innerText ?? htmlElement.textContent ?? ''
  }

  const normalizeText = (text: string): string =>
    text
      .replace(/\u00a0/g, ' ')
      .replace(/\r/g, '')
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n')
      .trim()

  const getSourceType = (
    element: Element | null,
  ): WebSummaryPageContent['source'] => {
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

  const candidates = Array.from(
    new Set(primarySelectors.flatMap((selector) => Array.from(doc.querySelectorAll(selector)))),
  )

  const rankedCandidates = candidates
    .map((element) => ({
      element,
      source: getSourceType(element),
      text: normalizeText(getElementText(element)),
    }))
    .filter((candidate) => candidate.text.length > 0)
    .sort((left, right) => right.text.length - left.text.length)

  const candidate = rankedCandidates.find(
    (rankedCandidate) => rankedCandidate.text.length >= 400,
  ) ?? {
    element: doc.body,
    source: 'body' as const,
    text: normalizeText(getElementText(doc.body)),
  }

  const baseText = candidate.text
  const truncated = baseText.length > maxChars
  const text = truncated ? baseText.slice(0, maxChars) : baseText

  return {
    title: doc.title || '未命名网页',
    url: win.location.href,
    content: text,
    source: candidate.source,
    truncated,
    charCount: text.length,
  }
}
