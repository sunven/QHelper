/**
 * 错误消息组件
 */

import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export type ErrorMessageVariant = 'error' | 'warning' | 'info'

export interface ErrorMessageProps {
  variant?: ErrorMessageVariant
  title?: string
  message: string | string[]
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  actions?: ReactNode
}

const variantConfig = {
  error: {
    icon: AlertCircle,
    containerClass: 'bg-destructive/10 text-destructive border-destructive/20',
    iconClass: 'text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    containerClass:
      'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    iconClass: 'text-blue-600 dark:text-blue-400',
  },
}

export function ErrorMessage({
  variant = 'error',
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
  actions,
}: ErrorMessageProps) {
  const config = variantConfig[variant]
  const Icon = config.icon
  const messages = Array.isArray(message) ? message : [message]

  return (
    <div
      className={cn('rounded-lg border p-4', config.containerClass, className)}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)}
        />
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
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
  )
}
