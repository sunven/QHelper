import type { ComponentType } from 'react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { AesGcmTool } from '@/components/tool/aes-gcm'
import { BcryptHashTool } from '@/components/tool/bcrypt-hash'
import { ConvertTool } from '@/components/tool/convert'
import { DownloadsTool } from '@/components/tool/downloads'
import { ImageBase64Tool } from '@/components/tool/imagebase64'
import { JsonTool } from '@/components/tool/json'
import { OcrTool } from '@/components/tool/ocr'
import { PasswordGenerator } from '@/components/tool/password'
import { QrCodeTool } from '@/components/tool/qrcode'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { TextDiffTool } from '@/components/tool/text-diff'
import { TimestampTool } from '@/components/tool/timestamp'
import { TransRadixTool } from '@/components/tool/trans-radix'
import { UUIDGenerator } from '@/components/tool/uuid'
import {
  createOrdinaryToolRoutes,
  getToolCatalogTool,
  type OrdinaryToolId,
  type ToolRoute,
} from '@/lib/tool-catalog'

const toolComponentsByToolId: Record<OrdinaryToolId, ComponentType> = {
  json: JsonTool,
  'trans-radix': TransRadixTool,
  convert: ConvertTool,
  imagebase64: ImageBase64Tool,
  ocr: OcrTool,
  qrcode: QrCodeTool,
  uuid: UUIDGenerator,
  password: PasswordGenerator,
  'aes-gcm': AesGcmTool,
  'bcrypt-hash': BcryptHashTool,
  timestamp: TimestampTool,
  downloads: DownloadsTool,
  'text-diff': TextDiffTool,
}

// 工具特有的 Tool Page Shell 布局变体在路由映射处声明，不进 Tool Catalog
const shellClassNameByToolId: Partial<Record<OrdinaryToolId, string>> = {
  'text-diff': 'h-full',
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
