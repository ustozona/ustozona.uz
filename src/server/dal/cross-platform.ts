import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { userTelegram } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { lessonlab } from "@/server/lessonlab/client";

/* ════════════════════════════════════════════════════════════════════
   KIMLIK KOʻPRIGI — bitta odam, ikki akkaunt

   Butun integratsiya bitta faktga tayanadi: «Ustozonadagi
   `teachers.id = ewwbnyu…` AYNAN LessonLab'dagi telegram
   `7929157875`». Bu fakt yozilmaguncha hech bir tomon ikkinchisining
   sinfini topa olmaydi.

   `user_telegram` jadvali ALLAQACHON bor edi (`docs/supabase-kochish.md`:
   «Koʻprik allaqachon bor»), lekin 2026-08-08 gacha BOʻSH turdi — yaʼni
   koʻprik qurilgan, ustidan hech kim oʻtmagan.

   NEGA AVTOMATIK TOPIB BOʻLMAYDI
   ------------------------------
   `bot_users` da email yoʻq, `teachers` da telegram id yoʻq. Ismga
   qarab taxmin qilish XAVFLI: ismi oʻxshash ikki oʻqituvchi bir-birining
   sinfini, oʻquvchilarini va baholarini koʻrib qolardi. Bu maxfiylik
   buzilishi boʻlardi, shunchaki nosozlik emas.

   Shuning uchun bogʻlanish faqat OʻQITUVCHI OʻZI isbotlaganda yoziladi.
   Va bunday isbot allaqachon bor: OAuth oqimi (PKCE) — oʻqituvchi
   Telegram orqali «ha, bu men» deb tasdiqlaydi. Yangi kimlik tizimi
   qurish shart emas, mavjud rozilik yetarli.
   ════════════════════════════════════════════════════════════════════ */

type MeResponse = {
  teacher?: { id?: number | string | null; username?: string | null };
};

export type BridgeResult =
  | { status: "linked"; telegramId: string }
  | { status: "already"; telegramId: string }
  /** Bu Ustozona akkaunti BOSHQA telegram akkauntga bogʻlangan. */
  | { status: "conflict"; existing: string; incoming: string }
  | { status: "unavailable" };

/** OAuth tokenidan foydalanib kimlik koʻprigini yozish.

    `/api/v1/me` javobidagi `teacher.id` — LessonLab `principal.user_id`,
    yaʼni AYNAN telegram foydalanuvchi id'si (`bot_users.id`). Shu sababli
    qoʻshimcha endpoint kerak emas.

    ⚠️ Xato YUTILADI (`unavailable`) va import toʻxtamaydi. Sabab: koʻprik
    — QOʻSHIMCHA foyda, importning shartли qismi emas. Koʻprik yozilmasa
    oʻqituvchi baribir oʻz sinflarini koʻchirib oladi; uni yiqitish esa
    ishlaydigan funksiyani buzardi. */
export async function bridgeTelegramIdentity(token: string): Promise<BridgeResult> {
  const teacher = await requireTeacher();

  let telegramId = "";
  let username: string | null = null;
  try {
    const me = await lessonlab<MeResponse>({
      method: "GET", path: "/api/v1/me", accessToken: token,
    });
    telegramId = String(me?.teacher?.id ?? "").trim();
    username = me?.teacher?.username ?? null;
  } catch {
    return { status: "unavailable" };
  }

  // Faqat raqamli id qabul qilinadi: `v_teacher_bridge` koʻrinishi
  // `telegram_id::bigint` cast qiladi va raqamsiz qiymat butun
  // koʻrinishni yiqitardi (u yerda regex filtri bor, lekin buzuq
  // qatorni umuman yozmaslik afzal).
  if (!/^[0-9]+$/.test(telegramId)) return { status: "unavailable" };

  const [mine] = await db
    .select({ telegramId: userTelegram.telegramId })
    .from(userTelegram)
    .where(eq(userTelegram.userId, teacher.id));

  if (mine) {
    return mine.telegramId === telegramId
      ? { status: "already", telegramId }
      // Jimgina qayta yozMAYMIZ: bu «akkauntimni almashtirdim» ham,
      // «boshqa odamning akkauntini tortib olmoqchi» ham boʻlishi
      // mumkin. Qaror foydalanuvchida, kod taxmin qilmaydi.
      : { status: "conflict", existing: mine.telegramId, incoming: telegramId };
  }

  try {
    await db.insert(userTelegram)
      .values({ telegramId, userId: teacher.id, username })
      // Bu telegram akkaunt BOSHQA Ustozona akkauntiga bogʻlangan
      // boʻlishi mumkin (PK — telegram_id). Bunda ham jim oʻtamiz.
      .onConflictDoNothing();
  } catch {
    return { status: "unavailable" };
  }

  return { status: "linked", telegramId };
}
