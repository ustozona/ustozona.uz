/* ════════════════════════════════════════════════════════════════════
   TUZATISH: MIGRATSIYA JURNALI HASH DRIFT'I  (2026-09-04)

   MUAMMO. Drizzle qaysi migratsiya qoʻllanganini fayl NOMI bilan emas,
   fayl MAZMUNINING hash'i bilan eslab qoladi. Quyidagi oʻnta migratsiya
   prodga qoʻllanilgandan KEYIN tahrirlangan (koʻpchiligi idempotent
   qilingan: `IF NOT EXISTS` qoʻshilgan). Fayl oʻzgargani uchun hash ham
   oʻzgargan, bazadagi eski hash esa oʻsha-oʻsha qolgan.

   Natijada `drizzle-kit` ularni "qoʻllanmagan" deb koʻradi va
   `npm run db:migrate` prodda 0034 dagi `CREATE TABLE "workspaces"`
   da yiqiladi — holbuki jadval allaqachon bor. Yomonroq ehtimol: 0035
   maʼlumot KOʻCHIRISH migratsiyasi qayta bajarilishi.

   TEKSHIRUV. Oʻntasining ham obyektlari 2026-09-04 da prod bazada
   `information_schema` orqali BIRMA-BIR tasdiqlangan:
     set_sources · assignments.group_id · lessons.subject · lessons.grade
     activity_sets.subject · activity_sets.grade · activity_sets.class_id
     (nullable) · workspaces · workspace_invites · workspace_audit_logs
     class_teachers.role · blog_comments.teacher_id
     blog_comments.parent_id · blog_posts.published_snapshot

   ⚠️ Bu skript SXEMAGA TEGMAYDI — faqat jurnalga yozuv qoʻshadi.
   Hech qanday jadval, ustun yoki maʼlumot oʻzgarmaydi.

   QOʻLLASH: Supabase SQL Editor'da bir marta ishga tushiriladi.
   Soʻng `npm run db:migrate:dry` "Qoʻllanmagan: 0" koʻrsatishi kerak.
   ════════════════════════════════════════════════════════════════════ */

BEGIN;

/* Har biri alohida va idempotent: `hash` ustunida unique yoʻq,
   shuning uchun ON CONFLICT ishlamaydi — NOT EXISTS ishlatilgan.
   Skriptni ikki marta ishga tushirsangiz ham zarar yoʻq. */

  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT 'cccfb05eff995caed43bcaff6d378d51d7ba8a555226a47f304e32228898200c', 1786990933899
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'cccfb05eff995caed43bcaff6d378d51d7ba8a555226a47f304e32228898200c');  -- 0032_goofy_lightspeed
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT '7712403c8c7c362c1bff306a42acaea4261ef2c94dab65e04744790eb63f44cb', 1786994943334
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '7712403c8c7c362c1bff306a42acaea4261ef2c94dab65e04744790eb63f44cb');  -- 0033_tense_maggott
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT '3f84b4cfe321f617c58c6f6b60a8562f7ee8ee074bdff12ec5fa46d21967d390', 1787383276394
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '3f84b4cfe321f617c58c6f6b60a8562f7ee8ee074bdff12ec5fa46d21967d390');  -- 0034_ish_maydoni_qoshish
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT '61e134c73e7319458221f2019e6ac376042071deb59a2a8b15ede632b0702648', 1787383320390
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '61e134c73e7319458221f2019e6ac376042071deb59a2a8b15ede632b0702648');  -- 0035_ish_maydoni_kochirish
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT 'aece636f100ae65c34a26372bf529d148f519ddd356b06171cca8c4767d1bfd8', 1787742198754
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'aece636f100ae65c34a26372bf529d148f519ddd356b06171cca8c4767d1bfd8');  -- 0036_sinf_egasi
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT '6bbd97108944dbedda04f5bf7e32d535b19f11481e4803ac90a9109257368ee1', 1787743673224
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '6bbd97108944dbedda04f5bf7e32d535b19f11481e4803ac90a9109257368ee1');  -- 0037_hamkasb_taklifi
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT '6a1e00a6eac2e1562b578f8f159d7244fa048338c56b2a11dcc6915f5d996a4b', 1787744649671
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '6a1e00a6eac2e1562b578f8f159d7244fa048338c56b2a11dcc6915f5d996a4b');  -- 0038_maydon_auditi
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT 'e5b2dc6a5a96f16038a9fe38497e68b7fc31f6a77a8757f6640ef4df5510d728', 1788001581930
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'e5b2dc6a5a96f16038a9fe38497e68b7fc31f6a77a8757f6640ef4df5510d728');  -- 0039_blog_fikr_muallifi
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT 'd219e8863244e7455d71ac10fc8392410965a852937f506a73811879dbe58483', 1788063047935
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = 'd219e8863244e7455d71ac10fc8392410965a852937f506a73811879dbe58483');  -- 0040_blog_nashr_surati_koorishlar
  INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
  SELECT '9b8bf6442451c488943bcbc0a75c57f12eecf5eafb717cb9cfdead32bb04da5b', 1788065441948
  WHERE NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE hash = '9b8bf6442451c488943bcbc0a75c57f12eecf5eafb717cb9cfdead32bb04da5b');  -- 0041_blog_fikr_javob_tahrir

COMMIT;

/* Tekshirish (yuqoridagidan keyin alohida ishga tushiring):

   SELECT count(*) FROM drizzle.__drizzle_migrations;
   -- kutilgan natija: 53  (43 mavjud + 10 yangi yozuv)
*/
