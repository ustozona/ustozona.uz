import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  behaviorAutoSettings,
  behaviorDeletions,
  behaviorEvents,
  behaviorRedemptions,
  behaviorRewards,
  behaviorSkills,
  classes,
  students,
  type BehaviorAutoSettingsRow,
  type BehaviorDeletionRow,
  type BehaviorEventRow,
  type BehaviorRedemptionRow,
  type BehaviorRewardRow,
  type BehaviorSkillRow,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { visibleClassIds, visibleStudentIds } from "@/server/workspace";
import {
  DEFAULT_REWARD_DEFS,
  DEFAULT_SKILL_DEFS,
  defaultAutoSettings,
  defaultRewardId,
  defaultSkillId,
  todayDateKey,
  type BehaviorAutoSettings,
  type BehaviorAutoSource,
  type BehaviorDeletionLogEntry,
  type BehaviorEvent,
  type BehaviorRedemption,
  type BehaviorReward,
  type BehaviorSkill,
} from "@/lib/behavior-data";
import type { BehaviorBatch } from "@/lib/sync/behavior-batch";

/* ════════════════════════════════════════════════════════════════════
   BEHAVIOR DAL — useBehaviorStore'ning server tomoni.

   Oʻqish: 4 jadval parallel → frontend {skills, rewards, eventsByClass,
   redemptions} shakli. 4 jadval ham boʻsh boʻlsa defaultlar SERVER-SIDE
   seed qilinadi (deterministik id + onConflictDoNothing) — attendance
   mergeStatuses tryuki bu yerda ishlamaydi, chunki roʻyxat tahrirlanadi
   (qoʻshish/oʻchirish mumkin).

   Yozish: attendance DAL qoidalari — tranzaksiyasiz (neon-http),
   idempotent upsert, PK global id boʻlgani uchun setWhere teacher
   egaligini himoya qiladi; events/redemptions uchun class/student
   egaligi oldindan filtrlash.
   ════════════════════════════════════════════════════════════════════ */

const CHUNK = 400;

function chunks<T>(rows: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += CHUNK) out.push(rows.slice(i, i + CHUNK));
  return out;
}

function rowToSkill(r: BehaviorSkillRow): BehaviorSkill {
  return {
    id: r.id,
    name: r.name,
    emoji: r.emoji,
    points: r.points,
    ...(r.description ? { description: r.description } : {}),
  };
}

function rowToEvent(r: BehaviorEventRow): BehaviorEvent {
  return {
    id: r.id,
    studentId: r.studentId,
    ...(r.skillId ? { skillId: r.skillId } : {}),
    name: r.name,
    emoji: r.emoji,
    ...(r.description ? { description: r.description } : {}),
    points: r.points,
    date: r.date,
    createdAt: r.createdAt,
    ...(r.note ? { note: r.note } : {}),
    ...(r.groupId ? { groupId: r.groupId } : {}),
    ...(r.source ? { source: r.source as BehaviorAutoSource } : {}),
  };
}

function rowToAutoSettings(r: BehaviorAutoSettingsRow): BehaviorAutoSettings {
  return {
    attendanceEnabled: r.attendanceEnabled,
    lateEnabled: r.lateEnabled,
    latePoints: r.latePoints,
    absentEnabled: r.absentEnabled,
    absentPoints: r.absentPoints,
    presentEnabled: r.presentEnabled,
    presentPoints: r.presentPoints,
    streakEnabled: r.streakEnabled,
    streakN: r.streakN,
    streakBonus: r.streakBonus,
    attendanceSince: r.attendanceSince,
    journalEnabled: r.journalEnabled,
    gradedEnabled: r.gradedEnabled,
    gradedPoints: r.gradedPoints,
    missedDueEnabled: r.missedDueEnabled,
    missedDuePoints: r.missedDuePoints,
    journalSince: r.journalSince,
  };
}

function rowToReward(r: BehaviorRewardRow): BehaviorReward {
  return { id: r.id, name: r.name, emoji: r.emoji, cost: r.cost };
}

function rowToRedemption(r: BehaviorRedemptionRow): BehaviorRedemption {
  return {
    id: r.id,
    classId: r.classId,
    studentId: r.studentId,
    ...(r.rewardId ? { rewardId: r.rewardId } : {}),
    name: r.name,
    emoji: r.emoji,
    cost: r.cost,
    date: r.date,
    createdAt: r.createdAt,
  };
}

function rowToDeletion(r: BehaviorDeletionRow): BehaviorDeletionLogEntry {
  return {
    id: r.id,
    classId: r.classId,
    studentId: r.studentId,
    eventId: r.eventId,
    name: r.name,
    emoji: r.emoji,
    points: r.points,
    date: r.date,
    ...(r.reason ? { reason: r.reason } : {}),
    deletedAt: r.deletedAt,
  };
}

export type BehaviorPayload = {
  skills: BehaviorSkill[];
  rewards: BehaviorReward[];
  eventsByClass: Record<string, BehaviorEvent[]>;
  redemptions: BehaviorRedemption[];
  deletions: BehaviorDeletionLogEntry[];
  autoSettings: BehaviorAutoSettings;
};

async function seedDefaults(tid: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(behaviorSkills)
    .values(
      DEFAULT_SKILL_DEFS.map((s, i) => ({
        id: defaultSkillId(s.slug, tid),
        teacherId: tid,
        name: s.name,
        emoji: s.emoji,
        points: s.points,
        description: s.description ?? null,
        sortOrder: i,
        updatedAt: now,
      }))
    )
    .onConflictDoNothing();
  await db
    .insert(behaviorRewards)
    .values(
      DEFAULT_REWARD_DEFS.map((r, i) => ({
        id: defaultRewardId(r.slug, tid),
        teacherId: tid,
        name: r.name,
        emoji: r.emoji,
        cost: r.cost,
        sortOrder: i,
        updatedAt: now,
      }))
    )
    .onConflictDoNothing();
}

export async function getBehaviorPayload(): Promise<BehaviorPayload> {
  const teacher = await requireTeacher();
  const tid = teacher.id;

  let [skillRows, rewardRows, eventRows, redemptionRows, deletionRows, autoRows] = await Promise.all([
    db
      .select()
      .from(behaviorSkills)
      .where(eq(behaviorSkills.teacherId, tid))
      .orderBy(asc(behaviorSkills.sortOrder)),
    db
      .select()
      .from(behaviorRewards)
      .where(eq(behaviorRewards.teacherId, tid))
      .orderBy(asc(behaviorRewards.sortOrder)),
    db.select().from(behaviorEvents).where(eq(behaviorEvents.teacherId, tid)),
    db
      .select()
      .from(behaviorRedemptions)
      .where(eq(behaviorRedemptions.teacherId, tid)),
    db
      .select()
      .from(behaviorDeletions)
      .where(eq(behaviorDeletions.teacherId, tid)),
    db
      .select()
      .from(behaviorAutoSettings)
      .where(eq(behaviorAutoSettings.teacherId, tid)),
  ]);

  // Avto-sozlama qatori yoʻq — defaultlar bilan seed (sinceDate = bugun:
  // mavjud maʼlumotli userga ham langar deploy kunidan tushadi).
  if (autoRows.length === 0) {
    const seeded = defaultAutoSettings(todayDateKey());
    await db
      .insert(behaviorAutoSettings)
      .values({ teacherId: tid, ...seeded, updatedAt: new Date().toISOString() })
      .onConflictDoNothing();
    autoRows = await db
      .select()
      .from(behaviorAutoSettings)
      .where(eq(behaviorAutoSettings.teacherId, tid));
  }

  // Yangi oʻqituvchi: 4 jadval ham boʻsh — defaultlarni serverda yaratamiz.
  if (
    skillRows.length === 0 &&
    rewardRows.length === 0 &&
    eventRows.length === 0 &&
    redemptionRows.length === 0
  ) {
    await seedDefaults(tid);
    [skillRows, rewardRows] = await Promise.all([
      db
        .select()
        .from(behaviorSkills)
        .where(eq(behaviorSkills.teacherId, tid))
        .orderBy(asc(behaviorSkills.sortOrder)),
      db
        .select()
        .from(behaviorRewards)
        .where(eq(behaviorRewards.teacherId, tid))
        .orderBy(asc(behaviorRewards.sortOrder)),
    ]);
  }

  const eventsByClass: Record<string, BehaviorEvent[]> = {};
  for (const r of eventRows) {
    (eventsByClass[r.classId] ??= []).push(rowToEvent(r));
  }
  // Append-only tartib deterministik boʻlsin (createdAt boʻyicha).
  for (const arr of Object.values(eventsByClass)) {
    arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return {
    skills: skillRows.map(rowToSkill),
    rewards: rewardRows.map(rowToReward),
    eventsByClass,
    redemptions: redemptionRows
      .map(rowToRedemption)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    deletions: deletionRows
      .map(rowToDeletion)
      .sort((a, b) => a.deletedAt.localeCompare(b.deletedAt)),
    autoSettings: autoRows[0]
      ? rowToAutoSettings(autoRows[0])
      : defaultAutoSettings(todayDateKey()),
  };
}

export async function applyBehaviorBatch(batch: BehaviorBatch): Promise<void> {
  const teacher = await requireTeacher();
  const tid = teacher.id;
  const now = new Date().toISOString();

  /* 1. Koʻnikmalar — PK global id, setWhere begona qatorni himoya qiladi. */
  for (const part of chunks(batch.skillsUpsert)) {
    await db
      .insert(behaviorSkills)
      .values(
        part.map((s) => ({
          id: s.id,
          teacherId: tid,
          name: s.name,
          emoji: s.emoji,
          points: s.points,
          description: s.description,
          sortOrder: s.sortOrder,
          updatedAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: behaviorSkills.id,
        set: {
          name: sql`excluded.name`,
          emoji: sql`excluded.emoji`,
          points: sql`excluded.points`,
          description: sql`excluded.description`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(behaviorSkills.teacherId, tid),
      });
  }
  if (batch.skillsDelete.length > 0) {
    await db
      .delete(behaviorSkills)
      .where(
        and(eq(behaviorSkills.teacherId, tid), inArray(behaviorSkills.id, batch.skillsDelete))
      );
  }

  /* 2. Mukofotlar. */
  for (const part of chunks(batch.rewardsUpsert)) {
    await db
      .insert(behaviorRewards)
      .values(
        part.map((r) => ({
          id: r.id,
          teacherId: tid,
          name: r.name,
          emoji: r.emoji,
          cost: r.cost,
          sortOrder: r.sortOrder,
          updatedAt: now,
        }))
      )
      .onConflictDoUpdate({
        target: behaviorRewards.id,
        set: {
          name: sql`excluded.name`,
          emoji: sql`excluded.emoji`,
          cost: sql`excluded.cost`,
          sortOrder: sql`excluded.sort_order`,
          updatedAt: now,
        },
        setWhere: eq(behaviorRewards.teacherId, tid),
      });
  }
  if (batch.rewardsDelete.length > 0) {
    await db
      .delete(behaviorRewards)
      .where(
        and(eq(behaviorRewards.teacherId, tid), inArray(behaviorRewards.id, batch.rewardsDelete))
      );
  }

  /* 3. Sinf va oʻquvchi egaligi (events + redemptions uchun umumiy). */
  const needsOwnership =
    batch.eventsUpsert.length > 0 ||
    batch.redemptionsUpsert.length > 0 ||
    batch.deletionsInsert.length > 0;
  let ownClasses = new Set<string>();
  let ownStudents = new Set<string>();
  if (needsOwnership) {
    const [classIds, studentIds] = await Promise.all([
      visibleClassIds("data"),
      visibleStudentIds("data"),
    ]);
    ownClasses = new Set(classIds);
    ownStudents = new Set(studentIds);
  }

  /* 4. Eventlar (append-only ledger; upsert — izoh tahriri uchun ham). */
  const eventUpserts = batch.eventsUpsert.filter(
    (e) => ownClasses.has(e.classId) && ownStudents.has(e.studentId)
  );
  for (const part of chunks(eventUpserts)) {
    await db
      .insert(behaviorEvents)
      .values(
        part.map((e) => ({
          id: e.id,
          teacherId: tid,
          classId: e.classId,
          studentId: e.studentId,
          skillId: e.skillId,
          name: e.name,
          emoji: e.emoji,
          points: e.points,
          description: e.description,
          note: e.note,
          date: e.date,
          createdAt: e.createdAt,
          groupId: e.groupId,
          source: e.source,
        }))
      )
      .onConflictDoUpdate({
        target: behaviorEvents.id,
        set: {
          name: sql`excluded.name`,
          emoji: sql`excluded.emoji`,
          points: sql`excluded.points`,
          description: sql`excluded.description`,
          note: sql`excluded.note`,
          date: sql`excluded.date`,
          source: sql`excluded.source`,
        },
        setWhere: eq(behaviorEvents.teacherId, tid),
      });
  }
  for (const part of chunks(batch.eventsDelete)) {
    await db
      .delete(behaviorEvents)
      .where(and(eq(behaviorEvents.teacherId, tid), inArray(behaviorEvents.id, part)));
  }

  /* 5. Sarflashlar. */
  const redemptionUpserts = batch.redemptionsUpsert.filter(
    (r) => ownClasses.has(r.classId) && ownStudents.has(r.studentId)
  );
  for (const part of chunks(redemptionUpserts)) {
    await db
      .insert(behaviorRedemptions)
      .values(
        part.map((r) => ({
          id: r.id,
          teacherId: tid,
          classId: r.classId,
          studentId: r.studentId,
          rewardId: r.rewardId,
          name: r.name,
          emoji: r.emoji,
          cost: r.cost,
          date: r.date,
          createdAt: r.createdAt,
        }))
      )
      .onConflictDoUpdate({
        target: behaviorRedemptions.id,
        set: {
          name: sql`excluded.name`,
          emoji: sql`excluded.emoji`,
          cost: sql`excluded.cost`,
          date: sql`excluded.date`,
        },
        setWhere: eq(behaviorRedemptions.teacherId, tid),
      });
  }
  for (const part of chunks(batch.redemptionsDelete)) {
    await db
      .delete(behaviorRedemptions)
      .where(
        and(eq(behaviorRedemptions.teacherId, tid), inArray(behaviorRedemptions.id, part))
      );
  }

  /* 6. Oʻchirish jurnali — append-only, faqat insert (retry'da DoNothing). */
  const deletionInserts = batch.deletionsInsert.filter(
    (d) => ownClasses.has(d.classId) && ownStudents.has(d.studentId)
  );
  for (const part of chunks(deletionInserts)) {
    await db
      .insert(behaviorDeletions)
      .values(
        part.map((d) => ({
          id: d.id,
          teacherId: tid,
          classId: d.classId,
          studentId: d.studentId,
          eventId: d.eventId,
          name: d.name,
          emoji: d.emoji,
          points: d.points,
          date: d.date,
          reason: d.reason,
          deletedAt: d.deletedAt,
        }))
      )
      .onConflictDoNothing();
  }

  /* 7. Avtomatik ball sozlamalari — per-teacher bitta qator. */
  const autoUpsert = batch.autoSettingsUpsert[0];
  if (autoUpsert) {
    await db
      .insert(behaviorAutoSettings)
      .values({ teacherId: tid, ...autoUpsert, updatedAt: now })
      .onConflictDoUpdate({
        target: behaviorAutoSettings.teacherId,
        set: {
          attendanceEnabled: sql`excluded.attendance_enabled`,
          lateEnabled: sql`excluded.late_enabled`,
          latePoints: sql`excluded.late_points`,
          absentEnabled: sql`excluded.absent_enabled`,
          absentPoints: sql`excluded.absent_points`,
          presentEnabled: sql`excluded.present_enabled`,
          presentPoints: sql`excluded.present_points`,
          streakEnabled: sql`excluded.streak_enabled`,
          streakN: sql`excluded.streak_n`,
          streakBonus: sql`excluded.streak_bonus`,
          attendanceSince: sql`excluded.attendance_since`,
          journalEnabled: sql`excluded.journal_enabled`,
          gradedEnabled: sql`excluded.graded_enabled`,
          gradedPoints: sql`excluded.graded_points`,
          missedDueEnabled: sql`excluded.missed_due_enabled`,
          missedDuePoints: sql`excluded.missed_due_points`,
          journalSince: sql`excluded.journal_since`,
          updatedAt: now,
        },
      });
  }
}
