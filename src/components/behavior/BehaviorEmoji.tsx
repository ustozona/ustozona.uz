"use client";

import { AppleEmoji } from "@/components/ui/apple-emoji";

/* Xulq yuzalarida emoji FAQAT shu komponent orqali render qilinadi
   (Apple sprite, CDN). Snapshot'lar buzilmaydi — kod oʻzgarmaydi. */

export function BehaviorEmoji({
  code,
  label,
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  return <AppleEmoji code={code} label={label ?? ""} className={className} />;
}
