import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activitySets, classes, quizSessions, type QuizSessionRow } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   SESSIYA HOLAT MASHINASI — docs/ost-loyihalar-arxitektura.md, B boʻlim.

   state: draft | scheduled | running | paused | completed (R1)
   `completed` QAYTARILADI — "sessiyani qayta ochish" haqiqiy ehtiyoj (R49).
   ════════════════════════════════════════════════════════════════════ */

export class SessionStateError extends Error {}

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // I/O/0/1 chiqarib tashlangan

function generateJoinCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

export async function getSession(id: string): Promise<QuizSessionRow | null> {
  const teacher = await requireTeacher();
  const [row] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, id), eq(quizSessions.teacherId, teacher.id)));
  return row ?? null;
}

export async function listSessionsBySet(setId: string): Promise<QuizSessionRow[]> {
  const teacher = await requireTeacher();
  return db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.setId, setId), eq(quizSessions.teacherId, teacher.id)));
}

async function loadOwnedSession(id: string, teacherId: string): Promise<QuizSessionRow> {
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, id), eq(quizSessions.teacherId, teacherId)));
  if (!session) throw new SessionStateError("Sessiya topilmadi");
  return session;
}

export type CreateSessionInput = {
  setId: string;
  classId: string;
  mode: "live" | "selfpaced" | "paper" | "qrcards" | "lecture";
  title?: string;
  scheduledAt?: Date;
};

export async function createSession(input: CreateSessionInput): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();

  /* EGALIK TEKSHIRUVI — `setId` va `classId` mijozdan keladi.

     Ilgari ular to'g'ridan-to'g'ri INSERT ga tushardi: `teacherId` o'z
     sessiyamizdan olingani uchun qator "bizniki" ko'rinardi, lekin
     ichida BEGONA to'plam yoki BEGONA sinf bo'lishi mumkin edi. Tashqi
     kalitlar buni ushlamaydi — ular qatorning MAVJUDLIGINI tekshiradi,
     EGASINI emas.

     Bu tekshiruv ayniqsa endi zarur: sinf oldin `set.classId` dan
     olinardi (ya'ni bilvosita cheklangan edi), endi esa o'qituvchi uni
     o'zi tanlaydi. Ruxsatni kengaytirganda tekshiruvni ham kuchaytirish
     kerak, aks holda "xohlagan sinfga" degan qulaylik "xohlagan
     ODAMNING sinfiga" ga aylanardi. */
  const [own] = await db
    .select({ id: activitySets.id })
    .from(activitySets)
    .where(and(eq(activitySets.id, input.setId), eq(activitySets.teacherId, teacher.id)))
    .limit(1);
  if (!own) throw new SessionStateError("Test topilmadi");

  const [ownClass] = await db
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, input.classId), eq(classes.teacherId, teacher.id)))
    .limit(1);
  if (!ownClass) throw new SessionStateError("Sinf topilmadi");

  const [row] = await db
    .insert(quizSessions)
    .values({
      id: randomUUID(),
      teacherId: teacher.id,
      setId: input.setId,
      classId: input.classId,
      mode: input.mode,
      title: input.title ?? null,
      state: input.scheduledAt ? "scheduled" : "draft",
      scheduledAt: input.scheduledAt ?? null,
      joinCode: generateJoinCode(),
    })
    .returning();
  return row;
}

/** draft | scheduled → running. `join_code` sessiya yopilgandan keyin ham
    SAQLANADI — oʻqituvchi shu bilan tanib oladi (R49), shuning uchun bu
    yerda qayta generatsiya qilinmaydi. */
export async function openSession(sessionId: string): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "draft" && session.state !== "scheduled") {
    throw new SessionStateError(`"${session.state}" holatidan ochib boʻlmaydi`);
  }
  const [row] = await db
    .update(quizSessions)
    .set({ state: "running", openedAt: session.openedAt ?? new Date(), updatedAt: new Date() })
    .where(eq(quizSessions.id, sessionId))
    .returning();
  return row;
}

export async function pauseSession(sessionId: string): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "running") {
    throw new SessionStateError("Faqat ishlayotgan sessiya toʻxtatiladi");
  }
  const [row] = await db
    .update(quizSessions)
    .set({ state: "paused", pausedAt: new Date(), updatedAt: new Date() })
    .where(eq(quizSessions.id, sessionId))
    .returning();
  return row;
}

export async function resumeSession(sessionId: string): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "paused") {
    throw new SessionStateError("Faqat toʻxtatilgan sessiya davom etadi");
  }
  const [row] = await db
    .update(quizSessions)
    .set({ state: "running", pausedAt: null, updatedAt: new Date() })
    .where(eq(quizSessions.id, sessionId))
    .returning();
  return row;
}

/** `completed` QAYTARILADI (R49) — running/paused/completed, barchasidan qayta ochiladi. */
export async function closeSession(sessionId: string): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "running" && session.state !== "paused") {
    throw new SessionStateError("Faqat ishlayotgan/toʻxtatilgan sessiya yopiladi");
  }
  const [row] = await db
    .update(quizSessions)
    .set({ state: "completed", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(quizSessions.id, sessionId))
    .returning();
  return row;
}

export async function reopenSession(sessionId: string): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "completed") {
    throw new SessionStateError("Faqat yopilgan sessiya qayta ochiladi");
  }
  const [row] = await db
    .update(quizSessions)
    .set({ state: "running", closedAt: null, updatedAt: new Date() })
    .where(eq(quizSessions.id, sessionId))
    .returning();
  return row;
}

/** `live`/`selfpaced` sessiya oʻrtasida almashadi (R106). */
export async function switchMode(
  sessionId: string,
  mode: CreateSessionInput["mode"],
  modeBoundary?: number
): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();
  await loadOwnedSession(sessionId, teacher.id);
  const [row] = await db
    .update(quizSessions)
    .set({ mode, modeBoundary: modeBoundary ?? null, updatedAt: new Date() })
    .where(eq(quizSessions.id, sessionId))
    .returning();
  return row;
}

export async function advanceIndex(sessionId: string, index: number): Promise<QuizSessionRow> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "running") {
    throw new SessionStateError("Faqat ishlayotgan sessiyada indeks siljiydi");
  }
  const [row] = await db
    .update(quizSessions)
    .set({ currentIndex: index, updatedAt: new Date() })
    .where(eq(quizSessions.id, sessionId))
    .returning();
  return row;
}
