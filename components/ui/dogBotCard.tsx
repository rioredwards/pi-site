"use client";
import { cn } from "@/app/lib/utils";
import Link from "next/link";
import { RotatingGradientBorder } from "./RotatingGradientBorder";

type ProcessingState = "preSelection" | "cropping" | "selected" | "processing" | "success" | "failure";

type DogBotUI = {
  show: boolean;
  statusText?: string;
  title?: string;
  subtitle?: string;
  emoji?: string;
  tone?: "success" | "failure" | "neutral";
  showLoader?: boolean;
};

function getDogBotUI(processingState: ProcessingState): DogBotUI {
  switch (processingState) {
    case "processing":
      return {
        show: true,
        statusText: "processing...",
        title: "Hang tight",
        subtitle: "DogBot is processing your dog...",
        emoji: "🤖",
        tone: "neutral" as const,
        showLoader: true,
      };
    case "success":
      return {
        show: true,
        statusText: "success",
        title: "Affirmative",
        subtitle: "That is a dog",
        emoji: "🤖👍",
        tone: "success" as const,
        showLoader: false,
      };
    case "failure":
      return {
        show: true,
        statusText: "error",
        title: "Rejected",
        subtitle: "Please submit a more dog-like dog",
        emoji: "🤖👎",
        tone: "failure" as const,
        showLoader: false,
      };
    default:
      return { show: false } as const;
  }
}

interface DogBotCardProps {
  processingState: ProcessingState;
}

export function DogBotCard({ processingState }: DogBotCardProps) {
  const dogBot = getDogBotUI(processingState);

  if (!dogBot.show) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col">
      {/* Color overlay */}
      <div
        className={cn(
          "absolute inset-0",
          dogBot.tone === "success" && "bg-green-500/50",
          dogBot.tone === "failure" && "bg-red-500/40",
          dogBot.tone === "neutral" && "bg-blue-600/40"
        )}
      />

      {/* Blur layer for processing */}
      {dogBot.tone === "neutral" && (
        <div className="absolute inset-0 backdrop-blur-sm" />
      )}

      {/* Status pill - top right */}
      <div className="absolute right-4 top-4 z-20">
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg",
            dogBot.tone === "success" && "bg-gray-900 text-white",
            dogBot.tone === "failure" && "bg-red-500 text-white",
            dogBot.tone === "neutral" && "bg-blue-600 text-white"
          )}
        >
          {dogBot.showLoader ? (
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-blue-300" />
          ) : (
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                dogBot.tone === "success" && "bg-green-400",
                dogBot.tone === "failure" && "bg-red-200"
              )}
            />
          )}
          {dogBot.statusText}
        </div>
      </div>

      {/* Message bubble - center */}
      <div className="relative z-20 flex flex-1 items-center justify-center px-6 min-w-[70%]">
        <div className="flex items-center gap-3 rounded-2xl bg-white/70 backdrop-blur-sm px-5 py-4 shadow-xl w-full">
          <span className="text-3xl">{dogBot.emoji}</span>
          <div>
            <div className="text-base font-bold text-gray-900">{dogBot.title}</div>
            <div className="text-sm text-gray-600">{dogBot.subtitle}</div>
          </div>
        </div>
      </div>

      {/* DogBot logo - bottom left */}
      <div className="absolute bottom-4 left-4 z-20">
        <RotatingGradientBorder borderRadius="9999px" borderColors={getDogBotBorderColors(processingState)}>
          <Link href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1" target="_blank" className="cursor-pointer">
            <div className="flex items-center gap-2 bg-background backdrop-blur-sm rounded-full py-2 px-4 shadow-lg">
              <span className="text-2xl">🤖</span>
              <div>
                <div className="text-sm font-bold drop-shadow-md leading-tight">
                  DogBot™
                </div>
                <div className="text-[10px] drop-shadow-md leading-tight">
                  Integrated Dog Detection System
                </div>
              </div>
            </div>
          </Link>
        </RotatingGradientBorder>
      </div>
    </div>
  );
}

{/* <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
<span className="text-2xl">🤖</span>
<div>
  <div className="text-sm font-bold text-white drop-shadow-md">
    DogBot™
  </div>
  <div className="text-[10px] text-cyan-300 drop-shadow-md">
    &lt;Integrated Dog Detection System&gt;
  </div>
</div> */}


/**
 * Get the border colors for the modal based on processing state (passed into borderColors prop of RotatingGradientBorder)
 */
export function getDogBotBorderColors(processingState: ProcessingState): string[] {
  switch (processingState) {
    case "processing":
      return ["blue", "cyan", "pink", "blue", "purple", "green"];
    case "success":
      return ["green", "lime", "green", "lime"];
    case "failure":
      return ["red", "pink", "red", "pink"];
    default:
      return [];
  }
}
