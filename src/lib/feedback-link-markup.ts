import { isWhitelistedInternalHref } from "@/lib/internal-links";

/* `[Nom](/yoʻl)` — feedback matnidagi ichki havola sintaksisi.
   Server (excerpt/bildirishnoma) va client (render) ikkalasi ham
   shu yagona regexdan foydalanadi. */
export const FEEDBACK_LINK_RE = /\[([^\]\n]+)\]\((\/[^\s)]*)\)/g;

/** Bildirishnoma/iqtibos qisqartmasi uchun — link markupini nomga qisqartiradi. */
export function stripLinkMarkup(text: string): string {
  return text.replace(FEEDBACK_LINK_RE, (full, label: string, href: string) =>
    isWhitelistedInternalHref(href) ? label : full
  );
}

/** Bildirishnoma/audit-log qisqartmasi — markupdan tozalab, `max` uzunlikkacha qisqartiradi. */
export function feedbackExcerpt(text: string, max = 120): string {
  const t = stripLinkMarkup(text).trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
