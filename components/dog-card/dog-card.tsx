import { cn } from "@/lib/utils";
import { ImageOverlay } from "@/components/image-overlay/image-overlay";
import { type LightboxSlide } from "@/components/lightbox-image/index";
import { Card } from "../card";
import { DogCardClient } from "./dog-card-client";
import { DogCardOverlayContent } from "./dog-card-overlay-content";

export interface DogCardProps {
  id: string;
  src: string;
  alt: string;
  userId: string;
  ownerDisplayName?: string | null;
  ownerProfilePicture?: string | null;
  isOwner: boolean;
  priority?: boolean;
  showInfoPanel?: boolean;
  slide: LightboxSlide;
  gallery?: LightboxSlide[];
  galleryIndex?: number;
  enableLightbox?: boolean;
}

export function DogCard({
  id,
  src,
  alt,
  userId,
  ownerDisplayName,
  ownerProfilePicture,
  isOwner,
  priority = false,
  showInfoPanel = true,
  slide,
  gallery,
  galleryIndex,
  enableLightbox = false,
}: DogCardProps) {
  return (
    <Card
      className={cn(
        "group relative aspect-square overflow-hidden rounded-2xl transition-all duration-200 ease-in-out",
      )}
      data-photo-id={id}
    >
      <DogCardClient
        id={id}
        slide={slide}
        gallery={gallery}
        galleryIndex={galleryIndex}
        enableLightbox={enableLightbox}
      >
        <ImageOverlay
          src={src}
          alt={alt}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="absolute inset-0 rounded-2xl"
          overlayClassName="rounded-2xl"
          zoomOnHover={enableLightbox}
        >
          <DogCardOverlayContent
            id={id}
            isOwner={isOwner}
            userId={userId}
            ownerDisplayName={ownerDisplayName}
            ownerProfilePicture={ownerProfilePicture}
            showInfoPanel={showInfoPanel}
            slide={slide}
            gallery={gallery}
            galleryIndex={galleryIndex}
            enableLightbox={enableLightbox}
          />
        </ImageOverlay>
      </DogCardClient>
    </Card>
  );
}
