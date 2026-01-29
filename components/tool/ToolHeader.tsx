import React, { ReactNode } from 'react';
import { Star, Clock, Info } from 'lucide-react';
import { toolRegistry } from '@/lib/registry/ToolRegistry';
import type { ToolMetadata } from '@/lib/registry/ToolMetadata';

interface ToolHeaderProps {
  tool: ToolMetadata;
  actions?: ReactNode;
  showMetadata?: boolean;
}

/**
 * 图标映射 - 从 Lucide React 动态导入
 */
function getIconComponent(iconName: string) {
  try {
    // 动态导入图标组件
    // 注意：这需要在实际使用时配合 React.lazy 和 Suspense
    return null;
  } catch {
    return null;
  }
}

/**
 * 工具头部组件
 *
 * 显示工具的标题、描述、标签等信息
 *
 * @example
 * ```tsx
 * <ToolHeader
 *   tool={toolMetadata}
 *   actions={
 *     <div className="flex gap-2">
 *       <Button>复制</Button>
 *       <Button>导出</Button>
 *     </div>
 *   }
 * />
 * ```
 */
export function ToolHeader({ tool, actions, showMetadata = false }: ToolHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between">
          {/* 左侧：标题和描述 */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {/* 图标 */}
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                {getIconComponent(tool.icon) || (
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    {tool.nameEn.charAt(0)}
                  </span>
                )}
              </div>

              {/* 标题 */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {tool.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tool.nameEn}
                </p>
              </div>

              {/* 状态标签 */}
              {tool.status !== 'stable' && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    tool.status === 'beta'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : tool.status === 'experimental'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tool.status === 'beta'
                    ? 'Beta'
                    : tool.status === 'experimental'
                      ? '实验性'
                      : '已弃用'}
                </span>
              )}
            </div>

            {/* 描述 */}
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-3xl">
              {tool.description}
            </p>

            {/* 标签 */}
            {tool.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tool.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 右侧：操作按钮 */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* 元数据（可选显示） */}
        {showMetadata && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>v{tool.version}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>分类: {getCategoryName(tool.category)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="w-4 h-4" />
                <span>特性: {getFeatureNames(tool.features).join(', ')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 获取分类名称
 */
function getCategoryName(category: string): string {
  const categories = {
    common: '常用',
    encoding: '编码转换',
    image: '图片工具',
    security: '安全与加密',
    web_format: 'Web 格式',
    data_format: '数据格式',
    ai: 'AI 工具',
    other: '其他',
  };
  return categories[category as keyof typeof categories] || category;
}

/**
 * 获取特性名称列表
 */
function getFeatureNames(features: string[]): string[] {
  const featureNames: Record<string, string> = {
    single_input: '单输入',
    dual_input: '双输入',
    file_input: '文件输入',
    drag_drop: '拖拽',
    history: '历史记录',
    export: '导出',
    import: '导入',
    copy_result: '复制结果',
    ai_assist: 'AI 辅助',
    ai_generate: 'AI 生成',
    real_time: '实时处理',
  };

  return features.map((f) => featureNames[f] || f);
}
