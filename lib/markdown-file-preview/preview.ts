import { renderMarkdownContent } from '@/lib/web-summary/markdown'

const PREVIEW_STYLE_ID = 'qhelper-markdown-file-preview-styles'
const PREVIEW_TAB_ID = 'qhelper-markdown-preview-tab'
const SOURCE_TAB_ID = 'qhelper-markdown-source-tab'
const PREVIEW_PANEL_ID = 'qhelper-markdown-preview-panel'
const SOURCE_PANEL_ID = 'qhelper-markdown-source-panel'

type MarkdownPreviewTheme = 'system' | 'light' | 'dark'

const THEME_OPTIONS: Array<{ value: MarkdownPreviewTheme; label: string }> = [
  { value: 'system', label: '系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

export function isMarkdownFileUrl(location: Pick<Location, 'protocol' | 'pathname'>): boolean {
  if (location.protocol !== 'file:') {
    return false
  }

  return /\.(md|markdown)$/i.test(location.pathname)
}

export function getMarkdownFileName(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  if (!lastSegment) {
    return 'Markdown'
  }

  try {
    return decodeURIComponent(lastSegment)
  } catch {
    return lastSegment
  }
}

export function installMarkdownFilePreview(win: Pick<Window, 'location'>, doc: Document): boolean {
  if (!isMarkdownFileUrl(win.location) || doc.body.dataset.qhelperMarkdownPreview === 'true') {
    return false
  }

  const markdown = doc.body.textContent ?? ''
  const fileName = getMarkdownFileName(win.location.pathname)
  const root = doc.createElement('main')
  root.className = 'qhelper-markdown-preview'

  const header = doc.createElement('header')
  header.className = 'qhelper-markdown-preview__header'

  const title = doc.createElement('h1')
  title.textContent = fileName

  const path = doc.createElement('div')
  path.className = 'qhelper-markdown-preview__path'
  path.textContent = decodeFileUrl(win.location.href)

  header.append(title, path)

  const tabs = doc.createElement('div')
  tabs.className = 'qhelper-markdown-preview__tabs'
  tabs.setAttribute('role', 'tablist')
  tabs.setAttribute('aria-label', 'Markdown 文件视图')

  const previewTab = createTabButton(doc, {
    id: PREVIEW_TAB_ID,
    label: '预览',
    panelId: PREVIEW_PANEL_ID,
    selected: true,
  })
  const sourceTab = createTabButton(doc, {
    id: SOURCE_TAB_ID,
    label: '原始 Markdown',
    panelId: SOURCE_PANEL_ID,
    selected: false,
  })

  tabs.append(previewTab, sourceTab)

  const themeSwitcher = doc.createElement('div')
  themeSwitcher.className = 'qhelper-markdown-preview__theme-switcher'
  themeSwitcher.setAttribute('role', 'group')
  themeSwitcher.setAttribute('aria-label', 'Markdown 主题')

  const themeButtons = THEME_OPTIONS.map((option) => {
    const button = doc.createElement('button')
    button.className = 'qhelper-markdown-preview__theme-button'
    button.type = 'button'
    button.textContent = option.label
    button.dataset.themeValue = option.value
    button.setAttribute('aria-pressed', String(option.value === 'system'))
    return button
  })
  themeSwitcher.append(...themeButtons)

  const controls = doc.createElement('div')
  controls.className = 'qhelper-markdown-preview__controls'
  controls.append(tabs, themeSwitcher)

  const article = doc.createElement('article')
  article.id = PREVIEW_PANEL_ID
  article.className = 'qhelper-markdown-preview__body'
  article.setAttribute('role', 'tabpanel')
  article.setAttribute('aria-labelledby', PREVIEW_TAB_ID)
  article.innerHTML = renderMarkdownContent(markdown)

  const sourcePanel = doc.createElement('section')
  sourcePanel.id = SOURCE_PANEL_ID
  sourcePanel.className = 'qhelper-markdown-preview__source'
  sourcePanel.setAttribute('role', 'tabpanel')
  sourcePanel.setAttribute('aria-labelledby', SOURCE_TAB_ID)
  sourcePanel.hidden = true

  const source = doc.createElement('pre')
  source.textContent = markdown

  sourcePanel.append(source)

  const activateTab = (tabName: 'preview' | 'source') => {
    const showPreview = tabName === 'preview'
    previewTab.setAttribute('aria-selected', String(showPreview))
    sourceTab.setAttribute('aria-selected', String(!showPreview))
    article.hidden = !showPreview
    sourcePanel.hidden = showPreview
  }

  previewTab.addEventListener('click', () => activateTab('preview'))
  sourceTab.addEventListener('click', () => activateTab('source'))

  const activateTheme = (theme: MarkdownPreviewTheme) => {
    doc.documentElement.dataset.qhelperMarkdownTheme = theme
    themeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeValue === theme))
    })
  }

  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.themeValue as MarkdownPreviewTheme
      activateTheme(theme)
    })
  })

  activateTheme('system')

  root.append(header, controls, article, sourcePanel)

  doc.documentElement.lang = doc.documentElement.lang || 'zh-CN'
  doc.title = `${fileName} - Markdown 预览`
  ensureViewportMeta(doc)
  installPreviewStyles(doc)

  doc.body.dataset.qhelperMarkdownPreview = 'true'
  doc.body.replaceChildren(root)

  return true
}

function createTabButton(
  doc: Document,
  options: { id: string; label: string; panelId: string; selected: boolean },
) {
  const button = doc.createElement('button')
  button.id = options.id
  button.className = 'qhelper-markdown-preview__tab'
  button.type = 'button'
  button.textContent = options.label
  button.setAttribute('role', 'tab')
  button.setAttribute('aria-controls', options.panelId)
  button.setAttribute('aria-selected', String(options.selected))
  return button
}

function decodeFileUrl(url: string): string {
  try {
    return decodeURI(url)
  } catch {
    return url
  }
}

function ensureViewportMeta(doc: Document) {
  const existing = doc.querySelector<HTMLMetaElement>('meta[name="viewport"]')

  if (existing) {
    existing.content = 'width=device-width, initial-scale=1'
    return
  }

  const meta = doc.createElement('meta')
  meta.name = 'viewport'
  meta.content = 'width=device-width, initial-scale=1'
  doc.head.append(meta)
}

function installPreviewStyles(doc: Document) {
  if (doc.getElementById(PREVIEW_STYLE_ID)) {
    return
  }

  const style = doc.createElement('style')
  style.id = PREVIEW_STYLE_ID
  style.textContent = `
:root {
  --qhelper-md-page-bg: #f6f7f9;
  --qhelper-md-text: #1f2937;
  --qhelper-md-heading: #111827;
  --qhelper-md-muted: #667085;
  --qhelper-md-border: #d8dee8;
  --qhelper-md-control-bg: #eef2f7;
  --qhelper-md-surface: #ffffff;
  --qhelper-md-control-text: #475467;
  --qhelper-md-active-bg: #ffffff;
  --qhelper-md-active-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  --qhelper-md-link: #0f6bcb;
  --qhelper-md-blockquote: #4b5563;
  --qhelper-md-blockquote-border: #9aa4b2;
  --qhelper-md-inline-code-bg: #eef2f7;
  --qhelper-md-code-text: #1f2937;
  --qhelper-md-code-block-bg: #111827;
  --qhelper-md-code-block-text: #e5e7eb;
  --qhelper-md-panel-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
  --qhelper-md-focus: #0f6bcb;
  color-scheme: light;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--qhelper-md-page-bg);
  color: var(--qhelper-md-text);
}

body {
  margin: 0;
  background: var(--qhelper-md-page-bg);
}

.qhelper-markdown-preview {
  box-sizing: border-box;
  width: min(100%, 1040px);
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.qhelper-markdown-preview *,
.qhelper-markdown-preview *::before,
.qhelper-markdown-preview *::after {
  box-sizing: border-box;
}

.qhelper-markdown-preview__header {
  display: grid;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--qhelper-md-border);
}

.qhelper-markdown-preview__header h1 {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--qhelper-md-heading);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.qhelper-markdown-preview__path {
  overflow-wrap: anywhere;
  color: var(--qhelper-md-muted);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.5;
}

.qhelper-markdown-preview__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.qhelper-markdown-preview__tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--qhelper-md-border);
  border-radius: 8px;
  background: var(--qhelper-md-control-bg);
}

.qhelper-markdown-preview__theme-switcher {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--qhelper-md-border);
  border-radius: 8px;
  background: var(--qhelper-md-control-bg);
}

.qhelper-markdown-preview__tab,
.qhelper-markdown-preview__theme-button {
  appearance: none;
  min-width: 88px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--qhelper-md-control-text);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  padding: 9px 12px;
}

.qhelper-markdown-preview__theme-button {
  min-width: 52px;
}

.qhelper-markdown-preview__tab[aria-selected="true"],
.qhelper-markdown-preview__theme-button[aria-pressed="true"] {
  background: var(--qhelper-md-active-bg);
  color: var(--qhelper-md-heading);
  box-shadow: var(--qhelper-md-active-shadow);
}

.qhelper-markdown-preview__tab:focus-visible,
.qhelper-markdown-preview__theme-button:focus-visible {
  outline: 2px solid var(--qhelper-md-focus);
  outline-offset: 2px;
}

.qhelper-markdown-preview__body,
.qhelper-markdown-preview__source {
  padding: 28px;
  border: 1px solid var(--qhelper-md-border);
  border-radius: 8px;
  background: var(--qhelper-md-surface);
  box-shadow: var(--qhelper-md-panel-shadow);
  color: var(--qhelper-md-text);
  font-size: 16px;
  line-height: 1.68;
}

.qhelper-markdown-preview__body > :first-child {
  margin-top: 0;
}

.qhelper-markdown-preview__body > :last-child {
  margin-bottom: 0;
}

.qhelper-markdown-preview__body h1,
.qhelper-markdown-preview__body h2,
.qhelper-markdown-preview__body h3,
.qhelper-markdown-preview__body h4,
.qhelper-markdown-preview__body h5,
.qhelper-markdown-preview__body h6 {
  margin: 1.6em 0 0.65em;
  color: var(--qhelper-md-heading);
  line-height: 1.25;
}

.qhelper-markdown-preview__body h1 {
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--qhelper-md-border);
  font-size: 2em;
}

.qhelper-markdown-preview__body h2 {
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--qhelper-md-border);
  font-size: 1.5em;
}

.qhelper-markdown-preview__body h3 {
  font-size: 1.25em;
}

.qhelper-markdown-preview__body a {
  color: var(--qhelper-md-link);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.qhelper-markdown-preview__body p,
.qhelper-markdown-preview__body ul,
.qhelper-markdown-preview__body ol,
.qhelper-markdown-preview__body blockquote,
.qhelper-markdown-preview__body table,
.qhelper-markdown-preview__body pre {
  margin: 0 0 1em;
}

.qhelper-markdown-preview__body ul,
.qhelper-markdown-preview__body ol {
  padding-left: 1.5em;
}

.qhelper-markdown-preview__body li + li {
  margin-top: 0.25em;
}

.qhelper-markdown-preview__body blockquote {
  padding: 0.2em 1em;
  border-left: 4px solid var(--qhelper-md-blockquote-border);
  color: var(--qhelper-md-blockquote);
}

.qhelper-markdown-preview__body code {
  border-radius: 4px;
  background: var(--qhelper-md-inline-code-bg);
  color: var(--qhelper-md-code-text);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.88em;
  padding: 0.15em 0.35em;
}

.qhelper-markdown-preview__body pre {
  overflow: auto;
  padding: 16px;
  border-radius: 8px;
  background: var(--qhelper-md-code-block-bg);
  color: var(--qhelper-md-code-block-text);
}

.qhelper-markdown-preview__body pre code {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: 0.9em;
}

.qhelper-markdown-preview__body table {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.qhelper-markdown-preview__body th,
.qhelper-markdown-preview__body td {
  padding: 8px 12px;
  border: 1px solid var(--qhelper-md-border);
}

.qhelper-markdown-preview__body th {
  background: var(--qhelper-md-control-bg);
  font-weight: 600;
}

.qhelper-markdown-preview__body img {
  max-width: 100%;
  height: auto;
}

.qhelper-markdown-preview__body hr {
  height: 1px;
  margin: 24px 0;
  border: 0;
  background: var(--qhelper-md-border);
}

.qhelper-markdown-preview__source {
  padding: 0;
}

.qhelper-markdown-preview__source pre {
  margin: 0;
  overflow: auto;
  padding: 28px;
  color: var(--qhelper-md-text);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.qhelper-markdown-preview__body[hidden],
.qhelper-markdown-preview__source[hidden] {
  display: none;
}

@media (max-width: 720px) {
  .qhelper-markdown-preview {
    padding: 20px 14px 32px;
  }

  .qhelper-markdown-preview__body {
    padding: 18px;
    font-size: 15px;
  }

  .qhelper-markdown-preview__source pre {
    padding: 18px;
  }

  .qhelper-markdown-preview__header h1 {
    font-size: 22px;
  }
}

@media (prefers-color-scheme: dark) {
  :root:not([data-qhelper-markdown-theme="light"]) {
    --qhelper-md-page-bg: #101418;
    --qhelper-md-text: #d7dde7;
    --qhelper-md-heading: #f3f4f6;
    --qhelper-md-muted: #aab4c0;
    --qhelper-md-border: #2b3440;
    --qhelper-md-control-bg: #25303c;
    --qhelper-md-surface: #171c22;
    --qhelper-md-control-text: #aab4c0;
    --qhelper-md-active-bg: #171c22;
    --qhelper-md-active-shadow: none;
    --qhelper-md-link: #7cc4ff;
    --qhelper-md-blockquote: #aab4c0;
    --qhelper-md-inline-code-bg: #25303c;
    --qhelper-md-code-text: #f3f4f6;
    --qhelper-md-code-block-bg: #0b1016;
    --qhelper-md-panel-shadow: none;
    color-scheme: dark;
  }
}

:root[data-qhelper-markdown-theme="dark"] {
  --qhelper-md-page-bg: #101418;
  --qhelper-md-text: #d7dde7;
  --qhelper-md-heading: #f3f4f6;
  --qhelper-md-muted: #aab4c0;
  --qhelper-md-border: #2b3440;
  --qhelper-md-control-bg: #25303c;
  --qhelper-md-surface: #171c22;
  --qhelper-md-control-text: #aab4c0;
  --qhelper-md-active-bg: #171c22;
  --qhelper-md-active-shadow: none;
  --qhelper-md-link: #7cc4ff;
  --qhelper-md-blockquote: #aab4c0;
  --qhelper-md-inline-code-bg: #25303c;
  --qhelper-md-code-text: #f3f4f6;
  --qhelper-md-code-block-bg: #0b1016;
  --qhelper-md-panel-shadow: none;
  color-scheme: dark;
}

:root[data-qhelper-markdown-theme="light"] {
  color-scheme: light;
}
`
  doc.head.append(style)
}
