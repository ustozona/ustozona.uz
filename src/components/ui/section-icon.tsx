import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sectionIconVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground/75",
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
        inverted: "bg-foreground text-background",
      },
      size: {
        default: "size-9 [&_svg:not([class*='size-'])]:size-[18px]",
        sm: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "size-12 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function SectionIcon({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof sectionIconVariants>) {
  return (
    <div
      data-slot="section-icon"
      className={cn(sectionIconVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { SectionIcon, sectionIconVariants }
