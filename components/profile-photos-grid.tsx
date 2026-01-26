"use client";

import { Photo } from "@/app/lib/types";
import Image from "next/image";
import { LightboxSlide, useLightbox } from "./lightbox";

interface ProfilePhotosGridProps {
  photos: Photo[];
}

export function ProfilePhotosGrid({ photos }: ProfilePhotosGridProps) {
  const { openGallery } = useLightbox();

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

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo, index) => (
        <button
          key={photo.id}
          onClick={() => showLightbox(index)}
          className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </button>
      ))}
    </div>
  );
}
