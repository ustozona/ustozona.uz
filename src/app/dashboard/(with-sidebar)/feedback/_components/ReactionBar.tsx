"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { AppleEmojiSprite as AppleEmoji } from "@/components/ui/apple-emoji";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import { SmilePlus } from "lucide-react";
import type { EmojiReaction } from "@/store/useFeedbackStore";

/** Telegram/Slack-uslub hover tez-reaksiya toʻplami. */
const QUICK_REACTIONS = ["❤️", "👍", "🔥", "🎉", "😂", "🙏"];

/** Reaksiya sanoqlari (chiplar). Reaksiya boʻlmasa — hech narsa chizmaydi. */
export function ReactionChips({
  reactions, onToggle,
}: {
  reactions: EmojiReaction[];
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          aria-pressed={r.mine}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold tabular-nums transition-all duration-fast hover:-translate-y-0.5 active:scale-90",
            r.mine
              ? "border-primary/50 bg-primary/10 text-foreground"
              : "border-transparent bg-muted/50 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
          )}
        >
          <AppleEmoji emoji={r.emoji} className="size-5" />
          {r.count}
        </button>
      ))}
    </div>
  );
}

/** Xabar ustida hover'da chiqadigan tezkor reaksiya paneli + toʻliq picker. */
export function QuickReactionBar({
  onToggle, className,
}: {
  onToggle: (emoji: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full border border-border bg-popover p-1 shadow-md",
        className
      )}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          aria-label={emoji}
          onClick={() => onToggle(emoji)}
          className="flex size-7 items-center justify-center rounded-full transition-transform duration-fast hover:scale-125 hover:bg-muted active:scale-95"
        >
          <AppleEmoji emoji={emoji} className="size-5" />
        </button>
      ))}
      <div className="mx-0.5 h-4 w-px bg-border" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Boshqa emoji"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SmilePlus className="size-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-fit p-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <EmojiPicker
            onEmojiSelect={({ emoji }) => {
              onToggle(emoji);
              setOpen(false);
            }}
          >
            <EmojiPickerSearch />
            <EmojiPickerContent />
            <EmojiPickerFooter />
          </EmojiPicker>
        </PopoverContent>
      </Popover>
    </div>
  );
}
