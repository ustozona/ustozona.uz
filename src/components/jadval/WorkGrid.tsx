"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { classTints } from "@/lib/class-colors";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import {
  conflictSlotKeys,
  dropStateFor,
  findConflicts,
  indexDoc,
  periodsForShift,
  placementsAt,
  slotKey,
  DAY_NAMES,
  WORK_DAYS,
  type DropState,
  type Placement,
  type SchoolClass,
  type SchoolSubject,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";
import type { Armed } from "@/store/useSchoolTimetableStore";
import { placementDndId, slotDndId } from "./dnd-ids";
import {
  CHIP_HOVER,
  CLASH_RING,
  DIMMED,
  DRAGGING,
  DROP_CLASS,
  FOCUS_RING,
  LIT_RING,
  OVER_RING_BAD,
  OVER_RING_OK,
  SELECTED_RING,
} from "./cell-styles";

/* ════════════════════════════════════════════════════════════════════
   ISH REJIMI — zich toʻr. Sinflar QATORDA, kun×soat USTUNDA.

   ⚠️ Bu chop etiladigan varaqqa TESKARI joylashuv va bu ataylab
   (docs/dars-jadvali-spec.md §12.2): zavuchning asosiy savoli — «kim
   seshanba 3-soatda band». Shu joylashuvda javob BITTA USTUNNI koʻz
   bilan pastga kesib oʻtish bilan topiladi.

   Toʻr BITTA SMENANI koʻrsatadi: smenalarning dars soni har xil boʻlishi
   mumkin, ikkalasini bitta toʻrga tiqish uzun smenaning oxirgi
   soatlarini jimgina yashirardi.

   ── Klaviatura (WAI-ARIA `grid` naqshi) ──────────────────────────────
   Butun toʻr BITTA Tab toʻxtashi: faol katakda `tabIndex=0`, qolganida
   `-1` («roving tabindex»), harakat strelkalar bilan.

   ⛔ Anti-naqsh: har katakka `tabIndex=0` berish — 1200 katakli toʻrda
   klaviatura foydalanuvchisi Tab'ni 1200 marta bosishi kerak boʻlardi.

   ── Sudrash ──────────────────────────────────────────────────────────
   `@dnd-kit` — uy naqshi (`PlannerView`). Chipga faqat pointer
   aktivatori beriladi, `attributes` EMAS: `attributes` elementga oʻz
   `tabIndex` va `role` ini yozadi va yuqoridagi roving tabindex'ni
   buzadi. Klaviatura bilan koʻchirish sudrash orqali emas — «tanla →
   Koʻchirish → Enter» orqali ketadi (`Armed.kind === "move"`).
   ════════════════════════════════════════════════════════════════════ */

/* ── Katak oʻlchami: QATʼIY emas, ORALIQ ────────────────────────────
   Ilgari katak 30×27 px qotirilgan edi — eng tor ekranga moʻljallangan
   oʻlcham. Oqibati katta monitorda koʻrindi: 14 sinf × 36 ustun toʻr
   panelning yarmini egallab, oʻng va past tomonda yuzlab piksel boʻsh
   qolardi, katak esa oʻqilmaydigan darajada zich boʻlib turaverardi.

   Endi oʻlcham `minmax(min, max)`: joy boʻlsa katak choʻziladi va
   oʻqilishi yaxshilanadi, joy yetmasa eng kichik oʻlchamga qaytib
   gorizontal skrollga oʻtadi. Maksimum bor — 4 sinfli maktabda katak
   kaftdek boʻlib ketmasligi uchun. */
const CELL_W = 30;
const CELL_W_MAX = 52;
const CELL_H = 27;
const CELL_H_MAX = 40;
const ROW_HEAD_W = 62;
const HEAD_H = 26;
const SUBHEAD_H = 18;

/** Tashqaridan «shu katakka boring» soʻrovi (masalan ziddiyat roʻyxatidan).
    `nonce` — bir xil katakka qayta soʻrov ham ishlashi uchun. */
export type FocusRequest = {
  classId: string;
  day: number;
  period: number;
  nonce: number;
} | null;

export type WorkGridProps = {
  doc: SchoolTimetableDoc;
  /** Koʻrsatilayotgan smena — ustunlar va qatorlar shundan olinadi. */
  shift: 1 | 2;
  armed: Armed;
  /** Yoritilgan xodim — tanlanganda qolgan kataklar soʻnadi. */
  litStaffId: string | null;
  /** Tanlangan dars — muharrir panelida koʻrinadi. */
  selectedId: string | null;
  focusRequest?: FocusRequest;
  onPlace: (input: { classId: string; day: number; period: number; shift: 1 | 2 }) => void;
  onSelect: (placement: Placement) => void;
};

export default function WorkGrid({
  doc,
  shift,
  armed,
  litStaffId,
  selectedId,
  focusRequest,
  onPlace,
  onSelect,
}: WorkGridProps) {
  const index = useMemo(() => indexDoc(doc), [doc]);
  const clashKeys = useMemo(() => conflictSlotKeys(findConflicts(doc, index)), [doc, index]);
  const periods = useMemo(() => periodsForShift(doc, shift).map((p) => p.index), [doc, shift]);
  const classes = useMemo(() => doc.classes.filter((c) => c.shift === shift), [doc.classes, shift]);
  const subjects = useMemo(() => new Map(doc.subjects.map((s) => [s.id, s])), [doc.subjects]);

  const gridRef = useRef<HTMLDivElement>(null);
  /** Roving tabindex kursori — [qator, ustun]. */
  const [active, setActive] = useState<[number, number]>([0, 0]);

  const cols = WORK_DAYS.length * periods.length;

  /** Kursorni koʻchirib, DOM fokusini ham oʻsha katakka beradi. */
  const moveTo = useCallback(
    (r: number, c: number) => {
      const rr = Math.max(0, Math.min(classes.length - 1, r));
      const cc = Math.max(0, Math.min(cols - 1, c));
      setActive([rr, cc]);
      gridRef.current?.querySelector<HTMLElement>(`[data-r="${rr}"][data-c="${cc}"]`)?.focus();
    },
    [classes.length, cols]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const [r, c] = active;
      switch (e.key) {
        case "ArrowUp":
          moveTo(r - 1, c);
          break;
        case "ArrowDown":
          moveTo(r + 1, c);
          break;
        case "ArrowLeft":
          moveTo(r, c - 1);
          break;
        case "ArrowRight":
          moveTo(r, c + 1);
          break;
        case "Home":
          moveTo(e.ctrlKey ? 0 : r, 0);
          break;
        case "End":
          moveTo(e.ctrlKey ? classes.length - 1 : r, cols - 1);
          break;
        case "PageUp":
          moveTo(r - 10, c);
          break;
        case "PageDown":
          moveTo(r + 10, c);
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [active, classes.length, cols, moveTo]
  );

  const handleFocusCell = useCallback((pos: [number, number]) => setActive(pos), []);

  /* Ziddiyat roʻyxatidan katakka oʻtish. Roʻyxat faqat xabar berib
     qolmasligi kerak — muammoli katakning oʻziga olib borishi shart. */
  useEffect(() => {
    if (!focusRequest) return;
    const r = classes.findIndex((c) => c.id === focusRequest.classId);
    const di = WORK_DAYS.indexOf(focusRequest.day as (typeof WORK_DAYS)[number]);
    const pi = periods.indexOf(focusRequest.period);
    if (r < 0 || di < 0 || pi < 0) return;
    moveTo(r, di * periods.length + pi);
  }, [focusRequest, classes, periods, moveTo]);

  if (periods.length === 0 || classes.length === 0) {
    return (
      <Panel className="min-h-0 flex-1 items-center justify-center">
        <p className="text-caption">Bu smenada sinf yoʻq.</p>
      </Panel>
    );
  }

  return (
    <Panel className="min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-auto scrollbar-hover [scrollbar-width:thin]">
      <div
        ref={gridRef}
        role="grid"
        aria-label="Maktab dars jadvali — ish toʻri"
        aria-rowcount={classes.length + 2}
        aria-colcount={cols + 1}
        onKeyDown={onKeyDown}
        /* `min-w-max`/`min-h-max` — kataklar eng kichik oʻlchamidan
           siqilmasin (siqilsa skroll paydo boʻladi); `w-full`/`h-full` —
           joy ortiqcha boʻlsa `minmax` maksimumigacha choʻzilsin. */
        className="grid h-full min-h-max w-full min-w-max"
        style={{
          gridTemplateColumns: `${ROW_HEAD_W}px repeat(${cols}, minmax(${CELL_W}px, ${CELL_W_MAX}px))`,
          gridTemplateRows: `${HEAD_H}px ${SUBHEAD_H}px repeat(${classes.length}, minmax(${CELL_H}px, ${CELL_H_MAX}px))`,
        }}
      >
        {/* Kun sarlavhalari. `contents` — qator semantikasi ARIA uchun
            kerak, lekin toʻr tuzilishini buzmasligi shart. */}
        <div role="row" className="contents">
          <div className="sticky left-0 top-0 z-30 border-b border-r border-border bg-background/70 backdrop-blur-md" />
          {WORK_DAYS.map((day) => (
            <div
              key={`d${day}`}
              role="columnheader"
              className="text-label sticky top-0 z-20 flex items-center justify-center truncate border-b border-r border-border bg-background/70 backdrop-blur-md px-1"
              style={{ gridColumn: `span ${periods.length}` }}
            >
              {DAY_NAMES[day]}
            </div>
          ))}
        </div>

        {/* Soat raqamlari */}
        <div role="row" className="contents">
          <div
            className="sticky left-0 z-30 border-b border-r border-border bg-background/70 backdrop-blur-md"
            style={{ top: HEAD_H }}
          />
          {WORK_DAYS.map((day) =>
            periods.map((p) => (
              <div
                key={`p${day}-${p}`}
                role="columnheader"
                className={cn(
                  /* ⚠️ Bu qatorda `backdrop-blur` ATAYLAB yoʻq, garchi
                     ustidagi kun sarlavhasida bor. Sabab — soni: soat
                     raqamlari 36 ta katak, blur berilsa skrollda 36 ta
                     `backdrop-filter` qatlami hisoblanadi va maktab
                     noutbukida toʻr sudralib qoladi. 18px balandlikdagi
                     raqam chizigʻida blur baribir koʻrinmaydi. */
                  "text-micro sticky z-20 flex items-center justify-center border-b border-border bg-background text-muted-foreground",
                  p === periods[periods.length - 1] && "border-r"
                )}
                style={{ top: HEAD_H }}
              >
                {p}
              </div>
            ))
          )}
        </div>

        {/* Sinf qatorlari */}
        {classes.map((cls, r) => (
          <div role="row" className="contents" key={cls.id}>
            <div
              role="rowheader"
              className="text-caption sticky left-0 z-10 flex items-center border-b border-r border-border bg-card/80 backdrop-blur-md px-2 font-semibold text-foreground"
            >
              {cls.name}
            </div>
            {WORK_DAYS.map((day, di) =>
              periods.map((p, pi) => {
                const c = di * periods.length + pi;
                const here = placementsAt(index, cls.id, day, cls.shift, p);
                const key = slotKey(cls.id, day, cls.shift, p);

                let drop: DropState | null = null;
                if (armed && armed.classId === cls.id) {
                  drop = dropStateFor(doc, index, {
                    classId: cls.id,
                    subjectId: armed.subjectId,
                    staffId: armed.staffId,
                    day,
                    shift: cls.shift,
                    period: p,
                    ignorePlacementId: armed.kind === "move" ? armed.placementId : undefined,
                  }).state;
                }

                const lit = litStaffId != null && here.some((x) => x.staffId === litStaffId);
                const dim = (armed != null && drop == null) || (litStaffId != null && !lit);

                return (
                  <WorkCell
                    key={key}
                    slotId={slotDndId(cls.id, day, cls.shift, p)}
                    cls={cls}
                    day={day}
                    period={p}
                    r={r}
                    c={c}
                    focused={active[0] === r && active[1] === c}
                    subjects={subjects}
                    here={here}
                    isClash={clashKeys.has(key)}
                    drop={drop}
                    dim={dim}
                    lit={lit}
                    selectedId={selectedId}
                    lastOfDay={pi === periods.length - 1}
                    onFocusCell={handleFocusCell}
                    onPlace={onPlace}
                    onSelect={onSelect}
                  />
                );
              })
            )}
          </div>
        ))}
        </div>
      </div>
    </Panel>
  );
}

/* ─── Katak ─────────────────────────────────────────────────────────── */

type WorkCellProps = {
  slotId: string;
  cls: SchoolClass;
  day: number;
  period: number;
  r: number;
  c: number;
  focused: boolean;
  subjects: Map<string, SchoolSubject>;
  here: Placement[];
  isClash: boolean;
  drop: DropState | null;
  dim: boolean;
  lit: boolean;
  selectedId: string | null;
  lastOfDay: boolean;
  onFocusCell: (pos: [number, number]) => void;
  onPlace: (input: { classId: string; day: number; period: number; shift: 1 | 2 }) => void;
  onSelect: (p: Placement) => void;
};

/* `memo` — 1200 katakli toʻrda har qoʻyish butun toʻrni qayta chizardi.
   Endi faqat holati oʻzgargan kataklar yangilanadi. Shu sabab yuqoridagi
   callback'lar `useCallback` bilan barqarorlashtirilgan — aks holda memo
   hech narsa bermaydi. */
const WorkCell = memo(function WorkCell({
  slotId,
  cls,
  day,
  period,
  r,
  c,
  focused,
  subjects,
  here,
  isClash,
  drop,
  dim,
  lit,
  selectedId,
  lastOfDay,
  onFocusCell,
  onPlace,
  onSelect,
}: WorkCellProps) {
  /* «Band» katak ham drop qabul qiladi — ziddiyat oynasi qaror soʻraydi. */
  const canDrop = drop === "ok" || drop === "caution" || drop === "clash";

  /* ⚠️ Drop-zona HECH QACHON `disabled` qilinmaydi, garchi kataklarning
     koʻpchiligi yaroqsiz boʻlsa ham. Sabab — vaqt: `armed` sudrash
     BOSHLANGANDA qoʻyiladi, @dnd-kit esa drop-zonalarni oʻsha ondayoq
     oʻlchaydi. Zonalarni `armed` ga qarab yoqsak, ular oʻlchovdan
     KEYIN paydo boʻlardi va tashlash umuman ishlamay qolardi.
     Yaroqlilik tashlash payti `commitPlacement` da tekshiriladi. */
  const { setNodeRef, isOver } = useDroppable({ id: slotId });

  const activate = () => {
    if (canDrop) onPlace({ classId: cls.id, day, period, shift: cls.shift });
    else if (here.length === 1) onSelect(here[0]);
  };

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      data-r={r}
      data-c={c}
      tabIndex={focused ? 0 : -1}
      aria-label={`${cls.name}, ${DAY_NAMES[day]}, ${period}-soat`}
      onFocus={() => onFocusCell([r, c])}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          activate();
        }
      }}
      className={cn(
        "group/cell relative border-b border-border outline-none transition-opacity duration-fast",
        lastOfDay && "border-r",
        dim && DIMMED,
        isClash && CLASH_RING,
        drop && drop !== "occupied" && DROP_CLASS[drop],
        isOver && (canDrop ? OVER_RING_OK : OVER_RING_BAD),
        focused && cn("z-10", FOCUS_RING),
        canDrop && "cursor-pointer"
      )}
      /* Balandlik toʻrning qator shablonidan keladi (`minmax`), katakda
         qotirilmaydi — aks holda toʻr choʻzilmay qolardi. */
    >
      {/* Boʻsh katakda hoverda «+» — dashboard jadvalidagi bilan bir xil
          affordans. Ilgari boʻsh katak butunlay jim edi: yangi odam qayerga
          bosish mumkinligini faqat urinib koʻrib bilardi.
          Karta olinganda koʻrsatilmaydi — u paytda katakni holat rangi
          (`DROP_CLASS`) allaqachon gapirtiradi. */}
      {here.length === 0 && !dim && drop === null && (
        <Plus
          aria-hidden
          className="pointer-events-none absolute inset-0 m-auto size-3.5 text-muted-foreground opacity-0 transition-opacity duration-fast group-hover/cell:opacity-60"
        />
      )}

      {/* `p-0.5` + `gap-0.5` — chip katak chegarasiga tegib turmaydi, shunda
          radius koʻzga koʻrinadi va ikki guruh chipi ajratgich chiziqsiz
          ham ajralib turadi. */}
      <div className="flex h-full gap-0.5 p-0.5">
        {here.map((p) => (
          <Chip
            key={p.id}
            placement={p}
            subject={subjects.get(p.subjectId)}
            lit={lit}
            selected={selectedId === p.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
});

/* ─── Dars chipi — sudraladigan ──────────────────────────────────────── */

function Chip({
  placement,
  subject,
  lit,
  selected,
  onSelect,
}: {
  placement: Placement;
  subject: SchoolSubject | undefined;
  lit: boolean;
  selected: boolean;
  onSelect: (p: Placement) => void;
}) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: placementDndId(placement.id, placement.classId, placement.subjectId, placement.staffId),
    disabled: placement.locked,
  });
  const tints = subject ? classTints(subject.color) : null;

  return (
    <div
      ref={setNodeRef}
      aria-label={`${subject?.name ?? placement.subjectId}${placement.locked ? ", qulflangan" : ", koʻchirish uchun sudrang"}`}
      /* ⚠️ Faqat pointer aktivatori. Butun `listeners` + `attributes`
         berilsa @dnd-kit elementga oʻz `tabIndex`/`role` ini yozadi va
         toʻrning roving tabindex'i buziladi. */
      onPointerDown={listeners?.onPointerDown as React.PointerEventHandler<HTMLDivElement> | undefined}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(placement);
      }}
      /* Yuza dashboard jadvali va plannerning AYNAN oʻsha retsepti:
         `gradientSurface` (gradient + diagonal tekstura) + `textOnSolid`.
         Ilgari bu yerda tekis `chipFill` + `textOnTint` ishlatilgan va
         toʻr Ustozona ekraniga emas, elektron jadvalga oʻxshab qolgandi.
         Zichlik boshqa — yuza tili bir xil. */
      style={{ ...(tints?.gradientSurface ?? {}), ...(tints?.textOnSolid ?? {}) }}
      className={cn(
        "text-micro relative flex flex-1 select-none items-center justify-center overflow-hidden rounded-sm",
        CHIP_HOVER,
        lit && LIT_RING,
        selected && SELECTED_RING,
        isDragging && DRAGGING,
        placement.locked ? "cursor-default" : "cursor-grab"
      )}
    >
      {subject?.short ?? "—"}
      {placement.locked && (
        <span aria-hidden className="absolute right-0 top-0 size-1.5 rounded-bl-sm bg-foreground/45" />
      )}
    </div>
  );
}
