import "server-only";
import { count, countDistinct, gt, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user, session, teachers, classes, students } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → PLATFORMA STATISTIKASI (kross-tenant agregatlar).
   ════════════════════════════════════════════════════════════════════ */

export type AdminStats = {
  userCount: number;
  classCount: number;
  studentCount: number;
  /** Oxirgi 7 kunda sessiyasi yangilangan foydalanuvchilar. */
  activeUsers7d: number;
  /** Oxirgi 30 kun boʻyicha kunlik roʻyxatdan oʻtishlar (boʻsh kunlar 0). */
  signupsByDay: { day: string; n: number }[];
  planBreakdown: { plan: string; n: number }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    [{ userCount }],
    [{ classCount }],
    [{ studentCount }],
    [{ activeUsers7d }],
    signupRows,
    planRows,
  ] = await Promise.all([
    db.select({ userCount: count() }).from(user),
    db.select({ classCount: count() }).from(classes),
    db.select({ studentCount: count() }).from(students),
    db
      .select({ activeUsers7d: countDistinct(session.userId) })
      .from(session)
      .where(gt(session.updatedAt, since7)),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${user.createdAt}), 'YYYY-MM-DD')`,
        n: count(),
      })
      .from(user)
      .where(gt(user.createdAt, since30))
      .groupBy(sql`date_trunc('day', ${user.createdAt})`),
    db
      .select({ plan: teachers.plan, n: count() })
      .from(teachers)
      .groupBy(teachers.plan),
  ]);

  // Boʻsh kunlarni 0 bilan toʻldiramiz (grafik uzluksiz boʻlsin).
  const byDay = new Map(signupRows.map((r) => [r.day, r.n]));
  const signupsByDay: { day: string; n: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    signupsByDay.push({ day: key, n: byDay.get(key) ?? 0 });
  }

  return {
    userCount,
    classCount,
    studentCount,
    activeUsers7d,
    signupsByDay,
    planBreakdown: planRows.map((r) => ({ plan: r.plan, n: r.n })),
  };
}
