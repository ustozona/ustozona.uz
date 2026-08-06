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

/* ── Ixcham qadoqlash ──────────────────────────────────────────────

   Chipta EKRANDAGI QR ga sigʻadi, shuning uchun har belgi qimmat:
   havola uzaygani sayin QR modullari maydalashadi va eski/xira
   kamerali telefon uni oʻqiy olmay qoladi.

   JSON qadoqlash (`{"teacherId":"…","setId":"…"}`) ~240 belgi
   berardi — QR 61 modul. Ixcham qadoqlashda ~120 belgi, QR ~45
   modul: bir xil oʻlchamdagi kvadratda modul 35% yiriklashadi.

   Uch tejash:
     • kalit nomlari yoʻq — maydonlar tartibi bilan yoziladi;
     • UUID matn emas, 16 XOM BAYT (36 → 16 belgi);
     • imzo 32 emas, 12 bayt. 96 bit — ikki soatlik chipta uchun
       ortigʻi bilan yetarli (soxtalashtirish 2^96 amal).

   ⚠️ Format oʻzgargani uchun ESKI chiptalar yaroqsiz. Ular bor-yoʻgʻi
   2 soat yashaydi va sahifa «QR ni qaytadan oching» deb aniq
   aytadi — koʻchish davri uchun yetarli. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIG_BYTES = 12;

/** Matnni bayt qatoriga: UUID boʻlsa 16 bayt, boʻlmasa uzunlik+UTF-8.

    Ikki xil holat bor, chunki `teacherId` UUID boʻlishi shart emas
    (u autentifikatsiya kutubxonasidan keladi). Format oʻzini oʻzi
    tavsiflaydi — birinchi bayt turni aytadi. */
function packId(id: string): Buffer {
  if (UUID_RE.test(id)) {
    return Buffer.concat([Buffer.from([0]), Buffer.from(id.replace(/-/g, ""), "hex")]);
  }
  const raw = Buffer.from(id, "utf8");
  if (raw.length > 255) throw new Error("ID juda uzun");
  return Buffer.concat([Buffer.from([raw.length]), raw]);
}

function unpackId(buf: Buffer, offset: number): { id: string; next: number } {
  const kind = buf[offset];
  if (kind === 0) {
    const hex = buf.subarray(offset + 1, offset + 17).toString("hex");
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    return { id, next: offset + 17 };
  }
  return {
    id: buf.subarray(offset + 1, offset + 1 + kind).toString("utf8"),
    next: offset + 1 + kind,
  };
}

export function signScanTicket(input: Omit<ScanTicket, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const expBuf = Buffer.alloc(4);
  expBuf.writeUInt32BE(exp);

  const packed = Buffer.concat([
    packId(input.teacherId),
    packId(input.setId),
    packId(input.classId),
    expBuf,
  ]);
  const payload = packed.toString("base64url");
  const signature = createHmac("sha256", secret())
    .update(payload)
    .digest()
    .subarray(0, SIG_BYTES)
    .toString("base64url");
  return `${payload}.${signature}`;
}

/** Chiptani tekshiradi. Yaroqsiz yoki muddati oʻtgan boʻlsa `null`.

    Sabab QAYTARILMAYDI: «imzo notoʻgʻri» bilan «muddati oʻtgan» ni
    farqlash tashqaridan kalit tanlashga yordam berardi. Foydalanuvchiga
    bitta javob yetarli — QR ni qaytadan oching. */
export function verifyScanTicket(token: string): ScanTicket | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest()
    .subarray(0, SIG_BYTES)
    .toString("base64url");
  // Uzunlik teng boʻlmasa `timingSafeEqual` otib yuboradi — avval
  // tekshiramiz, keyin doimiy vaqtda solishtiramiz.
  if (expected.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;

  try {
    const buf = Buffer.from(payload, "base64url");
    const teacher = unpackId(buf, 0);
    const set = unpackId(buf, teacher.next);
    const cls = unpackId(buf, set.next);
    // Oxirida aynan 4 bayt (muddat) qolishi shart — boʻlmasa bu
    // bizning qadoqimiz emas.
    if (buf.length !== cls.next + 4) return null;
    const exp = buf.readUInt32BE(cls.next);

    if (!teacher.id || !set.id || !cls.id) return null;
    if (exp * 1000 < Date.now()) return null;
    return { teacherId: teacher.id, setId: set.id, classId: cls.id, exp };
  } catch {
    return null;
  }
}
