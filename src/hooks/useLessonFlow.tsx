"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLessonStore } from "@/store/useLessonStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useGradesStore } from "@/store/useGradesStore";
import { resolveVersionForDate, type TimetableVersion } from "@/lib/timetable-versions";
import type { TimetableEvent } from "@/lib/timetable";
import { getHolidayForDate, type AcademicYearCalendar } from "@/lib/academic-calendar";
import { addDaysKey, todayKey } from "@/lib/date-keys";
import { isPinned, lessonClassIds, unitIdForClass, type Lesson, type LessonSession, type Unit } from "@/lib/lessons-data";
import {
  classFlow, classSessions, flowSequence, isFlowConsistent, isFrozen, isOnTimetable, nextSlotAfter,
  flowForecast, offTimetable, planDrop, planRealign, planReflow, reserveAfter,
  type ClassFlow, type FlowDraft, type FlowEnv, type FlowForecast, type ReflowPlan,
} from "@/lib/lesson-flow";
import { slotKey } from "@/lib/ish-reja/distribute";
import { commitLessonsDelete } from "@/lib/sync/lessons-delete";
import { LessonFlowPreview, type FlowPreviewRow } from "@/components/lessons/LessonFlowPreview";

/* ════════════════════════════════════════════════════════════════════
   DARS OQIMI — amal + qayta joylash + undo, bitta yoʻl.

   `run` naqshi: holat nusxasi → amal (store mutatsiyasi) → har taʼsirlangan
   sinfda oqim qayta hisoblanadi → kichik oʻzgarish darhol qoʻllanadi,
   kattasi oldindan koʻrishga chiqadi → «Bekor qilish» amal oldidagi
   nusxani id boʻyicha qaytaradi (tartib, boʻlim, sanalar birga).

   Oʻchirish va bankka qaytarishda (`closeGaps`) boʻshagan slot havzada
   qoladi — boʻshliq yopiladi, keyingilar orqaga tortiladi. Planner'da
   koʻchirishda esa eski slot ataylab boʻsh qoladi.

   Oldindan koʻrish ochiq turganda sahifa yopilsa (unmount), amal ✕ bilan
   yopilgandek yakunlanadi — yarim qoʻllangan holat qolmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Shundan koʻp dars koʻchsa — oldindan koʻrish. */
const PREVIEW_OVER = 5;

type Snapshot = { lessons: Lesson[]; units: Unit[] };

export type FlowRunOptions = {
  /** Oqimi qayta hisoblanadigan sinflar (boʻsh — faqat amal + undo). */
  classIds: string[];
  mutate: () => void;
  /** Oldindan koʻrish rad etilsa: amal qoladi, sanalarga tegilmaydi
      («keep») yoki amal ham bekor qilinadi («revert»). */
  decline?: "keep" | "revert";
  /** Amalning oʻz xabari. Yoʻq boʻlsa toast faqat surilish boʻlganda chiqadi. */
  message?: string;
  description?: string;
  /** Surilganlar sonida hisoblanmaydigan darslar (sudralgan darsning oʻzi). */
  exclude?: string[];
  /** Mos emaslikni tuzatish — har doim oldindan koʻrish. */
  forcePreview?: boolean;
  /** Shundan koʻp dars surilsa oldindan koʻrish (standart — 5). */
  previewOver?: number;
  /** Amal boʻshatgan slotlar havzada qoladi (oʻchirish, bankka qaytarish). */
  closeGaps?: boolean;
  /** Havzadan chiqariladigan slotlar (surish: dars oʻz slotini boʻshatadi). */
  dropSlots?: LessonSession[];
  /** «revert» da oldindan koʻrishning ikkinchi yoʻli: amal bekor qilinib,
      oʻrniga shu oddiy amal bajariladi (planner: faqat shu darsni koʻchirish). */
  fallback?: { mutate: () => void; message?: string; description?: string };
  /** Amal yakunlangach (darhol yoki oldindan koʻrishdan keyin) chaqiriladi. */
  onSettled?: () => void;
  /** «realign» — qayta joylash jadvalda yoʻq vaqtdagi darslarni ham tuzatadi
      (`planRealign`); standart — oddiy qayta taqsimlash. */
  mode?: "reflow" | "realign";
  /** «Bekor qilish» da darslardan tashqari qaytariladigan narsa (masalan kalendar). */
  undoExtra?: () => void;
  /** Amal boʻshatgan slotlar (`closeGaps`) avval sigʻmagan darslarga beriladi —
      «sigʻmaydi» chipidagi yechimlar: joy boʻshasa, sigʻmagan dars oqimga qaytadi. */
  fillOverflow?: boolean;
};

export type FlowPlaceArgs = {
  lessonId: string;
  classId: string;
  /** Koʻchirilayotgan sessiya; bankdan kelsa `null`. */
  from: LessonSession | null;
  to: LessonSession;
  message?: string;
  description?: string;
  onSettled?: () => void;
};

export type FlowRemoveArgs = {
  lessonIds?: string[];
  unitIds?: string[];
  /** Oqimi qayta hisoblanadigan sinflar. */
  classIds: string[];
  /** Store'dan olib tashlash (serverdagi oʻchirish tasdiqlangandan keyin). */
  mutate: () => void;
  message: string;
  description?: string;
  /** Server tasdiqlagach, oqimdan oldin (masalan tasdiq oynasini yopish). */
  onCommitted?: () => void;
  /** Oqim yakunlangach (darhol yoki oldindan koʻrishdan keyin). */
  onSettled?: () => void;
  fillOverflow?: boolean;
};

export type FlowJoinOptions = {
  message?: string;
  /** Oqim boʻsh / slot yoʻq / rad etilgan / qoʻllangan — har holatda bir marta. */
  onSettled?: () => void;
};

export type FlowNewLessonArgs = {
  classId: string;
  unitId: string | null;
  title: string;
  reserve?: boolean;
  onSettled?: (id: string) => void;
};

type Pending = {
  plans: ReflowPlan[];
  before: Snapshot;
  opts: FlowRunOptions;
  mismatch: boolean;
  rows: FlowPreviewRow[];
  overflow: number;
};

type Settle = "confirm" | "decline" | "close";

/** Amal oldidagi holatdan hozirgacha oʻzgargan (yoki oʻchgan) yozuvlar. */
function changedSince(before: Snapshot): Snapshot {
  const now = useLessonStore.getState();
  const curL = new Map(now.lessons.map((l) => [l.id, l]));
  const curU = new Map(now.units.map((u) => [u.id, u]));
  return {
    lessons: before.lessons.filter((l) => curL.get(l.id) !== l),
    units: before.units.filter((u) => curU.get(u.id) !== u),
  };
}

/** Joriy jadval va kalendar — amal paytidagi holat (render yopilmasidan emas):
    taʼtil qoʻshish amali ichida ham yangi taʼtil darhol hisobga olinadi. */
function currentEnv(): FlowEnv {
  return makeEnv(useTimetableStore.getState().versions, useCalendarStore.getState().calendar);
}

function makeEnv(versions: TimetableVersion[], calendar: AcademicYearCalendar): FlowEnv {
  const d = new Date();
  // Bitta hisob davomida bir sana koʻp marta soʻraladi (har sessiya, har kun) —
  // versiya rezolyutsiyasi sana boʻyicha bir marta.
  const events = new Map<string, TimetableEvent[]>();
  return {
    eventsForDate: (key) => {
      let v = events.get(key);
      if (!v) events.set(key, (v = resolveVersionForDate(versions, key)?.events ?? []));
      return v;
    },
    isHoliday: (key) => !!getHolidayForDate(calendar, key),
    toKey: calendar.range.end || addDaysKey(todayKey(), 366),
    now: { today: todayKey(), nowMin: d.getHours() * 60 + d.getMinutes() },
  };
}

/** Sinf sanalari darslar tartibiga, jadvalga va taʼtillarga mos emasmi
    («Moslash» chipi). Faqat darslar, boʻlimlar, jadval yoki kalendar
    oʻzgarganda qayta hisoblanadi. */
export function useFlowMismatch(classId: string | null): boolean {
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  return useMemo(() => {
    if (!classId) return false;
    const e = makeEnv(versions, calendar);
    return !isFlowConsistent(classFlow(lessons, units, classId, e.now), e);
  }, [classId, lessons, units, versions, calendar]);
}

/** Sinf oqimining prognozi (Zanjir, «sigʻmaydi» chipi, yoʻl xaritasi, planner
    raqami). `draft` — tartiblash qoralamasi: sanalar jonli qayta hisoblanadi.
    `classId` yoʻq (yoki demo) — `null`. Muhit (jadval, kalendar) va prognoz
    faqat oʻz manbalari oʻzgarganda qayta tuziladi; qoralama qadamida faqat
    shu sinf hisoblanadi. */
export function useFlowForecast(classId: string | null, draft?: FlowDraft): FlowForecast | null {
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const env = useMemo(() => makeEnv(versions, calendar), [versions, calendar]);
  const unitOrder = draft?.unitOrder;
  const lessonOrder = draft?.lessonOrder;
  return useMemo(
    () => (classId ? flowForecast(lessons, units, classId, env, { unitOrder, lessonOrder }) : null),
    [classId, lessons, units, env, unitOrder, lessonOrder],
  );
}

/** Bir nechta sinf prognozi (planner: tartib raqami va oqimdagi qoʻshnilar).
    Muhit bir marta tuziladi; faqat darslar/boʻlimlar/jadval/kalendar oʻzgarganda. */
export function useFlowForecasts(classIds: readonly string[]): Map<string, FlowForecast> {
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const key = classIds.join("|");
  return useMemo(() => {
    const e = makeEnv(versions, calendar);
    return new Map(key ? key.split("|").map((c) => [c, flowForecast(lessons, units, c, e)] as const) : []);
  }, [key, lessons, units, versions, calendar]);
}

export function useLessonFlow(): {
  run: (opts: FlowRunOptions) => void;
  /** Darsni sanaga qoʻyish: planner'da tashlash, sana tahriri, bankdan bogʻlash. */
  place: (p: FlowPlaceArgs) => void;
  /** Serverda oʻchirish + boʻshliqni yopish. Server rad etsa `false`. */
  remove: (p: FlowRemoveArgs) => Promise<boolean>;
  /** Qadash / qadashni olish. */
  togglePin: (lessonId: string, classId: string) => void;
  /** «Keyingi darsga sur»: dars bir slot kechikadi, keyingilar ham suriladi
      (shu boʻlimda zaxira dars boʻlsa — u ishlatiladi). */
  bump: (lessonId: string, classId: string) => void;
  /** Davomiylik: +1 — dars yana bir slotni oladi, keyingilar suriladi;
      −1 — oxirgi sessiya olinadi, boʻshliq yopiladi. */
  stretch: (lessonId: string, classId: string, delta: 1 | -1) => void;
  /** Boʻlim oxiriga zaxira dars qoʻshish va uni oqimga kiritish. */
  addReserve: (classId: string, unitId: string | null) => void;
  /** Sanasiz darsni oqimga kiritish: tartibdagi oldingi oqim darsidan keyingi
      slotni oladi, keyingilar bittadan suriladi. Oqim boʻsh boʻlsa — sanasiz qoladi. */
  joinFlow: (lessonId: string, classId: string, opts?: FlowJoinOptions) => void;
  /** Boʻlim oxiriga yangi dars + oqimga kiritish. Id qaytaradi. */
  newLesson: (a: FlowNewLessonArgs) => string;
  /** Darsni oqimdan chiqarish: kelajakdagi sessiyalari olinadi (dars sanasiz
      qoladi), boʻshliq yopiladi; `fillOverflow` — boʻshagan joy sigʻmagan darsga. */
  removeFromFlow: (lessonId: string, classId: string, opts?: { fillOverflow?: boolean }) => void;
  /** `stretch(−1)` bilan bir xil, lekin boʻshagan slot sigʻmagan darsga beriladi. */
  shortenForOverflow: (lessonId: string, classId: string) => void;
  /** Sanalarni tartibga (va jadval/taʼtilga) moslash — oldindan koʻrish bilan. */
  realign: (classIds: string[]) => void;
  dialog: ReactNode;
} {
  const t = useTranslations("LessonFlow");
  const tc = useTranslations("LessonCycle");
  const [pending, setPending] = useState<Pending | null>(null);

  const env = currentEnv;

  const undoAction = (before: Snapshot, extra?: () => void) => {
    const snap = changedSince(before);
    if (!snap.lessons.length && !snap.units.length && !extra) return undefined;
    return {
      label: t("undo"),
      onClick: () => {
        useLessonStore.getState().restoreSnapshot(snap);
        extra?.();
      },
    };
  };

  const shiftedCount = (plans: ReflowPlan[], exclude: string[] = []) =>
    new Set(plans.flatMap((p) => p.changes.map((c) => c.lessonId)).filter((id) => !exclude.includes(id))).size;

  const finish = (before: Snapshot, opts: FlowRunOptions, plans: ReflowPlan[]) => {
    const apply = useLessonStore.getState().applySessionMoves;
    for (const p of plans) apply(p.classId, p.moves);
    const shifted = shiftedCount(plans, opts.exclude);
    const overflow = plans.reduce((n, p) => n + p.overflow.length, 0);
    if (!opts.message && !shifted && !overflow) return;
    const parts = [
      opts.description,
      opts.message && shifted ? t("shiftedDescription", { count: shifted }) : undefined,
      overflow ? t("overflowDescription", { count: overflow }) : undefined,
    ].filter(Boolean);
    const title = opts.message ?? (shifted ? t("shiftedToast", { count: shifted }) : t("overflowToast", { count: overflow }));
    toast.success(title, {
      description: parts.length ? parts.join(" · ") : undefined,
      action: undoAction(before, opts.undoExtra),
    });
  };

  const run = (opts: FlowRunOptions) => {
    const st = useLessonStore.getState();
    const before: Snapshot = { lessons: st.lessons, units: st.units };
    const eBefore = env();
    const classIds = [...new Set(opts.classIds)];
    // Amal oldidagi oqim — faqat kerak boʻlganda, bir marta hisoblanadi.
    const beforeFlows = new Map<string, ClassFlow>();
    const flowBefore = (c: string) => {
      let f = beforeFlows.get(c);
      if (!f) beforeFlows.set(c, (f = classFlow(before.lessons, before.units, c, eBefore.now)));
      return f;
    };

    opts.mutate();
    if (opts.fillOverflow) {
      const st2 = useLessonStore.getState();
      const eNow = env();
      for (const c of classIds) {
        const flowNow = classFlow(st2.lessons, st2.units, c, eNow.now);
        const freed = flowBefore(c).pool.filter((x) =>
          !flowNow.occupied.has(slotKey(x.date, x.startMin)) && !eNow.isHoliday(x.date) && !isFrozen(x, eNow.now));
        const waiting = flowForecast(before.lessons, before.units, c, eBefore).overflow
          .filter((id) => !classSessions(st2.lessons.find((l) => l.id === id) ?? ({} as Lesson), c).length);
        waiting.slice(0, freed.length).forEach((id, i) =>
          st2.addScheduleForClass(id, c, freed[i].date, freed[i].startMin, freed[i].endMin));
      }
    }

    // Amaldan keyingi jadval va kalendar (masalan yangi taʼtil) bilan.
    const e = env();
    const after = useLessonStore.getState();
    const drop = new Set((opts.dropSlots ?? []).map((s) => slotKey(s.date, s.startMin)));
    const plans = classIds.flatMap((c) => {
      const flow = classFlow(after.lessons, after.units, c, e.now);
      if (opts.mode === "realign") {
        const plan = planRealign(flow, e);
        return plan.moves.length ? [plan] : [];
      }
      // Boʻshagan slot havzada qoladi — boʻshliq yopiladi.
      const kept = opts.closeGaps
        ? flowBefore(c).pool.filter((s) => !flow.occupied.has(slotKey(s.date, s.startMin)))
        : [];
      const pool = [...flow.pool, ...kept].filter((s) => !drop.has(slotKey(s.date, s.startMin)));
      const plan = planReflow(flow, pool, e);
      return plan.moves.length ? [plan] : [];
    });

    const shifted = shiftedCount(plans, opts.exclude);
    const overflow = plans.reduce((n, p) => n + p.overflow.length, 0);
    const mismatchBefore = plans.length > 0 && classIds.some((c) => !isFlowConsistent(flowBefore(c), eBefore));
    const needPreview = plans.length > 0 && (opts.forcePreview || mismatchBefore
      || shifted > (opts.previewOver ?? PREVIEW_OVER) || overflow > 0);
    if (!needPreview) {
      finish(before, opts, plans);
      opts.onSettled?.();
      return;
    }
    const byId = new Map(after.lessons.map((l) => [l.id, l]));
    const classData = useGradesStore.getState().classDataMap;
    const multi = plans.length > 1;
    const rows = plans.flatMap((p) => p.changes.map((c): FlowPreviewRow => ({
      key: `${p.classId}|${c.lessonId}`,
      title: byId.get(c.lessonId)?.title || t("untitled"),
      classLabel: multi ? classData[p.classId]?.info.name : undefined,
      before: c.before,
      after: c.after,
    })));
    setPending({ plans, before, opts, mismatch: mismatchBefore, rows, overflow });
  };

  /** Oldindan koʻrishni yakunlash. «decline» — ikkinchi tugma: «keep» da amal
      qoladi, «revert» da bekor, `fallback` boʻlsa oʻrniga oddiy amal. «close»
      (✕, Esc, sahifadan chiqish) — «revert» da hech narsa qilinmaydi. */
  const settle = (p: Pending, how: Settle, notify = true) => {
    const { before, opts } = p;
    if (how === "confirm") finish(before, opts, p.plans);
    else if (opts.decline !== "revert") finish(before, opts, []);
    else {
      useLessonStore.getState().restoreSnapshot(changedSince(before));
      if (how === "decline" && opts.fallback) run({ classIds: [], ...opts.fallback });
    }
    if (notify) opts.onSettled?.();
  };
  const resolve = (how: Settle) => {
    if (!pending) return;
    setPending(null);
    settle(pending, how);
  };

  // Sahifa yopilsa ochiq oldindan koʻrish ✕ kabi yakunlanadi (onSettled chaqirilmaydi —
  // foydalanuvchi allaqachon boshqa joyga oʻtgan).
  const pendingRef = useRef<Pending | null>(null);
  const settleRef = useRef(settle);
  useEffect(() => {
    pendingRef.current = pending;
    settleRef.current = settle;
  });
  useEffect(() => () => {
    const p = pendingRef.current;
    pendingRef.current = null;
    if (p) settleRef.current(p, "close", false);
  }, []);

  const place = ({ lessonId, classId, from, to, message, description, onSettled }: FlowPlaceArgs) => {
    const st = useLessonStore.getState();
    const e = env();
    const d = planDrop({
      lessons: st.lessons, units: st.units, classId, lessonId, from, to, now: e.now,
      onTimetable: (s) => isOnTimetable(s, classId, e),
    });
    const setSessionAt = (slot: LessonSession) => () => {
      const s = useLessonStore.getState();
      if (from) s.moveSession(lessonId, classId, from.date, from.startMin, slot.date, slot.startMin, slot.endMin);
      else s.addScheduleForClass(lessonId, classId, slot.date, slot.startMin, slot.endMin);
    };
    if (d.kind === "plain") {
      run({ classIds: [], mutate: setSessionAt(to), message, description, onSettled });
      return;
    }
    run({
      classIds: [classId],
      decline: "revert",
      fallback: { mutate: setSessionAt(to), message, description },
      exclude: [lessonId],
      message: d.pin ? t("pinnedHereToast") : message,
      description,
      onSettled,
      mutate: () => {
        const s = useLessonStore.getState();
        if (d.setSession) setSessionAt(d.target)();
        if (d.order) s.reorderLessons(d.order, classId);
        if (d.pin) s.setPinned(lessonId, classId, true);
      },
    });
  };

  const remove = async ({ lessonIds, unitIds, classIds, mutate, message, description, onCommitted, onSettled, fillOverflow }: FlowRemoveArgs) => {
    if (!(await commitLessonsDelete({ lessonIds, unitIds }))) return false;
    onCommitted?.();
    run({ classIds, mutate, decline: "keep", closeGaps: true, message, description, onSettled, fillOverflow });
    return true;
  };

  const togglePin = (lessonId: string, classId: string) => {
    const l = useLessonStore.getState().lessons.find((x) => x.id === lessonId);
    if (!l) return;
    const pinned = isPinned(l, classId);
    run({
      classIds: [classId],
      decline: "keep",
      message: pinned ? t("unpinnedToast") : t("pinnedToast"),
      description: l.title,
      mutate: () => useLessonStore.getState().setPinned(lessonId, classId, !pinned),
    });
  };

  /* «Keyingi darsga sur» ham oqimning bir holati:
     - oʻtmishdagi (oʻtilmagan) sessiya kelajakka olinadi — dars oqimga
       qaytib, oʻz tartibidagi birinchi slotni oladi, keyingilar bittadan
       suriladi, oxirgisi yangi boʻsh slotga tushadi;
     - kelajakdagi dars oʻz slotini boʻshatadi (`dropSlots`) — natija bir xil.
     Shu boʻlimda keyinroq zaxira dars boʻlsa, uning sloti «yutiladi»
     (zaxira bankka qaytadi) — keyingi boʻlimlar joyidan qimirlamaydi.
     Qadalgan dars surilsa qadash olinadi: sanasi endi qatʼiy emas. */
  const bump = (lessonId: string, classId: string) => {
    const st = useLessonStore.getState();
    const x = st.lessons.find((l) => l.id === lessonId);
    const e = env();
    const sessions = x ? classSessions(x, classId) : [];
    if (!x || !sessions.length) {
      toast.info(tc("bumpNothing"));
      return;
    }
    const flow = classFlow(st.lessons, st.units, classId, e.now);
    const missed = sessions.filter((s) => isFrozen(s, e.now)).at(-1);
    let placeholder: LessonSession | null = null;
    if (missed) {
      // Joy egasi — havzadagi birinchi BEGONA slot (dars oʻz sessiyasiga
      // koʻchsa davomiyligi oshmay qoladi); yoʻq boʻlsa birinchi boʻsh slot.
      placeholder = nextSlotAfter(flow, null, new Set(sessions.map((s) => slotKey(s.date, s.startMin))), e);
      if (!placeholder) {
        toast.info(t("noFreeSlot"));
        return;
      }
    }
    const future = sessions.find((s) => !isFrozen(s, e.now));
    const reserve = reserveAfter(st.lessons, st.units, flow, lessonId);
    const slot = reserve?.sessions[0];
    run({
      classIds: [classId],
      decline: "revert",
      // Surish hammasini bittadan siljitadi — oddiy holatda soʻramasdan qoʻllanadi.
      previewOver: Infinity,
      dropSlots: !missed && future ? [future] : [],
      closeGaps: !!reserve,
      message: reserve ? t("reserveUsedToast") : undefined,
      mutate: () => {
        const s = useLessonStore.getState();
        if (isPinned(x, classId)) s.setPinned(lessonId, classId, false);
        if (missed && placeholder) {
          s.moveSession(lessonId, classId, missed.date, missed.startMin, placeholder.date, placeholder.startMin, placeholder.endMin);
        }
        if (reserve && slot) s.unscheduleSession(reserve.lessonId, classId, slot.date, slot.startMin);
      },
    });
  };

  const stretch = (lessonId: string, classId: string, delta: 1 | -1, fillOverflow = false) => {
    const st = useLessonStore.getState();
    const x = st.lessons.find((l) => l.id === lessonId);
    const e = env();
    const sessions = x ? classSessions(x, classId) : [];
    const future = sessions.filter((s) => !isFrozen(s, e.now));
    if (!x || !future.length) return;
    if (delta < 0) {
      // Kelajakda kamida bitta dars qolishi shart — aks holda «qisqartirish»
      // mavzuning yagona kelgusi darsini olib tashlab yuborardi.
      if (future.length < 2) return;
      const last = future[future.length - 1];
      run({
        classIds: [classId],
        decline: "keep",
        closeGaps: true,
        fillOverflow,
        message: t("shortenedToast"),
        description: x.title,
        mutate: () => useLessonStore.getState().unscheduleSession(lessonId, classId, last.date, last.startMin),
      });
      return;
    }
    const flow = classFlow(st.lessons, st.units, classId, e.now);
    const slot = nextSlotAfter(flow, future[future.length - 1], new Set(sessions.map((s) => slotKey(s.date, s.startMin))), e);
    if (!slot) {
      toast.info(t("noFreeSlot"));
      return;
    }
    run({
      classIds: [classId],
      decline: "revert",
      previewOver: Infinity,
      message: t("stretchedToast"),
      description: x.title,
      mutate: () => useLessonStore.getState().addScheduleForClass(lessonId, classId, slot.date, slot.startMin, slot.endMin),
    });
  };

  /* Oqimga kiritish: dars tartibdagi oldingi oqim darsidan keyingi slotni
     oladi, keyingilar bittadan suriladi. Oqim boʻsh boʻlsa (sinf jadvalga
     qoʻyilmagan) yoki boʻsh slot qolmagan boʻlsa — dars sanasiz qoladi.
     Rad etilsa ham dars saqlanadi, faqat sanasiz. */
  const joinFlow = (lessonId: string, classId: string, opts: FlowJoinOptions = {}) => {
    const st = useLessonStore.getState();
    const e = env();
    const flow = classFlow(st.lessons, st.units, classId, e.now);
    const done = (description?: string) => {
      if (opts.message) toast.success(opts.message, { description });
      opts.onSettled?.();
    };
    if (!flow.items.length) return done();
    const seq = flowSequence(st.lessons, st.units, classId).map((l) => l.id);
    const at = seq.indexOf(lessonId);
    const prev = flow.items.filter((it) => seq.indexOf(it.lessonId) < at).at(-1);
    const slot = nextSlotAfter(flow, prev?.sessions.at(-1) ?? null, new Set(), e);
    if (!slot) return done(t("noFreeSlot"));
    run({
      classIds: [classId],
      decline: "revert",
      previewOver: Infinity,
      exclude: [lessonId],
      message: opts.message,
      onSettled: opts.onSettled,
      mutate: () => useLessonStore.getState().addScheduleForClass(lessonId, classId, slot.date, slot.startMin, slot.endMin),
    });
  };

  const newLesson = ({ classId, unitId, title, reserve, onSettled }: FlowNewLessonArgs) => {
    const s = useLessonStore.getState();
    const id = s.addLesson({ classId, unitId, title, status: "Draft" });
    if (reserve) s.updateLesson(id, { reserve: true });
    // `addLesson` raqami sinf tartibini (`orderByClass`, koʻp sinfli darslar)
    // hisobga olmaydi — dars boʻlimning aynan oxiriga qoʻyiladi.
    const cur = useLessonStore.getState();
    const inUnit = flowSequence(cur.lessons, cur.units, classId)
      .filter((l) => l.id !== id && unitIdForClass(l, classId) === unitId)
      .map((l) => l.id);
    s.reorderLessons([...inUnit, id], classId);
    joinFlow(id, classId, { message: reserve ? t("reserveAddedToast") : undefined, onSettled: () => onSettled?.(id) });
    return id;
  };

  const addReserve = (classId: string, unitId: string | null) => {
    newLesson({ classId, unitId, title: t("reserveTitle"), reserve: true });
  };

  const removeFromFlow = (lessonId: string, classId: string, o: { fillOverflow?: boolean } = {}) => {
    const x = useLessonStore.getState().lessons.find((l) => l.id === lessonId);
    const e = env();
    const future = x ? classSessions(x, classId).filter((s) => !isFrozen(s, e.now)) : [];
    if (!x || !future.length) return;
    run({
      classIds: [classId],
      decline: "keep",
      closeGaps: true,
      fillOverflow: o.fillOverflow,
      message: t("removedFromFlowToast"),
      description: x.title,
      mutate: () => {
        const s = useLessonStore.getState();
        for (const f of future) s.unscheduleSession(lessonId, classId, f.date, f.startMin);
      },
    });
  };

  const shortenForOverflow = (lessonId: string, classId: string) => stretch(lessonId, classId, -1, true);

  const realign = (classIds: string[]) =>
    run({ classIds, mutate: () => {}, decline: "keep", forcePreview: true, mode: "realign" });

  const dialog = (
    <LessonFlowPreview
      open={!!pending}
      rows={pending?.rows ?? []}
      overflow={pending?.overflow ?? 0}
      mismatch={pending?.mismatch ?? false}
      declineLabel={pending?.opts.decline !== "revert" ? t("keepDates") : pending.opts.fallback ? t("onlyThisLesson") : t("cancel")}
      onConfirm={() => resolve("confirm")}
      onDecline={() => resolve("decline")}
      onClose={() => resolve("close")}
    />
  );

  return { run, place, remove, togglePin, bump, stretch, addReserve, joinFlow, newLesson, removeFromFlow, shortenForOverflow, realign, dialog };
}

/* ── Kalendar va jadval oʻzgarishini kuzatish ──
   Sozlamalarda taʼtil qoʻshilsa / surilsa yoki jadval versiyasi oʻzgarsa,
   darslar oʻzicha surilmaydi (har bir tahrirda sakrab yurmasin) — toast
   «N ta dars taʼtil kuniga tushib qoldi · Surish» taklif qiladi. Birinchi
   (hydration) holat asos boʻladi, faqat keyingi oʻzgarishlar tekshiriladi. */
export function useFlowCalendarWatch(source: "holidays" | "timetable"): ReactNode {
  const t = useTranslations("LessonFlow");
  const flow = useLessonFlow();
  const holidays = useCalendarStore((s) => s.calendar.holidays);
  const calendarReady = useCalendarStore((s) => s._hasHydrated);
  const versions = useTimetableStore((s) => s.versions);
  const timetableReady = useTimetableStore((s) => s._hasHydrated);
  const lessonsReady = useLessonStore((s) => s._hasHydrated);
  const trigger = source === "holidays" ? holidays : versions;
  const ready = lessonsReady && (source === "holidays" ? calendarReady : timetableReady);

  const flowRef = useRef(flow);
  useEffect(() => { flowRef.current = flow; });
  const baseline = useRef<unknown>(null);
  // Oxirgi koʻrilgan toʻqnashuvlar soni — faqat oshganda xabar beriladi.
  const lastTotal = useRef(0);

  useEffect(() => {
    if (!ready) return;
    const conflicts = () => {
      const st = useLessonStore.getState();
      const e = currentEnv();
      const affected = new Map<string, number>();
      for (const c of new Set(st.lessons.flatMap((l) => lessonClassIds(l)))) {
        const f = classFlow(st.lessons, st.units, c, e.now);
        const n = source === "holidays"
          ? f.items.reduce((k, it) => k + it.sessions.filter((s) => e.isHoliday(s.date)).length, 0)
          : offTimetable(f, e).length;
        if (n) affected.set(c, n);
      }
      return affected;
    };
    const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);
    if (baseline.current === null) {
      baseline.current = trigger;
      lastTotal.current = sum(conflicts());
      return;
    }
    if (baseline.current === trigger) return;
    baseline.current = trigger;
    const timer = setTimeout(() => {
      const affected = conflicts();
      const id = `lesson-flow-${source}`;
      const total = sum(affected);
      const grew = total > lastTotal.current;
      lastTotal.current = total;
      if (!total) {
        toast.dismiss(id);
        return;
      }
      if (!grew) return;
      const ids = [...affected.keys()];
      toast(source === "holidays" ? t("holidayConflictToast", { count: total }) : t("timetableConflictToast", { count: total }), {
        id,
        duration: 15000,
        action: {
          label: source === "holidays" ? t("shiftAction") : t("realignAction"),
          onClick: () => (source === "holidays"
            ? flowRef.current.run({ classIds: ids, mutate: () => {}, decline: "keep" })
            : flowRef.current.realign(ids)),
        },
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [ready, trigger, source, t]);

  return flow.dialog;
}
