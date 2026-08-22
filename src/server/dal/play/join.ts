import "server-only";
import { randomUUID, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { enrollments, quizSessions, sessionParticipants, students } from "@/server/db/schema";
import { hashParticipantToken, ForbiddenError, UnauthorizedError } from "@/server/play/session";

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
    ishtirokchi ROʻYXATDAN ismini TANLAYDI (R43), yozmaydi. */
export async function listRosterByCode(joinCode: string): Promise<{ id: string; name: string }[]> {
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.joinCode, joinCode.toUpperCase()));
  if (!session) throw new UnauthorizedError("Yaroqsiz kod");

  // Mehmon oqimi: oʻqituvchi sessiyasi yoʻq, shu bois qamrov join-kod
  // orqali kelgan sinfning YOZILISH roʻyxatidan olinadi.
  return db
    .select({ id: students.id, name: students.name })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(eq(enrollments.classId, session.classId));
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

  if (studentId) {
    const [student] = await db
      .select({ id: enrollments.studentId })
      .from(enrollments)
      .where(
        and(eq(enrollments.studentId, studentId), eq(enrollments.classId, session.classId))
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

  return { token, participantId: participant.id, sessionId: session.id };
}
