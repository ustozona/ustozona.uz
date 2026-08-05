import "server-only";
import { count } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   HEALTH DAL — baza ulanishini tekshirish.

   NEGA BU YERDA, ROUTE ICHIDA EMAS
   --------------------------------
   `@/server/db/client` ni faqat shu qatlam import qila oladi
   (eslint `no-restricted-imports`). Route faqat natijani JSON qiladi.

   NEGA AUTH DARVOZASI YOʻQ
   ------------------------
   Boshqa DAL modullaridan farqli — bu monitoring endpointi, tashqi
   kuzatuvchi (Vercel, uptime bot) uni SESSIYASIZ chaqiradi. Shuning
   uchun `requireTeacher()` YOʻQ. Buning oʻrniga hech qanday
   foydalanuvchi maʼlumoti qaytarilmaydi: faqat ulanish holati va
   oʻqituvchilar SONI.

   NEGA XATO KODI QAYTARILADI, XOM MATN EMAS
   -----------------------------------------
   Drizzle xatoni oʻz oʻramiga oladi: «Failed query: select ...». Asl
   sabab (parol xato / manzil topilmadi / vaqt tugadi) `cause` ichida
   qolib ketadi va tashqaridan koʻrinmaydi. 2026-08-05 da Supabase'ga
   oʻtishda aynan shu tufayli sabab TAXMIN qilindi: haqiqiy nosozlik
   pooler manzili (`aws-0` oʻrniga `aws-1`) edi, lekin buni endpoint
   aytmadi.

   Lekin endpoint OCHIQ — xom Postgres xatosini qaytarish foydalanuvchi
   nomini va ichki manzillarni koʻrsatib qoʻyardi. Shuning uchun oʻrtacha
   yoʻl: mashina oʻqiydigan KOD + oldindan yozilgan izoh. Kod diagnostika
   uchun yetarli, sir ochilmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Xato kodi → nima qilish kerakligi. Xom matn tashqariga chiqmaydi. */
const SABABLAR: Record<string, string> = {
  "28P01": "Parol notoʻgʻri — DATABASE_URL dagi parolni tekshiring.",
  "28000": "Foydalanuvchi nomi notoʻgʻri yoki ruxsat yoʻq.",
  "3D000": "Bunday baza yoʻq — satr oxiridagi baza nomini tekshiring.",
  "53300": "Ulanish limiti tugagan — pooler (6543) ishlatilyaptimi?",
  XX000: "Pooler loyihani topmadi — manzil prefiksi (aws-0/aws-1) notoʻgʻri boʻlishi mumkin.",
  ENOTFOUND: "Manzil topilmadi (DNS) — hostname notoʻgʻri yozilgan.",
  EAI_AGAIN: "DNS vaqtincha javob bermadi — qayta urinib koʻring.",
  ECONNREFUSED: "Port yopiq — 6543 (transaction pooler) yozilganini tekshiring.",
  ETIMEDOUT: "Ulanish vaqti tugadi — manzil yoki port notoʻgʻri boʻlishi mumkin.",
  CONNECT_TIMEOUT: "Ulanish vaqti tugadi — manzil yoki port notoʻgʻri boʻlishi mumkin.",
};

/** Drizzle oʻramini yechib, eng ichkaridagi asl xato kodini topadi. */
function aslXato(err: unknown): { code: string; sabab: string } {
  let joriy: unknown = err;
  /* `cause` zanjiri chuqur boʻlishi mumkin. 5 qadam amalda yetarli va
     ayni paytda oʻziga ishora qiluvchi `cause` da cheksiz aylanishdan
     saqlaydi. */
  for (let i = 0; i < 5 && joriy; i += 1) {
    const kod = (joriy as { code?: unknown }).code;
    if (typeof kod === "string" && kod) {
      return { code: kod, sabab: SABABLAR[kod] ?? "Nomaʼlum baza xatosi." };
    }
    joriy = (joriy as { cause?: unknown }).cause;
  }
  return { code: "UNKNOWN", sabab: "Sabab aniqlanmadi — Vercel loglarini koʻring." };
}

export type HealthNatija =
  | { ok: true; db: "connected"; teachers: number }
  | { ok: false; db: "error"; code: string; sabab: string };

export async function checkDbHealth(): Promise<HealthNatija> {
  try {
    const [row] = await db.select({ teachers: count() }).from(teachers);
    return { ok: true, db: "connected", teachers: row?.teachers ?? 0 };
  } catch (err) {
    const { code, sabab } = aslXato(err);
    return { ok: false, db: "error", code, sabab };
  }
}
