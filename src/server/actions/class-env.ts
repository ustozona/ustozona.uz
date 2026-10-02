"use server";

import { z } from "zod";
import { getClassEnvs, saveClassEnv } from "@/server/dal/class-env";

/* Sinf pasporti — yupqa qatlam: zod-parse → DAL.
   ⚠️ Bu faylda tip eksport qilinmaydi (AGENTS.md) — tip
   `@/lib/lesson-models` dagi `ClassEnvironment`. */

const envSchema = z.object({
  smartboard: z.boolean(),
  projector: z.boolean(),
  movement: z.boolean(),
  phones: z.boolean(),
  printer: z.boolean(),
  pult: z.boolean(),
  internet: z.boolean(),
  studentCount: z.number().int().min(1).max(60).nullable(),
  level: z.enum(["strong", "mixed", "weak"]).nullable(),
});

export async function fetchClassEnvsAction() {
  return getClassEnvs();
}

export async function saveClassEnvAction(classId: string, env: unknown): Promise<{ ok: true }> {
  const id = z.string().min(1).max(200).parse(classId);
  await saveClassEnv(id, envSchema.parse(env));
  return { ok: true };
}
