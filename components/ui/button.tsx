import * as React from 'react';
import { cn } from './utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded cursor-pointer transition-colors',
        variant === 'primary' && 'bg-green-600 text-white hover:bg-green-700',
        variant === 'default' && 'bg-gray-200 hover:bg-green-500 hover:text-white',
        className,
      )}
      {...props}
    />
  );
}
