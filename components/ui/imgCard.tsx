import Image from 'next/image';

interface Props {
  id: string;
  src: string;
  alt: string;
  deletePhoto: (id: string) => void;
}

export function ImgCard({ id, src, alt, deletePhoto }: Props) {
  console.log("ImgCard: ", id, src, alt);

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.02] hover:shadow-lg"
    >
      <button
        onClick={() => {
          console.log("Delete photo: ", id);
          deletePhoto(id)
        }}
        className="absolute z-10 top-2 right-2 p-1 text-white bg-red-500 rounded-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
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
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
    </div>
  );
}
