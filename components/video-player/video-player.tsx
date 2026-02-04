"use client";

import { cn } from "@/lib/utils";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as React from "react";

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Video source URL */
  src: string;
  /** Poster image URL */
  poster?: string;
  /** Autoplay on load (will be muted for browser compatibility) */
  autoPlay?: boolean;
  /** Loop the video */
  loop?: boolean;
  /** Start muted */
  muted?: boolean;
  /** Show fullscreen button */
  showFullscreen?: boolean;
  /** Show volume/mute button */
  showVolumeToggle?: boolean;
  /** Show progress bar */
  showProgress?: boolean;
  /** Rounded corners variant */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  /** Callback when video ends */
  onEnded?: () => void;
  /** Callback when play state changes */
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const roundedVariants = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
};

export function VideoPlayer({
  src,
  poster,
  className,
  autoPlay = true,
  loop = true,
  muted: initialMuted = true,
  showFullscreen = true,
  showVolumeToggle = false,
  showProgress = true,
  rounded = "2xl",
  onEnded,
  onPlayStateChange,
  ...props
}: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(autoPlay);
  const [isMuted, setIsMuted] = React.useState(initialMuted);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [showControls, setShowControls] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);
  const hideControlsTimeout = React.useRef<NodeJS.Timeout>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    const newState = !isPlaying;
    setIsPlaying(newState);
    onPlayStateChange?.(newState);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (
        video &&
        "webkitEnterFullscreen" in video &&
        typeof (video as any).webkitEnterFullscreen === "function"
      ) {
        (video as any).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (
        video &&
        "webkitExitFullscreen" in video &&
        typeof (video as any).webkitExitFullscreen === "function"
      ) {
        (video as any).webkitExitFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const percent =
      (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(percent);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * videoRef.current.duration;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (!isHovering) {
        setShowControls(false);
      }
    }, 2500);
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // iOS Safari: fullscreen only works on the video element itself
    const video = videoRef.current;
    const handleWebkitBeginFullscreen = () => setIsFullscreen(true);
    const handleWebkitEndFullscreen = () => setIsFullscreen(false);
    video?.addEventListener("webkitbeginfullscreen", handleWebkitBeginFullscreen);
    video?.addEventListener("webkitendfullscreen", handleWebkitEndFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      video?.removeEventListener(
        "webkitbeginfullscreen",
        handleWebkitBeginFullscreen,
      );
      video?.removeEventListener(
        "webkitendfullscreen",
        handleWebkitEndFullscreen,
      );
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-neutral-900 shadow-lg",
        roundedVariants[rounded],
        "group cursor-pointer",
        className,
      )}
      {...props}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovering(true);
        setShowControls(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowControls(false);
      }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={initialMuted}
        loop={loop}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }}
        onPause={() => {
          setIsPlaying(false);
          onPlayStateChange?.(false);
        }}
        onEnded={onEnded}
        className="h-full w-full object-cover"
      />

      {/* Gradient overlay for controls visibility */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent",
          "transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Center play/pause indicator */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          "transition-opacity duration-300",
          !isPlaying ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="rounded-full bg-white/20 p-5 shadow-lg backdrop-blur-sm">
          <Play className="ml-1 h-8 w-8 fill-white text-white" />
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute right-0 bottom-0 left-0 p-4",
          "transition-all duration-300 ease-out",
          showControls
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        {showProgress && (
          <div
            className="group/progress relative mb-3 h-1 cursor-pointer rounded-full bg-white/20"
            onClick={handleProgressClick}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
            <div
              className={cn(
                "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-md",
                "scale-0 transition-all duration-150 group-hover/progress:scale-100",
              )}
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={cn(
                "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full",
                "bg-white/10 backdrop-blur-sm hover:bg-white/20",
                "transition-all duration-200 hover:scale-105 active:scale-95",
              )}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-white text-white" />
              ) : (
                <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
              )}
            </button>

            {showVolumeToggle && (
              <button
                onClick={toggleMute}
                className={cn(
                  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full",
                  "bg-white/10 backdrop-blur-sm hover:bg-white/20",
                  "transition-all duration-200 hover:scale-105 active:scale-95",
                )}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-white" />
                ) : (
                  <Volume2 className="h-5 w-5 text-white" />
                )}
              </button>
            )}
          </div>

          {showFullscreen && (
            <button
              onClick={toggleFullscreen}
              className={cn(
                "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full",
                "bg-white/10 backdrop-blur-sm hover:bg-white/20",
                "transition-all duration-200 hover:scale-105 active:scale-95",
              )}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5 text-white" />
              ) : (
                <Maximize className="h-5 w-5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
