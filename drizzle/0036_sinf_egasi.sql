ALTER TABLE "class_teachers" ADD COLUMN "role" text DEFAULT 'teacher' NOT NULL;--> statement-breakpoint
-- Mavjud biriktirishlar EGA boʻladi.
--
-- Bu paytda har sinfda aynan bitta oʻqituvchi bor: 0035 migratsiyasi
-- `classes.teacher_id` dan bittadan qator yaratgan, hamkasb qoʻshish
-- oqimi esa hali mavjud emas. Demak "birinchi qator = yaratuvchi"
-- taxmini xavfsiz.
--
-- ⚠️ Default ATAYLAB 'teacher': yangi qatorlar (hamkasb qoʻshilishi)
-- hech qachon tasodifan ega boʻlib qolmasin. Ega faqat sinf
-- yaratilayotganda ochiq beriladi.
UPDATE "class_teachers" SET "role" = 'owner';
