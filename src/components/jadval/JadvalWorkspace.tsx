"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, Redo2, Sparkles, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import {
  buildLedger,
  dropStateFor,
  findClass,
  findConflicts,
  findStaff,
  findSubject,
  indexDoc,
  staffShort,
  DAY_NAMES,
  type Placement,
} from "@/lib/school-timetable";
import { demoDoc } from "@/lib/school-timetable-demo";
import { useSchoolTimetableStore, type Armed } from "@/store/useSchoolTimetableStore";
import ConflictDialog, { type ConflictProposal } from "./ConflictDialog";
import InspectorBar from "./InspectorBar";
import LedgerRail from "./LedgerRail";
import SheetGrid, { type SheetDensity } from "./SheetGrid";
import StaffLoadPanel from "./StaffLoadPanel";
import StaffPicker from "./StaffPicker";
import WorkGrid, { type FocusRequest } from "./WorkGrid";
import { parseDragged, parseSlot } from "./dnd-ids";

/* ════════════════════════════════════════════════════════════════════
   `/jadval` ISH MAYDONI — zavuch quroli.

   ⛔ DASHBOARDGA BOGʻLANMAYDI. Bu yerda `useTimetableStore`,
   `useGradesStore` yoki dashboard komponentlari import qilinmaydi.
   Ikki mahsulot orasidagi yagona koʻprik — nashr amali
   (docs/dars-jadvali-spec.md §9).

   ── Dars qoʻyishning UCH yoʻli, BITTA mantiq ─────────────────────────
   1. Sudrash        — @dnd-kit (relsdan katakka, katakdan katakka)
   2. Bosish         — kartani «olib», keyin katakni bosish
   3. Klaviatura     — kartani «olib», strelkalar bilan yurib, Enter

   Uchalasi ham `Armed` holatiga aylanadi va `commitPlacement` dan
   oʻtadi. 2 va 3 sudrashning kambagʻal oʻrnini bosuvchisi EMAS: ARIA
   yoʻriqnomalari sudrash uchun aynan shunday muqobil talab qiladi, va
   jadval tizimlari boʻyicha tadqiqot «koʻrsatma» yondashuvini
   toʻgʻridan-toʻgʻri manipulyatsiyadan yuqori baholagan (§12.6).

   ── Joylashuv barqarorligi ───────────────────────────────────────────
   Sarlavha, inspektor qatori va toʻr — uchtasining balandligi
   OʻZGARMAYDI. Ziddiyat roʻyxati toʻrni surmaydi, panel boʻlib
   oʻngdan ochiladi. Sabab: 1200 katakli toʻrda 40px siljish keyingi
   bosishni notoʻgʻri katakka tushiradi.
   ════════════════════════════════════════════════════════════════════ */

type Mode = "ish" | "varaq";

export default function JadvalWorkspace() {
  const doc = useSchoolTimetableStore((s) => s.doc);
  const hydrated = useSchoolTimetableStore((s) => s._hasHydrated);
  const armed = useSchoolTimetableStore((s) => s.armed);
  const dirty = useSchoolTimetableStore((s) => s.dirty);
  const arm = useSchoolTimetableStore((s) => s.arm);
  const place = useSchoolTimetableStore((s) => s.place);
  const move = useSchoolTimetableStore((s) => s.move);
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
  const [showLoad, setShowLoad] = useState(false);
  const [shift, setShift] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ConflictProposal | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);

  /* Birinchi kirish — demo jadval. Boʻsh toʻr «bu nima?» degan savol
     qoldiradi, toʻla jadval esa darhol javob beradi. */
  useEffect(() => {
    if (hydrated && doc.classes.length === 0) loadDoc(demoDoc());
  }, [hydrated, doc.classes.length, loadDoc]);

  const conflicts = useMemo(() => findConflicts(doc), [doc]);
  const remaining = useMemo(
    () => buildLedger(doc).reduce((a, r) => a + Math.max(0, r.left), 0),
    [doc]
  );
  const selected = useMemo(
    () => doc.placements.find((p) => p.id === selectedId) ?? null,
    [doc.placements, selectedId]
  );
  const twoShift = doc.bell.profile === "double";

  /* ── Qoʻyishning yagona yoʻli ──────────────────────────────────── */

  function applyPlacement(
    card: Armed,
    to: { classId: string; day: number; period: number; shift: 1 | 2 }
  ) {
    if (!card) return;
    const subject = findSubject(doc, card.subjectId);
    if (card.kind === "move") {
      move(card.placementId, to);
      setSelectedId(card.placementId);
      toast.success("Dars koʻchirildi", {
        description: `${subject?.name ?? ""} · ${DAY_NAMES[to.day]}, ${to.period}-soat`,
      });
    } else {
      place({
        classId: to.classId,
        day: to.day,
        period: to.period,
        shift: to.shift,
        subjectId: card.subjectId,
        staffId: card.staffId,
      });
      toast.success("Dars qoʻyildi", {
        description: `${findClass(doc, to.classId)?.name ?? ""} · ${subject?.name ?? ""} · ${
          DAY_NAMES[to.day]
        }, ${to.period}-soat`,
      });
    }
    arm(null);
  }

  /** Ziddiyatsiz boʻlsa darhol qoʻyadi; ziddiyat boʻlsa oyna ochadi. */
  const commitPlacement = useCallback(
    (card: Armed, to: { classId: string; day: number; period: number; shift: 1 | 2 }) => {
      if (!card) return;
      const index = indexDoc(doc);
      const state = dropStateFor(doc, index, {
        classId: to.classId,
        subjectId: card.subjectId,
        staffId: card.staffId,
        day: to.day,
        shift: to.shift,
        period: to.period,
        ignorePlacementId: card.kind === "move" ? card.placementId : undefined,
      }).state;

      if (state === "blocked" || state === "occupied") {
        toast.error(state === "blocked" ? "Bu katakka qoʻyib boʻlmaydi" : "Katak band");
        return;
      }

      if (state === "clash") {
        const blockedBy = doc.placements.filter(
          (p) =>
            p.staffId === card.staffId &&
            p.day === to.day &&
            p.shift === to.shift &&
            p.period === to.period &&
            (card.kind !== "move" || p.id !== card.placementId)
        );
        setProposal({
          subjectId: card.subjectId,
          staffId: card.staffId,
          classId: to.classId,
          day: to.day,
          shift: to.shift,
          period: to.period,
          blockedBy,
          canSwap: card.kind === "move" && blockedBy.length === 1,
        });
        return;
      }

      applyPlacement(card, to);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [doc]
  );

  const handlePlace = useCallback(
    (input: { classId: string; day: number; period: number; shift: 1 | 2 }) => {
      commitPlacement(armed, input);
    },
    [armed, commitPlacement]
  );

  const handleSelect = useCallback((p: Placement) => {
    setSelectedId((cur) => (cur === p.id ? null : p.id));
  }, []);

  const handleRemove = useCallback(() => {
    if (!selectedId) return;
    const p = doc.placements.find((x) => x.id === selectedId);
    remove(selectedId);
    setSelectedId(null);
    if (p) {
      toast("Dars oʻchirildi", {
        description: findSubject(doc, p.subjectId)?.name,
        action: { label: "Qaytarish", onClick: () => undo() },
      });
    }
  }, [doc, remove, selectedId, undo]);

  /* ── Sudrash ───────────────────────────────────────────────────── */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  function handleDragStart(e: DragStartEvent) {
    const card = parseDragged(String(e.active.id));
    if (card) arm(card);
  }

  function handleDragEnd(e: DragEndEvent) {
    const card = parseDragged(String(e.active.id));
    const slot = e.over ? parseSlot(String(e.over.id)) : null;
    if (!card || !slot) {
      arm(null);
      return;
    }
    commitPlacement(card, {
      classId: slot.classId,
      day: slot.day,
      period: slot.period,
      shift: slot.shift,
    });
  }

  /* ── Klaviatura ────────────────────────────────────────────────── */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLElement &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

      if (e.key === "Escape") {
        arm(null);
        setSelectedId(null);
      }
      /* Tanlangan darsni oʻchirish — ATAYLAB klaviatura orqali.
         Bosish oʻchirmaydi (`handleSelect` izohiga qarang). */
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !typing) {
        e.preventDefault();
        handleRemove();
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
  }, [arm, undo, redo, handleRemove, selectedId]);

  const staffOptions = useMemo(
    () => [...doc.staff].sort((a, b) => a.name.localeCompare(b.name, "uz")),
    [doc.staff]
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-caption">Jadval yuklanmoqda…</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => arm(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            "Probel bilan oling, strelkalar bilan katakka olib boring, probel bilan qoʻying. Escape — bekor.",
        },
        announcements: {
          onDragStart: () => "Dars olindi",
          onDragOver: () => undefined,
          onDragEnd: ({ over }) => (over ? "Dars qoʻyildi" : "Bekor qilindi"),
          onDragCancel: () => "Bekor qilindi",
        },
      }}
    >
      <div className="flex min-h-svh flex-col gap-6 p-4 md:p-6">
        {/* ── Sarlavha va boshqaruvlar ──────────────────────────── */}
        <header className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="mr-auto min-w-0">
            <h1 className="heading-page truncate">{doc.schoolName || "Dars jadvali"}</h1>
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

          <SegmentedToggle<Mode>
            variant="pill"
            value={mode}
            onValueChange={setMode}
            options={[
              { value: "ish", label: "Ish rejimi" },
              { value: "varaq", label: "Varaq" },
            ]}
          />

          {mode === "ish" && twoShift && (
            <SegmentedToggle<"1" | "2">
              variant="pill"
              value={String(shift) as "1" | "2"}
              onValueChange={(v) => setShift(Number(v) as 1 | 2)}
              options={[
                { value: "1", label: "1-smena" },
                { value: "2", label: "2-smena" },
              ]}
            />
          )}

          {mode === "varaq" && (
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
          )}

          <StaffPicker staff={staffOptions} value={litStaffId} onChange={setLitStaffId} />

          <Button variant="outline" aria-pressed={showLoad} onClick={() => setShowLoad((v) => !v)}>
            <BarChart3 />
            Yuklama
          </Button>

          <Button
            variant="outline"
            aria-pressed={showClashes}
            onClick={() => setShowClashes((v) => !v)}
            className={cn(conflicts.length > 0 && "border-destructive text-destructive")}
          >
            <AlertTriangle />
            {conflicts.length} ziddiyat
          </Button>

          <Button variant="outline" disabled title="Premium tarifda">
            <Sparkles />
            Avtomatik tuzish
          </Button>
        </header>

        {/* ── Inspektor — DOIM shu yerda, balandligi oʻzgarmaydi ── */}
        <InspectorBar
          doc={doc}
          armed={armed}
          selected={selected}
          conflictCount={conflicts.length}
          remaining={remaining}
          onMove={() =>
            selected &&
            arm({
              kind: "move",
              placementId: selected.id,
              classId: selected.classId,
              subjectId: selected.subjectId,
              staffId: selected.staffId,
            })
          }
          onToggleLock={() => selected && toggleLock(selected.id)}
          onRemove={handleRemove}
          onClear={() => {
            arm(null);
            setSelectedId(null);
          }}
        />

        {/* ── Rels + toʻr + panellar ────────────────────────────── */}
        <div className="flex min-h-0 flex-1 gap-6">
          <LedgerRail doc={doc} armed={armed} onArm={arm} />

          {mode === "ish" ? (
            <WorkGrid
              doc={doc}
              shift={shift}
              armed={armed}
              litStaffId={litStaffId}
              selectedId={selectedId}
              focusRequest={focusRequest}
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

          {showClashes && (
            <Panel className="w-72 shrink-0">
              <PanelHeader title="Ziddiyatlar" count={conflicts.length} />
              <PanelBody className="px-5 pb-5 pt-5">
                {conflicts.length === 0 ? (
                  <p className="text-body text-success">Ziddiyat yoʻq.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {conflicts.map((c, i) => {
                      const staff = findStaff(doc, c.staffId);
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => {
                              setMode("ish");
                              setShift(c.shift);
                              setFocusRequest({
                                classId: c.classIds[0],
                                day: c.day,
                                period: c.period,
                                nonce: Date.now(),
                              });
                            }}
                            className="w-full rounded-md border border-border px-3 py-2 text-left transition-colors duration-fast hover:border-destructive"
                          >
                            <span className="heading-small block truncate">
                              {staff ? staffShort(staff.name) : c.staffId}
                            </span>
                            <span className="text-caption block">
                              {DAY_NAMES[c.day]}, {c.period}-soat ·{" "}
                              {c.classIds
                                .map((id) => findClass(doc, id)?.name ?? id)
                                .join(" va ")}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          )}

          {showLoad && <StaffLoadPanel doc={doc} litStaffId={litStaffId} onPick={setLitStaffId} />}
        </div>
      </div>

      <ConflictDialog
        doc={doc}
        proposal={proposal}
        onCancel={() => {
          setProposal(null);
          arm(null);
        }}
        onForce={() => {
          if (proposal && armed) {
            applyPlacement(armed, {
              classId: proposal.classId,
              day: proposal.day,
              period: proposal.period,
              shift: proposal.shift,
            });
          }
          setProposal(null);
        }}
        onSwap={() => {
          /* Almashtirish — `move()` maqsad katagida bitta dars boʻlsa
             oʻrinlarni almashtiradi, oʻchirmaydi. */
          if (proposal && armed?.kind === "move") {
            const other = proposal.blockedBy[0];
            move(armed.placementId, {
              classId: other.classId,
              day: other.day,
              shift: other.shift,
              period: other.period,
            });
            arm(null);
            toast.success("Darslar oʻrin almashdi");
          }
          setProposal(null);
        }}
      />
    </DndContext>
  );
}
