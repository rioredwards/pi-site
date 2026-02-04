"use client";

import { cn } from "@/app/lib/utils";
import { X } from "lucide-react";
import { useState } from "react";

const BANNER_DISMISSED_KEY = "dogtown-domain-banner-dismissed";

const RICK_ROLL_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const TIMEOUT_MS = 1500;

type Stage = 0 | 1 | 2;

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    return !dismissed;
  });
  const [stage, setStage] = useState<Stage>(0);

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
    // Stage 1: rick-roll, then show stage 2
    window.open(RICK_ROLL_URL, "_blank");
    setIsVisible(false);
    setTimeout(() => {
      setStage(2);
      setIsVisible(true);
    }, TIMEOUT_MS);
  };

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
      <X className="h-4 w-4 stroke-4" />
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
