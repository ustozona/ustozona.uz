import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   BILDIRISHNOMALAR — header qoʻngʻiroq (Bell) uchun yengil store.

   Hozircha faqat feedback oqimida ishlatiladi: asoschi fikrga javob
   yozganda, fikr egasiga bildirishnoma tushadi. Server-backed
   (8-bosqich): `NotificationsServerSync` mount'da serverdan {items}ni
   yuklaydi, oʻzgarishlar diff bilan saqlanadi. Boshlangʻich holat BOʻSH
   (9-bosqich): SEED_NOTIFICATIONS endi faqat scripts/seed.ts'da (demo
   oʻqituvchi) ishlatiladi — export shu sabab qoladi.
   ════════════════════════════════════════════════════════════════════ */

export type NotificationKind = "reply" | "feedback" | "status" | "system";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** Bosilganda oʻtiladigan ichki manzil. */
  href?: string;
  /** status-kind uchun aniq holat pill'i (m-n "Jarayonda") — boʻlmasa
   *  generic kind badge koʻrsatiladi. */
  badgeLabel?: string;
  badgeClassName?: string;
  read: boolean;
  createdAt: string; // ISO
};

export type NewNotificationInput = {
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  badgeLabel?: string;
  badgeClassName?: string;
};

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ntf-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "ntf-seed-1",
    kind: "system",
    title: "Ustozona'ga xush kelibsiz!",
    body: "Fikr-mulohaza boʻlimida taklif va xatolarni ulashing — biz oʻqiymiz.",
    href: "/dashboard/feedback",
    read: false,
    createdAt: "2026-07-01T08:00:00.000Z",
  },
];

interface NotificationsState {
  items: NotificationItem[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  notify: (input: NewNotificationInput) => string;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
    (set) => ({
      items: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      notify: (input) => {
        const id = uid();
        const item: NotificationItem = {
          id,
          kind: input.kind,
          title: input.title,
          body: input.body,
          href: input.href,
          badgeLabel: input.badgeLabel,
          badgeClassName: input.badgeClassName,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ items: [item, ...s.items] }));
        return id;
      },

      markRead: (id) =>
        set((s) => ({
          items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: () =>
        set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),

      clearAll: () => set({ items: [] }),
    })
);
