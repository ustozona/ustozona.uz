import "server-only";
import { ZodError } from "zod";
import { ForbiddenError, UnauthorizedError } from "@/server/session";
import type { ActionResult } from "@/lib/action-result";

/* ════════════════════════════════════════════════════════════════════
   AMALNI OʻRAB, RAD ETISHNI JAVOBGA AYLANTIRADI.

   ⚠️ Faqat BIZ oʻzimiz otgan xatolar matni oshkor qilinadi
   (`ForbiddenError` / `UnauthorizedError`) — ular ataylab foydalanuvchi
   uchun yozilgan oʻzbekcha jumlalar.

   ⛔ Boshqa har qanday xato (baza, tarmoq, kod xatosi) matni
   OSHKOR QILINMAYDI: unda jadval nomi, soʻrov yoki fayl yoʻli boʻlishi
   mumkin. Foydalanuvchi umumiy matn koʻradi, sabab serverga log
   qilinadi.
   ════════════════════════════════════════════════════════════════════ */

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    /* Next'ning oʻz boshqaruv xatolari (redirect/notFound) tutilmaydi —
       ular xato emas, oqim. Yutib yuborilsa sahifa qotib qolardi. */
    if (isNextControlFlow(e)) throw e;

    if (e instanceof ForbiddenError || e instanceof UnauthorizedError) {
      return { ok: false, message: e.message };
    }
    if (e instanceof ZodError) {
      return { ok: false, message: "Yuborilgan maʼlumot notoʻgʻri" };
    }
    console.error("[action]", e);
    return { ok: false, message: "Kutilmagan xatolik — birozdan keyin urinib koʻring" };
  }
}

function isNextControlFlow(e: unknown): boolean {
  const digest = (e as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}
