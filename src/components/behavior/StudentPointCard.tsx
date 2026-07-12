"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

export function StudentPointCard({
  name,
  initials,
  colorHex,
  balance,
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
      </span>
      <span className="w-full truncate text-center text-[13px] font-medium leading-tight text-foreground">
        {name}
      </span>
    </button>
  );
}
