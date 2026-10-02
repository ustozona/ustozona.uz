import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";

/** Oʻqituvchi tarifi — AI kvotasi uchun. Telefon (chipta) yoʻlida cookie
    sessiyasi yoʻq, shuning uchun tarif id boʻyicha oʻqiladi. */
export async function teacherPlanById(teacherId: string): Promise<string | null> {
  const [row] = await db.select({ plan: teachers.plan }).from(teachers).where(eq(teachers.id, teacherId)).limit(1);
  return row?.plan ?? null;
}
