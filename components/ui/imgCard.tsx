import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";

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
          className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1 text-white opacity-60 transition-opacity hover:opacity-100"
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
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white bg-opacity-75 p-4 shadow-lg">
            <p>Are you sure you want to delete this dog?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-white"
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className="rounded-lg bg-gray-300 px-4 py-2"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

