/**
 * 错误消息组件
 */

import React from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type ErrorMessageVariant = 'error' | 'warning' | 'info';

export interface ErrorMessageProps {
  variant?: ErrorMessageVariant;
  title?: string;
  message: string | string[];
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  actions?: React.ReactNode;
}

const variantConfig = {
  error: {
    icon: AlertCircle,
    containerClass: 'bg-destructive/10 text-destructive border-destructive/20',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    containerClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
};

export function ErrorMessage({
  variant = 'error',
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
  actions,
}: ErrorMessageProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const messages = Array.isArray(message) ? message : [message];

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.containerClass,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
          )}
          <ul className="text-sm space-y-1">
            {messages.map((msg, index) => (
              <li key={index} className="flex items-start gap-2">
                {messages.length > 1 && (
                  <span className="flex-shrink-0">•</span>
                )}
                <span className="flex-1">{msg}</span>
              </li>
            ))}
          </ul>
          {actions && (
            <div className="mt-3 flex items-center gap-2">{actions}</div>
          )}
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={onDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 内联错误消息组件（用于表单字段）
 */
export interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn('flex items-center gap-1.5 text-xs text-destructive mt-1', className)}>
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * 输入验证提示组件
 */
export interface ValidationHintProps {
  messages: string[];
  type?: 'error' | 'warning' | 'info';
  className?: string;
}

export function ValidationHint({ messages, type = 'info', className }: ValidationHintProps) {
  if (messages.length === 0) return null;

  const config = variantConfig[type];

  return (
    <div className={cn('flex flex-col gap-1 mt-2', className)}>
      {messages.map((message, index) => (
        <div key={index} className="flex items-start gap-2 text-xs">
          <div className={cn('w-1 h-1 rounded-full mt-1.5 flex-shrink-0', {
            'bg-destructive': type === 'error',
            'bg-yellow-500': type === 'warning',
            'bg-blue-500': type === 'info',
          })} />
          <span className={cn('flex-1', config.iconClass)}>{message}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 错误边界组件
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorMessage
          variant="error"
          title="发生错误"
          message={this.state.error?.message || '未知错误'}
          className="m-4"
        />
      );
    }

    return this.props.children;
  }
}
