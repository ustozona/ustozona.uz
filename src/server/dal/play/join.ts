import "server-only";
import { randomUUID, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { quizSessions, sessionParticipants, students } from "@/server/db/schema";
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
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, studentId), eq(students.classId, session.classId)));
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
