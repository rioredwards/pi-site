"use client";

import { deletePhoto } from "@/app/actions";
import { Photo } from "@/app/lib/types";
import { Trash2 } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteDogConfirmationDialog } from "./dialogs/delete-dog-confirmation-dialog";
import { LightboxSlide, useLightbox } from "./lightbox";

interface ProfilePhotosGridProps {
  photos: Photo[];
  isOwner?: boolean;
}

export function ProfilePhotosGrid({ photos, isOwner = false }: ProfilePhotosGridProps) {
  const { openGallery } = useLightbox();
  const router = useRouter();
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

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

  const handleDeleteClick = (e: React.MouseEvent, photo: Photo) => {
    e.stopPropagation();
    setPhotoToDelete(photo);
  };

  const confirmDelete = async () => {
    if (!photoToDelete) return;
    const result = await deletePhoto(photoToDelete.id);
    if (!result.error) {
      router.refresh();
    }
    setPhotoToDelete(null);
  };

  return (
    <>
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
            {isOwner && (
              <div
                onClick={(e) => handleDeleteClick(e, photo)}
                className="absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
              >
                <HugeiconsIcon icon={Trash2} size={16} />
              </div>
            )}
          </button>
        ))}
      </div>
      {photoToDelete && (
        <DeleteDogConfirmationDialog
          open={!!photoToDelete}
          onOpenChange={(open) => !open && setPhotoToDelete(null)}
          onDelete={confirmDelete}
          onCancel={() => setPhotoToDelete(null)}
          src={photoToDelete.src}
          alt={photoToDelete.alt}
        />
      )}
    </>
  );
}
