import { cn } from "@/lib/utils"
import React from 'react'

interface ColorfulUnderlineProps {
  children: React.ReactNode
  className?: string
  color?: string
  size?: 's' | 'm' | 'l'
}

export function ColorfulUnderline({
  children,
  className,
  color = 'blue',
  size = 'm'
}: ColorfulUnderlineProps) {
  const thicknessClasses = {
    s: 'h-0.5',
    m: 'h-1',
    l: 'h-1.5'
  }

  const topMarginClasses = {
    s: "-mt-[2px]",
    m: "-mt-[2px]",
    l: "-mt-[2px]"
  }

  const underlineClass = cn(
    'block w-full',
    `bg-${color}-500`,
    thicknessClasses[size],
    topMarginClasses[size]
  )

  return (
    <span className={cn("inline-block relative", className)}>
      {children}
      <span className={underlineClass} />
    </span>
  )
}

