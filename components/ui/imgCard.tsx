import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

interface Props {
  id: string;
  src: string;
  alt: string;
  userId: string;
  deletePhoto: (id: string) => void;
  priority?: boolean;
}

export function ImgCard({
  id,
  src,
  alt,
  userId,
  deletePhoto,
  priority = false,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    deletePhoto(id);
    setShowConfirm(false);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  const isOwner = session?.user?.id === userId || session?.user?.id === "admin";

  return (
    <div className="group relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.02] hover:shadow-lg">
      {isOwner && (
        <button
          onClick={handleDelete}
          className="absolute right-2 top-2 z-10 cursor-pointer rounded-full bg-black/40 p-1 text-white opacity-60 transition-opacity hover:opacity-100"
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
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <BounceLoader color={"rgb(15, 220, 220)"} loading={true} size={25} />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover`}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
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
              className="cursor-pointer rounded-lg bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="cursor-pointer rounded-lg bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

