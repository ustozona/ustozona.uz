import "server-only";
import { eq, like, min } from "drizzle-orm";
import { db } from "@/server/db/client";
import { notifications, teachers, user } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   BILDIRISHNOMA YOZISH — server tomonidan yaratiladigan qoʻngʻiroqcha
   yozuvlari uchun yagona joy (admin → oʻqituvchi va oʻqituvchi → admin
   ikkala yoʻnalish ham).

   sortOrder mavjud eng kichigidan bittaga kam — roʻyxat boshiga tushadi.
   ════════════════════════════════════════════════════════════════════ */

export type NotifyEntry = {
  kind: string; // reply | feedback | status | system
  title: string;
  body?: string;
  href?: string;
  badgeLabel?: string;
  badgeClassName?: string;
};

export async function notifyTeacher(teacherId: string, entry: NotifyEntry): Promise<void> {
  await notifyTeachers([teacherId], entry);
}

export async function notifyTeachers(teacherIds: string[], entry: NotifyEntry): Promise<void> {
  const unique = [...new Set(teacherIds)];
  if (unique.length === 0) return;
  const createdAt = new Date().toISOString();

  for (const teacherId of unique) {
    const [{ lowest }] = await db
      .select({ lowest: min(notifications.sortOrder) })
      .from(notifications)
      .where(eq(notifications.teacherId, teacherId));
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      teacherId,
      kind: entry.kind,
      title: entry.title,
      body: entry.body ?? null,
      href: entry.href ?? null,
      badgeLabel: entry.badgeLabel ?? null,
      badgeClassName: entry.badgeClassName ?? null,
      read: false,
      createdAt,
      sortOrder: (lowest ?? 0) - 1,
    });
  }
}

/**
 * Super-adminlarga bildirishnoma. Adminlar ham oddiy oʻqituvchi
 * qobigʻidan foydalanadi, shuning uchun yozuv oʻsha qoʻngʻiroqchada
 * koʻrinadi. `teachers` qatori boʻlmagan admin (hali /dashboard'ga
 * kirmagan) tashlab ketiladi — FK buzilmasin.
 */
export async function notifyAdmins(entry: NotifyEntry, exceptTeacherId?: string): Promise<void> {
  const rows = await db
    .select({ id: teachers.id })
    .from(user)
    .innerJoin(teachers, eq(teachers.id, user.id))
    .where(like(user.role, "%super_admin%"));
  const ids = rows.map((r) => r.id).filter((id) => id !== exceptTeacherId);
  await notifyTeachers(ids, entry);
}
