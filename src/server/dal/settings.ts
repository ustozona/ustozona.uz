import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { account, teachers } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type {
  AppLanguage,
  TeacherProfile,
  WorkspaceBackground,
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
  plan: "free" | "pro";
  onboardingCompleted: boolean;
};

export type SettingsUpdate = {
  name: string;
  school: string;
  subject: string;
  avatarUrl: string;
  avatarColor: string;
  academicYear: string;
  language: AppLanguage;
  workspaceBackground: WorkspaceBackground;
  onboardingCompleted: boolean;
};

const BACKGROUNDS: readonly string[] = ["grid", "parchment", "circles", "stripes"];
const LANGUAGES: readonly string[] = ["uz", "ru", "en"];

type TeacherPrefs = {
  avatarColor?: string;
  workspaceBackground?: string;
  onboardingCompleted?: boolean;
};

export async function getSettings(): Promise<SettingsPayload> {
  const teacher = await requireTeacher();
  const [acc] = await db
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, teacher.id))
    .limit(1);

  const prefs = (teacher.prefs ?? {}) as TeacherPrefs;
  return {
    profile: {
      name: teacher.name,
      email: teacher.email,
      joinedAt: teacher.createdAt.toISOString().slice(0, 7),
      avatarUrl: teacher.avatarUrl ?? "",
      avatarColor: prefs.avatarColor ?? "orange",
      school: teacher.school ?? "",
      subject: teacher.subject ?? "",
      provider: acc?.providerId === "google" ? "google" : "email",
    },
    academicYear: teacher.academicYear ?? "2025–2026",
    language: LANGUAGES.includes(teacher.language)
      ? (teacher.language as AppLanguage)
      : "uz",
    workspaceBackground: BACKGROUNDS.includes(prefs.workspaceBackground ?? "")
      ? (prefs.workspaceBackground as WorkspaceBackground)
      : "grid",
    plan: teacher.plan === "pro" ? "pro" : "free",
    onboardingCompleted: prefs.onboardingCompleted === true,
  };
}

export async function updateSettings(input: SettingsUpdate): Promise<void> {
  const teacher = await requireTeacher();
  // JSONB `||` merge — boshqa sync'lar (masalan classPrefs) bilan poygada
  // read-merge-write ularning kalitini oʻchirib yubormasin.
  const patch = JSON.stringify({
    avatarColor: input.avatarColor,
    workspaceBackground: input.workspaceBackground,
    onboardingCompleted: input.onboardingCompleted,
  } satisfies TeacherPrefs);
  await db
    .update(teachers)
    .set({
      name: input.name,
      school: input.school,
      subject: input.subject,
      avatarUrl: input.avatarUrl,
      academicYear: input.academicYear,
      language: input.language,
      prefs: sql`${teachers.prefs} || ${patch}::jsonb`,
      updatedAt: new Date(),
    })
    .where(eq(teachers.id, teacher.id));
}
