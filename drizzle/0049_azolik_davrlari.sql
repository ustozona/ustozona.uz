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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_move_id_student_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."student_moves"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_class_id_student_id_enrollments_class_id_student_id_fk" FOREIGN KEY ("class_id","student_id") REFERENCES "public"."enrollments"("class_id","student_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_from_class_id_classes_id_fk" FOREIGN KEY ("from_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_to_class_id_classes_id_fk" FOREIGN KEY ("to_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_moves" ADD CONSTRAINT "student_moves_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_periods_student_idx" ON "enrollment_periods" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrollment_periods_class_idx" ON "enrollment_periods" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "student_moves_student_idx" ON "student_moves" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "student_moves_from_idx" ON "student_moves" USING btree ("from_class_id");--> statement-breakpoint
CREATE INDEX "student_moves_to_idx" ON "student_moves" USING btree ("to_class_id");--> statement-breakpoint

-- ════════════════════════════════════════════════════════════════════
-- QOʻLDA yozilgan qism (drizzle-kit EXCLUDE, trigger, RLS chiqarmaydi).
-- docs/sinf-azoligi-spec.md §4.2, §8.
-- ════════════════════════════════════════════════════════════════════

-- 1) Davrlar ustma-ust tushmaydi: bir bola bir guruhda bir vaqtda ikki
--    ochiq davrga ega boʻla olmaydi. Boʻsh oraliq (started_on = ended_on,
--    «kelmadi») hech narsa bilan kesishmaydi.
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_dates_chk"
  CHECK ("started_on" IS NULL OR "ended_on" IS NULL OR "ended_on" >= "started_on");--> statement-breakpoint
ALTER TABLE "enrollment_periods" ADD CONSTRAINT "enrollment_periods_no_overlap"
  EXCLUDE USING gist (
    "class_id" WITH =,
    "student_id" WITH =,
    daterange("started_on", "ended_on", '[)') WITH &&
  );--> statement-breakpoint

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
END $$;--> statement-breakpoint
INSERT INTO "enrollment_periods" ("class_id", "student_id", "started_on", "ended_on", "exit_reason")
SELECT "class_id", "student_id", "started_at"::date, "ended_at"::date,
       CASE WHEN "ended_at" IS NOT NULL THEN 'moved' END
  FROM "enrollments" e
 WHERE NOT EXISTS (
   SELECT 1 FROM "enrollment_periods" p
    WHERE p."class_id" = e."class_id" AND p."student_id" = e."student_id"
 );--> statement-breakpoint

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
END $$;--> statement-breakpoint
DROP TRIGGER IF EXISTS "trg_enrollment_default_period" ON "enrollments";--> statement-breakpoint
CREATE TRIGGER "trg_enrollment_default_period"
  AFTER INSERT ON "enrollments"
  FOR EACH ROW EXECUTE FUNCTION "enrollment_default_period"();--> statement-breakpoint

-- 4) RLS — loyiha naqshi (0045): yoqilgan, siyosatsiz = ommaviy API yopiq.
ALTER TABLE "enrollment_periods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "student_moves" ENABLE ROW LEVEL SECURITY;
