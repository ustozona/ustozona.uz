"use client";

import { useState, type RefObject } from "react";

/* Matn belgilanganda chiqadigan suzuvchi "Iqtibos" tugmasi (Telegram uslubi)
   uchun holat: belgilangan matn, tugma koordinatalari va manba xabar. */

export type QuoteSelection = {
  text: string;
  top: number;
  left: number;
  targetId: string;
  author: string;
};

export function useQuoteSelection(
  articleRef: RefObject<HTMLElement | null>,
  fallbackAuthor: string,
) {
  const [sel, setSel] = useState<QuoteSelection | null>(null);

  /** Karta ichida mouseup boʻlganda chaqiriladi. */
  const handleTextSelect = () => {
    const selection = window.getSelection();
    const article = articleRef.current;
    if (!selection || selection.isCollapsed || !article) { setSel(null); return; }
    const text = selection.toString().trim();
    if (!text) { setSel(null); return; }
    const range = selection.getRangeAt(0);
    const node = range.commonAncestorContainer;
    const anchorEl = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement | null;
    const msgEl = anchorEl?.closest<HTMLElement>("[data-msg-id]");
    if (!msgEl || !article.contains(msgEl)) { setSel(null); return; }
    const rect = range.getBoundingClientRect();
    const box = article.getBoundingClientRect();
    setSel({
      text,
      top: rect.top - box.top - 6,
      left: Math.min(Math.max(rect.left - box.left + rect.width / 2, 60), box.width - 60),
      targetId: msgEl.dataset.msgId!,
      author: msgEl.dataset.msgAuthor || fallbackAuthor,
    });
  };

  /** Belgilashni va tugmani tozalaydi (iqtibos olingandan soʻng). */
  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSel(null);
  };

  return { sel, handleTextSelect, clearSelection };
}
