"use client";

import { Trash2 } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageOff, Maximize2, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { cn } from "../../app/lib/utils";
import { useImageLoadState } from "../../hooks/use-image-load-state";
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
  showLightbox?: () => void;
  showInfoPanel?: boolean;
  onCardClick?: () => void;
  toggleOverlayOnClick?: boolean;
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
  showLightbox,
  showInfoPanel = true,
  onCardClick,
  toggleOverlayOnClick = false,
}: DogCardProps) {
  const [showDetail, setShowDetail] = useState(false);
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

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    showLightbox?.();
  };

  const handleClick = () => {
    if (onCardClick) {
      onCardClick();
    } else if (toggleOverlayOnClick) {
      setShowDetail((prev) => !prev);
    }
  };

  return (
    <Card
      className={cn(
        "group relative aspect-square cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 ease-in-out",
      )}
      onClick={handleClick}
      onMouseEnter={() => setShowDetail(true)}
      onMouseLeave={() => setShowDetail(false)}
      data-photo-id={id}
    >
      <div className="absolute inset-0 transition-all duration-200 ease-in-out">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
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
        <Image
          key={imageKey}
          src={src}
          alt={alt}
          fill
          priority={priority}
          className={cn(
            "object-cover transition-transform duration-300 ease-in-out",
            showDetail && "scale-110",
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onLoadStart={onLoadStart}
          onLoad={onLoad}
          onError={onError}
        />
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors duration-300",
            showDetail && "bg-foreground/40",
          )}
        >
          {isOwner && (
            <button
              onClick={handleDelete}
              className={cn(
                "group/delete invisible absolute top-3 left-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-destructive hover:text-destructive-foreground pointer-coarse:bg-destructive",
                showDetail && "visible opacity-100",
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
          {showLightbox && (
            <button
              onClick={handleFullscreen}
              className={cn(
                "invisible absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary-foreground",
                showDetail && "visible opacity-100",
              )}
              aria-label="View fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
          {showInfoPanel && (
            <PhotoCardOwnerPanel
              userId={userId}
              ownerDisplayName={ownerDisplayName}
              ownerProfilePicture={ownerProfilePicture}
              className={cn(showDetail && "visible -bottom-1 opacity-100")}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
