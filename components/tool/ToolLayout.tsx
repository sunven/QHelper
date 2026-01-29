import React, { ReactNode } from 'react';
import { ToolHeader } from './ToolHeader';
import { ToolContent } from './ToolContent';
import { ToolErrorBoundary } from '../ToolErrorBoundary';
import type { ToolMetadata } from '@/lib/registry/ToolMetadata';

interface ToolLayoutProps {
  tool: ToolMetadata;
  children: ReactNode;
  headerActions?: ReactNode;
  showErrorBoundary?: boolean;
  containerClassName?: string;
}

/**
 * 标准工具布局组件
 *
 * 提供统一的工具页面布局，包括：
 * - 标准头部（工具名称、描述、图标）
 * - 内容区域
 * - 错误边界（可选）
 *
 * @example
 * ```tsx
 * <ToolLayout tool={toolMetadata} headerActions={<Button>导出</Button>}>
 *   <ToolContent>
 *     <YourToolContent />
 *   </ToolContent>
 * </ToolLayout>
 * ```
 */
export function ToolLayout({
  tool,
  children,
  headerActions,
  showErrorBoundary = true,
  containerClassName = '',
}: ToolLayoutProps) {
  const content = (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${containerClassName}`}>
      {/* 头部 */}
      <ToolHeader tool={tool} actions={headerActions} />

      {/* 主内容 */}
      <ToolContent>{children}</ToolContent>
    </div>
  );

  if (showErrorBoundary) {
    return <ToolErrorBoundary toolId={tool.id} toolName={tool.name}>{content}</ToolErrorBoundary>;
  }

  return content;
}

/**
 * 简化版工具布局（无错误边界）
 */
export function SimpleToolLayout({
  tool,
  children,
  headerActions,
}: Omit<ToolLayoutProps, 'showErrorBoundary' | 'containerClassName'>) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToolHeader tool={tool} actions={headerActions} />
      <ToolContent>{children}</ToolContent>
    </div>
  );
}

/**
 * 紧凑版工具布局（适用于简单工具）
 */
export function CompactToolLayout({
  tool,
  children,
}: {
  tool: ToolMetadata;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            {/* 图标将通过 Lucide React 动态渲染 */}
            <span className="text-green-600 dark:text-green-400 font-bold text-sm">
              {tool.nameEn.charAt(0)}
            </span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tool.name}
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
