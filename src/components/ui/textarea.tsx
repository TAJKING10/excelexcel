import React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border-2 border-[#dbeafe] bg-white px-4 py-3 text-sm text-[#00226E] placeholder:text-[#64748B] transition-advensys focus-visible:outline-none focus-visible:border-[#003ABD] focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F8FAFC] resize-y",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
