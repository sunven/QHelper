import React, { ReactNode } from 'react';

interface ToolContentProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  className?: string;
}

/**
 * 工具内容区域组件
 *
 * 提供统一的内容区域容器，包括：
 * - 最大宽度控制
 * - 响应式 padding
 * - 居中对齐
 *
 * @example
 * ```tsx
 * <ToolContent maxWidth="xl">
 *   <YourToolContent />
 * </ToolContent>
 * ```
 */
export function ToolContent({
  children,
  maxWidth = '7xl',
  className = '',
}: ToolContentProps) {
  const maxWidthClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * 工具卡片容器
 *
 * 用于包装工具的主要内容区域
 */
export function ToolCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

/**
 * 工具部分容器
 *
 * 用于将工具内容分成多个部分
 */
export function ToolSection({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * 工具输入区域
 *
 * 用于包装输入表单或控件
 */
export function ToolInputArea({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * 工具输出区域
 *
 * 用于包装输出结果
 */
export function ToolOutputArea({
  children,
  label = '结果',
  actions,
  className = '',
}: {
  children: ReactNode;
  label?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-6 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/**
 * 工具分隔符
 *
 * 用于分隔不同区域
 */
export function ToolDivider({ className = '' }: { className?: string }) {
  return <div className={`border-t border-gray-200 dark:border-gray-700 my-6 ${className}`} />;
}

/**
 * 工具提示信息
 *
 * 用于显示提示或帮助信息
 */
export function ToolHint({
  children,
  type = 'info',
}: {
  children: ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
}) {
  const typeClasses = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  };

  return (
    <div className={`p-3 rounded-md border text-sm ${typeClasses[type]}`}>
      {children}
    </div>
  );
}
