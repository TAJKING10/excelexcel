import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-advensys focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-[#003ABD] text-white shadow-md hover:bg-[#0033a5] active:bg-[#002a8a] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] dark:active:bg-[#1d4ed8]",
        primary:
          "rounded-lg bg-[#003ABD] text-white shadow-md hover:bg-[#0033a5] active:bg-[#002a8a] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] dark:active:bg-[#1d4ed8]",
        cta:
          "rounded-lg bg-[#FF785E] text-white shadow-md hover:bg-[#ff6647] active:bg-[#ff5430] dark:bg-[#f97316] dark:hover:bg-[#ea580c] dark:active:bg-[#c2410c]",
        destructive:
          "rounded-lg bg-[#dc2626] text-white shadow-md hover:bg-[#b91c1c] active:bg-[#991b1b] dark:bg-[#ef4444] dark:hover:bg-[#dc2626] dark:active:bg-[#b91c1c]",
        outline:
          "rounded-lg border-2 border-[#003ABD] bg-white text-[#003ABD] hover:bg-[#eff6ff] active:bg-[#dbeafe] dark:border-[#60a5fa] dark:bg-transparent dark:text-[#60a5fa] dark:hover:bg-[#1e293b] dark:active:bg-[#334155]",
        secondary:
          "rounded-lg bg-[#F8FAFC] text-[#00226E] border border-[#dbeafe] hover:bg-[#eff6ff] active:bg-[#dbeafe] dark:bg-[#1e293b] dark:text-[#f8fafc] dark:border-[#334155] dark:hover:bg-[#334155] dark:active:bg-[#475569]",
        ghost:
          "rounded-md hover:bg-[#eff6ff] hover:text-[#003ABD] active:bg-[#dbeafe] dark:hover:bg-[#1e293b] dark:hover:text-[#60a5fa] dark:active:bg-[#334155]",
        link:
          "text-[#003ABD] underline-offset-4 hover:underline dark:text-[#60a5fa]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
