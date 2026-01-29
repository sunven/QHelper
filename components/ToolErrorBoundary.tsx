import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ToolErrorDisplay } from './ToolErrorDisplay';

interface Props {
  children: ReactNode;
  toolId: string;
  toolName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 工具错误边界组件
 *
 * 捕获子组件树中的 JavaScript 错误，显示友好的错误界面
 * 并支持错误上报和重试机制
 *
 * @example
 * ```tsx
 * <ToolErrorBoundary toolId="json" toolName="JSON 格式化">
 *   <JsonFormatter />
 * </ToolErrorBoundary>
 * ```
 */
export class ToolErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // 记录错误到控制台
    console.error(`Error in tool ${this.props.toolId}:`, error, errorInfo);

    // 调用自定义错误处理函数
    this.props.onError?.(error, errorInfo);

    // 可选：将错误上报到日志服务
    this.reportError(error, errorInfo);
  }

  /**
   * 上报错误到日志服务
   */
  private reportError(error: Error, errorInfo: ErrorInfo): void {
    const errorReport = {
      toolId: this.props.toolId,
      toolName: this.props.toolName,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // TODO: 实现错误上报逻辑（例如发送到日志服务）
    // 这里只是示例，实际项目中应该替换为真实的上报逻辑
    if (import.meta.env.DEV) {
      console.debug('Error report:', errorReport);
    }
  }

  /**
   * 重试 - 重新渲染组件
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * 返回首页
   */
  handleGoHome = (): void => {
    window.location.href = '/popup.html';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则使用默认错误显示组件
      return (
        <ToolErrorDisplay
          toolId={this.props.toolId}
          toolName={this.props.toolName}
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 使用错误边界的 Hook 版本
 *
 * 这是一个便捷的 Hook，用于在函数组件中使用错误边界
 *
 * @example
 * ```tsx
 * function MyTool() {
 *   const { ErrorBoundary } = useToolErrorBoundary('json', 'JSON 格式化');
 *
 *   return (
 *     <ErrorBoundary>
 *       <MyComponent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export function useToolErrorBoundary(toolId: string, toolName: string) {
  const ErrorBoundaryMemo = React.memo(
    ({ children, onError }: { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }) => (
      <ToolErrorBoundary toolId={toolId} toolName={toolName} onError={onError}>
        {children}
      </ToolErrorBoundary>
    ),
  );

  ErrorBoundaryMemo.displayName = `ToolErrorBoundary(${toolId})`;

  return {
    ErrorBoundary: ErrorBoundaryMemo,
  };
}
