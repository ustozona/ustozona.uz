"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { classTints } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import {
  buildLedger,
  findSubject,
  staffShort,
  type LedgerRow,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";
import type { ArmedCard } from "@/store/useSchoolTimetableStore";

/* ════════════════════════════════════════════════════════════════════
   QOLDIQ RELSI — daftar ham, karta manbai ham.

   ⭐ Ikki narsa ataylab BITTA obyekt (docs/dars-jadvali-spec.md §12.7):
   «7-A da fizikadan 2 soat qoldi» — bu ham hisobot, ham qoʻyiladigan
   karta. Zavuchning haqiqiy savoli aynan shu shaklda.

   Ayni paytda bu «Jami soat» ning jonli tomoni: nol boʻlganda jadval
   oʻquv rejasiga toʻliq mos.
   ════════════════════════════════════════════════════════════════════ */

export type LedgerRailProps = {
  doc: SchoolTimetableDoc;
  armed: ArmedCard;
  onArm: (card: ArmedCard) => void;
};

export default function LedgerRail({ doc, armed, onArm }: LedgerRailProps) {
  const rows = useMemo(() => buildLedger(doc), [doc]);

  const byClass = useMemo(() => {
    const map = new Map<string, LedgerRow[]>();
    for (const r of rows) {
      const list = map.get(r.classId);
      if (list) list.push(r);
      else map.set(r.classId, [r]);
    }
    /* Qolgan soati bor sinflar tepada — zavuch ish qoladigan joydan
       boshlaydi, alifbo tartibidan emas. */
    return Array.from(map.entries()).sort((a, b) => {
      const la = a[1].reduce((s, r) => s + Math.max(0, r.left), 0);
      const lb = b[1].reduce((s, r) => s + Math.max(0, r.left), 0);
      return lb - la;
    });
  }, [rows]);

  const total = rows.reduce((s, r) => s + Math.max(0, r.left), 0);

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-label">Qoldiq</h2>
        <p className="text-caption mt-0.5 leading-snug">
          Oʻquv rejasidan varaqqa qoʻyilmagan soatlar. Nol boʻlganda jadval toʻliq.
        </p>
        <div className="mt-3 flex items-baseline justify-between rounded-md border border-border px-3 py-2">
          <span className="text-caption">Qoʻyilmagan</span>
          <span className={cn("font-mono text-lg font-semibold tabular-nums", total === 0 && "text-success")}>
            {total}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-5 scrollbar-hover [scrollbar-width:thin]">
        {byClass.map(([classId, list]) => {
          const cls = doc.classes.find((c) => c.id === classId);
          const left = list.reduce((s, r) => s + Math.max(0, r.left), 0);
          return (
            <section key={classId}>
              <h3 className="text-label mt-4 flex items-baseline justify-between">
                <span>{cls?.name ?? classId}</span>
                <span className={cn(left === 0 && "text-success")}>
                  {left === 0 ? "toʻliq" : `${left} soat`}
                </span>
              </h3>

              {list
                .filter((r) => r.left !== 0)
                .map((r) => (
                  <LedgerCard
                    key={`${r.classId}-${r.subjectId}`}
                    doc={doc}
                    row={r}
                    armed={
                      armed != null && armed.classId === r.classId && armed.subjectId === r.subjectId
                    }
                    onArm={onArm}
                  />
                ))}

              {list.every((r) => r.left === 0) && (
                <p className="text-caption flex items-center gap-1.5 py-1">
                  <Check className="size-3.5 text-success" aria-hidden />
                  Reja bajarildi
                </p>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function LedgerCard({
  doc,
  row,
  armed,
  onArm,
}: {
  doc: SchoolTimetableDoc;
  row: LedgerRow;
  armed: boolean;
  onArm: (card: ArmedCard) => void;
}) {
  const subject = findSubject(doc, row.subjectId);
  const tints = subject ? classTints(subject.color) : null;
  const staff = doc.staff.find((s) => s.id === row.staffId);

  /* Xodim aniqlanmagan boʻlsa karta olinmaydi: dars kimga tegishli
     ekani nomaʼlum boʻlsa ziddiyat tekshiruvi ham maʼnosiz. */
  const ready = row.staffId != null;
  const over = row.left < 0;

  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={armed}
      onClick={() => onArm(armed ? null : { classId: row.classId, subjectId: row.subjectId, staffId: row.staffId! })}
      className={cn(
        "mb-1 flex w-full items-center gap-2 rounded-md border border-border bg-card py-1.5 pr-2 text-left transition-colors duration-fast",
        ready && "hover:border-muted-foreground/40",
        armed && "border-primary",
        !ready && "opacity-50"
      )}
    >
      <span
        aria-hidden
        className="h-8 w-[3px] shrink-0 rounded-r-sm"
        style={{ backgroundColor: tints?.solid }}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12px] font-semibold">{subject?.name ?? row.subjectId}</span>
        <span className="truncate text-[10.5px] text-muted-foreground">
          {staff ? staffShort(staff.name) : "oʻqituvchi belgilanmagan"}
        </span>
      </span>
      <span
        className={cn(
          "font-mono text-[12px] font-semibold tabular-nums",
          over && "text-destructive"
        )}
      >
        {over ? `+${-row.left}` : `${row.left} s`}
      </span>
    </button>
  );
}
