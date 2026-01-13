import { cn } from "@/lib/utils";
import React from "react";

interface ColorfulUnderlineProps {
  children: React.ReactNode;
  className?: string;
  color?: "blue" | "red" | "yellow" | "green" | "orange" | "purple" | "pink";
  size?: "s" | "m" | "l";
}

export function ColorfulUnderline({
  children,
  className,
  color = "blue",
  size = "m",
}: ColorfulUnderlineProps) {
  const thicknessClasses = {
    s: "h-0.5",
    m: "h-1",
    l: "h-1.5",
  };

  const topMarginClasses = {
    s: "-mt-[2px]",
    m: "-mt-[2px]",
    l: "-mt-[2px]",
  };

  const colorUnderlineVariants = {
    blue: "bg-blue-500 group-hover:bg-blue-600",
    red: "bg-red-500 group-hover:bg-red-600",
    yellow: "bg-yellow-500 group-hover:bg-yellow-600",
    green: "bg-green-500 group-hover:bg-green-600",
    orange: "bg-orange-500 group-hover:bg-orange-600",
    purple: "bg-purple-500 group-hover:bg-purple-600",
    pink: "bg-pink-500 group-hover:bg-pink-600",
  };

  const underlineClass = cn(
    "block w-full",
    colorUnderlineVariants[color],
    thicknessClasses[size],
    topMarginClasses[size]
  );

  return (
    <span className={cn("group relative inline-block", className)}>
      {children}
      <span className={underlineClass} />
    </span>
  );
}
