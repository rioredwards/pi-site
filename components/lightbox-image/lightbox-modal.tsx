"use client";

import { NextJsImageSlide } from "@/components/lightbox-image/next-image-slide";
import type { LightboxSlide } from "@/components/lightbox-image/types";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/plugins/captions.css";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";

interface LightboxModalProps {
  open: boolean;
  slides: LightboxSlide[];
  index: number;
  onClose: () => void;
}

export function LightboxModal({
  open,
  slides,
  index,
  onClose,
}: LightboxModalProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      slides={slides}
      index={index}
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
  );
}
