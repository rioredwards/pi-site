import { cn } from "@/lib/utils";
import { ImageOverlay } from "@/components/image-overlay/image-overlay";
import { LightboxImageClient } from "@/components/lightbox-image/lightbox-image-client";
import { LightboxTrigger } from "@/components/lightbox-image/lightbox-trigger";
import type { LightboxSlide } from "@/components/lightbox-image/types";
import { Maximize } from "lucide-react";
import { StaticImageData } from "next/image";

export interface LightboxImageProps {
  src: string | StaticImageData;
  alt: string;
  caption?: React.ReactNode;
  enableLightbox?: boolean;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  maximizeIcon?: React.ReactNode;
}

export function LightboxImage({
  src,
  alt,
  caption,
  enableLightbox = true,
  gallery,
  galleryIndex = 0,
  priority = false,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px",
  maximizeIcon,
}: LightboxImageProps) {
  const isStaticImage = typeof src === "object";

  const slide: LightboxSlide = isStaticImage
    ? { ...src, alt, description: caption }
    : { src, alt, description: caption };

  return (
    <figure className="my-6 size-full">
      <LightboxImageClient
        enableLightbox={enableLightbox}
        slide={slide}
        gallery={gallery}
        galleryIndex={galleryIndex}
      >
        <ImageOverlay
          src={src}
          alt={alt}
          sizes={sizes}
          priority={priority}
          className={cn("size-full", className)}
          overlayClassName="rounded-2xl size-full"
          zoomOnHover={enableLightbox}
        >
          {enableLightbox && (
            <LightboxTrigger
              {...(gallery && gallery.length > 0
                ? { slides: gallery, index: galleryIndex }
                : { slide })}
              aria-label="View fullscreen"
            >
              {maximizeIcon || <DefaultMaximizeIcon />}
            </LightboxTrigger>
          )}
        </ImageOverlay>
      </LightboxImageClient>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function DefaultMaximizeIcon() {
  return (
    <div className="absolute top-4 right-4 z-20">
      <div
        className={cn(
          "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full",
          "bg-white/10 backdrop-blur-sm hover:bg-white/20",
          "transition-all duration-200 hover:scale-105 active:scale-95",
        )}
      >
        <Maximize className="h-5 w-5 fill-white text-white" />
      </div>
    </div>
  );
}
