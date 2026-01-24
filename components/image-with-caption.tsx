import Image, { ImageProps } from "next/image";

interface ImageWithCaptionProps extends Omit<ImageProps, "alt"> {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function ImageWithCaption({
  src,
  alt,
  caption,
  width,
  height,
  className = "",
  ...props
}: ImageWithCaptionProps) {
  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        {...props}
      />
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
