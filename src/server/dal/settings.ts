import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { account, teachers, user } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { displayEmail } from "@/lib/placeholder-email";
import { normalizeSubject } from "@/lib/standards-data";
import {
  normalizeBackgroundScale,
  type AppLanguage,
  type TasksSettings,
  type TeacherProfile,
  type WorkspaceBackground,
} from "@/store/useSettingsStore";

/* ════════════════════════════════════════════════════════════════════
   SETTINGS DAL — useSettingsStore'ning server tomoni.

   Saqlash joylari:
   - ustunlar: name, email, school, subject, avatar_url, language,
     academic_year, plan
   - prefs JSONB: avatarColor, workspaceBackground (sof UI afzalliklari)
   - joinedAt/provider — hosilaviy (createdAt, account.providerId)

   `plan` va `email` clientdan YOZILMAYDI: plan — billing hududi,
   email — auth hududi (Better Auth orqali oʻzgaradi).
   ════════════════════════════════════════════════════════════════════ */

export type SettingsPayload = {
  profile: TeacherProfile;
  academicYear: string;
  language: AppLanguage;
  workspaceBackground: WorkspaceBackground;
  backgroundScale: number;
  plan: "free" | "pro";
  onboardingCompleted: boolean;
  completedTours: string[];
  tasksSettings: TasksSettings;
};

export type SettingsUpdate = {
  name: string;
  school: string;
  subject: string;
  birthDate: string;
  avatarUrl: string;
  avatarColor: string;
  academicYear: string;
  language: AppLanguage;
  workspaceBackground: WorkspaceBackground;
  backgroundScale: number;
  onboardingCompleted: boolean;
  completedTours: string[];
  tasksSettings: TasksSettings;
};

const BACKGROUNDS: readonly string[] = [
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
const LANGUAGES: readonly string[] = ["uz", "kaa", "ru", "en", "ky", "kk"];

type TeacherPrefs = {
  avatarColor?: string;
  workspaceBackground?: string;
  backgroundScale?: number;
  onboardingCompleted?: boolean;
  completedTours?: string[];
  birthdayTasks?: boolean;
  birthdayLead?: number;
  pomoMinutes?: number;
  shortBreakMinutes?: number;
  longBreakMinutes?: number;
  longBreakEvery?: number;
};

function clampMinutes(v: unknown, fallback: number, max = 180): number {
  const n = typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n >= 1 && n <= max ? n : fallback;
}

export async function getSettings(): Promise<SettingsPayload> {
  const teacher = await requireTeacher();
  const [acc] = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, teacher.id))
    .limit(1);
  const [authUser] = await db
    .select({ image: user.image })
    .from(user)
    .where(eq(user.id, teacher.id))
    .limit(1);

  const prefs = (teacher.prefs ?? {}) as TeacherPrefs;
  return {
    profile: {
      name: teacher.name,
      // Telegram orqali ochilgan va email KIRITILMAGAN akkauntda
      // `email` — texnik oʻrinbosar (`tg123@telegram.invalid`). Uni
      // koʻrsatish «tizim menga qandaydir email oʻylab topgan» degan
      // taassurot berardi, shuning uchun boʻsh koʻrsatiladi.
      // Sabab: `lib/placeholder-email.ts`.
      email: displayEmail(teacher.email),
      joinedAt: teacher.createdAt.toISOString().slice(0, 7),
      // Foydalanuvchi hali oʻzi rasm yuklamagan boʻlsa, Google OAuth'dan
      // kelgan rasmni (Better Auth `user.image`) avtomatik ishlatamiz.
      avatarUrl: teacher.avatarUrl || authUser?.image || "",
      avatarColor: prefs.avatarColor ?? "orange",
      school: teacher.school ?? "",
      // Eski yozuvda fan nomi saqlangan boʻlishi mumkin — katalog kodiga
      // oʻgiriladi, shunda tanlagich uni tanlangan holda koʻrsatadi.
      subject: normalizeSubject(teacher.subject) ?? "",
      birthDate: teacher.birthDate ?? "",
      provider: acc?.providerId === "google" ? "google" : "email",
    },
    academicYear: teacher.academicYear ?? "2025–2026",
    language: LANGUAGES.includes(teacher.language)
      ? (teacher.language as AppLanguage)
      : "uz",
    workspaceBackground: BACKGROUNDS.includes(prefs.workspaceBackground ?? "")
      ? (prefs.workspaceBackground as WorkspaceBackground)
      : "grid",
    backgroundScale: normalizeBackgroundScale(prefs.backgroundScale),
    plan: teacher.plan === "pro" ? "pro" : "free",
    onboardingCompleted: prefs.onboardingCompleted === true,
    completedTours: Array.isArray(prefs.completedTours) ? prefs.completedTours : [],
    tasksSettings: {
      birthdayTasks: prefs.birthdayTasks === true,
      birthdayLead: prefs.birthdayLead === 1 || prefs.birthdayLead === 3 ? prefs.birthdayLead : 0,
      pomoMinutes: clampMinutes(prefs.pomoMinutes, 25),
      shortBreakMinutes: clampMinutes(prefs.shortBreakMinutes, 5, 60),
      longBreakMinutes: clampMinutes(prefs.longBreakMinutes, 15, 60),
      longBreakEvery: Number.isFinite(prefs.longBreakEvery) && (prefs.longBreakEvery ?? 0) >= 2 && (prefs.longBreakEvery ?? 0) <= 12
        ? (prefs.longBreakEvery as number)
        : 4,
    },
  };
}

export async function updateSettings(input: SettingsUpdate): Promise<void> {
  const teacher = await requireTeacher();
  // JSONB `||` merge — boshqa sync'lar (masalan classPrefs) bilan poygada
  // read-merge-write ularning kalitini oʻchirib yubormasin.
  const patch = JSON.stringify({
    avatarColor: input.avatarColor,
    workspaceBackground: input.workspaceBackground,
    backgroundScale: input.backgroundScale,
    onboardingCompleted: input.onboardingCompleted,
    completedTours: input.completedTours,
    birthdayTasks: input.tasksSettings.birthdayTasks,
    birthdayLead: input.tasksSettings.birthdayLead,
    pomoMinutes: input.tasksSettings.pomoMinutes,
    shortBreakMinutes: input.tasksSettings.shortBreakMinutes,
    longBreakMinutes: input.tasksSettings.longBreakMinutes,
    longBreakEvery: input.tasksSettings.longBreakEvery,
  } satisfies TeacherPrefs);
  await db
    .update(teachers)
    .set({
      name: input.name,
      school: input.school,
      subject: input.subject,
      birthDate: input.birthDate || null,
      avatarUrl: input.avatarUrl,
      academicYear: input.academicYear,
      language: input.language,
      prefs: sql`${teachers.prefs} || ${patch}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(teachers.id, teacher.id));
}
