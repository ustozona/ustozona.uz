"use client";

import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { formatPoints } from "./SkillCard";

/* Ball berilgach chiqadigan tasdiq — sonner toast (loyiha standarti,
   src/components/ui/sonner.tsx, layout.tsx'da position="top-right").
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
        className="relative flex w-full items-center gap-4 overflow-hidden rounded-xl border border-border bg-card py-4 pr-5 pl-4 shadow-lg"
      >
        <span className="relative inline-flex shrink-0">
          <BehaviorEmoji code={emoji} label={skillName} className="size-10" />
          <span
            className={cn(
              "absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card px-1",
              "text-[11px] font-bold tabular-nums",
              positive
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {formatPoints(points)}
          </span>
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{targetLabel}</p>
          <p className="text-sm text-muted-foreground">{skillName}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="ml-2 shrink-0 hover:border-destructive/40 hover:bg-destructive hover:text-white"
          onClick={() => {
            onUndo();
            toast.dismiss(id);
          }}
        >
          <Undo2 className="size-3.5" aria-hidden />
          {undoLabel}
        </Button>

        <span
          className={cn(
            "absolute inset-x-0 bottom-0 h-0.5 origin-left",
            positive ? "bg-success" : "bg-destructive"
          )}
          style={{
            animation: `award-toast-progress ${AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
        <style>{`
          @keyframes award-toast-progress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `}</style>
      </div>
    ),
    { duration: AUTO_DISMISS_MS, unstyled: true }
  );
}
