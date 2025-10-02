import React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border-2 border-[#dbeafe] bg-white px-4 py-2 text-sm text-[#00226E] placeholder:text-[#64748B] transition-advensys file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#00226E] focus-visible:outline-none focus-visible:border-[#003ABD] focus-visible:shadow-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F8FAFC]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
