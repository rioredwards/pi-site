import * as React from "react"
import { cn } from "../../lib/utils"

const RotatingGradientBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
  { bgColor?: string, borderColors?: string[], borderCover?: number, borderWidth?: string, rotateSpeed?: string }
>(({
  className,
  bgColor = "white",
  borderColors = ["oklch(70% 0.1875 205.71)", "oklch(80.38% 0.2193 146.65)", "oklch(54.85% 0.2442 269.47)"],
  borderCover = .5,
  borderWidth = "2px",
  rotateSpeed = "3s",
  ...props
}, ref) => (
  <article
    ref={ref}
    className={cn(
      className
    )}
    style={{
      // inner bg color (needs to be linear gradient) __________________ Actual gradient border colors (in oklch color mode) _________ if borderCover is less than 1, add transparent colors to create a gap ___ gap is positioned at midway point (0.5 turn) and increases in size as borderCover decreases. It expands by half the difference between 1 and borderCover on either side of the 0.5 turn point. border ends with the first color in the array for a smooth transition.
      background: `linear-gradient(to bottom, ${bgColor}, ${bgColor}) padding-box, conic-gradient(from var(--bg-angle) in oklch, ${borderColors.concat(borderCover >= 1 ? [] : `transparent ${0.5 - ((1 - borderCover) / 2)}turn, transparent ${0.5 + ((1 - borderCover) / 2)}turn`).join(", ")}, ${borderColors[0]}) border-box`,
      border: `${borderWidth} solid transparent`,
      animation: `spin ${rotateSpeed} infinite linear`
    }}
    {...props}
  />
))
RotatingGradientBorder.displayName = "RotatingGradientBorder"

export { RotatingGradientBorder }


// background:
// linear - gradient(
//   to bottom,
//   white,
//   white
// )
// padding - box,
//   conic - gradient(
//     from var(--bg - angle) in oklch,
//       oklch(70% 0.1875 205.71),
//       oklch(80.38% 0.2193 146.65),
//       oklch(54.85% 0.2442 269.47),
//       oklch(70% 0.1875 205.71)
//       )
// border - box;
