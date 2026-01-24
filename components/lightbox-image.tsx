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
          "relative overflow-hidden rounded-2xl cursor-pointer",
          aspectClasses[aspectRatio],
          containerClassName
        )}
        onClick={handleClick}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width ?? undefined}
          height={fill ? undefined : height ?? undefined}
          fill={fill}
          placeholder={typeof src === "object" ? "blur" : undefined}
          priority={priority}
          className={cn(
            "block object-cover my-0! transition-transform duration-300 ease-in-out rounded-2xl",
            shouldShowOverlay && "scale-105",
            className
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
        />
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-foreground/0 transition-colors duration-300 rounded-2xl",
            shouldShowOverlay && "bg-foreground/20"
          )}
        >
          {/* Fullscreen button - top right */}
          {enableLightbox && (
            <button
              onClick={handleFullscreen}
              className={cn(
                "invisible opacity-0 backdrop-blur-sm bg-background/70 absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-foreground shadow-md transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary-foreground",
                shouldShowOverlay && "opacity-100 visible"
              )}
              aria-label="View fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
