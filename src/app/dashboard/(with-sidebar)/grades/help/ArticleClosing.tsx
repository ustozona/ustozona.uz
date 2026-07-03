"use client";

import { useRef } from "react";
import { Confetti, type ConfettiRef } from "@/components/magicui/confetti";
import ArticleFeedback from "./ArticleFeedback";

export default function ArticleClosing() {
  const confettiRef = useRef<ConfettiRef>(null);

  function celebrate() {
    confettiRef.current?.fire({
      particleCount: 120,
      spread: 100,
      startVelocity: 38,
      origin: { y: 0.9 },
    });
  }

  return (
    <div className="relative mt-12">
      {/* Confetti — "Fikringiz uchun rahmat!" chiqqanda (Ha bosilganda) otiladi. */}
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[360px] w-full"
      />
      <ArticleFeedback onPositive={celebrate} />
    </div>
  );
}
