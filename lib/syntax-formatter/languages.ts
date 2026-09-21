import type { FormatterDirection, FormatterLanguage } from './aliases'
import { transformCss } from './css'
import {
  DEFAULT_HTML_OPTIONS,
  type HtmlFormatterOptions,
  transformHtml,
} from './html'
import { transformXml } from './xml'

export {
  FORMATTER_LANGUAGE_QUERY,
  FORMATTER_LANGUAGES,
  getSyntaxFormatterRedirectTo,
  isFormatterLanguage,
  parseFormatterLanguage,
  SYNTAX_FORMATTER_ALIASES,
  SYNTAX_FORMATTER_ID,
  type SyntaxFormatterAliasId,
} from './aliases'
export type { FormatterDirection, FormatterLanguage }

export type FormatterLanguageMeta = {
  language: FormatterLanguage
  label: string
  inputLabel: string
  defaultInput: string
  download: {
    prefix: string
    extension: string
    mimeType: string
  }
}

export const FORMATTER_LANGUAGE_META: Record<
  FormatterLanguage,
  FormatterLanguageMeta
> = {
  html: {
    language: 'html',
    label: 'HTML',
    inputLabel: 'HTML 输入',
    defaultInput:
      '<div class="container"><h1>Hello World</h1><p>This is a <strong>test</strong> paragraph.</p></div>',
    download: {
      prefix: 'html',
      extension: 'html',
      mimeType: 'text/html',
    },
  },
  xml: {
    language: 'xml',
    label: 'XML',
    inputLabel: 'XML 输入',
    defaultInput:
      '<root><person><name>John Doe</name><age>30</age></person><person><name>Jane Smith</name><age>25</age></person></root>',
    download: {
      prefix: 'formatted',
      extension: 'xml',
      mimeType: 'application/xml',
    },
  },
  css: {
    language: 'css',
    label: 'CSS',
    inputLabel: 'CSS 输入',
    defaultInput: `.container {
  width: 100%;
  padding: 20px;
  background: #ffffff;
  color: #333333;
}`,
    download: {
      prefix: 'style',
      extension: 'css',
      mimeType: 'text/css',
    },
  },
}

export function transformFormatterInput(
  input: string,
  language: FormatterLanguage,
  mode: FormatterDirection,
  htmlOptions: HtmlFormatterOptions = DEFAULT_HTML_OPTIONS,
): string | Error {
  if (language === 'html') {
    return transformHtml(input, { ...htmlOptions, mode })
  }
  if (language === 'xml') {
    return transformXml(input, { mode })
  }
  return transformCss(input, { mode })
}
