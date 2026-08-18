import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activitySets, classes, lessons, quizSessions, units } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type { LibraryItem } from "@/lib/library-types";

/* ════════════════════════════════════════════════════════════════════
   MATERIALLAR KUTUBXONASI — oʻqish qatlami.

   Bitta JADVAL emas, bitta KOʻRINISH (R226). Test `activity_sets` da,
   dars `lessons` da yashaydi va shundayligicha qoladi — bu qatlam
   ularni umumiy shaklga keltiradi, xolos. Yangi tur (taqdimot, ish
   varagʻi) qoʻshilganda `LibraryKind` ga bitta qiymat va shu yerga
   bitta `load…` qoʻshiladi; sahifa qayta yozilmaydi.

   `subject`/`grade` oʻqituvchidan soʻralmaydi (R227a): ustun toʻlgan
   boʻlsa oʻshandan, boʻlmasa material tuzilgan sinfdan olinadi. Shu
   sabab bu yerda `classes` bilan solishtirish bor — 0033 dan oldin
   yaratilgan materiallarda ustunlar boʻsh.
   ════════════════════════════════════════════════════════════════════ */

type ClassInfo = { name: string; subject: string | null; grade: number | null };

/**
 * Oʻqituvchining barcha materiallari, eng yangisi birinchi.
 *
 * Soʻrovlar soni turlar soniga bogʻliq (hozir 5 ta), material soniga
 * emas — har element uchun alohida soʻrov YOʻQ.
 */
export async function getLibrary(): Promise<LibraryItem[]> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  const [classRows, setRows, lessonRows, unitRows] = await Promise.all([
    db.select().from(classes).where(eq(classes.teacherId, tid)),
    db.select().from(activitySets).where(eq(activitySets.teacherId, tid)),
    db.select().from(lessons).where(eq(lessons.teacherId, tid)),
    db.select().from(units).where(eq(units.teacherId, tid)),
  ]);

  const classById = new Map<string, ClassInfo>(
    classRows.map((c) => [c.id, { name: c.name, subject: c.subject, grade: c.grade }])
  );
  const unitTitleById = new Map(unitRows.map((u) => [u.id, u.title]));

  /* Testning "ishlatilgan" oʻlchovi — nechta sessiya oʻtkazilgani va
     oxirgisi qachon. Ikkalasi bitta soʻrovdan chiqadi. */
  const sessionCount = new Map<string, number>();
  const lastUsed = new Map<string, Date>();
  if (setRows.length > 0) {
    const rows = await db
      .select({ setId: quizSessions.setId, createdAt: quizSessions.createdAt })
      .from(quizSessions)
      .where(
        inArray(
          quizSessions.setId,
          setRows.map((s) => s.id)
        )
      );
    for (const row of rows) {
      sessionCount.set(row.setId, (sessionCount.get(row.setId) ?? 0) + 1);
      const prev = lastUsed.get(row.setId);
      if (!prev || row.createdAt > prev) lastUsed.set(row.setId, row.createdAt);
    }
  }

  /** Ustun toʻlmagan eski materiallar uchun sinfdan meros. */
  function inherit(
    classId: string | null,
    subject: string | null,
    grade: number | null
  ): Pick<LibraryItem, "subject" | "grade" | "className"> {
    const info = classId ? classById.get(classId) : undefined;
    return {
      subject: subject ?? info?.subject ?? null,
      grade: grade ?? info?.grade ?? null,
      className: info?.name ?? null,
    };
  }

  const items: LibraryItem[] = [
    ...setRows.map((set): LibraryItem => {
      const count = set.items.length;
      return {
        id: set.id,
        kind: "test",
        title: set.title,
        meta: `${count} savol`,
        classId: set.classId,
        updatedAt: set.updatedAt,
        usedCount: sessionCount.get(set.id) ?? 0,
        lastUsedAt: lastUsed.get(set.id) ?? null,
        isDraft: false, // toʻplam atomik saqlanadi — yarim holat yoʻq
        ...inherit(set.classId, set.subject, set.grade),
      };
    }),
    ...lessonRows.map((lesson): LibraryItem => {
      const unitTitle = lesson.unitId ? unitTitleById.get(lesson.unitId) : undefined;
      return {
        id: lesson.id,
        kind: "lesson",
        title: lesson.title,
        meta: unitTitle ? `${unitTitle} · ${lesson.number}-dars` : `${lesson.number}-dars`,
        classId: lesson.classId,
        updatedAt: lesson.updatedAt,
        usedCount: null,
        lastUsedAt: null,
        isDraft: lesson.status === "Draft",
        ...inherit(lesson.classId, lesson.subject, lesson.grade),
      };
    }),
  ];

  return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
