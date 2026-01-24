"use client";

// import { getProfilePictureUrl } from "@/app/lib/utils";
// import { Trash2, UserIcon } from "@hugeicons/core-free-icons";
// import { HugeiconsIcon } from "@hugeicons/react";
import { useSession } from "next-auth/react";
// import Image from "next/image";
import { Trash2, User02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import { cn, getProfilePictureUrl } from "../../app/lib/utils";
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
  onImageClick?: () => void;
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
  onImageClick,
}: DogCardProps) {
  const { data: session } = useSession();
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOwner = session?.user?.id === userId || session?.user?.id === "admin";


  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    deletePhoto(id);
    setShowConfirm(false);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };


  return (
    <>
      <Card className={cn(
        "group transition-all duration-200 ease-in-out relative aspect-square overflow-hidden rounded-2xl cursor-pointer",
        // showDetail && "border-2 border-blue-400"
      )}
        onClick={() => onImageClick ? onImageClick() : setShowDetail((prev) => !prev)}
        onMouseEnter={() => setShowDetail(true)}
        onMouseLeave={() => setShowDetail(false)}
      >
        <div className={cn(
          "absolute transition-all duration-200 ease-in-out inset-0",
          //  showDetail && "inset-px"
        )}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <BounceLoader color={"oklch(0.75 0.15 55)"} loading={true} size={25} />
            </div>
          )}
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-300 ease-in-out",
              //  showDetail && "blur-in-lg brightness-50",
              showDetail && "scale-110"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoadStart={() => setLoading(true)}
            onLoad={() => setLoading(false)}
          />
          {/* Info panel overlay */}
          <div className={cn("absolute inset-0 bg-foreground/0 transition-colors duration-300 flex items-center justify-center",
            showDetail && "bg-foreground/40"
          )}>
            {/* Delete button - top right */}
            {isOwner && (
              <button
                onClick={handleDelete}
                className={cn("invisible pointer-coarse:bg-destructive opacity-0 backdrop-blur-sm bg-background/70 group/delete absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-foreground shadow-md transition-all duration-200 ease-in-out hover:bg-destructive hover:text-destructive-foreground",
                  showDetail && "opacity-100 visible"
                )}
                aria-label="Delete photo"
              >
                <HugeiconsIcon icon={Trash2} size={20} className="text-foreground group-hover/delete:text-destructive-foreground transition-colors" />
              </button>
            )}
            {/* Info panel - bottom overlay */}
            <div className={cn("absolute invisible opacity-0 group-hover:bottom-0 -bottom-20 trasition-all duration-200 ease-in-out left-0 right-0 z-30 flex items-center gap-3 rounded-t-2xl bg-background/70 px-4 py-3 shadow-md backdrop-blur-sm",
              showDetail && "bottom-0 opacity-100 visible"
            )}>
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
                  <HugeiconsIcon icon={User02Icon} size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Uploaded by</p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {ownerDisplayName || "Anonymous"}
                </p>
              </div>
            </div>
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



