/* ════════════════════════════════════════════════════════════════════
   LESSONLAB KOʻRINISHLARI — ESKI (migratsiyagacha) TAʼRIFLARI

   ⚠️ Bu fayl QAYTARISH (rollback) uchun. Ish maydoni migratsiyasi
   (0034–0035) muvaffaqiyatsiz tugasa va sxema `pg_dump` dan tiklansa,
   koʻrinishlar ham SHU holatga qaytarilishi kerak.

   Prod'dan 2026-08-26 da `pg_views` orqali olindi.

   ⚠️ Bu koʻrinishlar Drizzle migratsiyalarida YOʻQ edi — ular
   toʻgʻridan-toʻgʻri Supabase'da yaratilgan. Aynan shuning uchun
   Neon'da (dev) muammo chiqmadi va toʻsiq faqat prodga chiqishda
   maʼlum boʻldi. Endi ikkala taʼrif ham repo'da versiyalanadi.
   ════════════════════════════════════════════════════════════════════ */

CREATE OR REPLACE VIEW v_unified_classes AS
 SELECT bc.id AS ll_class_id,
    cl.uz_class_id,
    bc.user_id AS ll_user_id,
    uzc.teacher_id AS uz_teacher_id,
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
   FROM ((bot_classes bc
     LEFT JOIN class_links cl ON ((cl.ll_class_id = bc.id)))
     LEFT JOIN classes uzc ON ((uzc.id = cl.uz_class_id)))
UNION ALL
 SELECT NULL::integer AS ll_class_id,
    c.id AS uz_class_id,
    vb.ll_user_id,
    c.teacher_id AS uz_teacher_id,
    c.name,
    c.subject,
    c.grade,
    'ustozona_only'::text AS presence,
    NULL::text AS origin
   FROM ((classes c
     LEFT JOIN class_links cl ON ((cl.uz_class_id = c.id)))
     LEFT JOIN v_teacher_bridge vb ON ((vb.uz_teacher_id = c.teacher_id)))
  WHERE (cl.uz_class_id IS NULL);

CREATE OR REPLACE VIEW v_unified_students AS
 SELECT bs.id AS ll_student_id,
    rl.uz_student_id,
    bs.class_id AS ll_class_id,
    uzs.class_id AS uz_class_id,
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
   FROM ((bot_students bs
     LEFT JOIN roster_links rl ON ((rl.ll_student_id = bs.id)))
     LEFT JOIN students uzs ON ((uzs.id = rl.uz_student_id)))
UNION ALL
 SELECT NULL::integer AS ll_student_id,
    s.id AS uz_student_id,
    cl.ll_class_id,
    s.class_id AS uz_class_id,
    s.name AS display_name,
    NULL::integer AS sheet_no,
    s.student_number AS uz_student_number,
    s.status,
    'ustozona_only'::text AS presence,
    s.birth_date,
    s.parent_name,
    s.parent_phone,
    s.nickname
   FROM ((students s
     LEFT JOIN roster_links rl ON ((rl.uz_student_id = s.id)))
     LEFT JOIN class_links cl ON ((cl.uz_class_id = s.class_id)))
  WHERE (rl.uz_student_id IS NULL);

CREATE OR REPLACE VIEW v_duplicate_candidates AS
 WITH pair AS (
         SELECT bc.id AS ll_class_id,
            c.id AS uz_class_id,
            vb.uz_teacher_id,
            vb.ll_user_id,
            bc.name AS ll_name,
            c.name AS uz_name
           FROM ((v_teacher_bridge vb
             JOIN bot_classes bc ON ((bc.user_id = vb.ll_user_id)))
             JOIN classes c ON ((c.teacher_id = vb.uz_teacher_id)))
          WHERE ((norm_key(bc.name) = norm_key(c.name)) AND (NOT (EXISTS ( SELECT 1
                   FROM class_links l
                  WHERE (l.ll_class_id = bc.id)))) AND (NOT (EXISTS ( SELECT 1
                   FROM class_links l
                  WHERE (l.uz_class_id = c.id)))))
        )
 SELECT ll_class_id,
    uz_class_id,
    uz_teacher_id,
    ll_user_id,
    ll_name,
    uz_name,
    ( SELECT count(*) AS count
           FROM bot_students bs
          WHERE (bs.class_id = p.ll_class_id)) AS ll_students,
    ( SELECT count(*) AS count
           FROM students s
          WHERE (s.class_id = p.uz_class_id)) AS uz_students,
    ( SELECT count(*) AS count
           FROM bot_students bs
          WHERE ((bs.class_id = p.ll_class_id) AND (EXISTS ( SELECT 1
                   FROM students s
                  WHERE ((s.class_id = p.uz_class_id) AND (norm_person(s.name) = norm_person(bs.full_name))))))) AS same_students
   FROM pair p;

CREATE OR REPLACE VIEW v_teacher_totals AS
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
