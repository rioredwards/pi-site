"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import type { LightboxContextValue, LightboxSlide } from "./types";

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
  const [slides, setSlides] = useState<LightboxSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openSingle = useCallback((slide: LightboxSlide) => {
    setSlides([slide]);
    setCurrentIndex(0);
    setIsOpen(true);
  }, []);

  const openGallery = useCallback((newSlides: LightboxSlide[], index: number) => {
    setSlides(newSlides);
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <LightboxContext.Provider value={{ openSingle, openGallery, close }}>
      {children}
      <Lightbox
        open={isOpen}
        close={close}
        slides={slides}
        index={currentIndex}
        plugins={[Video, Captions]}
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
