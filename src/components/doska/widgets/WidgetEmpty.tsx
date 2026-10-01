"use client";

import * as React from "react";

import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   BOʻSH VIDJET — ikonka, bitta jumla va asosiy tugma
   (docs/doska-referens-koriklari.md R435, §2.9 4-qoida).

   Bitta komponent: QR, voqea sanogʻi, dars bosqichlari… har biri oʻz
   boʻsh holatini yozsa, biri ikonkali, biri tugmasiz chiqadi. Tugma
   odatda sozlama kartasini ochadi — oʻqituvchi nima qilishni izlamaydi.
   ════════════════════════════════════════════════════════════════════ */

export function WidgetEmpty({
  Icon,
  text,
  action,
  onAction,
  card = "slate",
}: {
  Icon: React.ComponentType<{ className?: string }>;
  text: React.ReactNode;
  /** Tugma yozuvi; berilmasa tugma chiqmaydi (masalan yuklanmoqda). */
  action?: string;
  onAction?: () => void;
  card?: string;
}) {
  return (
    <div
      className="doska-card flex size-full flex-col items-center justify-center gap-[3cqw] p-[6cqw] text-center"
      data-card={card}
    >
      <span aria-hidden="true" className="opacity-60" style={{ width: "clamp(1.5rem, 14cqw, 5rem)" }}>
        <Icon className="size-full" />
      </span>
      <p className="leading-snug opacity-80" style={{ fontSize: "clamp(0.8rem, 5cqw, 1.6rem)" }}>
        {text}
      </p>
      {action && onAction && (
        <WidgetButton
          tone="primary"
          onClick={onAction}
          className="min-h-11 px-[6cqw] py-[2.5cqw] font-semibold"
          style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.5rem)" }}
        >
          {action}
        </WidgetButton>
      )}
    </div>
  );
}
