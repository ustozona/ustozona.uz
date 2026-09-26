import { boolean, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { user } from "./auth";

/* ════════════════════════════════════════════════════════════════════
   USTOZONA BOTI — kirish, bogʻlash va bildirishnomalar

   Kimlik (Ustozona user ↔ telegram_id) avvalgidek `user_telegram` da
   (identity.ts) — u LessonLab boti bilan UMUMIY jadval va unga ustun
   qoʻshilmaydi. Bu fayldagi jadvallar faqat Ustozona botining OʻZ
   holati: kim botni ishga tushirgan, qanday telefon yuborgan, qanday
   xabar olishni xohlaydi.

   ⚠️ LessonLab'ning `bot_users` jadvali bilan adashtirmang — u boshqa
   bot, boshqa maʼlumot. Shuning uchun bu yerda nom `tg_chats`.
   ════════════════════════════════════════════════════════════════════ */

/** Ustozona botini kamida bir marta ishga tushirgan Telegram foydalanuvchisi.

    Kalit `telegram_id` — username oʻzgaradi yoki umuman boʻlmaydi.
    Shaxsiy suhbatda `chat_id` = `telegram_id`, lekin Bot API baribir
    `chat_id` bilan ishlaydi, shuning uchun alohida saqlanadi.

    Telefon SHU yerda, `user` da emas: u faqat Telegram kontakti orqali
    keladi (`contact.user_id === from.id` tekshiruvi bilan), yaʼni
    Telegram tasdiqlagan raqam. Qoʻlda yozilgan raqam bu ustunga
    tushmaydi. */
export const tgChats = pgTable("tg_chats", {
  telegramId: text("telegram_id").primaryKey(),
  chatId: text("chat_id").notNull(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  languageCode: text("language_code"),
  /** E.164 shaklida (`+998901234567`). */
  phone: text("phone"),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  /** Bot bloklangan (403) yoki suhbat oʻchirilgan — xabar yuborilmaydi.
      Foydalanuvchi qayta `/start` bossa yoki blokdan chiqarsa `null`. */
  blockedAt: timestamp("blocked_at", { withTimezone: true }),
  /** Marketing roziligi — tizim xabarlaridan (darslar, kirish) ALOHIDA.
      Ikkalasi `null` — hali soʻralmagan. */
  marketingConsentAt: timestamp("marketing_consent_at", { withTimezone: true }),
  marketingOptOutAt: timestamp("marketing_opt_out_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Telegram orqali kirish / bogʻlash soʻrovi.

    OQIM: sayt soʻrov yaratadi → foydalanuvchi `t.me/<bot>?start=<kind>_<id>`
    ni ochadi → botda saytdagi kodni tanlaydi → sayt (soʻrovni boshlagan
    AYNAN oʻsha brauzer) sessiyani oladi.

    IKKI SIR, IKKI VAZIFA:
      · `id` — havolaga yoziladi, Telegram orqali oʻtadi. Uni koʻrgan
        odam soʻrovni TASDIQLAY oladi, lekin undan FOYDALANA olmaydi.
      · brauzer siri — faqat soʻrovni boshlagan brauzerning httpOnly
        cookie'sida. Bazada faqat xeshi. Sessiya faqat shu sir bilan
        beriladi — yaʼni havolani birovga yuborib, uning tasdigʻi bilan
        OʻZ brauzeriga sessiya olib boʻlmaydi.

    `code` — saytda koʻrinadigan 4 raqam. Bot uni uchta variant ichidan
    TANLATADI (shunchaki «Ha» emas): firibgar yuborgan havolani ochgan
    odam saytni koʻrmayapti va toʻgʻri kodni bilmaydi. */
export const tgAuthRequests = pgTable(
  "tg_auth_requests",
  {
    id: text("id").primaryKey(),
    /** login | link */
    kind: text("kind").notNull(),
    browserSecretHash: text("browser_secret_hash").notNull(),
    code: text("code").notNull(),
    /** Qisqa tavsif («Chrome · Windows») — botda koʻrsatiladi. */
    clientLabel: text("client_label").notNull().default(""),
    /** link: soʻrovni boshlagan akkaunt. login: tasdiqlangach toʻldiriladi. */
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    /** Botda kodni toʻgʻri tanlagan telegram. */
    telegramId: text("telegram_id"),
    /** pending → (awaiting_phone) → approved → consumed; yoki rejected / has_account */
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
  },
  (t) => [index("tg_auth_requests_telegram_idx").on(t.telegramId)]
);

/** Bildirishnoma sozlamalari — akkaunt boshiga bitta qator (yoʻq boʻlsa standart).

    Vaqt `HH:MM`, Toshkent vaqti. Cron har 15 daqiqada ishlaydi, shuning
    uchun vaqt 15 daqiqaga yaxlitlanadi. */
export const tgNotifyPrefs = pgTable("tg_notify_prefs", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  morningEnabled: boolean("morning_enabled").notNull().default(true),
  morningTime: text("morning_time").notNull().default("07:00"),
  eveningEnabled: boolean("evening_enabled").notNull().default(true),
  eveningTime: text("evening_time").notNull().default("20:00"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Yuborilgan bildirishnomalar jurnali — IKKI MARTA YUBORMASLIK uchun.

    `(user_id, kind, date_key)` UNIQUE: cron qayta ishlasa yoki ikki
    nusxasi parallel ketsa ham, bitta kunga bitta xabar. Qator yuborishdan
    OLDIN yoziladi (band qilish), xato boʻlsa `error` toʻldiriladi. */
export const tgNotifyLog = pgTable(
  "tg_notify_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** morning | evening */
    kind: text("kind").notNull(),
    /** Qaysi kun haqida (`YYYY-MM-DD`, Toshkent). */
    dateKey: text("date_key").notNull(),
    /** Xabar yuborilmagan boʻlsa (boʻsh kun) — `skipped`. */
    status: text("status").notNull().default("sending"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("tg_notify_log_once").on(t.userId, t.kind, t.dateKey)]
);

export type TgChatRow = typeof tgChats.$inferSelect;
export type TgAuthRequestRow = typeof tgAuthRequests.$inferSelect;
export type TgNotifyPrefsRow = typeof tgNotifyPrefs.$inferSelect;
