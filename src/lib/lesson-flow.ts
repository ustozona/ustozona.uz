import type { TimetableEvent } from "@/lib/timetable";
import {
  isPinned, isTaught, lessonClassIds, lessonOrderFor, lessonSessions, unitIdForClass,
  type Lesson, type LessonSession, type Unit,
} from "@/lib/lessons-data";
import { classSlotsOn, distributeTopics, slotKey } from "@/lib/ish-reja/distribute";
import { addDaysKey } from "@/lib/date-keys";
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
   F ga tartib boʻyicha ketma-ket beradi (`assignSlots`):
   - dars surilayotganda yoʻlida dars biriktirilmagan boʻsh jadval sloti
     boʻlsa — oʻsha slotga tushadi, surilish shu yerda toʻxtaydi, undan
     keyingilar joyidan qimirlamaydi (boʻsh slot kechikishni yutadi);
   - havza yetmasa, keyingi boʻsh jadval slotlari qoʻshiladi (import
     taqsimoti bilan bir qoida — taʼtil va band slot oʻtkaziladi);
   - ortib qolsa, oxirgi slotlar boʻshaydi;
   - joy topilmasa, dars sanasiz qoladi (`to: null`).

   Dars oʻz sanasidan OLDINGA boʻsh slotga tortilmaydi — boʻsh kun faqat
   surilish yetib kelganda toʻladi; tartiblash va oʻchirishda boʻsh slotga
   tegilmaydi. Ataylab darssiz qoldiriladigan vaqt: butun kun — taʼtil /
   «kunni bloklash» (barcha sinflar); bitta sinfning sloti (masalan nazorat
   ishi) — shu slotga qadalgan dars. Ikkalasi ham toʻlmaydi. Nima qimirlamaydi:
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

/** Jadvalning `fromKey` kunidan boshlab `count` ta boʻsh sloti (taʼtil va
    band slotlar oʻtkaziladi). Boshlangʻich kunda `afterMin` gacha boshlangan
    slotlar, bugun esa allaqachon boshlanganlari ham band hisoblanadi;
    oʻtmishdagi kun bugundan boshlanadi. */
function freeSlotsFrom(
  flow: ClassFlow, fromKey: string, afterMin: number, count: number,
  occupied: Iterable<string>, env: FlowEnv,
): (LessonSession | null)[] {
  const from = fromKey < env.now.today ? env.now.today : fromKey;
  const edge = Math.max(from === fromKey ? afterMin : -1, from === env.now.today ? env.now.nowMin : -1);
  const occ = new Set(occupied);
  for (const e of env.eventsForDate(from)) {
    if (e.classId === flow.classId && e.startMin <= edge) occ.add(slotKey(from, e.startMin));
  }
  return distributeTopics({
    classId: flow.classId, count, fromKey: from, toKey: env.toKey,
    eventsForDate: env.eventsForDate, isHoliday: env.isHoliday, occupied: occ,
  });
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

/** Havzaning ishlatsa boʻladigan slotlari (vaqt boʻyicha, takrorsiz). Taʼtil
    (bloklangan kun), toʻsiq va oʻtmish chiqariladi — u yerdagi dars suriladi. */
function usablePool(flow: ClassFlow, pool: readonly LessonSession[], env: FlowEnv): LessonSession[] {
  const uniq = new Map<string, LessonSession>();
  for (const s of pool) {
    const k = keyOf(s);
    if (!flow.blocked.has(k) && !isFrozen(s, env.now) && !env.isHoliday(s.date) && !uniq.has(k)) uniq.set(k, s);
  }
  return [...uniq.values()].sort(cmpSession);
}

/** Sinf jadvalining boʻsh slotlari — bugundan `until` (standart — yil oxiri)
    gacha; taʼtil, boshlangan va band slotlar oʻtkaziladi. Slot band — unda
    `taken` dagi biror sessiya boshlansa (planner qoidasi: 08:05 dagi dars
    08:00–08:45 slotida turibdi), shuning uchun jadval vaqtidan siljigan dars
    ustiga boshqa dars qoʻyilmaydi. Roʻyxat kerak boʻlgancha kunma-kun quriladi. */
function freeSlotFinder(classId: string, taken: Iterable<string>, env: FlowEnv, until = env.toKey) {
  const starts = new Map<string, number[]>();
  for (const k of taken) {
    const i = k.lastIndexOf("|");
    const date = k.slice(0, i);
    const min = Number(k.slice(i + 1));
    const onDay = starts.get(date);
    if (onDay) onDay.push(min);
    else starts.set(date, [min]);
  }
  const last = until < env.toKey ? until : env.toKey;
  const list: LessonSession[] = [];
  const used = new Set<string>();
  let day = env.now.today;
  const grow = (): boolean => {
    if (day > last) return false;
    if (!env.isHoliday(day)) {
      const busy = starts.get(day) ?? [];
      for (const e of classSlotsOn(env.eventsForDate(day), classId, day)) {
        const s: LessonSession = { date: day, startMin: e.startMin, endMin: e.endMin };
        if (isFrozen(s, env.now) || busy.some((m) => m === e.startMin || (m > e.startMin && m < e.endMin))) continue;
        list.push(s);
      }
    }
    day = addDaysKey(day, 1);
    return true;
  };
  return {
    /** `after` dan keyingi birinchi ishlatilmagan boʻsh slot. */
    next(after: LessonSession | null): LessonSession | null {
      // Roʻyxat vaqt boʻyicha oʻsadi — boshlanish oʻrni ikkilik qidiruv bilan.
      let lo = 0;
      let hi = list.length;
      while (after && lo < hi) {
        const m = (lo + hi) >> 1;
        if (cmpSession(list[m], after) > 0) hi = m;
        else lo = m + 1;
      }
      for (let i = lo; ; i++) {
        while (i >= list.length) if (!grow()) return null;
        const s = list[i];
        if ((!after || cmpSession(s, after) > 0) && !used.has(keyOf(s))) return s;
      }
    },
    take(s: LessonSession) {
      used.add(keyOf(s));
    },
  };
}

type FreeSlotFinder = ReturnType<typeof freeSlotFinder>;

type SlotDemand = {
  id: string;
  /** Hozirgi kelajakdagi sessiyalar (sanasiz dumda — boʻsh). */
  current: readonly LessonSession[];
  n: number;
};

/** Slotlarni tartib boʻyicha beradi — `planReflow` va prognoz uchun yagona
    qoida. Har sessiya navbatdagi havza slotini oladi. Istisno — surilish:
    havza yetmasa (dars sloti boʻshatildi, taʼtilga tushdi yoki bitta slotga
    ikki dars kiritildi), navbatdagi havza sloti sessiyaning hozirgi
    sanasidan (va oldingi sessiyadan) keyin boʻlsa-yu, orada dars
    biriktirilmagan boʻsh jadval sloti boʻlsa — sessiya oʻsha boʻsh slotga
    tushadi. Ishlatilmay qolgan havza sloti keyingi darsga oʻtadi, shuning
    uchun undan keyingilar joyidan qimirlamaydi. Havza yetsa (tartiblash,
    planner'da tashlash, oʻchirish) — sof oʻrin almashtirish, boʻsh slotga
    tegilmaydi. Havza tugasa — keyingi boʻsh slotlar. */
function assignSlots(
  flow: ClassFlow, slots: readonly LessonSession[], demand: readonly SlotDemand[], env: FlowEnv,
): Map<string, (LessonSession | null)[]> {
  // Kelishgan oqimda boʻsh slot umuman soʻralmaydi — qidiruv kerak boʻlganda quriladi.
  let finder: FreeSlotFinder | null = null;
  const free = () => (finder ??= freeSlotFinder(flow.classId, [...flow.occupied, ...flow.blocked, ...slots.map(keyOf)], env));
  // Havzadan tashqariga chiqadigan sessiyalar soni — shuncha surilish boʻsh
  // slotda toʻxtashi mumkin. Sanasiz dum (`current` boʻsh) hisobga kirmaydi:
  // prognozda oqim darslari `planReflow` dagidek joylanadi.
  let budget = Math.max(0, demand.reduce((n, d) => n + d.current.length, 0) - slots.length);
  const out = new Map<string, (LessonSession | null)[]>();
  let vi = 0;
  let cursor: LessonSession | null = null;
  for (const d of demand) {
    const got: (LessonSession | null)[] = [];
    for (let j = 0; j < d.n; j++) {
      const v = slots[vi] ?? null;
      const cur = d.current[j] ?? null;
      // Chegara — hozirgi sana va oldingi sessiyaning kechrogʻi: dars oʻz
      // sanasidan oldinga boʻsh slotga tortilmaydi. Navbatdagi havza sloti
      // chegaradan keyin boʻlmasa, surilish yoʻq — boʻsh slot izlanmaydi.
      const bound: LessonSession | null = cur && (!cursor || cmpSession(cur, cursor) > 0) ? cur : cursor;
      const gap: LessonSession | null = !v ? free().next(bound)
        : budget > 0 && bound && cmpSession(v, bound) > 0 ? free().next(bound) : null;
      let s: LessonSession | null;
      if (gap && (!v || cmpSession(gap, v) < 0)) {
        free().take(gap);
        if (v) budget--;
        s = gap;
      } else {
        s = v;
        if (v) vi++;
      }
      got.push(s);
      if (s) cursor = s;
    }
    out.set(d.id, got);
  }
  return out;
}

/** Havzani oqimga tartib boʻyicha beradi. `pool` — qayta joylashda
    ishlatiladigan slotlar (odatda `flow.pool`; amalga qarab
    kengaytirilgan yoki qisqartirilgan). */
export function planReflow(flow: ClassFlow, pool: readonly LessonSession[], env: FlowEnv): ReflowPlan {
  const { classId, items } = flow;
  const assigned = assignSlots(
    flow, usablePool(flow, pool, env),
    items.map((it) => ({ id: it.lessonId, current: it.sessions, n: it.sessions.length })), env,
  );

  const moves: SessionMove[] = [];
  const changes: ReflowChange[] = [];
  const overflow: string[] = [];
  for (const it of items) {
    const next = assigned.get(it.lessonId) ?? [];
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

/** Sessiya sinf jadvalidagi biror slotda boshlanadimi. Sinfning shu sanada
    amaldagi jadvalida umuman darsi boʻlmasa (jadval hali tuzilmagan) —
    tekshirilmaydi, «mos» hisoblanadi. */
export function isOnTimetable(s: LessonSession, classId: string, env: FlowEnv): boolean {
  const events = env.eventsForDate(s.date);
  if (!events.some((e) => e.classId === classId)) return true;
  return classSlotsOn(events, classId, s.date).some((e) => s.startMin >= e.startMin && s.startMin < e.endMin);
}

/** Oqim darslarining jadvalda yoʻq vaqtga tushgan kelajakdagi sessiyalari
    (jadval versiyasi oʻzgargach). Qadalgan darslar hisobga olinmaydi. */
export function offTimetable(flow: ClassFlow, env: FlowEnv): LessonSession[] {
  return flow.items
    .flatMap((it) => it.sessions)
    .filter((s) => !isOnTimetable(s, flow.classId, env))
    .sort(cmpSession);
}

/** `fromKey` dan boshlab havzani jadvalning boʻsh slotlaridan qayta tuzish
    (ixcham). Undan oldingi slotlar oʻz joyida qoladi. */
function compactPool(flow: ClassFlow, fromKey: string, env: FlowEnv): LessonSession[] {
  const kept = flow.pool.filter((s) => s.date < fromKey);
  const need = flow.items.reduce((n, it) => n + it.sessions.length, 0);
  const fresh = freeSlotsFrom(flow, fromKey, -1, Math.max(0, need - kept.length), [...flow.blocked, ...kept.map(keyOf)], env);
  return [...kept, ...fresh.filter((s): s is LessonSession => !!s)];
}

/** Sanalarni tartibga moslash. Jadvalda yoʻq vaqtga tushgan dars boʻlsa —
    oʻsha sanadan boshlab jadvalning boʻsh slotlariga qayta (ixcham)
    joylanadi; aks holda oddiy qayta taqsimlash (taʼtil slotlari chiqadi). */
export function planRealign(flow: ClassFlow, env: FlowEnv): ReflowPlan {
  const off = offTimetable(flow, env);
  return planReflow(flow, off.length ? compactPool(flow, off[0].date, env) : flow.pool, env);
}

/** Sanalar tartibga, jadvalga va taʼtillarga mosmi. */
export function isFlowConsistent(flow: ClassFlow, env: FlowEnv): boolean {
  return planReflow(flow, flow.pool, env).moves.length === 0 && offTimetable(flow, env).length === 0;
}

/** `after` dan keyingi birinchi slot — havzadan (`exclude` dagilardan
    tashqari) yoki undan oldin kelsa, dars biriktirilmagan boʻsh jadval
    sloti; havza tugasa jadvalning birinchi boʻsh sloti. Oqimga dars
    kiritish uchun «joy egasi»: boʻsh slot boʻlsa hech kim surilmaydi,
    aks holda dars shu slotni olib, keyingilar birinchi boʻsh slotgacha
    suriladi (surish, choʻzish). `after` yoʻq — oqim boshidan oldingi vaqt
    oraliq emas, havzaning birinchi sloti. */
export function nextSlotAfter(
  flow: ClassFlow, after: LessonSession | null, exclude: ReadonlySet<string>, env: FlowEnv,
): LessonSession | null {
  const inPool = flow.pool.find((s) =>
    (!after || cmpSession(s, after) > 0) && !exclude.has(keyOf(s)) && !env.isHoliday(s.date));
  if (inPool && !after) return inPool;
  // Havza sloti bor — faqat undan oldingi boʻsh slot kerak (qidiruv oʻsha
  // kunda toʻxtaydi); yoʻq — havza oxiridan keyingi birinchi boʻsh slot.
  const from = inPool ? after : [...(after ? [after] : []), ...flow.pool].sort(cmpSession).at(-1) ?? null;
  const free = freeSlotFinder(flow.classId, [...flow.occupied, ...flow.blocked, ...exclude], env, inPool?.date)
    .next(from);
  return inPool && (!free || cmpSession(inPool, free) < 0) ? inPool : free;
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
   slotida). Shunda dars aynan oʻsha sessiyaning oʻrnini oladi.

   Jadvalda yoʻq vaqtga (masalan qoʻshimcha dars shanba kuni) qoʻyilgan dars
   qadaladi — aks holda keyingi «Moslash» uni jadval slotiga qaytarib olardi. */

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
  /** Slot sinf jadvalida bormi (berilmasa — har qanday vaqt jadvaldagi deb olinadi). */
  onTimetable?: (s: LessonSession) => boolean;
}): DropDecision {
  const { lessons, units, classId, lessonId, from, to, now, onTimetable } = opts;
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
  // Allaqachon kelajakda darsi bor mavzuga QOʻSHIMCHA sana (muharrirdan) —
  // qoʻlda tanlangan sana: mavzu qadaladi, aks holda qayta joylash yangi
  // sanani boshqa darsga berib yuborardi.
  if (!from && classSessions(x, classId).some((s) => !isFrozen(s, now))) {
    return { kind: "flow", target, setSession: true, pin: true, order: null };
  }

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

  // B boʻsh va jadvalda yoʻq vaqt — qoʻlda tanlangan sana, qadaladi.
  if (onTimetable && !onTimetable(to)) return { kind: "flow", target, setSession: true, pin: true, order: null };

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

/* ── Prognoz — Zanjir, «sigʻmaydi» chipi, yoʻl xaritasi va planner raqami
   uchun YAGONA manba ──

   `planReflow` bilan bir xil taqsimot, faqat hisob: store'ga yozilmaydi.
   Qoralama (`draft`) — tartiblash rejimidagi hali saqlanmagan tartib;
   berilsa sanalar shu tartib boʻyicha hisoblanadi («tortsam nima boʻladi»).

   «Sigʻmaydi» — ketma-ketlikda birinchi oqim darsidan KEYIN turgan,
   oʻtilmagan, qadalmagan sanasiz dars (1 slot deb olinadi), agar yil
   oxirigacha unga boʻsh slot yetmasa. Oqim darsi ham slot topa olmasa —
   sigʻmaydi. Birinchi oqim darsidan oldingi sanasiz darslar — bank,
   sanalmaydi. Qayta joylashda sigʻmagan dars sanasiz qoladi, shuning
   uchun keyin ham sanaladi: signal yoʻqolmaydi. */

export type FlowDraft = { unitOrder?: readonly string[]; lessonOrder?: readonly string[] };

export type ForecastState =
  /** Oʻtilgan. */
  | "taught"
  /** Qadalgan — oqim surmaydi. */
  | "pinned"
  /** Oqimda, kelajakda sanasi bor. */
  | "flow"
  /** Oʻtmishda qolgan, oʻtilmagan (kelajakda sessiyasi yoʻq). */
  | "past"
  /** Sanasiz. `projected` boʻlsa — oqimga kirsa oladigan sana. */
  | "unscheduled"
  /** Yil oxirigacha sigʻmaydi. */
  | "overflow";

export type ForecastRow = {
  lessonId: string;
  unitId: string | null;
  /** «2.3» (boʻlim.dars); boʻlimsiz — uzluksiz raqam. */
  index: string;
  state: ForecastState;
  /** Hozirgi sana: kelajakdagi birinchi sessiya, boʻlmasa oxirgisi. */
  current: LessonSession | null;
  /** Prognoz sanasi (oqim darslari; qoralamada — yangi tartib boʻyicha); sanasizda `null`. */
  projected: LessonSession | null;
  /** Prognoz — oxirgi sessiya (koʻp darsli mavzu). */
  projectedLast: LessonSession | null;
  /** Hozirgi kelajakdagi sessiyalardan biri taʼtilga / jadvalda yoʻq vaqtga tushgan. */
  conflict: "holiday" | "offTimetable" | null;
};

export type FlowForecast = {
  rows: ForecastRow[];
  /** Sigʻmaydigan darslar (ketma-ketlik tartibida). */
  overflow: string[];
};

function applyDraft(
  lessons: readonly Lesson[], units: readonly Unit[], classId: string, draft?: FlowDraft,
): { lessons: readonly Lesson[]; units: readonly Unit[] } {
  if (!draft?.unitOrder && !draft?.lessonOrder) return { lessons, units };
  const uPos = new Map((draft.unitOrder ?? []).map((id, i) => [id, i + 1]));
  const lPos = new Map((draft.lessonOrder ?? []).map((id, i) => [id, i + 1]));
  return {
    units: uPos.size ? units.map((u) => (uPos.has(u.id) ? { ...u, number: uPos.get(u.id)! } : u)) : units,
    lessons: lPos.size
      ? lessons.map((l) => (lPos.has(l.id) ? { ...l, orderByClass: { ...l.orderByClass, [classId]: lPos.get(l.id)! } } : l))
      : lessons,
  };
}

export function flowForecast(
  lessonsIn: readonly Lesson[], unitsIn: readonly Unit[], classId: string, env: FlowEnv, draft?: FlowDraft,
): FlowForecast {
  const { lessons, units } = applyDraft(lessonsIn, unitsIn, classId, draft);
  const seq = flowSequence(lessons, units, classId);
  const flow = classFlow(lessons, units, classId, env.now);
  const items = new Map(flow.items.map((it) => [it.lessonId, it]));
  const firstFlow = seq.findIndex((l) => items.has(l.id));

  // Avval oqim (`planReflow` bilan aynan bir xil), keyin sanasiz dum —
  // u faqat qolgan boʻsh slotlarni oladi: sigʻish hisobi uchun, sana emas
  // (`joinFlow` qilinmaguncha u sanasiz).
  const tail = new Set<string>();
  const demand: SlotDemand[] = flow.items.map((it) => ({ id: it.lessonId, current: it.sessions, n: it.sessions.length }));
  seq.forEach((l, i) => {
    if (!items.has(l.id) && firstFlow >= 0 && i > firstFlow && !isTaught(l, classId) && !isPinned(l, classId)
      && classSessions(l, classId).length === 0) {
      demand.push({ id: l.id, current: [], n: 1 });
      tail.add(l.id);
    }
  });
  // Havza va taqsimot — `planReflow` dagi qoida bilan bir xil.
  const assigned = assignSlots(flow, usablePool(flow, flow.pool, env), demand, env);

  // Raqam: boʻlim tartibi . boʻlim ichidagi oʻrin; boʻlimsiz — uzluksiz.
  const rankOf = unitRanker(units, classId);
  const unitCount = units.filter((u) => u.classId === classId).length;
  const inUnit = new Map<number, number>();
  const overflow: string[] = [];
  const rows = seq.map((l, i): ForecastRow => {
    const r = rankOf(l);
    const unitId = unitIdForClass(l, classId);
    const k = (inUnit.get(r) ?? 0) + 1;
    inUnit.set(r, k);
    const all = classSessions(l, classId);
    const future = all.filter((s) => !isFrozen(s, env.now));
    const current = future[0] ?? all.at(-1) ?? null;
    const plan = assigned.get(l.id);
    const lost = !!plan?.some((s) => s === null);
    const got = plan?.filter((s): s is LessonSession => !!s) ?? [];
    const state: ForecastState = isTaught(l, classId) ? "taught"
      : isPinned(l, classId) && future.length ? "pinned"
      : lost ? "overflow"
      : items.has(l.id) ? "flow"
      : all.length ? "past" : "unscheduled";
    if (state === "overflow") overflow.push(l.id);
    const conflict = state !== "flow" && state !== "overflow" ? null
      : future.some((s) => env.isHoliday(s.date)) ? "holiday"
      : future.some((s) => !isOnTimetable(s, classId, env)) ? "offTimetable" : null;
    return {
      lessonId: l.id,
      unitId,
      index: r < unitCount ? `${r + 1}.${k}` : String(i + 1),
      state,
      current,
      projected: tail.has(l.id) ? null : plan ? got[0] ?? null : current,
      projectedLast: tail.has(l.id) ? null : plan ? got.at(-1) ?? null : future.at(-1) ?? current,
      conflict,
    };
  });
  return { rows, overflow };
}

/** Boʻlimning prognoz oraligʻi (birinchi va oxirgi sana) — yoʻl xaritasi polosasi. */
export function unitSpans(forecast: FlowForecast): Map<string | null, { start: string; end: string; overflow: number }> {
  const out = new Map<string | null, { start: string; end: string; overflow: number }>();
  for (const r of forecast.rows) {
    const cur = out.get(r.unitId) ?? { start: "", end: "", overflow: 0 };
    const a = r.projected?.date;
    const b = r.projectedLast?.date ?? a;
    if (a && (!cur.start || a < cur.start)) cur.start = a;
    if (b && (!cur.end || b > cur.end)) cur.end = b;
    if (r.state === "overflow") cur.overflow++;
    out.set(r.unitId, cur);
  }
  return out;
}
