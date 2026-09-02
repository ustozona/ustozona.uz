"use client";

import { Fragment, useMemo } from "react";
import { classTints } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import {
  conflictSlotKeys,
  dropStateFor,
  findConflicts,
  findSubject,
  indexDoc,
  periodsForShift,
  placementsAt,
  slotKey,
  staffShort,
  DAY_NAMES,
  WORK_DAYS,
  type DropState,
  type Placement,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";
import type { ArmedCard } from "@/store/useSchoolTimetableStore";

/* ════════════════════════════════════════════════════════════════════
   ISH REJIMI — zich toʻr. Sinflar QATORDA, kun×soat USTUNDA.

   ⚠️ Bu chop etiladigan varaqqa TESKARI joylashuv va bu ataylab
   (docs/dars-jadvali-spec.md §12.2):

   Zavuchning asosiy savoli — «kim seshanba 3-soatda band». Shu
   joylashuvda javob BITTA USTUNNI koʻz bilan pastga kesib oʻtish
   bilan topiladi. Varaq joylashuvida esa u 33 ta ustunni gorizontal
   kezishni talab qiladi — ekranda skroll, yaʼni sekin.

   Katak eni ~30px: matn sigʻmaydi, shuning uchun RANGNING OʻZI
   maʼlumot boʻladi (§12.4) — bu yerda fan rangi katakni toʻldiradi,
   varaqda esa chap qirraga chekinadi.

   ⚠️ Toʻr BITTA SMENANI koʻrsatadi. Smenalarning dars soni har xil
   boʻlishi mumkin (6 va 7), toʻr esa hamma qator uchun bir xil ustun
   soniga ega — ikkalasini bitta toʻrga tiqish uzun smenaning oxirgi
   soatlarini jimgina yashirardi (ular qoldiq va ziddiyat sanogʻida
   qolgan holda). Smena almashtirgichi sahifa sarlavhasida.
   ════════════════════════════════════════════════════════════════════ */

const CELL_W = 30;
const CELL_H = 27;
const ROW_HEAD_W = 62;

export type WorkGridProps = {
  doc: SchoolTimetableDoc;
  /** Koʻrsatilayotgan smena — ustunlar va qatorlar shundan olinadi. */
  shift: 1 | 2;
  armed: ArmedCard;
  /** Yoritilgan xodim — tanlanganda qolgan kataklar soʻnadi. */
  litStaffId: string | null;
  /** Tanlangan dars — muharrir panelida koʻrinadi. */
  selectedId: string | null;
  onPlace: (input: { classId: string; day: number; period: number; shift: 1 | 2 }) => void;
  onSelect: (placement: Placement) => void;
};

export default function WorkGrid({
  doc,
  shift,
  armed,
  litStaffId,
  selectedId,
  onPlace,
  onSelect,
}: WorkGridProps) {
  const index = useMemo(() => indexDoc(doc), [doc]);
  const clashKeys = useMemo(() => conflictSlotKeys(findConflicts(doc, index)), [doc, index]);

  /* Ustunlar — KOʻRSATILAYOTGAN smenaning oʻz periodlari. */
  const periods = useMemo(
    () => periodsForShift(doc, shift).map((p) => p.index),
    [doc, shift]
  );
  const classes = useMemo(
    () => doc.classes.filter((c) => c.shift === shift),
    [doc.classes, shift]
  );

  const cols = WORK_DAYS.length * periods.length;

  if (periods.length === 0 || classes.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-caption">Bu smenada sinf yoʻq.</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card scrollbar-hover [scrollbar-width:thin]">
      <div
        className="grid w-max"
        style={{ gridTemplateColumns: `${ROW_HEAD_W}px repeat(${cols}, ${CELL_W}px)` }}
      >
        {/* Kun sarlavhalari */}
        <div className="sticky left-0 top-0 z-30 border-b border-r border-border bg-card" />
        {WORK_DAYS.map((day) => (
          <div
            key={`d${day}`}
            className="text-label sticky top-0 z-20 truncate border-b border-r border-border bg-card px-1 py-1.5 text-center"
            style={{ gridColumn: `span ${periods.length}` }}
          >
            {DAY_NAMES[day]}
          </div>
        ))}

        {/* Soat raqamlari */}
        <div className="sticky left-0 top-[26px] z-30 border-b border-r border-border bg-card" />
        {WORK_DAYS.map((day) =>
          periods.map((p) => (
            <div
              key={`p${day}-${p}`}
              className={cn(
                "text-micro sticky top-[26px] z-20 border-b border-border bg-card py-0.5 text-center text-muted-foreground",
                p === periods.length && "border-r"
              )}
            >
              {p}
            </div>
          ))
        )}

        {/* Sinf qatorlari */}
        {classes.map((cls) => (
          <Fragment key={cls.id}>
            <div className="sticky left-0 z-10 flex items-center border-b border-r border-border bg-card px-2 text-[11px] font-semibold">
              {cls.name}
            </div>
            {WORK_DAYS.map((day) =>
              periods.map((p) => {
                const here = placementsAt(index, cls.id, day, cls.shift, p);
                const key = slotKey(cls.id, day, cls.shift, p);
                const isClash = clashKeys.has(key);

                let drop: DropState | null = null;
                if (armed && armed.classId === cls.id) {
                  drop = dropStateFor(doc, index, {
                    classId: cls.id,
                    subjectId: armed.subjectId,
                    staffId: armed.staffId,
                    day,
                    shift: cls.shift,
                    period: p,
                  }).state;
                }

                const dim =
                  (armed != null && drop == null) ||
                  (litStaffId != null && !here.some((x) => x.staffId === litStaffId));

                return (
                  <WorkCell
                    key={key}
                    doc={doc}
                    here={here}
                    isClash={isClash}
                    drop={drop}
                    dim={dim}
                    lit={litStaffId != null && here.some((x) => x.staffId === litStaffId)}
                    selectedId={selectedId}
                    lastOfDay={p === periods[periods.length - 1]}
                    onPlace={() => onPlace({ classId: cls.id, day, period: p, shift })}
                    onSelect={onSelect}
                  />
                );
              })
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* ─── Katak ─────────────────────────────────────────────────────────── */

const DROP_CLASS: Record<DropState, string> = {
  ok: "bg-success/12 ring-1 ring-inset ring-success",
  caution: "bg-warning/15 ring-1 ring-inset ring-warning",
  clash: "bg-destructive/12 ring-1 ring-inset ring-destructive",
  blocked: "bg-muted",
  occupied: "",
};

function WorkCell({
  doc,
  here,
  isClash,
  drop,
  dim,
  lit,
  selectedId,
  lastOfDay,
  onPlace,
  onSelect,
}: {
  doc: SchoolTimetableDoc;
  here: Placement[];
  isClash: boolean;
  drop: DropState | null;
  dim: boolean;
  lit: boolean;
  selectedId: string | null;
  lastOfDay: boolean;
  onPlace: () => void;
  onSelect: (p: Placement) => void;
}) {
  const base = cn(
    "relative border-b border-border transition-opacity duration-fast",
    lastOfDay && "border-r",
    dim && "opacity-25",
    drop && drop !== "occupied" && DROP_CLASS[drop]
  );

  if (here.length === 0) {
    const canPlace = drop === "ok" || drop === "caution";
    return (
      <button
        type="button"
        aria-label="Boʻsh katak"
        disabled={!canPlace}
        onClick={onPlace}
        className={cn(base, "w-full", canPlace && "cursor-pointer", !canPlace && "cursor-default")}
        style={{ height: CELL_H }}
      />
    );
  }

  return (
    <div className={cn(base, "flex", isClash && "ring-[1.5px] ring-inset ring-destructive")} style={{ height: CELL_H }}>
      {here.map((p) => {
        const subject = findSubject(doc, p.subjectId);
        const tints = subject ? classTints(subject.color) : null;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            title={`${subject?.name ?? "—"} · ${staffShort(doc.staff.find((s) => s.id === p.staffId)?.name ?? "")}`}
            style={{ ...(tints?.chipFill ?? {}), ...(tints?.textOnTint ?? {}) }}
            aria-pressed={selectedId === p.id}
            className={cn(
              "text-micro relative flex flex-1 items-center justify-center overflow-hidden",
              here.length > 1 && "border-l border-dashed border-border first:border-l-0",
              lit && "ring-[1.5px] ring-inset ring-primary",
              selectedId === p.id && "ring-2 ring-inset ring-foreground"
            )}
          >
            {subject?.short ?? "—"}
            {p.locked && (
              <span
                aria-hidden
                className="absolute right-0 top-0 size-1.5 rounded-bl-sm bg-foreground/45"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
