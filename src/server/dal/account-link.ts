import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { accountLinkCodes, userTelegram } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";

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

export type LinkState =
  | { linked: true; telegramId: string }
  | { linked: false; deepLink: string; expiresInMinutes: number };

/** Joriy o'qituvchining biriktirish holati + kerak bo'lsa yangi havola.

    Har chaqiruvda YANGI kod berilmaydi-yu, lekin eski ishlatilmagan
    kodlar bekor qilinadi: bir vaqtda bitta faol havola bo'lsin. Aks
    holda foydalanuvchi sahifani bir necha marta ochsa, bir nechta
    yaroqli havola tarqalib ketardi va ularning har biri bog'lanish
    huquqini berardi. */
export async function getOrCreateLink(): Promise<LinkState> {
  const teacher = await requireTeacher();

  const [existing] = await db
    .select({ telegramId: userTelegram.telegramId })
    .from(userTelegram)
    .where(eq(userTelegram.userId, teacher.id));

  if (existing) return { linked: true, telegramId: existing.telegramId };

  const code = randomBytes(24).toString("base64url");

  await db.transaction(async (tx) => {
    // Eski faol kodlarni bekor qilish — «sarflangan» deb belgilanadi,
    // o'chirilmaydi: audit izi qoladi va «nega havolam ishlamadi»
    // savoliga javob topiladi.
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

  return {
    linked: false,
    deepLink: `https://t.me/${BOT_USERNAME}?start=uzl_${code}`,
    expiresInMinutes: TTL_MINUTES,
  };
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

export type UnlinkImpactRow = {
  uzStudentId: string;
  studentName: string;
  className: string;
  gradeCount: number;
  responseCount: number;
  lastActivity: string | null;
};

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

export type RedeemResult =
  | { status: "ok" | "already" }
  | { status: "invalid" | "expired" | "used" | "taken_uz" | "taken_tg" };

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
