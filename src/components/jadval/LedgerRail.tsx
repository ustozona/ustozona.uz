"use client";

import { useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Check, PackageOpen } from "lucide-react";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import { classTints } from "@/lib/class-colors";
import { DEFAULT_SUBJECT_ICON, SUBJECT_ICONS } from "@/lib/subject-icons";
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
   karta.

   Qator anatomiyasi — loyihaning «Karta pasporti» tili:
     rangli ikona doirasi · nom + oʻqituvchi · qolgan soat · progress

   Progress «reja qancha bajarildi» ni koʻrsatadi. Sabab: «2 soat qoldi»
   yolgʻiz oʻzi kam gapiradi — 2/2 (hech narsa qoʻyilmagan) va 2/7
   (deyarli tugagan) butunlay boshqa holat, raqam esa ikkalasida bir xil.
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
    <Panel className="h-full">
      <PanelHeader>
        <div className="flex min-w-0 items-center gap-2.5 justify-self-start">
          <SectionIcon className="shrink-0">
            <PackageOpen />
          </SectionIcon>
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <CardTitle className="truncate">Qoldiq</CardTitle>
              <TypographyMuted className="shrink-0 text-sm tabular-nums">{total}</TypographyMuted>
            </div>
            <CardDescription className="truncate">Qoʻyilmagan soatlar</CardDescription>
          </div>
        </div>
      </PanelHeader>

      <PanelBody className="px-5 pb-5 pt-5">
        {pending.length === 0 ? (
          <p className="text-body flex items-center gap-2 text-success">
            <Check className="size-4 shrink-0" aria-hidden />
            Reja toʻliq bajarildi
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {pending.map(([classId, list]) => {
              const cls = doc.classes.find((c) => c.id === classId);
              const left = list.reduce((s, r) => s + Math.max(0, r.left), 0);
              return (
                <section key={classId}>
                  <h3 className="text-label mb-2 flex items-baseline justify-between">
                    <span>{cls?.name ?? classId}</span>
                    <span className="tabular-nums">{left} soat</span>
                  </h3>
                  {/* Qatorlar ajratgich chiziq bilan — bloklar orasida
                      boʻshliq emas: zich roʻyxatda chiziq tinchroq. */}
                  <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
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
  const Icon = SUBJECT_ICONS[row.subjectId] ?? DEFAULT_SUBJECT_ICON;

  /* Xodim aniqlanmagan boʻlsa karta olinmaydi: dars kimga tegishli
     ekani nomaʼlum boʻlsa ziddiyat tekshiruvi ham maʼnosiz. */
  const ready = row.staffId != null;
  const over = row.left < 0;
  const done = row.planned > 0 ? Math.min(100, (row.placed / row.planned) * 100) : 0;

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
        "flex w-full flex-col gap-2 bg-card p-3 text-left transition-colors duration-fast",
        ready && "cursor-grab hover:bg-muted/50",
        armed && "bg-primary/8 ring-1 ring-inset ring-primary",
        isDragging && DRAGGING,
        !ready && "opacity-50"
      )}
    >
      <span className="flex items-center gap-3">
        {/* Rangli ikona doirasi — fan rangidan hosila, dark mode avtomatik. */}
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full"
          style={tints?.iconBg}
        >
          <Icon className="size-4" style={tints?.iconText} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="heading-small truncate">{subject?.name ?? row.subjectId}</span>
          <span className="text-caption truncate">
            {staff ? staffShort(staff.name) : "oʻqituvchi belgilanmagan"}
          </span>
        </span>
        <span
          className={cn("text-caption font-semibold tabular-nums", over && "text-destructive")}
        >
          {over ? `+${-row.left}` : `${row.left} s`}
        </span>
      </span>

      {/* Reja bajarilishi — «2 soat qoldi» ning konteksti. */}
      <span
        className="relative block h-1 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${row.placed} / ${row.planned} soat qoʻyilgan`}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${done}%`, backgroundColor: tints?.solid }}
        />
      </span>
    </button>
  );
}
