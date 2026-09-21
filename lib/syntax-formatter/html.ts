import js_beautify from 'js-beautify'

export type HtmlFormatterOptions = {
  indentSize: number
  indentChar: 'space' | 'tab'
  wrapLineLength: number
}

export const DEFAULT_HTML_OPTIONS: HtmlFormatterOptions = {
  indentSize: 2,
  indentChar: 'space',
  wrapLineLength: 120,
}

/** HTML 格式化/压缩：纯函数，直接可测 */
export function transformHtml(
  input: string,
  options: HtmlFormatterOptions & { mode: 'beautify' | 'minify' },
): string | Error {
  try {
    const base = {
      indent_size: options.indentSize,
      indent_char: options.indentChar === 'space' ? ' ' : '\t',
      wrap_line_length: options.wrapLineLength,
      max_preserve_newlines: 2,
      preserve_newlines: true,
      unformatted: ['pre', 'code', 'textarea'],
      content_unformatted: ['style', 'script'],
    }

    if (options.mode === 'beautify') {
      return js_beautify.html(input, base)
    }
    return js_beautify
      .html(input, {
        ...base,
        indent_size: 0,
        indent_char: '',
        wrap_line_length: 0,
        max_preserve_newlines: 0,
        preserve_newlines: false,
      })
      .replace(/\s+/g, ' ')
      .replace(/>\s</g, '><')
      .trim()
  } catch {
    return new Error('格式化错误：输入的不是有效的 HTML')
  }
}
