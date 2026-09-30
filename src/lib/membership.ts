import { isDateKeyShape } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   SINF AʼZOLIGI — «bola shu kuni shu guruhda edimi?» YAGONA QOIDASI.

   docs/sinf-azoligi-spec.md. Sayt (katak yopish, roʻyxat), server
   (yozuvni rad etish, roʻyxat soʻrovlari) va mobil — hammasi shu
   funksiyalardan foydalanadi. Uch joyda uch xil solishtirish yozilmasin:
   ilgari aynan shu sababli toʻrt joyda «ketgan bola» tekshiruvi
   unutilgan edi.

   Oraliq YARIM-OCHIQ: [joinedAt, leftAt).
     • joinedAt — sinfdagi birinchi kun; null = boshidan (oddiy qoʻshish,
       eski yozuvlar — oʻqituvchi oldingi haftalarni toʻldira oladi).
     • leftAt — sinfda BOʻLMAGAN birinchi kun; null = hozir ham shu yerda.
       15-sentabrda koʻchdi → 15-sentabr YANGI sinfniki.

   Neytral modul: "use server" ham, "server-only" ham YOʻQ — mijoz va
   server bir xil import qiladi.
   ════════════════════════════════════════════════════════════════════ */

export type MembershipSpan = {
  joinedAt?: string | null;
  leftAt?: string | null;
};

/**
 * Bola `date` kuni aʼzo boʻlganmi.
 *
 * Chegarasiz oraliq har qanday kunga «ha» deydi. Chegara boʻlsa sana
 * "YYYY-MM-DD" shaklida boʻlishi shart: lexikografik solishtirish faqat
 * shunda toʻgʻri ("2026-9-05" > "2026-09-15"), notoʻgʻri shakl — «yoʻq».
 */
export function isMemberOn(span: MembershipSpan, date: string): boolean {
  if (!span.joinedAt && !span.leftAt) return true;
  if (!isDateKeyShape(date)) return false;
  if (span.joinedAt && date < span.joinedAt) return false;
  if (span.leftAt && date >= span.leftAt) return false;
  return true;
}

/**
 * Bola `today` ga kelib sinfdan allaqachon KETGANMI (`leftAt <= today`).
 *
 * «Ketgan» va «chiqish sanasi bor» bir narsa emas: kelajak sanaga
 * qoʻyilgan koʻchirishda bola hali sinfda — roʻyxatda odatdagidek turadi,
 * statistikaga kiradi. Server roʻyxatlari (`memberOnSql`) ham shunday
 * hisoblaydi.
 */
export function hasLeft(span: MembershipSpan, today: string): boolean {
  return !!span.leftAt && span.leftAt <= today;
}

/** Aʼzolik [from, to] (ikkalasi ham KIRITILGAN) oraligʻi bilan kamida bir
    kun kesishadimi — «shu oy / shu yil jadvalida koʻrinadimi». */
export function overlapsRange(span: MembershipSpan, from: string, to: string): boolean {
  if (span.joinedAt && span.joinedAt > to) return false;
  if (span.leftAt && span.leftAt <= from) return false;
  return true;
}
