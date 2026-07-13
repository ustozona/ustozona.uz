CREATE TABLE "academic_years" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "academic_years_teacher_idx" ON "academic_years" USING btree ("teacher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academic_years_one_active_idx" ON "academic_years" USING btree ("teacher_id") WHERE "academic_years"."is_active";--> statement-breakpoint
-- Maʼlumot koʻchirish: har oʻqituvchining yagona `calendars` hujjati → bitta FAOL
-- oʻquv yili. `calendars` oʻchmaydi (rollback uchun qoladi). PK = teacher_id boʻlgani
-- uchun har oʻqituvchida aynan bitta faol qator — "bitta faol" indeksni buzmaydi.
INSERT INTO "academic_years" ("id", "teacher_id", "data", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, "teacher_id", "data", true, now(), now() FROM "calendars";