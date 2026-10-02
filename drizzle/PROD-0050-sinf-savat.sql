/* ═══════════════════════════════════════════════════════════════════
   PROD MIGRATSIYASI — 0050_sinf_savat (sinf savati, 7 kun)
   Kod: src/server/dal/class-trash.ts

   ⚠️ TARTIB: shu fayl AVVAL prodda qoʻllanadi, PR keyin merge qilinadi.
   Yangi kod `classes.deleted_at` ni har sinf soʻrovida oʻqiydi —
   ustun boʻlmasa butun dashboard yiqiladi.

   Nega qoʻlda: prod jurnalida hash drift bor — `npm run db:migrate`
   prodda eski migratsiyalarni qayta bajarishga urinadi.

   Faqat ikki NULL ustun va indeks — mavjud qatorlarga tegmaydi.
   Supabase → SQL Editor → shu faylni toʻliq qoʻying → Run.
   ═══════════════════════════════════════════════════════════════════ */

BEGIN;

ALTER TABLE "classes" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "classes" ADD COLUMN "deleted_by" text;
CREATE INDEX "classes_deleted_idx" ON "classes" USING btree ("deleted_at");

-- Jurnal: hash repodagi (LF) fayl mazmunidan.
INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
VALUES ('c5bf419acfa660b412375ec12c29e63dcd80b3d564c1a9567970c74459f252e9', 1790940824713);

COMMIT;

/* Merge'dan keyin — kunlik tozalash (pg_cron, sir allaqachon Vault'da):

select cron.schedule(
  'ustozona-purge-classes',
  '30 21 * * *',   -- 02:30 Toshkent
  $$
  select net.http_post(
    url := 'https://www.ustozona.uz/api/cron/purge-classes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'ustozona_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
*/
