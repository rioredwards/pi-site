import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

interface Props extends PropsWithChildren {
  color?: "blue" | "red" | "yellow" | "green" | "orange" | "purple" | "pink";
  className?: string;
}

export default function PillHighlight({
  children,
  color = "green",
  className,
}: Props) {
  const classes = cn(
    "px-2 py-1",
    "rounded-full",
    "font-semibold",
    "cursor-pointer",
    "whitespace-nowrap",
  );

  const colorUnderlineVariants = {
    blue: "text-blue-800 bg-blue-100 hover:bg-blue-200 hover:text-blue-900",
    red: "text-red-800 bg-red-100 hover:bg-red-200 hover:text-red-900",
    yellow:
      "text-yellow-800 bg-yellow-100 hover:bg-yellow-200 hover:text-yellow-900",
    green:
      "text-green-800 bg-green-100 hover:bg-green-200 hover:text-green-900",
    orange:
      "text-orange-800 bg-orange-100 hover:bg-orange-200 hover:text-orange-900",
    purple:
      "text-purple-800 bg-purple-100 hover:bg-purple-200 hover:text-purple-900",
    pink: "text-pink-800 bg-pink-100 hover:bg-pink-200 hover:text-pink-900",
  };

  return (
    <span className={cn(classes, colorUnderlineVariants[color], className)}>
      {children}
    </span>
  );
}
