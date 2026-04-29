import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true,
})

export function normalizeModelMarkdown(markdown: string): string {
  let normalized = markdown.replace(/\r\n/g, '\n')

  normalized = normalized.replace(/^```(?:markdown|md|mdown|text)?[^\n]*\n?/i, '')
  normalized = normalized.replace(/\n?```$/, '')

  if (!normalized.includes('\n') && normalized.includes('\\n')) {
    normalized = normalized.replace(/\\n/g, '\n')
  }

  return normalized.trim()
}

export function sanitizeRenderedMarkdown(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc
    .querySelectorAll('script, style, iframe, object, embed, link, meta')
    .forEach((element) => element.remove())

  doc.body.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase()
      const attributeValue = attribute.value.trim().toLowerCase()

      if (attributeName.startsWith('on') || attributeName === 'style') {
        element.removeAttribute(attribute.name)
        return
      }

      if (
        ['href', 'src', 'xlink:href'].includes(attributeName)
        && attributeValue.startsWith('javascript:')
      ) {
        element.removeAttribute(attribute.name)
      }
    })

    if (element instanceof HTMLAnchorElement) {
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noreferrer noopener')
    }
  })

  return doc.body.innerHTML
}

export function renderSafeMarkdown(markdown: string): string {
  return sanitizeRenderedMarkdown(marked.parse(normalizeModelMarkdown(markdown)) as string)
}
