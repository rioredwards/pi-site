"use client";

import { Photo } from "@/app/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { DogCard } from "./dog-card/dog-card";
import { DeleteDogConfirmationDialog } from "./dialogs/delete-dog-confirmation-dialog";
import { type LightboxSlide } from "@/components/lightbox-image/index";

function getPriorityIndices(): number[] | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window.innerWidth;
  if (w < 768) return [0];
  if (w < 1024) return [0, 1, 2, 3];
  return [0, 1, 2, 3, 4, 5];
}

export type PriorityStrategy = "first" | "all" | "none";

export interface PhotoGridProps {
  photos: Photo[];
  deletePhoto: (id: string) => void;
  currentUserId?: string | null;
  columns?: 1 | 2 | 3;
  className?: string;
  enableLightbox?: boolean;
  showInfoPanel?: boolean;
  priorityStrategy?: PriorityStrategy;
}

export function PhotoGrid({
  photos,
  deletePhoto,
  currentUserId = null,
  columns = 3,
  className,
  enableLightbox = false,
  showInfoPanel = true,
  priorityStrategy = "first",
}: PhotoGridProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  const slides: LightboxSlide[] = photos.map((p) => ({
    src: p.src,
    alt: p.alt,
    width: 1000,
    height: 1000,
    description: `Uploaded by ${p.ownerDisplayName || "Anonymous"}`,
  }));

  const priorityIndices = priorityStrategy === "first" ? getPriorityIndices() : undefined;
  const confirmPhoto = deleteConfirmId
    ? photos.find((p) => p.id === deleteConfirmId)
    : null;

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deletePhoto(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <div className={cn("grid gap-3", columnClasses[columns], className)}>
        {photos.map((photo, index) => {
          const isOwner =
            currentUserId != null &&
            (currentUserId === photo.userId || currentUserId === "admin");
          const priority =
            priorityStrategy === "all" ||
            (priorityIndices?.includes(index) ?? false);

          return (
            <DogCard
              key={photo.id}
              id={photo.id}
              src={photo.src}
              alt={photo.alt}
              userId={photo.userId}
              ownerDisplayName={photo.ownerDisplayName}
              ownerProfilePicture={photo.ownerProfilePicture}
              isOwner={isOwner}
              onDeleteClick={() => setDeleteConfirmId(photo.id)}
              showInfoPanel={showInfoPanel}
              priority={priority}
              slide={slides[index]}
              gallery={enableLightbox ? slides : undefined}
              galleryIndex={index}
              enableLightbox={enableLightbox}
            />
          );
        })}
      </div>
      <DeleteDogConfirmationDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onDelete={handleConfirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
        src={confirmPhoto?.src ?? ""}
        alt={confirmPhoto?.alt ?? ""}
      />
    </>
  );
}
