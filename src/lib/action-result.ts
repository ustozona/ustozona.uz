/* ════════════════════════════════════════════════════════════════════
   SERVER AMALINING NATIJASI — xato oʻrniga javob.

   🔴 Nega kerak: Next.js prodda Server Action ichidan otilgan xatoni
   foydalanuvchiga koʻrsatmaydi — xabar maxfiy maʼlumot saqlashi mumkin
   deb `digest` bilan almashtiriladi. Natijada UI faqat oʻzining umumiy
   matnini («Kod yaratilmadi») koʻrsatardi va rad etish SABABI
   yoʻqolardi. 2026-08-26 da aynan shu diagnostikani sekinlashtirdi:
   haqiqiy sabab (rol `owner`, kutilgani `admin`) bazaga qarab topildi.

   Yechim: rad etish — xato emas, NATIJA. Oddiy obyekt qaytariladi,
   Next uni tegmasdan oʻtkazadi.

   ⚠️ Bu modul ATAYLAB neytral: `"use server"` ham, `server-only` ham
   yoʻq — tipni ikkala tomon ham shu yerdan import qiladi (AGENTS.md).
   ════════════════════════════════════════════════════════════════════ */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/**
 * Natijani qiymatga aylantiradi, rad etilgan boʻlsa xato otadi.
 *
 * Mavjud `try/catch` li UI kodini oʻzgartirmasdan ishlatish uchun:
 * xato endi MIJOZDA otiladi, demak `e.message` haqiqiy sababni
 * saqlaydi — Next uni yashirmaydi.
 */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.message);
  return result.data;
}
