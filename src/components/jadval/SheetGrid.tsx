"use client";

import { Fragment, useMemo } from "react";
import { classTints } from "@/lib/class-colors";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { minToHHMM } from "@/lib/calendar-core/date-math";
import {
  conflictSlotKeys,
  dropStateFor,
  findConflicts,
  findStaff,
  findSubject,
  hoursTotals,
  indexDoc,
  periodsOf,
  placementsAt,
  slotKey,
  staffShort,
  DAY_NAMES,
  WORK_DAYS,
  type DropState,
  type Placement,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";
import type { Armed } from "@/store/useSchoolTimetableStore";
import { CLASH_RING, DIMMED, DROP_CLASS, LIT_RING, SELECTED_RING } from "./cell-styles";

/* ════════════════════════════════════════════════════════════════════
   VARAQ REJIMI — devorga osiladigan koʻrinish. Sinflar USTUNDA,
   kunlar QATORDA — haqiqiy A1 varaqdagidek.

   Bu tahrir emas, TEKSHIRISH va TASDIQLASH rejimi. Ish rejimi bilan
   bitta hujjatning ikki oʻqilishi (docs/dars-jadvali-spec.md §12.2).

   Zichlik uch daraja (§12.3):
     butun — faqat fan rangi, haftaning naqshi
     fan   — fan nomi
     toʻliq— fan + oʻqituvchi
   «Butun» ayni paytda chop etish koʻrinishi.
   ════════════════════════════════════════════════════════════════════ */

export type SheetDensity = "butun" | "fan" | "toliq";

/**
 * Uchta NOMLANGAN zichlik rejimi.
 *
 * ⚠️ Ustun kengligi mazmunga qarab tanlangan, aksincha emas. Ilgari
 * «fan» rejimi 62px ustunda toʻliq fan nomini koʻrsatishga urinardi va
 * natijada hamma katakda «Matemat…», «Geografi…», «Jismoniy…» chiqardi —
 * kesilgan matn maʼlumot bermaydi, faqat shovqin qiladi.
 *
 * Endi: «fan» — 3 harfli KOD (kesilmaydi), «toʻliq» — nom + oʻqituvchi
 * uchun yetarli keng ustun.
 */
const DENSITY: Record<SheetDensity, { col: number; row: number }> = {
  butun: { col: 36, row: 22 },
  fan: { col: 56, row: 30 },
  toliq: { col: 116, row: 44 },
};

export type SheetGridProps = {
  doc: SchoolTimetableDoc;
  density: SheetDensity;
  armed: Armed;
  litStaffId: string | null;
  /** Tanlangan dars — muharrir panelida koʻrinadi. */
  selectedId: string | null;
  approved?: boolean;
  onPlace: (input: { classId: string; day: number; period: number; shift: 1 | 2 }) => void;
  onSelect: (placement: Placement) => void;
};

export default function SheetGrid({
  doc,
  density,
  armed,
  litStaffId,
  selectedId,
  approved = false,
  onPlace,
  onSelect,
}: SheetGridProps) {
  const index = useMemo(() => indexDoc(doc), [doc]);
  const clashKeys = useMemo(() => conflictSlotKeys(findConflicts(doc, index)), [doc, index]);
  const periods = useMemo(() => periodsOf(doc), [doc]);
  const totals = useMemo(() => hoursTotals(doc), [doc]);
  const d = DENSITY[density];

  return (
    <Panel className="min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-auto p-5 scrollbar-hover [scrollbar-width:thin]">
      <div className="relative inline-block min-w-full">
        <header className="mb-4 text-center">
          <p className="text-label">Tasdiqlayman · maktab direktori</p>
          <h2 className="heading-section mt-1 uppercase tracking-wider">
            {doc.schoolName || "Maktab"} — dars jadvali
          </h2>
          {doc.periodLabel && <p className="text-caption mt-0.5">{doc.periodLabel}</p>}
        </header>

        <div
          className="grid w-max border-l border-t border-border"
          style={{ gridTemplateColumns: `26px 44px repeat(${doc.classes.length}, ${d.col}px)` }}
        >
          {/* Sinf sarlavhalari */}
          <div className="sticky top-0 z-20 border-b border-r border-border bg-card" />
          <div className="sticky top-0 z-20 border-b border-r border-border bg-card" />
          {doc.classes.map((c) => (
            <div
              key={c.id}
              className="text-micro sticky top-0 z-20 truncate border-b border-r border-border bg-card px-1 py-1.5 text-center font-bold text-foreground"
              title={c.name}
            >
              {c.name}
            </div>
          ))}

          {WORK_DAYS.map((day) => (
            <Fragment key={day}>
              <div
                className="text-label flex items-center justify-center border-b border-r border-border bg-card"
                style={{ gridRow: `span ${periods.length}`, writingMode: "vertical-rl", rotate: "180deg" }}
              >
                {DAY_NAMES[day]}
              </div>

              {periods.map((per) => (
                <Fragment key={`${day}-${per.shift}-${per.index}`}>
                  <div className="text-micro flex flex-col items-center justify-center border-b border-r border-border bg-card text-muted-foreground">
                    <span>{per.index}</span>
                    {density !== "butun" && (
                      <span className="text-micro text-muted-foreground">{minToHHMM(per.startMin)}</span>
                    )}
                  </div>

                  {doc.classes.map((cls) => {
                    const key = slotKey(cls.id, day, per.shift, per.index);
                    const here =
                      cls.shift === per.shift
                        ? placementsAt(index, cls.id, day, per.shift, per.index)
                        : [];

                    let drop: DropState | null = null;
                    if (armed && armed.classId === cls.id) {
                      drop = dropStateFor(doc, index, {
                        classId: cls.id,
                        subjectId: armed.subjectId,
                        staffId: armed.staffId,
                        day,
                        shift: per.shift,
                        period: per.index,
                        ignorePlacementId:
                          armed.kind === "move" ? armed.placementId : undefined,
                      }).state;
                    }

                    const dim =
                      (armed != null && drop == null) ||
                      (litStaffId != null && !here.some((x) => x.staffId === litStaffId));

                    return (
                      <SheetCell
                        key={key}
                        doc={doc}
                        here={here}
                        density={density}
                        height={d.row}
                        isClash={clashKeys.has(key)}
                        drop={drop}
                        dim={dim}
                        lit={litStaffId != null && here.some((x) => x.staffId === litStaffId)}
                        selectedId={selectedId}
                        onPlace={() =>
                          onPlace({ classId: cls.id, day, period: per.index, shift: per.shift })
                        }
                        onSelect={onSelect}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </Fragment>
          ))}

          {/* «Jami soat» — oʻquv rejasiga moslik (§12.7) */}
          <div
            className="text-label flex items-center justify-end border-b border-r border-t border-border bg-card px-2"
            style={{ gridColumn: "1 / span 2" }}
          >
            Jami soat
          </div>
          {doc.classes.map((c) => {
            const t = totals.find((x) => x.classId === c.id);
            const short = t ? t.placed < t.planned : false;
            return (
              <div
                key={c.id}
                className={cn(
                  "text-micro flex items-center justify-center border-b border-r border-t border-border bg-card py-1",
                  short && "text-destructive"
                )}
              >
                {t ? `${t.placed}/${t.planned}` : "—"}
              </div>
            );
          })}

          <div
            className="text-label flex items-center justify-end border-b border-r border-border bg-card px-2"
            style={{ gridColumn: "1 / span 2" }}
          >
            Sinf rahbari
          </div>
          {doc.classes.map((c) => {
            const homeroom = doc.staff.find((s) => s.homeroomOf === c.id);
            return (
              <div
                key={c.id}
                className="text-micro flex items-center justify-center truncate border-b border-r border-border bg-card px-1 py-1 font-normal"
              >
                {homeroom ? staffShort(homeroom.name) : "—"}
              </div>
            );
          })}
        </div>

        <SignatureBlock />

        {approved && (
          <div
            aria-hidden
            className="pointer-events-none absolute right-8 top-4 flex size-28 -rotate-12 flex-col items-center justify-center rounded-full border-2 border-primary text-primary opacity-80"  /* muhr siyohi — ataylab shaffof */
          >
            <span className="text-micro font-bold uppercase tracking-widest">Tasdiqlandi</span>
            <span className="text-caption font-bold uppercase tracking-wide text-primary">Direktor</span>
          </div>
        )}
        </div>
      </div>
    </Panel>
  );
}

/* ─── Katak ─────────────────────────────────────────────────────────── */

function SheetCell({
  doc,
  here,
  density,
  height,
  isClash,
  drop,
  dim,
  lit,
  selectedId,
  onPlace,
  onSelect,
}: {
  doc: SchoolTimetableDoc;
  here: Placement[];
  density: SheetDensity;
  height: number;
  isClash: boolean;
  drop: DropState | null;
  dim: boolean;
  lit: boolean;
  selectedId: string | null;
  onPlace: () => void;
  onSelect: (p: Placement) => void;
}) {
  const base = cn(
    "relative border-b border-r border-border transition-opacity duration-fast",
    dim && DIMMED,
    isClash && CLASH_RING,
    lit && LIT_RING,
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
        className={cn(base, "w-full")}
        style={{ height }}
      />
    );
  }

  return (
    <div className={cn(base, "flex")} style={{ height }}>
      {here.map((p) => {
        const subject = findSubject(doc, p.subjectId);
        const staff = findStaff(doc, p.staffId);
        const tints = subject ? classTints(subject.color) : null;

        /* «Butun» zichligida rang butun katakni egallaydi — matn
           koʻrinmagach fon oʻzi maʼlumot boʻladi (§12.4). */
        if (density === "butun") {
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              title={subject?.name}
              style={tints?.chipFill}
              className={cn("flex-1", selectedId === p.id && SELECTED_RING)}
            />
          );
        }

        /* «Fan» — 3 harfli kod, kesilmaydi. «Toʻliq» — nom + oʻqituvchi. */
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            title={`${subject?.name ?? ""} · ${staff?.name ?? ""}`}
            aria-pressed={selectedId === p.id}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-1 overflow-hidden px-0 text-left",
              here.length > 1 && "border-l border-dashed border-border first:border-l-0",
              selectedId === p.id && SELECTED_RING
            )}
          >
            <span
              aria-hidden
              className="h-full w-[3px] shrink-0"
              style={{ backgroundColor: tints?.solid }}
            />
            <span className="flex min-w-0 flex-col justify-center pr-1">
              <span className="text-micro truncate">
                {density === "fan" ? (subject?.short ?? "—") : (subject?.name ?? "—")}
              </span>
              {density === "toliq" && staff && (
                <span className="text-micro truncate font-normal text-muted-foreground">
                  {staffShort(staff.name)}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SignatureBlock() {
  const rows = [
    "Oʻquv ishlari boʻyicha direktor oʻrinbosari",
    "Oʻquv ishlari boʻyicha (0,5)",
    "Maʼnaviy-maʼrifiy ishlar boʻyicha",
    "Maktab psixologi",
  ];
  return (
    <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-3">
      {rows.map((r) => (
        <div key={r} className="text-caption">
          {r}
          <span className="mt-2 block min-w-32 border-t border-border pt-1" />
        </div>
      ))}
    </div>
  );
}
