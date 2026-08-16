import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activityItems,
  activitySets,
  assignments,
  grades,
  quizSessions,
  responses,
  sessionParticipants,
  topics,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   JURNALGA KOʻCHIRISH — docs/ost-loyihalar-arxitektura.md, B boʻlim.

   HECH QACHON avtomatik emas — oʻqituvchi aniq bosadi. Besh qadam:
   1. activity_sets.purpose qayta oʻqiladi; `formative` boʻlsa — xato.
   2. Nishon topic.purpose `formative` boʻlsa — xato.
   3. Bitta `assignments` qatori — MAVJUDI qayta ishlatiladi (sessiya
      boʻyicha yoki `set_id` halqasi boʻyicha), boʻlmasa yangisi.
   4. Har ishtirokchiga bitta `grades` qatori — PK (studentId, assignmentId)
      boʻlgani uchun qayta nashr tabiiy idempotent.
   5. `studentId = null` (anonim) ishtirokchilar jimgina oʻtkazib yuboriladi.
   ════════════════════════════════════════════════════════════════════ */

export class PublishError extends Error {}

export type PublishResult = { assignmentId: string; publishedCount: number; skippedAnonymous: number };

export async function publishSessionToGrades(
  sessionId: string,
  topicId: string
): Promise<PublishResult> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, tid)));
  if (!session) throw new PublishError("Sessiya topilmadi");

  const [set] = await db
    .select()
    .from(activitySets)
    .where(and(eq(activitySets.id, session.setId), eq(activitySets.teacherId, tid)));
  if (!set) throw new PublishError("Toʻplam topilmadi");
  // 1 — activity_sets.purpose qayta oʻqiladi.
  if (set.purpose === "formative") {
    throw new PublishError("Formativ toʻplam jurnalga koʻchirilmaydi");
  }

  const [topic] = await db
    .select()
    .from(topics)
    .where(and(eq(topics.id, topicId), eq(topics.teacherId, tid)));
  if (!topic) throw new PublishError("Toifa topilmadi");
  // 2 — nishon toifa formativ boʻlsa xato.
  if (topic.purpose === "formative") {
    throw new PublishError("Formativ toifaga koʻchirib boʻlmaydi");
  }

  // maxScore — toʻplamdagi barcha faoliyatning avto-tekshiriladigan
  // elementlari soni (xom maxraj — baho shundan foizga normallanadi).
  const activityIds = set.items.map((i) => i.activityId);
  const maxScore =
    activityIds.length === 0
      ? 0
      : (
          await db
            .select({ count: sql<number>`count(*)::int` })
            .from(activityItems)
            .where(inArray(activityItems.activityId, activityIds))
        )[0]?.count ?? 0;
  if (maxScore === 0) throw new PublishError("Toʻplamda elementlar yoʻq");

  // 3 — bitta assignments qatori. Uch holat, shu tartibda:
  //
  //   a) shu sessiyadan avval nashr qilingan → oʻsha qator (idempotent);
  //   b) toʻplam topshiriqqa BIRIKTIRILGAN va hali nashr koʻrmagan →
  //      oʻsha qator toʻldiriladi. Bu R213/R214 talabi: oʻqituvchi testni
  //      topshiriq ichida tuzganda ustun ALLAQACHON bor (qogʻoz yoʻli
  //      shunga tayanadi) — bu yerda yangisini yaratsak, bitta test
  //      ikkita baho ustuni boʻlib chiqardi;
  //   c) hech biri yoʻq → yangi qator (tashqarida tuzilgan test).
  const [publishedBefore] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.sourceSessionId, sessionId), eq(assignments.teacherId, tid)));

  const [linkedAssignment] = publishedBefore
    ? []
    : await db
        .select()
        .from(assignments)
        .where(
          and(
            eq(assignments.teacherId, tid),
            eq(assignments.setId, session.setId),
            eq(assignments.classId, session.classId),
            isNull(assignments.sourceSessionId)
          )
        );

  const target = publishedBefore ?? linkedAssignment;
  const assignmentId = target?.id ?? randomUUID();
  if (target) {
    // `topicId` nashr oynasida ANIQ tanlanadi — oʻqituvchining shu
    // paytdagi qarori topshiriqdagi eski toifadan ustun turadi.
    await db
      .update(assignments)
      .set({
        maxScore,
        topicId,
        kind: "test",
        setId: session.setId,
        sourceSessionId: sessionId,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignmentId));
  } else {
    await db.insert(assignments).values({
      id: assignmentId,
      teacherId: tid,
      classId: session.classId,
      topicId,
      title: session.title ?? set.title,
      maxScore,
      kind: "test",
      setId: session.setId,
      sourceSessionId: sessionId,
    });
  }

  // 4/5 — har ishtirokchiga bitta grades qatori; anonim (studentId=null)
  // ishtirokchilar jimgina oʻtkazib yuboriladi.
  const participants = await db
    .select()
    .from(sessionParticipants)
    .where(
      and(eq(sessionParticipants.sessionId, sessionId), isNotNull(sessionParticipants.studentId))
    );

  let publishedCount = 0;
  for (const participant of participants) {
    if (!participant.studentId) continue; // xavfsizlik uchun ikkinchi tekshiruv

    const participantResponses = await db
      .select({ score: responses.score, isCorrect: responses.isCorrect })
      .from(responses)
      .where(
        and(
          eq(responses.participantId, participant.id),
          inArray(responses.activityId, activityIds)
        )
      );

    const earned = participantResponses.reduce((sum, r) => {
      if (r.score !== null) return sum + Number(r.score);
      return sum + (r.isCorrect ? 1 : 0);
    }, 0);
    // XOM BALL yoziladi, foiz EMAS — `grades.score` maxraji aynan shu
    // topshiriqning `maxScore` i (schema/grades.ts shartnomasi). Foizga
    // normalizatsiyani jurnal tomonida `gradePercent()` bajaradi; bu
    // yerda ham boʻlish — natijani ikki marta boʻlib yuborardi.
    // Qisman ball (R26) kasr boʻlishi mumkin — `real` ustun, 2 xona yetarli.
    const rawScore = Math.round(earned * 100) / 100;

    await db
      .insert(grades)
      .values({
        teacherId: tid,
        studentId: participant.studentId,
        assignmentId,
        score: rawScore,
      })
      .onConflictDoUpdate({
        target: [grades.studentId, grades.assignmentId],
        set: { score: rawScore, updatedAt: new Date() },
        setWhere: eq(grades.teacherId, tid),
      });
    publishedCount += 1;
  }

  const totalParticipants = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));
  const skippedAnonymous = (totalParticipants[0]?.count ?? 0) - participants.length;

  return { assignmentId, publishedCount, skippedAnonymous };
}
