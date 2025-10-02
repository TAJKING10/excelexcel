import React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-advensys focus:outline-none focus:shadow-[var(--focus-ring)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#003ABD] text-white shadow-sm hover:bg-[#0033a5]",
        secondary:
          "border-transparent bg-[#F8FAFC] text-[#00226E] border-[#dbeafe] hover:bg-[#eff6ff]",
        destructive:
          "border-transparent bg-[#dc2626] text-white shadow-sm hover:bg-[#b91c1c]",
        success:
          "border-transparent bg-[#059669] text-white shadow-sm hover:bg-[#047857]",
        warning:
          "border-transparent bg-[#f59e0b] text-white shadow-sm hover:bg-[#d97706]",
        outline:
          "border-[#003ABD] text-[#003ABD] bg-white hover:bg-[#eff6ff]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
