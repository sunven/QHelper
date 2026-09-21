import { XMLBuilder, XMLParser } from 'fast-xml-parser'

/** XML 美化/压缩：纯函数，直接可测 */
export function transformXml(
  input: string,
  options: { mode: 'beautify' | 'minify' },
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
