import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function ToolSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-white/70 bg-white/88 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur dark:border-white/10 dark:bg-slate-950/72',
        className,
      )}
      {...props}
    />
  );
}
