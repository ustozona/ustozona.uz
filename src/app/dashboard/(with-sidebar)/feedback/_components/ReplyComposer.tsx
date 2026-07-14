"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ShieldCheck, X } from "lucide-react";
import type { ReplyQuote } from "@/store/useFeedbackStore";
import { QuoteBlock } from "./QuoteBlock";

/* Javob kompozeri. "Jamoa nomidan" switch: yoqiq — rasmiy javob (asoschi
   rejimi, default), oʻchiq — oddiy foydalanuvchi javobi (seed'dagi Nodira
   kabi). Draft/asTeam holati FeedbackCard'da turadi — kompozer iplar orasida
   koʻchganda yozilgan matn yoʻqolmaydi. */

type Props = {
  quote?: ReplyQuote;
  draft: string;
  asTeam: boolean;
  userInitials: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (v: string) => void;
  onAsTeamChange: (v: boolean) => void;
  /** Iqtibos/ip nishonini bekor qiladi (X yoki birinchi Esc). */
  onClearTarget: () => void;
  onSubmit: () => void;
  onJump: (targetId?: string) => void;
};

export default function ReplyComposer({
  quote, draft, asTeam, userInitials, textareaRef,
  onDraftChange, onAsTeamChange, onClearTarget, onSubmit, onJump,
}: Props) {
  return (
    <div className="flex items-start gap-3">
      <Avatar size="default" className="mt-0.5 shrink-0">
        <AvatarFallback
          className={
            asTeam
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-xs font-semibold text-muted-foreground"
          }
        >
          {asTeam ? <ShieldCheck className="size-4" /> : userInitials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary/50">
          {quote && (
            <div className="mb-2 flex items-start gap-2 rounded-md bg-muted/60 py-1.5 pr-1.5 animate-in fade-in-0 slide-in-from-left-1 duration-fast">
              <QuoteBlock quote={quote} className="min-w-0 flex-1 pl-2" onJump={onJump} />
              <button
                type="button"
                onClick={onClearTarget}
                aria-label="Belgilashni bekor qilish"
                className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClearTarget();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
            }}
            placeholder={asTeam ? "Rasmiy javob yozing…" : "Javob yozing…"}
            rows={2}
            className="min-h-0 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <label className="flex cursor-pointer select-none items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Switch size="sm" checked={asTeam} onCheckedChange={onAsTeamChange} />
              Jamoa nomidan
            </label>
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs transition-transform active:scale-95"
              disabled={!draft.trim()}
              onClick={onSubmit}
            >
              <Send className="size-3.5" />
              Javob berish
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
