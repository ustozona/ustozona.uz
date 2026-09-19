import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { activities, classes, quizSessions, responses, sessionParticipants } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { taughtClassIds } from "@/server/workspace";
import { createSession, openSession, SessionStateError } from "./sessions";
import type { LiveResults, LiveSessionInfo } from "@/lib/live-session";

/* ════════════════════════════════════════════════════════════════════
   JONLI SESSIYA — oʻqituvchi tomoni (docs/taqdimot-spec.md, R284).

   Oʻqituvchi Doska'da taqdimotni boshqaradi; har oʻtish `current_index`
   ga, javob ochilishi `render_config.revealed` ga yoziladi. Oʻquvchi
   qurilmalari shu ikkisini soʻrab oladi (`dal/play/live.ts`).

   `render_config.liveTopic` — realtime kanal nomi, tasodifiy. U faqat
   shu yerdan oʻqituvchiga qaytadi; oʻquvchi tomonga hech qachon
   chiqmaydi (kanalda maʼlumot yoʻq, lekin baribir sir tutiladi).
   ════════════════════════════════════════════════════════════════════ */

type LiveConfig = { liveTopic?: string; revealed?: boolean; lockedActivityIds?: string[] };

async function loadOwnedLive(sessionId: string) {
  const teacher = await requireTeacher();
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, teacher.id)));
  if (!session) throw new SessionStateError("Sessiya topilmadi");
  return session;
}

/** Jonli sessiya ochadi: `mode = live`, darhol `running`, 0-qadamda. */
export async function startLiveSession(setId: string, classId: string): Promise<LiveSessionInfo> {
  const created = await createSession({ setId, classId, mode: "live" });
  const opened = await openSession(created.id);
  const liveTopic = `live-${randomBytes(16).toString("hex")}`;
  await db
    .update(quizSessions)
    .set({
      renderConfig: { ...opened.renderConfig, liveTopic, revealed: false },
      currentIndex: 0,
      updatedAt: new Date(),
    })
    .where(eq(quizSessions.id, opened.id));
  return { sessionId: opened.id, joinCode: opened.joinCode ?? "", topic: liveTopic };
}

/** Oʻqituvchi qadamni almashtirdi yoki javobni ochdi/yopdi.

    `activityId` — ochilgan savol. U `lockedActivityIds` ga yoziladi va
    «Yashirish» dan keyin ham qulf boʻlib qoladi: toʻgʻri javobni koʻrgan
    oʻquvchi keyin javob yuborib ball olmasin. */
export async function setLiveStep(
  sessionId: string,
  index: number,
  revealed: boolean,
  activityId?: string,
): Promise<void> {
  const session = await loadOwnedLive(sessionId);
  if (session.mode !== "live") throw new SessionStateError("Bu jonli sessiya emas");
  const config = session.renderConfig as LiveConfig;
  const locked = new Set(config.lockedActivityIds ?? []);
  if (revealed && activityId) locked.add(activityId);
  await db
    .update(quizSessions)
    .set({
      currentIndex: Math.max(0, index),
      renderConfig: { ...config, revealed, lockedActivityIds: [...locked] },
      updatedAt: new Date(),
    })
    .where(eq(quizSessions.id, sessionId));
}

/** Doska ekrani uchun jamlangan natija — ISMLARSIZ (proyektorga chiqadi). */
export async function liveResults(sessionId: string): Promise<LiveResults> {
  await loadOwnedLive(sessionId);

  const [participants, rows] = await Promise.all([
    db
      .select({ id: sessionParticipants.id })
      .from(sessionParticipants)
      .where(eq(sessionParticipants.sessionId, sessionId)),
    db
      .select({
        participantId: responses.participantId,
        activityId: responses.activityId,
        answer: responses.answer,
        isCorrect: responses.isCorrect,
        shape: activities.shape,
      })
      .from(responses)
      .innerJoin(activities, eq(activities.id, responses.activityId))
      .where(eq(responses.sessionId, sessionId))
      .orderBy(responses.answeredAt),
  ]);

  const items: LiveResults["items"] = {};
  // Moslashtirishda bitta ishtirokchi bir nechta element yuboradi —
  // «javob berdi» ishtirokchi boʻyicha sanaladi, element boʻyicha emas.
  const seen = new Map<string, Set<string>>();
  const allCorrect = new Map<string, Map<string, boolean>>();

  for (const row of rows) {
    const item = (items[row.activityId] ??= { answered: 0, correct: 0, byOption: {}, words: {}, texts: [] });
    const who = seen.get(row.activityId) ?? new Set<string>();
    seen.set(row.activityId, who);
    if (!who.has(row.participantId)) {
      who.add(row.participantId);
      item.answered++;
    }
    const verdicts = allCorrect.get(row.activityId) ?? new Map<string, boolean>();
    allCorrect.set(row.activityId, verdicts);
    verdicts.set(row.participantId, (verdicts.get(row.participantId) ?? true) && row.isCorrect === true);

    const answer = row.answer as { optionId?: string; optionIds?: string[]; text?: string };
    const chosen = answer.optionIds ?? (answer.optionId ? [answer.optionId] : []);
    for (const id of chosen) item.byOption[id] = (item.byOption[id] ?? 0) + 1;
    const text = typeof answer.text === "string" ? answer.text.trim() : "";
    if (text && row.shape === "wordcloud") {
      // «Toshkent» va «toshkent » bitta soʻz boʻlib sanaladi.
      const word = text.toLocaleLowerCase("uz");
      item.words[word] = (item.words[word] ?? 0) + 1;
    } else if (text && row.shape === "text") {
      // Oxirgi 60 tasi — doska hammasini sigʻdirmaydi.
      item.texts.push(text);
      if (item.texts.length > 60) item.texts.shift();
    }
  }
  for (const [activityId, verdicts] of allCorrect) {
    items[activityId].correct = [...verdicts.values()].filter(Boolean).length;
  }

  return { joined: participants.length, items };
}

/** Jonli sessiya uchun sinf tanlovi — oʻqituvchi dars beradigan, arxivlanmagan. */
export async function listLiveClasses(): Promise<{ id: string; name: string }[]> {
  const ids = await taughtClassIds();
  if (ids.length === 0) return [];
  return db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(and(inArray(classes.id, ids), isNull(classes.archivedAt)))
    .orderBy(classes.name);
}
