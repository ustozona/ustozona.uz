import { create } from "zustand";
import type { SessionMove } from "@/lib/lesson-shift";
import { lessonClassIds, lessonUnitIds, type Unit, type Lesson, type LessonStatus, type LessonSession } from "@/lib/lessons-data";

/* ════════════════════════════════════════════════════════════════════
   MAVZU BANKI — server-backed store (6-bosqich migratsiyasi)

   Lessons sahifasi va Planner ikkalasi shu storeʼdan oʻqiydi/yozadi.
   Manba endi Postgres: `LessonsServerSync` (dashboard layout) mount'da
   serverdan {units, lessons}ni yuklaydi (hydration), keyin har
   oʻzgarishni diff qilib server action'ga yuboradi. Boshlangʻich holat
   BOʻSH (9-bosqich): UNITS/LESSONS seed olib tashlandi — ular endi
   faqat scripts/seed.ts'da (demo oʻqituvchi) ishlatiladi.
   ════════════════════════════════════════════════════════════════════ */

const MON_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
function fmtDisplayDate(dateKey: string): string {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${MON_EN[(m || 1) - 1]} ${d}`;
}
function fmtDisplayTime(min: number): string {
  let h = Math.floor(min / 60);
  const mm = min % 60;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ap}`;
}

/** Asosiy sinfning ilk (eng erta) sessiyasidan legacy maydonlarni hisoblash. */
function legacyScheduleFields(sessions: LessonSession[] | undefined) {
  const first = sessions && sessions.length
    ? [...sessions].sort((a, b) => a.date.localeCompare(b.date))[0]
    : undefined;
  return first
    ? { scheduledDate: first.date, startMin: first.startMin, endMin: first.endMin, date: fmtDisplayDate(first.date), time: fmtDisplayTime(first.startMin) }
    : { scheduledDate: undefined, startMin: undefined, endMin: undefined, date: undefined, time: undefined };
}
/** Biror sinfda biror sessiya bormi? */
function anySessions(map: Record<string, LessonSession[]> | undefined): boolean {
  return !!map && Object.values(map).some((arr) => arr && arr.length > 0);
}
/** Darsning jadval xaritasi — yagona manba. scheduleByClass boʻsh boʻlgan
    ESKI (faqat legacy maydonli) darslar uchun asosiy sinf sessiyasini sintez
    qiladi, shunda planner/editor bir modelda ishlaydi (migratsiyasiz). */
function scheduleMapOf(l: Lesson): Record<string, LessonSession[]> {
  if (l.scheduleByClass && Object.keys(l.scheduleByClass).length) {
    return Object.fromEntries(Object.entries(l.scheduleByClass).map(([k, v]) => [k, [...(v ?? [])]]));
  }
  if (l.scheduledDate && l.classId && l.startMin != null && l.endMin != null) {
    return { [l.classId]: [{ date: l.scheduledDate, startMin: l.startMin, endMin: l.endMin }] };
  }
  return {};
}

/** `orderedIds` dagi elementlarga `number = oʻrin + 1`; qiymati oʻzgarmaganlar aynan oʻsha obyekt qoladi. */
function renumber<T extends { id: string; number: number }>(items: T[], orderedIds: string[]): T[] {
  const pos = new Map(orderedIds.map((id, i) => [id, i + 1]));
  return items.map((it) => {
    const n = pos.get(it.id);
    return n === undefined || n === it.number ? it : { ...it, number: n };
  });
}

/* ── Pure selektorlar ── */
export function unitsForClass(units: Unit[], classId: string): Unit[] {
  return units.filter((u) => u.classId === classId).sort((a, b) => a.number - b.number);
}
export function lessonsForClass(lessons: Lesson[], classId: string): Lesson[] {
  return lessons.filter((l) => l.classId === classId);
}
/** Sinf boʻyicha rejalanmagan (bankdagi) mavzular */
export function unscheduledForClass(lessons: Lesson[], classId: string): Lesson[] {
  return lessons.filter((l) => l.classId === classId && !l.scheduledDate);
}
/** Berilgan "YYYY-MM-DD" kuniga rejalangan darslar */
export function scheduledForDate(lessons: Lesson[], dateKey: string): Lesson[] {
  return lessons.filter((l) => l.scheduledDate === dateKey);
}

interface LessonState {
  units: Unit[];
  lessons: Lesson[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  addUnit: (data: { classId: string; title: string; description?: string }) => string;
  updateUnit: (id: string, patch: Partial<Omit<Unit, "id">>) => void;
  /** Boʻlimni oʻchirish. `withLessons` (standart: rost) — ichidagi darslar
      ham oʻchadi (jadvaldagi sessiyalari bilan). `false` — darslar saqlanib,
      «Boʻlimsiz» ga oʻtadi. */
  deleteUnit: (id: string, opts?: { withLessons?: boolean }) => void;
  /** Tartiblash rejimi «Tayyor»: berilgan guruh (bitta sinf boʻlimlari yoki
      bitta boʻlim mavzulari) `number` i roʻyxat tartibida 1..n qilib yoziladi.
      Oʻzgarmagan qatorlar tegilmaydi — sinxron diff faqat surilganlarni yuboradi. */
  reorderUnits: (orderedIds: string[]) => void;
  reorderLessons: (orderedIds: string[]) => void;
  /** Oʻchirilgan boʻlimni (va unga tegishli boʻlgan darslar boʻlim-bogʻlanishini) qaytarish — undo uchun. */
  restoreUnit: (unit: Unit, lessonIds: string[]) => void;

  addLesson: (data: { classId: string; unitId: string | null; title: string; status?: LessonStatus }) => string;
  updateLesson: (id: string, patch: Partial<Omit<Lesson, "id">>) => void;
  deleteLesson: (id: string) => void;

  scheduleLesson: (id: string, dateKey: string, startMin: number, endMin: number) => void;
  unscheduleLesson: (id: string) => void;
  setStatus: (id: string, status: LessonStatus) => void;
  /** Dars rejasi tayyor belgisi. */
  setPlanReady: (id: string, ready: boolean) => void;
  /** Oʻtildi (`dateKey`) / oʻtilmagan (`null`). Eski `status` ham moslanadi —
      progress chiziqlari va boshqa isteʼmolchilar hali `Completed` ni oʻqiydi. */
  setTaught: (id: string, dateKey: string | null) => void;

  /** Bitta sessiyani boshqa sana/vaqtga koʻchirish (planner drag/tahrir). */
  moveSession: (id: string, classId: string, oldDate: string, oldStartMin: number, newDate: string, newStartMin: number, newEndMin: number) => void;
  /** Surish dvigateli (`@/lib/lesson-shift`) natijasini BITTA holat oʻzgarishida
      qoʻllash: har darsda `from` lar olinib, `to` lar qoʻshiladi (toʻplam
      sifatida — bitta darsning ketma-ket sessiyalari ham toʻgʻri siljiydi). */
  applySessionMoves: (classId: string, moves: SessionMove[]) => void;
  /** Berilgan sinfdagi aynan bitta sessiyani olib tashlash (bankka qaytarish). */
  unscheduleSession: (id: string, classId: string, date: string, startMin: number) => void;
  /** Oʻchirilgan darsni TOʻLIQ (content/standards/scheduleByClass bilan) qaytarish. */
  restoreLesson: (lesson: Lesson) => void;
  /** Aʼzo BOʻLMAGAN sinflarga tegishli jadval yozuvlarini tozalash. Nechta
      yozuv olib tashlangani qaytadi (0 = holat izchil, store tegilmaydi). */
  pruneOrphanSessions: () => number;

  /* ── Koʻp-sinf (Model A) ── */
  /** Darsning aʼzo sinflarini oʻrnatish; boʻlim/jadval xaritalari tozalanadi (endi yoʻq sinflar uchun). */
  setLessonClasses: (id: string, classIds: string[]) => void;
  /** Berilgan sinf uchun boʻlim tanlash. */
  setUnitForClass: (id: string, classId: string, unitId: string | null) => void;
  /** Berilgan sinf uchun yangi sessiya (sana+vaqt) qoʻshish (koʻp sana). */
  addScheduleForClass: (id: string, classId: string, dateKey: string, startMin: number, endMin: number) => void;
  /** Berilgan sinf sessiyalaridan birini (indeks boʻyicha) olib tashlash. */
  removeScheduleForClass: (id: string, classId: string, index: number) => void;
}

export const useLessonStore = create<LessonState>()(
  (set, get) => ({
      units: [],
      lessons: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addUnit: ({ classId, title, description = "" }) => {
        const id = uid("u");
        const nextNumber = Math.max(0, ...get().units.filter((u) => u.classId === classId).map((u) => u.number)) + 1;
        set((s) => ({ units: [...s.units, { id, classId, number: nextNumber, title, description }] }));
        return id;
      },
      reorderUnits: (orderedIds) => set((s) => ({ units: renumber(s.units, orderedIds) })),
      reorderLessons: (orderedIds) => set((s) => ({ lessons: renumber(s.lessons, orderedIds) })),
      updateUnit: (id, patch) => set((s) => ({ units: s.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUnit: (id, opts) => set((s) => {
        const withLessons = opts?.withLessons ?? true;
        const lessons: Lesson[] = [];
        for (const l of s.lessons) {
          if (!lessonUnitIds(l).includes(id)) { lessons.push(l); continue; }
          // Dars BOSHQA boʻlimga ham tegishli (koʻp-sinf) boʻlsa oʻchmaydi —
          // faqat shu boʻlim bogʻlanishi uziladi, aks holda boshqa sinfning
          // rejasi ham qoʻshimcha yoʻqotishga uchrardi.
          const linkedElsewhere = lessonUnitIds(l).some((uid) => uid !== id);
          if (withLessons && !linkedElsewhere) continue;
          const unitByClass = l.unitByClass
            ? Object.fromEntries(Object.entries(l.unitByClass).map(([cid, uid]) => [cid, uid === id ? null : uid]))
            : l.unitByClass;
          lessons.push({ ...l, unitId: l.unitId === id ? null : l.unitId, unitByClass });
        }
        return { units: s.units.filter((u) => u.id !== id), lessons };
      }),
      restoreUnit: (unit, lessonIds) => set((s) => ({
        units: s.units.some((u) => u.id === unit.id) ? s.units : [...s.units, unit],
        lessons: s.lessons.map((l) => (lessonIds.includes(l.id) ? { ...l, unitId: unit.id } : l)),
      })),

      addLesson: ({ classId, unitId, title, status = "Unscheduled" }) => {
        const id = uid("l");
        const nextNumber = Math.max(0, ...get().lessons.filter((l) => l.classId === classId && l.unitId === unitId).map((l) => l.number)) + 1;
        set((s) => ({ lessons: [...s.lessons, { id, classId, unitId, number: nextNumber, title, status }] }));
        return id;
      },
      updateLesson: (id, patch) => set((s) => ({
        lessons: s.lessons.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l)),
      })),
      deleteLesson: (id) => set((s) => ({ lessons: s.lessons.filter((l) => l.id !== id) })),

      scheduleLesson: (id, dateKey, startMin, endMin) => set((s) => ({
        lessons: s.lessons.map((l) => l.id === id ? {
          ...l, status: "Scheduled", scheduledDate: dateKey, startMin, endMin,
          date: fmtDisplayDate(dateKey), time: fmtDisplayTime(startMin),
        } : l),
      })),
      unscheduleLesson: (id) => set((s) => ({
        lessons: s.lessons.map((l) => l.id === id ? {
          ...l, status: "Unscheduled", scheduleByClass: {},
          scheduledDate: undefined, startMin: undefined, endMin: undefined, date: undefined, time: undefined,
        } : l),
      })),
      setStatus: (id, status) => set((s) => ({ lessons: s.lessons.map((l) => (l.id === id ? { ...l, status } : l)) })),
      setPlanReady: (id, ready) => set((s) => ({ lessons: s.lessons.map((l) => (l.id === id ? { ...l, planReady: ready } : l)) })),
      setTaught: (id, dateKey) => set((s) => ({
        lessons: s.lessons.map((l) => {
          if (l.id !== id) return l;
          const status: LessonStatus = dateKey
            ? "Completed"
            : anySessions(scheduleMapOf(l)) ? "Scheduled" : "Unscheduled";
          return { ...l, taughtAt: dateKey, status };
        }),
      })),

      moveSession: (id, classId, oldDate, oldStartMin, newDate, newStartMin, newEndMin) => set((s) => ({
        lessons: s.lessons.map((l) => {
          if (l.id !== id) return l;
          const base = scheduleMapOf(l);
          const prev = base[classId] ?? [];
          const idx = prev.findIndex((x) => x.date === oldDate && x.startMin === oldStartMin);
          const nextArr = (idx >= 0
            ? prev.map((x, i) => (i === idx ? { date: newDate, startMin: newStartMin, endMin: newEndMin } : x))
            : [...prev, { date: newDate, startMin: newStartMin, endMin: newEndMin }])
            .slice().sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
          const scheduleByClass = { ...base, [classId]: nextArr };
          const primary = (l.classIds && l.classIds[0]) || l.classId;
          return {
            ...l, scheduleByClass, status: "Scheduled" as LessonStatus,
            ...(classId === primary ? legacyScheduleFields(scheduleByClass[primary]) : {}),
          };
        }),
      })),

      applySessionMoves: (classId, moves) => set((s) => {
        const byLesson = new Map<string, SessionMove[]>();
        for (const m of moves) byLesson.set(m.lessonId, [...(byLesson.get(m.lessonId) ?? []), m]);
        return {
          lessons: s.lessons.map((l) => {
            const ms = byLesson.get(l.id);
            if (!ms) return l;
            const base = scheduleMapOf(l);
            const arr = [...(base[classId] ?? [])];
            for (const m of ms) {
              if (!m.from) continue;
              const i = arr.findIndex((x) => x.date === m.from!.date && x.startMin === m.from!.startMin);
              if (i >= 0) arr.splice(i, 1);
            }
            for (const m of ms) if (m.to) arr.push({ ...m.to });
            arr.sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
            const scheduleByClass = { ...base };
            if (arr.length) scheduleByClass[classId] = arr; else delete scheduleByClass[classId];
            const has = anySessions(scheduleByClass);
            const status: LessonStatus = !has && l.status === "Scheduled" ? "Unscheduled"
              : has && l.status === "Unscheduled" ? "Scheduled" : l.status;
            const primary = (l.classIds && l.classIds[0]) || l.classId;
            return { ...l, scheduleByClass, status, ...(classId === primary ? legacyScheduleFields(scheduleByClass[primary]) : {}) };
          }),
        };
      }),

      unscheduleSession: (id, classId, date, startMin) => set((s) => ({
        lessons: s.lessons.map((l) => {
          if (l.id !== id) return l;
          const base = scheduleMapOf(l);
          const nextArr = (base[classId] ?? []).filter((x) => !(x.date === date && x.startMin === startMin));
          const scheduleByClass = { ...base };
          if (nextArr.length) scheduleByClass[classId] = nextArr; else delete scheduleByClass[classId];
          const primary = (l.classIds && l.classIds[0]) || l.classId;
          return {
            ...l, scheduleByClass,
            status: (anySessions(scheduleByClass) ? l.status : "Unscheduled") as LessonStatus,
            ...(classId === primary ? legacyScheduleFields(scheduleByClass[primary]) : {}),
          };
        }),
      })),

      restoreLesson: (lesson) => set((s) => (
        s.lessons.some((l) => l.id === lesson.id) ? s : { lessons: [...s.lessons, lesson] }
      )),

      /* Aʼzolik (`classIds`) — yagona haqiqat: dars roʻyxatlari, «Ulash»
         nomzodlari, boʻlim filtri — hammasi shundan oʻqiydi. `scheduleByClass`
         da aʼzo boʻlmagan sinf qolib ketsa, dars HECH QAYSI roʻyxatda
         koʻrinmaydi, lekin plannerda kunga ulangan holda turaveradi —
         foydalanuvchi uni oʻchira olmaydi (2026-09-18 kuzatuvi). Bu yerda
         shunday yozuvlar bir marta, hydration'dan keyin tozalanadi. */
      pruneOrphanSessions: () => {
        let removed = 0;
        const lessons = get().lessons.map((l) => {
          const map = l.scheduleByClass;
          if (!map) return l;
          const members = new Set(lessonClassIds(l));
          const orphanKeys = Object.keys(map).filter((cid) => !members.has(cid));
          if (!orphanKeys.length) return l;
          const next = { ...map };
          for (const cid of orphanKeys) {
            removed += next[cid]?.length ?? 0;
            delete next[cid];
          }
          // Xarita boʻshab qolsa `lessonSessions()` legacy maydonlardan
          // sessiya SINTEZ qiladi — aʼzo boʻlmagan sinf shu yoʻl bilan
          // plannerga qaytib chiqmasin.
          const legacyOrphan = !anySessions(next) && !!l.classId && !members.has(l.classId);
          return {
            ...l,
            scheduleByClass: next,
            ...(legacyOrphan ? legacyScheduleFields(undefined) : {}),
            status: (anySessions(next) ? l.status : "Unscheduled") as LessonStatus,
          };
        });
        if (removed) set({ lessons });
        return removed;
      },

      /* ── Koʻp-sinf (Model A) ──
         classIds[0] = "asosiy" sinf; legacy maydonlar (classId/unitId/scheduledDate/
         date/time) asosiy sinf bilan sinxron — shunda lessons-list/planner ishlaydi. */
      setLessonClasses: (id, classIds) => set((s) => ({
        lessons: s.lessons.map((l) => {
          if (l.id !== id) return l;
          const primary = classIds[0];
          // Legacy → xarita koʻchirish: ilk marta koʻp-sinfga oʻtganda eski
          // classIdʼdagi boʻlim/jadval yoʻqolmasin.
          const seedUnit: Record<string, string | null> = { ...(l.unitByClass ?? {}) };
          if (l.classId && !(l.classId in seedUnit) && l.unitId != null) seedUnit[l.classId] = l.unitId;
          const seedSched: Record<string, LessonSession[]> = { ...(l.scheduleByClass ?? {}) };
          if (l.classId && !(l.classId in seedSched) && l.scheduledDate) {
            seedSched[l.classId] = [{ date: l.scheduledDate, startMin: l.startMin ?? 0, endMin: l.endMin ?? 0 }];
          }
          const unitByClass = Object.fromEntries(Object.entries(seedUnit).filter(([cid]) => classIds.includes(cid)));
          const scheduleByClass = Object.fromEntries(Object.entries(seedSched).filter(([cid]) => classIds.includes(cid)));
          return {
            ...l, classIds, unitByClass, scheduleByClass,
            classId: primary ?? l.classId,
            unitId: primary ? (unitByClass[primary] ?? null) : l.unitId,
            ...legacyScheduleFields(primary ? scheduleByClass[primary] : undefined),
            status: (anySessions(scheduleByClass) ? l.status === "Draft" ? "Scheduled" : l.status : l.status === "Scheduled" ? "Unscheduled" : l.status) as LessonStatus,
            classCount: (classIds?.length ?? 0),
          };
        }),
      })),

      setUnitForClass: (id, classId, unitId) => set((s) => ({
        lessons: s.lessons.map((l) => {
          if (l.id !== id) return l;
          const unitByClass = { ...(l.unitByClass ?? {}), [classId]: unitId };
          const primary = (l.classIds && l.classIds[0]) || l.classId;
          return { ...l, unitByClass, ...(classId === primary ? { unitId } : {}) };
        }),
      })),

      addScheduleForClass: (id, classId, dateKey, startMin, endMin) => set((s) => ({
        lessons: s.lessons.map((l) => {
          if (l.id !== id) return l;
          const prev = l.scheduleByClass?.[classId] ?? [];
          // Bir sanaga bir nechta vaqt boʻlishi mumkin — faqat aynan bir xil
          // sana+vaqt takrorlanmasin. Sana, keyin boshlanish vaqti boʻyicha tartib.
          const dup = prev.some((x) => x.date === dateKey && x.startMin === startMin && x.endMin === endMin);
          const next = (dup ? prev : [...prev, { date: dateKey, startMin, endMin }])
            .slice().sort((a, b) => a.date.localeCompare(b.date) || a.startMin - b.startMin);
          const scheduleByClass = { ...(l.scheduleByClass ?? {}), [classId]: next };
          const primary = (l.classIds && l.classIds[0]) || l.classId;
          return {
            ...l, scheduleByClass, status: "Scheduled" as LessonStatus,
            ...(classId === primary ? legacyScheduleFields(next) : {}),
          };
        }),
      })),

      removeScheduleForClass: (id, classId, index) => set((s) => ({
        lessons: s.lessons.map((l) => {
          if (l.id !== id) return l;
          const prev = l.scheduleByClass?.[classId] ?? [];
          const next = prev.filter((_, i) => i !== index);
          const scheduleByClass = { ...(l.scheduleByClass ?? {}) };
          if (next.length) scheduleByClass[classId] = next; else delete scheduleByClass[classId];
          const primary = (l.classIds && l.classIds[0]) || l.classId;
          return {
            ...l, scheduleByClass,
            status: (anySessions(scheduleByClass) ? l.status : "Unscheduled") as LessonStatus,
            ...(classId === primary ? legacyScheduleFields(scheduleByClass[primary]) : {}),
          };
        }),
      })),
  })
);
