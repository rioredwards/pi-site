"use client";

import { CardContent, CardWithGradientBorder } from "@/components/card";
import { Button } from "@/components/ui/button";
import { PropsWithChildren, useState } from "react";

interface FlashcardProps extends PropsWithChildren {
  question: string;
}

export function Flashcard({ question, children }: FlashcardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <CardWithGradientBorder
      className="rounded-lg"
      borderColors={[
        "#FFFF00",
        "#FFA500",
        "#FF4500",
        "#FFFF00",
        "#FFA500",
        "#FF4500",
      ]}
    >
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="mb-4 text-lg font-semibold">{question}</h3>
          <div
            className={`transition-all duration-300 ${
              isRevealed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            {children}
          </div>
          {!isRevealed && (
            <Button onClick={() => setIsRevealed(!isRevealed)}>
              Reveal Answer
            </Button>
          )}
        </div>
      </CardContent>
    </CardWithGradientBorder>
  );
}
