import { createHmac, timingSafeEqual } from "node:crypto";

/* ════════════════════════════════════════════════════════════════════
   OBUNANI BEKOR QILISH TOKENI — imzolangan, muddatsiz.

   Havola xat ichida ketadi va login TALAB QILMAYDI: odam bir bosishda
   chiqib ketishi kerak (Gmail ommaviy yuboruvchi talabi). Shuning
   uchun havolaning oʻzi dalil boʻlishi kerak — HMAC imzo bilan.

   Format: `<userId>.<imzo>` — imzo BETTER_AUTH_SECRET bilan.

   Muddat ataylab qoʻyilmagan: bir yildan keyin topilgan eski xatdagi
   havola ham ishlashi kerak, aks holda odam obunadan chiqolmaydi.
   Xavf past — token faqat "menga xat yubormang" deyish imkonini
   beradi, hisobga kirish emas.

   ⚠️ Bu modul neytral (`"use server"` YOʻQ) — tiplar va funksiyalar
   ikkala tomondan import qilinadi. AGENTS.md dagi Server Action
   qoidasiga qarang.
   ════════════════════════════════════════════════════════════════════ */

function secret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (!s) throw new Error("BETTER_AUTH_SECRET yoʻq — unsubscribe tokenini imzolab boʻlmaydi.");
  return s;
}

function imzola(userId: string): string {
  return createHmac("sha256", secret()).update(`unsubscribe:${userId}`).digest("base64url");
}

export function unsubscribeToken(userId: string): string {
  return `${userId}.${imzola(userId)}`;
}

/** Token toʻgʻri boʻlsa userId, aks holda null. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const nuqta = token.lastIndexOf(".");
  if (nuqta < 1) return null;

  const userId = token.slice(0, nuqta);
  const berilgan = token.slice(nuqta + 1);
  const kutilgan = imzola(userId);

  /* Uzunlik farq qilsa timingSafeEqual otadi — avval tekshiramiz. */
  if (berilgan.length !== kutilgan.length) return null;
  if (!timingSafeEqual(Buffer.from(berilgan), Buffer.from(kutilgan))) return null;

  return userId;
}
