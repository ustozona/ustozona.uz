import "server-only";
import { randomUUID, randomBytes } from "node:crypto";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { enrollments, quizSessions, sessionParticipants, students } from "@/server/db/schema";
import { memberOnSql } from "@/server/db/membership";
import { todayTashkentKey } from "@/lib/date-keys";
import { hashParticipantToken, ForbiddenError, UnauthorizedError } from "@/server/play/session";
import { isSessionPastDue } from "@/lib/assess/session-due";
import { scheduleNudge } from "@/server/realtime/broadcast";

/* ════════════════════════════════════════════════════════════════════
   QOʻSHILISH — akkauntsiz ishtirokchi PIN/havola/QR bilan kiradi.
   docs/ost-loyihalar-arxitektura.md: `studentId` STANDART HOLDA TOʻLADI
   (R43) — ishtirokchi sinf roʻyxatidan oʻz ismini TANLAYDI, ism yozmaydi.
   Anonim (studentId=null) — istisno, standart emas.

   Xom token FAQAT shu funksiyaning javobida bir marta qaytariladi —
   bazada faqat hash saqlanadi (src/server/play/session.ts).
   ════════════════════════════════════════════════════════════════════ */

export type JoinResult = { token: string; participantId: string; sessionId: string };

/** Kod ishtirokchiga ekvivalent — sinf roʻyxatini (faqat id+ism) qaytaradi,
    ishtirokchi ROʻYXATDAN ismini TANLAYDI (R43), yozmaydi.

    `null` — bunday kod yoʻq. Bu xato emas, kutilgan holat: oʻquvchi kodni
    `/play` da qoʻlda yozadi va bir harf adashishi oddiy hol. Xato
    otilganda mijoz «kod yoʻq» ni tarmoq uzilishidan ajrata olmasdi. */
export async function listRosterByCode(
  joinCode: string,
): Promise<{ id: string; name: string }[] | null> {
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.joinCode, joinCode.toUpperCase()));
  if (!session) return null;

  // Mehmon oqimi: oʻqituvchi sessiyasi yoʻq, shu bois qamrov join-kod
  // orqali kelgan sinfning BUGUNGI roʻyxatidan olinadi — boshqa sinfga
  // koʻchib ketgan yoki arxivlangan bola tanlovda chiqmaydi.
  return db
    .select({ id: students.id, name: students.name })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(
      and(
        eq(enrollments.classId, session.classId),
        ne(students.status, "archived"),
        memberOnSql(todayTashkentKey())
      )
    )
    .orderBy(asc(enrollments.sortOrder), asc(students.createdAt));
}

export async function joinByCode(
  joinCode: string,
  studentId: string | null,
  displayName: string,
  deviceKind?: "mobile" | "tablet" | "desktop"
): Promise<JoinResult> {
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.joinCode, joinCode.toUpperCase()));
  if (!session) throw new UnauthorizedError("Yaroqsiz kod");
  if (session.state !== "running" && session.state !== "scheduled") {
    throw new ForbiddenError("Sessiya hozir qoʻshilish uchun ochiq emas");
  }
  if (isSessionPastDue(session)) {
    throw new ForbiddenError("Topshiriq muddati tugagan");
  }

  if (studentId) {
    const [student] = await db
      .select({ id: enrollments.studentId })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.classId, session.classId),
          memberOnSql(todayTashkentKey())
        )
      );
    if (!student) throw new ForbiddenError("Oʻquvchi shu sinfda topilmadi");
  }

  const token = randomBytes(24).toString("base64url");
  const [participant] = await db
    .insert(sessionParticipants)
    .values({
      id: randomUUID(),
      sessionId: session.id,
      studentId,
      displayName,
      tokenHash: hashParticipantToken(token),
      deviceKind: deviceKind ?? null,
    })
    .returning({ id: sessionParticipants.id });

  // Jonli sessiyada doskadagi «N qoʻshildi» hisobi darhol yangilansin.
  const liveTopic = (session.renderConfig as { liveTopic?: string }).liveTopic;
  if (session.mode === "live" && liveTopic) scheduleNudge(liveTopic);

  return { token, participantId: participant.id, sessionId: session.id };
}
