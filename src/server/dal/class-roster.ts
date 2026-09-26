import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { enrollments, students } from "@/server/db/schema";

/**
 * Sinfning JORIY roʻyxati — hozir shu guruhda oʻqiyotgan bolalar, jurnal
 * tartibida.
 *
 * Ikki shart, ikkalasi ham «sinfdan chiqqan bola» uchun:
 *   • `endedAt IS NULL` — yozilishi yopilmagan (docs/oquvchini-kochirish-spec.md
 *     §4: bola koʻchganda qator oʻchirilmaydi, sana bilan yopiladi);
 *   • `status !== "archived"` — oʻquvchi arxivlanmagan.
 *
 * ⚠️ Ruxsat tekshiruvi BU YERDA YOʻQ — chaqiruvchi `assertTeachesClass`
 * ni oʻzi chaqiradi. Bitta qoida bir joyda: «joriy roʻyxat» taʼrifi
 * oʻzgarsa, Baholash varaqlari ham, Doska gʻildiragi ham birga oʻzgaradi.
 */
export async function activeClassRoster(classId: string): Promise<{ id: string; name: string }[]> {
  const rows = await db
    .select({ id: students.id, name: students.name, status: students.status })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(and(eq(enrollments.classId, classId), isNull(enrollments.endedAt)))
    .orderBy(asc(enrollments.sortOrder), asc(students.createdAt));

  return rows.filter((r) => r.status !== "archived").map(({ id, name }) => ({ id, name }));
}
