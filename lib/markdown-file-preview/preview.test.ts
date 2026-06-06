import { describe, expect, it } from 'vitest'
import {
  getMarkdownFileName,
  installMarkdownFilePreview,
  isMarkdownFileUrl,
} from './preview'

function createDocument(markdown: string) {
  const doc = document.implementation.createHTMLDocument('README.md')
  const pre = doc.createElement('pre')
  pre.textContent = markdown
  doc.body.append(pre)
  return doc
}

function createWindow(url: string) {
  const location = new URL(url)
  return {
    location: {
      href: location.href,
      pathname: location.pathname,
      protocol: location.protocol,
    },
  } as Pick<Window, 'location'>
}

function createLocation(url: string): Pick<Location, 'protocol' | 'pathname'> {
  const location = new URL(url)
  return {
    pathname: location.pathname,
    protocol: location.protocol,
  }
}

describe('markdown-file-preview/preview', () => {
  it('detects only local markdown file URLs', () => {
    expect(isMarkdownFileUrl(createLocation('file:///Users/me/README.md'))).toBe(true)
    expect(isMarkdownFileUrl(createLocation('file:///Users/me/notes.MARKDOWN'))).toBe(true)
    expect(isMarkdownFileUrl(createLocation('file:///Users/me/notes.txt'))).toBe(false)
    expect(isMarkdownFileUrl(createLocation('https://example.com/README.md'))).toBe(false)
  })

  it('decodes the file name from the URL pathname', () => {
    expect(getMarkdownFileName('/Users/me/My%20Doc.md')).toBe('My Doc.md')
    expect(getMarkdownFileName('/')).toBe('Markdown')
  })

  it('renders browser-opened markdown text as a preview page', () => {
    const doc = createDocument(
      '# README\n\n- item\n\n<a href="javascript:alert(1)" onclick="alert(1)">bad</a>',
    )

    const installed = installMarkdownFilePreview(
      createWindow('file:///Users/me/README.md'),
      doc,
    )

    expect(installed).toBe(true)
    expect(doc.title).toBe('README.md - Markdown 预览')
    expect(doc.body.dataset.qhelperMarkdownPreview).toBe('true')
    expect(doc.querySelector('[role="tablist"]')).not.toBeNull()
    expect(doc.querySelector('#qhelper-markdown-preview-tab')?.getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(doc.querySelector('#qhelper-markdown-source-tab')?.getAttribute('aria-selected')).toBe(
      'false',
    )
    expect(doc.querySelector('.qhelper-markdown-preview__body h1')?.textContent).toBe('README')
    expect(doc.querySelector('.qhelper-markdown-preview__body li')?.textContent).toBe('item')
    expect(doc.querySelector('#qhelper-markdown-source-panel pre')?.textContent).toContain(
      '# README',
    )
    const previewHtml = doc.querySelector('.qhelper-markdown-preview__body')?.innerHTML ?? ''
    expect(previewHtml).not.toContain('javascript:alert')
    expect(previewHtml).not.toContain('onclick=')
  })

  it('switches between rendered preview and raw markdown tabs', () => {
    const doc = createDocument('# README\n\n- item')

    installMarkdownFilePreview(createWindow('file:///Users/me/README.md'), doc)

    const previewTab = doc.querySelector<HTMLButtonElement>('#qhelper-markdown-preview-tab')
    const sourceTab = doc.querySelector<HTMLButtonElement>('#qhelper-markdown-source-tab')
    const previewPanel = doc.querySelector<HTMLElement>('#qhelper-markdown-preview-panel')
    const sourcePanel = doc.querySelector<HTMLElement>('#qhelper-markdown-source-panel')

    expect(previewPanel?.hidden).toBe(false)
    expect(sourcePanel?.hidden).toBe(true)

    sourceTab?.click()

    expect(previewTab?.getAttribute('aria-selected')).toBe('false')
    expect(sourceTab?.getAttribute('aria-selected')).toBe('true')
    expect(previewPanel?.hidden).toBe(true)
    expect(sourcePanel?.hidden).toBe(false)
    expect(sourcePanel?.querySelector('pre')?.textContent).toBe('# README\n\n- item')

    previewTab?.click()

    expect(previewTab?.getAttribute('aria-selected')).toBe('true')
    expect(sourceTab?.getAttribute('aria-selected')).toBe('false')
    expect(previewPanel?.hidden).toBe(false)
    expect(sourcePanel?.hidden).toBe(true)
  })

  it('switches markdown preview themes', () => {
    const doc = createDocument('# README')

    installMarkdownFilePreview(createWindow('file:///Users/me/README.md'), doc)

    const systemButton = doc.querySelector<HTMLButtonElement>('[data-theme-value="system"]')
    const lightButton = doc.querySelector<HTMLButtonElement>('[data-theme-value="light"]')
    const darkButton = doc.querySelector<HTMLButtonElement>('[data-theme-value="dark"]')

    expect(doc.documentElement.dataset.qhelperMarkdownTheme).toBe('system')
    expect(systemButton?.getAttribute('aria-pressed')).toBe('true')
    expect(lightButton?.getAttribute('aria-pressed')).toBe('false')
    expect(darkButton?.getAttribute('aria-pressed')).toBe('false')

    darkButton?.click()

    expect(doc.documentElement.dataset.qhelperMarkdownTheme).toBe('dark')
    expect(systemButton?.getAttribute('aria-pressed')).toBe('false')
    expect(lightButton?.getAttribute('aria-pressed')).toBe('false')
    expect(darkButton?.getAttribute('aria-pressed')).toBe('true')

    lightButton?.click()

    expect(doc.documentElement.dataset.qhelperMarkdownTheme).toBe('light')
    expect(systemButton?.getAttribute('aria-pressed')).toBe('false')
    expect(lightButton?.getAttribute('aria-pressed')).toBe('true')
    expect(darkButton?.getAttribute('aria-pressed')).toBe('false')

    systemButton?.click()

    expect(doc.documentElement.dataset.qhelperMarkdownTheme).toBe('system')
    expect(systemButton?.getAttribute('aria-pressed')).toBe('true')
    expect(lightButton?.getAttribute('aria-pressed')).toBe('false')
    expect(darkButton?.getAttribute('aria-pressed')).toBe('false')
  })

  it('does not replace non-markdown pages or an already-installed preview', () => {
    const txtDoc = createDocument('# plain text')

    expect(installMarkdownFilePreview(createWindow('file:///Users/me/notes.txt'), txtDoc)).toBe(
      false,
    )
    expect(txtDoc.querySelector('pre')?.textContent).toBe('# plain text')

    const mdDoc = createDocument('# markdown')
    expect(installMarkdownFilePreview(createWindow('file:///Users/me/README.md'), mdDoc)).toBe(
      true,
    )
    expect(installMarkdownFilePreview(createWindow('file:///Users/me/README.md'), mdDoc)).toBe(
      false,
    )
  })
})
