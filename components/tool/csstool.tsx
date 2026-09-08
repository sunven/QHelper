import * as csso from 'csso'
import { Maximize2, Minimize2 } from 'lucide-react'
import { createTransformToolPage } from '@/components/tool/transform-tool-page'

// 转换方向由 mode 表达，无额外选项
type CssOptions = object

/** CSS 美化/压缩：纯函数，直接可测 */
export function transformCss(
  input: string,
  options: CssOptions & { mode: 'beautify' | 'minify' },
): string | Error {
  try {
    const minified = csso.minify(input).css
    if (options.mode === 'minify') {
      return minified
    }
    // 美化：对压缩结果做简单换行缩进
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

const DEFAULT_INPUT = `.container {
  width: 100%;
  padding: 20px;
  background: #ffffff;
  color: #333333;
}`

export const CssTool = createTransformToolPage<'beautify' | 'minify', CssOptions>({
  toolId: 'csstool',
  transform: transformCss,
  defaultInput: DEFAULT_INPUT,
  defaultOptions: {},
  directions: [
    {
      mode: 'beautify',
      label: '美化',
      inputLabel: 'CSS 输入',
      outputLabel: '美化结果',
      icon: <Maximize2 className="w-4 h-4" />,
    },
    {
      mode: 'minify',
      label: '压缩',
      inputLabel: 'CSS 输入',
      outputLabel: '压缩结果',
      icon: <Minimize2 className="w-4 h-4" />,
    },
  ],
  download: {
    prefix: 'style',
    extension: () => 'css',
    mimeType: 'text/css',
  },
})
