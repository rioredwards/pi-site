"use client";

import { cn } from "@/lib/utils";
import { usePointerType } from "@/components/image-overlay/use-pointer-type";
import React, { useCallback, useState } from "react";

export interface ImageOverlayClientProps extends React.ComponentProps<"div"> {
  onActiveChange?: (active: boolean) => void;
}

const ImageOverlayClient = React.forwardRef<
  HTMLDivElement,
  ImageOverlayClientProps
>(
  (
    {
      onActiveChange,
      onClick,
      onMouseEnter,
      onMouseLeave,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const [active, setActive] = useState(false);
    const pointerType = usePointerType();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (pointerType === "coarse") {
          const next = !active;
          setActive(next);
          onActiveChange?.(next);
        }
        onClick?.(e);
      },
      [pointerType, active, onClick, onActiveChange],
    );

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (pointerType === "fine") {
          setActive(true);
          onActiveChange?.(true);
        }
        onMouseEnter?.(e);
      },
      [pointerType, onMouseEnter, onActiveChange],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (pointerType === "fine") {
          setActive(false);
          onActiveChange?.(false);
        }
        onMouseLeave?.(e);
      },
      [pointerType, onMouseLeave, onActiveChange],
    );

    return (
      <div
        ref={ref}
        role="group"
        data-active={active}
        className={cn("group w-full", className)}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    );
  },
);
ImageOverlayClient.displayName = "ImageOverlayClient";

export { ImageOverlayClient };
