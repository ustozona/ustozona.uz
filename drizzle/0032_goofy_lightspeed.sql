-- IDEMPOTENT qilingan (qoʻlda tahrir) — `0031` bilan bir xil sabab.
--
-- Bu migratsiyada IKKI xil oʻzgarish bor:
--
--   1. `assignments.group_id` — ASOSIY ish (R212: bitta topshiriq, koʻp sinf).
--      Ilgari guruh faqat `localStorage` da yashardi.
--   2. `set_sources` — 2026-08-10 dagi "LessonLab test banki" commit'ida
--      SXEMAGA qoʻshilgan, lekin migratsiya fayli yozilmagan. Supabase'da
--      jadval ALLAQACHON bor (qoʻlda yaratilgan, drizzle jurnalidan
--      tashqarida), Neon'da esa yoʻq.
--
-- Shuning uchun hamma amal himoyalangan: aks holda prodda
-- "relation already exists" bilan yiqilardi.
CREATE TABLE IF NOT EXISTS "set_sources" (
	"uz_set_id" text PRIMARY KEY NOT NULL,
	"ll_test_id" integer NOT NULL,
	"uz_class_id" text NOT NULL,
	"tier" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "set_sources_class_test_uniq" UNIQUE("uz_class_id","ll_test_id")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "group_id" text;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "set_sources" ADD CONSTRAINT "set_sources_uz_set_id_activity_sets_id_fk" FOREIGN KEY ("uz_set_id") REFERENCES "public"."activity_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "set_sources" ADD CONSTRAINT "set_sources_uz_class_id_classes_id_fk" FOREIGN KEY ("uz_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "set_sources_test_idx" ON "set_sources" USING btree ("ll_test_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "set_sources_class_idx" ON "set_sources" USING btree ("uz_class_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assignments_group_idx" ON "assignments" USING btree ("group_id");
