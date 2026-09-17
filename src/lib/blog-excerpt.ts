/** Kartada va SEO tavsifida koʻrinadigan matnning tavsiya etilgan chegarasi:
 *  qidiruv natijasi shuncha belgini koʻrsatadi, karta ham 2 qatorga sigʻadi. */
export const EXCERPT_RECOMMENDED_MAX = 160;

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/** Maqolaning birinchi matnli abzatsidan qisqa tavsif yasaydi.
 *
 *  Subtitr boʻsh qolgan maqola uchun zaxira: karta va meta description boʻsh
 *  chiqmasin. Sarlavha (`h1`–`h6`), rasm, jadval, kod bloklari oʻtkazib
 *  yuboriladi — faqat `<p>` matni olinadi. Uzun boʻlsa soʻz chegarasida
 *  kesilib, «…» qoʻshiladi. */
export function excerptFromHtml(html: string, max = EXCERPT_RECOMMENDED_MAX): string {
  const cleaned = html.replace(/<(script|style|pre|table)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");

  for (const match of cleaned.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;|&#\d+;/gi, (e) => ENTITIES[e] ?? " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—–-]+$/, "")}…`;
  }
  return "";
}

/** Subtitr bor boʻlsa — oʻzi, boʻlmasa — matndan zaxira. */
export function resolveExcerpt(excerpt: string, content: string): string {
  return excerpt.trim() || excerptFromHtml(content);
}
