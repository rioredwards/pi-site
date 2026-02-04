import { cn } from "@/lib/utils";
import {
  ImageOverlayClient,
  type ImageOverlayClientProps,
} from "@/components/image-overlay/image-overlay-client";
import Image, { StaticImageData } from "next/image";

export interface ImageOverlayProps extends ImageOverlayClientProps {
  src: string | StaticImageData;
  alt: string;
  sizes?: string;
  priority?: boolean;
  overlayClassName?: string;
  zoomOnHover?: boolean;
}

function ImageOverlay({
  src,
  alt,
  sizes,
  priority = false,
  className,
  overlayClassName,
  zoomOnHover = true,
  children,
  ...clientProps
}: ImageOverlayProps) {
  const isStaticImage = typeof src === "object";
  const staticAspectRatio = isStaticImage
    ? `${src.width} / ${src.height}`
    : undefined;

  return (
    <ImageOverlayClient
      className={cn(
        "group/overlay relative aspect-square cursor-pointer overflow-hidden rounded-2xl shadow-lg",
        className,
      )}
      style={{
        ...(staticAspectRatio ? { aspectRatio: staticAspectRatio } : {}),
        ...clientProps.style,
      }}
      {...clientProps}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        placeholder={isStaticImage && src.blurDataURL ? "blur" : undefined}
        className={cn(
          "object-cover transition-transform duration-500 ease-out",
          zoomOnHover &&
            "group-active/overlay:scale-[100%]! group-data-[active=true]:scale-[102%]",
        )}
      />

      {children && (
        <div
          className={cn(
            "absolute inset-0 bg-transparent transition-colors duration-300 group-data-[active=true]:bg-black/30",
            overlayClassName,
          )}
        >
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-data-[active=true]:pointer-events-auto group-data-[active=true]:opacity-100">
            {children}
          </div>
        </div>
      )}
    </ImageOverlayClient>
  );
}

export { ImageOverlay };
