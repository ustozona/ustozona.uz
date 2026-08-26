import "server-only";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  classes,
  enrollments,
  students,
  topics,
  assignments,
  grades,
  attendanceRecords,
  attendanceStatuses,
  behaviorEvents,
} from "@/server/db/schema";
import { visibleClassIds } from "@/server/workspace";

/* ════════════════════════════════════════════════════════════════════
   AI SINF-KONTEKSTI — "sinfga moslab reja tuz" uchun AGREGAT xulosa.

   XAVFSIZLIK TAMOYILI: bu modul AI promptiga faqat anonim/agregat
   maʼlumot beradi — oʻquvchi ismi, telefon, tugʻilgan sana kabi shaxsiy
   maʼlumotlar HECH QACHON qaytarilmaydi. Yangi maydon qoʻshishdan oldin
   shu tamoyilni tekshiring.

   Barcha soʻrovlar teacherId bilan qamrovlangan (multi-tenant).
   ════════════════════════════════════════════════════════════════════ */

const LOOKBACK_DAYS = 30;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000 + 5 * 3600_000)
    .toISOString()
    .slice(0, 10);
}

/** Bitta sinf uchun anonim statistika bloki (prompt matni). Sinf topilmasa null. */
export async function buildClassContext(
  teacherId: string,
  classId: string
): Promise<string | null> {
  const allowed = await visibleClassIds("data");
  if (!allowed.includes(classId)) return null;

  const [cls] = await db
    .select({ id: classes.id, name: classes.name, grade: classes.grade, subject: classes.subject })
    .from(classes)
    .where(eq(classes.id, classId));
  if (!cls) return null;

  const since = isoDaysAgo(LOOKBACK_DAYS);

  const [
    [studentCount],
    topicAverages,
    attendanceCounts,
    [behaviorSummary],
  ] = await Promise.all([
    // Faol oʻquvchilar soni
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(enrollments)
      .innerJoin(students, eq(students.id, enrollments.studentId))
      .where(and(eq(enrollments.classId, classId), eq(students.status, "active"))),

    // Toifa boʻyicha oʻrtacha foiz (score/maxScore, draft va missing chiqarilgan)
    db
      .select({
        topic: topics.name,
        avgPercent: sql<number>`round(avg(${grades.score} / nullif(${assignments.maxScore}, 0) * 100))::int`,
        graded: sql<number>`count(${grades.score})::int`,
      })
      .from(grades)
      .innerJoin(assignments, eq(grades.assignmentId, assignments.id))
      .innerJoin(topics, eq(assignments.topicId, topics.id))
      .where(
        and(
          eq(assignments.teacherId, teacherId),
          eq(assignments.classId, classId),
          eq(grades.isDraft, false),
          sql`${grades.score} is not null`,
          sql`${grades.missing} is null`
        )
      )
      .groupBy(topics.name),

    // Davomat (oxirgi 30 kun): holat taʼsiri boʻyicha sanash
    db
      .select({
        impact: attendanceStatuses.scoreImpact,
        n: sql<number>`count(*)::int`,
      })
      .from(attendanceRecords)
      .innerJoin(
        attendanceStatuses,
        and(
          eq(attendanceStatuses.teacherId, attendanceRecords.teacherId),
          eq(attendanceStatuses.key, attendanceRecords.status)
        )
      )
      .where(
        and(
          eq(attendanceRecords.teacherId, teacherId),
          eq(attendanceRecords.classId, classId),
          gte(attendanceRecords.date, since)
        )
      )
      .groupBy(attendanceStatuses.scoreImpact),

    // Xulq (oxirgi 30 kun): ijobiy/salbiy ballar
    db
      .select({
        plus: sql<number>`coalesce(sum(case when ${behaviorEvents.points} > 0 then ${behaviorEvents.points} else 0 end), 0)::int`,
        minus: sql<number>`coalesce(sum(case when ${behaviorEvents.points} < 0 then ${behaviorEvents.points} else 0 end), 0)::int`,
        n: sql<number>`count(*)::int`,
      })
      .from(behaviorEvents)
      .where(
        and(
          eq(behaviorEvents.teacherId, teacherId),
          eq(behaviorEvents.classId, classId),
          gte(behaviorEvents.date, since)
        )
      ),
  ]);

  const lines: string[] = [];
  const title = [cls.name, cls.grade ? `${cls.grade}-sinf darajasi` : null, cls.subject]
    .filter(Boolean)
    .join(", ");
  lines.push(`Sinf: ${title}`);
  lines.push(`Faol oʻquvchilar soni: ${studentCount?.n ?? 0}`);

  // Baholar
  const gradedTopics = topicAverages.filter((t) => t.graded > 0 && t.avgPercent != null);
  if (gradedTopics.length) {
    const overall = Math.round(
      gradedTopics.reduce((s, t) => s + t.avgPercent * t.graded, 0) /
        gradedTopics.reduce((s, t) => s + t.graded, 0)
    );
    lines.push(`Umumiy oʻrtacha oʻzlashtirish: ${overall}%`);
    const sorted = [...gradedTopics].sort((a, b) => a.avgPercent - b.avgPercent);
    lines.push(
      `Toifalar boʻyicha oʻrtacha: ${sorted
        .map((t) => `${t.topic} — ${t.avgPercent}%`)
        .join("; ")}`
    );
    if (sorted.length >= 2) {
      lines.push(
        `Eng zaif toifa: ${sorted[0].topic} (${sorted[0].avgPercent}%); eng kuchli: ${sorted[sorted.length - 1].topic} (${sorted[sorted.length - 1].avgPercent}%)`
      );
    }
  } else {
    lines.push("Baholar: hali yetarli maʼlumot yoʻq");
  }

  // Davomat
  const attTotal = attendanceCounts.reduce((s, r) => s + r.n, 0);
  if (attTotal > 0) {
    const negative = attendanceCounts.find((r) => r.impact === "negative")?.n ?? 0;
    const rate = Math.round(((attTotal - negative) / attTotal) * 100);
    lines.push(`Davomat (oxirgi ${LOOKBACK_DAYS} kun): ~${rate}% (${attTotal} ta belgi)`);
  }

  // Xulq
  if (behaviorSummary && behaviorSummary.n > 0) {
    lines.push(
      `Xulq (oxirgi ${LOOKBACK_DAYS} kun): +${behaviorSummary.plus} ball ijobiy, ${behaviorSummary.minus} ball salbiy (${behaviorSummary.n} ta voqea)`
    );
  }

  return lines.join("\n");
}

/** Bir nechta sinf (dars bir necha sinfga biriktirilgan boʻlishi mumkin). */
export async function buildClassContexts(
  teacherId: string,
  classIds: string[]
): Promise<string> {
  // Faqat oʻqituvchi oʻtadigan darslar (himoya + tartib)
  const allowed = new Set(await visibleClassIds("data"));
  const own = classIds.filter((id) => allowed.has(id));
  const blocks: string[] = [];
  for (const id of own.slice(0, 3)) {
    const block = await buildClassContext(teacherId, id);
    if (block) blocks.push(block);
  }
  if (!blocks.length) return "";
  return `\n\n— Sinf statistikasi (anonim, oxirgi ${LOOKBACK_DAYS} kun) —\n${blocks.join("\n\n")}\nShu statistikani hisobga olib, sinf darajasiga mos taklif ber. Oʻquvchilarni nomlab gapirma.`;
}
