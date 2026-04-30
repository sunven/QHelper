import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function ToolSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200/80 bg-white/92 shadow-sm dark:border-slate-800 dark:bg-slate-950/78',
        className,
      )}
      {...props}
    />
  );
}
