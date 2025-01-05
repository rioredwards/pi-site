import * as React from "react";

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
  border?: boolean
  borderColors?: string[]
  borderOpacity?: number
  borderCover?: number
  borderSkew?: number
  borderSoftEdge?: number
  borderWidth?: number
  shadow?: boolean
  shadowSkew?: number
  shadowWidth?: number
  shadowOpacity?: number
  shadowBlur?: number
  shadowSoftEdge?: number
  rotate?: boolean
  rotateSpeed?: number
}

const RotatingGradientBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
  Props
>(({
  border = true,
  borderColors = ["oklch(70% 0.1875 205.71)", "oklch(80.38% 0.2193 146.65)", "oklch(54.85% 0.2442 269.47)"],
  borderOpacity = 1,
  borderCover = 0.5,
  borderWidth = 2,
  borderSkew = 0,
  borderSoftEdge = .01,
  shadow = true,
  shadowSkew = 0,
  shadowOpacity = 0.5,
  shadowWidth = 3,
  shadowBlur = 6,
  shadowSoftEdge = .01,
  rotate = true,
  rotateSpeed = 3,
  children,
  ...props
}, ref) => {
  const borderBgStyle = createBgStyle(borderColors, borderCover, borderSkew, borderSoftEdge);
  const shadowBgStyle = createBgStyle(borderColors, borderCover, shadowSkew, shadowSoftEdge);

  const sharedStyle: React.CSSProperties = {
    animation: rotate ? `spin ${rotateSpeed}s infinite linear` : "none",
    position: "absolute",
    zIndex: -1,
    borderRadius: "inherit",
  };

  const borderStyle: React.CSSProperties = {
    ...sharedStyle,
    opacity: borderOpacity,
    background: borderBgStyle,
    inset: `-${borderWidth}px`,
  };

  const shadowStyle: React.CSSProperties = {
    ...sharedStyle,
    opacity: shadowOpacity,
    background: shadowBgStyle,
    inset: `-${shadowWidth}px`,
    filter: `blur(${shadowBlur}px)`,
    WebkitFilter: `blur(${shadowBlur}px)`,
  };

  return (
    <>
      {/* Parent */}
      <div {...props} style={{ position: "relative" }} ref={ref}>
        {/* Inner Content (passed in through children/props) */}
        {children}
        {/* Gradient Border */}
        {border && <div style={borderStyle} />}
        {/* Gradient Shadow */}
        {shadow && <div style={shadowStyle} />}
      </div >
    </>
  )
})

RotatingGradientBorder.displayName = "RotatingGradientBorder"

export { RotatingGradientBorder };
