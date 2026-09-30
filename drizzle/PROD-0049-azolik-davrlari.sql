/* ═══════════════════════════════════════════════════════════════════
   PROD MIGRATSIYASI — 0049_azolik_davrlari (aʼzolik davrlari)
   Spetsifikatsiya: docs/sinf-azoligi-spec.md §4, §8

   Nega qoʻlda: prod jurnalida hash drift bor — `npm run db:migrate`
   prodda eski migratsiyalarni qayta bajarishga urinadi. Shuning uchun
   faqat shu migratsiya qoʻllanadi va hash'i jurnalga yoziladi.

   Faqat QOʻSHISH: yangi jadvallar (enrollment_periods, student_moves),
   btree_gist, bitta trigger (enrollments ga AFTER INSERT). Mavjud
   jadvallar/ustunlar va LessonLab triggerlari (sync_student_from_bot,
   trg_sync_student_from_uz, v_unified_students) TEGILMAYDI.

   ── OLDIN (faqat oʻqish, natija 0 boʻlishi shart) ────────────────────
     SELECT count(*) FROM enrollments
      WHERE (started_at IS NOT NULL AND started_at !~ '^d{4}-d{2}-d{2}$')
         OR (ended_at   IS NOT NULL AND ended_at   !~ '^d{4}-d{2}-d{2}$');
   (Migratsiyaning oʻzi ham shuni tekshiradi va notoʻgʻri boʻlsa YIQILADI.)

   ── KEYIN ────────────────────────────────────────────────────────────
     -- har bogʻlanishda davr bor: 0 qator boʻlishi kerak
     SELECT e.class_id, e.student_id FROM enrollments e
      WHERE NOT EXISTS (SELECT 1 FROM enrollment_periods p
                         WHERE p.class_id = e.class_id AND p.student_id = e.student_id);
     -- soni mos: ikkalasi bir xil
     SELECT (SELECT count(*) FROM enrollments), (SELECT count(*) FROM enrollment_periods);
     -- LessonLab sinovi: botda bola qoʻshing → Ustozonada davr paydo boʻldimi.

   Orqaga qaytarish (yangi jadvallarga hech narsa bogʻliq emas):
     DROP TRIGGER trg_enrollment_default_period ON enrollments;
     DROP FUNCTION enrollment_default_period();
     DROP TABLE enrollment_periods, student_moves;
     DELETE FROM drizzle.__drizzle_migrations WHERE hash = '56dd1ee056d1415be2fd2ba2aa35f122e7dbe6f61bf69a1b610df6df6a172506';

   Hammasi bitta tranzaksiyada: biror qadam xato bersa hech narsa
   oʻzgarmaydi. Supabase → SQL Editor → shu faylni toʻliq qoʻying → Run.
   ⚠️ Ilova kodi (PR) bu migratsiyadan KEYIN deploy qilinadi — kod
   `enrollment_periods` ni oʻqiydi; jadvalsiz u yiqiladi.
   ═══════════════════════════════════════════════════════════════════ */

BEGIN;

CREATE TABLE "enrollment_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"started_on" date,
	"ended_on" date,
	"exit_reason" text,
	"move_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "student_moves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" text NOT NULL,
	"student_id" text NOT NULL,
	"from_class_id" text NOT NULL,
	"to_class_id" text NOT NULL,
	"effective_on" date NOT NULL,
	"order_no" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_move_id_student_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."student_moves"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_class_id_student_id_enrollments_class_id_student_id_fk" FOREIGN KEY ("class_id","student_id") REFERENCES "public"."enrollments"("class_id","student_id") ON DELETE cascade ON UPDATE cascade;

ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_from_class_id_classes_id_fk" FOREIGN KEY ("from_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_to_class_id_classes_id_fk" FOREIGN KEY ("to_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "enrollment_periods_student_idx" ON "enrollment_periods" USING btree ("student_id");

CREATE INDEX "enrollment_periods_class_idx" ON "enrollment_periods" USING btree ("class_id");

CREATE INDEX "student_moves_student_idx" ON "student_moves" USING btree ("student_id");

CREATE INDEX "student_moves_from_idx" ON "student_moves" USING btree ("from_class_id");

CREATE INDEX "student_moves_to_idx" ON "student_moves" USING btree ("to_class_id");

-- ════════════════════════════════════════════════════════════════════
-- QOʻLDA yozilgan qism (drizzle-kit EXCLUDE, trigger, RLS chiqarmaydi).
-- docs/sinf-azoligi-spec.md §4.2, §8.
-- ════════════════════════════════════════════════════════════════════

-- 1) Davrlar ustma-ust tushmaydi: bir bola bir guruhda bir vaqtda ikki
--    ochiq davrga ega boʻla olmaydi. Boʻsh oraliq (started_on = ended_on,
--    «kelmadi») hech narsa bilan kesishmaydi.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_dates_chk"
  CHECK ("started_on" IS NULL OR "ended_on" IS NULL OR "ended_on" >= "started_on");

ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_no_overlap"
  EXCLUDE USING gist (
    "class_id" WITH =,
    "student_id" WITH =,
    daterange("started_on", "ended_on", '[)') WITH &&
  );

-- 2) Backfill: har `enrollments` qatoriga BITTA davr — mavjud
--    started_at/ended_at ning aynan nusxasi. Sana shakli notoʻgʻri boʻlsa
--    migratsiya YIQILADI (tranzaksiya qaytadi): jimgina «boshidan/ochiq»
--    qilib yuborish bolani notoʻgʻri kunlarda koʻrsatardi.
DO $$
DECLARE bad integer;
BEGIN
  SELECT count(*) INTO bad FROM "enrollments"
   WHERE ("started_at" IS NOT NULL AND "started_at" !~ '^\d{4}-\d{2}-\d{2}$')
      OR ("ended_at"   IS NOT NULL AND "ended_at"   !~ '^\d{4}-\d{2}-\d{2}$');
  IF bad > 0 THEN
    RAISE EXCEPTION 'enrollments: % qatorda started_at/ended_at YYYY-MM-DD emas', bad;
  END IF;
END $$;

INSERT INTO "enrollment_periods" ("class_id", "student_id", "started_on", "ended_on", "exit_reason")
SELECT "class_id", "student_id", "started_at"::date, "ended_at"::date,
       CASE WHEN "ended_at" IS NOT NULL THEN 'moved' END
  FROM "enrollments" e
 WHERE NOT EXISTS (
   SELECT 1 FROM "enrollment_periods" p
    WHERE p."class_id" = e."class_id" AND p."student_id" = e."student_id"
 );

-- 3) Invariant: har `enrollments` qatorida kamida bitta davr. Tashqi
--    yozuvchilar (LessonLab boti: `sync_student_from_bot`,
--    `INSERT … ON CONFLICT DO NOTHING`) davr haqida bilmaydi — trigger
--    ularning oʻrniga default davrni ochadi. `ON CONFLICT DO NOTHING` ga
--    tushgan qator triggerni ishga tushirmaydi — toʻgʻri, davr allaqachon bor.
--    ⚠️ Trigger HECH QACHON insertni yiqitmasligi kerak (bot qoʻshishi
--    toʻxtab qolmasin): notoʻgʻri sana boʻlsa — ochiq davr + ogohlantirish.
CREATE OR REPLACE FUNCTION "enrollment_default_period"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    INSERT INTO "enrollment_periods" ("class_id", "student_id", "started_on", "ended_on", "exit_reason")
    VALUES (NEW."class_id", NEW."student_id", NEW."started_at"::date, NEW."ended_at"::date,
            CASE WHEN NEW."ended_at" IS NOT NULL THEN 'moved' END);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'enrollment_default_period: % — ochiq davr yaratildi (%, %)',
      SQLERRM, NEW."class_id", NEW."student_id";
    INSERT INTO "enrollment_periods" ("class_id", "student_id")
    VALUES (NEW."class_id", NEW."student_id");
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS "trg_enrollment_default_period" ON "enrollments";

CREATE TRIGGER "trg_enrollment_default_period"
  AFTER INSERT ON "enrollments"
  FOR EACH ROW EXECUTE FUNCTION "enrollment_default_period"();

-- 4) RLS — loyiha naqshi (0045): yoqilgan, siyosatsiz = ommaviy API yopiq.
ALTER TABLE "enrollment_periods" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "student_moves" ENABLE ROW LEVEL SECURITY;

-- Jurnal: hash repodagi (LF) fayl mazmunidan — `npm run db:migrate:dry`
-- shu bilan uni «qoʻllangan» deb taniydi.
INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
VALUES ('56dd1ee056d1415be2fd2ba2aa35f122e7dbe6f61bf69a1b610df6df6a172506', 1790754114683);

COMMIT;
