import type React from 'react'
import { optimize } from 'svgo'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createTransformToolPage } from '@/components/tool/transform-tool-page'

// 优化方向由 mode 表达，无额外选项
type SvgOptions = object

/** SVG 优化：纯函数，直接可测 */
export function transformSvg(
  input: string,
  _options: SvgOptions & { mode: 'optimize' },
): string | Error {
  try {
    const result = optimize(input, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              cleanupIds: false,
            },
          },
        },
      ],
    })
    return result.data
  } catch (err) {
    return err instanceof Error ? err : new Error('无效的 SVG')
  }
}

const DEFAULT_INPUT =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">\n  <circle cx="50" cy="50" r="40" fill="red" />\n</svg>'

function byteSize(text: string): number {
  return new Blob([text]).size
}

export const SvgOptimizer = createTransformToolPage<'optimize', SvgOptions>({
  toolId: 'svgoptimizer',
  transform: transformSvg,
  defaultInput: DEFAULT_INPUT,
  defaultOptions: {},
  directions: [
    {
      mode: 'optimize',
      label: '优化',
      inputLabel: 'SVG 输入',
      outputLabel: '优化后 SVG',
    },
  ],
  renderToolbar: ({ setInput }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="relative overflow-hidden gap-1.5"
    >
      <Upload className="w-4 h-4" />
      <span>上传 SVG 文件</span>
      <input
        type="file"
        accept=".svg,image/svg+xml"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = (event) => {
            const content = event.target?.result as string
            if (content) {
              setInput(content)
            }
          }
          reader.readAsText(file)
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </Button>
  ),
  stats: (input, output) => {
    if (!output) {
      return null
    }
    const originalSize = byteSize(input)
    const optimizedSize = byteSize(output)
    const saved = originalSize - optimizedSize
    const ratio =
      originalSize > 0 ? Math.round((1 - optimizedSize / originalSize) * 100) : 0
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-2 text-xs">
          <span className="text-muted-foreground">
            原始大小: <span className="font-semibold text-foreground">{originalSize} B</span>
          </span>
          <span className="text-muted-foreground">
            优化后大小:{' '}
            <span className="font-semibold text-foreground">{optimizedSize} B</span>
          </span>
          <span className="text-muted-foreground">
            减少: <span className="font-semibold text-green-600 dark:text-green-400">{saved} B</span>
          </span>
          <span className="text-muted-foreground">
            压缩率:{' '}
            <span className="font-semibold text-purple-600 dark:text-purple-400">{ratio}%</span>
          </span>
        </CardContent>
      </Card>
    )
  },
  download: {
    prefix: 'optimized',
    extension: () => 'svg',
    mimeType: 'image/svg+xml',
  },
})
