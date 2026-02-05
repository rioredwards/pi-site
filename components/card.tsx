import * as React from "react";

import { RotatingGradientBorder } from "@/components/ui/RotatingGradientBorder";
import { cn } from "@/lib/utils";

const CardWithGradientBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { borderColors: string[] }
>(({ className, borderColors, ...props }, ref) => (
  <RotatingGradientBorder
    containerClassName="group"
    borderClassName="!opacity-[0.4]"
    shadowClassName="!opacity-[0] group-hover:!opacity-[0.4]"
    borderColors={borderColors}
    ref={ref}
  >
    <Card className={cn(className)} {...props} />
  </RotatingGradientBorder>
));

CardWithGradientBorder.displayName = "CardWithGradientBorder";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-row items-center justify-start space-y-1.5 p-6 md:block",
      className,
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-3xl leading-none font-bold tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mr-4 mb-0 h-12 w-12 cursor-pointer rounded-2xl border border-slate-100 bg-transparent p-2 text-6xl text-card-foreground hover:border-slate-200 hover:bg-slate-100 md:static md:mr-0 md:mb-8",
      className,
    )}
    {...props}
  />
));
CardIcon.displayName = "CardIcon";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardTitle,
  CardWithGradientBorder,
};
