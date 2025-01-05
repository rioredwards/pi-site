import { cn } from "@/lib/utils";
import { PropsWithChildren, ReactNode } from "react";

interface GradientTextProps extends PropsWithChildren {
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <h2
      className={cn(
        "text-3xl my-4 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500",
        className
      )}>
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
          className="text-3xl md:text-5xl animate-bounce"
          style={{ animationDelay: `${index * 0.1}s` }}>
          {icon}
        </span>
      ))}
    </div>
  );
}
