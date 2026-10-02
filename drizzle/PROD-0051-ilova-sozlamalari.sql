/* ═══════════════════════════════════════════════════════════════════
   PROD MIGRATSIYASI — 0051_ilova_sozlamalari (app_settings)
   Kod: src/server/dal/app-settings.ts, /admin/settings

   ⚠️ TARTIB: shu fayl AVVAL prodda qoʻllanadi, PR keyin merge qilinadi.
   Kod jadval boʻlmasa ham yiqilmaydi (oʻqish xatosi → muhit
   sozlamasiga qaytadi), lekin admin sahifasi saqlay olmaydi.

   Nega qoʻlda: prod jurnalida hash drift bor — `npm run db:migrate`
   prodda eski migratsiyalarni qayta bajarishga urinadi.

   Faqat YANGI jadval — mavjud jadvallarga tegmaydi. RLS yoqilgan,
   siyosatsiz (loyiha naqshi, 0045): ommaviy API orqali yopiq.
   Supabase → SQL Editor → shu faylni toʻliq qoʻying → Run.
   ═══════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
ALTER TABLE "app_settings" ENABLE ROW LEVEL SECURITY;

-- Jurnal: hash repodagi (LF) fayl mazmunidan.
INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
VALUES ('5524048501b27f293159dd67021d83697abba8ed170337b8fffd22855e15d15b', 1790960755124);

COMMIT;
