"use server";

import { z } from "zod";
import {
  getSettings,
  updateSettings,
  type SettingsPayload,
} from "@/server/dal/settings";

/* Settings server actions — yupqa qatlam: zod-parse → DAL.
   Auth tekshiruvi DAL ichida (requireTeacher). */

export async function fetchSettingsAction(): Promise<SettingsPayload> {
  return getSettings();
}

const saveSchema = z.object({
  name: z.string().trim().min(1).max(200),
  school: z.string().max(300),
  subject: z.string().max(200),
  /** "YYYY-MM-DD" yoki boʻsh satr — ixtiyoriy. */
  birthDate: z.string().max(10),
  /** Data-URL boʻlishi mumkin — limit ~1.5MB matn. */
  avatarUrl: z.string().max(1_500_000),
  avatarColor: z.string().max(50),
  academicYear: z.string().max(20),
  language: z.enum(["uz", "kaa", "ru", "en", "ky", "kk"]),
  workspaceBackground: z.enum([
    "grid",
    "parchment",
    "stripes",
    "plain",
    "checker",
    "lined",
    "graphDashed",
    "graph45",
    "circuit",
  ]),
  backgroundScale: z.number().min(200).max(400),
  onboardingCompleted: z.boolean(),
  completedTours: z.array(z.string().max(50)).max(50),
  tasksSettings: z.object({
    birthdayTasks: z.boolean(),
    birthdayLead: z.union([z.literal(0), z.literal(1), z.literal(3)]),
  }),
});

export type SettingsSaveInput = z.infer<typeof saveSchema>;

export async function saveSettingsAction(
  input: SettingsSaveInput
): Promise<{ ok: true }> {
  await updateSettings(saveSchema.parse(input));
  return { ok: true };
}
