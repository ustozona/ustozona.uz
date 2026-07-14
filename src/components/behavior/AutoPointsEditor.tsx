"use client";

import * as React from "react";
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
            Avto
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
  const rows = [1, 2, 3, 4].map((k) => streakMilestoneAt(k, base));
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
        {rows.map((r, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="font-medium text-foreground">{r.threshold} dars</span>
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
  return (
    <ControlRow label="Ball">
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          points > 0 ? "text-success" : "text-destructive"
        )}
      >
        {formatPoints(points)}
        <span className="ml-1.5 font-normal text-muted-foreground">standart</span>
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
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-24 tabular-nums" size="sm" disabled={disabled} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={String(o)} className="tabular-nums">
            {o} dars
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Deterministik namuna-hafta — faol qoidalardan jonli hisob. */
function weekExample(v: BehaviorAutoSettings): { parts: string[]; total: number } | null {
  const parts: string[] = [];
  let total = 0;
  if (v.attendanceEnabled && v.presentEnabled) {
    parts.push(`2 kelgan dars (+${v.presentPoints * 2})`);
    total += v.presentPoints * 2;
  }
  if (v.attendanceEnabled && v.lateEnabled) {
    parts.push(`1 kechikish (${v.latePoints})`);
    total += v.latePoints;
  }
  if (v.journalEnabled && v.gradedEnabled) {
    parts.push(`1 baholangan topshiriq (+${v.gradedPoints})`);
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
  const patch = (partial: Partial<BehaviorAutoSettings>) =>
    onChange({ ...value, ...partial });

  const negative: React.ReactNode[] = [
    <AutoRuleTile
      key="late"
      emoji={RULE_EMOJI.late}
      title="Kechikdi"
      badge={formatPoints(value.latePoints)}
      positive={false}
      enabled={value.attendanceEnabled && value.lateEnabled}
    >
      <RuleInfo>
        Davomatda «Kechikdi» belgilanganda avtomatik yoziladi; belgi
        tuzatilsa ball ham tuzatiladi.
      </RuleInfo>
      <LockedPointsRow points={value.latePoints} />
      <ControlRow label="Yoqilgan">
        <Switch
          checked={value.lateEnabled}
          onCheckedChange={(on) => patch({ lateEnabled: on })}
          aria-label="Kechikish qoidasini yoqish"
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="absent"
      emoji={RULE_EMOJI.absent}
      title="Sababsiz kelmadi"
      badge={formatPoints(value.absentPoints)}
      positive={false}
      enabled={value.attendanceEnabled && value.absentEnabled}
    >
      <RuleInfo>
        Faqat sababsiz kelmaslik uchun — sababli kelmaslik ballga taʼsir
        qilmaydi.
      </RuleInfo>
      <LockedPointsRow points={value.absentPoints} />
      <ControlRow label="Yoqilgan">
        <Switch
          checked={value.absentEnabled}
          onCheckedChange={(on) => patch({ absentEnabled: on })}
          aria-label="Sababsiz kelmaslik qoidasini yoqish"
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="due"
      emoji={RULE_EMOJI.due}
      title="Muddatida topshirilmadi"
      badge={formatPoints(value.missedDuePoints)}
      positive={false}
      enabled={value.journalEnabled && value.missedDueEnabled}
    >
      <RuleInfo>
        Muddat kiritilgan topshiriq baholanmay qolsa yoziladi. «Q»
        belgilangan katakka minus yozilmaydi; keyin baho qoʻyilsa minus
        qaytariladi.
      </RuleInfo>
      <LockedPointsRow points={value.missedDuePoints} />
      <ControlRow label="Yoqilgan">
        <Switch
          checked={value.missedDueEnabled}
          onCheckedChange={(on) => patch({ missedDueEnabled: on })}
          aria-label="Muddatida topshirilmadi qoidasini yoqish"
        />
      </ControlRow>
    </AutoRuleTile>,
  ];

  const positive: React.ReactNode[] = [
    <AutoRuleTile
      key="present"
      emoji={RULE_EMOJI.present}
      title="Har kelgan dars"
      badge={formatPoints(value.presentPoints)}
      positive
      enabled={value.attendanceEnabled && value.presentEnabled}
    >
      <RuleInfo>
        Har darsga kelgani uchun beriladi — davomati past sinflarni
        ragʻbatlantiradi.
      </RuleInfo>
      <LockedPointsRow points={value.presentPoints} />
      <ControlRow label="Yoqilgan">
        <Switch
          checked={value.presentEnabled}
          onCheckedChange={(on) => patch({ presentEnabled: on })}
          aria-label="Har kelgan dars uchun ballni yoqish"
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="streak"
      emoji={RULE_EMOJI.streak}
      title="Seriya bonusi"
      badge="+2…+5"
      positive
      enabled={value.attendanceEnabled && value.streakEnabled}
    >
      <RuleInfo>
        Ketma-ket toza davomat uchun zina boʻyicha oʻsuvchi bonus: boshlangʻich
        marra→+2, 2 barobar→+3, 4 barobar→+5, keyin har 2 barobarda→+5.
        Kechikish va sababli kelmaslik seriyani buzmaydi — pauza qiladi.
        Sababsiz kelmaslikda hisoblagich 0 ga emas, oxirgi olingan marraga
        qaytadi.
      </RuleInfo>
      <ControlRow label="Boshlangʻich marra">
        <LessonCountSelect
          value={value.streakN}
          options={[3, 4, 5]}
          onChange={(v) => patch({ streakN: v })}
          disabled={!value.streakEnabled}
          ariaLabel="Seriya boshlangʻich marrasi (dars soni)"
        />
      </ControlRow>
      <StreakLadder base={value.streakN} />
      <ControlRow label="Yoqilgan">
        <Switch
          checked={value.streakEnabled}
          onCheckedChange={(on) => patch({ streakEnabled: on })}
          aria-label="Davomat seriyasi bonusini yoqish"
        />
      </ControlRow>
    </AutoRuleTile>,

    <AutoRuleTile
      key="graded"
      emoji={RULE_EMOJI.graded}
      title="Topshiriq baholandi"
      badge={formatPoints(value.gradedPoints)}
      positive
      enabled={value.journalEnabled && value.gradedEnabled}
    >
      <RuleInfo>Bahosidan qatʼi nazar — bajarganlik uchun beriladi.</RuleInfo>
      <LockedPointsRow points={value.gradedPoints} />
      <ControlRow label="Yoqilgan">
        <Switch
          checked={value.gradedEnabled}
          onCheckedChange={(on) => patch({ gradedEnabled: on })}
          aria-label="Topshiriq baholandi qoidasini yoqish"
        />
      </ControlRow>
    </AutoRuleTile>,
  ];

  return { positive, negative };
}

export { weekExample };
