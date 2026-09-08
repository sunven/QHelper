import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import { Minimize2, Sparkles } from 'lucide-react'
import { createTransformToolPage } from '@/components/tool/transform-tool-page'

// 转换方向由 mode 表达，无额外选项
type XmlOptions = object

/** XML 美化/压缩：纯函数，直接可测 */
export function transformXml(
  input: string,
  options: XmlOptions & { mode: 'beautify' | 'minify' },
): string | Error {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      parseTagValue: true,
      trimValues: true,
    })

    const jsonObj = parser.parse(input)

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: options.mode === 'beautify',
      indentBy: '  ',
    })

    return builder.build(jsonObj)
  } catch (err) {
    return err instanceof Error ? err : new Error('XML 解析错误')
  }
}

const DEFAULT_INPUT = `<root><person><name>John Doe</name><age>30</age></person><person><name>Jane Smith</name><age>25</age></person></root>`

export const XmlFormatter = createTransformToolPage<'beautify' | 'minify', XmlOptions>({
  toolId: 'xmlformatter',
  transform: transformXml,
  defaultInput: DEFAULT_INPUT,
  defaultOptions: {},
  directions: [
    {
      mode: 'beautify',
      label: '美化',
      inputLabel: 'XML 输入',
      outputLabel: '格式化结果',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      mode: 'minify',
      label: '压缩',
      inputLabel: 'XML 输入',
      outputLabel: '压缩结果',
      icon: <Minimize2 className="w-4 h-4" />,
    },
  ],
  download: {
    prefix: 'formatted',
    extension: () => 'xml',
    mimeType: 'application/xml',
  },
})
