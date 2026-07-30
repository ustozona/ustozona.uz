import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activityBanks, type ActivityBankRow } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ACTIVITY BANKS — savol/faoliyat toʻplamlarining papkasi.
   visibility standarti `private` (R57/R67/R71).
   ════════════════════════════════════════════════════════════════════ */

export type CreateBankInput = {
  name: string;
  subject?: string;
  grade?: number;
  visibility?: "private" | "school" | "public";
  copiedFrom?: string;
};

/** Oʻz banklari + `school`/`public` koʻrinuvchan boshqalarniki (umumiy baza, B5.4). */
export async function listBanks(): Promise<ActivityBankRow[]> {
  const teacher = await requireTeacher();
  return db
    .select()
    .from(activityBanks)
    .where(or(eq(activityBanks.teacherId, teacher.id), eq(activityBanks.visibility, "school")));
}

export async function createBank(input: CreateBankInput): Promise<ActivityBankRow> {
  const teacher = await requireTeacher();
  const [row] = await db
    .insert(activityBanks)
    .values({
      id: randomUUID(),
      teacherId: teacher.id,
      name: input.name,
      subject: input.subject ?? null,
      grade: input.grade ?? null,
      visibility: input.visibility ?? "private",
      copiedFrom: input.copiedFrom ?? null,
    })
    .returning();
  return row;
}

export async function updateBank(
  id: string,
  patch: Partial<Pick<CreateBankInput, "name" | "subject" | "grade" | "visibility">>
): Promise<ActivityBankRow> {
  const teacher = await requireTeacher();
  const [row] = await db
    .update(activityBanks)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(activityBanks.id, id), eq(activityBanks.teacherId, teacher.id)))
    .returning();
  if (!row) throw new Error("Bank topilmadi yoki sizga tegishli emas");
  return row;
}

export async function deleteBank(id: string): Promise<void> {
  const teacher = await requireTeacher();
  await db
    .delete(activityBanks)
    .where(and(eq(activityBanks.id, id), eq(activityBanks.teacherId, teacher.id)));
}
