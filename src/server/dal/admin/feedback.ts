import "server-only";
import { and, desc, eq, min, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { feedback, notifications, teachers } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";
import { writeAuditLog } from "./audit";
import type {
  FeedbackItem,
  FeedbackReply,
  FeedbackStatus,
} from "@/store/useFeedbackStore";

/* ════════════════════════════════════════════════════════════════════
   ADMIN → FIKRLAR MARKAZI — barcha oʻqituvchilar feedback'i bir joyda.

   MAʼLUM POYGA (v1'da qabul qilingan): oʻqituvchining client-store'i
   butun FeedbackItem hujjatini upsert qiladi — admin javob yozgach,
   oʻqituvchi eski holatni saqlab yuborsa javob yoʻqolishi mumkin.
   Yechim (server-side merge on upsert) keyingi bosqichga.
   ════════════════════════════════════════════════════════════════════ */

export type AdminFeedbackItem = {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  teacherAvatarUrl: string | null;
  status: string;
  category: string;
  updatedAt: Date;
  item: FeedbackItem;
};

export async function listAllFeedback(params: {
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: AdminFeedbackItem[]; total: number; page: number; pageSize: number }> {
  await requireAdmin();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));

  const conditions: SQL[] = [];
  if (params.status) conditions.push(eq(feedback.status, params.status));
  if (params.category) conditions.push(eq(feedback.category, params.category));
  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, total] = await Promise.all([
    db
      .select({
        id: feedback.id,
        teacherId: feedback.teacherId,
        teacherName: teachers.name,
        teacherEmail: teachers.email,
        teacherAvatarUrl: teachers.avatarUrl,
        status: feedback.status,
        category: feedback.category,
        updatedAt: feedback.updatedAt,
        data: feedback.data,
      })
      .from(feedback)
      .innerJoin(teachers, eq(teachers.id, feedback.teacherId))
      .where(where)
      .orderBy(desc(feedback.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.$count(feedback, where),
  ]);

  return {
    items: rows.map((r) => ({
      ...r,
      item: r.data as unknown as FeedbackItem,
    })),
    total,
    page,
    pageSize,
  };
}

/** Oʻqituvchiga qoʻngʻiroqcha bildirishnomasi (roʻyxat boshiga). */
async function notifyTeacher(
  teacherId: string,
  entry: { kind: string; title: string; body?: string },
): Promise<void> {
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
    href: "/dashboard/feedback",
    read: false,
    createdAt: new Date().toISOString(),
    sortOrder: (lowest ?? 0) - 1,
  });
}

export async function replyToFeedbackAsTeam(
  feedbackId: string,
  body: string,
): Promise<void> {
  const { actor } = await requireAdmin();

  const [row] = await db.select().from(feedback).where(eq(feedback.id, feedbackId));
  if (!row) throw new Error("Fikr topilmadi");

  const item = row.data as unknown as FeedbackItem;
  const reply: FeedbackReply = {
    id: crypto.randomUUID(),
    author: "Ustozona jamoasi",
    isOfficial: true,
    body,
    createdAt: new Date().toISOString(),
  };
  const nextItem: FeedbackItem = {
    ...item,
    replies: [...(item.replies ?? []), reply],
  };

  await db
    .update(feedback)
    .set({ data: nextItem as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(feedback.id, feedbackId));

  await notifyTeacher(row.teacherId, {
    kind: "reply",
    title: "Fikringizga Ustozona jamoasi javob berdi",
    body: body.length > 120 ? `${body.slice(0, 117)}…` : body,
  });

  await writeAuditLog(actor, {
    action: "feedback.reply",
    targetType: "feedback",
    targetId: feedbackId,
    targetLabel: item.body.slice(0, 60),
  });
}

const STATUS_TITLES: Record<string, string> = {
  yangi: "Yangi",
  jarayonda: "Jarayonda",
  bajarildi: "Bajarildi",
  rad: "Rad etilgan",
};

export async function setFeedbackStatus(
  feedbackId: string,
  status: FeedbackStatus,
): Promise<void> {
  const { actor } = await requireAdmin();

  const [row] = await db.select().from(feedback).where(eq(feedback.id, feedbackId));
  if (!row) throw new Error("Fikr topilmadi");
  if (row.status === status) return;

  const item = row.data as unknown as FeedbackItem;
  const nextItem: FeedbackItem = { ...item, status };

  // Denormallangan ustun HAM data.status HAM yangilanadi.
  await db
    .update(feedback)
    .set({
      status,
      data: nextItem as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(feedback.id, feedbackId));

  await notifyTeacher(row.teacherId, {
    kind: "status",
    title: `Fikringiz holati yangilandi: ${STATUS_TITLES[status] ?? status}`,
    body: item.body.length > 120 ? `${item.body.slice(0, 117)}…` : item.body,
  });

  await writeAuditLog(actor, {
    action: "feedback.status",
    targetType: "feedback",
    targetId: feedbackId,
    targetLabel: item.body.slice(0, 60),
    meta: { from: row.status, to: status },
  });
}
