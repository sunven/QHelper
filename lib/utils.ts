import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
  } catch (error) {
    console.error('Failed to copy:', error)
    throw error
  }
}

/**
 * 提取错误的可展示信息：Error 取 message，字符串错误原样返回，其余回落 fallback
 */
export function getErrorMessage(error: unknown, fallback = '未知错误'): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  return fallback
}
