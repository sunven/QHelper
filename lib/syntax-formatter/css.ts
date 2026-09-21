import * as csso from 'csso'

/** CSS 美化/压缩：纯函数，直接可测 */
export function transformCss(
  input: string,
  options: { mode: 'beautify' | 'minify' },
): string | Error {
  try {
    const minified = csso.minify(input).css
    if (options.mode === 'minify') {
      return minified
    }
    return minified
      .replace(/\{/g, ' {\n  ')
      .replace(/\}/g, '\n}\n')
      .replace(/;/g, ';\n  ')
      .replace(/^\s+/gm, '')
      .replace(/\n\s*\n/g, '\n')
      .trim()
  } catch {
    return new Error('错误：输入的不是有效的 CSS')
  }
}
