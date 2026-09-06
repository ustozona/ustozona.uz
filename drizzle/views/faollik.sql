/* ════════════════════════════════════════════════════════════════════
   OʻQITUVCHI FAOLLIGI — yagona taʼrif.

   Muammo (2026-09-06 da topildi): faollik faqat `attendance_records`
   va `grades` boʻyicha oʻlchanardi. Yaʼni bir yil dars rejalashtirgan,
   jadval tuzgan, standart yozgan, test oʻtkazgan oʻqituvchi panelda
   «hech qachon ishlamagan» boʻlib turardi va «Eʼtibor kerak»
   roʻyxatiga tushardi. Voronka esa faollashuvni past koʻrsatardi.

   Bundan tashqari ikki fayl ikki xil taʼrif ishlatardi:
     stats.ts  → davomat + baho + DARS
     users.ts  → davomat + baho
   Bitta odam ikki ekranda ikki xil «Oxirgi ish» sanasi bilan koʻrinardi.

   Yechim `v_teacher_totals` bilan bir xil: taʼrif SQL'da, bir joyda.
   Panel, hisobot va bot AYNAN bir xil raqamni koʻradi.

   ⚠️ BU FAYL `lessonlab-*.sql` DAN MUSTAQIL — ataylab. U yerdagi
   koʻrinishlar bot jadvallariga (`bot_classes`…) tayanadi va faqat
   prodda mavjud. Bu yerdagilar esa faqat Ustozona jadvallarini
   ishlatadi, demak lokal Neon'da ham ishlaydi.

   Qoʻllash (ikkala bazada ham):
       psql "$DATABASE_URL" -f drizzle/views/faollik.sql
   ════════════════════════════════════════════════════════════════════ */

DROP VIEW IF EXISTS v_teacher_session_stats;
DROP VIEW IF EXISTS v_teacher_sessions;
DROP VIEW IF EXISTS v_teacher_activity_summary;
DROP VIEW IF EXISTS v_teacher_activity;

/* ── v_teacher_activity ────────────────────────────────────────────
   Har bir ish harakati bitta qator: kim, qaysi boʻlimda, qachon.

   ⚠️ VAQT USTUNI TURI JADVALGA QARAB FARQ QILADI. Koʻpchiligi
   `timestamptz`, lekin `behavior_*` va `student_notes` vaqtni MATN
   (ISO satr) sifatida saqlaydi (sxemada `text("created_at")`).
   Shu bois CASE ichida shakl tekshiriladi: buzuq satr `NULL` beradi
   va pastda filtrlanadi. Toʻgʻridan-toʻgʻri `::timestamptz` qilinsa,
   bitta buzuq qator BUTUN koʻrinishni yiqitardi.

   ⚠️ Matn ustunlar indeksdan foydalanmaydi — ular ustida sana
   boʻyicha filtr sekin. Hozircha hajm kichik; sezilsa shu ustunlarni
   `timestamptz` ga koʻchirish kerak (alohida migratsiya).

   Boʻlim nomlari 12 ta — «kenglik» (nechta boʻlim ishlatilgan)
   shu roʻyxatga nisbatan hisoblanadi. */
CREATE VIEW v_teacher_activity AS
SELECT * FROM (
    SELECT teacher_id, 'davomat'::text AS area, updated_at AS at FROM attendance_records
    UNION ALL SELECT teacher_id, 'baho',      updated_at FROM grades
    UNION ALL SELECT teacher_id, 'dars',      updated_at FROM lessons
    UNION ALL SELECT teacher_id, 'mavzu',     updated_at FROM units
    UNION ALL SELECT teacher_id, 'mavzu',     updated_at FROM topics
    UNION ALL SELECT teacher_id, 'topshiriq', updated_at FROM assignments
    UNION ALL SELECT teacher_id, 'vazifa',    updated_at FROM tasks
    UNION ALL SELECT teacher_id, 'jadval',    updated_at FROM timetable_versions
    UNION ALL SELECT teacher_id, 'jadval',    updated_at FROM calendars
    UNION ALL SELECT teacher_id, 'standart',  updated_at FROM standard_sets
    UNION ALL SELECT teacher_id, 'test',      updated_at FROM activities
    UNION ALL SELECT teacher_id, 'test',      updated_at FROM activity_sets
    UNION ALL SELECT teacher_id, 'test',      created_at FROM omr_scans
    UNION ALL SELECT teacher_id, 'test',      created_at FROM cj_tasks
    UNION ALL SELECT teacher_id, 'viktorina', updated_at FROM quiz_sessions
    UNION ALL SELECT teacher_id, 'qayd',      updated_at FROM class_notes

    /* Matn (ISO) ustunlar — yuqoridagi izohga qarang. */
    UNION ALL SELECT teacher_id, 'xulq',
        CASE WHEN created_at ~ '^\d{4}-\d{2}-\d{2}' THEN created_at::timestamptz END
        FROM behavior_events
    UNION ALL SELECT teacher_id, 'xulq',
        CASE WHEN updated_at ~ '^\d{4}-\d{2}-\d{2}' THEN updated_at::timestamptz END
        FROM behavior_rewards
    UNION ALL SELECT teacher_id, 'qayd',
        CASE WHEN created_at ~ '^\d{4}-\d{2}-\d{2}' THEN created_at::timestamptz END
        FROM student_notes
) x
WHERE at IS NOT NULL
  /* Kelajakdagi sana — soat notoʻgʻri qoʻyilgan qurilma yoki import
     xatosi. Filtrlanmasa «oxirgi ish» abadiy bugun boʻlib turardi. */
  AND at <= now() + interval '1 day';

COMMENT ON VIEW v_teacher_activity IS
  'Oʻqituvchining har bir ish harakati (12 boʻlim). Faollik taʼrifining yagona manbai.';

/* ── v_teacher_activity_summary ────────────────────────────────────
   Har oʻqituvchi uchun bitta qator — panel shuni oʻqiydi.

   ⭐ `active_days_*` — RAQAM EMAS, KUN sanaydi. Bu ataylab: 400 ta
   davomat yozuvi bir kunda = bitta ommaviy amal, foydalanuvchi emas.
   12 ta faol kun = haqiqiy foydalanuvchi. Kun boʻyicha oʻlchov
   ommaviy amal bilan shishirilmaydi.

   `last_area` — «Oxirgi ish» ustunida NIMA qilgani koʻrsatiladi,
   faqat qachonligi emas. */
/* ⚠️ HAR SANOQDA `::int` — postgres-js `count(*)` ni bigint deb oladi
   va u JS'ga SATR boʻlib keladi. Busiz «5» + 1 = «51» boʻlardi
   (dal/admin/users.ts dagi `listTeacherTotals` da aynan shu tuzoq).

   Kun chegarasi Toshkent vaqti boʻyicha: UTC'da kechqurun 21:00 dagi
   ish ertangi kunga oʻtib ketardi va «faol kunlar» shishardi. */
CREATE VIEW v_teacher_activity_summary AS
SELECT
    teacher_id,
    MIN(at)                                   AS first_at,
    MAX(at)                                   AS last_at,
    (array_agg(area ORDER BY at DESC))[1]     AS last_area,
    COUNT(DISTINCT (at AT TIME ZONE 'Asia/Tashkent')::date)::int AS active_days_total,
    COUNT(DISTINCT area)::int                 AS areas_total,
    COUNT(DISTINCT (at AT TIME ZONE 'Asia/Tashkent')::date)
      FILTER (WHERE at > now() - interval '30 days')::int   AS active_days_30d,
    COUNT(DISTINCT area)
      FILTER (WHERE at > now() - interval '30 days')::int   AS areas_30d,
    COUNT(DISTINCT (at AT TIME ZONE 'Asia/Tashkent')::date)
      FILTER (WHERE at > now() - interval '7 days')::int    AS active_days_7d
FROM v_teacher_activity
GROUP BY teacher_id;

COMMENT ON VIEW v_teacher_activity_summary IS
  'Oʻqituvchi boʻyicha faollik xulosasi: oxirgi ish, boʻlim kengligi, faol kunlar.';

/* ── v_teacher_sessions ────────────────────────────────────────────
   Ish seanslari — MAVJUD vaqt belgilaridan tiklanadi.

   ⭐ Yangi jadval ham, heartbeat ham, mijoz kodi ham KERAK EMAS, va
   u ORQAGA QARAB ishlaydi: bugun yaratilsa ham oʻtgan yilgi maʼlumot
   boʻyicha seans beradi.

   Qoida: ikki harakat orasi 30 daqiqadan katta boʻlsa — yangi seans
   (veb-analitikadagi standart taʼrif).

   ⚠️ CHEKLOV — RAQAM PAST CHIQADI. Bu HARAKATLAR ORASIDAGI vaqtni
   oʻlchaydi. Oʻqituvchi 10 daqiqa hisobotni oʻqib, hech nima
   yozmasa — u vaqt koʻrinmaydi. Trend va ekranlarni solishtirish
   uchun yetarli, «haqiqiy vaqt» sifatida taqdim etilmasin.

   Bitta harakatli seans 0 daqiqa chiqadi — 3 daqiqa deb olinadi,
   aks holda «kirdi, bitta baho qoʻydi, chiqdi» butunlay yoʻqolardi. */
CREATE VIEW v_teacher_sessions AS
WITH marked AS (
    SELECT
        teacher_id,
        at,
        CASE
            WHEN LAG(at) OVER w IS NULL
              OR at - LAG(at) OVER w > interval '30 minutes'
            THEN 1 ELSE 0
        END AS is_new
    FROM v_teacher_activity
    WINDOW w AS (PARTITION BY teacher_id ORDER BY at)
),
grouped AS (
    SELECT
        teacher_id,
        at,
        SUM(is_new) OVER (PARTITION BY teacher_id ORDER BY at
                          ROWS UNBOUNDED PRECEDING) AS session_no
    FROM marked
)
SELECT
    teacher_id,
    session_no,
    MIN(at) AS started_at,
    MAX(at) AS ended_at,
    COUNT(*)::int AS action_count,
    GREATEST(
        EXTRACT(epoch FROM MAX(at) - MIN(at)) / 60.0,
        3
    )::numeric(10, 1) AS minutes
FROM grouped
GROUP BY teacher_id, session_no;

COMMENT ON VIEW v_teacher_sessions IS
  'Ish seanslari, mavjud vaqt belgilaridan tiklangan (30 daqiqalik uzilish qoidasi).';

/* ── v_teacher_session_stats ───────────────────────────────────────
   ⚠️ MEDIAN, OʻRTACHA EMAS — ataylab.

   Oʻqituvchilar ikki xil ishlaydi: darslar orasida 3 daqiqalik qisqa
   kirish, kechqurun 40 daqiqalik uzun seans. Bu ikki choʻqqili
   taqsimot va oʻrtacha qiymat ikkalasini ham notoʻgʻri koʻrsatadi.

   ⚠️ VAQT — DIAGNOSTIKA, SOGʻLIQ KOʻRSATKICHI EMAS. Oʻqituvchi ish
   quroli uchun ilovada oʻtkazilgan vaqt XARAJAT, qiymat emas: agar
   davomat belgilash 11 daqiqa olsa, bu ekran buzuq degani. Bu raqamni
   OʻSTIRISHGA harakat qilinmasin — mahsulot yomonlashadi. Sogʻliq
   koʻrsatkichi `active_days_30d` boʻlib qoladi. */
CREATE VIEW v_teacher_session_stats AS
SELECT
    teacher_id,
    COUNT(*) FILTER (WHERE started_at > now() - interval '30 days')::int
        AS sessions_30d,
    /* `numeric` ham JS'ga SATR boʻlib keladi — `float8` esa son.
       Daqiqada aniqlik muhim emas, shuning uchun xavfsiz. */
    (percentile_cont(0.5) WITHIN GROUP (ORDER BY minutes)
        FILTER (WHERE started_at > now() - interval '30 days'))::float8
        AS median_minutes_30d,
    (percentile_cont(0.9) WITHIN GROUP (ORDER BY minutes)
        FILTER (WHERE started_at > now() - interval '30 days'))::float8
        AS p90_minutes_30d,
    (SUM(minutes) FILTER (WHERE started_at > now() - interval '30 days'))::float8
        AS total_minutes_30d
FROM v_teacher_sessions
GROUP BY teacher_id;

COMMENT ON VIEW v_teacher_session_stats IS
  'Seans statistikasi. Median — oʻrtacha emas: taqsimot ikki choʻqqili.';
