import "server-only";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { feedback, teachers } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";
import { notifyTeacher } from "../notify";
import { writeAuditLog } from "./audit";
import { feedbackExcerpt as excerpt } from "@/lib/feedback-link-markup";
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
    body: excerpt(body),
    href: `/dashboard/feedback?item=${feedbackId}`,
  });

  await writeAuditLog(actor, {
    action: "feedback.reply",
    targetType: "feedback",
    targetId: feedbackId,
    targetLabel: excerpt(item.body, 60),
  });
}

/* Har status uchun toʻliq, tabiiy gap — "Fikringiz holati: X" formatidan
   koʻra oʻqituvchiga tushunarli (Gemini tanqidi asosida). */
const STATUS_NOTIFY_TITLES: Record<string, string> = {
  yangi: "Fikringiz qabul qilindi",
  jarayonda: "Fikringiz koʻrib chiqilmoqda",
  bajarildi: "Fikringiz asosida oʻzgarish kiritildi",
  rad: "Fikringiz koʻrib chiqildi",
};

/* Bildirishnoma badge'i uchun — feedback sahifasidagi STATUS_META bilan
   AYNAN bir xil label/rang (yagona haqiqat manbai, ikkalasi ham shu
   qiymatlarni koʻrsatadi). */
const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  yangi: { label: "Yangi", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
  jarayonda: { label: "Jarayonda", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  bajarildi: { label: "Bajarildi", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  rad: { label: "Rad etilgan", className: "bg-slate-400/10 text-slate-500 dark:text-slate-400 border-slate-400/20" },
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
    title: STATUS_NOTIFY_TITLES[status] ?? "Fikringiz holati yangilandi",
    body: excerpt(item.body),
    href: `/dashboard/feedback?item=${feedbackId}`,
    badgeLabel: STATUS_BADGE[status]?.label,
    badgeClassName: STATUS_BADGE[status]?.className,
  });

  await writeAuditLog(actor, {
    action: "feedback.status",
    targetType: "feedback",
    targetId: feedbackId,
    targetLabel: excerpt(item.body, 60),
    meta: { from: row.status, to: status },
  });
}
