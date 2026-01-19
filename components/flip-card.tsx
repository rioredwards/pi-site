"use client";

import { cn } from "@/app/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";
import * as React from "react";
import { useState } from "react";

interface FlipCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  /**
   * Content to render on the front face of the card
   */
  frontContent: React.ReactNode;
  /**
   * Content to render on the back face of the card
   */
  backContent: React.ReactNode;
  /**
   * Additional classes for the inner card container (the element that rotates)
   */
  cardClassName?: string;
  /**
   * Additional classes for the front face container
   */
  frontClassName?: string;
  /**
   * Additional classes for the back face container
   */
  backClassName?: string;
  /**
   * Title attribute for the card for better SEO/accessibility
   */
  cardTitle?: string;
  /**
   * Description for the card content for better SEO
   */
  cardDescription?: string;
}

export function FlipCard({
  className,
  frontContent,
  backContent,
  cardClassName,
  frontClassName,
  backClassName,
  cardTitle,
  cardDescription,
  ...props
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isMobile = useIsMobile();

  const handleClick = () => {
    if (isMobile) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <article
      className={cn(
        "group perspective-[1000px]",
        isMobile ? "cursor-pointer" : "",
        className
      )}
      onClick={handleClick}
      aria-label={cardTitle || "Interactive flip card"}
      title={cardTitle}
      itemScope
      itemType="https://schema.org/CreativeWork"
      {...props}
    >
      {cardTitle && <meta itemProp="name" content={cardTitle} />}
      {cardDescription && (
        <meta itemProp="description" content={cardDescription} />
      )}
      <div
        className={cn(
          "relative h-full w-full transition-all duration-500 ease-in-out transform-3d",
          isMobile
            ? isFlipped
              ? "rotate-y-180"
              : ""
            : "group-hover:rotate-y-180",
          cardClassName
        )}
      >
        {/* Front face */}
        <div
          className={cn(
            "h-full w-full backface-hidden transform-3d",
            frontClassName
          )}
          aria-hidden={isFlipped}
        >
          {frontContent}
        </div>

        {/* Back face */}
        <div
          className={cn(
            "absolute inset-0 rotate-y-180 backface-hidden transform-3d",
            backClassName
          )}
          aria-hidden={!isFlipped}
        >
          {backContent}
        </div>
      </div>
    </article>
  );
}
