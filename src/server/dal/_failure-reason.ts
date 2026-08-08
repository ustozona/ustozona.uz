import "server-only";
import { ForbiddenError, UnauthorizedError } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   SERVER ACTION XATOSI — NOMLANGAN SABAB

   ⛔ MUAMMO: Next.js production'da Server Action ichidagi xatoni
   MIJOZDAN YASHIRADI. Brauzerga faqat umumiy xabar va `digest`
   yetib boradi — haqiqiy sabab (`UnauthorizedError`, DB xatosi…)
   faqat SERVER logida qoladi.

   Bu himoya to'g'ri (xato matni ichki tuzilishni oshkor qilishi
   mumkin), lekin oqibati og'ir bo'ldi: 2026-08-08 da butun kun
   «Holatni tekshirib bo'lmadi» va «Foydalanuvchi» degan mazmunsiz
   holat ko'rindi, sabab esa auth'da ham, bazada ham, CSRF'da ham
   izlandi — chunki KO'RINADIGAN hech narsa yo'q edi.

   YECHIM: xatoni SERVERDA tutib, mijozga faqat SABAB NOMINI
   qaytarish. Nom oshkor qilmaydigan darajada umumiy, lekin
   foydalanuvchiga nima qilishini aytadigan darajada aniq:

     unauthorized → sessiya yo'q/tugagan  → «qaytadan kiring» (amaliy!)
     forbidden    → rol yetarli emas      → «bu hisob o'qituvchi emas»
     server       → qolgan hammasi        → «serverda xato»

   ⚠️ `throw` QILISHNI XOHLAMAYDIGAN JOYDA ISHLATING. Amal yiqilishi
   NORMAL holat bo'lsa (sessiya tugashi — normal), uni istisno bilan
   emas, qaytarilgan qiymat bilan ifodalash kerak: shundagina UI unga
   javob bera oladi.
   ════════════════════════════════════════════════════════════════════ */

export type FailureReason = "unauthorized" | "forbidden" | "server";

/** Istisnoni mijozga xavfsiz uzatiladigan sabab nomiga aylantiradi.

    `server` — noma'lum xato, ya'ni tekshirilishi kerak. Shuning uchun
    faqat u konsolga (server logiga) yoziladi: `unauthorized` odatiy
    holat va uni logga yozish shovqin qo'shardi. */
export function reasonOf(err: unknown, where: string): FailureReason {
  if (err instanceof UnauthorizedError) return "unauthorized";
  if (err instanceof ForbiddenError) return "forbidden";
  console.error(`[${where}] kutilmagan xato:`, err);
  return "server";
}
