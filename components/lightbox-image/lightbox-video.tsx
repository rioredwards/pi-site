import { cn } from "@/lib/utils";
import { VideoPlayer } from "@/components/video-player/video-player";
import { LightboxTrigger } from "@/components/lightbox-image/lightbox-trigger";
import type { LightboxSlide } from "@/components/lightbox-image/types";
import { Maximize } from "lucide-react";

interface LightboxVideoProps {
  src: string;
  poster?: string;
  caption?: React.ReactNode;
  enableLightbox?: boolean;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showProgress?: boolean;
  showVolumeToggle?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
}

export function LightboxVideo({
  src,
  poster,
  caption,
  enableLightbox = true,
  gallery,
  galleryIndex = 0,
  className,
  autoPlay = true,
  loop = true,
  muted = true,
  showProgress = true,
  showVolumeToggle = false,
  rounded = "2xl",
}: LightboxVideoProps) {
  const slide: LightboxSlide = {
    type: "video",
    sources: [{ src, type: "video/mp4" }],
    description: caption,
  };

  return (
    <figure className="my-6 size-full">
      <div className="relative">
        <VideoPlayer
          src={src}
          poster={poster}
          className={cn("size-full", className)}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          showProgress={showProgress}
          showVolumeToggle={showVolumeToggle}
          showFullscreen={!enableLightbox}
          rounded={rounded}
        />
        {enableLightbox && (
          <LightboxTrigger
            {...(gallery && gallery.length > 0
              ? { slides: gallery, index: galleryIndex }
              : { slide })}
            aria-label="View fullscreen"
          >
            <DefaultMaximizeIcon />
          </LightboxTrigger>
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
