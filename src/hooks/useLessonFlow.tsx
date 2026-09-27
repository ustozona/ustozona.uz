"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLessonStore } from "@/store/useLessonStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useGradesStore } from "@/store/useGradesStore";
import { resolveVersionForDate, type TimetableVersion } from "@/lib/timetable-versions";
import { getHolidayForDate, type AcademicYearCalendar } from "@/lib/academic-calendar";
import { addDaysKey, todayKey } from "@/lib/date-keys";
import { isPinned, type Lesson, type LessonSession, type Unit } from "@/lib/lessons-data";
import {
  classFlow, classSessions, isFlowConsistent, isFrozen, planDrop, planReflow,
  type ClassFlow, type FlowEnv, type ReflowPlan,
} from "@/lib/lesson-flow";
import { distributeTopics, slotKey } from "@/lib/ish-reja/distribute";
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

function makeEnv(versions: TimetableVersion[], calendar: AcademicYearCalendar): FlowEnv {
  const d = new Date();
  return {
    eventsForDate: (key) => resolveVersionForDate(versions, key)?.events ?? [],
    isHoliday: (key) => !!getHolidayForDate(calendar, key),
    toKey: calendar.range.end || addDaysKey(todayKey(), 366),
    now: { today: todayKey(), nowMin: d.getHours() * 60 + d.getMinutes() },
  };
}

/** Sinf sanalari darslar tartibiga mos emasmi («Moslash» chipi). Faqat
    darslar, boʻlimlar, jadval yoki kalendar oʻzgarganda qayta hisoblanadi. */
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

export function useLessonFlow(): {
  run: (opts: FlowRunOptions) => void;
  /** Darsni sanaga qoʻyish: planner'da tashlash, sana tahriri, bankdan bogʻlash. */
  place: (p: FlowPlaceArgs) => void;
  /** Serverda oʻchirish + boʻshliqni yopish. Server rad etsa `false`. */
  remove: (p: FlowRemoveArgs) => Promise<boolean>;
  /** Qadash / qadashni olish. */
  togglePin: (lessonId: string, classId: string) => void;
  /** «Keyingi darsga sur»: dars bir slot kechikadi, keyingilar ham suriladi. */
  bump: (lessonId: string, classId: string) => void;
  /** Sanalarni tartibga moslash — har doim oldindan koʻrish bilan. */
  realign: (classId: string) => void;
  dialog: ReactNode;
} {
  const t = useTranslations("LessonFlow");
  const tc = useTranslations("LessonCycle");
  const versions = useTimetableStore((s) => s.versions);
  const calendar = useCalendarStore((s) => s.calendar);
  const [pending, setPending] = useState<Pending | null>(null);

  const env = () => makeEnv(versions, calendar);

  const undoAction = (before: Snapshot) => {
    const snap = changedSince(before);
    if (!snap.lessons.length && !snap.units.length) return undefined;
    return { label: t("undo"), onClick: () => useLessonStore.getState().restoreSnapshot(snap) };
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
      action: undoAction(before),
    });
  };

  const run = (opts: FlowRunOptions) => {
    const st = useLessonStore.getState();
    const before: Snapshot = { lessons: st.lessons, units: st.units };
    const e = env();
    const classIds = [...new Set(opts.classIds)];
    // Amal oldidagi oqim — faqat kerak boʻlganda, bir marta hisoblanadi.
    const beforeFlows = new Map<string, ClassFlow>();
    const flowBefore = (c: string) => {
      let f = beforeFlows.get(c);
      if (!f) beforeFlows.set(c, (f = classFlow(before.lessons, before.units, c, e.now)));
      return f;
    };

    opts.mutate();

    const after = useLessonStore.getState();
    const drop = new Set((opts.dropSlots ?? []).map((s) => slotKey(s.date, s.startMin)));
    const plans = classIds.flatMap((c) => {
      const flow = classFlow(after.lessons, after.units, c, e.now);
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
    const mismatchBefore = plans.length > 0 && classIds.some((c) => !isFlowConsistent(flowBefore(c), e));
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
    const d = planDrop({ lessons: st.lessons, units: st.units, classId, lessonId, from, to, now: env().now });
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

  const remove = async ({ lessonIds, unitIds, classIds, mutate, message, description, onCommitted }: FlowRemoveArgs) => {
    if (!(await commitLessonsDelete({ lessonIds, unitIds }))) return false;
    onCommitted?.();
    run({ classIds, mutate, decline: "keep", closeGaps: true, message, description });
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
    const missed = sessions.filter((s) => isFrozen(s, e.now)).at(-1);
    let placeholder: LessonSession | null = null;
    if (missed) {
      // Joy egasi — havzadagi birinchi BEGONA slot (dars oʻz sessiyasiga
      // koʻchsa davomiyligi oshmay qoladi); yoʻq boʻlsa birinchi boʻsh slot.
      const flow = classFlow(st.lessons, st.units, classId, e.now);
      const own = new Set(sessions.map((s) => slotKey(s.date, s.startMin)));
      placeholder = flow.pool.find((s) => !own.has(slotKey(s.date, s.startMin))) ?? null;
      if (!placeholder) {
        const occupied = new Set([...flow.occupied, ...flow.blocked]);
        for (const ev of e.eventsForDate(e.now.today)) {
          if (ev.classId === classId && ev.startMin <= e.now.nowMin) occupied.add(slotKey(e.now.today, ev.startMin));
        }
        [placeholder] = distributeTopics({
          classId, count: 1, fromKey: e.now.today, toKey: e.toKey,
          eventsForDate: e.eventsForDate, isHoliday: e.isHoliday, occupied,
        });
      }
      if (!placeholder) {
        toast.info(t("noFreeSlot"));
        return;
      }
    }
    const future = sessions.find((s) => !isFrozen(s, e.now));
    run({
      classIds: [classId],
      decline: "revert",
      // Surish hammasini bittadan siljitadi — oddiy holatda soʻramasdan qoʻllanadi.
      previewOver: Infinity,
      dropSlots: !missed && future ? [future] : [],
      mutate: () => {
        const s = useLessonStore.getState();
        if (isPinned(x, classId)) s.setPinned(lessonId, classId, false);
        if (missed && placeholder) {
          s.moveSession(lessonId, classId, missed.date, missed.startMin, placeholder.date, placeholder.startMin, placeholder.endMin);
        }
      },
    });
  };

  const realign = (classId: string) => run({ classIds: [classId], mutate: () => {}, decline: "keep", forcePreview: true });

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

  return { run, place, remove, togglePin, bump, realign, dialog };
}
