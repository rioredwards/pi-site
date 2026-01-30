"use client";

import { cn } from "@/app/lib/utils";
import { DogCard, DogCardProps } from "./dog-card/dog-card";
import { LightboxSlide, useLightbox } from "./lightbox";

interface PhotoGridProps {
  photos: DogCardProps[];
  columns?: 1 | 2 | 3;
  className?: string;
  enableLightbox?: boolean;
}

function getPriorityIdxs(): number[] | undefined {
  if (typeof window === "undefined") return;
  const windowWidth = window.innerWidth;
  if (windowWidth < 768) return [0];
  if (windowWidth < 1024) return [0, 1, 2, 3];
  return [0, 1, 2, 3, 4, 5];
}

export function PhotoGrid({
  photos,
  columns = 3,
  className,
  enableLightbox = false,
}: PhotoGridProps) {
  const { openGallery } = useLightbox();

  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  const slides: LightboxSlide[] = photos.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    width: 1000,
    height: 1000,
    description: `Uploaded by ${photo.ownerDisplayName || "Anonymous"}`,
  }));

  const showLightbox = (index: number) => {
    openGallery(slides, index);
  };

  const priorityIdxs = getPriorityIdxs();

  return (
    <div className={cn("grid gap-3", columnClasses[columns], className)}>
      {photos.map((photo, index) => (
        <DogCard
          key={photo.id}
          {...photo}
          showLightbox={enableLightbox ? () => showLightbox(index) : undefined}
          priority={priorityIdxs?.includes(index) || false}
        />
      ))}
    </div>
  );
}
