-- Materiallar kutubxonasi — 1-bosqich: mazmun sinfdan ajraladi.
--
-- `activity_sets.class_id` `notNull` + `ON DELETE cascade` edi, yaʼni sinf
-- oʻchirilganda uning testlari ham oʻchardi. Kutubxona uchun bu halokatli:
-- oʻqituvchi eski sinfni tozalasa yillar davomida tuzgan testlari yoʻqolardi.
-- Endi ustun `null` boʻla oladi va FK `set null` — toʻplam sinfsiz qolib
-- kutubxonada yashayveradi. `class_id` maʼnosi «qayerda tuzilgan» ga
-- oʻzgardi; ijro allaqachon `session.class_id` ga tayanadi (play/publish).
--
-- `subject`/`grade` — kutubxona filtrlari. Oʻqituvchidan soʻralmaydi,
-- tuzilgan paytdagi sinfdan avtomatik olinadi (R227a).
--
-- Idempotent: 0031/0032 dagi sabab bilan — prod sxemasi bir marta
-- migratsiyadan tashqari oʻzgargan, shuning uchun har bayonot qayta
-- yuritilishga chidamli boʻlishi kerak.

ALTER TABLE "activity_sets" DROP CONSTRAINT IF EXISTS "activity_sets_class_id_classes_id_fk";--> statement-breakpoint
ALTER TABLE "activity_sets" ALTER COLUMN "class_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "subject" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "grade" integer;--> statement-breakpoint
ALTER TABLE "activity_sets" ADD COLUMN IF NOT EXISTS "subject" text;--> statement-breakpoint
ALTER TABLE "activity_sets" ADD COLUMN IF NOT EXISTS "grade" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_sets" ADD CONSTRAINT "activity_sets_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;
