/* Muharrir rasmlari — mijoz ham, server ham oʻqiydigan NEYTRAL modul.

   ⚠️ Bu yerga koʻchirilishining sababi: `"use server"` faylda `export`
   qilingan konstanta/tip ikkala tomon uchun umumiy manba boʻla olmaydi —
   Turbopack u modulni Server Action chunk'iga aylantiradi (AGENTS.md dagi
   `export type` tuzogʻining aynan oʻzi). Shuning uchun umumiy qiymatlar
   `"use server"` ham, `server-only` ham boʻlmagan shu faylda turadi. */

/** Supabase Storage bucket nomi — ommaviy (public) boʻlishi kerak. */
export const EDITOR_IMAGE_BUCKET = "editor-images";

/* ── HAJM CHEGARALARI — bitta zanjirdan HOSIL qilinadi ──────────────────
   Uchta chegara bor edi va ular bir-biridan mustaqil yozilgani uchun
   ZIDLASHGANDI: `next.config.ts` da 6 MB tana, bu yerda 8 MB rasm, Supabase
   bucket'ida yana 8 MB. Rasm Server Action'ga base64 sifatida boradi, base64
   esa hajmni 4/3 marta shishiradi — yaʼni 8 MB rasm 10.7 MB tana degani.
   Natijada 8 MB chegara HECH QACHON ishlamas, undan ancha oldin Next'ning
   tana chegarasi tushunarsiz xato bilan soʻrovni rad etardi.

   Endi zanjir bitta yoʻnalishda: rasm chegarasi → base64 shishishi →
   tana chegarasi. `next.config.ts` dagi qiymat SHU yerdan hisoblanadi. */

/** Bitta rasm uchun chegara (siqilgandan keyin). 1280px/q0.8 surat odatda
 *  150–400 KB — 2 MiB juda keng zaxira. */
export const MAX_EDITOR_IMAGE_BYTES = 2 * 1024 * 1024;

/** base64 kodlash hajmni ≈4/3 marta oshiradi (+ JSON qobigʻi). */
export const BASE64_OVERHEAD = 4 / 3;

/** Server Action tana chegarasi — `next.config.ts` shu qiymatni ishlatadi.
 *  Bitta rasmning base64 shakli (≈2.7 MB) va saqlagichsiz muhitda bir necha
 *  rasmli maqolaning butun HTML'i shunga sigʻishi kerak. */
export const SERVER_ACTION_BODY_LIMIT = "4mb";
