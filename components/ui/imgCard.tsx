import Image from "next/image";
import { useState } from "react";
import BounceLoader from "react-spinners/BounceLoader";

interface Props {
  src: string;
  alt: string;
}

export function ImgCard({ src, alt }: Props) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative aspect-square overflow-den rounded-lg w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <BounceLoader color={"rgb(15, 220, 220)"} loading={true} size={25} />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover`}
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        onLoadStart={() => setLoading(true)}
        onLoadingComplete={() => setLoading(false)}
      />
    </div>
  );
}
