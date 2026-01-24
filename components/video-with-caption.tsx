"use client";

import { Pause, Play } from "lucide-react";
import React, { useRef, useState } from "react";

interface VideoWithCaptionProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  caption?: string;
  className?: string;
}

export function VideoWithCaption({
  src,
  caption,
  className = "",
  ...props
}: VideoWithCaptionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

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

  return (
    <figure className="my-6">
      <div
        className="relative cursor-pointer border-2 border-transparent hover:border-primary rounded-lg"
        onClick={handlePlayPause}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          className={className}
          playsInline
          muted
          loop
          preload="auto"
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          {...props}
        />
        <div className="absolute inset-0 pointer-events-none">
          {!isPlaying && (
            <div className="bg-black/20 hover:bg-black/30 transition-colors rounded-lg absolute inset-0" />
          )}
          <div
            className={`bg-white/90 dark:bg-black/90 rounded-full shadow-lg transition-all duration-300 ease-in-out absolute ${!isPlaying
                ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4"
                : showControls
                  ? "top-[calc(100%-12px)] left-3 -translate-y-full p-2"
                  : "top-[calc(100%-12px)] left-3 -translate-y-full p-2 opacity-0"
              }`}
          >
            {!isPlaying ? (
              <Play className="w-8 h-8 text-foreground fill-foreground transition-all duration-300 ease-in-out" />
            ) : (
              <Pause className="w-4 h-4 text-foreground fill-foreground transition-all duration-300 ease-in-out" />
            )}
          </div>
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
