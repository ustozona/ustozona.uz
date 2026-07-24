"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import { ShieldCheck, Star, CornerUpLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { initialsOf, type FeedbackReply } from "@/store/useFeedbackStore";
import { formatFeedbackAgo, formatFeedbackFull, useMonthsShort, useRelativeT } from "./feedback-meta";
import { QuoteBlock } from "./QuoteBlock";
import { EmojiText } from "@/components/ui/emoji-text";
import { ReactionChips, QuickReactionBar } from "./ReactionBar";

/* Suhbatdagi bitta javob qatori — top-level va ichki javoblar bir xil. */

type Props = {
  reply: FeedbackReply;
  /** Iqtibos-jump'da yoritiladigan xabar id'si (`msg-<id>`). */
  flashId: string | null;
  onToggleReaction: (emoji: string) => void;
  onReply: () => void;
  onJump: (targetId?: string) => void;
};

export default function ReplyRow({ reply: r, flashId, onToggleReaction, onReply, onJump }: Props) {
  const t = useTranslations("FeedbackReplyRow");
  const monthsShort = useMonthsShort();
  const relativeT = useRelativeT();
  return (
    <div className="group/reply flex items-start gap-3">
      <Avatar size="default" className="mt-0.5 shrink-0">
        {!r.isOfficial && r.authorAvatarUrl && <AvatarImage src={r.authorAvatarUrl} alt={r.author} />}
        <AvatarFallback
          className={cn(
            "text-xs font-semibold",
            r.isOfficial ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {r.isOfficial ? <ShieldCheck className="size-4" /> : initialsOf(r.author)}
        </AvatarFallback>
      </Avatar>
      <div
        id={`msg-${r.id}`}
        data-msg-id={`msg-${r.id}`}
        data-msg-author={r.author}
        className={cn("group/msg relative min-w-0 flex-1", flashId === `msg-${r.id}` && "feedback-jump-flash")}
      >
        {/* Hover'da tezkor reaksiya (javobga) */}
        <QuickReactionBar
          onToggle={onToggleReaction}
          className="absolute -top-2 right-0 z-10 opacity-0 transition-opacity duration-fast group-hover/msg:opacity-100 focus-within:opacity-100"
        />
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pr-24">
          <span className="text-sm font-semibold text-foreground">{r.author}</span>
          {r.isOfficial && (
            <>
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {t("official")}
              </span>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default text-xs text-muted-foreground/70">
                · {formatFeedbackAgo(r.createdAt, relativeT)}
              </span>
            </TooltipTrigger>
            <TooltipContent>{formatFeedbackFull(r.createdAt, monthsShort)}</TooltipContent>
          </Tooltip>
        </div>
        {r.quote && <QuoteBlock quote={r.quote} className="mt-1.5" onJump={onJump} />}
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 selection:bg-primary/25">
          <EmojiText text={r.body} />
        </p>
        {r.reactions && r.reactions.length > 0 && (
          <div className="mt-2">
            <ReactionChips reactions={r.reactions} onToggle={onToggleReaction} />
          </div>
        )}
        {/* Amallar qatori: Javob (matn ostida, chapda) */}
        <div className="mt-1.5">
          <button
            type="button"
            onClick={onReply}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <CornerUpLeft className="size-3" />
            {t("reply")}
          </button>
        </div>
      </div>
    </div>
  );
}
