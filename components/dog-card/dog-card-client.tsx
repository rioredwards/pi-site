"use client";

import React from "react";
import {
  LightboxImageClient,
  type LightboxSlide,
} from "@/components/lightbox-image/index";

interface DogCardClientProps {
  children: React.ReactNode;
  slide: LightboxSlide;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
  enableLightbox?: boolean;
}

export function DogCardClient({
  children,
  slide,
  gallery,
  galleryIndex = 0,
  enableLightbox = false,
}: DogCardClientProps) {
  // Note: Loading state removed since server-rendered images don't need it
  // The images are already in the HTML and start loading immediately

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
