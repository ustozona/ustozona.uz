"use server";

import { getSession } from "@/server/session";
import { isTeacher } from "@/lib/auth-roles";
import { failureOf, type FailureReason } from "@/server/dal/_failure-reason";

export type { FailureReason };

/* ════════════════════════════════════════════════════════════════════
   SESSIYA SOG'LIGI — «nega hech narsa yuklanmadi?» degan savolga javob

   Mijoz hydration yiqilganini KO'RADI, lekin sababini KO'RMAYDI:
   Next.js production'da Server Action xatosini yashiradi. Bu amal
   sababni xavfsiz shaklda (faqat nom) qaytaradi.

   ⛔ SIR OSHKOR QILMAYDI: sessiya, foydalanuvchi yoki xato matni
   qaytarilmaydi — faqat uchta nomdan bittasi.

   ⚠️ FAQAT YIQILGAN HOLATDA CHAQIRILADI (qo'shimcha so'rov bo'lmasin).
   ════════════════════════════════════════════════════════════════════ */

export async function getAuthHealthAction(): Promise<
  { ok: true } | { failed: FailureReason }
> {
  try {
    const session = await getSession();
    if (!session) return { failed: "unauthorized" };
    if (!isTeacher(session.user)) return { failed: "forbidden" };
    return { ok: true };
  } catch (err) {
    // Bu yerga tushish sessiya o'qish MEXANIZMI buzilganini bildiradi
    // (masalan baza yoki imzo kaliti) — logga yozilishi shart.
    return { failed: failureOf(err, "auth-health").reason };
  }
}
