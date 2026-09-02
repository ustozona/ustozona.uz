"use client";

import { Lock, LockOpen, Move, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { classTints } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import {
  findClass,
  findStaff,
  findSubject,
  staffShort,
  DAY_NAMES,
  type Placement,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";
import type { Armed } from "@/store/useSchoolTimetableStore";

/* ════════════════════════════════════════════════════════════════════
   INSPEKTOR QATORI — DOIM turadi, hech qachon yoʻqolmaydi.

   ⚠️ Ilgari bu panel faqat dars tanlanganda chiqardi va butun toʻrni
   pastga surardi: zavuch katakni bosadi → toʻr sakraydi → bosmoqchi
   boʻlgan keyingi katak boshqa joyga koʻchgan boʻladi. 1200 katakli
   toʻrda bu jiddiy xato.

   Dizayn dasturlarining «properties panel» naqshi: panel doim bir
   joyda turadi va MAZMUNI oʻzgaradi — hech narsa tanlanmaganda hujjat
   darajasidagi maʼlumot, tanlanganda esa oʻsha element.

   Uch holat:
     • karta olingan  → qayerga qoʻyish mumkinligi (rang legendasi)
     • dars tanlangan → dars maʼlumoti + amallar
     • boʻsh          → hujjat holati
   ════════════════════════════════════════════════════════════════════ */

const LEGEND: { className: string; label: string }[] = [
  { className: "bg-success", label: "Boʻsh" },
  { className: "bg-warning", label: "Ehtiyot" },
  { className: "bg-destructive", label: "Band" },
  { className: "bg-muted-foreground/50", label: "Mumkin emas" },
];

export default function InspectorBar({
  doc,
  armed,
  selected,
  conflictCount,
  remaining,
  onMove,
  onToggleLock,
  onRemove,
  onClear,
}: {
  doc: SchoolTimetableDoc;
  armed: Armed;
  selected: Placement | null;
  conflictCount: number;
  remaining: number;
  onMove: () => void;
  onToggleLock: () => void;
  onRemove: () => void;
  onClear: () => void;
}) {
  /* Yuza `<Panel>` dan — `rounded-card`/`border-card`/`shadow-card`
     tokenlari orqali, qoʻlda `rounded-xl border` yozilmaydi (DESIGN.md
     §5). `Panel` default `flex-col`, bu yerda qator kerak.

     Balandlik QATʼIY (h-12): mazmun oʻzgarganda toʻr joyidan
     siljimaydi. */
  const shell = "h-12 flex-row items-center gap-3 px-5";

  /* 1. Karta olingan — nima qilish kerakligini aytadi. */
  if (armed) {
    const subject = findSubject(doc, armed.subjectId);
    const staff = findStaff(doc, armed.staffId);
    return (
      <Panel className={cn(shell, "border-primary")} role="status">
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-sm"
          style={{ backgroundColor: subject ? classTints(subject.color).solid : undefined }}
        />
        <span className="text-body font-semibold">
          {armed.kind === "move" ? "Koʻchirilmoqda" : subject?.name}
        </span>
        <span className="text-caption truncate">
          {staff ? staffShort(staff.name) : ""} · katakni bosing yoki strelkalar bilan yurib Enter
        </span>

        <div className="ml-auto flex items-center gap-4">
          {LEGEND.map((l) => (
            <span key={l.label} className="text-caption flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2.5 rounded-sm", l.className)} />
              {l.label}
            </span>
          ))}
          <Button variant="ghost" size="icon" aria-label="Bekor qilish" onClick={onClear}>
            <X />
          </Button>
        </div>
      </Panel>
    );
  }

  /* 2. Dars tanlangan — maʼlumot va amallar. */
  if (selected) {
    const subject = findSubject(doc, selected.subjectId);
    const staff = findStaff(doc, selected.staffId);
    return (
      <Panel className={shell}>
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-sm"
          style={{ backgroundColor: subject ? classTints(subject.color).solid : undefined }}
        />
        <span className="text-body font-semibold">{subject?.name ?? selected.subjectId}</span>
        <span className="text-caption truncate">
          {findClass(doc, selected.classId)?.name} · {DAY_NAMES[selected.day]},{" "}
          {selected.period}-soat · {staff ? staffShort(staff.name) : selected.staffId}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            disabled={selected.locked}
            onClick={onMove}
            title="Koʻchirish — soʻng katakni tanlang"
          >
            <Move />
            Koʻchirish
          </Button>
          <Button
            variant="ghost"
            onClick={onToggleLock}
            title={selected.locked ? "Qulfni ochish" : "Qulflash — ustiga qoʻyib boʻlmaydi"}
          >
            {selected.locked ? <Lock /> : <LockOpen />}
            {selected.locked ? "Qulflangan" : "Qulflash"}
          </Button>
          <Button
            variant="ghost"
            disabled={selected.locked}
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
            title={selected.locked ? "Avval qulfni oching" : "Oʻchirish (Delete)"}
          >
            <Trash2 />
            Oʻchirish
          </Button>
          <Button variant="ghost" size="icon" aria-label="Tanlovni bekor qilish" onClick={onClear}>
            <X />
          </Button>
        </div>
      </Panel>
    );
  }

  /* 3. Boʻsh — hujjat holati. */
  return (
    <Panel className={shell}>
      <span className="text-caption">
        {doc.classes.length} sinf · {doc.staff.length} oʻqituvchi · {doc.placements.length} dars
      </span>
      <span className="text-caption ml-auto flex items-center gap-5">
        <span className={cn(remaining > 0 && "text-warning")}>
          Qoʻyilmagan: <b className="font-semibold tabular-nums">{remaining}</b>
        </span>
        <span className={cn(conflictCount > 0 && "text-destructive")}>
          Ziddiyat: <b className="font-semibold tabular-nums">{conflictCount}</b>
        </span>
      </span>
    </Panel>
  );
}
