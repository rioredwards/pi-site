"use client";

import { Trash2 } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LightboxTrigger,
  type LightboxSlide,
} from "@/components/lightbox-image/index";
import { PhotoCardOwnerPanel } from "../photo-card-owner-panel";
import { useDeleteContext } from "./delete-context";
import { useGalleryContext } from "../gallery-context";

interface DogCardOverlayContentProps {
  id: string;
  isOwner: boolean;
  userId: string;
  ownerDisplayName?: string | null;
  ownerProfilePicture?: string | null;
  showInfoPanel?: boolean;
  slide: LightboxSlide;
  /** Gallery can be passed as props OR provided via GalleryContext */
  gallery?: LightboxSlide[];
  galleryIndex?: number;
  enableLightbox?: boolean;
}

export function DogCardOverlayContent({
  id,
  isOwner,
  userId,
  ownerDisplayName,
  ownerProfilePicture,
  showInfoPanel = true,
  slide,
  gallery: galleryProp,
  galleryIndex: galleryIndexProp,
  enableLightbox = false,
}: DogCardOverlayContentProps) {
  const deleteContext = useDeleteContext();
  const galleryContext = useGalleryContext();

  // Use props if provided, otherwise fall back to context
  const gallery = galleryProp ?? galleryContext?.slides;
  const galleryIndex = galleryIndexProp ?? galleryContext?.getIndex(id) ?? 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteContext?.onDeleteClick(id);
  };

  // Show delete button only if user is owner AND delete context is available
  const showDeleteButton = isOwner && deleteContext;

  return (
    <>
      {/* Delete button - top left */}
      {showDeleteButton && (
        <button
          onClick={handleDelete}
          className={cn(
            "group/delete absolute top-3 left-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-destructive hover:text-destructive-foreground pointer-coarse:bg-destructive",
          )}
          aria-label="Delete photo"
        >
          <HugeiconsIcon
            icon={Trash2}
            size={20}
            className="text-foreground transition-colors group-hover/delete:text-destructive-foreground"
          />
        </button>
      )}
      {/* Fullscreen - top right */}
      {enableLightbox && (
        <div className="absolute top-3 right-3 z-20">
          <LightboxTrigger
            {...(gallery && gallery.length > 0
              ? { slides: gallery, index: galleryIndex }
              : { slide })}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary-foreground",
            )}
            aria-label="View fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </LightboxTrigger>
        </div>
      )}
      {/* Owner panel - bottom */}
      {showInfoPanel && (
        <PhotoCardOwnerPanel
          userId={userId}
          ownerDisplayName={ownerDisplayName}
          ownerProfilePicture={ownerProfilePicture}
          className="visible -bottom-1 opacity-100"
        />
      )}
    </>
  );
}
