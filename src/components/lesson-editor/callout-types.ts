/**
 * Callout tur kalitlari — YAGONA MANBA. Ilgari bu roʻyxat uch joyda mustaqil
 * yozilgan edi: callout-extension.ts (CalloutType), AiAssistantPanel.tsx
 * (regex matn sifatida), messages/*.json. Ular tuzilmaviy bogʻlanmagani
 * uchun ertami-kechmi ajralib ketishi muqarrar edi (mas. yangi tur qoʻshilib,
 * regex unutilsa — AI shu turni yozadi, lekin u jimgina oddiy matn boʻlib
 * qoladi, xato chiqmaydi).
 *
 * Bu fayl ATAYLAB yengil: hech qanday lucide-react/Tiptap import qilmaydi —
 * shuning uchun server route'lar (mas. AI regex) ham xavfsiz import qila oladi.
 */
export const CALLOUT_KEYS = [
  "note", "abstract", "info", "tip", "success", "question",
  "warning", "failure", "danger", "bug", "example",
] as const;

export type CalloutType = (typeof CALLOUT_KEYS)[number];

/** Nomaʼlum/eskirgan tur kodi kelsa qaytariladigan xavfsiz standart. */
export const DEFAULT_CALLOUT_TYPE: CalloutType = "note";

export function normalizeCalloutType(type: string | null | undefined): CalloutType {
  return (CALLOUT_KEYS as readonly string[]).includes(type ?? "")
    ? (type as CalloutType)
    : DEFAULT_CALLOUT_TYPE;
}

/** AI javobidagi "> [!turkod]" regex qismi — shu roʻyxatdan hosil qilinadi. */
export const CALLOUT_KEYS_RE_SOURCE = CALLOUT_KEYS.join("|");
