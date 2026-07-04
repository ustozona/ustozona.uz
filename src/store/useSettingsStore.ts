import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   GLOBAL SOZLAMALAR — server bilan sinxron client kesh.

   Domenli sozlamalar (jurnal shkalasi, davomat statuslari, qoʻngʻiroq
   jadvali) oʻz storeʼlarida qoladi — bu store faqat butun app boʻyicha
   global narsalarni saqlaydi: oʻqituvchi profili, oʻquv yili, til va
   ishchi maydon foni. Tema `next-themes` orqali boshqariladi (bu yerda
   emas).

   Haqiqat manbai — server (teachers jadvali). Hydration + sync:
   `SettingsServerSync` (dashboard layout). `_hasHydrated` server
   javobidan keyin yoqiladi — mount-gate'lar avvalgidek ishlaydi.
   ════════════════════════════════════════════════════════════════════ */

export type WorkspaceBackground = "grid" | "parchment" | "circles" | "stripes";
export type AppLanguage = "uz" | "ru" | "en";
export type AuthProvider = "google" | "email";

export type TeacherProfile = {
  name: string;
  email: string;
  /** Roʻyxatdan oʻtgan oy — "YYYY-MM" */
  joinedAt: string;
  /** Profil rasmi — yuklangan (data URL) yoki provayder (Google) rasmi. Boʻsh boʻlsa bosh harflar koʻrsatiladi. */
  avatarUrl: string;
  /** Bosh harflar fon rangi (rasm boʻlmaganda) — foydalanuvchi tanlamaydi, ismдан hosil qilinadi. */
  avatarColor: string;
  /** Maktab / muassasa nomi — DPA va hisobotlar uchun */
  school: string;
  /** Asosiy fan */
  subject: string;
  /** Kirish provayderi (identifikatsiya chipi uchun) */
  provider: AuthProvider;
};

export const DEFAULT_PROFILE: TeacherProfile = {
  name: "Otabek Abdusattorov",
  email: "murabbiyona@gmail.com",
  joinedAt: "2026-03",
  avatarUrl: "",
  avatarColor: "orange",
  school: "",
  subject: "Ingliz tili",
  provider: "google",
};

/** Eskirgan/notaʼrif fon qiymatini xavfsiz normallaymiz. */
export function normalizeBackground(v: unknown): WorkspaceBackground {
  return v === "grid" || v === "parchment" || v === "circles" || v === "stripes"
    ? v
    : "grid";
}

interface SettingsState {
  profile: TeacherProfile;
  setProfile: (patch: Partial<TeacherProfile>) => void;

  academicYear: string;
  setAcademicYear: (y: string) => void;

  language: AppLanguage;
  setLanguage: (l: AppLanguage) => void;

  workspaceBackground: WorkspaceBackground;
  setWorkspaceBackground: (b: WorkspaceBackground) => void;

  plan: "free" | "pro";

  /** Onboarding sehrgari tugatilganmi. Yangi hisobda `false` — dashboard
      sehrgarni koʻrsatadi; tugagach yoki oʻtkazib yuborilgach `true`. */
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;

  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  profile: DEFAULT_PROFILE,
  setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

  academicYear: "",
  setAcademicYear: (y) => set({ academicYear: y }),

  language: "uz",
  setLanguage: (l) => set({ language: l }),

  workspaceBackground: "grid",
  setWorkspaceBackground: (b) => set({ workspaceBackground: b }),

  plan: "free",

  onboardingCompleted: false,
  setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),
}));
