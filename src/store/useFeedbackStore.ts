import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   FIKR-MULOHAZA — mahsulot feedback doskasi (Canny uslubi)

   Ustozlar Ustozona ilovasining OʻZI haqida fikr yuboradi: taklif, xato,
   savol, maqtov. Ovoz berish (upvote), turkum/holat, va rasmiy javoblar bor.

   Server-backed (8-bosqich): `FeedbackServerSync` mount'da serverdan
   {items}ni yuklaydi, oʻzgarishlar diff bilan saqlanadi (rasmlar base64
   data JSONB ichida). Boshlangʻich holat BOʻSH (9-bosqich): SEED_FEEDBACK
   endi faqat scripts/seed.ts'da (demo oʻqituvchi) ishlatiladi. v1'da har
   oʻqituvchi oʻz doskasini koʻradi; umumiy jamoaviy doska — keyingi
   bosqich.
   ════════════════════════════════════════════════════════════════════ */

export type FeedbackCategory = "taklif" | "xato" | "savol" | "maqtov" | "boshqa";
export type FeedbackStatus =
  | "yangi"
  | "korilmoqda"
  | "rejalashtirilgan"
  | "bajarilmoqda"
  | "bajarildi"
  | "rad";

/** Telegram-uslub quote: qaysi xabarga javob berilyapti (denormalizatsiya). */
export type ReplyQuote = {
  author: string;
  excerpt: string;
  /** Belgilangan xabar DOM id'si — quote bosilganda oʻsha joyga oʻtish uchun. */
  targetId?: string;
};

export type FeedbackReply = {
  id: string;
  author: string;
  /** Ega (Ustozona jamoasi) javobi — ajratib koʻrsatiladi. */
  isOfficial: boolean;
  body: string;
  createdAt: string; // ISO
  /** Belgilangan xabar (quote reply). Yoʻq boʻlsa — oddiy javob. */
  quote?: ReplyQuote;
  /**
   * Ikki qatlamli (YouTube) model: top-level javob → undefined; ichki javob →
   * top-level ajdodning id'si. Har doim faqat 2 daraja (sub-javobga javob ham
   * shu ajdod ostida qoladi — qaralayotgan xabar `quote` orqali ajratiladi).
   */
  parentId?: string;
  /** Javobga qoʻyilgan emoji reaksiyalar (fikr kabi). */
  reactions?: EmojiReaction[];
};

/** Telegram-uslub emoji reaksiya (bir emoji + sanoq + joriy user bosganmi). */
export type EmojiReaction = {
  emoji: string;
  count: number;
  mine: boolean;
};

export type FeedbackItem = {
  id: string;
  body: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  /** Biriktirilgan rasmlar (kichraytirilgan data URL). */
  images?: string[];
  author: string;
  authorInitials: string;
  /** Joriy foydalanuvchi yozgan fikr — «Faqat meniki» filtri uchun
      (ism satriga bogʻlanmaydi: Sozlamalarda ism oʻzgarsa ham buzilmaydi). */
  isMine?: boolean;
  createdAt: string; // ISO
  /** Emoji reaksiyalar (❤️/👍/🔥 …). */
  reactions: EmojiReaction[];
  replies: FeedbackReply[];
};

/** Fikrning umumiy reaksiya soni (saralash/ommaboplik uchun). */
export function totalReactions(item: FeedbackItem): number {
  return item.reactions.reduce((sum, r) => sum + r.count, 0);
}

/** Emoji reaksiyani qoʻshadi/olib tashlaydi (Telegram-uslub toggle) — fikr va javob uchun umumiy. */
function toggleIn(reactions: EmojiReaction[], emoji: string): EmojiReaction[] {
  const existing = reactions.find((r) => r.emoji === emoji);
  if (!existing) return [...reactions, { emoji, count: 1, mine: true }];
  const count = existing.count + (existing.mine ? -1 : 1);
  return count <= 0
    ? reactions.filter((r) => r.emoji !== emoji)
    : reactions.map((r) => (r.emoji === emoji ? { ...r, count, mine: !r.mine } : r));
}

export type NewFeedbackInput = {
  body: string;
  category: FeedbackCategory;
  images?: string[];
  author: string;
  authorInitials: string;
};

/** Barqaror-emas, lekin lokal uchun yetarli ID. */
function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

interface FeedbackState {
  items: FeedbackItem[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  /** Yangi fikr qoʻshadi va uning id'sini qaytaradi. */
  addFeedback: (input: NewFeedbackInput) => string;
  /** Emoji reaksiyani qoʻshadi/olib tashlaydi (Telegram-uslub). */
  toggleReaction: (id: string, emoji: string) => void;
  /** Javobga emoji reaksiyani qoʻshadi/olib tashlaydi. */
  toggleReplyReaction: (id: string, replyId: string, emoji: string) => void;
  addReply: (id: string, reply: { body: string; author: string; isOfficial: boolean; quote?: ReplyQuote; parentId?: string }) => void;
  setStatus: (id: string, status: FeedbackStatus) => void;
  deleteFeedback: (id: string) => void;
  /** Oʻchirilgan fikrni joyiga qaytaradi (undo-toast uchun). */
  restoreFeedback: (item: FeedbackItem, index: number) => void;
}

export const useFeedbackStore = create<FeedbackState>()(
    (set) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      addFeedback: (input) => {
        const id = uid();
        const item: FeedbackItem = {
          id,
          body: input.body.trim(),
          category: input.category,
          images: input.images?.length ? input.images : undefined,
          status: "yangi",
          author: input.author,
          authorInitials: input.authorInitials,
          isMine: true,
          createdAt: new Date().toISOString(),
          reactions: [],
          replies: [],
        };
        set((s) => ({ items: [item, ...s.items] }));
        return id;
      },

      toggleReaction: (id, emoji) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, reactions: toggleIn(it.reactions, emoji) } : it
          ),
        })),

      toggleReplyReaction: (id, replyId, emoji) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id
              ? {
                  ...it,
                  replies: it.replies.map((r) =>
                    r.id === replyId ? { ...r, reactions: toggleIn(r.reactions ?? [], emoji) } : r
                  ),
                }
              : it
          ),
        })),

      addReply: (id, reply) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id
              ? {
                  ...it,
                  replies: [
                    ...it.replies,
                    {
                      id: uid(),
                      author: reply.author,
                      isOfficial: reply.isOfficial,
                      body: reply.body.trim(),
                      createdAt: new Date().toISOString(),
                      quote: reply.quote,
                      parentId: reply.parentId,
                    },
                  ],
                }
              : it
          ),
        })),

      setStatus: (id, status) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, status } : it)),
        })),

      deleteFeedback: (id) =>
        set((s) => ({ items: s.items.filter((it) => it.id !== id) })),

      restoreFeedback: (item, index) =>
        set((s) => {
          if (s.items.some((it) => it.id === item.id)) return s;
          const items = [...s.items];
          items.splice(Math.min(Math.max(index, 0), items.length), 0, item);
          return { items };
        }),
    })
);
