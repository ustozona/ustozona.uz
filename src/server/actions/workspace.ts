"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db/client";
import { teachers, workspaceMembers } from "@/server/db/schema";
import { ForbiddenError, requireTeacher } from "@/server/session";

/* ⛔ Bu faylda `export type { … }` YOZILMAYDI — `"use server"` modulida
   tip-reeksporti prodda runtime eksportga aylanadi va BARCHA server
   amalini oʻldiradi (AGENTS.md, 2026-08-08). Tip kerak boʻlsa neytral
   modulga chiqariladi. */

const switchSchema = z.object({ workspaceId: z.string().min(1).max(200) });

/**
 * Faol ish maydonini almashtiradi.
 *
 * ⚠️ Aʼzolik SERVERDA tekshiriladi — `workspaceId` clientdan kelgan
 * qiymat. Busiz istalgan odam istalgan maydonga "oʻtib" olardi.
 */
export async function switchWorkspaceAction(input: unknown): Promise<void> {
  const { workspaceId } = switchSchema.parse(input);
  const teacher = await requireTeacher();

  const [member] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.teacherId, teacher.id),
        eq(workspaceMembers.workspaceId, workspaceId)
      )
    );
  if (!member) throw new ForbiddenError("Bu ish maydoniga ruxsat yoʻq");

  await db
    .update(teachers)
    .set({ activeWorkspaceId: workspaceId })
    .where(eq(teachers.id, teacher.id));

  // Butun dashboard qamrovga bogʻliq — sinflar, oʻquvchilar, jurnal.
  revalidatePath("/dashboard", "layout");
}
