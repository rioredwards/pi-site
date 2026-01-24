import type { Slide } from "yet-another-react-lightbox";

export interface LightboxContextValue {
  openSingle: (slide: Slide) => void;
  openGallery: (slides: Slide[], index: number) => void;
  close: () => void;
}

// Re-export Slide type for convenience
export type { Slide as LightboxSlide } from "yet-another-react-lightbox";
