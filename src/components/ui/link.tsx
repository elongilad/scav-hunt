import * as React from "react"
import NextLink from "next/link"
import { cn } from "@/lib/utils"

export interface LinkProps extends React.ComponentProps<typeof NextLink> {
  variant?: 'default' | 'underline' | 'button' | 'nav'
  external?: boolean
  children: React.ReactNode
}

const linkVariants = {
  default: "text-spy-gold hover:text-spy-gold/80 transition-colors duration-200",
  underline: "text-spy-gold hover:text-spy-gold/80 underline underline-offset-4 hover:underline-offset-2 transition-all duration-200",
  button: "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-spy-gold text-black hover:bg-spy-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spy-gold/25 active:scale-95",
  nav: "text-gray-300 hover:text-spy-gold transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-spy-gold after:transition-all after:duration-200 hover:after:w-full"
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant = 'default', external = false, children, ...props }, ref) => {
    const baseClasses = linkVariants[variant]

    if (external) {
      return (
        <a
          className={cn(baseClasses, className)}
          ref={ref}
          target="_blank"
          rel="noopener noreferrer"
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      )
    }

    return (
      <NextLink
        className={cn(baseClasses, className)}
        ref={ref}
        {...props}
      >
        {children}
      </NextLink>
    )
  }
)

Link.displayName = "Link"