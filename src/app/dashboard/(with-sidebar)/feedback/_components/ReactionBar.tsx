"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import AnimatedLikeButton from "@/components/shadcn-space/button/button-20";

/** Telegram/Slack-uslub hover tez-reaksiya toʻplami. 👍 alohida Upvote
    tugmasi orqali beriladi (ovoz berish), shu sabab bu yerda yoʻq. */
const QUICK_REACTIONS = ["❤️", "🔥", "🎉", "😂", "🙏"];

/** Reaksiya sanoqlari (chiplar). Reaksiya boʻlmasa — hech narsa chizmaydi.
    ❤️ — animatsion Like tugmasi bilan, boshqalari — oddiy chip. */
export function ReactionChips({
  reactions, onToggle,
}: {
  reactions: EmojiReaction[];
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {reactions.map((r) =>
        r.emoji === "❤️" ? (
          <AnimatedLikeButton
            key={r.emoji}
            liked={r.mine}
            count={r.count}
            onToggle={() => onToggle(r.emoji)}
          />
        ) : (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onToggle(r.emoji)}
            aria-pressed={r.mine}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-xs font-semibold tabular-nums transition-all duration-fast hover:-translate-y-0.5 hover:bg-muted active:scale-90"
          >
            <AppleEmoji emoji={r.emoji} className="size-4" />
            {r.count}
          </button>
        )
      )}
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
  const t = useTranslations("FeedbackReactionBar");
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
            aria-label={t("otherEmojiAria")}
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
