"use client";

import Image, { StaticImageData } from "next/image";
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

  const cover = isImageSlide(slide) && isImageFitCover(slide, imageFit);

  if (!isNextJsImage(slide)) return undefined;

  const width = !cover
    ? Math.round(
      Math.min(rect.width, (rect.height / slide.height) * slide.width)
    )
    : rect.width;

  const height = !cover
    ? Math.round(
      Math.min(rect.height, (rect.width / slide.width) * slide.height)
    )
    : rect.height;

  return (
    <div style={{ position: "relative", width, height }}>
      <Image
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
        sizes={`${Math.ceil((width / (typeof window !== "undefined" ? window.innerWidth : 1920)) * 100)}vw`}
        onClick={
          offset === 0 ? () => click?.({ index: currentIndex }) : undefined
        }
      />
    </div>
  );
}



<img
  alt="A Raspberry Pi"
  loading="lazy"
  width="1280"
  height="1029"
  decoding="async"
  data-nimg="1"
  class="block object-cover my-0! transition-transform duration-300 ease-in-out rounded-2xl"
  style="color:transparent"
  srcset="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FMy-Pi.95b696c4.jpeg&amp;w=1920&amp;q=75 1x, /_next/image?url=%2F_next%2Fstatic%2Fmedia%2FMy-Pi.95b696c4.jpeg&amp;w=3840&amp;q=75 2x"
  src="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FMy-Pi.95b696c4.jpeg&amp;w=3840&amp;q=75"></img>
