import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activityItems,
  activitySets,
  classes,
  quizSessions,
  responses,
  sessionParticipants,
  teachers,
  tgNotifyLog,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { loadOrderedItemIds } from "./results";

/* ════════════════════════════════════════════════════════════════════
   NATIJANI ULASHISH — bitta oʻtkazish (sessiya) natijasi Telegram uchun.

   docs/natija-telegram-spec.md. Hisob BAZADAN (mijozdan emas): ball,
   xato savollar va sinf foizi saqlangan `responses` dan olinadi —
   sahnadagi raqamni brauzerda oʻzgartirib ota-onaga boshqa natija
   yuborib boʻlmaydi.

   Bir martalik: `tg_notify_log` (user, kind, sessiya) UNIQUE — ikki
   bosish yoki ikki tab bir xabarni ikki marta yubormaydi. Yuborish
   vaqtinchalik xatoda band qilish bekor qilinadi (qayta urinish mumkin).
   ════════════════════════════════════════════════════════════════════ */

export type StudentResult = {
  studentId: string;
  name: string;
  correct: number;
  total: number;
  /** Javobi notoʻgʻri yoki boʻsh savollar (1..N, varaq tartibi). */
  wrong: number[];
};

export type SessionShareData = {
  sessionId: string;
  title: string;
  className: string;
  subject: string;
  teacherName: string;
  questionCount: number;
  /** Berilgan javoblar ichida toʻgʻri foiz (0..100). */
  classAccuracy: number;
  students: StudentResult[];
  /** Eng qiyin savollar (aniqlik oʻsish tartibida, ≤3). */
  hardest: { no: number; stem: string; accuracy: number }[];
};

function stemOf(content: Record<string, unknown>): string {
  const raw = typeof content.stem === "string" ? content.stem : typeof content.title === "string" ? content.title : "";
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Oʻqituvchining OʻZ sessiyasi natijasi — boshqasiniki `null`. */
export async function sessionShareData(sessionId: string): Promise<SessionShareData | null> {
  const teacher = await requireTeacher();
  const [session] = await db
    .select({
      id: quizSessions.id,
      setId: quizSessions.setId,
      classId: quizSessions.classId,
      title: quizSessions.title,
    })
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, teacher.id)));
  if (!session) return null;

  const [set] = await db.select({ title: activitySets.title }).from(activitySets).where(eq(activitySets.id, session.setId));
  const [cls] = await db
    .select({ name: classes.name, subject: classes.subject })
    .from(classes)
    .where(eq(classes.id, session.classId));
  const [me] = await db.select({ name: teachers.name }).from(teachers).where(eq(teachers.id, teacher.id));

  // Ketma-ket (Supavisor: bitta amalda koʻp parallel soʻrov osilib qoladi).
  const itemIds = await loadOrderedItemIds(session.setId);
  const participants = await db
    .select({ id: sessionParticipants.id, studentId: sessionParticipants.studentId, name: sessionParticipants.displayName })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));
  const rows = await db
    .select({ participantId: responses.participantId, itemId: responses.itemId, isCorrect: responses.isCorrect })
    .from(responses)
    .where(eq(responses.sessionId, sessionId));
  const items = itemIds.length
    ? await db.select({ id: activityItems.id, content: activityItems.content }).from(activityItems).where(inArray(activityItems.id, itemIds))
    : [];

  const noOf = new Map(itemIds.map((id, i) => [id, i + 1]));
  const stemById = new Map(items.map((i) => [i.id, stemOf(i.content)]));
  const correctBy = new Map<string, Set<string>>();
  const answeredBy = new Map<string, Set<string>>();
  const perItem = new Map<string, { total: number; correct: number }>();
  for (const r of rows) {
    if (!noOf.has(r.itemId)) continue;
    const answered = answeredBy.get(r.participantId) ?? new Set<string>();
    answered.add(r.itemId);
    answeredBy.set(r.participantId, answered);
    const stat = perItem.get(r.itemId) ?? { total: 0, correct: 0 };
    stat.total++;
    if (r.isCorrect) {
      stat.correct++;
      const set = correctBy.get(r.participantId) ?? new Set<string>();
      set.add(r.itemId);
      correctBy.set(r.participantId, set);
    }
    perItem.set(r.itemId, stat);
  }

  const total = itemIds.length;
  // Bitta bola bir sessiyada bir marta — takror qator (qayta qoʻshilish) birlashadi.
  const byStudent = new Map<string, StudentResult>();
  for (const p of participants) {
    if (!p.studentId || !answeredBy.has(p.id)) continue;
    const correctSet = correctBy.get(p.id) ?? new Set<string>();
    const prev = byStudent.get(p.studentId);
    if (prev && prev.correct >= correctSet.size) continue;
    byStudent.set(p.studentId, {
      studentId: p.studentId,
      name: p.name,
      correct: correctSet.size,
      total,
      wrong: itemIds.filter((id) => !correctSet.has(id)).map((id) => noOf.get(id)!),
    });
  }

  let answers = 0;
  let correct = 0;
  for (const s of perItem.values()) {
    answers += s.total;
    correct += s.correct;
  }

  const hardest = [...perItem.entries()]
    .filter(([, s]) => s.total > 0)
    .map(([id, s]) => ({ no: noOf.get(id)!, stem: stemById.get(id) ?? "", accuracy: Math.round((s.correct / s.total) * 100) }))
    .filter((h) => h.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || a.no - b.no)
    .slice(0, 3);

  return {
    sessionId,
    title: session.title || set?.title || "Test",
    className: cls?.name ?? "",
    subject: cls?.subject ?? "",
    teacherName: me?.name ?? "",
    questionCount: total,
    classAccuracy: answers ? Math.round((correct / answers) * 100) : 0,
    students: [...byStudent.values()].sort((a, b) => b.correct - a.correct || a.name.localeCompare(b.name)),
    hardest,
  };
}

export type ShareKind = "test_summary" | "test_parents";

/** Yuborishni band qilish — `false`: allaqachon yuborilgan (yoki yuborilmoqda). */
export async function claimShare(kind: ShareKind, sessionId: string): Promise<string | null> {
  const teacher = await requireTeacher();
  const id = randomUUID();
  const claimed = await db
    .insert(tgNotifyLog)
    .values({ id, userId: teacher.id, kind, dateKey: sessionId })
    .onConflictDoNothing()
    .returning({ id: tgNotifyLog.id });
  return claimed.length ? id : null;
}

export async function finishShare(claimId: string, outcome: "sent" | "release", note?: string): Promise<void> {
  if (outcome === "release") {
    await db.delete(tgNotifyLog).where(eq(tgNotifyLog.id, claimId));
    return;
  }
  await db
    .update(tgNotifyLog)
    .set({ status: "sent", error: note ? note.slice(0, 300) : null })
    .where(eq(tgNotifyLog.id, claimId));
}

/** Shu sessiya natijasi qachon va kimga yuborilgan. */
export async function shareStatus(sessionId: string): Promise<Record<ShareKind, { at: string; note: string | null } | null>> {
  const teacher = await requireTeacher();
  const rows = await db
    .select({ kind: tgNotifyLog.kind, status: tgNotifyLog.status, at: tgNotifyLog.createdAt, note: tgNotifyLog.error })
    .from(tgNotifyLog)
    .where(
      and(
        eq(tgNotifyLog.userId, teacher.id),
        eq(tgNotifyLog.dateKey, sessionId),
        inArray(tgNotifyLog.kind, ["test_summary", "test_parents"]),
      ),
    );
  const out: Record<ShareKind, { at: string; note: string | null } | null> = { test_summary: null, test_parents: null };
  for (const r of rows) {
    if (r.status === "sent") out[r.kind as ShareKind] = { at: r.at.toISOString(), note: r.note };
  }
  return out;
}
