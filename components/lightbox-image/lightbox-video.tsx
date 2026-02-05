"use client";

import { cn, devLog } from "@/lib/utils";
import type { LightboxSlide } from "@/components/lightbox-image/types";
import { useLightbox } from "@/components/lightbox-image/lightbox-provider";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Maximize2, Pause, Play } from "lucide-react";
import React, { useRef, useState } from "react";

interface LightboxVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  poster?: string;
  caption?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "square" | "video" | "auto";
  enableLightbox?: boolean;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
}

export function LightboxVideo({
  src,
  poster,
  caption,
  className,
  containerClassName,
  aspectRatio = "auto",
  enableLightbox = false,
  gallery,
  galleryIndex = 0,
  ...props
}: LightboxVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const isMobile = useIsMobile();
  const { openSingle, openGallery } = useLightbox();

  const shouldShowOverlay = showOverlay || isMobile;

  const handlePlayPause = () => {
    devLog("handlePlayPause", videoRef.current, isMobile);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handlePlayPause();
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (gallery && gallery.length > 0) {
      openGallery(gallery, galleryIndex);
    } else {
      openSingle({
        type: "video",
        sources: [{ src, type: "video/mp4" }],
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
    <figure className="my-6">
      <div
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-2xl",
          aspectClasses[aspectRatio],
          containerClassName,
        )}
        onClick={handlePlayPause}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={cn(
            "my-0! block rounded-2xl object-cover transition-transform duration-300 ease-in-out",
            shouldShowOverlay && !isPlaying && "scale-105",
            className,
          )}
          playsInline
          muted
          loop
          preload="auto"
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          {...props}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-2xl bg-foreground/0 transition-colors duration-300",
            shouldShowOverlay && !isPlaying && "bg-foreground/20",
          )}
        >
          <div
            className={cn(
              "absolute rounded-full bg-background/70 shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out",
              !isPlaying
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4"
                : shouldShowOverlay
                  ? "top-[calc(100%-12px)] left-3 -translate-y-full p-2"
                  : "top-[calc(100%-12px)] left-3 -translate-y-full p-2 opacity-0",
            )}
          >
            {!isPlaying ? (
              <Play
                className={cn(
                  "h-8 w-8 transition-all duration-300 ease-in-out",
                  shouldShowOverlay
                    ? "fill-primary text-primary"
                    : "fill-transparent text-foreground/40",
                )}
              />
            ) : (
              <Pause
                className={cn(
                  "h-4 w-4 transition-all duration-300 ease-in-out",
                  shouldShowOverlay
                    ? "fill-primary text-primary"
                    : "fill-transparent text-foreground/40",
                )}
              />
            )}
          </div>
        </div>
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
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
