"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
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
  deletePhoto: (id: string) => void;
  priority?: boolean;
}

export function DogFlipCard({
  id,
  src,
  alt,
  userId,
  ownerDisplayName,
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

  return (
    <>
      <FlipCard
        image={src}
        imageAlt={alt}
        imagePriority={priority}
        minHeight="min-h-0"
        className="aspect-square"
        cardClassName="shadow-md"
        frontClassName="bg-muted"
        backClassName="bg-card border border-border p-3"
        contentWrapperClassName="h-full w-full"
        transformScale={1}
        transformZ={40}
        frontGradient={false}
        frontContent={
          isOwner && (
            <button
              onClick={handleDelete}
              className="absolute right-3 top-3 z-20 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
              aria-label="Delete photo"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )
        }
        backContent={
          <div className="flex h-full w-full flex-col">
            {/* Smaller dog photo */}
            <div className="relative flex-1 overflow-hidden rounded-2xl">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            {/* Info panel */}
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/80 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
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
