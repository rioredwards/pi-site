import { cn } from "@/lib/utils";
import { PropsWithChildren, ReactNode } from "react";

interface GradientTextProps extends PropsWithChildren {
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <h2
      className={cn(
        "my-4 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-3xl font-extrabold text-transparent",
        className,
      )}
    >
      {children}
    </h2>
  );
}

interface FunIconsProps {
  className?: string;
  icons: (string | ReactNode)[];
}

export function FunIcons({ className, icons }: FunIconsProps) {
  return (
    <div className={cn("mt-4 flex justify-center space-x-2", className)}>
      {icons.map((icon, index) => (
        <span
          key={index}
          className="animate-bounce text-3xl md:text-5xl"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

