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
import { Smartphone } from "lucide-react";
import { autoPlace } from "@/lib/school-timetable-autoplace";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  buildLedger,
  dropStateFor,
  findClass,
  findConflicts,
  findStaff,
  emptyDoc,
  findSubject,
  indexDoc,
  periodsForShift,
  staffShort,
  WORK_DAYS,
  DAY_NAMES,
  type Placement,
} from "@/lib/school-timetable";
import { useSchoolTimetableStore, type Armed } from "@/store/useSchoolTimetableStore";
import ConflictDialog, { type ConflictProposal } from "./ConflictDialog";
import InspectorBar from "./InspectorBar";
import LedgerRail from "./LedgerRail";
import SheetGrid, { type SheetDensity } from "./SheetGrid";
import StaffLoadPanel from "./StaffLoadPanel";
import JadvalHeader, { type Mode, type SidePanel } from "./JadvalHeader";
import JadvalStartScreen from "./JadvalStartScreen";
import WorkGrid, { type FocusRequest } from "./WorkGrid";
import { parseDragged, parseSlot } from "./dnd-ids";
import { useJadvalLayout } from "./use-jadval-layout";

/* ════════════════════════════════════════════════════════════════════
   `/jadval` ISH MAYDONI — zavuch quroli.

   ⛔ DASHBOARDGA BOGʻLANMAYDI. Bu yerda `useTimetableStore`,
   `useGradesStore` yoki dashboard komponentlari import qilinmaydi.
   Ikki mahsulot orasidagi yagona koʻprik — nashr amali
   (docs/dars-jadvali-spec.md §9).

   ── Dars qoʻyishning UCH yoʻli, BITTA mantiq ─────────────────────────
   1. Sudrash · 2. Bosish · 3. Klaviatura — uchalasi ham `Armed`
   holatiga aylanadi va `commitPlacement` dan oʻtadi (§12.6).

   ── Uch oʻlcham ──────────────────────────────────────────────────────
   `useJadvalLayout` uchta sirtni ajratadi. Keng ekranda panellar
   yonma-yon va oʻlchami sozlanadi; tor ekranda ular `Sheet` ichiga
   koʻchadi; telefonda esa muharrir umuman ochilmaydi — faqat oʻqish.

   ── Joylashuv barqarorligi ───────────────────────────────────────────
   Sarlavha, inspektor qatori va toʻr — balandligi OʻZGARMAYDI. Yon
   panellar toʻrni pastga surmaydi, yonidan ochiladi.
   ════════════════════════════════════════════════════════════════════ */

export default function JadvalWorkspace() {
  const doc = useSchoolTimetableStore((s) => s.doc);
  const hydrated = useSchoolTimetableStore((s) => s._hasHydrated);
  const armed = useSchoolTimetableStore((s) => s.armed);
  const dirty = useSchoolTimetableStore((s) => s.dirty);
  const savedAt = useSchoolTimetableStore((s) => s.savedAt);
  const arm = useSchoolTimetableStore((s) => s.arm);
  const place = useSchoolTimetableStore((s) => s.place);
  const move = useSchoolTimetableStore((s) => s.move);
  const remove = useSchoolTimetableStore((s) => s.remove);
  const toggleLock = useSchoolTimetableStore((s) => s.toggleLock);
  const undo = useSchoolTimetableStore((s) => s.undo);
  const redo = useSchoolTimetableStore((s) => s.redo);
  const loadDoc = useSchoolTimetableStore((s) => s.loadDoc);
  const applyPlacements = useSchoolTimetableStore((s) => s.applyPlacements);
  const past = useSchoolTimetableStore((s) => s.past);
  const future = useSchoolTimetableStore((s) => s.future);

  const layout = useJadvalLayout();
  const isMobile = layout === "mobile";
  const isWide = layout === "wide";

  const [mode, setMode] = useState<Mode>("ish");
  const [density, setDensity] = useState<SheetDensity>("toliq");
  const [litStaffId, setLitStaffId] = useState<string | null>(null);
  const [side, setSide] = useState<SidePanel>("none");
  const [railOpen, setRailOpen] = useState(false);
  const [shift, setShift] = useState<1 | 2>(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposal, setProposal] = useState<ConflictProposal | null>(null);
  const [focusRequest, setFocusRequest] = useState<FocusRequest>(null);
  const [resetOpen, setResetOpen] = useState(false);

  /* Telefonda faqat varaq — zich toʻr barmoq bilan boshqarilmaydi. */
  useEffect(() => {
    if (isMobile) {
      setMode("varaq");
      setDensity((d) => (d === "toliq" ? "fan" : d));
    }
  }, [isMobile]);

  const conflicts = useMemo(() => findConflicts(doc), [doc]);
  const ledger = useMemo(() => buildLedger(doc), [doc]);
  const remaining = useMemo(
    () => ledger.reduce((a, r) => a + Math.max(0, r.left), 0),
    [ledger]
  );
  /* Relsda koʻrsatiladigan ish bormi. `remaining` yetarli emas: reja
     ustidan qoʻyilgan soat (`left < 0`) ham relsda turadi, lekin
     «qoldiq» yigʻindisiga kirmaydi. */
  const hasLedgerWork = useMemo(() => ledger.some((r) => r.left !== 0), [ledger]);
  const selected = useMemo(
    () => doc.placements.find((p) => p.id === selectedId) ?? null,
    [doc.placements, selectedId]
  );
  const twoShift = doc.bell.profile === "double";
  const suggestedCount = useMemo(() => {
    if (!armed) return 0;
    const index = indexDoc(doc);
    const cls = doc.classes.find((item) => item.id === armed.classId);
    if (!cls) return 0;
    const periods = periodsForShift(doc, cls.shift);
    return WORK_DAYS.reduce(
      (sum, day) =>
        sum +
        periods.filter((period) => {
          const state = dropStateFor(doc, index, {
            classId: cls.id,
            subjectId: armed.subjectId,
            staffId: armed.staffId,
            day,
            shift: cls.shift,
            period: period.index,
            ignorePlacementId: armed.kind === "move" ? armed.placementId : undefined,
          }).state;
          return state === "ok" || state === "caution";
        }).length,
      0
    );
  }, [armed, doc]);

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
        action: { label: "Qaytarish", onClick: () => undo() },
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
        action: { label: "Qaytarish", onClick: () => undo() },
      });
    }
    arm(null);
  }

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
      setRailOpen(false);
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

  /* ── Avtomatik joylashtirish ──────────────────────── */

  const handleAutoPlace = useCallback(() => {
    const result = autoPlace(doc);
    if (result.placed === 0) {
      toast.error("Joylashtiradigan dars topilmadi", {
        description:
          result.unplaced[0]?.reason ?? "Qoldiqdagi darslarga oʻqituvchi biriktirilmagan.",
      });
      return;
    }

    applyPlacements(result.placements);

    /* Natija ROSTINI aytadi: nechta qoʻyildi VA nechta qoʻyilmadi.
       «Tayyor» deb yozib, qoldiqni jimgina qoldirish eng yomon variant —
       zavuch buni faqat chop etgandan keyin sezardi. */
    const stuck = result.unplaced.reduce((sum, u) => sum + u.count, 0);
    toast.success(`${result.placed} dars joylashtirildi`, {
      description:
        stuck > 0
          ? `${stuck} soat qoldi — ${result.unplaced[0].className} ${result.unplaced[0].subjectName} va boshqalar. Qoldiq relsida koʻrinadi.`
          : "Reja toʻliq bajarildi, ziddiyatsiz.",
      action: { label: "Qaytarish", onClick: () => undo() },
    });
  }, [doc, applyPlacements, undo]);

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

  if (doc.classes.length === 0) {
    return <JadvalStartScreen onReady={(next) => loadDoc(next)} />;
  }

  /* ── Bloklar ───────────────────────────────────────────────────── */

  const grid =
    mode === "ish" ? (
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
    );

  const clashesPanel = (
    <Panel className="h-full">
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
                      if (!isWide) setSide("none");
                    }}
                    className="w-full rounded-md border border-border px-3 py-2 text-left transition-colors duration-fast hover:border-destructive"
                  >
                    <span className="heading-small block truncate">
                      {staff ? staffShort(staff.name) : c.staffId}
                    </span>
                    <span className="text-caption block">
                      {DAY_NAMES[c.day]}, {c.period}-soat ·{" "}
                      {c.classIds.map((id) => findClass(doc, id)?.name ?? id).join(" va ")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );

  const sidePanel =
    side === "clashes" ? clashesPanel : side === "load" ? (
      <StaffLoadPanel doc={doc} litStaffId={litStaffId} onPick={setLitStaffId} />
    ) : null;

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
      <div className="flex h-svh flex-col">
        <JadvalHeader
          schoolName={doc.schoolName}
          periodLabel={doc.periodLabel}
          layout={layout}
          mode={mode}
          onModeChange={setMode}
          twoShift={twoShift}
          shift={shift}
          onShiftChange={setShift}
          density={density}
          onDensityChange={setDensity}
          staff={staffOptions}
          litStaffId={litStaffId}
          onLitStaffChange={setLitStaffId}
          conflictCount={conflicts.length}
          remaining={remaining}
          hasLedgerWork={hasLedgerWork}
          side={side}
          onSideChange={setSide}
          onOpenRail={() => setRailOpen(true)}
          canUndo={past.length > 0}
          canRedo={future.length > 0}
          onUndo={undo}
          onRedo={redo}
          onReset={() => setResetOpen(true)}
        />

        {/* ── Ish maydoni — naqshli fon SHU YERDA koʻrinadi ──────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-3 md:gap-6 md:p-6">
        {/* Telefonda tahrirlash yoʻqligini YASHIRMAYMIZ. */}
        {isMobile && (
          <p className="text-caption flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
            <Smartphone className="size-4 shrink-0" aria-hidden />
            Telefonda jadval faqat oʻqiladi. Tahrirlash kompyuterda.
          </p>
        )}

        {!isMobile && (
          <InspectorBar
            doc={doc}
            armed={armed}
            selected={selected}
            conflictCount={conflicts.length}
            remaining={remaining}
            suggestedCount={suggestedCount}
            dirty={dirty}
            savedAt={savedAt}
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
        )}

        {/* ── Ish maydoni ──────────────────────────────────────── */}
        {isWide ? (
          /* `key` — rels paydo boʻlgan/yoʻqolgan payt guruh qayta
             qurilsin: aks holda react-resizable-panels eski uch panelli
             joylashuvni ikkitaga choʻzib, oʻlchamlarni chalkashtiradi. */
          <ResizablePanelGroup
            key={hasLedgerWork ? "rels" : "relssiz"}
            orientation="horizontal"
            className="min-h-0 flex-1 gap-0"
          >
            {/* Rels — kartalar manbai. Qoʻyilmagan soat qolmaganda unda
                koʻrsatadigan narsa yoʻq: 20% enni «Reja toʻliq bajarildi»
                degan bitta satr uchun band qilib turmaydi, toʻrga
                boʻshatib beradi. */}
            {hasLedgerWork && (
              <>
                <ResizablePanel defaultSize="20%" minSize="15%" maxSize="32%">
                  <LedgerRail doc={doc} armed={armed} onArm={arm} onAutoPlace={handleAutoPlace} />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}
            <ResizablePanel
              defaultSize={
                side === "none" ? (hasLedgerWork ? "80%" : "100%") : hasLedgerWork ? "55%" : "75%"
              }
              minSize="35%"
            >
              {grid}
            </ResizablePanel>
            {side !== "none" && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="25%" minSize="18%" maxSize="40%">
                  {sidePanel}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        ) : (
          <div className="flex min-h-0 flex-1">{grid}</div>
        )}
        </div>
      </div>

      {/* ── Tor ekran: rels va panellar Sheet ichida ──────────────── */}
      {!isWide && (
        <>
          <Sheet open={railOpen} onOpenChange={setRailOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Qoldiq</SheetTitle>
                <SheetDescription>Qoʻyilmagan soatlar roʻyxati</SheetDescription>
              </SheetHeader>
              <LedgerRail doc={doc} armed={armed} onArm={arm} onAutoPlace={handleAutoPlace} />
            </SheetContent>
          </Sheet>

          <Sheet open={side !== "none"} onOpenChange={(o) => !o && setSide("none")}>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{side === "load" ? "Yuklama" : "Ziddiyatlar"}</SheetTitle>
                <SheetDescription>Jadval hisobotlari</SheetDescription>
              </SheetHeader>
              {sidePanel}
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Boshidan boshlash — QAYTARIB BOʻLMAYDI: hujjat `localStorage`
          da yashaydi va tarix ham u bilan ketadi. Shuning uchun toast
          emas, tasdiq oynasi. */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Jadval oʻchirilsinmi?</AlertDialogTitle>
            <AlertDialogDescription>
              {doc.classes.length} sinf va {doc.placements.length} dars oʻchadi, sozlash
              ekrani ochiladi. Bu amalni qaytarib boʻlmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                loadDoc(emptyDoc());
                setResetOpen(false);
              }}
            >
              Oʻchirish va boshlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        /* Taklif qoʻllanganda toʻsiq koʻchadi va katak boʻshaydi —
           soʻng olingan dars OʻSHA katakka qoʻyiladi. Ikki qadam bitta
           amal boʻlib koʻrinadi, chunki zavuch uchun bu bitta qaror. */
        onApplySuggestion={(sg) => {
          if (!proposal) return;
          move(sg.move.id, {
            classId: sg.move.classId,
            day: sg.to.day,
            shift: sg.move.shift,
            period: sg.to.period,
          });
          if (armed) {
            applyPlacement(armed, {
              classId: proposal.classId,
              day: proposal.day,
              period: proposal.period,
              shift: proposal.shift,
            });
          }
          setProposal(null);
          toast.success("Toʻsiq koʻchirildi va dars qoʻyildi", {
            action: { label: "Qaytarish", onClick: () => { undo(); undo(); } },
          });
        }}
        onSwap={() => {
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
