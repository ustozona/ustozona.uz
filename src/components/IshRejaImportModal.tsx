"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BookOpen, CalendarDays, Check, ChevronDown, ClipboardPaste, FilePlus2, FileSpreadsheet, FileText, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeaderBar, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { useLessonStore } from "@/store/useLessonStore";
import { commitLessonsDelete } from "@/lib/sync/lessons-delete";
import { lessonSessions, unitIdForClass, type Lesson } from "@/lib/lessons-data";
import { YearTimeline, mergeRanges, type TimelineBar, type TimelineLane } from "@/components/ish-reja/YearTimeline";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { getHolidayForDate } from "@/lib/academic-calendar";
import { addDaysKey, dateKeyToDate, dateToKey, todayKey } from "@/lib/date-keys";
import { fmtClock } from "@/lib/lesson-schedule";
import { MONTHS_UZ, MONTHS_UZ_SHORT } from "@/lib/localization";
import { uz } from "date-fns/locale";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { distributeTopics, classSlotsOn, slotKey, type PlannedSlot } from "@/lib/ish-reja/distribute";
import { ClassMultiPicker } from "@/components/ish-reja/ClassMultiPicker";
import { NameReviewList } from "@/components/ish-reja/NameReviewList";
import { ImportSummary, SourcePane, TemplateButton, useImportSource } from "@/components/ish-reja/ImportSource";

/* ════════════════════════════════════════════════════════════════════
   YANGI DARS — boʻlim ichidan; oqim va uslub «Yangi boʻlim» oynasi bilan bir xil:
   0) Tanlov — bitta dars (muharrir) / nusxa koʻchirish / Excel yuklash.
   1) Mavzular — tepada sinflar, chapda manba (tanlovga qarab matn yoki
      fayl), oʻngda jonli roʻyxat (sudrash, tuzatish). Matn va roʻyxat
      bir-biriga mos turadi.
   2) Jadval — ixtiyoriy joylash va saqlash.

   Hamma darslar ochilgan boʻlimga tushadi. Har mavzu = BITTA umumiy dars
   (koʻp-sinf modeli); qoʻshimcha sinflarda xuddi shu nomli boʻlim
   topiladi, yoʻq boʻlsa yaratiladi.

   Jadvalga joylash — standart «birinchi boʻsh dars»: har sinfda barcha
   boʻlimlarning eng oxirgi band darsidan keyingi (va hali oʻtmagan) slot.
   Qoʻlda sana tanlansa — shu kundan boshlab boʻsh slotlar olinadi.
   ════════════════════════════════════════════════════════════════════ */

type Step = "choice" | "topics" | "schedule";
/** «free» — har sinf oʻz birinchi boʻsh darsidan; aks holda tanlangan sana. */
type StartMode = { kind: "free" } | { kind: "date"; key: string };
type Threshold = { date: string; startMin: number };

export default function IshRejaImportModal({ classId, unitId, onSingle, onClose }: {
  classId: string;
  /** Darslar tushadigan boʻlim. */
  unitId: string;
  /** «Bitta dars» kartasi — odatiy yaratish (muharrirga oʻtadi). */
  onSingle: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("IshRejaImport");
  const units = useLessonStore((s) => s.units);

  const [step, setStep] = useState<Step>("choice");
  const [source, setSource] = useState<"paste" | "upload">("paste");
  const [classIds, setClassIds] = useState<string[]>([classId]);
  const src = useImportSource("topics", source);
  const rows = src.rows;

  const unit = units.find((u) => u.id === unitId);
  // Boʻlimda allaqachon bor mavzular — standart holatda oʻtkaziladi.
  const allLessons = useLessonStore((s) => s.lessons);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const normTitle = (v: string) => v.toLowerCase().replace(/\s+/g, " ").trim();
  const existingTitles = useMemo(
    () => new Set(allLessons.filter((l) => l.classId === classId && l.unitId === unitId).map((l) => normTitle(l.title))),
    [allLessons, classId, unitId],
  );
  const isDuplicate = (title: string) => existingTitles.has(normTitle(title));
  const duplicateCount = rows.filter((r) => r.title.trim() && isDuplicate(r.title)).length;
  const validRows = rows.filter((r) => r.title.trim() && !(skipDuplicates && isDuplicate(r.title)));

  /* ── Jadvalga joylash ── */
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const lessons = useLessonStore((s) => s.lessons);
  const [showDates, setShowDates] = useState(false);
  const [mode, setMode] = useState<StartMode>({ kind: "free" });

  const today = todayKey();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const eventsFor = (key: string) => resolveVersionForDate(versions, key)?.events ?? [];
  const yearStart = calendar.range.start || today;
  const yearEnd = calendar.range.end || addDaysKey(today, 366);
  const isHoliday = (key: string) => !!getHolidayForDate(calendar, key);
  /** Shu kuni sinfda dars bormi (oʻquv yili ichida, taʼtil emas). */
  const hasLesson = (key: string, cid: string) =>
    (!calendar.range.start || (key >= calendar.range.start && key <= calendar.range.end))
    && !isHoliday(key)
    && classSlotsOn(eventsFor(key), cid, key).length > 0;

  /** Har sinf: band slotlar, chegara (oxirgi band dars yoki hozir — qaysi keyin) va undan keyingi birinchi boʻsh dars kuni. */
  const perClass = useMemo(() => {
    const out: Record<string, { occupied: Set<string>; threshold: Threshold; freeKey: string | null }> = {};
    for (const cid of classIds) {
      const occupied = new Set<string>();
      let last: Threshold | null = null;
      for (const l of lessons) {
        for (const s of lessonSessions(l)) {
          if (s.classId !== cid) continue;
          occupied.add(slotKey(s.date, s.startMin));
          if (!last || s.date > last.date || (s.date === last.date && s.startMin > last.startMin)) last = { date: s.date, startMin: s.startMin };
        }
      }
      const threshold: Threshold = last && (last.date > today || (last.date === today && last.startMin > nowMin))
        ? last
        : { date: today, startMin: nowMin };
      let freeKey: string | null = null;
      for (let key = threshold.date; key <= yearEnd; key = addDaysKey(key, 1)) {
        if (!hasLesson(key, cid)) continue;
        const free = classSlotsOn(eventsFor(key), cid, key).some((e) =>
          !occupied.has(slotKey(key, e.startMin)) && (key > threshold.date || e.startMin > threshold.startMin));
        if (free) { freeKey = key; break; }
      }
      out[cid] = { occupied, threshold, freeKey };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classIds, lessons, versions, calendar, today, yearEnd]);

  const freeLessonKey = classIds.map((cid) => perClass[cid]?.freeKey).filter((k): k is string => !!k).sort()[0] ?? null;
  const nextLessonKey = useMemo(() => {
    for (let key = today; key <= yearEnd; key = addDaysKey(key, 1)) {
      if (classIds.some((cid) => hasLesson(key, cid)
        && (key > today || classSlotsOn(eventsFor(key), cid, key).some((e) => e.startMin > nowMin)))) return key;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, yearEnd, classIds, versions, calendar]);
  const firstLessonKey = useMemo(() => {
    for (let key = yearStart; key <= yearEnd; key = addDaysKey(key, 1)) {
      if (classIds.some((cid) => hasLesson(key, cid))) return key;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearStart, yearEnd, classIds, versions, calendar]);
  const shownStart = mode.kind === "free" ? freeLessonKey : mode.key;

  const plan = useMemo(() => {
    if (!shownStart) return null;
    const out: Record<string, (PlannedSlot | null)[]> = {};
    for (const cid of classIds) {
      const pc = perClass[cid];
      if (!pc) continue;
      const occupied = new Set(pc.occupied);
      let fromKey: string;
      if (mode.kind === "free") {
        if (!pc.freeKey) { out[cid] = validRows.map(() => null); continue; }
        fromKey = pc.freeKey;
        // Chegara kunida undan oldingi slotlar — oʻtgan yoki band dars ortida qolgan.
        if (fromKey === pc.threshold.date) {
          for (const e of classSlotsOn(eventsFor(fromKey), cid, fromKey)) if (e.startMin <= pc.threshold.startMin) occupied.add(slotKey(fromKey, e.startMin));
        }
      } else {
        fromKey = mode.key;
        if (fromKey === today) {
          for (const e of classSlotsOn(eventsFor(today), cid, today)) if (e.startMin <= nowMin) occupied.add(slotKey(today, e.startMin));
        }
      }
      out[cid] = distributeTopics({
        classId: cid, count: validRows.length, fromKey, toKey: yearEnd,
        eventsForDate: eventsFor, isHoliday, occupied,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownStart, mode, classIds, validRows.length, perClass, versions, calendar, yearEnd]);
  // Reja yoʻq (boʻsh dars soati qolmagan) — hech biri joylanmaydi.
  const missingCount = plan
    ? validRows.filter((_, i) => classIds.some((cid) => !plan[cid]?.[i])).length
    : validRows.length;

  /** `withPlan` false — «Sanasiz saqlash» yoki sinfda dars jadvali yoʻq. */
  function save(withPlan = true) {
    const store = useLessonStore.getState();
    // Qoʻshimcha sinflarda shu nomli boʻlim; yoʻq boʻlsa yaratiladi.
    const createdUnits: string[] = [];
    const createdLessons: string[] = [];
    const unitByClass: Record<string, string | null> = {};
    for (const cid of classIds) {
      if (cid === classId) { unitByClass[cid] = unitId; continue; }
      const found = useLessonStore.getState().units.find((u) => u.classId === cid && u.title === unit?.title);
      if (found) unitByClass[cid] = found.id;
      else {
        unitByClass[cid] = store.addUnit({ classId: cid, title: unit?.title ?? "", description: unit?.description });
        createdUnits.push(unitByClass[cid]!);
      }
    }

    let number = Math.max(0, ...store.lessons.filter((l) => l.classId === classId && l.unitId === unitId).map((l) => l.number));
    const now = new Date().toISOString();
    validRows.forEach((row, idx) => {
      const lesson: Lesson = {
        id: `l-${crypto.randomUUID().slice(0, 12)}`,
        classId,
        classIds: [...classIds],
        classCount: classIds.length,
        unitId,
        unitByClass: { ...unitByClass },
        number: ++number,
        title: row.title.trim(),
        status: "Unscheduled",
        scheduleByClass: {},
        updatedAt: now,
      };
      store.restoreLesson(lesson);
      createdLessons.push(lesson.id);
      if (withPlan && plan) {
        for (const cid of classIds) {
          const slot = plan[cid]?.[idx];
          if (slot) store.addScheduleForClass(lesson.id, cid, slot.date, slot.startMin, slot.endMin);
        }
      }
    });
    // Import — bitta amal: toastdagi «Bekor qilish» hammasini (darslar, yangi boʻlimlar) qaytaradi.
    toast.success(t("savedToast", { count: validRows.length }), {
      duration: 8000,
      action: {
        label: t("undo"),
        onClick: () => {
          const st = useLessonStore.getState();
          /* Xabar IIFE ICHIDA: oʻchirish serverda bajarilmasa
             «bekor qilindi» deyish yolgʻon boʻladi — yozuvlar joyida
             qoladi, foydalanuvchi esa aksincha ishonadi. Xato holatida
             `commitLessonsDelete` oʻz xabarini koʻrsatadi. */
          void (async () => {
            const ok = await commitLessonsDelete({ unitIds: createdUnits, lessonIds: createdLessons });
            if (!ok) return;
            createdLessons.forEach((id) => st.deleteLesson(id));
            createdUnits.forEach((id) => st.deleteUnit(id, { withLessons: false }));
            toast(t("undoneToast"));
          })();
        },
      },
    });
    onClose();
  }

  const PREVIEW_GRID = "grid grid-cols-[32px_1fr_150px] items-center gap-3 px-3";
  const hasTimetable = firstLessonKey !== null;
  const liveClasses = useLiveClasses();
  const primarySlots = (plan?.[classId] ?? []).filter((x): x is PlannedSlot => !!x);
  const planStart = primarySlots[0]?.date ?? null;
  const planEnd = primarySlots[primarySlots.length - 1]?.date ?? null;
  const lanes: TimelineLane[] = classIds.map((cid) => {
    const byUnit = new Map<string, { start: string; end: string }>();
    for (const l of lessons) {
      const uid = unitIdForClass(l, cid);
      if (!uid) continue;
      for (const ss of lessonSessions(l)) {
        if (ss.classId !== cid) continue;
        const cur = byUnit.get(uid);
        if (!cur) byUnit.set(uid, { start: ss.date, end: ss.date });
        else { if (ss.date < cur.start) cur.start = ss.date; if (ss.date > cur.end) cur.end = ss.date; }
      }
    }
    const bars: TimelineBar[] = [...byUnit].map(([uid, r]) => ({ key: uid, label: units.find((u) => u.id === uid)?.title ?? "", ...r }));
    const mine = (plan?.[cid] ?? []).filter((x): x is PlannedSlot => !!x);
    if (mine.length) bars.push({ key: "new", label: t("timelineNew", { unit: unit?.title ?? "", count: mine.length }), start: mine[0].date, end: mine[mine.length - 1].date, isNew: true });
    return { id: cid, name: liveClasses.find((c) => c.id === cid)?.name ?? "", bars };
  });
  const holidayRanges = mergeRanges(calendar.holidays.map((h) => h.range));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn("flex flex-col gap-0 overflow-hidden p-0", step === "choice" ? "sm:max-w-2xl" : "h-[min(780px,92vh)] sm:max-w-6xl")}
      >
        <DialogHeaderBar
          icon={<BookOpen className="size-[18px]" aria-hidden />}
          title={t("title")}
          description={t(`step.${step}`, { unit: unit?.title ?? "" })}
        />

        {step === "choice" && (
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">
            {([
              { key: "single", icon: <FilePlus2 className="size-6" />, onClick: onSingle },
              { key: "paste", icon: <ClipboardPaste className="size-6" />, onClick: () => { setSource("paste"); setStep("topics"); } },
              { key: "file", icon: <FileSpreadsheet className="size-6" />, onClick: () => { setSource("upload"); setStep("topics"); } },
            ] as const).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onClick}
                className="flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center transition-colors duration-fast ease-standard hover:border-primary hover:bg-primary/5"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">{c.icon}</span>
                <span className="heading-small">{t(`choice.${c.key}Title`)}</span>
                <span className="text-caption leading-snug">{t(`choice.${c.key}Description`)}</span>
              </button>
            ))}
          </div>
        )}

        {step === "topics" && (
          <>
          <div className="shrink-0 px-5 pt-5">
            <ClassMultiPicker label={t("classesLabel")} value={classIds} lockedId={classId} onChange={setClassIds} />
          </div>
          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
            {/* Chap — manba: matn yoki fayl (+ varaq/ustun moslash) */}
            <div className="flex min-h-0 flex-col gap-3 p-5">
              <SourcePane src={src} placeholder={t("pastePlaceholder")} />
            </div>

            {/* Oʻng — jonli roʻyxat: tartib, tuzatish, oʻchirish */}
            <div className="flex min-h-0 flex-col gap-3 p-5">
              <ImportSummary src={src} duplicates={duplicateCount} skipDuplicates={skipDuplicates} onSkipDuplicates={setSkipDuplicates} />
              {rows.length > 0 ? (
                <NameReviewList
                  rows={rows}
                  onChange={src.setRows}
                  isMuted={(r) => skipDuplicates && isDuplicate(r.title)}
                  badge={(r) => (isDuplicate(r.title) ? t("duplicateBadge") : null)}
                  label={t("listLabel", { count: validRows.length })}
                  placeholder={t("topicPlaceholder")}
                  deleteLabel={t("deleteRow")}
                />
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                  <ListOrdered className="size-6 text-muted-foreground" />
                  <span className="text-caption">{t("listEmpty")}</span>
                </div>
              )}
            </div>
          </div>
          </>
        )}

        {step === "schedule" && (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5 scrollbar-hover">
            {/* Xulosa */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t("statLessons")} value={String(validRows.length)} />
              <Stat label={t("statStart")} value={planStart ? fmtShortDate(planStart) : "—"} />
              <Stat label={t("statEnd")} value={planEnd ? fmtShortDate(planEnd) : "—"} />
              <Stat
                label={t("statFit")}
                value={missingCount > 0 ? t("statMissing", { count: missingCount }) : t("statFits")}
                tone={missingCount > 0 ? "warning" : "success"}
              />
            </div>

            {/* Oʻquv yili chizigʻi */}
            <YearTimeline
              start={yearStart}
              end={yearEnd}
              today={today}
              holidays={holidayRanges}
              lanes={lanes}
            />

            {/* Navbat boshlanishi */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span>{t("queueStart")}</span>
              <ScheduleStartPicker
                classIds={classIds}
                value={shownStart}
                minKey={yearStart}
                presets={[
                  { label: t("presetFree"), key: freeLessonKey, active: mode.kind === "free", onPick: () => setMode({ kind: "free" }) },
                  { label: t("presetNext"), key: nextLessonKey },
                  { label: t("presetFirst"), key: firstLessonKey },
                ]}
                hasLesson={hasLesson}
                onChange={(key) => setMode({ kind: "date", key })}
              />
              <span className="text-caption">{t(mode.kind === "free" ? "queueHintFree" : "queueHintDate")}</span>
            </div>

            {/* Har bir dars sanasi — yigʻiladi */}
            <div className="overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setShowDates((v) => !v)}
                className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm transition-colors duration-fast ease-standard hover:bg-muted/50"
              >
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-fast", showDates && "rotate-180")} />
                {t("showDates", { count: validRows.length })}
              </button>
              {showDates && (
                <div className="border-t border-border">
                  {validRows.map((r, i) => {
                    const slot = plan?.[classId]?.[i] ?? null;
                    return (
                      <div key={r.key} className={cn(PREVIEW_GRID, "min-h-10 border-b border-border py-2 last:border-b-0")}>
                        <span className="text-body tabular-nums text-muted-foreground">{i + 1}</span>
                        <span className="truncate text-body">{r.title}</span>
                        <span className={cn("truncate text-caption tabular-nums", slot ? "text-foreground" : "text-warning")}>
                          {slot ? `${fmtShortDate(slot.date)} · ${fmtClock(slot.startMin)}` : t("noSlot")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/20">
          {step === "choice" && <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>}
          {step === "topics" && (
            <>
              {source === "upload" && <TemplateButton kind="topics" example={[t("templateExample1"), t("templateExample2"), t("templateExample3")]} />}
              {source === "paste" && (
                <p className="flex items-start gap-2 self-center text-caption sm:mr-auto">
                  <FileText className="mt-0.5 size-3.5 shrink-0" />
                  {t("pasteHint")}
                </p>
              )}
              <Button variant="ghost" onClick={() => setStep("choice")}>{t("back")}</Button>
              {/* Dars jadvali yoʻq sinf — joylash bosqichi chiqmaydi */}
              {hasTimetable
                ? <Button disabled={!validRows.length} onClick={() => setStep("schedule")}>{t("next")}</Button>
                : <Button disabled={!validRows.length} onClick={() => save(false)}>{t("confirm", { count: validRows.length })}</Button>}
            </>
          )}
          {step === "schedule" && (
            <>
              <Button variant="ghost" className="text-muted-foreground sm:mr-auto" onClick={() => save(false)}>{t("saveUndated")}</Button>
              <Button variant="ghost" onClick={() => setStep("topics")}>{t("back")}</Button>
              <Button disabled={!validRows.length || !plan} onClick={() => save()}>{t("confirm", { count: validRows.length })}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <p className="text-caption">{label}</p>
      <p className={cn("mt-0.5 text-base font-semibold tabular-nums", tone === "success" && "text-success", tone === "warning" && "text-warning")}>{value}</p>
    </div>
  );
}

const WEEKDAYS_UZ = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];
/** "2026-09-17" → "Pa, 17-sen" (dars muharriridagi sana tanlagich uslubida). */
function fmtShortDate(key: string): string {
  const d = dateKeyToDate(key);
  return `${WEEKDAYS_UZ[d.getDay()]}, ${d.getDate()}-${MONTHS_UZ_SHORT[d.getMonth()]}`;
}

/* ── Boshlanish sanasi: dars muharriridagi kabi kalendar — dars bor kunlar
   sinf rangida (koʻp sinf boʻlsa boʻlingan doira), qolganlari oʻchiq.
   Tepada tezkor tugmalar: birinchi boʻsh / eng yaqin / oʻquv yilidagi birinchi dars. ── */
function ScheduleStartPicker({ classIds, value, minKey, presets, hasLesson, onChange }: {
  classIds: string[];
  value: string | null;
  minKey: string;
  presets: { label: string; key: string | null; active?: boolean; onPick?: () => void }[];
  hasLesson: (key: string, classId: string) => boolean;
  onChange: (key: string) => void;
}) {
  const t = useTranslations("IshRejaImport");
  const liveClasses = useLiveClasses();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(value ? dateKeyToDate(value) : new Date());
  const hexOf = (cid: string) => {
    const c = liveClasses.find((x) => x.id === cid);
    return c ? CLASS_COLOR_HEX[classColor(c)] : "var(--primary)";
  };
  const classesOn = (d: Date) => {
    const key = dateToKey(d);
    return classIds.filter((cid) => hasLesson(key, cid));
  };
  const pick = (key: string) => { onChange(key); setMonth(dateKeyToDate(key)); setOpen(false); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CalendarDays className="size-4" />
          {value ? t("scheduleFrom", { date: fmtShortDate(value) }) : t("schedulePickDate")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[300px] p-3">
        {/* Tezkor tanlovlar — roʻyxat: nom chapda, sana oʻngda, tanlangani ✓ */}
        <div className="-mx-1 mb-2 space-y-0.5 border-b border-border pb-2">
          {presets.map((pr) => {
            const on = pr.active ?? (!!pr.key && pr.key === value && !presets.some((x) => x.active));
            return (
              <button
                key={pr.label}
                type="button"
                disabled={!pr.key}
                onClick={() => { if (!pr.key) return; if (pr.onPick) { pr.onPick(); setMonth(dateKeyToDate(pr.key)); setOpen(false); } else pick(pr.key); }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
                  on && "bg-muted font-medium",
                )}
              >
                <Check className={cn("size-3.5 shrink-0", on ? "opacity-100" : "opacity-0")} />
                <span className="flex-1 truncate">{pr.label}</span>
                <span className="shrink-0 text-caption tabular-nums">{pr.key ? fmtShortDate(pr.key) : "—"}</span>
              </button>
            );
          })}
        </div>
        <Calendar
          mode="single"
          locale={uz}
          month={month}
          onMonthChange={setMonth}
          selected={value ? dateKeyToDate(value) : undefined}
          onSelect={(d) => { if (d) pick(dateToKey(d)); }}
          disabled={(d) => dateToKey(d) < minKey || classesOn(d).length === 0}
          formatters={{
            formatMonthDropdown: (d) => MONTHS_UZ[d.getMonth()],
            formatWeekdayName: (d) => WEEKDAYS_UZ[d.getDay()],
          }}
          components={{
            DayButton: (p: React.ComponentProps<typeof CalendarDayButton>) => {
              const hexes = classesOn(p.day.date).map(hexOf);
              const n = hexes.length;
              const style: React.CSSProperties | undefined = p.modifiers.selected
                ? { backgroundColor: "var(--foreground)", color: "var(--background)" }
                : n === 1
                  ? { backgroundColor: `color-mix(in srgb, ${hexes[0]} 22%, transparent)` }
                  : n > 1
                    ? { backgroundImage: `conic-gradient(${hexes.map((h, i) => `color-mix(in srgb, ${h} 26%, transparent) ${(i * 360) / n}deg ${((i + 1) * 360) / n}deg`).join(", ")})` }
                    : undefined;
              return <CalendarDayButton {...p} style={style}>{p.children}</CalendarDayButton>;
            },
          }}
          className="w-full p-0 [--cell-size:--spacing(8)]"
        />
      </PopoverContent>
    </Popover>
  );
}
