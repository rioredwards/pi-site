"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { getProfilePictureUrl } from "@/app/lib/utils";
import { FlipCard } from "./flip-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface DogFlipCardProps {
  id: string;
  src: string;
  alt: string;
  userId: string;
  ownerDisplayName?: string | null;
  ownerProfilePicture?: string | null;
  deletePhoto: (id: string) => void;
  priority?: boolean;
}

export function DogFlipCard({
  id,
  src,
  alt,
  userId,
  ownerDisplayName,
  ownerProfilePicture,
  deletePhoto,
  priority = false,
}: DogFlipCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { data: session } = useSession();

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

  // Shared image component used on both sides
  const dogImage = (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
    />
  );

  return (
    <>
      <FlipCard
        className="aspect-square"
        cardClassName="shadow-md rounded-3xl"
        frontClassName="rounded-3xl overflow-hidden"
        backClassName="rounded-3xl overflow-hidden"
        cardTitle={alt}
        frontContent={
          <div className="relative h-full w-full">
            {dogImage}
          </div>
        }
        backContent={
          <div className="relative h-full w-full">
            {dogImage}

            {/* Delete button - top right */}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md transition-colors hover:bg-background"
                aria-label="Delete photo"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}

            {/* Info panel - bottom overlay */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-3 rounded-2xl bg-background/90 px-4 py-3 shadow-md backdrop-blur-sm">
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
                  <User className="h-5 w-5 text-muted-foreground" />
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
        }
      />

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete photo?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 90vw, 400px"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={cancelDelete}
              className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
