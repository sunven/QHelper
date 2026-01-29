import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Home, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface ToolErrorDisplayProps {
  toolId: string;
  toolName: string;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onRetry: () => void;
  onGoHome: () => void;
}

/**
 * 工具错误展示组件
 *
 * 显示友好的错误信息，包括：
 * - 错误摘要
 * - 错误详情（可展开）
 * - 操作按钮（重试、返回首页）
 *
 * @example
 * ```tsx
 * <ToolErrorDisplay
 *   toolId="json"
 *   toolName="JSON 格式化"
 *   error={error}
 *   errorInfo={errorInfo}
 *   onRetry={handleRetry}
 *   onGoHome={handleGoHome}
 * />
 * ```
 */
export function ToolErrorDisplay({
  toolId,
  toolName,
  error,
  errorInfo,
  onRetry,
  onGoHome,
}: ToolErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyError = () => {
    const errorText = `工具: ${toolName} (${toolId})
错误: ${error?.name}
消息: ${error?.message}
堆栈:
${error?.stack || '(无)'}

组件堆栈:
${errorInfo?.componentStack || '(无)'}`;

    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full p-6">
        {/* 错误图标和标题 */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
              工具出错了
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {toolName} 在运行时遇到了问题
            </p>
          </div>
        </div>

        {/* 错误摘要 */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-4 mb-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {error?.name || '未知错误'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {error?.message || '发生了意外错误，请重试'}
          </p>
        </div>

        {/* 错误详情（可展开） */}
        {(error?.stack || errorInfo?.componentStack) && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-2"
            >
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {showDetails ? '隐藏详情' : '显示详情'}
            </button>

            {showDetails && (
              <div className="space-y-2">
                {error?.stack && (
                  <div className="bg-gray-900 text-gray-100 rounded-md p-3 overflow-x-auto">
                    <p className="text-xs font-mono whitespace-pre-wrap">{error.stack}</p>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div className="bg-gray-900 text-gray-100 rounded-md p-3 overflow-x-auto">
                    <p className="text-xs font-mono text-gray-400 mb-1">组件堆栈:</p>
                    <p className="text-xs font-mono whitespace-pre-wrap">{errorInfo.componentStack}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 rounded-md transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
          <button
            onClick={handleCopyError}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md transition-colors text-sm font-medium"
          >
            <Copy className="w-4 h-4" />
            {copied ? '已复制' : '复制错误'}
          </button>
        </div>

        {/* 开发环境提示 */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              开发模式提示: 错误信息显示在控制台中，请检查浏览器开发者工具
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 简化的错误展示组件
 *
 * 用于内联错误显示，例如在表单字段下方
 */
export function InlineErrorDisplay({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          >
            重试
          </button>
        )}
      </div>
    </div>
  );
}
