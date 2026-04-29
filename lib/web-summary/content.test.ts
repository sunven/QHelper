import { describe, expect, it } from 'vitest'
import {
  WEB_SUMMARY_MAX_CONTENT_CHARS,
  extractPageContent,
  normalizePageText,
} from './content'

describe('web-summary/content', () => {
  it('normalizes noisy page text into readable paragraphs', () => {
    expect(normalizePageText('  hello\n\n world\t\t  \nfoo   bar  ')).toBe(
      'hello\n\nworld\n\nfoo bar',
    )
  })

  it('prefers article-like content over the full page body', () => {
    document.body.innerHTML = `
      <header>${'导航 '.repeat(80)}</header>
      <article>${'正文 '.repeat(260)}</article>
      <footer>${'页脚 '.repeat(60)}</footer>
    `
    document.title = 'Article page'

    const result = extractPageContent(
      { location: { href: 'https://example.com/article' } } as Window,
      document,
    )

    expect(result.title).toBe('Article page')
    expect(result.url).toBe('https://example.com/article')
    expect(result.source).toBe('article')
    expect(result.content).toContain('正文')
    expect(result.content).not.toContain('导航')
  })

  it('falls back to body text when no better container exists', () => {
    document.body.innerHTML = `<div>${'普通正文 '.repeat(120)}</div>`

    const result = extractPageContent(window, document)

    expect(result.source).toBe('body')
    expect(result.content).toContain('普通正文')
  })

  it('truncates oversized content to the dependency-free max length', () => {
    const longText = 'a'.repeat(WEB_SUMMARY_MAX_CONTENT_CHARS + 200)
    document.body.innerHTML = `<article>${longText}</article>`

    const result = extractPageContent(window, document)

    expect(result.truncated).toBe(true)
    expect(result.content).toHaveLength(WEB_SUMMARY_MAX_CONTENT_CHARS)
  })
})
