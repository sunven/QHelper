import type { ComponentType } from 'react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { AesGcmTool } from '@/components/tool/aes-gcm'
import { BcryptHashTool } from '@/components/tool/bcrypt-hash'
import { ColorTransformTool } from '@/components/tool/colorTransform'
import { ContextHub } from '@/components/tool/context-hub'
import { ConvertTool } from '@/components/tool/convert'
import { CronParser } from '@/components/tool/cron'
import { CSVToJSON } from '@/components/tool/csv2json'
import { CssTool } from '@/components/tool/csstool'
import { DownloadsTool } from '@/components/tool/downloads'
import { FileMergeTool } from '@/components/tool/filemerge'
import { HtmlFormatter } from '@/components/tool/htmlformat'
import { ImageBase64Tool } from '@/components/tool/imagebase64'
import { JsonTool } from '@/components/tool/json'
import { JsonSchemaValidator } from '@/components/tool/jsonschema'
import { MarkdownEditor } from '@/components/tool/markdown'
import { OcrTool } from '@/components/tool/ocr'
import { PasswordGenerator } from '@/components/tool/password'
import { PictureSplicingTool } from '@/components/tool/pictureSplicing'
import { QrCodeTool } from '@/components/tool/qrcode'
import { SvgOptimizer } from '@/components/tool/svgoptimizer'
import { TextDiffTool } from '@/components/tool/text-diff'
import { TextPreviewTool } from '@/components/tool/text-preview'
import { TimestampTool } from '@/components/tool/timestamp'
import { TomlParser } from '@/components/tool/toml'
import { TransRadixTool } from '@/components/tool/trans-radix'
import { UglifyTool } from '@/components/tool/uglify'
import { URLParser } from '@/components/tool/urlparser'
import { UUIDGenerator } from '@/components/tool/uuid'
import { XmlFormatter } from '@/components/tool/xmlformatter'
import { YAMLConverter } from '@/components/tool/yaml'
import {
  createOrdinaryToolRoutes,
  getToolCatalogTool,
  type OrdinaryToolId,
  type ToolRoute,
} from '@/lib/tool-catalog'

const toolComponentsByToolId: Record<OrdinaryToolId, ComponentType> = {
  json: JsonTool,
  'context-hub': ContextHub,
  'trans-radix': TransRadixTool,
  convert: ConvertTool,
  uglify: UglifyTool,
  imagebase64: ImageBase64Tool,
  pictureSplicing: PictureSplicingTool,
  ocr: OcrTool,
  qrcode: QrCodeTool,
  uuid: UUIDGenerator,
  password: PasswordGenerator,
  'aes-gcm': AesGcmTool,
  'bcrypt-hash': BcryptHashTool,
  markdown: MarkdownEditor,
  htmlformat: HtmlFormatter,
  urlparser: URLParser,
  filemerge: FileMergeTool,
  csstool: CssTool,
  svgoptimizer: SvgOptimizer,
  cron: CronParser,
  csv2json: CSVToJSON,
  yaml: YAMLConverter,
  toml: TomlParser,
  jsonschema: JsonSchemaValidator,
  xmlformatter: XmlFormatter,
  timestamp: TimestampTool,
  colorTransform: ColorTransformTool,
  downloads: DownloadsTool,
  'text-preview': TextPreviewTool,
  'text-diff': TextDiffTool,
}

// 工具特有的 Tool Page Shell 布局变体在路由映射处声明，不进 Tool Catalog
const shellClassNameByToolId: Partial<Record<OrdinaryToolId, string>> = {
  'text-diff': 'h-full',
  'text-preview': 'flex h-full min-h-0 flex-col overflow-hidden',
}

function createToolPage(
  toolId: OrdinaryToolId,
  Component: ComponentType,
): ComponentType {
  const tool = getToolCatalogTool(toolId)

  function ToolPage() {
    return (
      <ToolErrorBoundary toolId={toolId} toolName={tool?.name ?? toolId}>
        <ToolPageShell
          toolId={toolId}
          className={shellClassNameByToolId[toolId]}
        >
          <Component />
        </ToolPageShell>
      </ToolErrorBoundary>
    )
  }

  ToolPage.displayName = `ToolPage(${toolId})`
  return ToolPage
}

export const toolRoutes: ToolRoute<ComponentType>[] = createOrdinaryToolRoutes(
  Object.fromEntries(
    (
      Object.entries(toolComponentsByToolId) as [
        OrdinaryToolId,
        ComponentType,
      ][]
    ).map(([toolId, Component]) => [toolId, createToolPage(toolId, Component)]),
  ),
)
