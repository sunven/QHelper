import { type ComponentType, lazy, Suspense } from 'react'
import { ToolErrorBoundary } from '@/components/ToolErrorBoundary'
import { ToolPageShell } from '@/components/tool/ToolPageShell'
import {
  createOrdinaryToolRoutes,
  getToolCatalogTool,
  type OrdinaryToolId,
  type ToolRoute,
} from '@/lib/tool-catalog'

// 每个工具独立成 chunk：打开任一工具不再加载全部工具代码。
const TransRadixTool = lazy(() =>
  import('@/components/tool/trans-radix').then((module) => ({
    default: module.TransRadixTool,
  })),
)
const AutoRefreshTool = lazy(() =>
  import('@/components/tool/auto-refresh').then((module) => ({
    default: module.AutoRefreshTool,
  })),
)
const ImageBase64Tool = lazy(() =>
  import('@/components/tool/imagebase64').then((module) => ({
    default: module.ImageBase64Tool,
  })),
)
const OcrTool = lazy(() =>
  import('@/components/tool/ocr').then((module) => ({
    default: module.OcrTool,
  })),
)
const QrCodeTool = lazy(() =>
  import('@/components/tool/qrcode').then((module) => ({
    default: module.QrCodeTool,
  })),
)
const UUIDGenerator = lazy(() =>
  import('@/components/tool/uuid').then((module) => ({
    default: module.UUIDGenerator,
  })),
)
const PasswordGenerator = lazy(() =>
  import('@/components/tool/password').then((module) => ({
    default: module.PasswordGenerator,
  })),
)
const AesGcmTool = lazy(() =>
  import('@/components/tool/aes-gcm').then((module) => ({
    default: module.AesGcmTool,
  })),
)
const BcryptHashTool = lazy(() =>
  import('@/components/tool/bcrypt-hash').then((module) => ({
    default: module.BcryptHashTool,
  })),
)
const DownloadsTool = lazy(() =>
  import('@/components/tool/downloads').then((module) => ({
    default: module.DownloadsTool,
  })),
)
const ClearSiteDataTool = lazy(() =>
  import('@/components/tool/clear-site-data').then((module) => ({
    default: module.ClearSiteDataTool,
  })),
)

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
          <Suspense
            fallback={
              <p role="status" className="p-4 text-sm text-muted-foreground">
                正在加载工具…
              </p>
            }
          >
            <Component />
          </Suspense>
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
