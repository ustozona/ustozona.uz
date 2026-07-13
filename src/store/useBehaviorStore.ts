import { create } from "zustand";
import {
  defaultAutoSettings,
  defaultRewards,
  defaultSkills,
  studentBalance,
  todayDateKey,
  uid,
  type BehaviorAutoSettings,
  type BehaviorDeletionLogEntry,
  type BehaviorEvent,
  type BehaviorRedemption,
  type BehaviorReward,
  type BehaviorSkill,
} from "@/lib/behavior-data";

/* ════════════════════════════════════════════════════════════════════
   XULQ — server-backed store (attendance qolipi, persistsiz).

   `BehaviorServerSync` (dashboard layout) mount'da serverdan
   {skills, rewards, eventsByClass, redemptions}ni yuklaydi (hydration),
   keyin har oʻzgarishni diff qilib server action'ga yuboradi.

   Initial state = defaultlar (hydration'gacha boʻsh koʻrinmasin);
   sync FAQAT hydration'dan keyin ishga tushadi — aks holda defaultlar
   server maʼlumotini yoʻqotadi.

   Hamma mutatsiya immutable — diff reference tenglikka tayanadi.
   ════════════════════════════════════════════════════════════════════ */

interface BehaviorState {
  skills: BehaviorSkill[];
  rewards: BehaviorReward[];
  /** classId → append-only eventlar (yangi element oxiriga qoʻshiladi). */
  eventsByClass: Record<string, BehaviorEvent[]>;
  redemptions: BehaviorRedemption[];
  /** Oʻchirish jurnali — append-only, sync insert-only (hech qachon delete yoʻq). */
  deletions: BehaviorDeletionLogEntry[];
  /** Avtomatik ball qoidalari (davomat/jurnal → xulq). */
  autoSettings: BehaviorAutoSettings;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  setSkills: (next: BehaviorSkill[]) => void;
  setRewards: (next: BehaviorReward[]) => void;

  /** Qoida OFF→ON oʻtganda tegishli `*Since` bugunga koʻchadi (retro-toshqin himoyasi). */
  setAutoSettings: (next: BehaviorAutoSettings) => void;

  /** Yangi oʻquv yili faollashganda avto-langarlarni (attendanceSince/
      journalSince) yil boshiga OLDINGA suradi — faqat langar `dateKey`dan
      OLDIN boʻlsa. Seriyalar yangi yil boshidan qaytadan boshlanadi; langar
      oldidagi tarixga tegilmaydi (balans umrbod, eventlar oʻchmaydi). */
  shiftAutoAnchorsForward: (dateKey: string) => void;

  /**
   * Reconciler yozuvi: avto-eventlarni qoʻshish/yangilash/olib tashlash
   * BITTA immutable yangilanishda. Oʻchirish jurnali YOZILMAYDI — bu
   * tuzatish (davomat/baho oʻzgardi), qasddan oʻchirish emas.
   */
  applyAutoReconcile: (
    classId: string,
    changes: { toAdd: BehaviorEvent[]; toUpdate: BehaviorEvent[]; toRemoveIds: string[] }
  ) => void;

  /**
   * Tanlangan oʻquvchilarga koʻnikma boʻyicha ball yozadi (har biriga
   * bitta event, snapshot bilan). Undo uchun event idlarini qaytaradi.
   */
  awardPoints: (
    classId: string,
    studentIds: string[],
    skill: BehaviorSkill,
    note?: string
  ) => string[];

  /** Eventlarni oʻchirish (undo — jurnal YOZILMAYDI). */
  removeEvents: (classId: string, eventIds: string[]) => void;

  /** Hisobotdagi qasddan oʻchirish: event olib tashlanadi + jurnalga yoziladi. */
  deleteEventWithLog: (classId: string, event: BehaviorEvent, reason?: string) => void;

  /** Eventga izoh yozish/tahrirlash (boʻsh matn = izohni olib tashlash). */
  setEventNote: (classId: string, eventId: string, note: string) => void;

  /**
   * Ball sarflash. reward berilsa — doʻkondan; berilmasa erkin sarflash
   * (name = izoh, cost = miqdor). Balans yetmasa null qaytaradi.
   */
  redeem: (
    classId: string,
    studentId: string,
    spend:
      | { reward: BehaviorReward }
      | { cost: number; name: string }
  ) => string | null;

  removeRedemption: (id: string) => void;
}

export const useBehaviorStore = create<BehaviorState>()((set, get) => ({
  skills: defaultSkills(),
  rewards: defaultRewards(),
  eventsByClass: {},
  redemptions: [],
  deletions: [],
  autoSettings: defaultAutoSettings(),
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  setSkills: (next) => set({ skills: next }),
  setRewards: (next) => set({ rewards: next }),

  setAutoSettings: (next) =>
    set((s) => {
      const prev = s.autoSettings;
      const today = todayDateKey();
      return {
        autoSettings: {
          ...next,
          attendanceSince:
            !prev.attendanceEnabled && next.attendanceEnabled ? today : next.attendanceSince,
          journalSince:
            !prev.journalEnabled && next.journalEnabled ? today : next.journalSince,
        },
      };
    }),

  shiftAutoAnchorsForward: (dateKey) =>
    set((s) => {
      const a = s.autoSettings;
      const attendanceSince = a.attendanceSince < dateKey ? dateKey : a.attendanceSince;
      const journalSince = a.journalSince < dateKey ? dateKey : a.journalSince;
      if (attendanceSince === a.attendanceSince && journalSince === a.journalSince) return s;
      return { autoSettings: { ...a, attendanceSince, journalSince } };
    }),

  applyAutoReconcile: (classId, { toAdd, toUpdate, toRemoveIds }) => {
    if (toAdd.length === 0 && toUpdate.length === 0 && toRemoveIds.length === 0) return;
    const updateById = new Map(toUpdate.map((e) => [e.id, e]));
    const removeIds = new Set(toRemoveIds);
    set((s) => {
      const prev = s.eventsByClass[classId] ?? [];
      const next: BehaviorEvent[] = [];
      for (const e of prev) {
        if (removeIds.has(e.id)) continue;
        const upd = updateById.get(e.id);
        // Mavjud izoh saqlanadi — reconciler note'ga tegmaydi.
        next.push(upd ? { ...upd, ...(e.note ? { note: e.note } : {}) } : e);
      }
      next.push(...toAdd);
      return { eventsByClass: { ...s.eventsByClass, [classId]: next } };
    });
  },

  awardPoints: (classId, studentIds, skill, note) => {
    if (studentIds.length === 0) return [];
    const createdAt = new Date().toISOString();
    const date = todayDateKey();
    const groupId = studentIds.length > 1 ? uid("bhg") : undefined;
    const created: BehaviorEvent[] = studentIds.map((studentId) => ({
      id: uid("bhe"),
      studentId,
      skillId: skill.id,
      name: skill.name,
      emoji: skill.emoji,
      ...(skill.description ? { description: skill.description } : {}),
      points: skill.points,
      date,
      createdAt,
      ...(note ? { note } : {}),
      ...(groupId ? { groupId } : {}),
    }));
    set((s) => ({
      eventsByClass: {
        ...s.eventsByClass,
        [classId]: [...(s.eventsByClass[classId] ?? []), ...created],
      },
    }));
    return created.map((e) => e.id);
  },

  removeEvents: (classId, eventIds) => {
    if (eventIds.length === 0) return;
    const ids = new Set(eventIds);
    set((s) => {
      const prev = s.eventsByClass[classId];
      if (!prev) return s;
      return {
        eventsByClass: {
          ...s.eventsByClass,
          [classId]: prev.filter((e) => !ids.has(e.id)),
        },
      };
    });
  },

  deleteEventWithLog: (classId, event, reason) => {
    const entry: BehaviorDeletionLogEntry = {
      id: uid("bhd"),
      classId,
      studentId: event.studentId,
      eventId: event.id,
      name: event.name,
      emoji: event.emoji,
      points: event.points,
      date: event.date,
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
      deletedAt: new Date().toISOString(),
    };
    set((s) => {
      const prev = s.eventsByClass[classId];
      return {
        deletions: [...s.deletions, entry],
        ...(prev
          ? {
              eventsByClass: {
                ...s.eventsByClass,
                [classId]: prev.filter((e) => e.id !== event.id),
              },
            }
          : {}),
      };
    });
  },

  setEventNote: (classId, eventId, note) =>
    set((s) => {
      const prev = s.eventsByClass[classId];
      if (!prev) return s;
      const trimmed = note.trim();
      return {
        eventsByClass: {
          ...s.eventsByClass,
          [classId]: prev.map((e) => {
            if (e.id !== eventId) return e;
            const { note: _drop, ...rest } = e;
            return trimmed ? { ...rest, note: trimmed } : rest;
          }),
        },
      };
    }),

  redeem: (classId, studentId, spend) => {
    const s = get();
    const events = s.eventsByClass[classId] ?? [];
    const balance = studentBalance(events, s.redemptions, studentId);
    const cost = "reward" in spend ? spend.reward.cost : spend.cost;
    if (cost <= 0 || balance < cost) return null;

    const redemption: BehaviorRedemption = {
      id: uid("bhr"),
      classId,
      studentId,
      ...("reward" in spend
        ? {
            rewardId: spend.reward.id,
            name: spend.reward.name,
            emoji: spend.reward.emoji,
          }
        : { name: spend.name, emoji: "2b50" }),
      cost,
      date: todayDateKey(),
      createdAt: new Date().toISOString(),
    };
    set((st) => ({ redemptions: [...st.redemptions, redemption] }));
    return redemption.id;
  },

  removeRedemption: (id) =>
    set((s) => ({ redemptions: s.redemptions.filter((r) => r.id !== id) })),
}));
