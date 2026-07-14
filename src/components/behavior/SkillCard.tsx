"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BehaviorReward, BehaviorSkill } from "@/lib/behavior-data";
import { BehaviorEmoji } from "./BehaviorEmoji";

/* Koʻnikma/mukofot kartalari (ClassDojo karta-grid uslubi): yuqori
   oʻngda badge (±N yoki narx), markazda emoji, pastda nom; tavsif
   hover-tooltipda. Ball berish modali ham, Sozlamalar editori ham
   shu kartalarni ishlatadi. */

const tileClass = cn(
  "group relative flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-3 pt-6 pb-4",
  "cursor-pointer transition-all hover:ring-2 hover:ring-inset hover:ring-primary/30 hover:bg-muted/40",
  "active:scale-[0.97]"
);

/** Karta hover'ida emoji biroz kattarib "javob beradi" (mikro-animatsiya). */
const tileEmojiClass = "size-9 transition-transform duration-fast group-hover:scale-110";

export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `−${Math.abs(points)}`;
}

export function SkillCard({
  skill,
  onSelect,
  className,
}: {
  skill: BehaviorSkill;
  onSelect?: (skill: BehaviorSkill, el: HTMLElement) => void;
  className?: string;
}) {
  const positive = skill.points > 0;
  const card = (
    <button
      type="button"
      onClick={(e) => onSelect?.(skill, e.currentTarget)}
      className={cn(tileClass, className)}
    >
      <span
        className={cn(
          "absolute top-2 right-2.5 text-xs font-bold tabular-nums",
          positive ? "text-success" : "text-destructive"
        )}
      >
        {formatPoints(skill.points)}
      </span>
      <BehaviorEmoji code={skill.emoji} label={skill.name} className={tileEmojiClass} />
      <span className="line-clamp-2 text-center text-[13px] font-medium leading-tight text-foreground">
        {skill.name}
      </span>
    </button>
  );

  if (!skill.description) return card;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent className="max-w-60 text-center">{skill.description}</TooltipContent>
    </Tooltip>
  );
}

/** Mukofot kartasi — SkillCard layouti, badge oʻrnida ball narxi. */
export function RewardCard({
  reward,
  onSelect,
  className,
}: {
  reward: BehaviorReward;
  onSelect?: (reward: BehaviorReward, el: HTMLElement) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => onSelect?.(reward, e.currentTarget)}
      className={cn(tileClass, className)}
    >
      <span className="absolute top-2 right-2.5 text-xs font-bold tabular-nums text-warning">
        {reward.cost} ball
      </span>
      <BehaviorEmoji code={reward.emoji} label={reward.name} className={tileEmojiClass} />
      <span className="line-clamp-2 text-center text-[13px] font-medium leading-tight text-foreground">
        {reward.name}
      </span>
    </button>
  );
}

/** Shtrixli "+ qoʻshish" kartasi — grid oxirida (koʻnikma/mukofot). */
export function AddCard({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-3 pt-6 pb-4",
        "cursor-pointer text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 hover:text-foreground",
        className
      )}
    >
      <span className="flex size-9 items-center justify-center">
        <Plus className="size-5" aria-hidden />
      </span>
      <span className="line-clamp-2 min-h-[2.4em] text-center text-[13px] font-medium leading-tight">
        {label}
      </span>
    </button>
  );
}
