"use client";

import { Trash2, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Maximize2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { cn, getProfilePictureUrl } from "../../app/lib/utils";
import { useIsMobile } from "../../hooks/use-is-mobile";
import { Card } from "../card";
import { DeleteDogConfirmationDialog } from "../dialogs/delete-dog-confirmation-dialog";

export interface DogCardProps {
  id: string;
  src: string;
  alt: string;
  userId: string;
  ownerDisplayName?: string | null;
  ownerProfilePicture?: string | null;
  deletePhoto: (id: string) => void;
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
  deletePhoto,
  priority = false,
  showLightbox,
  showInfoPanel = true,
}: DogCardProps) {
  const { data: session } = useSession();
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwner = session?.user?.id === userId || session?.user?.id === "admin";
  const isMobile = useIsMobile();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    showLightbox?.();
  };

  const confirmDelete = () => {
    deletePhoto(id);
    setShowConfirm(false);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  const handleClick = () => {
    if (isMobile) {
      setShowDetail((prev) => !prev);
    } else if (showLightbox) {
      showLightbox();
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group relative aspect-square cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 ease-in-out",
        )}
        onClick={handleClick}
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
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
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-300 ease-in-out",
              showDetail && "scale-110",
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
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
                  {ownerProfilePicture ? (
                    <Image
                      src={getProfilePictureUrl(ownerProfilePicture)!}
                      alt={ownerDisplayName || "User"}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
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
      <DeleteDogConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onDelete={confirmDelete}
        onCancel={cancelDelete}
        src={src}
        alt={alt}
      />
    </>
  );
}
