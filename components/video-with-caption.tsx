"use client";

import { cn } from "@/app/lib/utils";
import { Maximize2, Pause, Play } from "lucide-react";
import React, { useRef, useState } from "react";
import { LightboxSlide, useLightbox } from "./lightbox";

interface VideoWithCaptionProps
  extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  caption?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "square" | "video" | "auto";
  enableLightbox?: boolean;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
}

export function VideoWithCaption({
  src,
  caption,
  className,
  containerClassName,
  aspectRatio = "auto",
  enableLightbox = false,
  gallery,
  galleryIndex = 0,
  ...props
}: VideoWithCaptionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const { openSingle, openGallery } = useLightbox();

  const handlePlayPause = () => {
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
          "relative overflow-hidden rounded-2xl cursor-pointer",
          aspectClasses[aspectRatio],
          containerClassName
        )}
        onClick={handlePlayPause}
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
      >
        <video
          ref={videoRef}
          src={src}
          className={cn(
            "block object-cover my-0! transition-transform duration-300 ease-in-out rounded-2xl",
            showOverlay && !isPlaying && "scale-110",
            className
          )}
          playsInline
          muted
          loop
          preload="auto"
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          {...props}
        />
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-foreground/0 transition-colors duration-300 rounded-2xl pointer-events-none",
            showOverlay && !isPlaying && "bg-foreground/40"
          )}
        >
          {/* Play/Pause button - animated position */}
          <div
            className={cn(
              "backdrop-blur-sm bg-background/70 rounded-full shadow-md transition-all duration-300 ease-in-out absolute",
              !isPlaying
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4"
                : showOverlay
                  ? "top-[calc(100%-12px)] left-3 -translate-y-full p-2"
                  : "top-[calc(100%-12px)] left-3 -translate-y-full p-2 opacity-0"
            )}
          >
            {!isPlaying ? (
              <Play className="w-8 h-8 text-foreground fill-foreground transition-all duration-300 ease-in-out" />
            ) : (
              <Pause className="w-4 h-4 text-foreground fill-foreground transition-all duration-300 ease-in-out" />
            )}
          </div>
        </div>
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
      {caption && (
        <figcaption className="mt-2 text-sm text-muted-foreground text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
