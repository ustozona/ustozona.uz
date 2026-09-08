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

/* ════════════════════════════════════════════════════════════════════
   AI UCHUN TUR IZOHLARI — ⚠️ TUR KODI OʻZ MAʼNOSINI BERMAYDI.

   Kodlar Obsidian'dan meros, lekin bizdagi yorliqlar PEDAGOGIK va
   inglizcha soʻz bilan ustma-ust tushmaydi. Eng kescin misollar:

     bug     → «Uyga vazifa»          (dastur xatosi EMAS)
     danger  → «Xavfsizlik qoidasi»   (umumiy xavf EMAS)
     info    → «Taʼrif»               (umumiy maʼlumot EMAS)
     failure → «Xato»                 (oʻquvchi xatosi)
     abstract→ «Maqsad»
     success → «Bajarildi»

   AI'ga faqat "kod (yorliq)" juftini bersak, u inglizcha soʻzga tayanadi
   va `bug` ni dasturlash xatosi deb tushunib, uyga vazifani boshqa turga
   yozadi. Shuning uchun har turga QACHON ishlatish izohi kerak.

   `Record<CalloutType, string>` ataylab: CALLOUT_KEYS ga yangi tur
   qoʻshilib bu yerda izoh unutilsa, TypeScript xato beradi — jimgina
   ajralib ketmaydi (faylning yuqoridagi maqsadi bilan bir xil sabab).
   ════════════════════════════════════════════════════════════════════ */
export const AI_CALLOUT_USAGE: Record<CalloutType, string> = {
  abstract: "dars maqsadi, kutilayotgan natija",
  info: "atama taʼrifi, qoida, formulaning maʼnosi",
  tip: "oʻqituvchiga uslubiy maslahat, qulay usul",
  example: "yechilgan namuna, konkret misol",
  question: "oʻquvchiga savol, muhokama uchun savol",
  note: "qoʻshimcha eslatma (boshqa tur mos kelmasa)",
  warning: "diqqat qaratish kerak boʻlgan oʻrin, tez-tez uchraydigan chalkashlik",
  failure: "oʻquvchilar koʻp qiladigan xato va uni tuzatish",
  danger: "laboratoriya/jismoniy xavfsizlik qoidasi",
  success: "bosqich yakuni, oʻzlashtirildi deb hisoblanadigan holat",
  bug: "UYGA VAZIFA — topshiriq matni (dasturlash xatosi bilan aloqasi yoʻq)",
};

/* ── Emojili blok (notionCallout) fon ranglari ──────────────────────

   Bu roʻyxat ilgari notion-callout-extension.ts da edi; u fayl Tiptap va
   apple-emoji import qiladi, shuning uchun server route (AI prompt) undan
   rangni oʻqiy olmasdi. Yagona manba shu yerga koʻchirildi — kengaytma
   uni shu yerdan re-eksport qiladi.

   CLASS_COLOR_BASE'ning toʻliq palitrasi (18 rang), spektr tartibida:
   `gray` birinchi (neytral standart), keyin qizildan pushtigacha aylana. */
export const NOTION_CALLOUT_COLORS = [
  "gray",
  "red", "orange", "amber", "yellow", "lime",
  "green", "emerald", "teal", "cyan", "sky",
  "blue", "indigo", "violet", "purple", "fuchsia",
  "pink", "rose",
] as const;

export type NotionCalloutColor = (typeof NOTION_CALLOUT_COLORS)[number];

export function normalizeNotionColor(
  value: string | null | undefined
): NotionCalloutColor {
  return (NOTION_CALLOUT_COLORS as readonly string[]).includes(value ?? "")
    ? (value as NotionCalloutColor)
    : "gray";
}
