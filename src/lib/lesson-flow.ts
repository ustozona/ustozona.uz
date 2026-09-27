import type { TimetableEvent } from "@/lib/timetable";
import {
  isPinned, isTaught, lessonClassIds, lessonOrderFor, lessonSessions, unitIdForClass,
  type Lesson, type LessonSession, type Unit,
} from "@/lib/lessons-data";
import { distributeTopics, slotKey } from "@/lib/ish-reja/distribute";
import type { SessionMove } from "@/lib/lesson-shift";

/* ════════════════════════════════════════════════════════════════════
   DARS OQIMI — sof funksiyalar, UI va store'dan mustaqil.

   Qoida: sinfda darslar TARTIBI haqiqat manbai, kelajakdagi SANALAR
   undan hisoblanadi. Taklif: `docs/darslar-oqimi-taklif.md`.

   Oqim (F) — sinfning oʻtilmagan, qadalmagan va kelajakda sessiyasi bor
   darslari, ketma-ketlik tartibida (boʻlimlar tartibi → boʻlim ichidagi
   tartib; «Boʻlimsiz» oxirida). Dars davomiyligi = kelajakdagi
   sessiyalari soni.

   Havza (S) — F egallab turgan kelajakdagi slotlar. Qayta joylash S ni
   F ga tartib boʻyicha ketma-ket beradi:
   - havza yetmasa, oxirgi slotdan keyingi boʻsh jadval slotlari
     qoʻshiladi (import taqsimoti bilan bir qoida — `distributeTopics`);
   - ortib qolsa, oxirgi slotlar boʻshaydi;
   - joy topilmasa, dars sanasiz qoladi (`to: null`).

   Havza ichidagi boʻshliqlar (ataylab boʻsh qoldirilgan kunlar) saqlanadi —
   oqim ularni toʻldirmaydi. Nima qimirlamaydi:
   - oʻtmish (bugundan oldin yoki bugun boshlangan dars);
   - oʻtilgan va qadalgan darslar — ular toʻsiq, oqim ularni chetlab oʻtadi;
   - sanasiz darslar — oqimda emas.
   ════════════════════════════════════════════════════════════════════ */

export type FlowNow = { today: string; nowMin: number };

export type FlowEnv = {
  eventsForDate: (dateKey: string) => TimetableEvent[];
  isHoliday: (dateKey: string) => boolean;
  /** Oxirgi joylash kuni (odatda oʻquv yili tugashi). */
  toKey: string;
  now: FlowNow;
};

const cmpSession = (a: LessonSession, b: LessonSession) => a.date.localeCompare(b.date) || a.startMin - b.startMin;
const keyOf = (s: LessonSession) => slotKey(s.date, s.startMin);

/** Sessiya oʻtmishdami — boshlangan dars ham oʻtmish (qayta joylanmaydi). */
export function isFrozen(s: LessonSession, now: FlowNow): boolean {
  return s.date < now.today || (s.date === now.today && s.startMin <= now.nowMin);
}

/** Darsning shu sinfdagi sessiyalari (vaqt boʻyicha, takrorsiz). */
export function classSessions(l: Lesson, classId: string): LessonSession[] {
  const seen = new Set<string>();
  const out: LessonSession[] = [];
  for (const s of lessonSessions(l)) {
    if (s.classId !== classId) continue;
    const k = slotKey(s.date, s.startMin);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ date: s.date, startMin: s.startMin, endMin: s.endMin });
  }
  return out.sort(cmpSession);
}

/** Boʻlimning sinfdagi oʻrni; «Boʻlimsiz» (va sinfda yoʻq boʻlim) — hammasidan keyin. */
function unitRanker(units: readonly Unit[], classId: string): (l: Lesson) => number {
  const classUnits = units.filter((u) => u.classId === classId).sort((a, b) => a.number - b.number);
  const rank = new Map(classUnits.map((u, i) => [u.id, i]));
  return (l) => rank.get(unitIdForClass(l, classId) ?? "") ?? classUnits.length;
}

/** Sinfdagi barcha darslar ketma-ketlik tartibida. Tenglikda massivdagi
    oʻrin saqlanadi — Darslar sahifasidagi raqamlash bilan bir xil. */
export function flowSequence(lessons: readonly Lesson[], units: readonly Unit[], classId: string): Lesson[] {
  const rankOf = unitRanker(units, classId);
  return lessons
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => lessonClassIds(l).includes(classId))
    .sort((a, b) =>
      rankOf(a.l) - rankOf(b.l) || lessonOrderFor(a.l, classId) - lessonOrderFor(b.l, classId) || a.i - b.i)
    .map(({ l }) => l);
}

export type FlowItem = {
  lessonId: string;
  unitRank: number;
  /** Kelajakdagi sessiyalar (vaqt boʻyicha) — soni davomiylik. */
  sessions: LessonSession[];
};

export type ClassFlow = {
  classId: string;
  /** F — oqimdagi darslar, ketma-ketlik tartibida. */
  items: FlowItem[];
  /** S — F egallagan kelajakdagi slotlar (vaqt boʻyicha, takrorsiz). */
  pool: LessonSession[];
  /** Oqimdan tashqari darslar (oʻtilgan, qadalgan) egallagan kelajakdagi slotlar. */
  blocked: Set<string>;
  /** Sinfning barcha band slotlari (oʻtmish ham). */
  occupied: Set<string>;
};

export function classFlow(lessons: readonly Lesson[], units: readonly Unit[], classId: string, now: FlowNow): ClassFlow {
  const rankOf = unitRanker(units, classId);
  const items: FlowItem[] = [];
  const blocked = new Set<string>();
  const occupied = new Set<string>();
  const pool = new Map<string, LessonSession>();
  for (const l of flowSequence(lessons, units, classId)) {
    const all = classSessions(l, classId);
    for (const s of all) occupied.add(keyOf(s));
    const future = all.filter((s) => !isFrozen(s, now));
    if (!future.length) continue;
    if (isTaught(l, classId) || isPinned(l, classId)) {
      for (const s of future) blocked.add(keyOf(s));
      continue;
    }
    items.push({ lessonId: l.id, unitRank: rankOf(l), sessions: future });
    for (const s of future) pool.set(keyOf(s), s);
  }
  return { classId, items, pool: [...pool.values()].sort(cmpSession), blocked, occupied };
}

export type ReflowChange = {
  lessonId: string;
  /** Birinchi kelajakdagi sessiya — oldin va keyin (`null` — sigʻmadi). */
  before: LessonSession;
  after: LessonSession | null;
};

export type ReflowPlan = {
  classId: string;
  moves: SessionMove[];
  changes: ReflowChange[];
  /** Jadvalga sigʻmay, sanasiz qolgan darslar. */
  overflow: string[];
};

/** Havzani oqimga tartib boʻyicha beradi. `pool` — qayta joylashda
    ishlatiladigan slotlar (odatda `flow.pool`; amalga qarab
    kengaytirilgan yoki qisqartirilgan). */
export function planReflow(flow: ClassFlow, pool: readonly LessonSession[], env: FlowEnv): ReflowPlan {
  const { classId, items } = flow;
  const uniq = new Map<string, LessonSession>();
  for (const s of pool) {
    const k = keyOf(s);
    if (!flow.blocked.has(k) && !isFrozen(s, env.now) && !uniq.has(k)) uniq.set(k, s);
  }
  const slots = [...uniq.values()].sort(cmpSession);

  const need = items.reduce((n, it) => n + it.sessions.length, 0);
  if (slots.length < need) {
    // Kengaytma havzaning ham, oqim darslarining hozirgi sessiyalarining ham
    // oxiridan boshlanadi — slot toʻsiq bilan toʻqnashgan dars oldinroqqa
    // (bugunga) tortib yuborilmasin.
    const last = [...slots, ...items.flatMap((it) => it.sessions)].sort(cmpSession).at(-1);
    const fromKey = last?.date ?? env.now.today;
    const occupied = new Set([...flow.occupied, ...flow.blocked, ...uniq.keys()]);
    // Boshlangʻich kunda oxirgi slotdan (yoki hozirdan) oldingi slotlar ham band.
    const edge = last ? last.startMin : env.now.nowMin;
    for (const e of env.eventsForDate(fromKey)) {
      if (e.classId === classId && e.startMin <= edge) occupied.add(slotKey(fromKey, e.startMin));
    }
    const extra = distributeTopics({
      classId, count: need - slots.length, fromKey, toKey: env.toKey,
      eventsForDate: env.eventsForDate, isHoliday: env.isHoliday, occupied,
    });
    for (const s of extra) if (s) slots.push(s);
  }

  const moves: SessionMove[] = [];
  const changes: ReflowChange[] = [];
  const overflow: string[] = [];
  let cursor = 0;
  for (const it of items) {
    const next = it.sessions.map(() => slots[cursor++] ?? null);
    const nextKeys = new Set(next.flatMap((s) => (s ? [keyOf(s)] : [])));
    const oldKeys = new Set(it.sessions.map(keyOf));
    const removed = it.sessions.filter((s) => !nextKeys.has(keyOf(s)));
    const added = next.filter((s): s is LessonSession => !!s && !oldKeys.has(keyOf(s)));
    if (!removed.length) continue;
    removed.forEach((from, j) => {
      const to = added[j] ?? null;
      moves.push({ lessonId: it.lessonId, from, to: to && { date: to.date, startMin: to.startMin, endMin: to.endMin } });
    });
    const lost = next.some((s) => s === null);
    if (lost) overflow.push(it.lessonId);
    changes.push({ lessonId: it.lessonId, before: it.sessions[0], after: next.find((s) => s !== null) ?? null });
  }
  return { classId, moves, changes, overflow };
}

/** Sanalar tartibga mosmi: havzani oqimga berish joriy holatni qayta hosil qiladimi. */
export function isFlowConsistent(flow: ClassFlow, env: FlowEnv): boolean {
  return planReflow(flow, flow.pool, env).moves.length === 0;
}

/* ── Darsni sanaga qoʻyish (planner'da tashlash, sana tahriri, bogʻlash) ──

   Tashlangan slot (B) band boʻlsa:
   - shu boʻlimdagi oqim darsi Y — QOʻYISH: dars Y ning oʻrniga keladi
     (keyinroqqa surilsa Y dan keyin, aks holda Y dan oldin), orada
     qolganlar suriladi;
   - boshqa boʻlimdagi oqim darsi — QADASH: dars B ga qadaladi, Y oldinga
     suriladi (boʻlim chegarasi buzilmaydi);
   - oʻtilgan yoki qadalgan dars — oddiy koʻchirish, oqimga tegilmaydi.
   B boʻsh boʻlsa dars B ga oʻtadi va sana boʻyicha qoʻshnilari orasiga
   tartiblanadi; boʻlim chegarasi buzilsa — B ga qadaladi. Boʻshagan eski
   slot boʻsh qoladi.

   B band-ligi planner koʻrinishi bilan bir xil oʻlchanadi: boshlanishi B
   oraligʻiga tushgan sessiya B da turibdi (08:05 dagi dars 08:00–08:45
   slotida). Shunda dars aynan oʻsha sessiyaning oʻrnini oladi. */

/** Sessiya B oraligʻida boshlanadimi (planner'dagi «slotda turibdi» qoidasi). */
function startsIn(s: LessonSession, to: LessonSession): boolean {
  return s.date === to.date && (s.startMin === to.startMin || (s.startMin >= to.startMin && s.startMin < to.endMin));
}

export type DropDecision =
  | { kind: "plain" }
  | {
    kind: "flow";
    /** Dars sessiyasi yoziladigan slot: B dagi oqim darsining sessiyasi yoki B. */
    target: LessonSession;
    /** Dars sessiyasi `target` ga yoziladi (aks holda faqat tartib oʻzgaradi). */
    setSession: boolean;
    /** Dars B ga qadaladi. */
    pin: boolean;
    /** Boʻlimning yangi tartibi (sinf koʻrinishida) yoki `null` — oʻzgarmaydi. */
    order: string[] | null;
  };

export function planDrop(opts: {
  lessons: readonly Lesson[];
  units: readonly Unit[];
  classId: string;
  lessonId: string;
  /** Koʻchirilayotgan sessiya; bankdan kelsa `null`. */
  from: LessonSession | null;
  to: LessonSession;
  now: FlowNow;
}): DropDecision {
  const { lessons, units, classId, lessonId, from, to, now } = opts;
  const plain: DropDecision = { kind: "plain" };
  const x = lessons.find((l) => l.id === lessonId);
  if (!x || isFrozen(to, now) || isTaught(x, classId)) return plain;

  const fromKey = from ? keyOf(from) : null;
  if (classSessions(x, classId).some((s) => keyOf(s) !== fromKey && startsIn(s, to))) return plain;
  const occupied = lessons.flatMap((l) => (l.id === lessonId ? [] : classSessions(l, classId)
    .filter((s) => startsIn(s, to))
    .map((s) => ({ l, s }))));
  if (occupied.some(({ l }) => isTaught(l, classId) || isPinned(l, classId))) return plain;
  const target = occupied[0]?.s ?? to;
  // Qadalgan dars qadalganicha koʻchadi; B dagi oqim darsi oldinga suriladi.
  if (isPinned(x, classId)) return { kind: "flow", target, setSession: true, pin: false, order: null };

  const flow = classFlow(lessons, units, classId, now);
  const items = new Map(flow.items.map((it) => [it.lessonId, it]));
  const xRank = unitRanker(units, classId)(x);
  const xInFlow = !!from && !!items.get(lessonId)?.sessions.some((s) => keyOf(s) === fromKey);

  const y = occupied.map(({ l }) => items.get(l.id)).find((it) => !!it);
  if (y) {
    if (y.unitRank !== xRank) return { kind: "flow", target, setSession: true, pin: true, order: null };
    const later = xInFlow && cmpSession(target, from!) > 0;
    return {
      kind: "flow", target, setSession: !xInFlow, pin: false,
      order: placeInUnit(lessons, units, classId, x, y.lessonId, later ? "after" : "before"),
    };
  }

  // B boʻsh: sana boʻyicha qoʻshnilar.
  let prev: FlowItem | null = null;
  let next: FlowItem | null = null;
  for (const it of flow.items) {
    if (it.lessonId === lessonId) continue;
    const first = it.sessions[0];
    if (cmpSession(first, to) < 0) {
      if (!prev || cmpSession(first, prev.sessions[0]) > 0) prev = it;
    } else if (!next || cmpSession(first, next.sessions[0]) < 0) {
      next = it;
    }
  }
  const fits = (!prev || prev.unitRank <= xRank) && (!next || next.unitRank >= xRank);
  if (!fits) return { kind: "flow", target, setSession: true, pin: true, order: null };
  const order = next && next.unitRank === xRank
    ? placeInUnit(lessons, units, classId, x, next.lessonId, "before")
    : prev && prev.unitRank === xRank
      ? placeInUnit(lessons, units, classId, x, prev.lessonId, "after")
      : null;
  return { kind: "flow", target, setSession: true, pin: false, order };
}

/** `x` ni boʻlimida `anchor` dan oldin/keyin qoʻygandagi tartib (sinf koʻrinishida). */
function placeInUnit(
  lessons: readonly Lesson[], units: readonly Unit[], classId: string,
  x: Lesson, anchorId: string, where: "before" | "after",
): string[] | null {
  const rankOf = unitRanker(units, classId);
  const r = rankOf(x);
  const group = flowSequence(lessons, units, classId).filter((l) => rankOf(l) === r).map((l) => l.id);
  const rest = group.filter((id) => id !== x.id);
  const at = rest.indexOf(anchorId);
  if (at < 0) return null;
  rest.splice(where === "before" ? at : at + 1, 0, x.id);
  return rest.every((id, i) => id === group[i]) ? null : rest;
}
