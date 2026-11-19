import type { ComponentType } from 'react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { AesGcmTool } from '@/components/tool/aes-gcm'
import { AutoRefreshTool } from '@/components/tool/auto-refresh'
import { BcryptHashTool } from '@/components/tool/bcrypt-hash'
import { ClearSiteDataTool } from '@/components/tool/clear-site-data'
import { DownloadsTool } from '@/components/tool/downloads'
import { ImageBase64Tool } from '@/components/tool/imagebase64'
import { OcrTool } from '@/components/tool/ocr'
import { PasswordGenerator } from '@/components/tool/password'
import { QrCodeTool } from '@/components/tool/qrcode'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import { TransRadixTool } from '@/components/tool/trans-radix'
import { UUIDGenerator } from '@/components/tool/uuid'
import {
  createOrdinaryToolRoutes,
  getToolCatalogTool,
  type OrdinaryToolId,
  type ToolRoute,
} from '@/lib/tool-catalog'

const toolComponentsByToolId: Record<OrdinaryToolId, ComponentType> = {
  'trans-radix': TransRadixTool,
  'auto-refresh': AutoRefreshTool,
  imagebase64: ImageBase64Tool,
  ocr: OcrTool,
  qrcode: QrCodeTool,
  uuid: UUIDGenerator,
  password: PasswordGenerator,
  'aes-gcm': AesGcmTool,
  'bcrypt-hash': BcryptHashTool,
  downloads: DownloadsTool,
  'clear-site-data': ClearSiteDataTool,
}

function createToolPage(
  toolId: OrdinaryToolId,
  Component: ComponentType,
): ComponentType {
  const tool = getToolCatalogTool(toolId)

  function ToolPage() {
    return (
      <ToolErrorBoundary toolId={toolId} toolName={tool?.name ?? toolId}>
        <ToolPageShell toolId={toolId}>
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
