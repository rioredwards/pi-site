import * as React from "react"
import { cn } from "../../lib/utils"

const RotatingGradientBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
  { bgColor?: string, borderColors?: string[], borderCover?: number, borderWidth?: string, rotateSpeed?: string }
>(({
  className,
  borderColors = ["oklch(70% 0.1875 205.71)", "oklch(80.38% 0.2193 146.65)", "oklch(54.85% 0.2442 269.47)"],
  borderCover = .5,
  rotateSpeed = "3s",
  ...props
}, ref) => {
  return (
    <article className="relative group" ref={ref}>
      {/* Children */}
      <div className={cn(className)} {...props} />

      {/* Colorful border */}
      <div
        ref={ref}
        className={cn(
          className,
          "group-hover:opacity-100 opacity-0 transition-opacity",
        )}
        style={{
          background: `conic-gradient(from var(--bg-angle) in oklch, ${borderColors.concat(borderCover >= 1 ? [] : `transparent ${0.5 - ((1 - borderCover) / 2)}turn, transparent ${0.5 + ((1 - borderCover) / 2)}turn`).join(", ")}, ${borderColors[0]}) border-box`,
          border: `1px solid transparent`,
          animation: `spin ${rotateSpeed} infinite linear`,
          // For Gradient Shadow:
          position: "absolute",
          inset: "-2px",
          zIndex: -1,
          // scale: 1.01,
        }}
      ></div>

      {/* Colorful Shadow */}
      <div
        ref={ref}
        className={cn(
          className,
          "group-hover:opacity-25 opacity-0 transition-opacity",
        )}
        style={{
          background: `conic-gradient(from var(--bg-angle) in oklch, ${borderColors.concat(borderCover >= 1 ? [] : `transparent ${0.5 - ((1 - borderCover) / 2)}turn, transparent ${0.5 + ((1 - borderCover) / 2)}turn`).join(", ")}, ${borderColors[0]}) border-box`,
          border: `10px solid transparent`,
          animation: `spin ${rotateSpeed} infinite linear`,
          // For Gradient Shadow:
          filter: "blur(6px)",
          position: "absolute",
          inset: "-2px",
          zIndex: -1,
        }}
      ></div>
    </article>
  )
})
RotatingGradientBorder.displayName = "RotatingGradientBorder"

export { RotatingGradientBorder }
