"use client";

import { createContext, useContext } from "react";
import { type LightboxSlide } from "@/components/lightbox-image/index";

interface GalleryContextValue {
  slides: LightboxSlide[];
  getIndex: (photoId: string) => number;
}

export const GalleryContext = createContext<GalleryContextValue | null>(null);

export function useGalleryContext() {
  return useContext(GalleryContext);
}
