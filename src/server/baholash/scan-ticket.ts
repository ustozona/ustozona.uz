import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/* ════════════════════════════════════════════════════════════════════
   SKANER CHIPTASI — noutbukdan telefonga oʻtish

   MUAMMO: oʻqituvchi Ustozonani noutbukda ishlatadi, varaqni esa telefon
   kamerasi bilan suratga oladi. «Havolani telefonga yuboring» degan
   qadam — oqimni buzadigan eng katta toʻsiq: hech kim oʻziga oʻzi
   havola yubormaydi.

   YECHIM: ekranda QR chiqadi, oʻqituvchi telefon kamerasini oʻz
   ekraniga tutadi. Bitta harakat, hech qanday yuborish yoʻq.

   Lekin telefonda Ustozona sessiyasi (cookie) YOʻQ. Shuning uchun
   havolaning oʻzi kimlikni tashiydi — CHIPTA.

   NEGA JADVAL EMAS, IMZO
   ----------------------
   Chipta bir martalik va qisqa umrli. Jadval qoʻshish migratsiya,
   tozalash vazifasi va yana bitta yozuv joyi degani. Imzolangan
   qiymat esa hech narsa saqlamaydi: server oʻzi bergan chiptani
   oʻzi tanib oladi.

   ⚠️ BEKOR QILIB BOʻLMAYDI. Shuning uchun umri qisqa (2 soat) va
   qamrovi tor: FAQAT bitta test + bitta sinf uchun varaq kiritish.
   Chiptani qoʻlga kiritgan odam shu testga javob yoza oladi — jurnalni
   oʻqiy olmaydi, boshqa sinfga tegmaydi, oʻquvchi maʼlumotini
   oʻzgartira olmaydi. Bu `/play` ishtirokchi tokeni bilan bir xil
   savdo (docs/baholash-integratsiya.md §4).
   ════════════════════════════════════════════════════════════════════ */

export type ScanTicket = {
  teacherId: string;
  setId: string;
  classId: string;
  /** Unix soniya. */
  exp: number;
};

const TTL_SECONDS = 2 * 60 * 60;

/** Imzo siri.

    `BETTER_AUTH_SECRET` qayta ishlatiladi, lekin ALOHIDA maqsad
    yorligʻi bilan: bir sirdan olingan ikki kalit bir-birining oʻrniga
    ishlamasin (sessiya cookie'si chipta oʻrniga oʻtib ketmasin). */
function secret(): string {
  const base = process.env.BETTER_AUTH_SECRET ?? "";
  if (!base) throw new Error("BETTER_AUTH_SECRET oʻrnatilmagan");
  return createHmac("sha256", base).update("baholash:scan-ticket:v1").digest("hex");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function signScanTicket(input: Omit<ScanTicket, "exp">): string {
  const ticket: ScanTicket = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Chiptani tekshiradi. Yaroqsiz yoki muddati oʻtgan boʻlsa `null`.

    Sabab QAYTARILMAYDI: «imzo notoʻgʻri» bilan «muddati oʻtgan» ni
    farqlash tashqaridan kalit tanlashga yordam berardi. Foydalanuvchiga
    bitta javob yetarli — QR ni qaytadan oching. */
export function verifyScanTicket(token: string): ScanTicket | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  // Uzunlik teng boʻlmasa `timingSafeEqual` otib yuboradi — avval
  // tekshiramiz, keyin doimiy vaqtda solishtiramiz.
  if (expected.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

  try {
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString()) as ScanTicket;
    if (!ticket.teacherId || !ticket.setId || !ticket.classId) return null;
    if (ticket.exp * 1000 < Date.now()) return null;
    return ticket;
  } catch {
    return null;
  }
}
