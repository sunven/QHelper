import js_beautify from 'js-beautify'
import { Maximize2, Minimize2 } from 'lucide-react'
import { createTransformToolPage } from '@/components/tool/transform-tool-page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type HtmlMode = 'beautify' | 'minify'

interface HtmlFormatOptions {
  indentSize: number
  indentChar: 'space' | 'tab'
  wrapLineLength: number
}

/** HTML 格式化/压缩：纯函数，直接可测 */
export function transformHtml(
  input: string,
  options: HtmlFormatOptions & { mode: HtmlMode },
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
    // 压缩模式
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

const DEFAULT_INPUT =
  '<div class="container"><h1>Hello World</h1><p>This is a <strong>test</strong> paragraph.</p></div>'

export const HtmlFormatter = createTransformToolPage<HtmlMode, HtmlFormatOptions>({
  toolId: 'htmlformat',
  transform: transformHtml,
  defaultInput: DEFAULT_INPUT,
  defaultOptions: {
    indentSize: 2,
    indentChar: 'space',
    wrapLineLength: 120,
  },
  directions: [
    {
      mode: 'beautify',
      label: '格式化',
      inputLabel: 'HTML 输入',
      outputLabel: '格式化结果',
      icon: <Maximize2 className="w-4 h-4" />,
    },
    {
      mode: 'minify',
      label: '压缩',
      inputLabel: 'HTML 输入',
      outputLabel: '压缩结果',
      icon: <Minimize2 className="w-4 h-4" />,
    },
  ],
  renderOptions: (options, setOptions) => (
    <div className="flex items-center gap-2">
      <Select
        value={String(options.indentSize)}
        onValueChange={(value) => setOptions({ indentSize: Number(value) })}
      >
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2">2 空格</SelectItem>
          <SelectItem value="4">4 空格</SelectItem>
          <SelectItem value="8">8 空格</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={options.indentChar}
        onValueChange={(value) => setOptions({ indentChar: value as 'space' | 'tab' })}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="space">空格缩进</SelectItem>
          <SelectItem value="tab">Tab 缩进</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  download: {
    prefix: 'html',
    extension: () => 'html',
    mimeType: 'text/html',
  },
})
