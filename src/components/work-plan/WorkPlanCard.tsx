"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarRange, ChevronDown, CircleCheck, ExternalLink, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLessonStore } from "@/store/useLessonStore";
import { dateKeyToDate, todayKey } from "@/lib/date-keys";
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import { workPlanFor, type PlanRow } from "@/lib/work-plan";

/* ════════════════════════════════════════════════════════════════════
   ISH REJA KARTASI — topshiriq yaratayotgan oʻqituvchiga eslatma.

   Topshiriqlar → «+ Yaratish» muharririda, sarlavha ostida. Ekranni
   egallamaydi: yopiq holatda bitta qator («Bugun: 05. Reading…»),
   ochilganda joriy mavzu atrofi (2 oldingi · joriy · 2 keyingi), va
   «Butun chorak» — boʻlimning hamma mavzusi, cheklangan balandlikda.

   Mavzu yonidagi «Olish» — sarlavhaga mavzu nomini, sanaga shu
   mavzuning dars kunini qoʻyadi (oʻtmishdagi kun qoʻyilmaydi).
   Manba — Darslar sahifasi (`lib/work-plan.ts`), shu sababli bu yerda
   hech narsa tahrirlanmaydi: reja oʻzgartirish — Darslar sahifasida.
   ════════════════════════════════════════════════════════════════════ */

const AROUND = 2;
const OPEN_KEY = "ustozona-workplan-open";

function readOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) !== "0";
  } catch {
    return true;
  }
}

export function WorkPlanCard({
  classId,
  onPick,
}: {
  classId: string;
  /** «Olish» — mavzuni topshiriqqa qoʻyish. */
  onPick: (row: PlanRow) => void;
}) {
  const t = useTranslations("WorkPlan");
  const locale = useLocale();
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const hydrated = useLessonStore((s) => s._hasHydrated);
  const [open, setOpen] = useState(readOpen);
  const [all, setAll] = useState(false);
  const today = todayKey();

  const plan = useMemo(() => workPlanFor(lessons, units, classId, today), [lessons, units, classId, today]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      /* saqlanmasa ham ishlaydi */
    }
  }

  const fmt = (key: string) => {
    const d = dateKeyToDate(key);
    if (locale.startsWith("uz")) return `${d.getDate()}-${MONTHS_UZ_SHORT[d.getMonth()]}`;
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
  };

  const lessonsHref = `/dashboard/lessons?classId=${encodeURIComponent(classId)}`;

  if (!hydrated) return null;

  if (!plan) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{t("empty")}</p>
          <p className="text-caption text-muted-foreground">{t("emptyHint")}</p>
        </div>
        <Link href={lessonsHref} className="shrink-0 text-caption font-medium text-foreground underline-offset-4 hover:underline">
          {t("openLessons")}
        </Link>
      </div>
    );
  }

  const cur = plan.rows[plan.current];
  const anchorLabel = plan.anchor === "today" ? t("today") : plan.anchor === "next" ? t("nextLesson") : t("upNext");
  const from = all ? 0 : Math.max(0, plan.current - AROUND);
  const to = all ? plan.rows.length - 1 : Math.min(plan.rows.length - 1, plan.current + AROUND);
  const visible = plan.rows.slice(from, to + 1);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-fast hover:bg-muted/40"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CalendarRange className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-caption text-muted-foreground">
            {t("title")} · {plan.unit?.title ?? t("noUnit")}
          </span>
          <span className="block truncate text-sm font-medium text-foreground">
            {anchorLabel}: {cur.no}. {cur.lesson.title || t("untitled")}
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-fast", !open && "-rotate-90")} />
      </button>

      {open && (
        <div className="border-t border-border">
          <ol className={cn("flex flex-col py-1", all && "max-h-72 overflow-y-auto scrollbar-thin")}>
            {visible.map((row) => {
              const isCur = row.lesson.id === cur.lesson.id;
              return (
                <li
                  key={row.lesson.id}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-1.5",
                    isCur && "bg-muted/60",
                  )}
                >
                  <span className="w-7 shrink-0 text-right text-caption tabular-nums text-muted-foreground">
                    {String(row.no).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        isCur ? "font-semibold text-foreground" : row.taught ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {row.reserve ? t("reserve") : row.lesson.title || t("untitled")}
                    </span>
                  </span>
                  {isCur && (
                    <span className="shrink-0 rounded-full bg-foreground px-2 py-0.5 text-caption font-medium text-background">
                      {anchorLabel}
                    </span>
                  )}
                  {row.taught && !isCur && (
                    <CircleCheck className="size-3.5 shrink-0 text-success" aria-label={t("taught")} />
                  )}
                  <span className="w-14 shrink-0 text-right text-caption tabular-nums text-muted-foreground">
                    {row.date ? fmt(row.date) : "—"}
                  </span>
                  {!row.reserve && (
                    <button
                      type="button"
                      onClick={() => onPick(row)}
                      title={t("useHint")}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-caption font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                        !isCur && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
                      )}
                    >
                      <CornerDownLeft className="size-3" />
                      {t("use")}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
            {plan.rows.length > visible.length || all ? (
              <button
                type="button"
                onClick={() => setAll((v) => !v)}
                className="text-caption font-medium text-foreground underline-offset-4 hover:underline"
              >
                {all ? t("showLess") : t("showAll", { count: plan.rows.length })}
              </button>
            ) : (
              <span />
            )}
            <Link
              href={lessonsHref}
              className="inline-flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
            >
              {t("openLessons")}
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
