import { describe, expect, it } from 'vitest'
import { normalizeModelMarkdown, renderSafeMarkdown } from './markdown'

describe('web-summary/markdown', () => {
  it('unwraps outer markdown code fences from model output', () => {
    expect(
      normalizeModelMarkdown('```markdown\n# 标题\n\n- 条目\n```'),
    ).toBe('# 标题\n\n- 条目')
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
})
