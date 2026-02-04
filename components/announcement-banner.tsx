"use client";

import { cn } from "@/app/lib/utils";
import { X } from "lucide-react";
import { useState } from "react";

const BANNER_DISMISSED_KEY = "dogtown-domain-banner-dismissed";

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    return !dismissed;
  });

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center gap-2 bg-primary px-4 py-2 text-center text-sm text-primary-foreground",
      )}
    >
      <span>
        🎉 We&apos;re now live at{" "}
        <a
          href="https://dogtown.dog"
          className="font-semibold underline underline-offset-2 hover:opacity-80"
        >
          dogtown.dog
        </a>
        !
      </span>
      <button
        onClick={handleDismiss}
        className="absolute right-2 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
