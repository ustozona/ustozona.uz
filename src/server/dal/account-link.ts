import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/server/db/client";
import { accountLinkCodes, userTelegram } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import type {
  BotCodePeek, LinkStart, LinkState, RedeemResult, UnlinkImpactRow,
} from "@/lib/link-types";

// ⛔ Tiplar `@/lib/link-types` da — bu yerda TA'RIFLANMAYDI va
// QAYTA EKSPORT ham QILINMAYDI: chaqiruvchi to'g'ridan-to'g'ri
// o'sha modulni import qilsin. Sabab — `lib/link-types.ts` izohi
// (prodni buzgan `ReferenceError`).

/* ════════════════════════════════════════════════════════════════════
   AKKAUNT BIRIKTIRISH — Ustozona ↔ Telegram

   NEGA RO'YXATDAN O'TISH PAYTIDA, KEYIN EMAS
   ------------------------------------------
   Kimliklarni keyin moslashtirish ishonchsiz: `bot_users` da email
   yo'q, `teachers` da telegram id yo'q. Ismga qarab taxmin qilish esa
   XAVFLI — o'xshash ismli ikki o'qituvchi bir-birining sinfini,
   o'quvchilarini va BAHOLARINI ko'rib qolardi. Bu maxfiylik buzilishi,
   shunchaki nosozlik emas.

   2026-08-05 buni amalda ko'rsatdi: 8 sinf va 94 o'quvchi bog'lanmagan
   nusxa bo'lib qoldi va ularni faqat QO'LDA, ro'yxatlarni taqqoslab
   bog'lash mumkin bo'ldi.

   KOD — SIR
   ---------
   Uni qo'lga kiritgan odam O'Z telegramini begona Ustozona akkauntiga
   bog'lab olardi. Shuning uchun: kriptografik tasodifiy (24 bayt),
   qisqa umr (15 daqiqa), BIR MARTALIK.

   ⚠️ Telegram `start` payload — 64 belgi, faqat `A-Za-z0-9_-`.
   `uzl_` (4) + base64url(24 bayt) = 4 + 32 = 36 belgi. Sig'adi.
   Kodni uzaytirsangiz shu chegarani tekshiring: oshsa Telegram
   havolani JIMGINA kesadi va bog'lanish har doim «invalid» beradi.
   ════════════════════════════════════════════════════════════════════ */

const BOT_USERNAME = process.env.LESSONLAB_BOT_USERNAME || "uzlessonlabbot";
const TTL_MINUTES = 15;

/** Saytda koʻrsatiladigan 4 xonali TASDIQ kodi — havola sirining hosilasi.

    NEGA KERAK: bot (@uzlessonlabbot) `/start uzl_<kod>` da endi darhol
    bogʻlamaydi — qaysi Ustozona akkaunti ekanini koʻrsatadi va shu kodni
    raqamli klaviaturada TERDIRADI. Begona yuborgan havolani koʻr-koʻrona
    bosgan odam saytni koʻrmayapti va toʻgʻri kodni bilmaydi: tasodifan
    topish ehtimoli 1/10000, bitta xato havolani bekor qiladi. («Uch
    variantdan tanlash» da bu 1/3 edi — shuning uchun terishga oʻtildi.)

    ⚠️ Formula LessonLab bilan AYNAN bir xil boʻlishi SHART
    (`services/uz_link_confirm.py: confirm_code_of`), aks holda hech kim
    bogʻlana olmaydi. Namuna: `confirmCodeOf("AbCdEfGhIjKlMnOpQrStUvWxYz012345")
    === "8158"` — ikkala tomonda test bilan qotirilgan. Bazaga ustun
    qoʻshilmadi: jadval ikki loyiha uchun umumiy. */
export function confirmCodeOf(code: string): string {
  const digest = createHash("sha256").update(`uzl-confirm:${code}`).digest("hex");
  return String(parseInt(digest.slice(0, 8), 16) % 10000).padStart(4, "0");
}

function unlinked(code: string, expiresInMinutes: number): LinkState {
  return {
    linked: false,
    deepLink: `https://t.me/${BOT_USERNAME}?start=uzl_${code}`,
    expiresInMinutes,
    confirmCode: confirmCodeOf(code),
  };
}

/* ⛔ `LINK_REQUIRED` / `LESSONLAB_LINK_REQUIRED` OLIB TASHLANDI (2026-08-10)

   U «bog'lanish majburiy» darvozasini yoqib-o'chirish uchun edi. Darvoza
   endi yo'q (`dashboard/layout.tsx` dagi izohga qarang), shuning uchun
   bayroq ham keraksiz — turgan bo'lsa «bu yerda majburiylik bor» degan
   yolg'on taassurot berardi.

   ⚠️ Vercel'da `LESSONLAB_LINK_REQUIRED` qolgan bo'lsa endi HECH NARSA
   qilmaydi. Zarari yo'q, lekin olib tashlangani ma'qul.

   Bog'lanish MAJBURIYLIGI qaytarilishi kerak bo'lsa, u global bayroq
   emas, PER-USER shart bo'lishi kerak: faqat botda haqiqatan ma'lumoti
   bor o'qituvchiga. Buni oldindan bilib bo'lmaydi — `telegram_id`
   bog'langandan keyin ma'lum bo'ladi va `bot_users` da email yo'q, ya'ni
   moslashtirishning boshqa yo'li ham yo'q. Yagona signal — o'qituvchining
   O'ZIDAN so'rash. */

/** Bog'lanish holati — Sozlamalar, Profil va import oqimi uchun. */
export async function getLinkStatus(): Promise<LinkState> {
  return getOrCreateLink();
}

/** Oʻyinlarga avtomatik kirish uchun (`server/lessonlab/games-sso.ts`):
    foydalanuvchiga bogʻlangan Telegram ID yoki `null`. Faqat OʻQIYDI —
    `getOrCreateLink` dan farqli, havola kodi yaratmaydi. Chaqiruvchi
    rol va sessiyani oʻzi tekshirgan boʻladi. */
export async function linkedTelegramIdOf(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ telegramId: userTelegram.telegramId })
    .from(userTelegram)
    .where(eq(userTelegram.userId, userId))
    .limit(1);
  return row?.telegramId ?? null;
}

/** Joriy o'qituvchining biriktirish holati + kerak bo'lsa yangi havola.

    ⚠️ IDEMPOTENT — MAVJUD FAOL KOD BO'LSA O'SHANI QAYTARADI.

    Bu funksiya bot tomonidagi `create_tg_link_code()` bilan bir xil
    xato tarixiga ega edi (2026-08-08 da botda ushlangan, bu yerda
    ham xuddi shu naqsh bor ekan): ilgari HAR chaqiruvda eski kodni
    bekor qilib, yangisini yaratardi.

    Bu funksiya endi dashboard'dagi GATE tomonidan QAYTA-QAYTA
    chaqiriladi (har sahifa yuklanganda «bog'langanmi?» tekshiradi).
    Eski, "har doim yangi kod" xatti-harakati bilan bu FALOKAT bo'lardi:
    o'qituvchi Telegram'da havolani ochib ulgurmasdan, dashboard'ning
    o'zi uni orqa fonda qayta-qayta bekor qilib turardi — havola
    umuman ISHLAMAY qolardi.

    Shuning uchun: mavjud, muddati o'tmagan, ishlatilmagan kod bo'lsa
    O'SHA qaytariladi. Yangi kod faqat eskisi yo'q yoki muddati
    o'tganda yaratiladi. */
export async function getOrCreateLink(): Promise<LinkState> {
  const teacher = await requireTeacher();

  const [existing] = await db
    .select({ telegramId: userTelegram.telegramId })
    .from(userTelegram)
    .where(eq(userTelegram.userId, teacher.id));

  if (existing) return { linked: true, telegramId: existing.telegramId };

  const [active] = await db
    .select({ code: accountLinkCodes.code, expiresAt: accountLinkCodes.expiresAt })
    .from(accountLinkCodes)
    .where(and(
      eq(accountLinkCodes.uzUserId, teacher.id),
      isNull(accountLinkCodes.usedAt),
      gt(accountLinkCodes.expiresAt, new Date()),
    ))
    .orderBy(desc(accountLinkCodes.createdAt))
    .limit(1);

  if (active) {
    const remaining = Math.max(
      1, Math.ceil((active.expiresAt.getTime() - Date.now()) / 60_000));
    return unlinked(active.code, remaining);
  }

  const code = randomBytes(24).toString("base64url");

  await db.transaction(async (tx) => {
    // Eski, MUDDATI O'TGAN yoki ishlatilgan bo'lmagan qatorlarni ham
    // "sarflangan" deb belgilaymiz — audit izi uchun, o'chirilmaydi.
    // Faol (hali amal qiluvchi) kod bo'lsa bu yergacha yetib kelmaymiz
    // (yuqoridagi `if (active)` uni ushlab qoladi).
    await tx
      .update(accountLinkCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(accountLinkCodes.uzUserId, teacher.id),
                 isNull(accountLinkCodes.usedAt)));

    await tx.insert(accountLinkCodes).values({
      code,
      uzUserId: teacher.id,
      expiresAt: sql`now() + interval '${sql.raw(String(TTL_MINUTES))} minutes'`,
    });
  });

  return unlinked(code, TTL_MINUTES);
}

/** Bogʻlash oynasi uchun: holat + havolaning QR kodi (kompyuterda
    telefon bilan skanerlash). QR faqat oyna ochilganda yasaladi —
    har soʻrovda emas (`getOrCreateLink` holat tekshiruvida koʻp chaqiriladi). */
export async function startTelegramLink(): Promise<LinkStart> {
  const state = await getOrCreateLink();
  if (state.linked) return state;
  const qrSvg = await QRCode.toString(state.deepLink, {
    type: "svg", margin: 1, errorCorrectionLevel: "L",
  });
  return { ...state, qrSvg };
}

/** Telegram biriktirishini UZISH — «boshqa telegramga ulab qoʻydim».

    NEGA BU KERAK: havolani notoʻgʻri telegram akkauntda ochib yuborish
    oson (ish telefoni, oilaviy qurilma, eski akkaunt). Uzish yoʻli
    boʻlmasa foydalanuvchi tiqilib qolardi — har urinishda `taken_uz`
    qaytaverardi va yechim faqat administrator orqali boʻlardi.

    KIM UZA OLADI — «oʻz yarmini»
    -----------------------------
    Bu funksiya `requireTeacher()` ortida, yaʼni chaquruvchi USTOZONA
    akkaunti egasi. U oʻz akkauntidan istalgan telegramni uzishga
    haqli. Teskarisi bot tomonida: `/telegram_uzish` — u yerda
    chaqiruvchi TELEGRAM egasi. Ikkalasi birga har qanday notoʻgʻri
    bogʻlanishni yechadi va administrator kerak boʻlmaydi.

    ⚠️ `class_links` / `roster_links` TEGILMAYDI. Ular aniq qatorlar
    orasidagi bogʻlanish va kimlik koʻprigiga bogʻliq emas. Ularni ham
    oʻchirish oʻqituvchining sinflarini «yangi» qilib koʻrsatardi va
    keyingi import DUBLIKAT yaratardi — aynan tuzatilayotgan xato.

    Sinf, oʻquvchi va baho HECH QACHON oʻchmaydi. */
export async function unlinkTelegram(
  opts: { confirmed?: boolean } = {}
): Promise<LinkState | { blocked: true; impact: UnlinkImpactRow[] }> {
  const teacher = await requireTeacher();

  // IKKI QADAM — nega darhol uzilmaydi.
  // Bogʻlanish notoʻgʻri boʻlgan boʻlsa, u amal qilgan vaqt ichida
  // natijalar YOZILGAN boʻlishi mumkin, yaʼni baholar boshqa odamning
  // oʻquvchilariga tushgan boʻlishi mumkin. Oʻqituvchi buni koʻrmasdan
  // tugmani bosmasligi kerak — `partner_merge.py` dagi
  // `impact_if_deleted` bilan bir xil qoida.
  if (!opts.confirmed) {
    const impact = await getUnlinkImpact();
    // Baho ham, javob ham boʻlmasa tasdiq SOʻRALMAYDI: keraksiz qadam
    // foydalanuvchini charchatadi va u oʻqimasdan bosishga oʻrganadi.
    if (impact.length > 0) return { blocked: true, impact };
  }

  await db.delete(userTelegram).where(eq(userTelegram.userId, teacher.id));
  // Darhol yangi havola beramiz: uzish — oʻz-oʻzicha maqsad emas,
  // foydalanuvchi TOʻGʻRI akkauntga qayta bogʻlamoqchi.
  return getOrCreateLink();
}


/** Biriktirishni oʻzgartirishdan oldin koʻrsatiladigan oqibat.

    ⚠️ Taʼrif SQL funksiyasida (`account_unlink_impact`), bu yerda
    EMAS — bot tomoni ham AYNAN oʻshani chaqiradi. Ikki kodbazada
    alohida yozilsa ular ajralib ketardi va bir tomon «xavf yoʻq»,
    ikkinchisi «5 ta baho bor» derdi. Bu turdagi jimgina ajralish
    2026-08-08 da `norm_name` da allaqachon topilgan — takrorlanmasin.

    Boʻsh roʻyxat = xavf yoʻq, darhol oʻzgartirish mumkin. */
export async function getUnlinkImpact(): Promise<UnlinkImpactRow[]> {
  const teacher = await requireTeacher();
  const rows = await db.execute<{
    uz_student_id: string; student_name: string; class_name: string;
    grade_count: number | string; response_count: number | string;
    last_activity: string | null;
  }>(sql`SELECT * FROM account_unlink_impact(${teacher.id})`);

  return Array.from(rows).map((r) => ({
    uzStudentId: r.uz_student_id,
    studentName: r.student_name,
    className: r.class_name,
    // postgres-js `count(*)` ni bigint sifatida qaytaradi va u JS'ga
    // STRING boʻlib keladi — `Number()` siz «5» + 1 = «51» boʻlardi.
    gradeCount: Number(r.grade_count),
    responseCount: Number(r.response_count),
    lastActivity: r.last_activity,
  }));
}


/** Yoʻnalish B, 1-qadam: kod qaysi Telegram akkauntga tegishli — HECH
    NARSA YOZMAYDI. `/bogla` sahifasi uni koʻrsatib, tasdiq tugmasini
    kutadi.

    NEGA: ilgari `/bogla?c=…` ochilishi bilanoq (GET) bogʻlardi. Begona
    odam oʻz botidan olgan havolani yuborsa, uni ochgan oʻqituvchining
    Ustozona akkaunti BEGONA Telegramga bogʻlanib qolardi va u Telegram
    orqali oʻqituvchining sinf va oʻquvchilari koʻrinardi. Holat
    oʻzgartiradigan amal GET da boʻlmasligi kerak — endi faqat tugma
    (Server Action, POST) bilan. */
export async function peekBotCode(code: string): Promise<BotCodePeek> {
  await requireTeacher();
  if (!code || code.length < 16 || code.length > 128) return { status: "invalid" };

  const rows = await db.execute<{
    expired: boolean; used: boolean; full_name: string | null; username: string | null;
  }>(sql`
    SELECT c.expires_at < now() AS expired, c.used_at IS NOT NULL AS used,
           b.full_name, b.username
    FROM account_link_codes c
    LEFT JOIN bot_users b ON b.id::text = c.telegram_id
    WHERE c.code = ${code} AND c.telegram_id IS NOT NULL
  `);
  const row = Array.from(rows)[0];
  if (!row) return { status: "invalid" };
  if (row.used) return { status: "used" };
  if (row.expired) return { status: "expired" };
  return {
    status: "ok",
    telegramName: (row.full_name ?? "").trim() || "Telegram",
    telegramUsername: row.username ?? null,
  };
}


/** Yo'nalish B: bot bergan kodni Ustozona tomonida ishlatish.

    Foydalanuvchi avval botda `/start` bergan, Ustozona akkaunti hali
    yo'q edi. Ro'yxatdan o'tgach `/bogla?c=<code>` ga tushadi va shu
    yerda biriktiriladi.

    Yozish `redeem_uz_link_code()` (Python) bilan bir xil qoidaga
    bo'ysunadi: mavjud bog'lanish JIMGINA qayta yozilmaydi. */
export async function redeemBotCode(code: string): Promise<RedeemResult> {
  const teacher = await requireTeacher();
  if (!code || code.length < 16) return { status: "invalid" };

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        telegramId: accountLinkCodes.telegramId,
        expired: sql<boolean>`${accountLinkCodes.expiresAt} < now()`,
        used: sql<boolean>`${accountLinkCodes.usedAt} is not null`,
      })
      .from(accountLinkCodes)
      .where(and(eq(accountLinkCodes.code, code),
                 sql`${accountLinkCodes.telegramId} is not null`))
      // Havolani ikki marta bosish odatiy — qulfsiz ikkala so'rov ham
      // kodni yaroqli deb ko'rib, ikkita bog'lanish yozishga urinardi.
      .for("update");

    if (!row || !row.telegramId) return { status: "invalid" } as const;
    if (row.used) return { status: "used" } as const;
    if (row.expired) return { status: "expired" } as const;

    const [mine] = await tx
      .select({ telegramId: userTelegram.telegramId })
      .from(userTelegram)
      .where(eq(userTelegram.userId, teacher.id));

    if (mine) {
      if (mine.telegramId === row.telegramId) {
        await tx.update(accountLinkCodes).set({ usedAt: new Date() })
          .where(eq(accountLinkCodes.code, code));
        return { status: "already" } as const;
      }
      return { status: "taken_uz" } as const;
    }

    const [otherOwner] = await tx
      .select({ userId: userTelegram.userId })
      .from(userTelegram)
      .where(eq(userTelegram.telegramId, row.telegramId));
    if (otherOwner) return { status: "taken_tg" } as const;

    await tx.insert(userTelegram).values({
      telegramId: row.telegramId, userId: teacher.id,
    });
    await tx.update(accountLinkCodes).set({ usedAt: new Date() })
      .where(eq(accountLinkCodes.code, code));

    return { status: "ok" } as const;
  });
}
