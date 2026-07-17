"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BehaviorAutoSettings } from "@/lib/behavior-data";
import { streakMilestoneAt } from "@/lib/behavior-auto";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { formatPoints } from "./SkillCard";

/* Xulq avtomatik qoidalari — koʻnikmalar bilan BIR XIL karta-grid ichida
   yashaydi (oʻqituvchi uchun "xulq balli" bitta tushuncha). Har qoida
   SkillCard karkasida: emoji + nom + burchakda ball badge + "Avto" nishon.

   Ball qiymatlari QULFLANGAN (ekspert-defaultlar): avto-signal doim ±1..±2
   diapazonda qoladi — pedagogik (qoʻlda) ballar ±2+ dan ogʻirroq turishi
   tizim kafolati, tavsiya emas. Popover'da faqat yoqish/oʻchirish (+
   seriyada N tanlash) va qoida izohi. Default hammasi yoniq; oʻchirilsa
   tarix saqlanadi (reconciler tegmaydi). */

const RULE_EMOJI = {
  late: "23f0",
  absent: "1f6ab",
  present: "2705",
  streak: "1f525",
  graded: "1f4dd",
  due: "23f3",
} as const;

function AutoRuleTile({
  emoji,
  title,
  badge,
  positive,
  enabled,
  children,
}: {
  emoji: string;
  title: string;
  badge: string;
  positive: boolean;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("AutoPointsEditor");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative flex flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-3 pt-6 pb-4",
            "cursor-pointer transition-all hover:ring-2 hover:ring-inset hover:ring-primary/30 hover:bg-muted/40",
            "active:scale-[0.97]",
            !enabled && "opacity-50"
          )}
        >
          <span
            className={cn(
              "absolute top-2 right-2.5 text-xs font-bold tabular-nums",
              positive ? "text-success" : "text-destructive"
            )}
          >
            {badge}
          </span>
          <span className="absolute top-2 left-2.5 rounded bg-muted px-1 py-px text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
            {t("autoBadge")}
          </span>
          <BehaviorEmoji
            code={emoji}
            label={title}
            className="size-9 transition-transform duration-fast group-hover:scale-110"
          />
          <span className="line-clamp-2 text-center text-[13px] font-medium leading-tight text-foreground">
            {title}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** Popover izoh matni — qoida qanday ishlashi. */
function RuleInfo({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

/** Popover qatori: label + kontrol. */
function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground">{label}</span>
      {children}
    </div>
  );
}

/** Seriya zina jadvali — B, 2B, 4B, 6B marralar va bonuslari. */
function StreakLadder({ base }: { base: number }) {
  const t = useTranslations("AutoPointsEditor");
  const rows = [1, 2, 3, 4].map((k) => streakMilestoneAt(k, base));
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
        {rows.map((r, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="font-medium text-foreground">{t("lessonCount", { count: r.threshold })}</span>
            <span className="text-success">+{r.bonus}</span>
          </span>
        ))}
        <span>…</span>
      </div>
    </div>
  );
}

/** Qulflangan ball qatori — qiymat oʻzgartirilmaydi (tizim standarti). */
function LockedPointsRow({ points }: { points: number }) {
  const t = useTranslations("AutoPointsEditor");
  return (
    <ControlRow label={t("pointsLabel")}>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          points > 0 ? "text-success" : "text-destructive"
        )}
      >
        {formatPoints(points)}
        <span className="ml-1.5 font-normal text-muted-foreground">{t("standard")}</span>
      </span>
    </ControlRow>
  );
}

function LessonCountSelect({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const t = useTranslations("AutoPointsEditor");
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-24 tabular-nums" size="sm" disabled={disabled} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={String(o)} className="tabular-nums">
            {t("lessonCount", { count: o })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Deterministik namuna-hafta — faol qoidalardan jonli hisob.
    `t` — chaqiruvchi komponent useTranslations("AutoPointsEditor")'dan uzatadi
    (bu oddiy funksiya, hook emas — komponent render ichida chaqirilmaydi). */
function weekExample(
  v: BehaviorAutoSettings,
  t: (key: string, values?: Record<string, string | number>) => string
): { parts: string[]; total: number } | null {
  const parts: string[] = [];
  let total = 0;
  if (v.attendanceEnabled && v.presentEnabled) {
    parts.push(t("weekPresent", { count: 2, points: v.presentPoints * 2 }));
    total += v.presentPoints * 2;
  }
  if (v.attendanceEnabled && v.lateEnabled) {
    parts.push(t("weekLate", { count: 1, points: v.latePoints }));
    total += v.latePoints;
  }
  if (v.journalEnabled && v.gradedEnabled) {
    parts.push(t("weekGraded", { count: 1, points: v.gradedPoints }));
    total += v.gradedPoints;
  }
  if (parts.length === 0) return null;
  return { parts, total };
}

/** Xulq avtomatik qoidalari — Koʻnikmalar gridiga ijobiy/salbiy boʻyicha aralashtiriladi. */
export function useAutoRuleTiles(
  value: BehaviorAutoSettings,
  onChange: (next: BehaviorAutoSettings) => void
): { positive: React.ReactNode[]; negative: React.ReactNode[] } {
  const t = useTranslations("AutoPointsEditor");
  const patch = (partial: Partial<BehaviorAutoSettings>) =>
    onChange({ ...value, ...partial });

  const negative: React.ReactNode[] = [
    <AutoRuleTile
      key="late"
      emoji={RULE_EMOJI.late}
      title={t("late.title")}
      badge={formatPoints(value.latePoints)}
      positive={false}
      enabled={value.attendanceEnabled && value.lateEnabled}
    >
      <RuleInfo>{t("late.info")}</RuleInfo>
      <LockedPointsRow points={value.latePoints} />
      <ControlRow label={t("enabledLabel")}>
        <Switch
          checked={value.lateEnabled}
          onCheckedChange={(on) => patch({ lateEnabled: on })}
          aria-label={t("late.enableAria")}
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="absent"
      emoji={RULE_EMOJI.absent}
      title={t("absent.title")}
      badge={formatPoints(value.absentPoints)}
      positive={false}
      enabled={value.attendanceEnabled && value.absentEnabled}
    >
      <RuleInfo>{t("absent.info")}</RuleInfo>
      <LockedPointsRow points={value.absentPoints} />
      <ControlRow label={t("enabledLabel")}>
        <Switch
          checked={value.absentEnabled}
          onCheckedChange={(on) => patch({ absentEnabled: on })}
          aria-label={t("absent.enableAria")}
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="due"
      emoji={RULE_EMOJI.due}
      title={t("due.title")}
      badge={formatPoints(value.missedDuePoints)}
      positive={false}
      enabled={value.journalEnabled && value.missedDueEnabled}
    >
      <RuleInfo>{t("due.info")}</RuleInfo>
      <LockedPointsRow points={value.missedDuePoints} />
      <ControlRow label={t("enabledLabel")}>
        <Switch
          checked={value.missedDueEnabled}
          onCheckedChange={(on) => patch({ missedDueEnabled: on })}
          aria-label={t("due.enableAria")}
        />
      </ControlRow>
    </AutoRuleTile>,
  ];

  const positive: React.ReactNode[] = [
    <AutoRuleTile
      key="present"
      emoji={RULE_EMOJI.present}
      title={t("present.title")}
      badge={formatPoints(value.presentPoints)}
      positive
      enabled={value.attendanceEnabled && value.presentEnabled}
    >
      <RuleInfo>{t("present.info")}</RuleInfo>
      <LockedPointsRow points={value.presentPoints} />
      <ControlRow label={t("enabledLabel")}>
        <Switch
          checked={value.presentEnabled}
          onCheckedChange={(on) => patch({ presentEnabled: on })}
          aria-label={t("present.enableAria")}
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="streak"
      emoji={RULE_EMOJI.streak}
      title={t("streak.title")}
      badge="+2…+5"
      positive
      enabled={value.attendanceEnabled && value.streakEnabled}
    >
      <RuleInfo>{t("streak.info")}</RuleInfo>
      <ControlRow label={t("streak.startLabel")}>
        <LessonCountSelect
          value={value.streakN}
          options={[3, 4, 5]}
          onChange={(v) => patch({ streakN: v })}
          disabled={!value.streakEnabled}
          ariaLabel={t("streak.startAria")}
        />
      </ControlRow>
      <StreakLadder base={value.streakN} />
      <ControlRow label={t("enabledLabel")}>
        <Switch
          checked={value.streakEnabled}
          onCheckedChange={(on) => patch({ streakEnabled: on })}
          aria-label={t("streak.enableAria")}
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="graded"
      emoji={RULE_EMOJI.graded}
      title={t("graded.title")}
      badge={formatPoints(value.gradedPoints)}
      positive
      enabled={value.journalEnabled && value.gradedEnabled}
    >
      <RuleInfo>{t("graded.info")}</RuleInfo>
      <LockedPointsRow points={value.gradedPoints} />
      <ControlRow label={t("enabledLabel")}>
        <Switch
          checked={value.gradedEnabled}
          onCheckedChange={(on) => patch({ gradedEnabled: on })}
          aria-label={t("graded.enableAria")}
        />
      </ControlRow>
    </AutoRuleTile>,
  ];

  return { positive, negative };
}

export { weekExample };
