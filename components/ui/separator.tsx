"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>

const Separator = ({ className, orientation = "horizontal", decorative = true, ...props }: SeparatorProps) => {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px min-h-1.5",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
