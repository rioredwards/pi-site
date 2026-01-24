"use client";

import Image, { ImageProps } from "next/image";
import { useLightbox } from "./lightbox";

interface ImageWithCaptionProps extends Omit<ImageProps, "alt"> {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
  enableLightbox?: boolean;
}

export function ImageWithCaption({
  src,
  alt,
  caption,
  width,
  height,
  className = "",
  enableLightbox = false,
  ...props
}: ImageWithCaptionProps) {
  const { openSingle } = useLightbox();

  const handleClick = () => {
    if (enableLightbox) {
      openSingle({
        src,
        alt,
        description: caption,
      });
    }
  };

  return (
    <figure className="my-6">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className}${enableLightbox ? " cursor-pointer" : ""}`}
        onClick={handleClick}
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
