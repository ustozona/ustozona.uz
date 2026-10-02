import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { packId, unpackId } from "@/server/baholash/scan-ticket";

/* ════════════════════════════════════════════════════════════════════
   PULT CHIPTASI — Doska → oʻqituvchi telefoni.

   Skaner chiptasi (`scan-ticket.ts`) bilan bir naqsh: telefonda
   Ustozona sessiyasi boʻlmasligi mumkin, shuning uchun QR dagi havola
   kimlikni tashiydi. Imzo — jadval emas: hech narsa saqlanmaydi.

   QAMROV TOR: chipta faqat (1) shu Doskaning realtime kanaliga ulanish
   va (2) oʻqituvchining OʻZ testi uchun skaner chiptasi olish huquqini
   beradi (`remoteScanTicketAction` — test egaligi serverda tekshiriladi).
   Jurnalni oʻqish, sinf yoki oʻquvchini oʻzgartirish — yoʻq.

   Umri 12 soat — bitta oʻquv kuni. Bekor qilib boʻlmaydi; Doskada
   «Yangi ulanish» yangi kanal ochadi va eski chipta boshqara olmaydi
   (Doska endi boshqa mavzuni tinglaydi).

   Ixcham: oʻqituvchi id + 16 bayt mavzu + 4 bayt muddat + 12 bayt imzo
   ≈ 70 belgi — Doska ekranidagi QR yirik modulli boʻlib qoladi.
   ════════════════════════════════════════════════════════════════════ */

export type RemoteTicket = {
  teacherId: string;
  /** Realtime kanal mavzusi (`remote-<32 hex>`). */
  topic: string;
  /** Unix soniya. */
  exp: number;
};

const TTL_SECONDS = 12 * 60 * 60;
const SIG_BYTES = 12;
const TOPIC_PREFIX = "remote-";

function secret(): string {
  const base = process.env.BETTER_AUTH_SECRET ?? "";
  if (!base) throw new Error("BETTER_AUTH_SECRET oʻrnatilmagan");
  return createHmac("sha256", base).update("doska:remote-ticket:v1").digest("hex");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest().subarray(0, SIG_BYTES).toString("base64url");
}

/** Yangi kanal va unga chipta. */
export function newRemoteTicket(teacherId: string): { ticket: string; topic: string; exp: number } {
  const raw = randomBytes(16);
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const expBuf = Buffer.alloc(4);
  expBuf.writeUInt32BE(exp);
  const payload = Buffer.concat([packId(teacherId), raw, expBuf]).toString("base64url");
  return { ticket: `${payload}.${sign(payload)}`, topic: TOPIC_PREFIX + raw.toString("hex"), exp };
}

/** Yaroqsiz yoki muddati oʻtgan boʻlsa `null` (sabab aytilmaydi — `scan-ticket` qoidasi). */
export function verifyRemoteTicket(token: string): RemoteTicket | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (expected.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const buf = Buffer.from(payload, "base64url");
    const teacher = unpackId(buf, 0);
    if (buf.length !== teacher.next + 16 + 4) return null;
    const topic = TOPIC_PREFIX + buf.subarray(teacher.next, teacher.next + 16).toString("hex");
    const exp = buf.readUInt32BE(teacher.next + 16);
    if (!teacher.id || exp * 1000 < Date.now()) return null;
    return { teacherId: teacher.id, topic, exp };
  } catch {
    return null;
  }
}
