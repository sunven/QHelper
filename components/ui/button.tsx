import * as React from 'react';
import { cn } from './utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded cursor-pointer transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-green-600 text-white hover:bg-green-700',
        variant === 'destructive' && 'bg-red-500 text-white hover:bg-red-600',
        variant === 'ghost' && 'hover:bg-gray-100',
        variant === 'default' && 'bg-gray-200 hover:bg-green-500 hover:text-white',
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'lg' && 'h-10 px-8',
        size === 'default' && 'h-9 px-4 py-2',
        className,
      )}
      {...props}
    />
  );
}
