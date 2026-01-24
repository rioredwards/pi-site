"use client";

import { cn } from "@/app/lib/utils";
import { Maximize2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { LightboxSlide, useLightbox } from "./lightbox";

interface LightboxImageProps {
  src: string;
  alt: string;
  caption?: string;
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
  const { openSingle, openGallery } = useLightbox();

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gallery && gallery.length > 0) {
      openGallery(gallery, galleryIndex);
    } else {
      openSingle({
        src,
        alt,
        description: caption,
      });
    }
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
        onClick={() => setShowOverlay((prev) => !prev)}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <Image
          src={src}
          alt={alt}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          fill={fill}
          priority={priority}
          className={cn(
            "block object-cover my-0! transition-transform duration-300 ease-in-out rounded-2xl",
            showOverlay && "scale-105",
            className
          )}
          sizes={fill ? "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" : undefined}
        />
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-foreground/0 transition-colors duration-300 rounded-2xl",
            showOverlay && "bg-foreground/40"
          )}
        >
          {/* Fullscreen button - top right */}
          {enableLightbox && (
            <button
              onClick={handleFullscreen}
              className={cn(
                "invisible opacity-0 backdrop-blur-sm bg-background/70 absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-foreground shadow-md transition-all duration-200 ease-in-out hover:bg-primary hover:text-primary-foreground",
                showOverlay && "opacity-100 visible"
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
