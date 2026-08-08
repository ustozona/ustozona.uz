/* LessonLab bog'lashi kutilmoqda — kirish/ro'yxatdan o'tishdan keyin
   qayerga yo'naltirish kerakligini MIJOZ TOMONDA hal qilish uchun.

   `/api/bogla-stash` foydalanuvchi hali tizimga kirmagan holda
   LessonLab botidan kelganida ikkita cookie qo'yadi:
     - `ll_link_code` (httpOnly, sir) — haqiqiy bog'lash kodi
     - `ll_link_pending` (oddiy) — shunchaki bayroq, faqat mavjudligi
       muhim

   Login/signup formalari (`login-form.tsx`, `signup-form.tsx`)
   muvaffaqiyatli kirish/ro'yxatdan o'tgach odatda `/dashboard` ga
   yo'naltiradi. Bu bayroq bo'lsa, o'rniga `/bogla` ga yuboriladi —
   aks holda foydalanuvchi ro'yxatdan o'tib `/dashboard` da qolib
   ketardi va LessonLab bilan bog'lanish HECH QACHON yakunlanmasdi
   (2026-08-08 da real foydalanuvchida ushlangan holat). */
export const PENDING_LINK_COOKIE = "ll_link_pending";

/** `document.cookie` da bayroq bormi — faqat mijoz komponentlarida
    chaqiriladi ("use client"). Server render'da `document` yo'q. */
export function hasPendingLessonLabLink(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c === `${PENDING_LINK_COOKIE}=1`);
}

/** Muvaffaqiyatli auth'dan keyingi yo'nalish: bog'lash kutilayotgan
    bo'lsa `/bogla`, aks holda berilgan standart yo'l. */
export function postAuthRedirect(fallback: string): string {
  return hasPendingLessonLabLink() ? "/bogla" : fallback;
}
