"use client";

import { Trash2, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageOff, Maximize2, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { cn, getProfilePictureUrl } from "../../app/lib/utils";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Card } from "../card";

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
}: DogCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [profilePicError, setProfilePicError] = useState(false);
  const MAX_RETRIES = 2;
  const isMobile = useIsMobile();

  // Automatic retry with exponential backoff
  useEffect(() => {
    if (error && retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s backoff
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setImageKey((prev) => prev + 1);
        setLoading(true);
        setError(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [error, retryCount]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick();
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    showLightbox?.();
  };

  const handleClick = () => {
    if (isMobile) {
      setShowDetail((prev) => !prev);
    } else if (showLightbox) {
      showLightbox();
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
          {/* Error fallback UI after max retries */}
          {error && retryCount >= MAX_RETRIES && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-muted/80">
              <ImageOff className="h-8 w-8 text-muted-foreground" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRetryCount(0);
                  setImageKey((prev) => prev + 1);
                  setLoading(true);
                  setError(false);
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
            onLoadStart={() => {
              setLoading(true);
              setError(false);
            }}
            onLoad={() => {
              setLoading(false);
              setError(false);
            }}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
          {/* Overlay */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors duration-300",
              showDetail && "bg-foreground/40",
            )}
          >
            {/* Delete button - top left */}
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
            {/* Fullscreen button - top right */}
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
            {/* Info panel - bottom overlay */}
            {showInfoPanel && (
              <Link
                href={`/profile/${encodeURIComponent(userId)}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "invisible absolute right-0 -bottom-20 left-0 z-30 flex items-center gap-3 rounded-t-2xl bg-background/70 px-4 py-3 opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out group-hover:bottom-0 hover:bg-background/80",
                  showDetail && "visible -bottom-1 opacity-100",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {ownerProfilePicture && !profilePicError ? (
                    <Image
                      src={getProfilePictureUrl(ownerProfilePicture)!}
                      alt={ownerDisplayName || "User"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      onError={() => setProfilePicError(true)}
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={User02Icon}
                      size={20}
                      className="text-muted-foreground"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Uploaded by</p>
                  <p className="truncate text-sm font-semibold text-foreground">
                    {ownerDisplayName || "Anonymous"}
                  </p>
                </div>
              </Link>
            )}
          </div>
      </div>
    </Card>
  );
}
