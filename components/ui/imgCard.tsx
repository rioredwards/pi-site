import Image from 'next/image';

interface Props {
  id: number;
  src: string;
  alt: string;
}

export function ImgCard({ id, src, alt }: Props) {
  console.log("ImgCard: ", id, src, alt);

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-lg transition-transform hover:scale-[1.02] hover:shadow-lg"
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        priority={id <= 4} // Load first 4 images immediately
      />
    </div>
  );
}
