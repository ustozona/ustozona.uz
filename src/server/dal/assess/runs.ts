import "server-only";
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  activityItems,
  activitySets,
  assignments,
  classes,
  quizSessions,
  responses,
  sessionParticipants,
  topics,
  type ActivitySetRow,
  type QuizSessionRow,
} from "@/server/db/schema";
import { ForbiddenError, requireTeacher } from "@/server/session";
import { assertTeachesClass } from "@/server/workspace";
import { activeClassRoster } from "@/server/dal/class-roster";
import { isSessionPastDue } from "@/lib/assess/session-due";
import { firstAttemptTotals, type AttemptRow } from "@/lib/assess/first-attempt";
import { findShell, shellAvailability } from "@/lib/baholash-shells";
import { isConfigured, isGamesConfigured } from "@/server/lessonlab/baholash";
import type {
  LaunchSetInfo,
  PublishRunResult,
  RunKind,
  RunMonitorData,
  RunRosterRow,
  RunStartKind,
  RunState,
  RunSummary,
} from "@/lib/launch-types";
import { closeSession, createSession, openSession, reopenSession } from "./sessions";
import { findPublishTarget, publishSessionToGrades } from "./publish";
import { getSet, summarizeSetContent } from "./sets";
import { gradedItemRows } from "./graded-items";

/* ════════════════════════════════════════════════════════════════════
   OʻTKAZISHLAR — Topshiriqlar oʻtkazish markazining server qatlami.
   docs/topshiriq-boshlash-markazi.md.

   Bu fayl YANGI mantiq qoʻshmaydi — mavjud yadroni (sessiya holat
   mashinasi, `publish.ts`, qogʻoz yoʻli) oʻqituvchi tiliga oʻgiradi:

     • `startRun`       — bitta bosishda sessiya: mustaqil / uyga / oʻyin
     • `listClassRuns`  — sinfning ochiq va natijasi kutilayotgan ishlari
     • `runMonitor`     — natija ekrani: kim qoʻshildi, kim tugatdi, necha %
     • `publishRun`     — «Jurnalga» (topshiriqqa biriktirilgan boʻlsa savolsiz)

   Maʼlumot modeli oʻzgarmadi (migratsiya yoʻq): usul va oʻyin
   `quiz_sessions.render_config` da (`launch`, `shellId`), muddat —
   `due_at` da.
   ════════════════════════════════════════════════════════════════════ */

/** «Hozir ochiq» roʻyxati qancha orqaga qaraydi. Undan eski yopilgan
    ishlar sahifani toʻldirmasin — ular allaqachon jurnalda. */
const RECENT_DAYS = 30;
/** Roʻyxatdagi eng koʻp qator — sinf sahifasi ogʻirlashmasin. */
const RECENT_LIMIT = 24;
/** Muddatsiz ochiq ish shundan keyin «eskirgan»: dars bir necha soat,
    ertasi kungacha ochiq qolgani — yopish esdan chiqqani (`stale`). */
const STALE_MS = 12 * 60 * 60 * 1000;

type LaunchConfig = { launch?: string; shellId?: string; liveTopic?: string };

/** `YYYY-MM-DD` → shu kunning oxiri, Toshkent vaqti (`startSessionAction` bilan bir xil). */
function endOfDayTashkent(dateKey: string): Date {
  return new Date(`${dateKey}T23:59:59.999+05:00`);
}

/** Sessiyadan ish turi HISOBLANADI — alohida ustun yoʻq. */
function kindOf(session: QuizSessionRow): RunKind {
  if (session.mode === "live") return "live";
  if (session.mode !== "selfpaced") return "offline";
  const config = session.renderConfig as LaunchConfig;
  if (config.shellId) return "game";
  if (session.dueAt) return "homework";
  return "selfpaced";
}

/** Muddatsiz ochiq ish 12 soatdan oshgan — dars tugagan, yopish esdan
    chiqqan. Muddati oʻtgan ish kabi: natija tayyor, «Jurnalga» uni oʻzi yopadi. */
function isStale(session: QuizSessionRow): boolean {
  return (
    session.state === "running" &&
    !session.dueAt &&
    session.mode !== "paper" &&
    Date.now() - (session.openedAt ?? session.createdAt).getTime() > STALE_MS
  );
}

function shellIdOf(session: QuizSessionRow): string | null {
  const shellId = (session.renderConfig as LaunchConfig).shellId;
  return typeof shellId === "string" && shellId ? shellId : null;
}

/** Toʻplamlarning baholanadigan savollari soni — bitta soʻrovda, hammasi uchun. */
async function gradedCountBySet(sets: ActivitySetRow[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const activityIds = [...new Set(sets.flatMap((s) => s.items.map((i) => i.activityId)))];
  if (activityIds.length === 0) {
    for (const s of sets) out.set(s.id, 0);
    return out;
  }
  const rows = await db
    .select({
      activityId: activityItems.activityId,
      count: sql<number>`count(*)::int`,
    })
    .from(activityItems)
    .innerJoin(activities, eq(activities.id, activityItems.activityId))
    .where(and(inArray(activityItems.activityId, activityIds), ne(activities.grading, "none")))
    .groupBy(activityItems.activityId);
  const byActivity = new Map(rows.map((r) => [r.activityId, Number(r.count)]));
  for (const s of sets) {
    out.set(
      s.id,
      s.items.reduce((sum, i) => sum + (byActivity.get(i.activityId) ?? 0), 0),
    );
  }
  return out;
}

function toSummary(
  session: QuizSessionRow,
  set: ActivitySetRow | undefined,
  extra: {
    rosterSize: number;
    joined: number;
    finished: number;
    gradedTotal: number;
    publishedAssignmentId: string | null;
  },
): RunSummary {
  return {
    sessionId: session.id,
    setId: session.setId,
    classId: session.classId,
    title: session.title ?? set?.title ?? "",
    kind: kindOf(session),
    shellId: shellIdOf(session),
    state: session.state as RunState,
    joinCode: session.joinCode,
    dueAt: session.dueAt ? session.dueAt.toISOString() : null,
    pastDue: isSessionPastDue(session),
    stale: isStale(session),
    createdAt: session.createdAt.toISOString(),
    rosterSize: extra.rosterSize,
    joined: extra.joined,
    finished: extra.finished,
    publishedAssignmentId: extra.publishedAssignmentId,
    gradable: set?.purpose === "summative" && extra.gradedTotal > 0,
  };
}

/* ════════════════════════════════════════════════════════════════════
   TEST PASPORTI — oʻtkazish oynasi
   ════════════════════════════════════════════════════════════════════ */

/** Tanlangan test haqida «Qanday oʻtkazamiz?» ekraniga kerakli hamma
    narsa — bitta soʻrovda. Oʻyin mosligi mijozda shu xulosadan
    hisoblanadi (`shellAvailability` — sof funksiya), serverda esa
    `startRun` da QAYTA tekshiriladi. */
export async function launchSetInfo(setId: string): Promise<LaunchSetInfo> {
  const set = await getSet(setId);
  if (!set) throw new ForbiddenError("Test topilmadi");
  const [content, graded] = await Promise.all([
    summarizeSetContent([set]).then((m) => m.get(set.id)),
    gradedCountBySet([set]),
  ]);
  const summary = content ?? { countByShape: {}, minOptions: null, maxOptions: null };
  return {
    setId: set.id,
    title: set.title,
    itemCount: set.items.length,
    gradedTotal: graded.get(set.id) ?? 0,
    purpose: set.purpose === "summative" ? "summative" : "formative",
    content: summary,
    mcqCount: summary.countByShape.mcq ?? 0,
    hasSlides: (summary.countByShape.slide ?? 0) > 0,
    engineReady: isConfigured(),
    gamesReady: isGamesConfigured(),
  };
}

/* ════════════════════════════════════════════════════════════════════
   BOSHLASH
   ════════════════════════════════════════════════════════════════════ */

export type StartRunInput = {
  setId: string;
  classId: string;
  kind: RunStartKind;
  /** `YYYY-MM-DD` — uy vazifasi (yoki uyga berilgan oʻyin) muddati. */
  dueDate?: string;
  /** Oʻyin qobigʻi — faqat `kind === "game"`. */
  shellId?: string;
};

/** Sessiya ochadi VA darhol ishga tushiradi (`running`) — bitta bosish. */
export async function startRun(input: StartRunInput): Promise<RunSummary> {
  const teacher = await requireTeacher();
  await assertTeachesClass(input.classId);
  const set = await getSet(input.setId);
  if (!set) throw new ForbiddenError("Test topilmadi");
  if (set.items.length === 0) throw new ForbiddenError("Testda hali savol yoʻq");

  if (input.kind === "homework" && !input.dueDate) {
    throw new ForbiddenError("Uy vazifasi uchun muddatni tanlang");
  }

  /* Oʻyin — qobiq kontentga MOS boʻlishi shart. Moslik mijozda ham
     koʻrsatiladi, lekin bu yerda QAYTA hisoblanadi: eskirgan ekrandan
     yoki qoʻlda yasalgan soʻrovdan mos kelmagan qobiq oʻtib ketsa,
     dars oʻrtasida buzilgan ekran chiqardi. */
  let shellId: string | undefined;
  if (input.kind === "game") {
    const shell = input.shellId ? findShell(input.shellId) : null;
    if (!shell) throw new ForbiddenError("Oʻyin topilmadi");
    const summary = (await summarizeSetContent([set])).get(set.id);
    const verdict = shellAvailability(
      shell,
      summary ?? { countByShape: {}, minOptions: null, maxOptions: null },
    );
    if (!verdict.ok) throw new ForbiddenError(verdict.reason);
    shellId = shell.id;
  }

  const dueAt = input.dueDate ? endOfDayTashkent(input.dueDate) : undefined;
  if (dueAt && dueAt.getTime() <= Date.now()) {
    throw new ForbiddenError("Muddat oʻtib ketgan kun tanlandi");
  }

  const created = await createSession({
    setId: set.id,
    classId: input.classId,
    mode: "selfpaced",
    title: set.title,
    dueAt,
  });
  const opened = await openSession(created.id);

  const launch = input.kind === "game" ? "game" : input.dueDate ? "homework" : "class";
  const [row] = await db
    .update(quizSessions)
    .set({
      renderConfig: { ...opened.renderConfig, launch, ...(shellId ? { shellId } : {}) },
      updatedAt: new Date(),
    })
    .where(and(eq(quizSessions.id, opened.id), eq(quizSessions.teacherId, teacher.id)))
    .returning();

  const roster = await activeClassRoster(input.classId);
  const gradedTotal = (await gradedCountBySet([set])).get(set.id) ?? 0;
  return toSummary(row ?? opened, set, {
    rosterSize: roster.length,
    joined: 0,
    finished: 0,
    gradedTotal,
    publishedAssignmentId: null,
  });
}

/* ════════════════════════════════════════════════════════════════════
   SINF ROʻYXATI
   ════════════════════════════════════════════════════════════════════ */

/** Sinfning yaqindagi ishlari — ochiq, yopilgan, jurnalga yozilgan. */
export async function listClassRuns(classId: string): Promise<RunSummary[]> {
  const teacher = await requireTeacher();
  await assertTeachesClass(classId);

  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
  const sessions = await db
    .select()
    .from(quizSessions)
    .where(
      and(
        eq(quizSessions.teacherId, teacher.id),
        eq(quizSessions.classId, classId),
        // Hech qachon ochilmagan qoralama sessiya — oʻqituvchi uchun yoʻq narsa.
        ne(quizSessions.state, "draft"),
        // Ochiq ish — qancha eski boʻlsa ham koʻrinadi (esdan chiqmasin);
        // yopilgani — faqat yaqinda yangilangan boʻlsa.
        or(ne(quizSessions.state, "completed"), gt(quizSessions.updatedAt, since)),
      ),
    )
    .orderBy(desc(quizSessions.createdAt))
    .limit(RECENT_LIMIT);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const setIds = [...new Set(sessions.map((s) => s.setId))];

  const [sets, roster, joinedRows, answeredRows, publishedRows] = await Promise.all([
    db
      .select()
      .from(activitySets)
      .where(and(inArray(activitySets.id, setIds), eq(activitySets.teacherId, teacher.id))),
    activeClassRoster(classId),
    db
      .select({
        sessionId: sessionParticipants.sessionId,
        joined: sql<number>`count(distinct ${sessionParticipants.studentId})::int`,
      })
      .from(sessionParticipants)
      .where(
        and(
          inArray(sessionParticipants.sessionId, sessionIds),
          isNotNull(sessionParticipants.studentId),
        ),
      )
      .groupBy(sessionParticipants.sessionId),
    /* Oʻquvchi boʻyicha nechta BAHOLANADIGAN savolga javob bergan —
       qurilma va urinishdan qatʼi nazar (`count distinct item`). Bu
       «tugatdi» sanogʻi uchun yetarli; foiz esa faqat natija ekranida
       (birinchi urinish qoidasi bilan) hisoblanadi. */
    db
      .select({
        sessionId: responses.sessionId,
        studentId: sessionParticipants.studentId,
        answered: sql<number>`count(distinct ${responses.itemId})::int`,
      })
      .from(responses)
      .innerJoin(sessionParticipants, eq(sessionParticipants.id, responses.participantId))
      .innerJoin(activities, eq(activities.id, responses.activityId))
      .where(
        and(
          inArray(responses.sessionId, sessionIds),
          isNotNull(sessionParticipants.studentId),
          ne(activities.grading, "none"),
        ),
      )
      .groupBy(responses.sessionId, sessionParticipants.studentId),
    db
      .select({ id: assignments.id, sourceSessionId: assignments.sourceSessionId })
      .from(assignments)
      .where(
        and(eq(assignments.teacherId, teacher.id), inArray(assignments.sourceSessionId, sessionIds)),
      ),
  ]);

  const setById = new Map(sets.map((s) => [s.id, s]));
  const gradedBySet = await gradedCountBySet(sets);
  const joinedBySession = new Map(joinedRows.map((r) => [r.sessionId, Number(r.joined)]));
  const publishedBySession = new Map(
    publishedRows
      .filter((r) => r.sourceSessionId)
      .map((r) => [r.sourceSessionId as string, r.id]),
  );

  const finishedBySession = new Map<string, number>();
  const sessionSet = new Map(sessions.map((s) => [s.id, s.setId]));
  for (const row of answeredRows) {
    const setId = sessionSet.get(row.sessionId);
    const total = setId ? (gradedBySet.get(setId) ?? 0) : 0;
    if (total > 0 && Number(row.answered) >= total) {
      finishedBySession.set(row.sessionId, (finishedBySession.get(row.sessionId) ?? 0) + 1);
    }
  }

  return sessions
    // Toʻplami oʻchirilgan sessiya (cascade oʻchiradi, lekin ehtiyot) — koʻrsatilmaydi.
    .filter((s) => setById.has(s.setId))
    .map((s) =>
      toSummary(s, setById.get(s.setId), {
        rosterSize: roster.length,
        joined: joinedBySession.get(s.id) ?? 0,
        finished: finishedBySession.get(s.id) ?? 0,
        gradedTotal: gradedBySet.get(s.setId) ?? 0,
        publishedAssignmentId: publishedBySession.get(s.id) ?? null,
      }),
    );
}

/* ════════════════════════════════════════════════════════════════════
   NATIJA EKRANI
   ════════════════════════════════════════════════════════════════════ */

async function loadOwnedSession(sessionId: string, teacherId: string): Promise<QuizSessionRow> {
  const [session] = await db
    .select()
    .from(quizSessions)
    .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.teacherId, teacherId)));
  if (!session) throw new ForbiddenError("Sessiya topilmadi");
  return session;
}

export async function runMonitor(sessionId: string): Promise<RunMonitorData> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  // Sinf roʻyxati (ismlar) koʻrsatiladi — oʻqituvchi hali shu darsni
  // oʻtadimi, tekshiriladi (koʻrinuvchanlik qoidasi, workspace.ts).
  await assertTeachesClass(session.classId);

  const set = await getSet(session.setId);
  if (!set) throw new ForbiddenError("Test topilmadi");
  const activityIds = set.items.map((i) => i.activityId);

  const [cls, gradedItems, roster, participants, responseRows, topicRows, pendingRows, target] =
    await Promise.all([
      db
        .select({ name: classes.name })
        .from(classes)
        .where(eq(classes.id, session.classId))
        .limit(1),
      gradedItemRows(activityIds),
      activeClassRoster(session.classId),
      db
        .select({ id: sessionParticipants.id, studentId: sessionParticipants.studentId })
        .from(sessionParticipants)
        .where(eq(sessionParticipants.sessionId, session.id)),
      db
        .select({
          participantId: responses.participantId,
          itemId: responses.itemId,
          attemptNo: responses.attemptNo,
          answeredAt: responses.answeredAt,
          score: responses.score,
          isCorrect: responses.isCorrect,
        })
        .from(responses)
        .where(eq(responses.sessionId, session.id)),
      db
        .select({ id: topics.id, name: topics.name, color: topics.color, purpose: topics.purpose })
        .from(topics)
        .where(and(eq(topics.classId, session.classId), eq(topics.teacherId, teacher.id)))
        .orderBy(asc(topics.sortOrder), asc(topics.createdAt)),
      /* Baholanmagan ochiq javoblar — ular jurnalga 0 boʻlib tushadi,
         shuning uchun «Jurnalga» dan OLDIN koʻrinishi kerak. */
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(responses)
        .innerJoin(activities, eq(activities.id, responses.activityId))
        .where(
          and(
            eq(responses.sessionId, session.id),
            eq(activities.shape, "text"),
            isNull(responses.score),
          ),
        ),
      findPublishTarget(teacher.id, session),
    ]);

  const gradedIds = new Set(gradedItems.map((i) => i.id));
  const gradedTotal = gradedItems.length;

  const studentOf = new Map<string, string>();
  let anonymous = 0;
  for (const p of participants) {
    if (p.studentId) studentOf.set(p.id, p.studentId);
    else anonymous += 1;
  }

  const attempts: AttemptRow[] = [];
  for (const r of responseRows) {
    const studentId = studentOf.get(r.participantId);
    if (!studentId || !gradedIds.has(r.itemId)) continue;
    attempts.push({
      studentId,
      itemId: r.itemId,
      attemptNo: r.attemptNo,
      answeredAt: r.answeredAt,
      score: r.score === null ? null : Number(r.score),
      isCorrect: r.isCorrect,
    });
  }
  const totals = firstAttemptTotals(attempts);
  const joinedIds = new Set(studentOf.values());

  const rowFor = (studentId: string, no: number, name: string): RunRosterRow => {
    const joined = joinedIds.has(studentId);
    const total = totals.get(studentId);
    const answered = total?.answered ?? 0;
    const status = !joined
      ? "waiting"
      : gradedTotal > 0 && answered >= gradedTotal
        ? "done"
        : "working";
    return {
      studentId,
      no,
      name,
      status,
      answered,
      percent:
        joined && gradedTotal > 0 ? Math.round(((total?.earned ?? 0) / gradedTotal) * 100) : null,
    };
  };

  const rows: RunRosterRow[] = roster.map((r, i) => rowFor(r.id, i + 1, r.name));
  /* Roʻyxatdan chiqib ketgan, lekin shu ishda qatnashgan bola ham
     koʻrinadi (`no = 0`) — jurnalga u ham yoziladi (publish.ts), ekran
     buni yashirsa «nega 29 ta baho?» degan savol chiqardi. */
  const onRoster = new Set(roster.map((r) => r.id));
  const leftIds = [...joinedIds].filter((id) => !onRoster.has(id));
  if (leftIds.length > 0) {
    const names = await db
      .select({ studentId: sessionParticipants.studentId, name: sessionParticipants.displayName })
      .from(sessionParticipants)
      .where(
        and(
          eq(sessionParticipants.sessionId, session.id),
          inArray(sessionParticipants.studentId, leftIds),
        ),
      );
    const nameOf = new Map(names.map((n) => [n.studentId as string, n.name]));
    for (const id of leftIds) rows.push(rowFor(id, 0, nameOf.get(id) ?? ""));
  }

  const published = target !== null && target.sourceSessionId === session.id;
  const summary = toSummary(session, set, {
    rosterSize: roster.length,
    joined: joinedIds.size,
    finished: rows.filter((r) => r.status === "done").length,
    gradedTotal,
    publishedAssignmentId: published ? target.id : null,
  });

  return {
    run: summary,
    className: cls[0]?.name ?? "",
    gradedTotal,
    roster: rows,
    anonymous,
    target: target
      ? {
          kind: "existing",
          assignmentId: target.id,
          title: target.title,
          topicId: target.topicId,
          published,
        }
      : { kind: "new" },
    topics: topicRows,
    canPublish:
      summary.gradable &&
      (session.state === "completed" ||
        summary.pastDue ||
        summary.stale ||
        session.mode === "paper"),
    openAnswersPending: Number(pendingRows[0]?.count ?? 0),
    engineReady: isConfigured(),
  };
}

/* ════════════════════════════════════════════════════════════════════
   YAKUNLASH · QAYTA OCHISH · JURNALGA
   ════════════════════════════════════════════════════════════════════ */

export async function closeRun(sessionId: string): Promise<void> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state === "completed") return; // ikki marta bosilsa — xato emas
  await closeSession(sessionId);
}

export async function reopenRun(sessionId: string): Promise<void> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "completed") return;
  if (isSessionPastDue(session)) {
    // Qayta ochilsa ham hech kim kira olmasdi — halol aytamiz.
    throw new ForbiddenError("Muddat oʻtgan — yangi muddat bilan qaytadan bering");
  }
  await reopenSession(sessionId);
}

/**
 * «Jurnalga yozish».
 *
 * `topicId`: `undefined` — test biriktirilgan ustunning oʻz toifasi
 * (savolsiz, bitta bosish); `null` — «Toifasiz»; aniq id — tanlangan.
 *
 * Yarim natija yozilmaydi: sessiya yakunlangan, muddati oʻtgan,
 * eskirgan (`isStale`) yoki qogʻoz (oʻqituvchi yigʻgan javoblar) boʻlishi
 * shart. Muddati oʻtgan yoki eskirgan ochiq sessiya avval yopiladi —
 * dars allaqachon tugagan, ochiq qoldirishdan foyda yoʻq.
 */
export async function publishRun(
  sessionId: string,
  topicId?: string | null,
): Promise<PublishRunResult> {
  const teacher = await requireTeacher();
  const session = await loadOwnedSession(sessionId, teacher.id);
  if (session.state !== "completed" && session.mode !== "paper") {
    if (!isSessionPastDue(session) && !isStale(session)) {
      throw new ForbiddenError("Avval testni tugating — keyin natija jurnalga yoziladi");
    }
    await closeSession(sessionId);
  }
  return publishSessionToGrades(sessionId, topicId);
}
