import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activitySets,
  assignments,
  grades,
  quizSessions,
  responses,
  sessionParticipants,
  topics,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { firstAttemptTotals, type AttemptRow } from "@/lib/assess/first-attempt";
import { gradedItemRows } from "./graded-items";

/* ════════════════════════════════════════════════════════════════════
   JURNALGA KOʻCHIRISH — docs/ost-loyihalar-arxitektura.md, B boʻlim.

   HECH QACHON avtomatik emas — oʻqituvchi aniq bosadi. Besh qadam:
   1. activity_sets.purpose qayta oʻqiladi; `formative` boʻlsa — xato.
   2. Nishon toifa — oʻqituvchiniki va SHU SINFNIKI boʻlishi shart.
   3. Bitta `assignments` qatori — MAVJUDI qayta ishlatiladi (sessiya
      boʻyicha yoki `set_id` halqasi boʻyicha), boʻlmasa yangisi.
   4. Har OʻQUVCHIGA bitta `grades` qatori, faqat BIRINCHI urinishlardan
      (`lib/assess/first-attempt.ts`) — PK (studentId, assignmentId)
      boʻlgani uchun qayta nashr tabiiy idempotent.
   5. `studentId = null` (anonim) ishtirokchilar jimgina oʻtkazib yuboriladi.

   ⚠️ 2-QADAM OʻZGARDI (2026-09-27, docs/topshiriq-boshlash-markazi.md §5).
   Ilgari formativ toifa («Uy ishi», «Sinf ishi») rad etilardi. Lekin
   jurnalda formativ toifaning vazni 0 — u yakuniy bahoga baribir kirmaydi
   (grades-v1-spec: «Yakuniy bahoga: Kirmaydi»), oʻqituvchi esa xuddi shu
   ballarni qoʻlda kiritaverardi. Rad etish faqat uy vazifasi natijasini
   «Uy ishi» ustuniga oʻtkazish yoʻlini yopib turardi. Formativ TOʻPLAM
   (1-qadam, fon importi) esa avvalgidek jurnalga yozilmaydi.
   ════════════════════════════════════════════════════════════════════ */

export class PublishError extends Error {}

export type PublishResult = { assignmentId: string; publishedCount: number; skippedAnonymous: number };

/**
 * `topicId` — uch xil maʼno, uchalasi ham ataylab:
 *   • `"…"`       — aniq toifa (oʻqituvchi tanladi);
 *   • `null`      — «Toifasiz» (jurnalda virtual guruh, vazn olmaydi);
 *   • `undefined` — mavjud ustunning toifasi SAQLANADI (test topshiriqqa
 *     biriktirilgan yoki avval yozilgan boʻlsa). Ustun yoʻq boʻlsa —
 *     «Toifasiz».
 */
export async function publishSessionToGrades(
  sessionId: string,
  topicId?: string | null
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

  // 2 — nishon toifa. Faqat ANIQ tanlangan boʻlsa tekshiriladi: `null`
  // («Toifasiz») va `undefined` (mavjud ustunniki) jadvalga tegmaydi.
  if (topicId) {
    const [topic] = await db
      .select({ id: topics.id, classId: topics.classId })
      .from(topics)
      .where(and(eq(topics.id, topicId), eq(topics.teacherId, tid)));
    if (!topic) throw new PublishError("Toifa topilmadi");
    // Boshqa sinfning toifasi bu sinf ustuniga yozilsa, ustun jurnalda
    // hech bir guruhga tushmay «yoʻqolib» qolardi. Ilgari tekshirilmasdi.
    if (topic.classId !== session.classId) {
      throw new PublishError("Bu toifa boshqa sinfga tegishli");
    }
  }

  // maxScore — toʻplamdagi barcha faoliyatning avto-tekshiriladigan
  // elementlari soni (xom maxraj — baho shundan foizga normallanadi).
  const activityIds = set.items.map((i) => i.activityId);
  // Soʻrovnoma/soʻz buluti kabi baholanmaydiganlar kirmaydi (graded-items.ts).
  const gradedItems = await gradedItemRows(activityIds);
  const maxScore = gradedItems.length;
  if (maxScore === 0) throw new PublishError("Toʻplamda baholanadigan savol yoʻq");

  // 3 — bitta assignments qatori (`findPublishTarget` izohiga qarang).
  const target = await findPublishTarget(tid, session);
  const assignmentId = target?.id ?? randomUUID();
  // Taqdimot ichidagi savollar ham baholanadi — ustun turi toʻplamdan
  // HISOBLANADI (muharrirdagi `handleSetSaved` bilan bir xil qoida),
  // aks holda nashr taqdimotni «test» qilib qoʻyardi.
  const kind = set.containerKind === "deck" ? "deck" : "test";
  if (target) {
    await db
      .update(assignments)
      .set({
        maxScore,
        // `undefined` — ustunning oʻz toifasi saqlanadi. Aniq tanlov
        // (yoki «Toifasiz») esa oʻqituvchining SHU paytdagi qarori.
        ...(topicId === undefined ? {} : { topicId }),
        kind,
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
      topicId: topicId ?? null,
      title: session.title ?? set.title,
      maxScore,
      kind,
      setId: session.setId,
      sourceSessionId: sessionId,
    });
  }

  // 4/5 — har OʻQUVCHIGA bitta grades qatori; anonim (studentId=null)
  // ishtirokchilar jimgina oʻtkazib yuboriladi.
  const participants = await db
    .select({ id: sessionParticipants.id, studentId: sessionParticipants.studentId })
    .from(sessionParticipants)
    .where(
      and(eq(sessionParticipants.sessionId, sessionId), isNotNull(sessionParticipants.studentId))
    );

  /* Ball — faqat BIRINCHI urinishlardan va bola boʻyicha (qurilma emas).
     Ilgari har ishtirokchi qatori alohida hisoblanib, barcha urinishlari
     qoʻshilardi: sahifani yangilab testni qayta yechgan bola 200% olardi,
     ikki telefondan kirgan bolaning bahosini esa tasodifiy qator
     ustidan yozardi. Sabab va qoida: `lib/assess/first-attempt.ts`. */
  const studentOf = new Map<string, string>();
  for (const p of participants) if (p.studentId) studentOf.set(p.id, p.studentId);

  const gradedIds = new Set(gradedItems.map((i) => i.id));
  const responseRows =
    studentOf.size > 0
      ? await db
          .select({
            participantId: responses.participantId,
            itemId: responses.itemId,
            attemptNo: responses.attemptNo,
            answeredAt: responses.answeredAt,
            score: responses.score,
            isCorrect: responses.isCorrect,
          })
          .from(responses)
          .where(eq(responses.sessionId, sessionId))
      : [];

  const attempts: AttemptRow[] = [];
  for (const row of responseRows) {
    const studentId = studentOf.get(row.participantId);
    // Anonim ishtirokchi yoki baholanmaydigan element (soʻrovnoma) — kirmaydi.
    if (!studentId || !gradedIds.has(row.itemId)) continue;
    attempts.push({
      studentId,
      itemId: row.itemId,
      attemptNo: row.attemptNo,
      answeredAt: row.answeredAt,
      score: row.score === null ? null : Number(row.score),
      isCorrect: row.isCorrect,
    });
  }
  const totals = firstAttemptTotals(attempts);

  let publishedCount = 0;
  for (const studentId of new Set(studentOf.values())) {
    const earned = totals.get(studentId)?.earned ?? 0;
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
        studentId,
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

/**
 * Sessiya natijasi QAYSI jurnal ustuniga yoziladi. Uch holat, shu tartibda:
 *
 *   a) shu sessiyadan avval nashr qilingan → oʻsha qator (idempotent);
 *   b) toʻplam shu sinfdagi topshiriqqa BIRIKTIRILGAN va hali nashr
 *      koʻrmagan → oʻsha qator toʻldiriladi. Bu R213/R214 talabi:
 *      oʻqituvchi testni topshiriq ichida tuzganda ustun ALLAQACHON bor
 *      (qogʻoz yoʻli shunga tayanadi) — yangisini yaratsak, bitta test
 *      ikkita baho ustuni boʻlib chiqardi;
 *   c) hech biri yoʻq → `null`, yangi qator yaratiladi.
 *
 * Eksport qilinadi: natija ekrani (`runs.ts`) «qayerga yoziladi» deb
 * AYNAN shu javobni koʻrsatadi — ekrandagi vaʼda bilan haqiqiy yozuv
 * ajralib ketmasin.
 *
 * `orderBy` — bitta test bir sinfda ikki topshiriqqa biriktirilgan
 * boʻlsa (nusxa olingan topshiriq), tanlov har safar bir xil boʻlsin:
 * eng eskisi. Ilgari tartib yoʻq edi va javob tasodifiy edi.
 */
export async function findPublishTarget(
  teacherId: string,
  session: { id: string; setId: string; classId: string },
) {
  const [publishedBefore] = await db
    .select()
    .from(assignments)
    .where(and(eq(assignments.sourceSessionId, session.id), eq(assignments.teacherId, teacherId)))
    .orderBy(asc(assignments.createdAt))
    .limit(1);
  if (publishedBefore) return publishedBefore;

  const [linkedAssignment] = await db
    .select()
    .from(assignments)
    .where(
      and(
        eq(assignments.teacherId, teacherId),
        eq(assignments.setId, session.setId),
        eq(assignments.classId, session.classId),
        isNull(assignments.sourceSessionId)
      )
    )
    .orderBy(asc(assignments.createdAt))
    .limit(1);
  return linkedAssignment ?? null;
}
