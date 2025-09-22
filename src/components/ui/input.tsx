import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          // Spy-themed styling
          "bg-white/10 backdrop-blur-sm text-white placeholder-gray-400",
          // Normal state
          "border-white/20 hover:border-white/30",
          // Focus state
          "focus-visible:border-spy-gold focus-visible:ring-2 focus-visible:ring-spy-gold/20 focus-visible:shadow-lg focus-visible:shadow-spy-gold/10",
          // Error state
          error && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20",
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