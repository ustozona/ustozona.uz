import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/* ════════════════════════════════════════════════════════════════════
   ILOVA SOZLAMALARI — butun platforma uchun bitta qiymatli kalitlar.

   Kodda yozilmasligi kerak boʻlgan, lekin deploysiz oʻzgarishi kerak
   boʻlgan narsalar uchun (masalan, Dars studiyasidagi tashqi saytlar
   roʻyxati — AGENTS.md: boshqa mahsulot nomlari kodda yozilmaydi).
   Faqat super-admin yozadi (`/admin/settings`), har oʻzgarish audit
   jurnaliga tushadi.

   Kalitlar roʻyxati — `src/server/dal/app-settings.ts` (`SETTING_KEYS`).
   Qiymat JSONB: oʻqishda har doim tekshiriladi, ishonib olinmaydi.
   ════════════════════════════════════════════════════════════════════ */

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  /** Oxirgi oʻzgartirgan admin (FK emas — audit jurnali kabi). */
  updatedBy: text("updated_by"),
});
