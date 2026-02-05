import React from "react";
import type { LightboxSlide } from "@/components/lightbox-image/types";
import { LightboxImage } from "@/components/lightbox-image/lightbox-image";
import type { LightboxImageProps } from "@/components/lightbox-image/lightbox-image";
import { LightboxVideo } from "@/components/lightbox-image/lightbox-video";

interface LightboxGalleryProps {
  children: React.ReactNode;
}

function collectSlides(node: React.ReactNode): LightboxSlide[] {
  const slides: LightboxSlide[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === LightboxImage) {
      const props = child.props as LightboxImageProps;
      const slide: LightboxSlide =
        typeof props.src === "string"
          ? {
              src: props.src,
              alt: props.alt,
              width: 1000,
              height: 1000,
              description: props.caption,
            }
          : { ...props.src, alt: props.alt, description: props.caption };
      slides.push(slide);
    }
    if (child.type === LightboxVideo) {
      const props = child.props as { src: string; caption?: string };
      slides.push({
        type: "video",
        sources: [{ src: props.src, type: "video/mp4" }],
        description: props.caption,
      } as LightboxSlide);
    }
    const props = child.props as Record<string, unknown>;
    if (props.children) {
      slides.push(...collectSlides(props.children as React.ReactNode));
    }
  });
  return slides;
}

function injectGallery(
  node: React.ReactNode,
  slides: LightboxSlide[],
  counter: { index: number },
): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child;
    const props = child.props as Record<string, unknown>;

    if (child.type === LightboxImage) {
      const idx = counter.index++;
      return React.cloneElement(
        child as React.ReactElement<Record<string, unknown>>,
        {
          enableLightbox: true,
          gallery: slides,
          galleryIndex: idx,
        },
      );
    }

    if (child.type === LightboxVideo) {
      const idx = counter.index++;
      return React.cloneElement(
        child as React.ReactElement<Record<string, unknown>>,
        {
          enableLightbox: true,
          gallery: slides,
          galleryIndex: idx,
        },
      );
    }

    if (props.children) {
      return React.cloneElement(
        child as React.ReactElement<Record<string, unknown>>,
        {},
        injectGallery(props.children as React.ReactNode, slides, counter),
      );
    }

    return child;
  });
}

export function LightboxGallery({ children }: LightboxGalleryProps) {
  const slides = collectSlides(children);
  return <>{injectGallery(children, slides, { index: 0 })}</>;
}
