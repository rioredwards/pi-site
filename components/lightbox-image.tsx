"use client";

import { cn } from "@/app/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Maximize2 } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";
import { LightboxSlide, useLightbox } from "./lightbox";

interface LightboxImageProps {
  src: string | StaticImageData;
  alt: string;
  caption?: React.ReactNode;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "square" | "video" | "auto";
  enableLightbox?: boolean;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
}

export function LightboxImage({
  src,
  alt,
  caption,
  width,
  height,
  fill = false,
  priority = false,
  className,
  containerClassName,
  aspectRatio = "auto",
  enableLightbox = false,
  gallery,
  galleryIndex = 0,
}: LightboxImageProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const isMobile = useIsMobile();
  const { openSingle, openGallery } = useLightbox();

  const shouldShowOverlay = showOverlay;

  const openLightbox = () => {
    if (gallery && gallery.length > 0) {
      openGallery(gallery, galleryIndex);
    } else {
      // Spread StaticImageData to get src, width, height, blurDataURL at top level
      const imageData = typeof src === "object" ? src : { src, width, height };
      openSingle({
        ...imageData,
        alt,
        description: caption,
      });
    }
  };

  const handleClick = () => {
    if (isMobile) {
      // On mobile, toggle overlay
      setShowOverlay((prev) => !prev);
    } else if (enableLightbox) {
      // On desktop with lightbox enabled, open lightbox directly
      openLightbox();
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    openLightbox();
  };

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  return (
    <figure className={cn("my-6", !fill && "w-fit")}>
      <div
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl",
          aspectClasses[aspectRatio],
          containerClassName,
        )}
        onClick={handleClick}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : (width ?? undefined)}
          height={fill ? undefined : (height ?? undefined)}
          fill={fill}
          placeholder={typeof src === "object" ? "blur" : undefined}
          priority={priority}
          className={cn(
            "my-0! block rounded-2xl object-cover transition-transform duration-300 ease-in-out",
            shouldShowOverlay && "scale-105",
            className,
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
        />
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl bg-foreground/0 transition-colors duration-300",
            shouldShowOverlay && "bg-foreground/20",
          )}
        >
          {/* Fullscreen button - top right */}
          {enableLightbox && (
            <button
              onClick={handleFullscreen}
              className={cn(
                "invisible absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary-foreground",
                shouldShowOverlay && "visible opacity-100",
              )}
              aria-label="View fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
