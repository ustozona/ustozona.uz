"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { StreakState } from "@/lib/behavior-auto";
import { BehaviorEmoji } from "./BehaviorEmoji";

/* Oʻquvchi kartasi — avatar + ism + avatar burchagida balans bubble
   (musbat = yashil, manfiy = qizil). Balans mount-gate'gacha null —
   bubble koʻrsatilmaydi (SSR mismatch oldini olish).

   Multi-select (ClassDojo UX): hover'da yuqori chap burchakda doiracha
   chiqadi; doiracha bosilsa tanlash rejimi boshlanadi. Rejimda karta
   bosish ham tanlovni almashtiradi (ball berish emas). */

export function BalanceBubble({
  balance,
  className,
}: {
  balance: number;
  className?: string;
}) {
  return (
    /* key={balance} — qiymat oʻzgarganda remount boʻlib "pop" qiladi. */
    <span
      key={balance}
      className={cn(
        "absolute -top-1 -right-1.5 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card px-1",
        "text-[11px] font-bold tabular-nums leading-none",
        "animate-in zoom-in-50 duration-300",
        balance < 0
          ? "bg-destructive text-destructive-foreground"
          : "bg-success text-success-foreground",
        className
      )}
    >
      {balance}
    </span>
  );
}

/** Davomat seriyasi mini-chipi — faqat shaxsiy sirt (leaderboard yoʻq). */
function StreakChip({ streak }: { streak: StreakState }) {
  if (streak.count === 0) return null;
  return (
    <span
      className={cn(
        "absolute -bottom-1 -right-1.5 z-10 flex h-5 items-center gap-0.5 rounded-full border-2 border-card bg-card px-1",
        "text-[10px] font-bold tabular-nums leading-none text-foreground"
      )}
    >
      <BehaviorEmoji code={streak.paused ? "2744-fe0f" : "1f525"} className="size-3" />
      {streak.count}/{streak.nextThreshold}
    </span>
  );
}

export function StudentPointCard({
  name,
  initials,
  colorHex,
  balance,
  streak,
  onClick,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  name: string;
  initials: string;
  colorHex: string;
  /** null = hali mount boʻlmagan — bubble chiqmaydi. */
  balance: number | null;
  /** Joriy davomat seriyasi holati — berilmasa chip chiqmaydi. */
  streak?: StreakState;
  onClick: () => void;
  /** Tanlash rejimi yoqiq — doirachalar doim koʻrinadi. */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={selectionMode ? onToggleSelect : onClick}
      className={cn(
        "group relative flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-4",
        "cursor-pointer transition-all hover:ring-2 hover:ring-inset hover:ring-primary/30 hover:bg-muted/40",
        "active:scale-[0.97]",
        selected && "ring-2 ring-inset ring-primary hover:ring-primary"
      )}
    >
      {onToggleSelect && (
        /* Button ichida button boʻlmasin — span + stopPropagation. */
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          aria-hidden
          className={cn(
            "absolute top-2 left-2 z-10 flex size-5 items-center justify-center rounded-full border transition-opacity",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 bg-card hover:border-primary",
            selectionMode || selected
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
        >
          {selected && <Check className="size-3" strokeWidth={3} aria-hidden />}
        </span>
      )}
      <span className="relative inline-flex">
        <Avatar size="lg" className="size-14" style={{ "--avatar-bg": colorHex } as React.CSSProperties}>
          <AvatarFallback className="bg-[var(--avatar-bg)] text-sm font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        {balance !== null && balance !== 0 && <BalanceBubble balance={balance} />}
        {streak && <StreakChip streak={streak} />}
      </span>
      <span className="w-full truncate text-center text-[13px] font-medium leading-tight text-foreground">
        {name}
      </span>
    </button>
  );
}
