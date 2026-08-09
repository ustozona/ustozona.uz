import { index, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { classes, students } from "./classes";
import { activitySets } from "./assess";
import { teachers } from "./teachers";
import { user } from "./auth";

/* ════════════════════════════════════════════════════════════════════
   BITTA TIZIM — Ustozona ↔ LessonLab bog'lash qatlami

   Ikkala mahsulot 2026-08-05 dan BITTA Supabase loyihasida
   (`docs/supabase-kochish.md`). Lekin sinf/oʻquvchi ikki xil jadvalda
   yashaydi va bu oʻz-oʻzidan birlashmaydi:

       LessonLab (bot) │ bot_classes(int)   bot_students(int)
       Ustozona  (web) │ classes(uuid)      students(uuid)

   ⛔ YECHIM NUSXA OLISH EMAS — BOGʻLASH
   ------------------------------------
   Baza bitta boʻlgani uchun maʼlumotni koʻchirishning hojati yoʻq.
   Har tizim OʻZ qatorida qoladi, bogʻlanish ularni bitta mantiqiy
   sinf/bola deb eʼlon qiladi, oʻqish esa `v_unified_*` koʻrinishlari
   orqali BITTA manbadan ketadi.

   Nusxa modelida ikki qator mustaqil yashaydi va vaqt oʻtib ajralib
   ketadi: botda ism tuzatilsa Ustozonada eskisi qolardi. Bogʻlangan
   qatorda esa haqiqat bitta.

   NEGA BU JADVALLARDA `references()` YOʻQ
   ---------------------------------------
   `ll_*_id` ustunlari `bot_classes` / `bot_students` ga ishora qiladi,
   ular esa LessonLab tomonining jadvallari va Drizzle sxemasida
   taʼriflanmagan. HAQIQIY FK bazada bor (ON DELETE CASCADE bilan) —
   `supabase/migrations/20260808_cross_platform_links.sql`. Bu yerda
   faqat TUR eʼlon qilinadi, aks holda drizzle-kit mavjud bot
   jadvallarini «begona» deb hisoblab oʻchirishga urinardi.

   ⚠️ Shu sababli `db:generate` bu fayldan migratsiya YASAMASIN —
   jadvallar allaqachon bazada. Sxema faqat OʻQISH/YOZISH uchun tur
   beradi.
   ════════════════════════════════════════════════════════════════════ */

/** Bogʻlanish qanday paydo boʻlgani — nosozlikni izlash uchun. */
export type LinkedBy = "import" | "backfill" | "shadow" | "manual";
export type LinkOrigin = "lessonlab" | "ustozona";

/** bot_classes ↔ classes, 1:1.

    Ikkita yagonalik cheklovi (PK + UNIQUE) dublikatni BAZADA imkonsiz
    qiladi. Kod xato yozsa `unique_violation` oladi — jimgina ikkinchi
    nusxa yaratmaydi. Ilgari dedup faqat ilova mantigʻida edi va aynan
    shu sababli yoʻqolib qoldi (2026-08-05: 8 sinf, 94 oʻquvchi
    bogʻlanmagan nusxa boʻlib qoldi). */
export const classLinks = pgTable(
  "class_links",
  {
    llClassId: integer("ll_class_id").primaryKey(),
    uzClassId: text("uz_class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    origin: text("origin").$type<LinkOrigin>().notNull(),
    linkedBy: text("linked_by").$type<LinkedBy>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("class_links_uz_uniq").on(t.uzClassId)]
);

/** bot_students ↔ students, 1:1 — bitta bolaning ikki tizimdagi qatori.

    ⚠️ NOMI `student_links` EMAS — u BAND va butunlay boshqa narsa:
    `student_links` = ota-ona ↔ bola ruxsati (`schema/identity.ts`). */
export const rosterLinks = pgTable(
  "roster_links",
  {
    llStudentId: integer("ll_student_id").primaryKey(),
    uzStudentId: text("uz_student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    origin: text("origin").$type<LinkOrigin>().notNull(),
    linkedBy: text("linked_by").$type<LinkedBy>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("roster_links_uz_uniq").on(t.uzStudentId),
    index("roster_links_uz_idx").on(t.uzStudentId),
  ]
);

/** bot_tests ↔ activity_sets, 1:1 — bitta testning ikki tizimdagi qatori.

    NEGA QOʻSHILDI (2026-08-09)
    ---------------------------
    Sinf va oʻquvchi 2026-08-08 da nusxadan bogʻlashga oʻtkazildi, TEST
    esa chetda qolgan: `importTests()` hamon nusxalar va dedupni NOM
    boʻyicha qilardi. Bu `docs/CROSS_PLATFORM.md` §2 dagi «halokatli»
    naqshning aynan oʻzi va uchta oʻlchanadigan oqibati bor edi:

      1. Botda savol tuzatilsa — Ustozonada ESKISI qolardi (qayta import
         «nizo» deb oʻtkazib yuborardi, tuzatish hech qachon oʻtmasdi).
      2. Botda test NOMI oʻzgartirilsa — IKKINCHI NUSXA paydo boʻlardi.
      3. «Bu toʻplam aynan oʻsha bot testi» degan fakt saqlanmasdi, yaʼni
         keyin avtomatik bogʻlash ham imkonsiz edi.

    NEGA `activity_sets` DARAJASIDA (savol darajasida EMAS)
    ------------------------------------------------------
    LessonLab testi = savollar toʻplami, Ustozonada unga mos keladigan
    narsa `activity_sets` (sessiya AYNAN toʻplam ustida ochiladi). Har
    savol alohida `activities` qatori, yaʼni savol darajasidagi
    bogʻlanish 1:N boʻlardi va yagonalik kafolati yoʻqolardi.

    `references()` bu yerda YOʻQ — sababi fayl boshidagi izohda
    (`ll_test_id` → `bot_tests`, u Drizzle sxemasida taʼriflanmagan).
    Haqiqiy FK bazada:
    `supabase/migrations/20260809_test_links.sql`. */
export const testLinks = pgTable(
  "test_links",
  {
    llTestId: integer("ll_test_id").primaryKey(),
    uzSetId: text("uz_set_id")
      .notNull()
      .references(() => activitySets.id, { onDelete: "cascade" }),
    origin: text("origin").$type<LinkOrigin>().notNull(),
    linkedBy: text("linked_by").$type<LinkedBy>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("test_links_uz_uniq").on(t.uzSetId),
    index("test_links_uz_idx").on(t.uzSetId),
  ]
);

export type TestLinkRow = typeof testLinks.$inferSelect;

/** Import hisoboti — «nima o'tdi, nima o'tmadi va NEGA».

    NEGA QO'SHILDI (2026-08-09)
    ---------------------------
    `importRoster()` / `importTests()` batafsil hisobot tuzadi
    (`conflicts`, `skipped` — nomi va sababi bilan), lekin callback uni
    URL'ga faqat SON sifatida qaytarardi. O'qituvchi «2 ta nizo» ni
    ko'rardi, lekin QAYSI test ekanini bilmasdi.

    Bu nazariy noqulaylik emas: 2026-08 da `full.test.questions` har
    doim `undefined` bo'lgani uchun 25 testdan 25 tasi jimgina «savoli
    yo'q» deb tashlab yuborilgan va ekranda faqat son turgani uchun
    nosozlik UZOQ VAQT ko'rinmagan.

    Jadval tanlandi, URL yoki cookie emas: 25 ta nom URL'ga sig'maydi
    (va havolada ko'rinib qolardi), cookie esa 4 KB da JIMGINA
    kesiladi — ya'ni «jim yo'qolish» muammosini yechayotib uni qayta
    yaratardik.

    Jadval `supabase/migrations/20260809c_sync_reports.sql` da;
    bu yerda faqat TUR e'lon qilinadi (fayl boshidagi izohga qarang —
    `db:generate` bu fayldan migratsiya YASAMASLIGI kerak). */
export const syncReports = pgTable(
  "sync_reports",
  {
    id: text("id").primaryKey(),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"roster" | "tests">().notNull(),
    summary: jsonb("summary")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    details: jsonb("details")
      .$type<SyncReportDetail[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sync_reports_teacher_idx").on(t.teacherId, t.createdAt)]
);

/** Hisobotdagi bitta satr. `group` — nima uchun o'tmagani turi:
      conflict — nomi band, lekin bog'lanmagan (qaror o'qituvchida)
      skipped  — ko'chirib bo'lmadi (savoli yo'q, javobi yo'q...) */
export type SyncReportDetail = {
  group: "conflict" | "skipped";
  kind: string;
  name: string;
  reason: string;
};

export type SyncReportRow = typeof syncReports.$inferSelect;

/** Ro'yxatdan o'tishda akkauntlarni biriktirish uchun bir martalik kod.

    Ikki yo'nalish, bittasi yetarli emas (foydalanuvchi qaysi tomondan
    kelishini tanlamaydi):
      `uzUserId` to'ldirilgan → Ustozonada ro'yxatdan o'tdi, botga boradi
      `telegramId` to'ldirilgan → botda /start berdi, Ustozonaga boradi

    ⚠️ Kod SIR: uni qo'lga kiritgan odam o'z telegramini begona Ustozona
    akkauntiga bog'lab olardi. Shuning uchun qisqa umr + bir martalik. */
export const accountLinkCodes = pgTable("account_link_codes", {
  code: text("code").primaryKey(),
  uzUserId: text("uz_user_id").references(() => user.id, { onDelete: "cascade" }),
  telegramId: text("telegram_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  /** Ishlatilgan kod qayta ishlamaydi. O'chirilmaydi — audit izi qoladi. */
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export type AccountLinkCodeRow = typeof accountLinkCodes.$inferSelect;
export type NewAccountLinkCodeRow = typeof accountLinkCodes.$inferInsert;

/** Telegram orqali Ustozona akkauntini YARATISH uchun bir martalik chipta.

    Yoʻnalish C — yuqoridagi ikkitasidan farqli: bu yerda Ustozona
    akkaunti HALI YOʻQ. Foydalanuvchi Ustozonadagi «Telegram bilan
    davom etish» tugmasini bosadi → botga tushadi → bot uni tanib
    (telegram_id, ism — Telegram profilidan) shu jadvalga chipta yozadi
    → Ustozona chiptani ishlatib akkauntni yaratadi va telegramni
    DARHOL biriktiradi.

    ⛔ NEGA `accountLinkCodes` GA QOʻSHILMADI — XAVFSIZLIK
    -----------------------------------------------------
    `redeemBotCode()` kodni «hozir kirgan oʻqituvchi»ga biriktiradi.
    Chipta oʻsha jadvalda boʻlsa, tizimga kirgan BEGONA odam yangi
    foydalanuvchining chiptasini ishlatib, oʻsha telegramni OʻZ
    akkauntiga bogʻlab olardi — `taken_tg` tekshiruvi uni toʻxtatmaydi,
    chunki telegram hali hech kimga bogʻlanmagan. Alohida jadval bu
    yoʻlni butunlay yopadi.

    ⚠️ `token` SIR: uni qoʻlga kiritgan odam boshqa odamning telegramiga
    bogʻlangan akkaunt yaratib olardi. 24 bayt, 15 daqiqa, bir martalik.

    Bazada `tg_signup_tickets_one_active` — telegram_id boʻyicha qismli
    UNIQUE indeks (`used_at IS NULL` boʻlganlar uchun). Yaʼni bitta
    telegramda bir vaqtda faqat BITTA faol chipta boʻladi; bu Drizzle
    sxemasida ifodalanmaydi, shuning uchun shu yerda yozib qoʻyildi. */
export const tgSignupTickets = pgTable("tg_signup_tickets", {
  token: text("token").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  /** Telegram profilidagi ism — formada oldindan toʻldiriladi (tahrirlanadi). */
  fullName: text("full_name").notNull().default(""),
  tgUsername: text("tg_username"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  /** Chipta natijasida yaratilgan akkaunt — audit izi. */
  createdUserId: text("created_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
});

export type TgSignupTicketRow = typeof tgSignupTickets.$inferSelect;

export type ClassLinkRow = typeof classLinks.$inferSelect;
export type NewClassLinkRow = typeof classLinks.$inferInsert;
export type RosterLinkRow = typeof rosterLinks.$inferSelect;
export type NewRosterLinkRow = typeof rosterLinks.$inferInsert;
