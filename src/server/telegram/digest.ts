import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, isNotNull, isNull, lte, notInArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  academicYears,
  classes,
  lessons,
  tasks,
  teachers,
  tgChats,
  tgNotifyLog,
  tgNotifyPrefs,
  timetableVersions,
  userTelegram,
} from "@/server/db/schema";
import { addDaysKey } from "@/lib/date-keys";
import { lessonSessions, type Lesson } from "@/lib/lessons-data";
import { subjectLabel } from "@/lib/standards-data";
import { buildDigest, type DigestClass, type DigestKind } from "@/lib/telegram-digest";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";
import type { Task } from "@/lib/tasks-data";
import type { TimetableVersion } from "@/lib/timetable-versions";
import { sendMessage } from "./api";

/* ════════════════════════════════════════════════════════════════════
   KUNLIK XABARLARNI YUBORISH — cron (`/api/cron/telegram`) chaqiradi

   Supabase `pg_cron` har 15 daqiqada endpoint'ni chaqiradi. Har chaqiruv:
     1. Toshkent vaqtini hisoblaydi (UTC+5, yozgi vaqt yoʻq)
     2. Vaqti kelgan va bugun hali xabar olmagan ustozlarni topadi
     3. Har biri uchun: jurnalga qator yozib BAND QILADI → maʼlumotni
        yuklaydi → xabar yasaydi → yuboradi

   «Vaqti keldi» = belgilangan vaqtdan keyin, lekin oynadan chiqmagan.
   Oyna bor, chunki cron bir-ikki marta oʻtkazib yuborilsa ham xabar
   kechikib borsin — lekin ertalabki xabar tushda kelmasin.

   ⚠️ KETMA-KET, parallel emas. Supavisor pool'idan bir vaqtda koʻp
   soʻrov ketsa javob yoʻqolib, soʻrov osilib qoladi (2026-09-21 prod
   hodisasi). Ustozlar birin-ketin, har birining soʻrovlari ham.

   ⚠️ SESSIYASIZ DAL. Bu yerda `requireTeacher()` yoʻq — chaqiruvchi
   odam emas, cron. Darvoza — `CRON_SECRET` (route'da). Har soʻrov
   `teacher_id` boʻyicha aniq filtrlangan; natija faqat oʻsha ustozning
   oʻz Telegramiga ketadi.
   ════════════════════════════════════════════════════════════════════ */

const TZ_OFFSET_MIN = 5 * 60; // Asia/Tashkent
const MORNING_WINDOW_MIN = 3 * 60;
const EVENING_LAST_MIN = 23 * 60 + 45;
/** Vercel funksiyasi tugashidan oldin toʻxtaymiz — qolganlar keyingi chaqiruvda. */
const TIME_BUDGET_MS = 45_000;

const SITE = (process.env.BETTER_AUTH_URL || "https://www.ustozona.uz").replace(/\/$/, "");

export function tashkentNow(now = new Date()): { todayKey: string; nowMin: number } {
  const t = new Date(now.getTime() + TZ_OFFSET_MIN * 60_000);
  const todayKey = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
  return { todayKey, nowMin: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

function hhmmToMin(v: string): number {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

type Due = { userId: string; chatId: string; kind: DigestKind; dateKey: string };

export type DigestRunResult = {
  todayKey: string;
  nowMin: number;
  due: number;
  sent: number;
  skipped: number;
  failed: number;
  deferred: number;
};

export async function runDigests(now = new Date()): Promise<DigestRunResult> {
  const started = Date.now();
  const { todayKey, nowMin } = tashkentNow(now);
  const tomorrowKey = addDaysKey(todayKey, 1);

  // Faqat oʻqituvchi (teachers qatori bor), bot bloklanmagan.
  const candidates = await db
    .select({
      userId: userTelegram.userId,
      chatId: tgChats.chatId,
      morningEnabled: tgNotifyPrefs.morningEnabled,
      morningTime: tgNotifyPrefs.morningTime,
      eveningEnabled: tgNotifyPrefs.eveningEnabled,
      eveningTime: tgNotifyPrefs.eveningTime,
    })
    .from(userTelegram)
    .innerJoin(tgChats, and(eq(tgChats.telegramId, userTelegram.telegramId), isNull(tgChats.blockedAt)))
    .innerJoin(teachers, eq(teachers.id, userTelegram.userId))
    .leftJoin(tgNotifyPrefs, eq(tgNotifyPrefs.userId, userTelegram.userId));

  const due: Due[] = [];
  for (const c of candidates) {
    // Sozlama qatori yoʻq — standart (ikkalasi yoqilgan, 07:00 / 20:00).
    const mOn = c.morningEnabled ?? true;
    const mAt = hhmmToMin(c.morningTime ?? "07:00");
    const eOn = c.eveningEnabled ?? true;
    const eAt = hhmmToMin(c.eveningTime ?? "20:00");
    if (mOn && nowMin >= mAt && nowMin < mAt + MORNING_WINDOW_MIN) {
      due.push({ userId: c.userId, chatId: c.chatId, kind: "morning", dateKey: todayKey });
    }
    if (eOn && nowMin >= eAt && nowMin <= EVENING_LAST_MIN) {
      due.push({ userId: c.userId, chatId: c.chatId, kind: "evening", dateKey: tomorrowKey });
    }
  }

  const result: DigestRunResult = {
    todayKey, nowMin, due: 0, sent: 0, skipped: 0, failed: 0, deferred: 0,
  };
  if (!due.length) return result;

  // Bugun allaqachon ishlanganlar — bitta soʻrov bilan chetlanadi.
  const done = await db
    .select({ userId: tgNotifyLog.userId, kind: tgNotifyLog.kind, dateKey: tgNotifyLog.dateKey })
    .from(tgNotifyLog)
    .where(inArray(tgNotifyLog.dateKey, [todayKey, tomorrowKey]));
  const doneSet = new Set(done.map((d) => `${d.userId}|${d.kind}|${d.dateKey}`));
  const pending = due.filter((d) => !doneSet.has(`${d.userId}|${d.kind}|${d.dateKey}`));
  result.due = pending.length;

  for (const item of pending) {
    if (Date.now() - started > TIME_BUDGET_MS) {
      result.deferred++;
      continue;
    }
    const outcome = await processOne(item, todayKey, nowMin);
    result[outcome]++;
  }
  return result;
}

async function processOne(
  item: Due,
  todayKey: string,
  nowMin: number
): Promise<"sent" | "skipped" | "failed" | "deferred"> {
  // BAND QILISH — ikki parallel cron bitta xabarni ikki marta yubormasin.
  const logId = randomUUID();
  const claimed = await db
    .insert(tgNotifyLog)
    .values({ id: logId, userId: item.userId, kind: item.kind, dateKey: item.dateKey })
    .onConflictDoNothing()
    .returning({ id: tgNotifyLog.id });
  if (!claimed.length) return "skipped";

  let message;
  try {
    const data = await loadTeacherData(item.userId, item.dateKey);
    message = buildDigest({ kind: item.kind, todayKey, nowMin, siteUrl: SITE, ...data });
  } catch (err) {
    console.error("[tg-digest] maʼlumot yuklanmadi:", item.userId, err);
    // Qayta urinish uchun band qilish bekor qilinadi.
    await db.delete(tgNotifyLog).where(eq(tgNotifyLog.id, logId));
    return "deferred";
  }

  if (!message) {
    await db.update(tgNotifyLog).set({ status: "skipped" }).where(eq(tgNotifyLog.id, logId));
    return "skipped";
  }

  const res = await sendMessage(item.chatId, message.text, {
    inline_keyboard: [message.buttons.map((b) => ({ text: b.text, url: b.url }))],
  });

  if (res.ok) {
    await db.update(tgNotifyLog).set({ status: "sent" }).where(eq(tgNotifyLog.id, logId));
    return "sent";
  }

  // 403 — bot bloklangan / suhbat oʻchirilgan: keyingi safar urinilmaydi.
  if (res.status === 403) {
    await db
      .update(tgChats)
      .set({ blockedAt: new Date(), updatedAt: new Date() })
      .where(eq(tgChats.chatId, item.chatId));
  }
  // 429 / tarmoq / 5xx — vaqtinchalik: band qilish bekor, keyingi chaqiruvda qayta.
  if (res.status === 0 || res.status === 429 || res.status >= 500) {
    await db.delete(tgNotifyLog).where(eq(tgNotifyLog.id, logId));
    return "deferred";
  }
  await db
    .update(tgNotifyLog)
    .set({ status: "failed", error: `${res.status} ${res.description}`.slice(0, 300) })
    .where(eq(tgNotifyLog.id, logId));
  return "failed";
}

/** Botdagi `/bugun` va `/ertaga` — xuddi shu xabar, soʻralgan paytda.
    Jurnalga yozilmaydi: kunlik xabarga taʼsir qilmaydi. */
export async function digestNow(userId: string, kind: DigestKind) {
  const { todayKey, nowMin } = tashkentNow();
  const targetKey = kind === "evening" ? addDaysKey(todayKey, 1) : todayKey;
  const data = await loadTeacherData(userId, targetKey);
  return buildDigest({ kind, todayKey, nowMin, siteUrl: SITE, ...data });
}

/** Bitta ustozning xabar uchun kerakli maʼlumoti. Soʻrovlar KETMA-KET. */
async function loadTeacherData(teacherId: string, targetKey: string) {
  const versionRows = await db
    .select()
    .from(timetableVersions)
    .where(eq(timetableVersions.teacherId, teacherId))
    .orderBy(asc(timetableVersions.effectiveFrom));
  const versions: TimetableVersion[] = versionRows.map((v) => ({
    id: v.id,
    effectiveFrom: v.effectiveFrom,
    events: v.events as TimetableVersion["events"],
    bellConfig: v.bellConfig as unknown as TimetableVersion["bellConfig"],
    createdAt: v.createdAt,
  }));

  // Dars matni (`content`) katta va bu yerda kerak emas — bazaning oʻzida kesiladi.
  // `lessonPlanState` faqat `planReady`/`planStatus` ga qaraydi, matn yoʻq boʻlsa «none».
  const lessonRows = await db
    .select({ data: sql<Record<string, unknown>>`${lessons.data} - 'content'` })
    .from(lessons)
    .where(eq(lessons.teacherId, teacherId));
  const lessonList = lessonRows.map((r) => r.data as unknown as Lesson);

  const [year] = await db
    .select({ data: academicYears.data })
    .from(academicYears)
    .where(and(eq(academicYears.teacherId, teacherId), eq(academicYears.isActive, true)))
    .limit(1);
  const calendar = (year?.data as unknown as AcademicYearCalendar | undefined) ?? null;

  const taskRows = await db
    .select({ data: tasks.data })
    .from(tasks)
    .where(
      and(
        eq(tasks.teacherId, teacherId),
        notInArray(tasks.status, ["done", "canceled"]),
        isNotNull(tasks.dueDate),
        lte(tasks.dueDate, targetKey)
      )
    );
  const taskList = taskRows.map((r) => r.data as unknown as Task);

  // Kerakli sinflar — jadval va sessiyalarda uchraganlari; arxivlanganlar tashlanadi.
  const classIds = new Set<string>();
  for (const v of versions) for (const e of v.events) classIds.add(e.classId);
  for (const l of lessonList) for (const s of lessonSessions(l)) classIds.add(s.classId);
  const classMap = new Map<string, DigestClass>();
  if (classIds.size) {
    const rows = await db
      .select({ id: classes.id, name: classes.name, subject: classes.subject })
      .from(classes)
      .where(and(inArray(classes.id, [...classIds]), isNull(classes.archivedAt)));
    for (const c of rows) {
      classMap.set(c.id, { name: c.name, subject: c.subject ? subjectLabel(c.subject) : "" });
    }
  }

  return { versions, lessons: lessonList, calendar, tasks: taskList, classes: classMap };
}
