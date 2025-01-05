"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardWithGradientBorder } from "@/components/ui/card";
import { PropsWithChildren, useState } from "react";

interface FlashcardProps extends PropsWithChildren {
  question: string;
}

export function Flashcard({ question, children }: FlashcardProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <CardWithGradientBorder
      className="rounded-lg"
      borderColors={["#FFFF00", "#FFA500", "#FF4500", "#FFFF00", "#FFA500", "#FF4500"]}>
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">{question}</h3>
          <div
            className={`transition-all duration-300 ${
              isRevealed ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
            } overflow-hidden`}>
            {children}
          </div>
          {!isRevealed && <Button onClick={() => setIsRevealed(!isRevealed)}>Reveal Answer</Button>}
        </div>
      </CardContent>
    </CardWithGradientBorder>
  );
}
