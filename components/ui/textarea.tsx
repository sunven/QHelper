import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-2xl border bg-white/78 px-4 py-3 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-[color,box-shadow,border-color,background-color] outline-none focus-visible:border-emerald-400/70 focus-visible:ring-emerald-400/18 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/58 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
