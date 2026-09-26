/* ════════════════════════════════════════════════════════════════════
   ISH MAYDONIGA KOʻCHISH — maʼlumotni saqlagan holda.

   0034 yangi jadval/ustunlarni QOʻSHDI (hammasi nullable). Bu migratsiya
   mavjud maʼlumotni koʻchiradi va eski ustunlarni oʻchiradi.

   Tartib MUHIM: avval toʻldirish, keyin NOT NULL, eng oxirida DROP.
   Aks holda `teacher_id` oʻchgach uni oʻqib boʻlmay qoladi.

   Maydon id'si `'ws-' || teacher.id` — ATAYLAB deterministik: migratsiya
   qayta yurgizilsa dublikat yaratmaydi va bazaga qarab qaysi maydon
   kimniki ekani darhol koʻrinadi.

   Batafsil: docs/ish-maydoni-arxitektura.md
   ════════════════════════════════════════════════════════════════════ */

--> 1. Har oʻqituvchiga shaxsiy maydon ("yakka oʻqituvchi = aʼzosi bitta maydon")
INSERT INTO "workspaces" ("id", "name", "kind")
SELECT 'ws-' || t."id", COALESCE(NULLIF(t."name", ''), t."email"), 'personal'
FROM "teachers" t
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

--> 2. Aʼzolik — oʻz maydonida egasi
INSERT INTO "workspace_members" ("workspace_id", "teacher_id", "role")
SELECT 'ws-' || t."id", t."id", 'owner'
FROM "teachers" t
ON CONFLICT ("workspace_id", "teacher_id") DO NOTHING;
--> statement-breakpoint

--> 3. Faol maydon (almashtirgich xotirasi)
UPDATE "teachers" SET "active_workspace_id" = 'ws-' || "id"
WHERE "active_workspace_id" IS NULL;
--> statement-breakpoint

--> 4. Sinflar maydonga koʻchadi
UPDATE "classes" SET "workspace_id" = 'ws-' || "teacher_id"
WHERE "workspace_id" IS NULL AND "teacher_id" IS NOT NULL;
--> statement-breakpoint

--> 5. Oʻquvchilar maydonga koʻchadi
UPDATE "students" SET "workspace_id" = 'ws-' || "teacher_id"
WHERE "workspace_id" IS NULL AND "teacher_id" IS NOT NULL;
--> statement-breakpoint

--> 6. Darsni kim oʻtadi — eski egalikdan biriktirish yasaladi.
--> Busiz hamma oʻqituvchi oʻz sinfini koʻrmay qolardi: koʻrinuvchanlik
--> endi `class_teachers` ga tayanadi.
INSERT INTO "class_teachers" ("class_id", "teacher_id")
SELECT c."id", c."teacher_id"
FROM "classes" c
WHERE c."teacher_id" IS NOT NULL
ON CONFLICT ("class_id", "teacher_id") DO NOTHING;
--> statement-breakpoint

--> 7. Yozilish — `students.class_id` + `sort_order` shu yerga koʻchadi
INSERT INTO "enrollments" ("class_id", "student_id", "sort_order")
SELECT s."class_id", s."id", s."sort_order"
FROM "students" s
WHERE s."class_id" IS NOT NULL
ON CONFLICT ("class_id", "student_id") DO NOTHING;
--> statement-breakpoint

/* ── Eski tuzilmani olib tashlash ─────────────────────────────────── */

--> `schools` boʻsh jadval edi (0 qator, hech kim biriktirilmagan).
--> ⚠️ CASCADE `teachers_school_id_schools_id_fk` ni ham oʻchiradi, shu
--> bois keyingi DROP CONSTRAINT `IF EXISTS` bilan.
DROP TABLE IF EXISTS "schools" CASCADE;--> statement-breakpoint
ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "teachers_school_id_schools_id_fk";--> statement-breakpoint
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_teacher_id_teachers_id_fk";--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_teacher_id_teachers_id_fk";--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_class_id_classes_id_fk";--> statement-breakpoint

ALTER TABLE "classes" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_parent_class_id_classes_id_fk" FOREIGN KEY ("parent_class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "teachers" DROP COLUMN "school_id";--> statement-breakpoint
ALTER TABLE "classes" DROP COLUMN "teacher_id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "teacher_id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "class_id";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "sort_order";
