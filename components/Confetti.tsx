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
      onConfettiComplete={() => setShowConfetti(false)}
      width={width}
      height={height}
      recycle={false}
    />
  );
}
