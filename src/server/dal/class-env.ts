import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { normalizeClassEnv, type ClassEnvironment } from "@/lib/lesson-models";

/* ════════════════════════════════════════════════════════════════════
   SINF PASPORTI DAL — sinf sharoiti (jihozlar, telefon, printer…)
   → `teachers.prefs.classEnv[classId]`.

   Ilgari bu maʼlumot faqat brauzerda edi (Reja ustasi, localStorage):
   boshqa qurilmada yoʻqolardi, Dars studiyasi esa uni koʻrmasdi.

   `classPrefs` hujjatiga EMAS, alohida kalitga — u `useClassStore`
   tomonidan snapshot bilan yoziladi va bizning maydonni har safar
   oʻchirib yuborardi. Yozish sinf boʻyicha `jsonb_set` bilan ATOMIK:
   ikki tab ikki sinfni bir vaqtda saqlasa ham bir-birini yemaydi.
   ════════════════════════════════════════════════════════════════════ */

type PrefsDoc = { classEnv?: Record<string, unknown> };

export async function getClassEnvs(): Promise<Record<string, ClassEnvironment>> {
  const teacher = await requireTeacher();
  const stored = ((teacher.prefs ?? {}) as PrefsDoc).classEnv ?? {};
  const out: Record<string, ClassEnvironment> = {};
  for (const [classId, env] of Object.entries(stored)) out[classId] = normalizeClassEnv(env);
  return out;
}

export async function saveClassEnv(classId: string, env: ClassEnvironment): Promise<void> {
  const teacher = await requireTeacher();
  const value = JSON.stringify(normalizeClassEnv(env));
  await db
    .update(teachers)
    .set({
      prefs: sql`jsonb_set(
        coalesce(${teachers.prefs}, '{}'::jsonb) || jsonb_build_object('classEnv', coalesce(${teachers.prefs}->'classEnv', '{}'::jsonb)),
        array['classEnv', ${classId}::text],
        ${value}::jsonb,
        true
      )`,
      updatedAt: new Date(),
    })
    .where(eq(teachers.id, teacher.id));
}
