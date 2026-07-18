"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import { ClassSwatch } from "@/components/ClassSwatch";
import { useGradesStore } from "@/store/useGradesStore";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { dateToKey, dateKeyToDate, addDaysKey } from "@/lib/date-keys";
import { MONTHS_UZ } from "@/lib/localization";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   TUGʻILGAN KUNLAR — bugundan +7 kungacha (redesign M4, Notion merosi).
   Roster — useGradesStore.classDataMap (kanonik, null-safe), sinf nomi
   jonli roʻyxatdan. Yaqin tugʻilgan kun boʻlmasa karta umuman chizilmaydi.
   ════════════════════════════════════════════════════════════════════ */

const WINDOW_DAYS = 7;

type BirthdayRow = {
  studentId: string;
  name: string;
  classId: string;
  className: string;
  classHex: string;
  /** Tugʻilgan kun shu yilgi sanasi (yyyy-mm-dd). */
  occurrence: string;
  /** Bugundan farq (0 = bugun). */
  diff: number;
  /** Nechchi yoshga toʻladi. */
  age: number;
};

export function BirthdayCard({ now }: { now: Date }) {
  const t = useTranslations("BirthdayCard");
  const todayKey = dateToKey(now);

  const classDataMap = useGradesStore((s) => s.classDataMap);
  const liveClasses = useLiveClasses();

  const rows = useMemo<BirthdayRow[]>(() => {
    const out: BirthdayRow[] = [];
    const horizon = addDaysKey(todayKey, WINDOW_DAYS);
    const todayYear = Number(todayKey.slice(0, 4));
    for (const cls of liveClasses) {
      const cd = classDataMap[cls.id];
      if (!cd) continue;
      const hex = CLASS_COLOR_HEX[classColor(cls)];
      for (const st of cd.students) {
        if (st.status === "archived" || !st.birthDate) continue;
        const [by, bm, bd] = st.birthDate.split("-").map(Number);
        if (!by || !bm || !bd) continue;
        const mmdd = st.birthDate.slice(5);
        let occurrence = `${todayYear}-${mmdd}`;
        if (occurrence < todayKey) occurrence = `${todayYear + 1}-${mmdd}`;
        if (occurrence > horizon) continue;
        const diff = Math.round(
          (dateKeyToDate(occurrence).getTime() - dateKeyToDate(todayKey).getTime()) / 86400000
        );
        out.push({
          studentId: st.id,
          name: st.name,
          classId: cls.id,
          className: cls.name,
          classHex: hex,
          occurrence,
          diff,
          age: Number(occurrence.slice(0, 4)) - by,
        });
      }
    }
    return out.sort((a, b) => a.diff - b.diff || a.name.localeCompare(b.name));
  }, [classDataMap, liveClasses, todayKey]);

  if (rows.length === 0) return null;

  const whenLabel = (r: BirthdayRow): { text: string; highlight: boolean } => {
    if (r.diff === 0) return { text: t("today"), highlight: true };
    if (r.diff === 1) return { text: t("tomorrow"), highlight: false };
    const [, m, d] = r.occurrence.split("-").map(Number);
    return { text: `${d}-${MONTHS_UZ[m - 1].toLowerCase()}`, highlight: false };
  };

  return (
    <Card className="shrink-0 gap-0 py-0 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <AppleEmojiSprite emoji="🎂" className="size-4.5" />
        <span className="text-sm font-semibold text-foreground">{t("title")}</span>
      </div>
      <div className="flex flex-col divide-y divide-border/60 px-5 py-1">
        {rows.map((r) => {
          const when = whenLabel(r);
          return (
            <Link
              key={`${r.classId}-${r.studentId}`}
              href={`/dashboard/students/${r.studentId}`}
              className="group flex items-center gap-2.5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground transition-colors duration-fast group-hover:text-primary">
                  {r.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClassSwatch hex={r.classHex} className="size-2" />
                  {r.className}
                  <span className="size-0.5 rounded-full bg-muted-foreground/60" />
                  {t("turnsAge", { age: r.age })}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium tabular-nums",
                  when.highlight ? "font-semibold text-warning" : "text-muted-foreground"
                )}
              >
                {when.text}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
