import {
  ArrowsLeftRightIcon,
  BookmarkSimpleIcon,
  BracketsCurlyIcon,
  CalculatorIcon,
  ClockIcon,
  CodeIcon,
  FileCodeIcon,
  FileTextIcon,
  GearSixIcon,
  HashIcon,
  ImageIcon,
  ImageSquareIcon,
  LinkIcon,
  PaletteIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparkleIcon,
  TextAaIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

/**
 * 工具图标的稳定 token 解析处：Registry 与 Tool Catalog 声明 token，
 * 本 map 是唯一事实源——新增 token 必须先在此登记，
 * 漏配在编译期报错（Record 查找必中，无运行时兜底）。
 */
const toolIconTokens = {
  ArrowsLeftRight: ArrowsLeftRightIcon,
  BookmarkSimple: BookmarkSimpleIcon,
  BracketsCurly: BracketsCurlyIcon,
  Calculator: CalculatorIcon,
  Clock: ClockIcon,
  Code: CodeIcon,
  FileCode: FileCodeIcon,
  FileText: FileTextIcon,
  GearSix: GearSixIcon,
  Hash: HashIcon,
  Image: ImageIcon,
  ImageSquare: ImageSquareIcon,
  Link: LinkIcon,
  Palette: PaletteIcon,
  QrCode: QrCodeIcon,
  // ScanText 是 OCR 工具的稳定 token；@phosphor-icons 无此图标，
  // 此前静默回落到 Wrench（旧 popup map 未登记），现解析为 TextAa
  ScanText: TextAaIcon,
  ShieldCheck: ShieldCheckIcon,
  Sparkle: SparkleIcon,
  Trash: TrashIcon,
} as const satisfies Record<string, Icon>

export type ToolIconToken = keyof typeof toolIconTokens

export function getToolIcon(token: ToolIconToken) {
  const Icon = toolIconTokens[token]
  return <Icon data-icon="inline-start" weight="duotone" />
}
