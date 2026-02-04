"use client";

import { NextJsImageSlide } from "@/components/lightbox-image/next-image-slide";
import type { LightboxContextValue } from "@/components/lightbox-image/types";
import { createContext, useCallback, useContext, useState } from "react";
import Lightbox, { type Slide } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function useLightbox(): LightboxContextValue {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error("useLightbox must be used within a LightboxProvider");
  }
  return context;
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openSingle = useCallback((slide: Slide) => {
    setSlides([slide]);
    setCurrentIndex(0);
    setIsOpen(true);
  }, []);

  const openGallery = useCallback((newSlides: Slide[], index: number) => {
    setSlides(newSlides);
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <LightboxContext.Provider
      value={{ openSingle, openGallery, close, isOpen }}
    >
      {children}
      <Lightbox
        open={isOpen}
        close={close}
        slides={slides}
        index={currentIndex}
        plugins={[Video, Captions]}
        render={{
          slide: NextJsImageSlide,
        }}
        video={{
          controls: true,
          autoPlay: true,
        }}
        carousel={{
          finite: slides.length === 1,
        }}
        controller={{
          closeOnBackdropClick: true,
        }}
      />
    </LightboxContext.Provider>
  );
}
