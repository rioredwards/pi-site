"use client";
import { cn } from "@/lib/utils";

type ProcessingState = "preSelection" | "selected" | "processing" | "success" | "failure";

type DogBotUI = {
  show: boolean;
  chip?: string;
  title?: string;
  subtitle?: string;
  emoji?: string;
  tone?: "success" | "failure" | "neutral";
  showLoader?: boolean;
};

function getDogBotUI(processingState: ProcessingState): DogBotUI {
  // Single "card" used for processing + success + failure.
  switch (processingState) {
    case "processing":
      return {
        show: true,
        chip: "DOG CHECK",
        title: "Processing dog…",
        subtitle: "Dog Verification Bot is reviewing your dog...",
        emoji: "🤖",
        tone: "neutral" as const,
        showLoader: true,
      };
    case "success":
      return {
        show: true,
        chip: "APPROVED",
        title: "Confirmed: Dog",
        subtitle: "Verification complete. Your dog is a dog.",
        emoji: "🤖👍",
        tone: "success" as const,
        showLoader: false,
      };
    case "failure":
      return {
        show: true,
        chip: "REJECTED",
        title: "Status: Not Dog",
        subtitle: "Please submit a more dog-like dog.",
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
    <div className="absolute inset-0 z-10 flex items-center justify-center p-5">
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />

      <div
        className={cn(
          "relative w-full max-w-[380px] rounded-2xl border p-5 shadow-2xl",
          "bg-white/10 backdrop-blur-md",
          "ring-1",
          dogBot.tone === "success" && "border-emerald-200/20 ring-emerald-200/20",
          dogBot.tone === "failure" && "border-rose-200/20 ring-rose-200/20",
          dogBot.tone === "neutral" && "border-white/15 ring-white/15"
        )}>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-18 shrink-0 items-center justify-center rounded-2xl ring-1",
              dogBot.tone === "success" && "bg-emerald-500/10 ring-emerald-200/20",
              dogBot.tone === "failure" && "bg-rose-500/10 ring-rose-200/20",
              dogBot.tone === "neutral" && "bg-white/15 ring-white/20"
            )}>
            <span className="text-2xl tracking-widest">{dogBot.emoji}</span>
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1",
                dogBot.tone === "success" &&
                  "bg-emerald-500/10 text-emerald-50/90 ring-emerald-200/20",
                dogBot.tone === "failure" && "bg-rose-500/10 text-rose-50/90 ring-rose-200/20",
                dogBot.tone === "neutral" && "bg-white/10 text-white/80 ring-white/15"
              )}>
              {dogBot.showLoader ? (
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white/70" />
              ) : (
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    dogBot.tone === "success" && "bg-emerald-200/70",
                    dogBot.tone === "failure" && "bg-rose-200/70"
                  )}
                />
              )}
              {dogBot.chip}
            </div>

            <div className="text-base font-semibold text-white">{dogBot.title}</div>
            <div className="mt-1 text-sm text-white/75">{dogBot.subtitle}</div>

            {dogBot.showLoader ? (
              <>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                  <div className="h-full w-1/2 animate-[dogloading_1.1s_ease-in-out_infinite] rounded-full bg-white/50" />
                </div>
                <div className="mt-2 text-xs font-mono text-white/60">please remain calm</div>
              </>
            ) : (
              <div className="mt-3 text-xs font-mono text-white/60">
                reference id: dog-{dogBot.tone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
