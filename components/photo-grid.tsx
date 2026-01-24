"use client"

import { cn } from "@/app/lib/utils"
import { DogCard, DogCardProps } from "./dog-card/dog-card"
import { useLightbox, LightboxSlide } from "./lightbox"


interface PhotoGridProps {
  photos: DogCardProps[]
  columns?: 1 | 2 | 3
  className?: string
  enableLightbox?: boolean
}

export function PhotoGrid({ photos, columns = 3, className, enableLightbox = false }: PhotoGridProps) {
  const { openGallery } = useLightbox()

  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }

  const slides: LightboxSlide[] = photos.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    description: `Uploaded by ${photo.ownerDisplayName || "Anonymous"}`,
  }))

  const handleImageClick = (index: number) => {
    openGallery(slides, index)
  }

  return (
    <div className={cn("grid gap-3", columnClasses[columns], className)}>
      {photos.map((photo, index) => (
        <DogCard
          key={photo.id}
          {...photo}
          onImageClick={enableLightbox ? () => handleImageClick(index) : undefined}
        />
      ))}
    </div>
  )
}
