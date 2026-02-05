"use client";

import type {
  LightboxContextValue,
  LightboxSlide,
} from "@/components/lightbox-image/types";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useState } from "react";

const LightboxModal = dynamic(
  () =>
    import("@/components/lightbox-image/lightbox-modal").then(
      (module) => module.LightboxModal,
    ),
  { ssr: false },
);

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
    <LightboxContext.Provider
      value={{ openSingle, openGallery, close, isOpen }}
    >
      {children}
      {isOpen && (
        <LightboxModal
          open={isOpen}
          slides={slides}
          index={currentIndex}
          onClose={close}
        />
      )}
    </LightboxContext.Provider>
  );
}
