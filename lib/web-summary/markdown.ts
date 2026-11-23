import { Marked, marked } from 'marked'

const markdownParser = new Marked({
  gfm: true,
  breaks: true,
})

marked.setOptions({
  gfm: true,
  breaks: true,
})

const OUTER_MARKDOWN_FENCE_PATTERN =
  /^```(?:markdown|md|mdown|text)?[ \t]*\n([\s\S]*?)\n```[ \t]*$/i

export function normalizeModelMarkdown(markdown: string): string {
  let normalized = markdown.replace(/\r\n/g, '\n').trim()

  const fenceMatch = normalized.match(OUTER_MARKDOWN_FENCE_PATTERN)
  if (fenceMatch) {
    normalized = fenceMatch[1]
  }

  if (!normalized.includes('\n') && normalized.includes('\\n')) {
    normalized = normalized.replace(/\\n/g, '\n')
  }

  return normalized.trim()
}

const URL_BASE = 'https://qhelper.invalid/'
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const SAFE_IMAGE_PROTOCOLS = new Set(['http:', 'https:'])

const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'dd',
  'del',
  'details',
  'dfn',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'ins',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'ul',
  'var',
])

const DROPPED_TAGS = new Set([
  'base',
  'button',
  'embed',
  'form',
  'iframe',
  'link',
  'math',
  'meta',
  'noscript',
  'object',
  'option',
  'script',
  'select',
  'style',
  'svg',
  'template',
  'textarea',
  'title',
])

const GLOBAL_ATTRIBUTES = new Set(['title'])
const TAG_ATTRIBUTES: Record<string, ReadonlySet<string>> = {
  a: new Set(['href']),
  details: new Set(['open']),
  img: new Set(['alt', 'height', 'src', 'width']),
  li: new Set(['value']),
  ol: new Set(['start']),
  td: new Set(['align', 'colspan', 'rowspan']),
  th: new Set(['align', 'colspan', 'rowspan']),
}

function getUrlProtocol(value: string): string | null {
  try {
    return new URL(value, URL_BASE).protocol
  } catch {
    return null
  }
}

function isSafeLinkHref(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  const protocol = getUrlProtocol(trimmed)
  return protocol !== null && SAFE_LINK_PROTOCOLS.has(protocol)
}

function isSafeImageSrc(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  if (/^data:image\//i.test(trimmed)) {
    return true
  }

  const protocol = getUrlProtocol(trimmed)
  return protocol !== null && SAFE_IMAGE_PROTOCOLS.has(protocol)
}

function isAllowedAttribute(tagName: string, attributeName: string): boolean {
  if (GLOBAL_ATTRIBUTES.has(attributeName)) {
    return true
  }

  return TAG_ATTRIBUTES[tagName]?.has(attributeName) ?? false
}

function sanitizeTaskListCheckbox(element: Element): void {
  if (element.getAttribute('type')?.toLowerCase() !== 'checkbox') {
    element.remove()
    return
  }

  for (const attribute of Array.from(element.attributes)) {
    if (
      !['checked', 'disabled', 'type'].includes(attribute.name.toLowerCase())
    ) {
      element.removeAttribute(attribute.name)
    }
  }

  element.setAttribute('type', 'checkbox')
  element.setAttribute('disabled', '')
}

function sanitizeAttributes(element: Element, tagName: string): void {
  for (const attribute of Array.from(element.attributes)) {
    const attributeName = attribute.name.toLowerCase()

    if (!isAllowedAttribute(tagName, attributeName)) {
      element.removeAttribute(attribute.name)
      continue
    }

    if (
      tagName === 'a' &&
      attributeName === 'href' &&
      !isSafeLinkHref(attribute.value)
    ) {
      element.removeAttribute(attribute.name)
      continue
    }

    if (
      tagName === 'img' &&
      attributeName === 'src' &&
      !isSafeImageSrc(attribute.value)
    ) {
      element.removeAttribute(attribute.name)
    }
  }
}

export function sanitizeRenderedMarkdown(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  for (const element of Array.from(doc.body.querySelectorAll('*'))) {
    if (!element.isConnected) {
      continue
    }

    const tagName = element.tagName.toLowerCase()

    if (tagName === 'input') {
      sanitizeTaskListCheckbox(element)
      continue
    }

    if (DROPPED_TAGS.has(tagName)) {
      element.remove()
      continue
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      continue
    }

    sanitizeAttributes(element, tagName)

    if (tagName === 'a') {
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noreferrer noopener')
    }
  }

  return doc.body.innerHTML
}

export function renderSafeMarkdown(markdown: string): string {
  return sanitizeRenderedMarkdown(
    marked.parse(normalizeModelMarkdown(markdown)) as string,
  )
}

export function renderMarkdownContent(markdown: string): string {
  return sanitizeRenderedMarkdown(
    markdownParser.parse(markdown, { async: false }),
  )
}
