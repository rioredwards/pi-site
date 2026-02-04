"use client";

import { ImageOff, RefreshCw } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";
import {
  isImageFitCover,
  isImageSlide,
  useLightboxProps,
  useLightboxState,
  type RenderSlideProps,
  type SlideImage,
} from "yet-another-react-lightbox";

type NextJsSlide = SlideImage & {
  src: string | StaticImageData;
  alt?: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

function isNextJsImage(slide: RenderSlideProps["slide"]): slide is NextJsSlide {
  return (
    isImageSlide(slide) &&
    typeof slide.width === "number" &&
    typeof slide.height === "number"
  );
}

export function NextJsImageSlide({ slide, offset, rect }: RenderSlideProps) {
  const {
    on: { click },
    carousel: { imageFit },
  } = useLightboxProps();

  const { currentIndex } = useLightboxState();
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const cover = isImageSlide(slide) && isImageFitCover(slide, imageFit);

  if (!isNextJsImage(slide)) return undefined;

  const width = !cover
    ? Math.round(
        Math.min(rect.width, (rect.height / slide.height) * slide.width),
      )
    : rect.width;

  const height = !cover
    ? Math.round(
        Math.min(rect.height, (rect.width / slide.width) * slide.height),
      )
    : rect.height;

  if (error) {
    return (
      <div
        style={{ width, height }}
        className="flex flex-col items-center justify-center gap-4 text-white/70"
      >
        <ImageOff className="h-12 w-12" />
        <span>Image failed to load</span>
        <button
          onClick={() => {
            setRetryKey((k) => k + 1);
            setError(false);
          }}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width, height }}>
      <Image
        key={retryKey}
        fill
        alt={slide.alt || ""}
        src={slide}
        loading="eager"
        draggable={false}
        placeholder={slide.blurDataURL ? "blur" : undefined}
        style={{
          objectFit: cover ? "cover" : "contain",
          cursor: click ? "pointer" : undefined,
        }}
        sizes="100vw"
        onClick={
          offset === 0 ? () => click?.({ index: currentIndex }) : undefined
        }
        onLoad={() => setError(false)}
        onError={() => setError(true)}
      />
    </div>
  );
}
