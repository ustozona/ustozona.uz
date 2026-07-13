import { create } from "zustand";
import type { TimetableEvent } from "@/lib/timetable";
import { defaultBellConfig, type BellConfig } from "@/lib/bell-schedule";
import { getCurrentCalendar } from "@/store/useCalendarStore";
import {
  resolveVersionForDate,
  sortVersions,
  type TimetableVersion,
} from "@/lib/timetable-versions";
import { todayKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   JADVAL VERSIYALARI STORE — server-backed (6-bosqich migratsiyasi)

   Barcha isteʼmolchilar (timetable sahifasi, planner, lesson-schedule,
   dashboard, davomat) jadvalni shu yerdan oladi. Rezolyutsiya
   helperlari — lib/timetable-versions.ts.

   Manba endi Postgres: `TimetableServerSync` (dashboard layout)
   hydration + diff-sync qiladi. Legacy localStorage oʻqishlari
   9-bosqichda OLIB TASHLANDI — yangi oʻqituvchi boʻsh grid + default
   qoʻngʻiroq jadvali bilan boshlaydi.

   seedIfEmpty: server boʻsh boʻlsa (yangi oʻqituvchi) boʻsh gridni
   1-versiya sifatida sintez qiladi — TimetableServerSync buni sync
   YARATILGANDAN KEYIN chaqiradi, shunda versiya serverga ham yoziladi.
   Invariant: hydratsiyadan soʻng versions.length >= 1.
   ════════════════════════════════════════════════════════════════════ */

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Hodisalar snapshotini nusxalash — versiyalar orasida shared reference qolmasin. */
function cloneEvents(events: TimetableEvent[], freshIds = false): TimetableEvent[] {
  return events.map((e) => ({ ...e, id: freshIds ? uid() : e.id }));
}

function cloneBell(c: BellConfig): BellConfig {
  return { profile: c.profile, shift1: { ...c.shift1 }, shift2: { ...c.shift2 } };
}

interface TimetableVersionsState {
  versions: TimetableVersion[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  /** Server boʻsh boʻlsa boʻsh gridni 1-versiya sifatida yaratadi.
      Invariant: hydratsiyadan soʻng har doim versions.length >= 1. */
  seedIfEmpty: () => void;
  /** `dateKey`ni qoplaydigan versiya (effectiveFrom <= dateKey) boʻlmasa,
      eng erta versiyani oʻsha sanaga KLONLAYDI — yangi yil boshi dars kunlari
      "jadval yoʻq" deb boʻsh qolmaydi. Klon yaratilsa true, aks holda (allaqachon
      qoplangan / versiya yoʻq / sana boʻsh) false qaytaradi. Idempotent. */
  ensureVersionAt: (dateKey: string) => boolean;
  /** Versiya snapshotini yangilaydi (draft commit). */
  commitDraft: (versionId: string, events: TimetableEvent[], bellConfig: BellConfig) => void;
  /** Bazadan nusxa olib yangi versiya yaratadi; id qaytaradi (dublikat sanada null). */
  createVersion: (input: { effectiveFrom: string; note?: string; baseId: string }) => string | null;
  /** Versiyani oʻchiradi — oldingisi amal davri boʻyicha choʻziladi. Yagona versiyada no-op. */
  deleteVersion: (versionId: string) => void;
  /** Amal qilish sanasini oʻzgartiradi; dublikat sanada false. */
  setEffectiveFrom: (versionId: string, dateKey: string) => boolean;
  setNote: (versionId: string, note: string) => void;
}

export const useTimetableStore = create<TimetableVersionsState>()((set, get) => ({
  versions: [],
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  seedIfEmpty: () => {
    if (typeof window === "undefined" || get().versions.length > 0) return;
    // Oʻquv yili hali sozlanmagan boʻlishi mumkin (boʻsh kalendar) — u holda
    // effectiveFrom "" boʻlib qolib, serverga yozishda validatsiyadan oʻtmaydi.
    // Shu sabab bugungi sanaga qaytamiz; foydalanuvchi keyin oʻzgartira oladi.
    const version: TimetableVersion = {
      id: uid(),
      effectiveFrom: getCurrentCalendar().range.start || todayKey(),
      events: [],
      bellConfig: defaultBellConfig(),
      note: "Dastlabki jadval",
      createdAt: new Date().toISOString(),
    };
    set({ versions: [version] });
  },

  ensureVersionAt: (dateKey) => {
    if (!dateKey) return false;
    const s = get();
    if (s.versions.length === 0) return false;
    // Allaqachon qoplangan boʻlsa (effectiveFrom <= dateKey versiya bor) — no-op.
    if (resolveVersionForDate(s.versions, dateKey)) return false;
    // Dublikat sanaga klon yaratmaymiz (effectiveFrom unikal boʻlishi kerak).
    if (s.versions.some((v) => v.effectiveFrom === dateKey)) return false;
    const earliest = sortVersions(s.versions)[0];
    const clone: TimetableVersion = {
      id: uid(),
      effectiveFrom: dateKey,
      events: cloneEvents(earliest.events, true),
      bellConfig: cloneBell(earliest.bellConfig),
      note: "Yil boshi jadvali",
      createdAt: new Date().toISOString(),
    };
    set({ versions: sortVersions([...s.versions, clone]) });
    return true;
  },

  commitDraft: (versionId, events, bellConfig) =>
    set((s) => ({
      versions: s.versions.map((v) =>
        v.id === versionId
          ? { ...v, events: cloneEvents(events), bellConfig: cloneBell(bellConfig) }
          : v
      ),
    })),

  createVersion: ({ effectiveFrom, note, baseId }) => {
    const s = get();
    if (s.versions.some((v) => v.effectiveFrom === effectiveFrom)) return null;
    const base = s.versions.find((v) => v.id === baseId) ?? s.versions[s.versions.length - 1];
    const version: TimetableVersion = {
      id: uid(),
      effectiveFrom,
      events: base ? cloneEvents(base.events, true) : [],
      bellConfig: base ? cloneBell(base.bellConfig) : defaultBellConfig(),
      note: note?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    set({ versions: sortVersions([...s.versions, version]) });
    return version.id;
  },

  deleteVersion: (versionId) =>
    set((s) =>
      s.versions.length <= 1
        ? s
        : { versions: s.versions.filter((v) => v.id !== versionId) }
    ),

  setEffectiveFrom: (versionId, dateKey) => {
    const s = get();
    if (s.versions.some((v) => v.id !== versionId && v.effectiveFrom === dateKey)) return false;
    set({
      versions: sortVersions(
        s.versions.map((v) => (v.id === versionId ? { ...v, effectiveFrom: dateKey } : v))
      ),
    });
    return true;
  },

  setNote: (versionId, note) =>
    set((s) => ({
      versions: s.versions.map((v) =>
        v.id === versionId ? { ...v, note: note.trim() || undefined } : v
      ),
    })),
}));

/** Sanada amalda boʻlgan jadval hodisalari — React'siz oʻqish (lesson-schedule
    kabi hook boʻlmagan kod uchun). Eski getTimetableForDate (localStorage)
    oʻrnini bosadi: manba server-backed store. */
export function getTimetableForDate(dateKey: string = todayKey()): TimetableEvent[] {
  return resolveVersionForDate(useTimetableStore.getState().versions, dateKey)?.events ?? [];
}
