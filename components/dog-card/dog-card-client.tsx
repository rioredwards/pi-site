"use client";

import React from "react";
import {
  LightboxImageClient,
  type LightboxSlide,
} from "@/components/lightbox-image/index";
import { useGalleryContext } from "../gallery-context";

interface DogCardClientProps {
  children: React.ReactNode;
  id: string;
  slide: LightboxSlide;
  /** Gallery can be passed as props OR provided via GalleryContext */
  gallery?: LightboxSlide[];
  galleryIndex?: number;
  enableLightbox?: boolean;
}

export function DogCardClient({
  children,
  id,
  slide,
  gallery: galleryProp,
  galleryIndex: galleryIndexProp,
  enableLightbox = false,
}: DogCardClientProps) {
  const galleryContext = useGalleryContext();

  // Use props if provided, otherwise fall back to context
  const gallery = galleryProp ?? galleryContext?.slides;
  const galleryIndex = galleryIndexProp ?? galleryContext?.getIndex(id) ?? 0;

  return (
    <div className="absolute inset-0 transition-all duration-200 ease-in-out">
      {enableLightbox ? (
        <LightboxImageClient
          enableLightbox={true}
          slide={slide}
          gallery={gallery}
          galleryIndex={galleryIndex}
        >
          {children}
        </LightboxImageClient>
      ) : (
        children
      )}
    </div>
  );
}
