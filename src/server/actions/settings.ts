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
  /** Data-URL boʻlishi mumkin — limit ~1.5MB matn. */
  avatarUrl: z.string().max(1_500_000),
  avatarColor: z.string().max(50),
  academicYear: z.string().max(20),
  language: z.enum(["uz", "ru", "en"]),
  workspaceBackground: z.enum(["grid", "parchment", "circles", "stripes"]),
});

export type SettingsSaveInput = z.infer<typeof saveSchema>;

export async function saveSettingsAction(
  input: SettingsSaveInput
): Promise<{ ok: true }> {
  await updateSettings(saveSchema.parse(input));
  return { ok: true };
}
