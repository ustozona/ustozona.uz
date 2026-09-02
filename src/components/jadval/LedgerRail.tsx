"use client";

import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Check, PackageOpen } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { classTints } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import {
  buildLedger,
  findSubject,
  staffShort,
  type LedgerRow,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";
import type { Armed } from "@/store/useSchoolTimetableStore";
import { cardDndId } from "./dnd-ids";
import { DRAGGING } from "./cell-styles";

/* ════════════════════════════════════════════════════════════════════
   QOLDIQ RELSI — daftar ham, karta manbai ham.

   ⭐ Ikki narsa ataylab BITTA obyekt (docs/dars-jadvali-spec.md §12.7):
   «7-A da fizikadan 2 soat qoldi» — bu ham hisobot, ham qoʻyiladigan
   karta. Zavuchning haqiqiy savoli aynan shu shaklda.

   Yuza `<Panel>` dan (DESIGN.md §5): qoʻlda `rounded-xl border bg-card`
   yozilsa, panel tili oʻzgarganda bu joy ortda qolib ketadi.
   ════════════════════════════════════════════════════════════════════ */

export type LedgerRailProps = {
  doc: SchoolTimetableDoc;
  armed: Armed;
  onArm: (card: Armed) => void;
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
  const pending = byClass.filter(([, list]) => list.some((r) => r.left !== 0));

  return (
    <Panel className="w-64 shrink-0">
      <PanelHeader>
        <div className="flex min-w-0 items-center gap-2.5 justify-self-start">
          <SectionIcon className="shrink-0">
            <PackageOpen />
          </SectionIcon>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <CardTitle className="truncate">Qoldiq</CardTitle>
            <TypographyMuted className="shrink-0 text-sm tabular-nums">{total}</TypographyMuted>
          </div>
        </div>
      </PanelHeader>

      <PanelBody className="px-5 pb-5 pt-5">
        <p className="text-caption mb-4">
          Oʻquv rejasidan varaqqa qoʻyilmagan soatlar. Kartani sudrang yoki bosib oling.
        </p>

        {pending.length === 0 ? (
          <p className="text-body flex items-center gap-2 text-success">
            <Check className="size-4 shrink-0" aria-hidden />
            Reja toʻliq bajarildi
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map(([classId, list]) => {
              const cls = doc.classes.find((c) => c.id === classId);
              const left = list.reduce((s, r) => s + Math.max(0, r.left), 0);
              return (
                <section key={classId}>
                  <h3 className="text-label mb-2 flex items-baseline justify-between">
                    <span>{cls?.name ?? classId}</span>
                    <span className="tabular-nums">{left} soat</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {list
                      .filter((r) => r.left !== 0)
                      .map((r) => (
                        <LedgerCard
                          key={`${r.classId}-${r.subjectId}`}
                          doc={doc}
                          row={r}
                          armed={
                            armed != null &&
                            armed.kind === "new" &&
                            armed.classId === r.classId &&
                            armed.subjectId === r.subjectId
                          }
                          onArm={onArm}
                        />
                      ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </PanelBody>
    </Panel>
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
  onArm: (card: Armed) => void;
}) {
  const subject = findSubject(doc, row.subjectId);
  const tints = subject ? classTints(subject.color) : null;
  const staff = doc.staff.find((s) => s.id === row.staffId);

  /* Xodim aniqlanmagan boʻlsa karta olinmaydi: dars kimga tegishli
     ekani nomaʼlum boʻlsa ziddiyat tekshiruvi ham maʼnosiz. */
  const ready = row.staffId != null;
  const over = row.left < 0;

  const card: Armed = ready
    ? { kind: "new", classId: row.classId, subjectId: row.subjectId, staffId: row.staffId! }
    : null;

  /* Kartani sudrash — «backlog panel → jadval» naqshi. Klaviatura yoʻli
     ham qoladi: bosib «olib» keyin toʻrda Enter bilan qoʻyish (§12.6). */
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: cardDndId(row.classId, row.subjectId, row.staffId ?? ""),
    disabled: !ready,
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      disabled={!ready}
      aria-pressed={armed}
      onClick={() => onArm(armed ? null : card)}
      className={cn(
        /* Zich karta: 12px padding, 12px ichki gap (DESIGN.md §7). */
        "flex w-full items-center gap-3 rounded-md border border-border bg-card py-3 pr-3 text-left transition-colors duration-fast",
        ready && "cursor-grab hover:border-muted-foreground/40",
        armed && "border-primary",
        isDragging && DRAGGING,
        !ready && "opacity-50"
      )}
    >
      <span
        aria-hidden
        className="h-8 w-[3px] shrink-0 rounded-r-sm"
        style={{ backgroundColor: tints?.solid }}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="heading-small truncate">{subject?.name ?? row.subjectId}</span>
        <span className="text-caption truncate">
          {staff ? staffShort(staff.name) : "oʻqituvchi belgilanmagan"}
        </span>
      </span>
      <span className={cn("text-caption font-semibold tabular-nums", over && "text-destructive")}>
        {over ? `+${-row.left}` : `${row.left} s`}
      </span>
    </button>
  );
}
