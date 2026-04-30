import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-14 w-full rounded-md border bg-white/82 px-2.5 py-2 text-sm shadow-inner transition-[color,box-shadow,border-color,background-color] outline-none focus-visible:border-emerald-400/70 focus-visible:ring-emerald-400/18 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/70",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
