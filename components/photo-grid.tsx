"use client"

import { cn } from "@/app/lib/utils"
import { DogCard, DogCardProps } from "./dog-card/dog-card"


interface PhotoGridProps {
  photos: DogCardProps[]
  columns?: 1 | 2 | 3
  className?: string
}

export function PhotoGrid({ photos, columns = 3, className }: PhotoGridProps) {

  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }

  return (
    <div className={cn("grid gap-3", columnClasses[columns], className)}>
      {photos.map((photo) => (
        <DogCard key={photo.id} {...photo} />
      ))}
    </div>
  )
}
