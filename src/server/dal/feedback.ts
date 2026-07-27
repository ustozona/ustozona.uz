import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { feedback } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { notifyAdmins } from "./notify";
import {
  type EmojiReaction,
  type FeedbackItem,
  type FeedbackReply,
} from "@/store/useFeedbackStore";

/* ════════════════════════════════════════════════════════════════════
   FEEDBACK DAL — useFeedbackStore'ning server tomoni.

   UMUMIY DOSKA (2-bosqich): BARCHA oʻqituvchilarning fikri hammaga
   koʻrinadi (Canny uslubi). Shu sabab whole-document diff+upsert endi
   ishlatilmaydi (bittasi boshqasining postini "egallab olishi" mumkin
   edi) — har amal oʻzining targetli server funksiyasi orqali oʻtadi:
   yaratish/tahrirlash/oʻchirish FAQAT egasi uchun, reaksiya/javob esa
   istalgan fikrga (haqiqiy koʻp-foydalanuvchi board).

   Reaksiyalar bazada `reactorIds: string[]` bilan saqlanadi (kim
   bosganini bilish uchun — bitta umumiy `mine` bayrogʻi koʻp
   foydalanuvchida ishlamaydi); oʻqishda joriy foydalanuvchiga nisbatan
   `mine`ga aylantiriladi, `reactorIds` clientga yuborilmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type FeedbackPayload = { items: FeedbackItem[] };

/** Bildirishnoma tanasi uchun qisqartma. */
function excerpt(text: string): string {
  const t = text.trim();
  return t.length > 120 ? `${t.slice(0, 117)}…` : t;
}

type StoredReaction = { emoji: string; count: number; reactorIds: string[] };
type StoredReply = Omit<FeedbackReply, "reactions"> & { reactions?: StoredReaction[] };
type StoredFeedback = Omit<FeedbackItem, "reactions" | "replies" | "isMine"> & {
  reactions: StoredReaction[];
  replies: StoredReply[];
};

function toViewerReactions(reactions: StoredReaction[] | undefined, viewerId: string): EmojiReaction[] {
  return (reactions ?? []).map((r) => ({
    emoji: r.emoji,
    count: r.count,
    mine: r.reactorIds?.includes(viewerId) ?? false,
  }));
}

function toViewerItem(row: { teacherId: string; data: unknown }, viewerId: string): FeedbackItem {
  const stored = row.data as StoredFeedback;
  return {
    ...stored,
    isMine: row.teacherId === viewerId,
    reactions: toViewerReactions(stored.reactions, viewerId),
    replies: (stored.replies ?? []).map((r) => ({
      ...r,
      reactions: r.reactions ? toViewerReactions(r.reactions, viewerId) : undefined,
    })),
  };
}

function toggleReactorId(reactions: StoredReaction[] | undefined, emoji: string, viewerId: string): StoredReaction[] {
  const list = reactions ? [...reactions] : [];
  const idx = list.findIndex((r) => r.emoji === emoji);
  if (idx === -1) {
    list.push({ emoji, count: 1, reactorIds: [viewerId] });
    return list;
  }
  const existing = list[idx];
  const has = existing.reactorIds.includes(viewerId);
  const reactorIds = has
    ? existing.reactorIds.filter((id) => id !== viewerId)
    : [...existing.reactorIds, viewerId];
  if (reactorIds.length === 0) {
    list.splice(idx, 1);
    return list;
  }
  list[idx] = { emoji, count: reactorIds.length, reactorIds };
  return list;
}

export async function getFeedbackPayload(): Promise<FeedbackPayload> {
  const teacher = await requireTeacher();
  const rows = await db
    .select({ teacherId: feedback.teacherId, data: feedback.data })
    .from(feedback)
    .orderBy(sql`(${feedback.data}->>'createdAt') desc`);
  return { items: rows.map((r) => toViewerItem(r, teacher.id)) };
}

/** Yangi fikr — faqat oʻzi nomidan. */
export async function createFeedbackItem(item: FeedbackItem): Promise<void> {
  const teacher = await requireTeacher();
  const { isMine: _isMine, ...data } = item;
  await db.insert(feedback).values({
    id: item.id,
    teacherId: teacher.id,
    status: item.status,
    category: item.category,
    sortOrder: 0,
    data: data as unknown as Record<string, unknown>,
  });

  await notifyAdmins(
    {
      kind: "feedback",
      title: `${teacher.name} yangi fikr yozdi`,
      body: excerpt(item.body),
      href: "/admin/feedback",
    },
    teacher.id,
  );
}

/** Fikr matnini tahrirlash — faqat egasi. */
export async function editFeedbackItem(id: string, body: string): Promise<void> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
  if (!row || row.teacherId !== teacher.id) return;
  const item = row.data as StoredFeedback;
  const next: StoredFeedback = { ...item, body: body.trim(), editedAt: new Date().toISOString() };
  await db
    .update(feedback)
    .set({ data: next as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(feedback.id, id));
}

/** Fikrni oʻchirish — faqat egasi. */
export async function deleteFeedbackItem(id: string): Promise<void> {
  const teacher = await requireTeacher();
  await db.delete(feedback).where(and(eq(feedback.id, id), eq(feedback.teacherId, teacher.id)));
}

/** Fikrga emoji reaksiya — istalgan oʻqituvchi. */
export async function toggleFeedbackReaction(id: string, emoji: string): Promise<void> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
  if (!row) return;
  const item = row.data as StoredFeedback;
  const next: StoredFeedback = { ...item, reactions: toggleReactorId(item.reactions, emoji, teacher.id) };
  await db
    .update(feedback)
    .set({ data: next as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(feedback.id, id));
}

/** Javobga emoji reaksiya — istalgan oʻqituvchi. */
export async function toggleFeedbackReplyReaction(
  id: string,
  replyId: string,
  emoji: string
): Promise<void> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
  if (!row) return;
  const item = row.data as StoredFeedback;
  const next: StoredFeedback = {
    ...item,
    replies: item.replies.map((r) =>
      r.id === replyId ? { ...r, reactions: toggleReactorId(r.reactions, emoji, teacher.id) } : r
    ),
  };
  await db
    .update(feedback)
    .set({ data: next as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(feedback.id, id));
}

export type NewFeedbackReplyInput = {
  body: string;
  quote?: FeedbackReply["quote"];
  parentId?: string;
};

/**
 * Javob qoʻshish — istalgan oʻqituvchi, lekin HAR DOIM oʻz nomidan
 * (rasmiy "Ustozona jamoasi" javobi faqat admin panelidan —
 * `replyToFeedbackAsTeam`; oddiy oʻqituvchi rasmiy javobni taqlid
 * qilolmaydi).
 */
export async function addFeedbackReply(id: string, input: NewFeedbackReplyInput): Promise<void> {
  const teacher = await requireTeacher();
  const [row] = await db.select().from(feedback).where(eq(feedback.id, id));
  if (!row) return;
  const item = row.data as StoredFeedback;
  const reply: StoredReply = {
    id: crypto.randomUUID(),
    author: teacher.name,
    authorAvatarUrl: teacher.avatarUrl ?? undefined,
    isOfficial: false,
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    quote: input.quote,
    parentId: input.parentId,
  };
  const next: StoredFeedback = { ...item, replies: [...(item.replies ?? []), reply] };
  await db
    .update(feedback)
    .set({ data: next as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(feedback.id, id));

  await notifyAdmins(
    {
      kind: "reply",
      title: `${teacher.name} fikrga javob yozdi`,
      body: excerpt(reply.body),
      href: "/admin/feedback",
    },
    teacher.id,
  );
}
