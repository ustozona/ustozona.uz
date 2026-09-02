"use client";

import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { formatPoints } from "./SkillCard";

/* Ball berilgach chiqadigan tasdiq — sonner toast (loyiha standarti,
   src/components/ui/sonner.tsx, layout.tsx'da position="bottom-center").
   Umumiy toast yuzasi bilan bir tilda: popover fon, 32px "iconbox"
   oʻrnida emoji, sarlavha/izoh (.toast-title / .toast-desc), ghost
   "Bekor qilish" tugmasi, pastda avtoyopilish chizigʻi (DESIGN.md §9).
   "Bekor qilish" bosilsa toast yopiladi va eventlar oʻchiriladi. */

const AUTO_DISMISS_MS = 5000;

export function showAwardToast({
  targetLabel,
  skillName,
  emoji,
  points,
  onUndo,
  undoLabel,
}: {
  targetLabel: string;
  skillName: string;
  emoji: string;
  points: number;
  onUndo: () => void;
  /** Translated "Undo" label — caller provides it since this is a plain
      imperative function, not a React component (can't call useTranslations). */
  undoLabel: string;
}) {
  const positive = points > 0;

  toast.custom(
    (id) => (
      <div
        role="status"
        className="card-elevation relative flex w-[400px] max-w-[calc(100vw-2rem)] items-center gap-3 overflow-hidden rounded-xl border border-border bg-popover p-4 text-popover-foreground"
      >
        <span className="relative inline-flex shrink-0">
          <BehaviorEmoji code={emoji} label={skillName} className="size-8" />
          <span
            className={cn(
              "absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-popover px-1",
              "text-[10px] font-bold tabular-nums",
              positive
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {formatPoints(points)}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="toast-title">{targetLabel}</p>
          <p className="toast-desc">{skillName}</p>
        </div>

        <button
          type="button"
          className="toast-action shrink-0 transition-colors"
          onClick={() => {
            onUndo();
            toast.dismiss(id);
          }}
        >
          <Undo2 className="size-3.5" aria-hidden />
          {undoLabel}
        </button>

        <span
          className={cn(
            "award-toast-bar absolute inset-x-0 bottom-0 h-0.5 origin-left",
            positive ? "bg-success" : "bg-destructive"
          )}
          style={{
            animation: `award-toast-progress ${AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>
    ),
    { duration: AUTO_DISMISS_MS, unstyled: true }
  );
}
