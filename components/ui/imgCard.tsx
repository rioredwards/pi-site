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

export function ImgCard({ id, src, alt, userId, deletePhoto, priority = false }: Props) {
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
    <div className="relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.02] hover:shadow-lg group">
      {isOwner && (
        <button
          onClick={handleDelete}
          className="absolute z-10 top-2 right-2 p-1 text-white bg-gray-400 rounded-full opacity-50 hidden group-hover:block group-focus-within:block"
          tabIndex={-1}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
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
          <div className="bg-white bg-opacity-75 p-4 rounded-lg shadow-lg">
            <p>Are you sure you want to delete this dog?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg">
                Yes
              </button>
              <button onClick={cancelDelete} className="px-4 py-2 bg-gray-300 rounded-lg">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
