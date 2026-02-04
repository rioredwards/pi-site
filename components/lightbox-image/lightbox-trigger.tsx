"use client";

import { useLightbox } from "@/components/lightbox-image/lightbox-provider";
import { Slot } from "@radix-ui/react-slot";
import React from "react";
import type { Slide } from "yet-another-react-lightbox";

type SingleSlideProps = {
  slide: Slide;
  slides?: never;
  index?: never;
};

type GalleryProps = {
  slide?: never;
  slides: Slide[];
  index: number;
};

type LightboxTriggerProps = (SingleSlideProps | GalleryProps) &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
    asChild?: boolean;
  };

const LightboxTrigger = React.forwardRef<
  HTMLButtonElement,
  LightboxTriggerProps
>(({ slide, slides, index, asChild, ...rest }, ref) => {
  const { openSingle, openGallery } = useLightbox();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (slides) {
      openGallery(slides, index);
    } else {
      openSingle(slide);
    }
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      onClick={handleClick}
      aria-label="View fullscreen"
      {...rest}
    />
  );
});
LightboxTrigger.displayName = "LightboxTrigger";

export { LightboxTrigger };
