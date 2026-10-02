import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";

/* Ustoz pulti — oxirgi Doska chiptasi (`teachers.prefs.doskaRemote`).
   Telefonda kirgan oʻqituvchi `/pult` dan QR'siz shu Doskaga ulanadi.
   Alohida kalit, atomik `||` — boshqa sozlamalarga tegmaydi. */
export async function saveActiveRemote(teacherId: string, ticket: string, exp: number): Promise<void> {
  const patch = JSON.stringify({ doskaRemote: { ticket, exp } });
  await db
    .update(teachers)
    .set({ prefs: sql`coalesce(${teachers.prefs}, '{}'::jsonb) || ${patch}::jsonb`, updatedAt: new Date() })
    .where(eq(teachers.id, teacherId));
}
