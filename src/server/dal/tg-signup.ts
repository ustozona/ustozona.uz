import "server-only";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { tgSignupTickets, userTelegram } from "@/server/db/schema";
import { telegramPlaceholderEmail } from "@/lib/placeholder-email";
import type { TicketInfo, CompleteResult } from "@/lib/link-types";

// ⛔ Tiplar `@/lib/link-types` da — qayta eksport qilinmaydi.
// Sabab: o'sha faylning boshidagi izoh.

/* ════════════════════════════════════════════════════════════════════
   TELEGRAM ORQALI ROʻYXATDAN OʻTISH (yoʻnalish C)

   NEGA BU OQIM BOR
   ----------------
   Ilgari faqat ikki yoʻnalish bor edi va ikkalasi ham foydalanuvchidan
   IKKI joyda ish talab qilardi:

     A) Ustozonada roʻyxatdan oʻt → botga bor → biriktir
     B) Botda /start ber → Ustozonada roʻyxatdan oʻt → botga qayt

   2026-08-08 da real foydalanuvchi B yoʻlining oʻrtasida tashlab
   ketdi: veb formani toʻldirdi (ism, familiya, email, parol),
   `/dashboard` ga tushdi va botga qaytishni unutdi — bogʻlanish hech
   qachon yakunlanmadi. Zanjir uzun boʻlgani uchun uzildi.

   Bu yoʻnalish zanjirni QISQARTIRADI: ism-familiya va telegram kimligi
   Telegram profilidan oʻzi keladi, biriktirish esa akkaunt
   yaratilishi bilan BIR PAYTDA boʻladi. Yaʼni «keyin qilinadigan
   qadam» yoʻq, demak tashlab ketiladigan joy ham yoʻq.

   ⛔ PAROL BOTDA SOʻRALMAYDI
   -------------------------
   Chatga yozilgan parol Telegram tarixida qoladi va boshqa seanslarga
   sinxronlanadi. Shuning uchun parol AYNAN shu sahifada, HTTPS ustida
   olinadi. Bot faqat kimlikni tasdiqlaydi (chipta), sirni emas.

   ⚠️ BU FAYLDA `requireTeacher()` YOʻQ — ATAYLAB.
   Bu yerda hali foydalanuvchi YOʻQ; uni shu kod yaratadi. Ruxsatni
   sessiya emas, CHIPTA beradi: uni faqat bot yozadi va faqat oʻsha
   telegram egasiga yuboradi. Shu sababli chipta `account_link_codes`
   dan ALOHIDA jadvalda — sxema izohiga qarang.
   ════════════════════════════════════════════════════════════════════ */


/** Sahifa uchun chipta holati.

    ⚠️ `telegram_id` QAYTARILMAYDI. Sahifaga u kerak emas, brauzerga
    berilgan har qiymat esa keyin ishonchsiz kirish nuqtasi boʻladi —
    yozishda chiptadan qaytadan oʻqiymiz. */
export async function readTicket(token: string): Promise<TicketInfo> {
  if (!token || token.length < 16) return { ok: false, reason: "invalid" };

  const [row] = await db
    .select({
      telegramId: tgSignupTickets.telegramId,
      fullName: tgSignupTickets.fullName,
      used: sql<boolean>`${tgSignupTickets.usedAt} is not null`,
      expired: sql<boolean>`${tgSignupTickets.expiresAt} < now()`,
    })
    .from(tgSignupTickets)
    .where(eq(tgSignupTickets.token, token));

  if (!row) return { ok: false, reason: "invalid" };
  if (row.used) return { ok: false, reason: "used" };
  if (row.expired) return { ok: false, reason: "expired" };

  // Chipta yozilgandan keyin oʻsha telegram boshqa akkauntga
  // bogʻlanib qolgan boʻlishi mumkin (masalan foydalanuvchi paralel
  // ravishda A yoʻlini ham bosib oʻtdi). Sababni SAHIFADA aytamiz —
  // aks holda odam parol oʻylab topib, oxirida tushunarsiz xato olardi.
  const [linked] = await db
    .select({ userId: userTelegram.userId })
    .from(userTelegram)
    .where(eq(userTelegram.telegramId, row.telegramId));
  if (linked) return { ok: false, reason: "taken_tg" };

  return { ok: true, fullName: row.fullName };
}


/** Akkauntni yaratish + telegramni biriktirish — bitta amalda.

    TARTIB MUHIM: avval chipta band qilinadi, keyin akkaunt yaratiladi.
    Teskarisi boʻlsa, ikki marta yuborilgan forma ikkita akkaunt
    yaratardi (ikkinchisi bogʻlanmagan holda qolib, foydalanuvchi
    qaysi biriga kirganini bilmasdi). */
export async function completeTgSignup(input: {
  token: string;
  name: string;
  email: string;
  password: string;
}): Promise<CompleteResult> {
  const token = (input.token ?? "").trim();
  const name = (input.name ?? "").trim().slice(0, 120);
  const email = (input.email ?? "").trim().toLowerCase();
  const password = input.password ?? "";

  if (!token || token.length < 16) return { status: "invalid" };
  if (name.length < 2) return { status: "bad_name" };
  // Better Auth `minPasswordLength: 8` bilan bir xil chegara. Ikki
  // joyda tekshirilishi ataylab: bu yerdagisi aniq xato nomi qaytaradi,
  // Better Auth'dagisi esa haqiqiy darvoza boʻlib qolaveradi.
  if (password.length < 8) return { status: "weak_password" };

  // 1-QADAM — chiptani BAND QILISH (atomik).
  //
  // `used_at IS NULL` shartli UPDATE ... RETURNING: ikki parallel
  // soʻrovdan faqat BITTASI qator oladi, ikkinchisi boʻsh. Yaʼni
  // «ikki marta bosildi» holati bu yerda tugaydi va akkaunt yaratish
  // kodiga umuman yetib bormaydi. Qulf (`FOR UPDATE`) ham ishlardi,
  // lekin bu yerda tranzaksiyani ochiq tutish kerak boʻlardi va
  // ichida Better Auth chaqiriladi — u oʻz ulanishini oladi, yaʼni
  // bitta tranzaksiyaga sigʻmaydi.
  const claimed = await db
    .update(tgSignupTickets)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(tgSignupTickets.token, token),
        isNull(tgSignupTickets.usedAt),
        gt(tgSignupTickets.expiresAt, new Date())
      )
    )
    .returning({ telegramId: tgSignupTickets.telegramId });

  if (claimed.length === 0) {
    // Nega band qilinmadi — aniq sababni ayting, «xato» yetarli emas.
    const info = await readTicket(token);
    return info.ok ? { status: "failed" } : { status: info.reason };
  }

  const telegramId = claimed[0].telegramId;

  // 2-QADAM — telegram allaqachon bogʻlanmaganini tekshirish.
  // `readTicket` ham tekshiradi, lekin u sahifa yuklanganda ishlagan;
  // orasida bogʻlanish paydo boʻlishi mumkin. Bu tekshiruvni olib
  // tashlamang: `user_telegram` 1:1 va busiz akkaunt YARATILIB,
  // biriktirish yiqilardi — yaʼni bogʻlanmagan yetim akkaunt qolardi.
  const [already] = await db
    .select({ userId: userTelegram.userId })
    .from(userTelegram)
    .where(eq(userTelegram.telegramId, telegramId));
  if (already) return { status: "taken_tg" };

  // 3-QADAM — akkaunt. Email boʻsh boʻlsa oʻrinbosar (RFC 2606
  // `.invalid`) — sabab: `lib/placeholder-email.ts`.
  const authEmail = email || telegramPlaceholderEmail(telegramId);

  let userId: string;
  try {
    // `autoSignIn` standart holatda yoqilgan, `nextCookies()` plugin
    // esa Server Action ichida sessiya cookie'sini oʻzi yozadi —
    // yaʼni foydalanuvchi shu yerdan toʻgʻridan-toʻgʻri kirgan boʻladi.
    const res = await auth.api.signUpEmail({
      body: { name, email: authEmail, password },
    });
    userId = res.user.id;
  } catch (err) {
    // Chipta allaqachon band qilingan. Uni QAYTA OCHAMIZ: aks holda
    // parolni juda qisqa yozgan yoki email band boʻlgan odam butun
    // oqimni boshidan (botdan) boshlashga majbur boʻlardi.
    await db
      .update(tgSignupTickets)
      .set({ usedAt: null })
      .where(eq(tgSignupTickets.token, token));

    const code = String(
      (err as { body?: { code?: string } })?.body?.code ?? ""
    );
    if (code === "USER_ALREADY_EXISTS") return { status: "email_taken" };
    if (code.startsWith("PASSWORD_TOO")) return { status: "weak_password" };
    console.error("[tg-signup] akkaunt yaratilmadi:", err);
    return { status: "failed" };
  }

  // 4-QADAM — biriktirish. Bu yerdan keyin qaytish yoʻq: akkaunt bor.
  try {
    await db
      .insert(userTelegram)
      .values({ telegramId, userId })
      // Poyga: shu oraliqda AYNI juftlik yozilgan boʻlishi mumkin
      // (foydalanuvchi paralel ravishda botdagi havolani ham bosdi).
      // Natija bir xil boʻlgani uchun bu xato emas.
      .onConflictDoNothing();

    await db
      .update(tgSignupTickets)
      .set({ createdUserId: userId })
      .where(eq(tgSignupTickets.token, token));
  } catch (err) {
    // Akkaunt yaratildi, biriktirish esa yiqildi. Foydalanuvchini
    // toʻxtatmaymiz — u tizimga kirgan va ishlay oladi; bogʻlanishni
    // Sozlamalardagi mavjud panel orqali yakunlaydi. Jim yutmaymiz:
    // bu holat qoʻlda tekshirilishi kerak.
    console.error("[tg-signup] biriktirish yiqildi (akkaunt yaratildi):", err);
  }

  return { status: "ok" };
}
