"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Lock, LockOpen, Redo2, Sparkles, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { classTints } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import {
  findClass,
  findConflicts,
  findStaff,
  findSubject,
  staffShort,
  DAY_NAMES,
  type Placement,
} from "@/lib/school-timetable";
import { demoDoc } from "@/lib/school-timetable-demo";
import { useSchoolTimetableStore } from "@/store/useSchoolTimetableStore";
import LedgerRail from "./LedgerRail";
import SheetGrid, { type SheetDensity } from "./SheetGrid";
import WorkGrid from "./WorkGrid";

/* ════════════════════════════════════════════════════════════════════
   `/jadval` ISH MAYDONI — zavuch quroli.

   ⛔ DASHBOARDGA BOGʻLANMAYDI. Bu yerda `useTimetableStore`,
   `useGradesStore` yoki dashboard komponentlari import qilinmaydi.
   Ikki mahsulot orasidagi yagona koʻprik — nashr amali
   (docs/dars-jadvali-spec.md §9).

   Mehmon rejimi: kirish soʻralmaydi, hujjat `localStorage` da yashaydi
   (§3.1). Serverga saqlash keyingi bosqichda.
   ════════════════════════════════════════════════════════════════════ */

type Mode = "ish" | "varaq";

export default function JadvalWorkspace() {
  const doc = useSchoolTimetableStore((s) => s.doc);
  const hydrated = useSchoolTimetableStore((s) => s._hasHydrated);
  const armed = useSchoolTimetableStore((s) => s.armed);
  const dirty = useSchoolTimetableStore((s) => s.dirty);
  const arm = useSchoolTimetableStore((s) => s.arm);
  const place = useSchoolTimetableStore((s) => s.place);
  const remove = useSchoolTimetableStore((s) => s.remove);
  const toggleLock = useSchoolTimetableStore((s) => s.toggleLock);
  const undo = useSchoolTimetableStore((s) => s.undo);
  const redo = useSchoolTimetableStore((s) => s.redo);
  const loadDoc = useSchoolTimetableStore((s) => s.loadDoc);
  const past = useSchoolTimetableStore((s) => s.past);
  const future = useSchoolTimetableStore((s) => s.future);

  const [mode, setMode] = useState<Mode>("ish");
  const [density, setDensity] = useState<SheetDensity>("toliq");
  const [litStaffId, setLitStaffId] = useState<string | null>(null);
  const [showClashes, setShowClashes] = useState(false);
  const [shift, setShift] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* Birinchi kirish — demo jadval. Boʻsh toʻr «bu nima?» degan savol
     qoldiradi, toʻla jadval esa darhol javob beradi. */
  useEffect(() => {
    if (hydrated && doc.classes.length === 0) loadDoc(demoDoc());
  }, [hydrated, doc.classes.length, loadDoc]);

  const conflicts = useMemo(() => findConflicts(doc), [doc]);
  const selected = useMemo(
    () => doc.placements.find((p) => p.id === selectedId) ?? null,
    [doc.placements, selectedId]
  );
  const twoShift = doc.bell.profile === "double";

  /* Klaviatura — sudrash yolgʻiz yetarli emas (§12.6). */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        arm(null);
        setSelectedId(null);
      }
      /* Tanlangan darsni oʻchirish — ATAYLAB klaviatura orqali.
         Bosish oʻchirmaydi (pastdagi `handleSelect` izohiga qarang). */
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const el = document.activeElement;
        const typing =
          el instanceof HTMLElement &&
          (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
        if (!typing) {
          e.preventDefault();
          remove(selectedId);
          setSelectedId(null);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [arm, undo, redo, remove, selectedId]);

  const staffOptions = useMemo(
    () => [...doc.staff].sort((a, b) => a.name.localeCompare(b.name, "uz")),
    [doc.staff]
  );

  function handlePlace(input: { classId: string; day: number; period: number; shift?: 1 | 2 }) {
    if (!armed) return;
    const cls = doc.classes.find((c) => c.id === input.classId);
    if (!cls) return;
    place({
      classId: input.classId,
      day: input.day,
      period: input.period,
      shift: input.shift ?? cls.shift,
      subjectId: armed.subjectId,
      staffId: armed.staffId,
    });
  }

  /**
   * Darsni bosish — TANLAYDI, oʻchirmaydi.
   *
   * ⚠️ Ilgari bu `remove()` chaqirardi va bitta tasodifiy bosish darsni
   * darhol yoʻq qilardi. 1200 katakli toʻr asosan OʻQISH uchun
   * ishlatiladi: chip ustiga «kim oʻqitadi» deb bosish eng tabiiy
   * harakat, va u maʼlumot yoʻqotmasligi kerak. Oʻchirish endi tanlangan
   * darsning paneli orqali yoki Delete tugmasi bilan.
   */
  function handleSelect(p: Placement) {
    setSelectedId((cur) => (cur === p.id ? null : p.id));
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-caption">Jadval yuklanmoqda…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col gap-4 p-4">
      {/* ── Stol paneli ─────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="mr-auto min-w-0">
          <h1 className="heading-page truncate text-lg">{doc.schoolName || "Dars jadvali"}</h1>
          <p className="text-caption truncate">
            {doc.periodLabel || "Qoralama"}
            {dirty && " · saqlanmagan"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Bekor qilish"
            title="Bekor qilish (Ctrl+Z)"
            disabled={past.length === 0}
            onClick={undo}
          >
            <Undo2 />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Qaytarish"
            title="Qaytarish (Ctrl+Shift+Z)"
            disabled={future.length === 0}
            onClick={redo}
          >
            <Redo2 />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-label">Rejim</span>
          <SegmentedToggle<Mode>
            variant="pill"
            value={mode}
            onValueChange={setMode}
            options={[
              { value: "ish", label: "Ish rejimi" },
              { value: "varaq", label: "Varaq" },
            ]}
          />
        </div>

        {mode === "ish" && twoShift && (
          <div className="flex items-center gap-2">
            <span className="text-label">Smena</span>
            <SegmentedToggle<"1" | "2">
              variant="pill"
              value={String(shift) as "1" | "2"}
              onValueChange={(v) => setShift(Number(v) as 1 | 2)}
              options={[
                { value: "1", label: "1-smena" },
                { value: "2", label: "2-smena" },
              ]}
            />
          </div>
        )}

        {mode === "varaq" && (
          <div className="flex items-center gap-2">
            <span className="text-label">Zichlik</span>
            <SegmentedToggle<SheetDensity>
              variant="pill"
              value={density}
              onValueChange={setDensity}
              options={[
                { value: "butun", label: "Butun" },
                { value: "fan", label: "Fan" },
                { value: "toliq", label: "Fan + oʻqituvchi" },
              ]}
            />
          </div>
        )}

        <label className="flex items-center gap-2">
          <span className="text-label">Oʻqituvchi</span>
          <select
            value={litStaffId ?? ""}
            onChange={(e) => setLitStaffId(e.target.value || null)}
            className="h-9 rounded-md border border-border bg-card px-2 text-[12px]"
          >
            <option value="">— hammasi —</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowClashes((v) => !v)}
          className={cn(conflicts.length > 0 && "border-destructive text-destructive")}
        >
          <AlertTriangle />
          {conflicts.length} ziddiyat
        </Button>

        <Button variant="outline" size="sm" disabled title="Premium tarifda">
          <Sparkles />
          Avtomatik tuzish
        </Button>
      </header>

      {selected && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-2">
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-sm"
            style={{
              backgroundColor: findSubject(doc, selected.subjectId)
                ? classTints(findSubject(doc, selected.subjectId)!.color).solid
                : undefined,
            }}
          />
          <span className="text-body font-semibold">
            {findSubject(doc, selected.subjectId)?.name ?? selected.subjectId}
          </span>
          <span className="text-caption">
            {findClass(doc, selected.classId)?.name} · {DAY_NAMES[selected.day]},{" "}
            {selected.period}-soat ·{" "}
            {(() => {
              const st = findStaff(doc, selected.staffId);
              return st ? staffShort(st.name) : selected.staffId;
            })()}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLock(selected.id)}
              title={selected.locked ? "Qulfni ochish" : "Qulflash — ustiga qoʻyib boʻlmaydi"}
            >
              {selected.locked ? <Lock /> : <LockOpen />}
              {selected.locked ? "Qulflangan" : "Qulflash"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={selected.locked}
              className="text-destructive hover:text-destructive"
              onClick={() => {
                remove(selected.id);
                setSelectedId(null);
              }}
              title={selected.locked ? "Avval qulfni oching" : "Oʻchirish (Delete)"}
            >
              <Trash2 />
              Oʻchirish
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tanlovni bekor qilish"
              onClick={() => setSelectedId(null)}
            >
              <X />
            </Button>
          </div>
        </div>
      )}

      {showClashes && conflicts.length > 0 && (
        <Panel className="border-destructive/50">
          <PanelHeader>
            <h2 className="heading-section text-destructive">Hal qilinmagan ziddiyatlar</h2>
          </PanelHeader>
          <PanelBody>
            <ul className="flex flex-col gap-1">
              {conflicts.map((c, i) => {
                const staff = findStaff(doc, c.staffId);
                const names = c.classIds
                  .map((id) => doc.classes.find((x) => x.id === id)?.name ?? id)
                  .join(" va ");
                return (
                  <li key={i} className="text-body">
                    <b className="font-semibold">{staff ? staffShort(staff.name) : c.staffId}</b>
                    {` · ${DAY_NAMES[c.day]}, ${c.period}-soat · ${names}`}
                  </li>
                );
              })}
            </ul>
          </PanelBody>
        </Panel>
      )}

      {/* ── Rels + toʻr ─────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-4">
        <LedgerRail doc={doc} armed={armed} onArm={arm} />

        {mode === "ish" ? (
          <WorkGrid
            doc={doc}
            shift={shift}
            armed={armed}
            litStaffId={litStaffId}
            selectedId={selectedId}
            onPlace={handlePlace}
            onSelect={handleSelect}
          />
        ) : (
          <SheetGrid
            doc={doc}
            density={density}
            armed={armed}
            litStaffId={litStaffId}
            selectedId={selectedId}
            onPlace={handlePlace}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  );
}
