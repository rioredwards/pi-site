import * as React from "react"
import { cn } from "../../lib/utils"

const RotatingGradientBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref}
    className={cn(
      "relative",
      "before:absolute before:animate-border-spin before:content-['']",
      "gradient-border",
      className
    )}
    style={{ background: "conic-gradient(45deg, #f3ec78, #af4261, #5773ff, #5773ff, #f3ec78, #af4261, #5773ff, #5773ff, #f3ec78, #af4261, #5773ff, #5773ff, #f3ec78, #af4261, #5773ff, #5773ff)" }}
  >
    <div
      className={cn(
        "absolute inset-[1px] w-[calc(100%+2px)] h-[calc(100%+2px)]",
        className
      )}
      {...props}
    />
  </div>
))
RotatingGradientBorder.displayName = "RotatingGradientBorder"

export { RotatingGradientBorder }
