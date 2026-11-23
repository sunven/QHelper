import { describe, expect, it } from 'vitest'
import {
  normalizeModelMarkdown,
  renderMarkdownContent,
  renderSafeMarkdown,
} from './markdown'

describe('web-summary/markdown', () => {
  it('unwraps outer markdown code fences from model output', () => {
    expect(normalizeModelMarkdown('```markdown\n# 标题\n\n- 条目\n```')).toBe(
      '# 标题\n\n- 条目',
    )
  })

  it('keeps non-markdown outer code fences intact', () => {
    expect(normalizeModelMarkdown('```js\nconst answer = 42\n```')).toBe(
      '```js\nconst answer = 42\n```',
    )
  })

  it('keeps a leading code block when markdown follows', () => {
    const markdown = '```js\nconst answer = 42\n```\n\n## 总结'

    expect(normalizeModelMarkdown(markdown)).toBe(markdown)
  })

  it('renders wrapped markdown as HTML instead of a code block', () => {
    const html = renderSafeMarkdown('```markdown\n# 标题\n\n- 条目\n```')

    expect(html).toContain('<h1>标题</h1>')
    expect(html).toContain('<li>条目</li>')
    expect(html).not.toContain('<pre><code')
  })

  it('sanitizes dangerous HTML while preserving markdown structure', () => {
    const html = renderSafeMarkdown(
      '# 标题\n\n<a href="javascript:alert(1)" onclick="alert(1)">bad link</a>\n\n<script>alert(1)</script>',
    )

    expect(html).toContain('<h1>标题</h1>')
    expect(html).not.toContain('javascript:alert')
    expect(html).not.toContain('onclick=')
    expect(html).not.toContain('<script>')
  })

  it('blocks obfuscated javascript URLs and active content', () => {
    const html = renderSafeMarkdown(
      [
        '<a href="java&#9;script:alert(1)">tab link</a>',
        '<a href="java&#10;script:alert(2)">newline link</a>',
        '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgzKTwvc2NyaXB0Pg==">data link</a>',
        '<a href="https://example.com" ping="https://tracker.example/beacon">ok link</a>',
        '<form action="https://evil.example"><input name="q" value="x"></form>',
        '<div class="fixed inset-0 z-50">overlay</div>',
        '<img src="https://example.com/image.png" srcset="https://tracker.example/image.png 2x" onerror="alert(4)">',
      ].join('\n\n'),
    )

    expect(html).not.toContain('javascript')
    expect(html).not.toContain('data:text/html')
    expect(html).not.toContain('ping=')
    expect(html).not.toContain('<form')
    expect(html).not.toContain('<input')
    expect(html).not.toContain('srcset=')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('class=')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('src="https://example.com/image.png"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer noopener"')
  })

  it('keeps task list checkboxes inert', () => {
    const html = renderSafeMarkdown('- [x] done\n- [ ] todo')

    expect(html).toContain('type="checkbox"')
    expect(html).toContain('checked')
    expect(html).toContain('disabled')
    expect(html).not.toContain('name=')
  })

  it('keeps relative and mail links', () => {
    const html = renderSafeMarkdown(
      '[docs](/docs)\n\n[mail](mailto:test@example.com)',
    )

    expect(html).toContain('href="/docs"')
    expect(html).toContain('href="mailto:test@example.com"')
  })

  it('renders file markdown without model-output normalization', () => {
    const html = renderMarkdownContent('```markdown\n# Kept as code\n```')

    expect(html).toContain('<pre><code')
    expect(html).toContain('# Kept as code')
  })
})
