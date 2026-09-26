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
  /** Bu telegram akkaunt BOSHQA Ustozona akkauntiga bogʻlangan. */
  | { status: "taken_tg"; telegramId: string }
  | { status: "unavailable" };

/** OAuth tokenidan foydalanib kimlik koʻprigini yozish.

    `/api/v1/me` javobidagi `teacher.id` — LessonLab `principal.user_id`,
    yaʼni AYNAN telegram foydalanuvchi id'si (`bot_users.id`). Shu sababli
    qoʻshimcha endpoint kerak emas.

    ⚠️ TEXNIK xato YUTILADI (`unavailable`) va import toʻxtamaydi.
    Sabab: koʻprik — QOʻSHIMCHA foyda, importning shartli qismi emas.
    Koʻprik yozilmasa oʻqituvchi baribir oʻz sinflarini koʻchirib oladi;
    uni yiqitish esa ishlaydigan funksiyani buzardi.

    ⛔ Lekin `taken_tg` va `conflict` — texnik xato EMAS, egalik nizosi.
    Ularda chaqiruvchi importni BOSHLAMASLIGI shart
    (`app/api/lessonlab/callback/route.ts`). */
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

  /* ⛔ 1:1 QOIDASI — bu yerda ham AYNAN A/B/C yoʻllaridagidek.

     `redeem_uz_link_code()` (bot, Python), `redeemBotCode()` va
     `completeTgSignup()` uchchalasi bir xil ishlaydi: mavjud
     bogʻlanish JIMGINA qayta yozilmaydi va band telegram akkaunt
     `taken_tg` bilan rad etiladi. OAuth yoʻli (D) esa 2026-08-10 gacha
     istisno edi — `onConflictDoNothing()` yozilmaganini TEKSHIRMASDAN
     `linked` qaytarardi.

     Oqibati faqat notoʻgʻri xabar emas edi: chaqiruvchi natijani
     koʻrmay importni davom ettirardi, yaʼni telegram X allaqachon
     Ustozona akkaunti A ga bogʻlangan boʻlsa ham, uning sinf va
     oʻquvchilari akkaunt B ga koʻchib oʻtardi. Bu — ikki hisob
     oʻrtasida maʼlumot aralashuvi.

     Tranzaksiya kerak: tekshiruv bilan yozuv orasida boshqa soʻrov
     oʻsha telegram id'ni band qilib ulgurishi mumkin. */
  try {
    return await db.transaction(async (tx) => {
      const [mine] = await tx
        .select({ telegramId: userTelegram.telegramId })
        .from(userTelegram)
        .where(eq(userTelegram.userId, teacher.id));

      if (mine) {
        return mine.telegramId === telegramId
          ? ({ status: "already", telegramId } as const)
          // Jimgina qayta yozMAYMIZ: bu «akkauntimni almashtirdim» ham,
          // «boshqa odamning akkauntini tortib olmoqchi» ham boʻlishi
          // mumkin. Qaror foydalanuvchida, kod taxmin qilmaydi.
          : ({ status: "conflict", existing: mine.telegramId,
               incoming: telegramId } as const);
      }

      const [otherOwner] = await tx
        .select({ userId: userTelegram.userId })
        .from(userTelegram)
        .where(eq(userTelegram.telegramId, telegramId))
        // Qator bor boʻlsa qulflaymiz — parallel callback uni oʻzgartira
        // olmaydi. Qator yoʻq boʻlsa qulflanadigan narsa ham yoʻq, shu
        // sababli pastda yozuv natijasi ALOHIDA tekshiriladi.
        .for("update");
      if (otherOwner) return { status: "taken_tg", telegramId } as const;

      const written = await tx
        .insert(userTelegram)
        .values({ telegramId, userId: teacher.id, username })
        // Maqsadsiz `DO NOTHING` — telegram_id (PK) ham, user_id
        // (UNIQUE) ham toʻqnashuv sababi boʻlishi mumkin.
        .onConflictDoNothing()
        .returning({ telegramId: userTelegram.telegramId });

      // ⚠️ Yozilmagan boʻlishi ham mumkin — «yozdim» deb aytmaymiz.
      if (written.length === 0) {
        const [tgOwner] = await tx
          .select({ userId: userTelegram.userId })
          .from(userTelegram)
          .where(eq(userTelegram.telegramId, telegramId));
        if (tgOwner) {
          return tgOwner.userId === teacher.id
            ? ({ status: "already", telegramId } as const)
            : ({ status: "taken_tg", telegramId } as const);
        }
        // Telegram tomonida ega yoʻq — demak toʻsiq `user_id` unikaligi:
        // shu orada akkauntimiz BOSHQA telegramga bogʻlanib ulgurgan.
        const [nowMine] = await tx
          .select({ telegramId: userTelegram.telegramId })
          .from(userTelegram)
          .where(eq(userTelegram.userId, teacher.id));
        return nowMine
          ? ({ status: "conflict", existing: nowMine.telegramId,
               incoming: telegramId } as const)
          : ({ status: "unavailable" } as const);
      }

      return { status: "linked", telegramId } as const;
    });
  } catch {
    return { status: "unavailable" };
  }
}
