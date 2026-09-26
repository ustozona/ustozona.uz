/* ════════════════════════════════════════════════════════════════════
   UMUMIY AUDIO KONTEKST — gʻildirak (`spin-sound.ts`) va Doska
   tovushlari (`doska/sounds.ts`) BITTA kontekstdan foydalanadi.

   Nega bitta: brauzer AudioContextʼni faqat foydalanuvchi harakatidan
   keyin ochadi. Ikki alohida kontekst boʻlsa, gʻildirakni aylantirish
   faqat oʻzinikini ochar, taymerning tugash ovozi esa yopiq kontekstda
   jim qolardi — garchi oʻqituvchi tovush bilan allaqachon ishlagan
   boʻlsa ham.
   ════════════════════════════════════════════════════════════════════ */

let ctx: AudioContext | null = null;

/** Kontekstni qaytaradi (kerak boʻlsa yaratadi va uygʻotadi). Serverda `null`. */
export function sharedAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
