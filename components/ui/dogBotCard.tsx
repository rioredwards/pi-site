"use client";
import { cn } from "@/app/lib/utils";

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
        title: "Hold up",
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
      <div className="relative z-20 flex flex-1 items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
          <span className="text-3xl">{dogBot.emoji}</span>
          <div>
            <div className="text-base font-bold text-gray-900">{dogBot.title}</div>
            <div className="text-sm text-gray-600">{dogBot.subtitle}</div>
          </div>
        </div>
      </div>

      {/* DogBot logo - bottom left */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <span className="text-2xl">🤖</span>
        <div>
          <div className="text-sm font-bold text-white drop-shadow-md">
            DogBot™
          </div>
          <div className="text-[10px] text-cyan-300 drop-shadow-md">
            &lt;Integrated Dog Detection System&gt;
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get the border color class for the modal based on processing state
 */
export function getDogBotBorderClass(processingState: ProcessingState): string {
  switch (processingState) {
    case "processing":
      return "ring-4 ring-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]";
    case "success":
      return "ring-4 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]";
    case "failure":
      return "ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]";
    default:
      return "ring-1 ring-border/60";
  }
}
