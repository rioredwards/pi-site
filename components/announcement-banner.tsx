"use client";

import { cn } from "@/app/lib/utils";
import { X } from "lucide-react";
import { useRef, useState } from "react";

const BANNER_DISMISSED_KEY = "dogtown-domain-banner-dismissed";
const TIMEOUT_MS = 1500;

type Stage = 0 | 1 | 2;

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    return !dismissed;
  });
  const [stage, setStage] = useState<Stage>(0);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDismiss = () => {
    if (stage === 0) {
      // First dismiss: hide briefly, then show stage 1
      setIsVisible(false);
      setTimeout(() => {
        setStage(1);
        setIsVisible(true);
      }, TIMEOUT_MS);
    } else if (stage === 2) {
      // Final dismiss: actually go away
      localStorage.setItem(BANNER_DISMISSED_KEY, "true");
      setIsVisible(false);
    }
  };

  const handleRickRoll = () => {
    // Stage 1: show fullscreen video
    setShowVideo(true);
    setIsVisible(false);

    // Play video at full volume after a brief delay for DOM to update
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.volume = 1;
        videoRef.current.play();
      }
    }, 50);
  };

  const handleVideoEnd = () => {
    setShowVideo(false);
    setTimeout(() => {
      setStage(2);
      setIsVisible(true);
    }, 500);
  };

  // Fullscreen video overlay
  if (showVideo) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src="/videos/rick.mp4"
          className="h-full w-full object-contain"
          onEnded={handleVideoEnd}
          playsInline
        />
      </div>
    );
  }

  if (!isVisible) return null;

  const messages: Record<Stage, React.ReactNode> = {
    0: (
      <>
        Hey dog, it&apos;s{" "}
        <a
          href="https://dogtown.dog"
          className="font-semibold text-primary-foreground underline underline-offset-2 hover:opacity-80"
        >
          dogtown.dog
        </a>{" "}
        now, btw 🐶
      </>
    ),
    1: <>like, instead of .com it&apos;s .dog 🐕</>,
    2: <>sorry about that 😬</>,
  };

  const dismissButton = (
    <button
      onClick={handleDismiss}
      className="absolute right-2 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-primary-foreground/50 focus:outline-none"
      aria-label="Dismiss announcement"
    >
      {stage === 2 ? (
        <span className="text-sm font-medium">It&apos;s okay</span>
      ) : (
        <X className="h-4 w-4 stroke-4" />
      )}
    </button>
  );

  const rickRollButton = (
    <button
      onClick={handleRickRoll}
      className="absolute right-2 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-primary-foreground/50 focus:outline-none"
      aria-label="Dismiss announcement"
    >
      <X className="h-4 w-4 stroke-4" />
    </button>
  );

  return (
    <div
      className={cn(
        "text-md fixed top-0 right-0 left-0 z-60 flex items-center justify-center gap-2 bg-primary/80 px-4 py-4 text-center text-primary-foreground backdrop-blur-sm",
      )}
    >
      <span>{messages[stage]}</span>
      {stage === 1 ? rickRollButton : dismissButton}
    </div>
  );
}
