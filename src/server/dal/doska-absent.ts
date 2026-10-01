import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { attendanceRecords } from "@/server/db/schema";
import { ForbiddenError, requireTeacher, UnauthorizedError } from "@/server/session";
import { assertTeachesClass } from "@/server/workspace";

/* ════════════════════════════════════════════════════════════════════
   DOSKA — bugun darsda yoʻqlar (davomatdan), «Guruhlar» uchun
   (docs/doska-referens-koriklari.md R411).

   Sinf roʻyxati kabi PULLIK (`plan === "pro"`) va sinf shu oʻqituvchiniki
   ekani tekshiriladi — `classId` mijozdan keladi. Faqat oʻquvchi ID lari
   qaytadi, ism ham, sabab ham emas.

   «Kelmadi» va «Sababli» — yoʻq; «Kechikdi» — bor (u darsda).
   Davomat hali olinmagan boʻlsa — boʻsh roʻyxat: hamma bor deb olinadi.
   ════════════════════════════════════════════════════════════════════ */

const ABSENT = ["absent", "excused"];

export async function doskaAbsent(classId: string, today: string): Promise<string[]> {
  try {
    const teacher = await requireTeacher();
    if (teacher.plan !== "pro") return [];
    await assertTeachesClass(classId);
  } catch (e) {
    if (e instanceof UnauthorizedError || e instanceof ForbiddenError) return [];
    throw e;
  }
  const rows = await db
    .select({ studentId: attendanceRecords.studentId })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.classId, classId),
        eq(attendanceRecords.date, today),
        inArray(attendanceRecords.status, ABSENT),
      ),
    );
  return [...new Set(rows.map((r) => r.studentId))];
}
