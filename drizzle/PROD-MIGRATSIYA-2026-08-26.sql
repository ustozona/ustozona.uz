/* ═══════════════════════════════════════════════════════════════════
   PROD MIGRATSIYASI — ISH MAYDONI (0034 → 0038)
   Yaratilgan: 2026-08-26 · docs/prod-migratsiya-reja.md

   ⚠️ HAMMASI BITTA TRANZAKSIYADA. Biror qadam xato bersa Postgres
   avtomatik ORQAGA QAYTARADI — baza tegilmagan holicha qoladi.

   Supabase → SQL Editor → shu faylni toʻliq qoʻying → Run.
   ═══════════════════════════════════════════════════════════════════ */

BEGIN;

/* ── 1. Koʻrinishlarni oʻchirish (bogʻliqlik tartibida) ────────── */
DROP VIEW IF EXISTS v_teacher_totals;
DROP VIEW IF EXISTS v_duplicate_candidates;
DROP VIEW IF EXISTS v_unified_students;
DROP VIEW IF EXISTS v_unified_classes;

/* ── Migratsiya 0034_ish_maydoni_qoshish ─────────────────────── */
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'personal' NOT NULL,
	"region" text,
	"city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workspace_members" (
	"workspace_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"role" text DEFAULT 'teacher' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_workspace_id_teacher_id_pk" PRIMARY KEY("workspace_id","teacher_id")
);

CREATE TABLE "class_teachers" (
	"class_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_teachers_class_id_teacher_id_pk" PRIMARY KEY("class_id","teacher_id")
);

CREATE TABLE "enrollments" (
	"class_id" text NOT NULL,
	"student_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_class_id_student_id_pk" PRIMARY KEY("class_id","student_id")
);

DROP INDEX "classes_teacher_idx";
DROP INDEX "students_teacher_idx";
DROP INDEX "students_class_idx";
ALTER TABLE "classes" ALTER COLUMN "teacher_id" DROP NOT NULL;
ALTER TABLE "students" ALTER COLUMN "teacher_id" DROP NOT NULL;
ALTER TABLE "students" ALTER COLUMN "class_id" DROP NOT NULL;
ALTER TABLE "teachers" ADD COLUMN "active_workspace_id" text;
ALTER TABLE "classes" ADD COLUMN "workspace_id" text;
ALTER TABLE "classes" ADD COLUMN "parent_class_id" text;
ALTER TABLE "students" ADD COLUMN "workspace_id" text;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "class_teachers" ADD CONSTRAINT "class_teachers_teacher_id_teachers_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "workspace_members_teacher_idx" ON "workspace_members" USING btree ("teacher_id");
CREATE INDEX "class_teachers_teacher_idx" ON "class_teachers" USING btree ("teacher_id");
CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_active_workspace_id_workspaces_id_fk" FOREIGN KEY ("active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "classes" ADD CONSTRAINT "classes_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "students" ADD CONSTRAINT "students_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "classes_workspace_idx" ON "classes" USING btree ("workspace_id");
CREATE INDEX "classes_parent_idx" ON "classes" USING btree ("parent_class_id");
CREATE INDEX "students_workspace_idx" ON "students" USING btree ("workspace_id");

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('44bda4ea1972ba8bc96d44398b8e066729f6e4de11168b33bd179c39452b86d8', 1787383276394);

/* ── Migratsiya 0035_ish_maydoni_kochirish ─────────────────────── */
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

--> 2. Aʼzolik — oʻz maydonida egasi
INSERT INTO "workspace_members" ("workspace_id", "teacher_id", "role")
SELECT 'ws-' || t."id", t."id", 'owner'
FROM "teachers" t
ON CONFLICT ("workspace_id", "teacher_id") DO NOTHING;

--> 3. Faol maydon (almashtirgich xotirasi)
UPDATE "teachers" SET "active_workspace_id" = 'ws-' || "id"
WHERE "active_workspace_id" IS NULL;

--> 4. Sinflar maydonga koʻchadi
UPDATE "classes" SET "workspace_id" = 'ws-' || "teacher_id"
WHERE "workspace_id" IS NULL AND "teacher_id" IS NOT NULL;

--> 5. Oʻquvchilar maydonga koʻchadi
UPDATE "students" SET "workspace_id" = 'ws-' || "teacher_id"
WHERE "workspace_id" IS NULL AND "teacher_id" IS NOT NULL;

--> 6. Darsni kim oʻtadi — eski egalikdan biriktirish yasaladi.
--> Busiz hamma oʻqituvchi oʻz sinfini koʻrmay qolardi: koʻrinuvchanlik
--> endi `class_teachers` ga tayanadi.
INSERT INTO "class_teachers" ("class_id", "teacher_id")
SELECT c."id", c."teacher_id"
FROM "classes" c
WHERE c."teacher_id" IS NOT NULL
ON CONFLICT ("class_id", "teacher_id") DO NOTHING;

--> 7. Yozilish — `students.class_id` + `sort_order` shu yerga koʻchadi
INSERT INTO "enrollments" ("class_id", "student_id", "sort_order")
SELECT s."class_id", s."id", s."sort_order"
FROM "students" s
WHERE s."class_id" IS NOT NULL
ON CONFLICT ("class_id", "student_id") DO NOTHING;

/* ── Eski tuzilmani olib tashlash ─────────────────────────────────── */

--> `schools` boʻsh jadval edi (0 qator, hech kim biriktirilmagan).
--> ⚠️ CASCADE `teachers_school_id_schools_id_fk` ni ham oʻchiradi, shu
--> bois keyingi DROP CONSTRAINT `IF EXISTS` bilan.
DROP TABLE IF EXISTS "schools" CASCADE;
ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "teachers_school_id_schools_id_fk";
ALTER TABLE "classes" DROP CONSTRAINT IF EXISTS "classes_teacher_id_teachers_id_fk";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_teacher_id_teachers_id_fk";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_class_id_classes_id_fk";

ALTER TABLE "classes" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "workspace_id" SET NOT NULL;
ALTER TABLE "classes" ADD CONSTRAINT "classes_parent_class_id_classes_id_fk" FOREIGN KEY ("parent_class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "teachers" DROP COLUMN "school_id";
ALTER TABLE "classes" DROP COLUMN "teacher_id";
ALTER TABLE "students" DROP COLUMN "teacher_id";
ALTER TABLE "students" DROP COLUMN "class_id";
ALTER TABLE "students" DROP COLUMN "sort_order";

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('6e53010f4b64a05174111c1f5ec23a821e9f6767a08f484c553c2ec0ca299448', 1787383320390);

/* ── Migratsiya 0036_sinf_egasi ─────────────────────── */
ALTER TABLE "class_teachers" ADD COLUMN "role" text DEFAULT 'teacher' NOT NULL;
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

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('bb6f3ff2c1137dddad0ac130e6468d35e1410b91423b20751b7d680e80149479', 1787742198754);

/* ── Migratsiya 0037_hamkasb_taklifi ─────────────────────── */
CREATE TABLE "workspace_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"workspace_id" text NOT NULL,
	"role" text DEFAULT 'teacher' NOT NULL,
	"created_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"used_by" text,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invites_code_unique" UNIQUE("code")
);

ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_created_by_teachers_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."teachers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_used_by_teachers_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "workspace_invites_workspace_idx" ON "workspace_invites" USING btree ("workspace_id");

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('0b76c1d82bab4937a3055365f8b4510536de443734c8052d4daa6f43f1619725', 1787743673224);

/* ── Migratsiya 0038_maydon_auditi ─────────────────────── */
CREATE TABLE "workspace_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"actor_teacher_id" text,
	"actor_name" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"target_label" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "workspace_audit_logs" ADD CONSTRAINT "workspace_audit_logs_actor_teacher_id_teachers_id_fk" FOREIGN KEY ("actor_teacher_id") REFERENCES "public"."teachers"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "workspace_audit_workspace_idx" ON "workspace_audit_logs" USING btree ("workspace_id","created_at");

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('7a435a3bbc4f84afb4c0b204a83fa8361f7a6fab38fd78498fc30a4c49cbc5fb', 1787744649671);

/* ── Koʻrinishlarni yangi model boʻyicha yaratish ──────────────── */

/* ── v_unified_classes ─────────────────────────────────────────────
   `uzc.teacher_id` → sinf EGASI. */
CREATE VIEW v_unified_classes AS
 SELECT bc.id AS ll_class_id,
    cl.uz_class_id,
    bc.user_id AS ll_user_id,
    owner_a.teacher_id AS uz_teacher_id,
        CASE
            WHEN (cl.origin = 'ustozona'::text) THEN COALESCE(uzc.name, bc.name)
            ELSE COALESCE(bc.name, uzc.name)
        END AS name,
    COALESCE(bc.subject, (uzc.subject)::character varying) AS subject,
    COALESCE(bc.grade, uzc.grade) AS grade,
        CASE
            WHEN (cl.ll_class_id IS NULL) THEN 'lessonlab_only'::text
            ELSE 'linked'::text
        END AS presence,
    cl.origin
   FROM bot_classes bc
     LEFT JOIN class_links cl ON cl.ll_class_id = bc.id
     LEFT JOIN classes uzc ON uzc.id = cl.uz_class_id
     LEFT JOIN LATERAL (
       SELECT ct.teacher_id
         FROM class_teachers ct
        WHERE ct.class_id = uzc.id AND ct.role = 'owner'
        ORDER BY ct.created_at, ct.teacher_id
        LIMIT 1
     ) owner_a ON true
UNION ALL
 SELECT NULL::integer AS ll_class_id,
    c.id AS uz_class_id,
    vb.ll_user_id,
    owner_b.teacher_id AS uz_teacher_id,
    c.name,
    c.subject,
    c.grade,
    'ustozona_only'::text AS presence,
    NULL::text AS origin
   FROM classes c
     LEFT JOIN class_links cl ON cl.uz_class_id = c.id
     LEFT JOIN LATERAL (
       SELECT ct.teacher_id
         FROM class_teachers ct
        WHERE ct.class_id = c.id AND ct.role = 'owner'
        ORDER BY ct.created_at, ct.teacher_id
        LIMIT 1
     ) owner_b ON true
     LEFT JOIN v_teacher_bridge vb ON vb.uz_teacher_id = owner_b.teacher_id
  WHERE cl.uz_class_id IS NULL;

/* ── v_unified_students ────────────────────────────────────────────
   `uzs.class_id` → ENG ESKI yozilish (asosiy sinf). */
CREATE VIEW v_unified_students AS
 SELECT bs.id AS ll_student_id,
    rl.uz_student_id,
    bs.class_id AS ll_class_id,
    enr_a.class_id AS uz_class_id,
        CASE
            WHEN (rl.origin = 'ustozona'::text) THEN COALESCE(uzs.name, bs.full_name)
            ELSE COALESCE(bs.full_name, uzs.name)
        END AS display_name,
    bs.student_id_in_class AS sheet_no,
    uzs.student_number AS uz_student_number,
    COALESCE(uzs.status, 'active'::text) AS status,
        CASE
            WHEN (rl.ll_student_id IS NULL) THEN 'lessonlab_only'::text
            ELSE 'linked'::text
        END AS presence,
    uzs.birth_date,
    uzs.parent_name,
    uzs.parent_phone,
    uzs.nickname
   FROM bot_students bs
     LEFT JOIN roster_links rl ON rl.ll_student_id = bs.id
     LEFT JOIN students uzs ON uzs.id = rl.uz_student_id
     LEFT JOIN LATERAL (
       SELECT e.class_id
         FROM enrollments e
        WHERE e.student_id = uzs.id
        ORDER BY e.created_at, e.class_id
        LIMIT 1
     ) enr_a ON true
UNION ALL
 SELECT NULL::integer AS ll_student_id,
    s.id AS uz_student_id,
    cl.ll_class_id,
    enr_b.class_id AS uz_class_id,
    s.name AS display_name,
    NULL::integer AS sheet_no,
    s.student_number AS uz_student_number,
    s.status,
    'ustozona_only'::text AS presence,
    s.birth_date,
    s.parent_name,
    s.parent_phone,
    s.nickname
   FROM students s
     LEFT JOIN roster_links rl ON rl.uz_student_id = s.id
     LEFT JOIN LATERAL (
       SELECT e.class_id
         FROM enrollments e
        WHERE e.student_id = s.id
        ORDER BY e.created_at, e.class_id
        LIMIT 1
     ) enr_b ON true
     LEFT JOIN class_links cl ON cl.uz_class_id = enr_b.class_id
  WHERE rl.uz_student_id IS NULL;

/* ── v_duplicate_candidates ────────────────────────────────────────
   ⭐ Bu yerda EGA emas, BIRIKTIRISH ishlatiladi: oʻqituvchi oʻzi
   OʻTADIGAN sinfni botdagi sinf bilan bogʻlay olishi kerak, egasi
   boʻlmasa ham. Oʻquvchi sanogʻi endi `enrollments` dan — bu eski
   holatdan ANIQROQ, chunki bola bir necha guruhda boʻlishi mumkin. */
CREATE VIEW v_duplicate_candidates AS
 WITH pair AS (
         SELECT bc.id AS ll_class_id,
            c.id AS uz_class_id,
            vb.uz_teacher_id,
            vb.ll_user_id,
            bc.name AS ll_name,
            c.name AS uz_name
           FROM v_teacher_bridge vb
             JOIN bot_classes bc ON bc.user_id = vb.ll_user_id
             JOIN class_teachers ct ON ct.teacher_id = vb.uz_teacher_id
             JOIN classes c ON c.id = ct.class_id
          WHERE norm_key(bc.name) = norm_key(c.name)
            AND NOT EXISTS (SELECT 1 FROM class_links l WHERE l.ll_class_id = bc.id)
            AND NOT EXISTS (SELECT 1 FROM class_links l WHERE l.uz_class_id = c.id)
        )
 SELECT ll_class_id,
    uz_class_id,
    uz_teacher_id,
    ll_user_id,
    ll_name,
    uz_name,
    ( SELECT count(*) FROM bot_students bs
       WHERE bs.class_id = p.ll_class_id) AS ll_students,
    ( SELECT count(*) FROM enrollments e
       WHERE e.class_id = p.uz_class_id) AS uz_students,
    ( SELECT count(*) FROM bot_students bs
       WHERE bs.class_id = p.ll_class_id
         AND EXISTS ( SELECT 1
                        FROM enrollments e
                        JOIN students s ON s.id = e.student_id
                       WHERE e.class_id = p.uz_class_id
                         AND norm_person(s.name) = norm_person(bs.full_name))) AS same_students
   FROM pair p;

/* ── v_teacher_totals ──────────────────────────────────────────────
   Oʻzgarmadi — faqat bogʻliqlik tartibi uchun qayta yaratiladi. */
CREATE VIEW v_teacher_totals AS
 SELECT t.id AS uz_teacher_id,
    ut.telegram_id AS ll_user_id,
    ( SELECT count(*) AS count
           FROM v_unified_classes c
          WHERE ((c.uz_teacher_id = t.id) OR ((ut.telegram_id IS NOT NULL) AND (c.ll_user_id = (ut.telegram_id)::bigint)))) AS class_count,
    ( SELECT count(*) AS count
           FROM (v_unified_students s
             JOIN v_unified_classes c ON ((((s.ll_class_id IS NOT NULL) AND (s.ll_class_id = c.ll_class_id)) OR ((s.uz_class_id IS NOT NULL) AND (s.uz_class_id = c.uz_class_id)))))
          WHERE ((c.uz_teacher_id = t.id) OR ((ut.telegram_id IS NOT NULL) AND (c.ll_user_id = (ut.telegram_id)::bigint)))) AS student_count
   FROM (teachers t
     LEFT JOIN user_telegram ut ON ((ut.user_id = t.id)));

COMMIT;


/* ═══════════════════════════════════════════════════════════════════
   TEKSHIRUV — COMMIT dan KEYIN alohida yuriting.

   Yuqoridagi hammasi bitta tranzaksiyada. Xato boʻlsa Supabase xabar
   beradi va HECH NARSA oʻzgarmaydi — qayta urinish xavfsiz.
   ═══════════════════════════════════════════════════════════════════ */

-- ① Yetim yozuv qolmadimi (hammasi 0 boʻlishi kerak)
--
-- SELECT
--   (SELECT count(*) FROM classes  WHERE workspace_id IS NULL) AS sinf_maydonsiz,
--   (SELECT count(*) FROM students WHERE workspace_id IS NULL) AS oquvchi_maydonsiz,
--   (SELECT count(*) FROM teachers t
--     WHERE NOT EXISTS (SELECT 1 FROM workspace_members m
--                        WHERE m.teacher_id = t.id))          AS teacher_maydonsiz,
--   (SELECT count(*) FROM classes c
--     WHERE NOT EXISTS (SELECT 1 FROM class_teachers ct
--                        WHERE ct.class_id = c.id AND ct.role = 'owner')) AS sinf_egasiz;

-- ② ⭐ ENG MUHIMI — barmoq izlari OʻZGARMASLIGI kerak
--
-- SELECT 'v_unified_classes' AS nom,
--        md5(string_agg(t::text, '|' ORDER BY t::text)) AS barmoq_izi
--   FROM v_unified_classes t
-- UNION ALL SELECT 'v_unified_students',
--        md5(string_agg(t::text, '|' ORDER BY t::text)) FROM v_unified_students t
-- UNION ALL SELECT 'v_teacher_totals',
--        md5(string_agg(t::text, '|' ORDER BY t::text)) FROM v_teacher_totals t
--  ORDER BY nom;
--
-- Kutilgan natija (docs/prod-migratsiya-oldingi-holat.md):
--   v_teacher_totals     5670ee33a68c0eec0fa75188e2e65571   (17 qator)
--   v_unified_classes    099070656494ff43f1d6d4db383a732f   (36 qator)
--   v_unified_students   c68c7378f9177a4d224a44a1cb52eefb   (503 qator)
