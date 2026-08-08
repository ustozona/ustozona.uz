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

export type WorkspaceBackground =
  | "grid"
  | "parchment"
  | "stripes"
  | "plain"
  | "checker"
  | "lined"
  | "graphDashed"
  | "graph45"
  | "circuit";

/** Fon variantlari — yagona manba (store, server-validatsiya va UI shu roʻyxatga tayanadi). */
export const WORKSPACE_BACKGROUNDS: readonly WorkspaceBackground[] = [
  "grid",
  "parchment",
  "stripes",
  "plain",
  "checker",
  "lined",
  "graphDashed",
  "graph45",
  "circuit",
];

/** Naqsh oʻlchami — foiz (200–400, dizayn vositalari zoom bosqichlariga mos).
    Slider bilan uzluksiz tanlanadi. */
export const BACKGROUND_SCALE_MIN = 200;
export const BACKGROUND_SCALE_MAX = 400;
export const BACKGROUND_SCALE_DEFAULT = 300;

export function normalizeBackgroundScale(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return BACKGROUND_SCALE_DEFAULT;
  return Math.min(BACKGROUND_SCALE_MAX, Math.max(BACKGROUND_SCALE_MIN, n));
}
export type AppLanguage = "uz" | "kaa" | "ru" | "en" | "ky" | "kk";

/** Vazifalar sahifasi — tugʻilgan kun avto-vazifasi + pomodoro uzunliklari.
    `birthdayLead` — bildirishnoma necha kun oldin (0 = oʻsha kuni).
    `longBreakEvery` — nechta pomodorodan keyin uzun tanaffus. */
export type TasksSettings = {
  birthdayTasks: boolean;
  birthdayLead: 0 | 1 | 3;
  pomoMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakEvery: number;
};
export const DEFAULT_TASKS_SETTINGS: TasksSettings = {
  birthdayTasks: false,
  birthdayLead: 0,
  pomoMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
};
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
  /** Tugʻilgan kun — "YYYY-MM-DD", ixtiyoriy (tabrik/chegirma uchun). Boʻsh — "" */
  birthDate: string;
};

/* ⛔ BU YERGA HAQIQIY ISM/EMAIL YOZMANG — NEYTRAL QOLSIN.

   Ilgari bu yerda ishlab-chiqarish paytidan qolgan haqiqiy qiymatlar
   turgan edi: `name: "Otabek Abdusattorov"`, `email: "ustozona@gmail.com"`,
   `joinedAt: "2026-03"`, `subject: "Ingliz tili"`.

   Oqibati 2026-08-08 da prodda ushlandi va juda chalg'ituvchi edi:
   `HeaderAccountMenu` ism/email'ni SESSIYADAN emas, shu store'dan
   oladi (`profile.email`, 105-qator). Server ma'lumoti yuklanmasa
   store shu standart qiymatda qoladi — va `useHydrateStore` yiqilgan
   holatda ham `_hasHydrated: true` qo'yadi, ya'ni UI ularni HAQIQIY
   deb ko'rsatadi.

   Natijada foydalanuvchi QAYSI akkaunt bilan kirsa ham menyuda
   «Otabek Abdusattorov / ustozona@gmail.com» chiqardi. Buni «tizim
   meni majburan boshqa akkauntga kiritdi» deb tushunish tabiiy edi —
   holbuki sessiya to'g'ri ishlayotgan edi.

   Bo'sh qiymat bilan xato holat DARHOL ko'rinadi («—»), begona
   akkaunt esa hech kimga ko'rsatilmaydi. */
export const DEFAULT_PROFILE: TeacherProfile = {
  name: "",
  email: "",
  joinedAt: "",
  avatarUrl: "",
  avatarColor: "orange",
  school: "",
  subject: "",
  provider: "email",
  birthDate: "",
};

/** Eskirgan/notaʼrif fon qiymatini xavfsiz normallaymiz. */
export function normalizeBackground(v: unknown): WorkspaceBackground {
  return WORKSPACE_BACKGROUNDS.includes(v as WorkspaceBackground)
    ? (v as WorkspaceBackground)
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

  backgroundScale: number;
  setBackgroundScale: (s: number) => void;

  plan: "free" | "pro";

  /** Onboarding sehrgari tugatilganmi. Yangi hisobda `false` — dashboard
      sehrgarni koʻrsatadi; tugagach yoki oʻtkazib yuborilgach `true`. */
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;

  /** Koʻrilgan bo'lim tur'lari (coach-mark) — tur YAKUNLANGANDA id shu
      yerga qoʻshiladi. Skip qilinganlar bu yerga YOZILMAYDI — alohida
      `dismissedTours` roʻyxatiga tushadi. prefs JSONB'da saqlanadi. */
  completedTours: string[];
  markTourCompleted: (id: string) => void;

  /** Oʻtkazib yuborilgan (skip) turlar — avto-trigger qilmaslik uchun,
      lekin GuideHub checklistida ✓ KOʻRSATILMAYDI. */
  dismissedTours: string[];
  dismissTour: (id: string) => void;

  /** Yarim tashlab ketilgan turlar hisoblagichi — 2+ marta tashlab
      ketilgach avto-trigger oʻchiriladi (GuideHub'dan replay qolaveradi). */
  abandonedTours: Record<string, number>;
  incrementAbandon: (id: string) => void;

  /** Avto-turlarni yoqish/oʻchirish — foydalanuvchi Sozlamalarda
      boshqaradi. false boʻlsa sahifaga kirganda tur avtomatik chiqmaydi,
      lekin GuideHub'dan qoʻlda boshlash ishlayveradi. */
  autoToursEnabled: boolean;
  setAutoToursEnabled: (v: boolean) => void;

  tasksSettings: TasksSettings;
  setTasksSettings: (v: TasksSettings) => void;

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

  backgroundScale: BACKGROUND_SCALE_DEFAULT,
  setBackgroundScale: (s) => set({ backgroundScale: s }),

  plan: "free",

  onboardingCompleted: false,
  setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

  completedTours: [],
  markTourCompleted: (id) =>
    set((s) => (s.completedTours.includes(id) ? s : { completedTours: [...s.completedTours, id] })),

  dismissedTours: [],
  dismissTour: (id) =>
    set((s) => (s.dismissedTours.includes(id) ? s : { dismissedTours: [...s.dismissedTours, id] })),

  abandonedTours: {},
  incrementAbandon: (id) =>
    set((s) => ({ abandonedTours: { ...s.abandonedTours, [id]: (s.abandonedTours[id] ?? 0) + 1 } })),

  autoToursEnabled: true,
  setAutoToursEnabled: (v) => set({ autoToursEnabled: v }),

  tasksSettings: DEFAULT_TASKS_SETTINGS,
  setTasksSettings: (v) => set({ tasksSettings: v }),

  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),
}));
