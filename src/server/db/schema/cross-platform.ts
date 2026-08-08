import { index, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { classes, students } from "./classes";
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

export type ClassLinkRow = typeof classLinks.$inferSelect;
export type NewClassLinkRow = typeof classLinks.$inferInsert;
export type RosterLinkRow = typeof rosterLinks.$inferSelect;
export type NewRosterLinkRow = typeof rosterLinks.$inferInsert;
