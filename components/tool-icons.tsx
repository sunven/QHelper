import type { Icon } from '@phosphor-icons/react'
import {
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  CalculatorIcon,
  GearSixIcon,
  HashIcon,
  ImageIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TrashIcon,
} from '@phosphor-icons/react'

/**
 * 工具图标的稳定 token 解析处：Registry 与 Tool Catalog 声明 token，
 * 本 map 是唯一事实源——新增 token 必须先在此登记，
 * 漏配在编译期报错（Record 查找必中，无运行时兜底）。
 */
const toolIconTokens = {
  ArrowsClockwise: ArrowsClockwiseIcon,
  BookmarkSimple: BookmarkSimpleIcon,
  Calculator: CalculatorIcon,
  GearSix: GearSixIcon,
  Hash: HashIcon,
  Image: ImageIcon,
  QrCode: QrCodeIcon,
  ShieldCheck: ShieldCheckIcon,
  Sparkle: SparkleIcon,
  Trash: TrashIcon,
} as const satisfies Record<string, Icon>

export type ToolIconToken = keyof typeof toolIconTokens

export function getToolIcon(token: ToolIconToken) {
  const Icon = toolIconTokens[token]
  return <Icon data-icon="inline-start" weight="duotone" />
}
