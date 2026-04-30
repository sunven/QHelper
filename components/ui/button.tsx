import * as React from 'react';
import { cn } from './utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'ghost' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-transparent font-medium shadow-sm transition-[background-color,border-color,color,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' &&
          'bg-[linear-gradient(135deg,#0f766e_0%,#0f172a_100%)] text-white hover:bg-[linear-gradient(135deg,#0d9488_0%,#0f172a_92%)]',
        variant === 'destructive' &&
          'bg-[linear-gradient(135deg,#ef4444_0%,#b91c1c_100%)] text-white hover:bg-[linear-gradient(135deg,#f87171_0%,#b91c1c_100%)]',
        variant === 'ghost' &&
          'border-slate-200/70 bg-white/70 text-slate-700 shadow-none hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/55 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-white',
        variant === 'outline' &&
          'border-slate-200/80 bg-white/74 text-slate-700 shadow-none hover:border-emerald-300/60 hover:bg-emerald-50/80 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900/58 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200',
        variant === 'secondary' &&
          'border-slate-200/80 bg-slate-100/92 text-slate-800 hover:bg-slate-200/88 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        variant === 'default' &&
          'bg-[linear-gradient(135deg,#111827_0%,#1f2937_45%,#0f766e_100%)] text-white hover:bg-[linear-gradient(135deg,#0f172a_0%,#1f2937_35%,#059669_100%)]',
        size === 'sm' && 'h-8 px-2.5 text-[13px]',
        size === 'lg' && 'h-10 px-5 text-sm',
        size === 'icon' && 'h-8 w-8 p-0',
        size === 'default' && 'h-9 px-3 py-1.5 text-sm',
        className,
      )}
      {...props}
    />
  );
}
