import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { studentRelations, students } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   RELATIONS DAL — relations-store (qarindoshlik)'ning server tomoni.

   Snapshot modeli: client "a|b" pair-key roʻyxatini yuboradi (a < b
   normallashtirilgan). DAL DB'dagi joriy juftlar bilan solishtirib
   yetishmaganini qoʻshadi, ortiqchasini oʻchiradi — delete-all-insert
   oʻrniga (tranzaksiya yoʻq — neon-http), xato oʻrtada boʻlsa ham
   maʼlumot yoʻqolmaydi. Juftlar teacher'ning OʻZ oʻquvchilariga
   filtrlangan holda yoziladi (hijack himoyasi).
   ════════════════════════════════════════════════════════════════════ */

export type RelationsPayload = { links: string[] };

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export async function getRelations(): Promise<RelationsPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select()
    .from(studentRelations)
    .where(eq(studentRelations.teacherId, teacher.id));
  return { links: rows.map((r) => pairKey(r.studentA, r.studentB)) };
}

export async function saveRelations(links: string[]): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  // Faqat oʻz oʻquvchilari orasidagi juftlar qabul qilinadi.
  const ownRows = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.teacherId, tid));
  const own = new Set(ownRows.map((r) => r.id));

  const wanted = new Set<string>();
  for (const link of links) {
    const [a, b] = link.split("|");
    if (!a || !b || a === b || !own.has(a) || !own.has(b)) continue;
    wanted.add(pairKey(a, b));
  }

  const existingRows = await db
    .select()
    .from(studentRelations)
    .where(eq(studentRelations.teacherId, tid));
  const existing = new Set(existingRows.map((r) => pairKey(r.studentA, r.studentB)));

  const toInsert = [...wanted].filter((k) => !existing.has(k));
  if (toInsert.length > 0) {
    await db
      .insert(studentRelations)
      .values(
        toInsert.map((k) => {
          const [a, b] = k.split("|");
          return { teacherId: tid, studentA: a, studentB: b };
        })
      )
      .onConflictDoNothing();
  }

  for (const k of [...existing].filter((k) => !wanted.has(k))) {
    const [a, b] = k.split("|");
    await db
      .delete(studentRelations)
      .where(
        and(
          eq(studentRelations.teacherId, tid),
          eq(studentRelations.studentA, a),
          eq(studentRelations.studentB, b)
        )
      );
  }
}
