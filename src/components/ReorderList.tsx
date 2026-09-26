"use client";

import * as React from "react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type Modifier } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   TARTIBLASH REJIMI — kontekst menyu yoki sarlavhadagi ⇅ orqali kiriladi
   («Tanlash» rejimi bilan bir naqsh). Rejim davomida tartib faqat
   QORALAMADA (`order`) oʻzgaradi; store'ga «Tayyor» bosilganda BIR MARTA
   yoziladi. «Bekor qilish» / Esc — qoralama tashlanadi, hech narsa
   saqlanmaydi. Shu sabab alohida undo toast kerak emas.

   Oddiy holatdagi «boshqa boʻlimga sudrash» (tashqi DndContext) bilan
   toʻqnashmaydi: rejimda roʻyxat oʻz ichki DndContext'ida chiziladi.
   ════════════════════════════════════════════════════════════════════ */

/** Faqat vertikal siljish (alohida modifiers paketi shart emas). */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function useReorderDraft() {
  const [order, setOrder] = useState<string[] | null>(null);
  const [initial, setInitial] = useState<string[]>([]);
  const start = (ids: string[]) => { setInitial(ids); setOrder(ids); };
  const stop = () => setOrder(null);
  const move = (from: number, to: number) =>
    setOrder((o) => (o && to >= 0 && to < o.length && from !== to ? arrayMove(o, from, to) : o));
  /** Asl oʻrnidan siljigan elementlar — kartani ajratib koʻrsatish va panel matni uchun. */
  const movedIds = useMemo(
    () => new Set((order ?? []).filter((id, i) => initial[i] !== id)),
    [order, initial]
  );
  return { order, active: order !== null, start, stop, move, movedIds };
}

/** Rejim ochiqligida Esc — bekor qilish. */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onEscape(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active, onEscape]);
}

export type ReorderHandle = { handle: ReactNode; arrows: ReactNode; isDragging: boolean };

export function ReorderList({
  ids,
  onMove,
  labels,
  children,
}: {
  ids: string[];
  onMove: (from: number, to: number) => void;
  labels: { drag: string; up: string; down: string };
  children: (id: string, index: number, h: ReorderHandle) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onMove(ids.indexOf(e.active.id as string), ids.indexOf(e.over.id as string));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {ids.map((id, i) => (
          <SortableRow key={id} id={id} index={i} count={ids.length} onMove={onMove} labels={labels} render={children} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id, index, count, onMove, labels, render,
}: {
  id: string; index: number; count: number;
  onMove: (from: number, to: number) => void;
  labels: { drag: string; up: string; down: string };
  render: (id: string, index: number, h: ReorderHandle) => ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      aria-label={labels.drag}
      className="shrink-0 -ml-1 p-1 rounded-md text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
    >
      <GripVertical className="size-4" />
    </button>
  );
  const arrow = (dir: -1 | 1) => {
    const disabled = dir < 0 ? index === 0 : index === count - 1;
    return (
      <button
        type="button"
        aria-label={dir < 0 ? labels.up : labels.down}
        disabled={disabled}
        onClick={() => onMove(index, index + dir)}
        className="size-7 rounded-md border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-35 disabled:pointer-events-none"
      >
        {dir < 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
      </button>
    );
  };
  const arrows = <div className="shrink-0 flex items-center gap-1">{arrow(-1)}{arrow(1)}</div>;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-80")}
    >
      {render(id, index, { handle, arrows, isDragging })}
    </div>
  );
}
