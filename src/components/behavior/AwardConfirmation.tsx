"use client";

import * as React from "react";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { formatPoints } from "./SkillCard";

/* Markaziy tasdiq kartasi (ClassDojo UX): ball berilgach ekran
   markazida chiqadi, ~3 soniyada oʻzi yopiladi; "Bekor qilish"
   yozilgan eventlarni qaytaradi. Undo endi shu yerda (toast emas). */

export type AwardConfirmationData = {
  /** Timer reset kaliti (event idlar birikmasi). */
  key: string;
  targetLabel: string;
  count: number;
  skillName: string;
  emoji: string;
  points: number;
};

const AUTO_DISMISS_MS = 3200;

export function AwardConfirmation({
  data,
  onUndo,
  onDismiss,
}: {
  data: AwardConfirmationData;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // Har yangi tasdiqda (key) taymer qaytadan boshlanadi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.key]);

  const positive = data.points > 0;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="status"
        className={cn(
          "pointer-events-auto flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-lg",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300"
        )}
      >
        <span className="relative inline-flex shrink-0">
          <BehaviorEmoji code={data.emoji} label={data.skillName} className="size-12" />
          <span
            className={cn(
              "absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card px-1",
              "text-[11px] font-bold tabular-nums",
              positive
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {formatPoints(data.points)}
          </span>
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{data.targetLabel}</p>
          <p className="text-sm text-muted-foreground">
            {formatPoints(data.points)} · {data.skillName}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-2 shrink-0"
          onClick={() => {
            onUndo();
            onDismiss();
          }}
        >
          <Undo2 className="size-3.5" aria-hidden />
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}
