"use client";

import { Trash2 } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageOff, Maximize2, RefreshCw } from "lucide-react";
import BounceLoader from "react-spinners/BounceLoader";
import { cn } from "@/lib/utils";
import { useImageLoadState } from "@/hooks/use-image-load-state";
import { ImageOverlay } from "@/components/image-overlay/image-overlay";
import {
  LightboxImageClient,
  LightboxTrigger,
  type LightboxSlide,
} from "@/components/lightbox-image/index";
import { Card } from "../card";
import { PhotoCardOwnerPanel } from "../photo-card-owner-panel";

export interface DogCardProps {
  id: string;
  src: string;
  alt: string;
  userId: string;
  ownerDisplayName?: string | null;
  ownerProfilePicture?: string | null;
  isOwner: boolean;
  onDeleteClick: () => void;
  priority?: boolean;
  showInfoPanel?: boolean;
  /** Pass when this card can open in lightbox; grid provides slide + gallery */
  slide: LightboxSlide;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
  enableLightbox?: boolean;
}

export function DogCard({
  id,
  src,
  alt,
  userId,
  ownerDisplayName,
  ownerProfilePicture,
  isOwner,
  onDeleteClick,
  priority = false,
  showInfoPanel = true,
  slide,
  gallery,
  galleryIndex = 0,
  enableLightbox = false,
}: DogCardProps) {
  const {
    loading,
    hasExhaustedRetries,
    retry,
    imageKey,
    onLoadStart,
    onLoad,
    onError,
  } = useImageLoadState({ maxRetries: 2 });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick();
  };

  const imageContent = (
    <ImageOverlay
      key={imageKey}
      src={src}
      alt={alt}
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      priority={priority}
      className="absolute inset-0 rounded-2xl"
      overlayClassName="rounded-2xl"
      zoomOnHover={enableLightbox}
      onLoadStart={onLoadStart}
      onLoad={onLoad}
      onError={onError}
    >
      {/* Delete button - top left */}
      {isOwner && (
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
      {/* Fullscreen - top right (registry LightboxTrigger) */}
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
    </ImageOverlay>
  );

  return (
    <Card
      className={cn(
        "group relative aspect-square overflow-hidden rounded-2xl transition-all duration-200 ease-in-out",
      )}
      data-photo-id={id}
    >
      <div className="absolute inset-0 transition-all duration-200 ease-in-out">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40">
            <BounceLoader
              color={"oklch(0.75 0.15 55)"}
              loading={true}
              size={25}
            />
          </div>
        )}
        {hasExhaustedRetries && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-muted/80">
            <ImageOff className="h-8 w-8 text-muted-foreground" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                retry();
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground underline hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
          </div>
        )}
        {enableLightbox ? (
          <LightboxImageClient
            enableLightbox={true}
            slide={slide}
            gallery={gallery}
            galleryIndex={galleryIndex}
          >
            {imageContent}
          </LightboxImageClient>
        ) : (
          imageContent
        )}
      </div>
    </Card>
  );
}
