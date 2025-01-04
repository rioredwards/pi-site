import * as React from "react";
import { cn } from "../../lib/utils";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createTransparencyStrings(coverage: number, skew: number = 0, softEdge: number = .01): string[] {
  if (coverage <= 0) return [];

  // Clamp values
  coverage = clamp(coverage, 0, 1);
  skew = clamp(skew, -1, 1);
  softEdge = clamp(softEdge, .001, .999);

  // Initial
  const middle = 0.5;
  const start = middle - (coverage / 2);
  const end = start + coverage;

  // Rotate
  const adjustedStart = start + ((skew * coverage) / 2);
  const adjustedEnd = end + ((skew * coverage) / 2);

  // Expand
  // If skew pushes a val past 1 (end) or 0 (start), then clamp it and add the remainder to the other value
  const expandedStart = adjustedEnd > 1 ? adjustedStart - (adjustedEnd % 1) : adjustedStart;
  const expandedEnd = adjustedStart < 0 ? adjustedEnd + Math.abs(adjustedStart % 1) : adjustedEnd;

  // Clamp
  const clampedStart = Math.max(expandedStart, 0);
  const clampedEnd = Math.min(expandedEnd, 1);

  // Pad
  // Prevents the gradient from having too sharp of a transition
  const paddedStart = clampedStart < softEdge ? softEdge : clampedStart;
  const paddedEnd = clampedEnd > (1 - softEdge) ? (1 - softEdge) : clampedEnd;

  // Format the output in 'turn' units
  const transparency1 = `${`transparent ${paddedStart}turn`}`;
  const transparency2 = `${`transparent ${paddedEnd}turn`}`;

  return [transparency1, transparency2];
}

function formatBorderColorsArray(borderColors: string[], borderCover: number, skew: number = 0, softEdge: number = 0.01): string[] {
  const transparencyCoverage = 1 - borderCover;
  const transparencyStrings = createTransparencyStrings(transparencyCoverage, skew, softEdge);
  const borderBgColors = skew >= 0 ? [...borderColors, ...transparencyStrings, borderColors[0]] : [borderColors[borderColors.length - 1], ...transparencyStrings, ...borderColors];
  return borderBgColors;
}


function createBgStyle(borderColors: string[], borderCover: number, skew: number = 0, softEdge: number = 0.01): string {
  const borderBgColors = formatBorderColorsArray(borderColors, borderCover, skew, softEdge);
  const borderBgColorString = borderBgColors.join(", ");
  const bgStyle = (colorString: string) => `conic-gradient(from calc(var(--bg-angle) - ${skew}deg) in oklch, ${colorString}) border-box`;
  return bgStyle(borderBgColorString);
}

interface Props {
  borderColors?: string[]
  borderOpacity?: number
  borderCover?: number
  colorSkew?: number
  softEdge?: number
  borderWidth?: string
  rotateSpeed?: string
  colorShadow?: boolean
  colorShadowOpacity?: number
  colorShadowBlur?: number
}

const RotatingGradientBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
  Props
>(({
  className,
  borderColors = ["oklch(70% 0.1875 205.71)", "oklch(80.38% 0.2193 146.65)", "oklch(54.85% 0.2442 269.47)"],
  borderOpacity = 1,
  borderCover = .5,
  colorSkew = 0,
  softEdge = .01,
  borderWidth = "2px",
  colorShadow = true,
  colorShadowOpacity = .5,
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
          "group-hover:opacity-100 opacity-1000 transition-opacity",
        )}
        style={{
          background: createBgStyle(borderColors, borderCover),
          // border: `1px solid transparent`,
          animation: `spin ${rotateSpeed} infinite linear`,
          position: "absolute",
          inset: "-2px",
          // display: "none",
          zIndex: -1,
        }}
      ></div>

      {/* Colorful Shadow */}
      <div
        ref={ref}
        className={cn(
          className,
          "group-hover:opacity-50 opacity-50 transition-opacity",
        )}
        style={{
          background: createBgStyle(borderColors, borderCover * .5, -.9, .9),
          border: `2px solid transparent`,
          animation: `spin ${rotateSpeed} infinite linear`,
          filter: "blur(6px)",
          WebkitFilter: "blur(6px)",
          position: "absolute",
          // inset: "-2px",
          // display: "none",
          inset: "-2px",
          zIndex: -1,
        }}
      ></div>
    </article >
  )
})
RotatingGradientBorder.displayName = "RotatingGradientBorder"

export { RotatingGradientBorder };


// Test Cases
// console.log(calculateGradient(0, 0)); // { gradientStart: '0.5turn', gradientEnd: '0.5turn' }
// console.log(calculateGradient(0, 1)); // { gradientStart: '1turn', gradientEnd: '1turn' }
// console.log(calculateGradient(0, 0.5)); // { gradientStart: '0.75turn', gradientEnd: '0.75turn' }
// console.log(calculateGradient(0.5, 0)); // { gradientStart: '0.25turn', gradientEnd: '0.75turn' }
// console.log(calculateGradient(0.5, 1)); // { gradientStart: '0.5turn', gradientEnd: '1turn' }
// console.log(calculateGradient(0.5, 0.5)); // { gradientStart: '0.375turn', gradientEnd: '0.875turn' }
// console.log(calculateGradient(1, 1)); // { gradientStart: '0turn', gradientEnd: '1turn' }
