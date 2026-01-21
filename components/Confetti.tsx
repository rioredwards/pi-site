"use client";

import ReactConfetti from "react-confetti";
import { useWindowSize } from "../hooks/useWindowSize";

interface Props {
  setShowConfetti: (show: boolean) => void;
}

export default function Confetti({ setShowConfetti }: Props) {
  const { width, height } = useWindowSize();

  return (
    <ReactConfetti
      style={{ zIndex: 9999, pointerEvents: "none" }}
      onConfettiComplete={() => setShowConfetti(false)}
      width={width}
      height={height}
      recycle={false}
    />
  );
}

