/* ════════════════════════════════════════════════════════════════════
   LESSONLAB KOʻRINISHLARI — ISH MAYDONI MODELIGA MOSLANGAN

   Qachon ishlatiladi: 0034–0035 migratsiyasi qoʻllangandan KEYIN.
   Toʻliq tartib: docs/prod-migratsiya-reja.md

   ⛔ `DROP ... CASCADE` ISHLATILMAYDI. U koʻrinishlarni jimgina
   oʻchirib yuboradi va LessonLab integratsiyasi (bot ↔ Ustozona
   bogʻlanishi) sezdirmasdan buziladi.

   ─────────────────────────────────────────────────────────────────
   NIMA OʻZGARDI VA NEGA

   Migratsiya uchta ustunni oʻchiradi. Koʻrinishlar ularga tayangan:

   | Eski ustun | Yangi manba |
   |---|---|
   | `classes.teacher_id` | `class_teachers` (koʻp-koʻpga) |
   | `students.class_id`  | `enrollments` (koʻp-koʻpga) |

   🔴 ASOSIY QIYINCHILIK — KARDINALLIK. Eski ustunlar SKALYAR edi
   (bitta sinf → bitta oʻqituvchi, bitta bola → bitta sinf). Yangi
   modelda ikkalasi ham KOʻP-KOʻPGA. Toʻgʻridan-toʻgʻri JOIN qilinsa
   koʻrinish qatorlari KOʻPAYIB ketardi — va LessonLab boti buni
   "dublikat" deb qabul qilardi.

   Shuning uchun ikkala joyda ham BITTA vakil tanlanadi:

   - Sinf uchun — EGA (`class_teachers.role = 'owner'`). Bu eski
     `classes.teacher_id` ning eng yaqin maʼnodoshi: "bu sinf kimniki".
   - Bola uchun — ENG ESKI YOZILISH. Eski modelda bolaning bitta sinfi
     bor edi va u aynan birinchi qoʻshilgan sinf boʻlardi.

   ⚠️ Bu YOʻQOTISH bilan keladi: ikki oʻqituvchi oʻtadigan sinf botda
   faqat egasi bilan koʻrinadi, ikki guruhdagi bola faqat birinchi
   guruhi bilan. Bot uchun bu eski holatdan yomonroq EMAS (u yerda ham
   bittadan ortigʻi yoʻq edi), lekin yangi modeldagi toʻliqlikni ham
   koʻrsatmaydi. Toʻliq yechim — botga koʻp-koʻpga shartnoma berish,
   u alohida ish.
   ════════════════════════════════════════════════════════════════════ */

/* Bogʻliqlik tartibi: v_teacher_totals ikkalasiga tayanadi, shuning
   uchun U BIRINCHI oʻchadi va OXIRIDA yaratiladi. */
DROP VIEW IF EXISTS v_teacher_totals;
DROP VIEW IF EXISTS v_duplicate_candidates;
DROP VIEW IF EXISTS v_unified_students;
DROP VIEW IF EXISTS v_unified_classes;

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
