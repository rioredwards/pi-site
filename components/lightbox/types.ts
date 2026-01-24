export interface ImageSlide {
  type?: "image";
  src: string;
  alt?: string;
  title?: string;
  description?: string;
}

export interface VideoSlide {
  type: "video";
  sources: { src: string; type: string }[];
  poster?: string;
  title?: string;
  description?: string;
}

export type LightboxSlide = ImageSlide | VideoSlide;

export interface LightboxContextValue {
  openSingle: (slide: LightboxSlide) => void;
  openGallery: (slides: LightboxSlide[], index: number) => void;
  close: () => void;
}
