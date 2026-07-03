"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquarePlus, X } from "lucide-react";
import FeedbackForm from "./FeedbackForm";

type Props = {
  userInitials: string;
  /** Fikr yuborilgach (forma tozalanadi, karta ochiq qoladi). */
  onSubmitted?: (id: string) => void;
};

/**
 * Yuqoridagi inline kompozer (EMStudio "Send Feedback" naqshi) — yopiq
 * holatda sokin qator (avatar + ishora), fokusda bordered karta. Forma
 * tanasi umumiy `FeedbackForm`da (header QuickFeedback bilan bir xil).
 */
export default function FeedbackComposer({ userInitials, onSubmitted }: Props) {
  const [expanded, setExpanded] = useState(false);

  // ── Yopiq holat: sokin qator ──
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left card-elevation transition-colors hover:border-primary/40"
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 text-sm text-muted-foreground/70">Fikr bildirish — taklif, xato, savol yoki maqtov…</span>
        <MessageSquarePlus className="size-4 text-muted-foreground/70 transition-colors group-hover:text-primary" />
      </button>
    );
  }

  // ── Ochiq holat: kompozer karta ──
  return (
    <div className="rounded-xl border border-primary/40 bg-card p-3 shadow-sm ring-2 ring-primary/10">
      <FeedbackForm
        autoFocus
        rows={3}
        submitLabel="Fikr bildirish"
        leading={
          <Avatar size="sm" className="mt-0.5">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        }
        extraActions={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Bekor qilish"
            onClick={() => setExpanded(false)}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        }
        onEscape={() => setExpanded(false)}
        onSubmitted={onSubmitted}
      />
    </div>
  );
}
