"use client";

import { cn } from "@/app/lib/utils";
import { useIsMobile } from "@/hooks/use-is-mobile";
import Image, { StaticImageData } from "next/image";
import * as React from "react";
import { useState } from "react";

interface FlipCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
  /**
   * Image source - can be StaticImageData or a URL string
   */
  image?: StaticImageData | string;
  /**
   * Alt text for the image
   */
  imageAlt?: string;
  /**
   * Priority loading for the image
   */
  imagePriority?: boolean;
  minHeight?: string;
  minWidth?: string;
  transformScale?: number;
  transformZ?: number;
  cardClassName?: string;
  frontClassName?: string;
  backClassName?: string;
  contentWrapperClassName?: string;
  /**
   * Title attribute for the card for better SEO
   */
  cardTitle?: string;
  /**
   * Description for the card content for better SEO
   */
  cardDescription?: string;
  /**
   * Gradient configuration for the front face
   */
  frontGradient?: boolean;
  /**
   * Gradient configuration for the back face
   */
  backGradient?: boolean;

  /**
   * Color gradient for the card
   */
  gradientColor?: keyof typeof colorGradientVariants;
}

export const colorGradientVariants = {
  orange: "bg-gradient-to-b from-transparent to-orange-900/70",
  red: "bg-gradient-to-b from-transparent to-red-900/70",
  blue: "bg-gradient-to-b from-transparent to-blue-900/70",
  green: "bg-gradient-to-b from-transparent to-green-900/70",
  purple: "bg-gradient-to-b from-transparent to-purple-900/70",
};

export function FlipCard({
  className,
  frontContent,
  backContent,
  image,
  imageAlt,
  imagePriority = false,
  minHeight = "min-h-[300px]",
  minWidth = "w-full",
  transformScale = 0.8,
  transformZ = 70,
  cardClassName,
  frontClassName,
  backClassName,
  contentWrapperClassName,
  cardTitle,
  cardDescription,
  gradientColor,
  frontGradient = true,
  backGradient = false,
  ...props
}: FlipCardProps) {
  const isStaticImage = image && typeof image !== "string";
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
        minHeight,
        minWidth,
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
          `h-full w-full rounded-3xl transition-all duration-500 ease-in-out perspective-[1000px] transform-3d`,
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
            "inset-0 z-2 h-full w-full rounded-3xl bg-black text-center backface-hidden transform-3d",
            frontClassName
          )}
          aria-hidden={isFlipped}
        >
          {image && (
            <>
              <Image
                src={image}
                alt={imageAlt || cardTitle || "Card background"}
                className="absolute inset-0 top-0 left-0 h-full w-full rounded-3xl object-cover transform-3d"
                itemProp="image"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                fill
                placeholder={isStaticImage ? "blur" : "empty"}
                priority={imagePriority}
                loading={imagePriority ? undefined : "lazy"}
              />
              {isStaticImage && <meta itemProp="image" content={image.src} />}
            </>
          )}
          {gradientColor && frontGradient && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-3xl",
                colorGradientVariants[gradientColor]
              )}
            />
          )}
          <div
            className={cn(
              "relative z-10 flex h-full flex-col items-center justify-center",
              contentWrapperClassName
            )}
            style={{
              transform: `translatez(${transformZ}px) scale(${transformScale})`,
            }}
          >
            {frontContent}
          </div>
        </div>

        {/* Back face */}
        <div
          className={cn(
            "absolute inset-0 z-0 rotate-y-180 rounded-3xl p-6 text-center backface-hidden transform-3d",
            backClassName
          )}
          aria-hidden={!isFlipped}
        >
          {gradientColor && backGradient && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-3xl",
                colorGradientVariants[gradientColor]
              )}
            />
          )}
          <div
            className={cn(
              "relative z-10 flex h-full flex-col items-center justify-center",
              contentWrapperClassName
            )}
            style={{
              transform: `translatez(${transformZ}px) scale(${transformScale})`,
            }}
          >
            {backContent}
          </div>
        </div>
      </div>
    </article>
  );
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function FlipCardTitle({ children, className }: CardContentProps) {
  return (
    <h2
      className={cn("mb-4 text-2xl font-bold", className)}
      itemProp="headline"
    >
      {children}
    </h2>
  );
}

export function FlipCardDescription({ children, className }: CardContentProps) {
  return (
    <p className={cn("text-base", className)} itemProp="description">
      {children}
    </p>
  );
}

// exemple implementation:
{/* <FlipCard
key={app.title}
image={app.image}
minHeight="min-h-[350px]"
frontClassName="bg-background/80 border shadow-lg p-4"
backClassName="bg-background border shadow-lg p-4"
transformScale={0.9}
contentWrapperClassName="justify-between h-full px-2"
gradientColor={app.color}
frontGradient={true}
backGradient={true}
frontContent={
  <>
    {app.isOpen ? (
      <div
        className={cn(
          "flex min-w-32 items-center justify-center gap-2 rounded-md border border-green-300 bg-green-600/80"
        )}
      >
        <p className="text-muted-foreground font-heading px-2 py-1 text-lg">
          OPEN
        </p>
      </div>
    ) : (
      <div className="flex min-w-32 items-center justify-center gap-2 rounded-md border border-red-300 bg-red-600/80">
        <p className="text-muted-foreground font-heading px-2 py-1 text-lg">
          FILLED
        </p>
      </div>
    )}
    <FlipCardTitle className="font-heading text-secondary-foreground glowing-lg mb-0 text-4xl">
      {app.title}
    </FlipCardTitle>
  </>
}
backContent={
  <>
    <FlipCardTitle className="font-heading text-secondary-foreground glowing-lg mb-0 text-4xl">
      {app.title}
    </FlipCardTitle>
    <FlipCardDescription className="text-muted-foreground text-lg">
      {app.details}
    </FlipCardDescription>
    {app.isOpen ? (
      <Button
        className="mt-4"
        size="lg"
        variant="default"
        style={{
          backgroundColor: `${app.color}`,
          borderColor: `${app.color}`,
        }}
        asChild
      >
        <Link
          href={app.href}
          target="_blank"
          className="cursor-pointer"
        >
          Apply Now
        </Link>
      </Button>
    ) : (
      <Button
        className="mt-4"
        size="lg"
        disabled
        variant="secondary"
      >
        Position Filled
      </Button>
    )}
  </>
}
/> */}
