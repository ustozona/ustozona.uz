-- IDEMPOTENT qilingan (qoʻlda tahrir). Sabab: bu migratsiya kodga kirgan,
-- lekin migratsiya fayli yozilmagan oʻzgarishlarni quvib yetadi. Supabase'da
-- bu jadvallar ALLAQACHON bor (LessonLab tomonidan qoʻlda yaratilgan), Neon'da
-- esa yoʻq. IF NOT EXISTS boʻlmasa prodda "relation already exists" bilan yiqiladi.
CREATE TABLE IF NOT EXISTS "account_link_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"uz_user_id" text,
	"telegram_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_links" (
	"ll_class_id" integer PRIMARY KEY NOT NULL,
	"uz_class_id" text NOT NULL,
	"origin" text NOT NULL,
	"linked_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_links_uz_uniq" UNIQUE("uz_class_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roster_links" (
	"ll_student_id" integer PRIMARY KEY NOT NULL,
	"uz_student_id" text NOT NULL,
	"origin" text NOT NULL,
	"linked_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roster_links_uz_uniq" UNIQUE("uz_student_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"kind" text NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"details" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_links" (
	"ll_test_id" integer PRIMARY KEY NOT NULL,
	"uz_set_id" text NOT NULL,
	"origin" text NOT NULL,
	"linked_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "test_links_uz_uniq" UNIQUE("uz_set_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tg_signup_tickets" (
	"token" text PRIMARY KEY NOT NULL,
	"telegram_id" text NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"tg_username" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_user_id" text
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "nickname" text;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "account_link_codes" ADD CONSTRAINT "account_link_codes_uz_user_id_user_id_fk" FOREIGN KEY ("uz_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "class_links" ADD CONSTRAINT "class_links_uz_class_id_classes_id_fk" FOREIGN KEY ("uz_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "roster_links" ADD CONSTRAINT "roster_links_uz_student_id_students_id_fk" FOREIGN KEY ("uz_student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "sync_reports" ADD CONSTRAINT "sync_reports_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "test_links" ADD CONSTRAINT "test_links_uz_set_id_activity_sets_id_fk" FOREIGN KEY ("uz_set_id") REFERENCES "public"."activity_sets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "tg_signup_tickets" ADD CONSTRAINT "tg_signup_tickets_created_user_id_user_id_fk" FOREIGN KEY ("created_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "roster_links_uz_idx" ON "roster_links" USING btree ("uz_student_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_reports_teacher_idx" ON "sync_reports" USING btree ("teacher_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "test_links_uz_idx" ON "test_links" USING btree ("uz_set_id");
