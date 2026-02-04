"use client";

import { usePointerType } from "@/components/image-overlay/use-pointer-type";
import { useLightbox } from "@/components/lightbox-image/lightbox-provider";
import type { LightboxSlide } from "@/components/lightbox-image/types";

interface LightboxImageClientProps {
  enableLightbox: boolean;
  slide: LightboxSlide;
  gallery?: LightboxSlide[];
  galleryIndex: number;
  children: React.ReactNode;
}

export function LightboxImageClient({
  enableLightbox,
  slide,
  gallery,
  galleryIndex,
  children,
}: LightboxImageClientProps) {
  const pointerType = usePointerType();
  const { openSingle, openGallery } = useLightbox();

  const handleClick = () => {
    if (pointerType === "fine" && enableLightbox) {
      if (gallery && gallery.length > 0) {
        openGallery(gallery, galleryIndex);
      } else {
        openSingle(slide);
      }
    }
  };

  return <div onClick={handleClick}>{children}</div>;
}
