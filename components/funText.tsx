import { cn } from "@/lib/utils"
import { ReactNode } from "react"


export function GradientText({ text }: { text: string }) {
  return (
    <h2 className="text-3xl my-4 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 animate-pulse">
      {text}
    </h2>
  )
}


interface FunIconsProps {
  className?: string
  icons: (string | ReactNode)[]
}

export function FunIcons({ className, icons }: FunIconsProps) {
  return (
    <div className={cn("mt-4 flex justify-center space-x-2", className)}>
      {icons.map((icon, index) => (
        <span
          key={index}
          className="text-3xl md:text-5xl animate-bounce"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {icon}
        </span>
      ))}
    </div>
  )
}

