import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QUOTES_SEED, type Quote } from "@/lib/quotes";

/* ════════════════════════════════════════════════════════════════════
   IQTIBOSLAR STORE — foydalanuvchi kuratsiyasi (localStorage persist).

   Boshlangʻich toʻplam lib/quotes.ts'dan; foydalanuvchi "kun yopildi"
   kartasidagi boshqaruv dialogi orqali qoʻshadi/oʻchiradi. Qurilma-lokal
   sozlama (server sync YOʻQ) — sinf maʼlumoti emas, shaxsiy did.

   Eslatma: seed faqat birinchi ochilishda koʻchadi; keyin roʻyxat
   toʻliq foydalanuvchi qoʻlida (seed'dan oʻchirilgani qaytib kelmaydi).
   ════════════════════════════════════════════════════════════════════ */

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `q-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

interface QuotesState {
  quotes: Quote[];
  /**
   * `text` — formatsiz matn (majburiy, a11y/fallback uchun).
   * `html` — formatlangan variant; faqat formatlash mavjud boʻlsa beriladi.
   */
  addQuote: (text: string, author?: string, html?: string) => void;
  removeQuote: (id: string) => void;
}

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set) => ({
      quotes: QUOTES_SEED,
      addQuote: (text, author, html) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        set((s) => ({
          quotes: [
            ...s.quotes,
            { id: uid(), text: trimmed, html: html || undefined, author: author?.trim() || undefined },
          ],
        }));
      },
      removeQuote: (id) => set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),
    }),
    {
      name: "ustozona-quotes-v1",
      version: 1,
      // Kelgusi shakl oʻzgarishlari uchun langar — v1'da no-op.
      migrate: (persisted) => persisted as QuotesState,
    }
  )
);
