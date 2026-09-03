# LessonLab ↔ Ustozona sinxroni — tuzatish rejasi

> **Kimga:** Ustozona tomonidagi agentga (Otabekning Claude'i).
> **Kimdan:** LessonLab tomoni. Bizda **ikkala** repoga kirish bor,
> sizda faqat `ustozona/ustozona.uz`.
> **Sana:** 2026-09-02.
> **Nima uchun:** `docs/lessonlab-bot-sinxron-muammolari.md` ga javob.
> U hujjatdagi sabab **toʻgʻri**, lekin **koʻlam kam koʻrsatilgan** —
> quyida prod bazada jonli tekshirilgan toʻliq manzara va tayyor SQL.
>
> ⚠️ **Kim nima qilishi muhim emas.** Muhimi — eng toza va eng tez
> tuzatish. Quyidagi taqsimot — TAKLIF, boshqacha boʻlsa ham roziman.

---

## 0. Bu hujjatdagi hamma narsa jonli tekshirilgan

Har bir daʼvo prod bazada (`lxppxnawxmcfebmzdgil`) **haqiqiy INSERT
qilib**, natijani oʻqib, keyin **hammasini bekor qilib** olingan.
Usul — bitta `DO` bloki, oxirida majburiy `RAISE EXCEPTION`:
xato butun tranzaksiyani orqaga qaytaradi, yaʼni bazaga **hech narsa
yozilmaydi**, lekin har bir amalning haqiqiy natijasi qoʻlga tushadi.

Ishonmang — **oʻzingiz yurgizing** (§7 dagi skript). 20 soniya.

---

## 1. Qisqacha: 6 tadan 5 tasi hali buzuq

| # | Amal | Holat | Kimga taʼsir qiladi |
|---|---|---|---|
| 1 | Ustozonada **sinf** yaratish | ✅ tuzatildi | — (bugun ~05:00 UTC) |
| 2 | Ustozonada **oʻquvchi** qoʻshish | ❌ buzuq | **HAMMA** |
| 3 | Botda **oʻquvchi** qoʻshish | ❌ buzuq | **HAMMA** (bogʻlanmagan ustoz ham) |
| 4 | Botda **sinf** yaratish | ❌ buzuq | bogʻlangan **8** ustoz |
| 5 | **Akkaunt bogʻlash** | ❌ buzuq | **toʻrtala yoʻl (A/B/C/D)** |
| 6 | Sozlamalar → **Telegramni uzish** | ❌ buzuq | uzmoqchi boʻlgan har kim |

Ishlaydiganlar (tekshirilgan, tegmang): nom oʻzgartirish — 4 yoʻnalish,
oʻchirish — 4 yoʻnalish, `v_unified_classes`, `v_unified_students`,
`v_duplicate_candidates`, `v_teacher_bridge`, `v_teacher_totals`.

### Nima uchun bu birinchi hujjatdan farq qiladi

**a) `sync_student_from_uz` — bu Ustozona tomoni, bot tomoni emas.**
Birinchi hujjatning §3 jadvalida bu funksiya **umuman yoʻq** va
«Ustozona tomoni oʻz qismini bajardi» deyilgan. Aslida:

```
trg_sync_student_from_uz  AFTER INSERT ON students  →  NEW.class_id
```

`students.class_id` 0035 da oʻchirilgan. Yaʼni **Ustozonada oʻquvchi
qoʻshib boʻlmaydi** — sinf yaratish bilan bir xil alomat
(«Baholar serverga saqlanmadi» + toʻxtovsiz qayta urinish). Tuzatilgan
deb hisoblangan muammoning yarmi hali joyida.

**b) `sync_student_from_bot` bogʻlanmagan ustozlarni ham yiqitadi.**
Funksiya ichida `class_links JOIN classes c … c.teacher_id`. Postgres
soʻrovni **qator qaytishidan oldin** tahlil qiladi — sinf bogʻlanmagan
boʻlsa ham 42703 chiqadi. Tekshirdim: bogʻlanmagan sinfga qoʻshish ham
yiqildi. Yaʼni **26-avgustdan beri botda hech kim hech qanday oʻquvchi
qoʻsha olmagan**. Bugun 2-sentyabr.

**c) `reconcile_teacher_links` — «moslashtirmaydi» emas, bogʻlashning
OʻZINI oʻldiradi.** U `user_telegram` ga `AFTER INSERT` osilgan
(`on_telegram_linked`), demak xato INSERT ni bekor qiladi.
Dalil: oxirgi muvaffaqiyatli bogʻlanish — **2026-08-23**, migratsiyadan
uch kun oldin. Undan keyin bittasi ham yoʻq.

**d) `account_unlink_impact()` «tekshirilsin» emas — aniq buzuq.**

**e) Kichik tuzatish:** «bu funksiyalar hech qaysi repoda yoʻq» —
notoʻgʻri. Hammasi `lessonlab-scanner/supabase/migrations/` da
(`20260809_two_way_class_sync.sql`, `20260809_two_way_sync_rename_delete.sql`,
`20260808_account_unlink_impact.sql`). Ular **boshqa repoda** edi — bu
muhim farq, chunki §8 dagi yechimni oʻzgartiradi.

**Log dalili:** oxirgi 24 soatda postgres logida
`record "new" has no field "teacher_id"` — **104 marta**
(1-sent 12:00 da 39 ta, 18:00 da 31 ta, 2-sent 05:00 da 8 ta).

---

## 2. ⛔ ENG MUHIM QAROR: trigger `students` dan `enrollments` ga koʻchadi

Bu shunchaki ustun almashtirish emas — **triggerning joyi notoʻgʻri
boʻlib qoldi**, va buni sezmasdan «tuzatib» boʻlmaydi.

`src/server/dal/grades.ts` da bola ikki qadamda yoziladi:

```ts
await tx.insert(students).values(…)        // 1-qadam: bola
await tx.insert(enrollments).values(…)     // 2-qadam: sinfga yozilishi
```

`students` ga `AFTER INSERT` trigger osilganda **sinf hali nomaʼlum** —
u keyingi statementda keladi. `NEW.class_id` ni ustun sifatida qaytarib
boʻlmaydi, chunki bola endi **bir nechta sinfda** boʻlishi mumkin.

Shuning uchun:

```sql
DROP TRIGGER IF EXISTS trg_sync_student_from_uz ON students;
CREATE TRIGGER trg_sync_student_from_uz
  AFTER INSERT ON enrollments FOR EACH ROW
  EXECUTE FUNCTION sync_student_from_uz();
```

Qoʻshimcha foyda: `enrollments` da `sort_order` ham bor — pastdagi
§3 dagi jurnal raqami masalasi shu bilan hal boʻladi.

⚠️ `ON CONFLICT DO UPDATE` bilan kelgan qatorlar `AFTER INSERT` ni
ishga tushirmaydi (ular UPDATE yoʻlidan oʻtadi) — yaʼni takroriy
sinxron boʻlmaydi. Bu bizga qulay.

---

## 3. ⚠️ Uch qatorli qoida (ikki emas)

Birinchi hujjat toʻgʻri aytadi: `classes` yolgʻiz yetarli emas, chunki
koʻrinuvchanlik `class_teachers`/`enrollments` orqali
(`src/server/workspace.ts::taughtClassIds`). Lekin **uchinchi element**
tushib qolgan:

> **`enrollments.sort_order` — bu botdagi `student_id_in_class`,**
> yaʼni qogʻoz javob varaqasidagi **QR jurnal raqami**
> (`lessonlab-scanner/docs/PARTNER_API.md` §3.3).

Eski `students.sort_order` oʻchdi. `students.student_number` esa
`GENERATED ALWAYS` **global surrogat** — u jurnal raqami **EMAS**.
Adashtirilsa skanerdan kelgan baho **boshqa bolaga** yoziladi, va buni
hech kim sezmaydi.

Demak har yoʻnalishda:

```
Sinf:     classes(workspace_id) + class_teachers(class_id, teacher_id, role='owner')
Oʻquvchi: students(workspace_id) + enrollments(class_id, student_id, sort_order)
                                                                     ↑ QR raqami
```

---

## 4. Tayyor SQL — beshta funksiya

Hammasi `CREATE OR REPLACE`, imzo (`RETURNS`) oʻzgarmaydi. Har biri
oldingi mantiqni **aynan** saqlaydi, faqat sxemaga moslanadi.
Qoʻriqchi qatorlar (`pg_trigger_depth()`, `app.sync_off`) hamma joyda
saqlanadi — **ularni olib tashlamang**, rekursiyani aynan oʻsha
toʻxtatadi.

### 4.1 `sync_student_from_uz()` — Ustozonada bola qoʻshilsa botga

```sql
CREATE OR REPLACE FUNCTION public.sync_student_from_uz()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE v_ll_class int; v_no int; v_ll int; v_name text;
BEGIN
  IF pg_trigger_depth() > 1
     OR coalesce(current_setting('app.sync_off', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  /* ⚠️ Trigger endi `enrollments` da — `students` da EMAS. Sabab:
     bola yozilayotganda sinf hali nomaʼlum (grades.ts ikki qadamda
     yozadi) va bola bir nechta sinfda boʻlishi mumkin. */
  SELECT ll_class_id INTO v_ll_class
    FROM class_links WHERE uz_class_id = NEW.class_id;
  IF v_ll_class IS NULL THEN RETURN NEW; END IF;

  /* Bola allaqachon bogʻlangan (masalan ikkinchi sinfga yozilyapti) —
     botda IKKINCHI nusxa yaratmaymiz. Bot modeli bitta bola = bitta
     sinf; koʻp sinfli holat kelajakdagi ish. */
  IF EXISTS (SELECT 1 FROM roster_links WHERE uz_student_id = NEW.student_id)
    THEN RETURN NEW; END IF;

  SELECT name INTO v_name FROM students WHERE id = NEW.student_id;
  IF v_name IS NULL THEN RETURN NEW; END IF;

  /* JURNAL RAQAMI (§3). `enrollments.sort_order` — asosiy manba.
     Agar u 0 boʻlsa yoki oʻsha raqam botda BAND boʻlsa, navbatdagi
     boʻsh raqam olinadi: takroriy raqam QR skanerda ikki bolani
     chalkashtirib yuborardi. */
  v_no := NULLIF(NEW.sort_order, 0);
  IF v_no IS NULL OR EXISTS (
       SELECT 1 FROM bot_students
        WHERE class_id = v_ll_class AND student_id_in_class = v_no)
  THEN
    SELECT coalesce(max(student_id_in_class), 0) + 1 INTO v_no
      FROM bot_students WHERE class_id = v_ll_class;
  END IF;

  INSERT INTO bot_students (class_id, student_id_in_class, full_name, remote_id)
  VALUES (v_ll_class, v_no, v_name, v_no::text) RETURNING id INTO v_ll;

  INSERT INTO roster_links (ll_student_id, uz_student_id, origin, linked_by)
  VALUES (v_ll, NEW.student_id, 'ustozona', 'shadow');

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_sync_student_from_uz ON students;
DROP TRIGGER IF EXISTS trg_sync_student_from_uz ON enrollments;
CREATE TRIGGER trg_sync_student_from_uz
  AFTER INSERT ON enrollments FOR EACH ROW
  EXECUTE FUNCTION sync_student_from_uz();
```

### 4.2 `sync_student_from_bot()` — botda bola qoʻshilsa Ustozonaga

```sql
CREATE OR REPLACE FUNCTION public.sync_student_from_bot()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE v_uz_class text; v_ws text; v_uz text;
BEGIN
  IF pg_trigger_depth() > 1
     OR coalesce(current_setting('app.sync_off', true), '') = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.class_id IS NULL OR NEW.full_name IS NULL THEN RETURN NEW; END IF;

  /* ⭐ Maydonni SINFDAN olamiz, oʻqituvchidan emas — shunda «qaysi
     maydon?» savoli (birinchi hujjat §5) oʻquvchi uchun umuman
     tugʻilmaydi: bola sinfi qayerda boʻlsa, oʻsha yerda. */
  SELECT l.uz_class_id, c.workspace_id INTO v_uz_class, v_ws
    FROM class_links l JOIN classes c ON c.id = l.uz_class_id
   WHERE l.ll_class_id = NEW.class_id;
  IF v_uz_class IS NULL THEN RETURN NEW; END IF;

  IF EXISTS (SELECT 1 FROM roster_links WHERE ll_student_id = NEW.id)
    THEN RETURN NEW; END IF;

  v_uz := gen_random_uuid()::text;

  INSERT INTO students (id, workspace_id, name, initials)
  VALUES (v_uz, v_ws, NEW.full_name, uz_initials(NEW.full_name));

  /* IKKINCHI QATOR — bunsiz bola bazada bor, lekin ekranda YOʻQ. */
  INSERT INTO enrollments (class_id, student_id, sort_order)
  VALUES (v_uz_class, v_uz, coalesce(NEW.student_id_in_class, 0))
  ON CONFLICT (class_id, student_id) DO NOTHING;

  INSERT INTO roster_links (ll_student_id, uz_student_id, origin, linked_by)
  VALUES (NEW.id, v_uz, 'lessonlab', 'shadow');

  RETURN NEW;
END $function$;
```

Trigger oʻzgarmaydi (`AFTER INSERT ON bot_students`).

### 4.3 `sync_class_from_bot()` — botda sinf yaratilsa Ustozonaga

```sql
CREATE OR REPLACE FUNCTION public.sync_class_from_bot()
RETURNS trigger LANGUAGE plpgsql AS $function$
DECLARE v_tid text; v_ws text; v_uz text;
BEGIN
  IF pg_trigger_depth() > 1
     OR coalesce(current_setting('app.sync_off', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_tid FROM user_telegram
   WHERE telegram_id = NEW.user_id::text;
  IF v_tid IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM class_links WHERE ll_class_id = NEW.id)
    THEN RETURN NEW; END IF;

  /* SHAXSIY MAYDON — birinchi hujjat §5 dagi tavsiya, roziman.
     Maktab maydonida ega zavuch boʻlishi mumkin, sinfni oʻtadigan
     odam emas → sinf notoʻgʻri odamda paydo boʻlardi.

     ⚠️ Maydon qatori BOʻLMASLIGI mumkin: uni Ustozona birinchi
     dashboard ochilishida yaratadi (`createPersonalWorkspace`), bot
     orqali roʻyxatdan oʻtib vebni ochmagan ustozda esa yoʻq. U holda
     `classes.workspace_id` FK yiqilardi. Shuning uchun aynan oʻsha
     deterministik id bilan oʻzimiz yaratamiz — ikkala tomon bir xil
     id beradi, demak dublikat boʻlmaydi. */
  v_ws := 'ws-' || v_tid;
  INSERT INTO workspaces (id, name, kind)
  SELECT v_ws, coalesce(t.name, 'Shaxsiy'), 'personal'
    FROM teachers t WHERE t.id = v_tid
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO workspace_members (workspace_id, teacher_id, role)
  VALUES (v_ws, v_tid, 'owner')
  ON CONFLICT (workspace_id, teacher_id) DO NOTHING;

  v_uz := gen_random_uuid()::text;

  INSERT INTO classes (id, workspace_id, name, subject, grade, section, label)
  VALUES (v_uz, v_ws, NEW.name, NEW.subject,
          CASE WHEN uz_class_is_structured(NEW.name)
               THEN (substring(NEW.name from '^(\d{1,2})'))::int END,
          CASE WHEN uz_class_is_structured(NEW.name)
               THEN upper(substring(NEW.name from '[-–—[:space:]]\s*([[:alpha:]]{1,3})$')) END,
          CASE WHEN NOT uz_class_is_structured(NEW.name) THEN NEW.name END);

  /* IKKINCHI QATOR — bunsiz sinf bazada bor, ustozda YOʻQ.
     `role='owner'` ATAYLAB: sinfni yaratgan odam egasi
     (0036 migratsiyasidagi qoida bilan bir xil). */
  INSERT INTO class_teachers (class_id, teacher_id, role)
  VALUES (v_uz, v_tid, 'owner')
  ON CONFLICT (class_id, teacher_id) DO NOTHING;

  INSERT INTO class_links (ll_class_id, uz_class_id, origin, linked_by)
  VALUES (NEW.id, v_uz, 'lessonlab', 'shadow');

  RETURN NEW;
END $function$;
```

### 4.4 `reconcile_teacher_links()` — bogʻlash paytidagi moslashtirish

Bu eng uzuni: uchta blok (nom boʻyicha juftlash, botdan→Ustozonaga,
Ustozonadan→botga) va oʻquvchilar bloki. Hammasida `teacher_id`
`workspace_id` + `class_teachers` ga oʻtadi.

```sql
CREATE OR REPLACE FUNCTION public.reconcile_teacher_links(p_uz_user_id text)
RETURNS TABLE(boglandi integer, botdan integer, ustozonadan integer, oquvchi integer)
LANGUAGE plpgsql AS $function$
DECLARE v_tg bigint; v_ws text;
        n_pair int := 0; n_b2u int := 0; n_u2b int := 0; n_std int := 0;
BEGIN
  SELECT telegram_id::bigint INTO v_tg
    FROM user_telegram WHERE user_id = p_uz_user_id;
  IF v_tg IS NULL THEN RETURN QUERY SELECT 0, 0, 0, 0; RETURN; END IF;

  v_ws := 'ws-' || p_uz_user_id;
  INSERT INTO workspaces (id, name, kind)
  SELECT v_ws, coalesce(t.name, 'Shaxsiy'), 'personal'
    FROM teachers t WHERE t.id = p_uz_user_id
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO workspace_members (workspace_id, teacher_id, role)
  VALUES (v_ws, p_uz_user_id, 'owner')
  ON CONFLICT (workspace_id, teacher_id) DO NOTHING;

  PERFORM set_config('app.sync_off', 'on', true);

  /* 1. Nomi bir xil sinflarni JUFTLASH (yangi qator yaratmasdan) */
  WITH pairs AS (
    SELECT DISTINCT ON (bc.id) bc.id AS ll_id, c.id AS uz_id
      FROM bot_classes bc
      JOIN classes c ON lower(btrim(c.name)) = lower(btrim(bc.name))
                    AND c.workspace_id = v_ws
     WHERE bc.user_id = v_tg
       AND NOT EXISTS (SELECT 1 FROM class_links l WHERE l.ll_class_id = bc.id)
       AND NOT EXISTS (SELECT 1 FROM class_links l WHERE l.uz_class_id = c.id)
     ORDER BY bc.id, c.created_at
  ), ins AS (
    INSERT INTO class_links (ll_class_id, uz_class_id, origin, linked_by)
    SELECT ll_id, uz_id, 'lessonlab', 'backfill' FROM pairs
    ON CONFLICT DO NOTHING RETURNING 1
  ) SELECT count(*) INTO n_pair FROM ins;

  /* 2. Botdagi qolgan sinflar → Ustozonaga (classes + class_teachers) */
  WITH src AS (
    SELECT bc.id AS ll_id, bc.name, bc.subject, gen_random_uuid()::text AS uz_id
      FROM bot_classes bc
     WHERE bc.user_id = v_tg
       AND NOT EXISTS (SELECT 1 FROM class_links l WHERE l.ll_class_id = bc.id)
  ), ins_c AS (
    INSERT INTO classes (id, workspace_id, name, subject, grade, section, label)
    SELECT uz_id, v_ws, name, subject,
           CASE WHEN uz_class_is_structured(name)
                THEN (substring(name from '^(\d{1,2})'))::int END,
           CASE WHEN uz_class_is_structured(name)
                THEN upper(substring(name from '[-–—[:space:]]\s*([[:alpha:]]{1,3})$')) END,
           CASE WHEN NOT uz_class_is_structured(name) THEN name END
      FROM src RETURNING id
  ), ins_t AS (
    INSERT INTO class_teachers (class_id, teacher_id, role)
    SELECT uz_id, p_uz_user_id, 'owner' FROM src
    ON CONFLICT DO NOTHING RETURNING 1
  ), ins_l AS (
    INSERT INTO class_links (ll_class_id, uz_class_id, origin, linked_by)
    SELECT ll_id, uz_id, 'lessonlab', 'backfill' FROM src RETURNING 1
  ) SELECT count(*) INTO n_b2u FROM ins_l;

  /* 3. Ustozonadagi qolgan sinflar → botga */
  WITH src AS (
    SELECT c.id AS uz_id, c.name, c.subject, c.grade,
           row_number() OVER (ORDER BY c.created_at, c.id) AS rn
      FROM classes c
      JOIN class_teachers ct ON ct.class_id = c.id
                            AND ct.teacher_id = p_uz_user_id
     WHERE c.workspace_id = v_ws
       AND NOT EXISTS (SELECT 1 FROM class_links l WHERE l.uz_class_id = c.id)
  ), ins_c AS (
    INSERT INTO bot_classes (user_id, name, subject, grade)
    SELECT v_tg, name, subject, grade FROM src ORDER BY rn
    RETURNING id AS ll_id
  ), numbered AS (
    SELECT ll_id, row_number() OVER (ORDER BY ll_id) AS rn FROM ins_c
  ), ins_l AS (
    INSERT INTO class_links (ll_class_id, uz_class_id, origin, linked_by)
    SELECT n.ll_id, s.uz_id, 'ustozona', 'backfill'
      FROM numbered n JOIN src s ON s.rn = n.rn
    ON CONFLICT DO NOTHING RETURNING 1
  ) SELECT count(*) INTO n_u2b FROM ins_l;

  /* 4. Botdagi oʻquvchilar → Ustozonaga (students + enrollments) */
  WITH src AS (
    SELECT bs.id AS ll_id, bs.full_name, bs.student_id_in_class,
           l.uz_class_id, gen_random_uuid()::text AS uz_id
      FROM bot_students bs
      JOIN bot_classes bc ON bc.id = bs.class_id
      JOIN class_links l  ON l.ll_class_id = bc.id
     WHERE bc.user_id = v_tg AND bs.full_name IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM roster_links r WHERE r.ll_student_id = bs.id)
  ), ins_s AS (
    INSERT INTO students (id, workspace_id, name, initials)
    SELECT uz_id, v_ws, full_name, uz_initials(full_name) FROM src
    RETURNING id
  ), ins_e AS (
    INSERT INTO enrollments (class_id, student_id, sort_order)
    SELECT uz_class_id, uz_id, coalesce(student_id_in_class, 0) FROM src
    ON CONFLICT (class_id, student_id) DO NOTHING RETURNING 1
  ), ins_l AS (
    INSERT INTO roster_links (ll_student_id, uz_student_id, origin, linked_by)
    SELECT ll_id, uz_id, 'lessonlab', 'backfill' FROM src RETURNING 1
  ) SELECT count(*) INTO n_std FROM ins_l;

  PERFORM set_config('app.sync_off', 'off', true);
  RETURN QUERY SELECT n_pair, n_b2u, n_u2b, n_std;
END $function$;
```

⚠️ 2- va 4-blokdagi `ins_t` / `ins_e` CTE'lari **ataylab** shu yerda:
CTE natijasi ishlatilmasa ham `INSERT` bajariladi, lekin biz uni
`RETURNING` bilan zanjirga qoʻshdik — kelajakda kimdir CTE'ni
oʻchirsa, hisob soni ham oʻzgaradi va sezilarli boʻladi.

### 4.5 `account_unlink_impact()` — uzish oqibati

```sql
CREATE OR REPLACE FUNCTION public.account_unlink_impact(p_uz_teacher_id text)
RETURNS TABLE(uz_student_id text, student_name text, class_name text,
              grade_count bigint, response_count bigint,
              last_activity timestamp with time zone)
LANGUAGE sql STABLE AS $function$
  SELECT
    s.id, s.name, c.name,
    count(DISTINCT g.assignment_id),
    count(DISTINCT r.id),
    greatest(max(g.updated_at), max(r.answered_at))
  FROM classes c
  JOIN class_teachers ct ON ct.class_id = c.id
                        AND ct.teacher_id = p_uz_teacher_id
  JOIN enrollments e ON e.class_id = c.id
  JOIN students    s ON s.id = e.student_id
  JOIN class_links cl ON cl.uz_class_id = c.id
  LEFT JOIN grades    g ON g.student_id = s.id
  LEFT JOIN responses r ON r.student_id = s.id
  GROUP BY s.id, s.name, c.name
  HAVING count(g.assignment_id) > 0 OR count(r.id) > 0
  ORDER BY greatest(max(g.updated_at), max(r.answered_at)) DESC NULLS LAST,
           c.name, s.name
$function$;
```

---

## 5. LessonLab tomonidagi Python (bizda, sizga koʻrinmaydi)

Triggerlardan **alohida** yana bitta joy bor:
`lessonlab-scanner/db/classes.py:422` — botning oʻz kodi, u ham
`INSERT INTO classes (id, teacher_id, …)` yozadi (bitta CTE ichida
`bot_classes` + `classes` + `class_links`). SQL tuzatilsa ham bu
qolib ketadi. **Buni biz qilamiz** — sizda kirish yoʻq.

Toʻgʻrilangan shakli §4.3 bilan bir xil boʻladi (workspace + `classes`
+ `class_teachers` + `class_links`, hammasi bitta statementda, chunki
botda `autocommit = True`).

---

## 6. Tavsiya qilingan tartib

Birinchi hujjat `account_unlink_impact` ni birinchi qoʻygan. Men rozi
emasman: u faqat Sozlamalar → uzish ochilganda chaqiriladi, oʻquvchi
qoʻshish esa **har kuni, har darsda**.

| Navbat | Nima | Sabab |
|---|---|---|
| **P0** | §4.1 + §4.2 (oʻquvchi, ikki yoʻnalish) | Ikkala platformada ham oʻlik. Sentyabr — roʻyxat toʻldirish avji |
| **P1** | §4.4 `reconcile_teacher_links` | Bogʻlanish butunlay yopiq: yangi ustoz ekotizimga kira olmaydi |
| **P2** | §4.3 + §5 (bot sinfi) | 8 bogʻlangan ustoz |
| **P3** | §4.5 `account_unlink_impact` | Kamdan-kam chaqiriladi |

P0 va P1 ni **bugun** chiqarish mumkin — ular bir-biriga bogʻliq emas.

---

## 7. Oʻzingiz tekshiring (bazaga hech narsa yozmaydi)

Supabase → SQL Editor. Oxiridagi `RAISE EXCEPTION` **hammasini bekor
qiladi** — natija xato matni ichida qaytadi. Tuzatishdan oldin ham,
keyin ham yurgizing: hamma qatorda `OK` boʻlishi kerak.

```sql
DO $probe$
DECLARE r text := ''; v_ws text; v_cls text; v_tg bigint; v_bcls int;
BEGIN
  SELECT c.workspace_id, c.id INTO v_ws, v_cls
    FROM classes c JOIN class_links l ON l.uz_class_id = c.id LIMIT 1;
  SELECT bc.user_id, bc.id INTO v_tg, v_bcls
    FROM bot_classes bc JOIN class_links l ON l.ll_class_id = bc.id LIMIT 1;

  BEGIN
    INSERT INTO students (id, workspace_id, name, initials, status)
    VALUES ('probe-1', v_ws, 'Probe Test', 'PT', 'active');
    INSERT INTO enrollments (class_id, student_id, sort_order)
    VALUES (v_cls, 'probe-1', 77);
    r := r || E'\n1) UZ oʻquvchi + yozilish : OK';
  EXCEPTION WHEN others THEN
    r := r || E'\n1) UZ oʻquvchi + yozilish : ' || SQLSTATE || ' ' || SQLERRM; END;

  BEGIN
    INSERT INTO bot_students (class_id, student_id_in_class, full_name, remote_id)
    VALUES (v_bcls, 991, 'Probe Bot', '991');
    r := r || E'\n2) BOT oʻquvchi           : OK';
  EXCEPTION WHEN others THEN
    r := r || E'\n2) BOT oʻquvchi           : ' || SQLSTATE || ' ' || SQLERRM; END;

  BEGIN
    INSERT INTO bot_classes (user_id, name) VALUES (v_tg, 'PROBE-SINF');
    r := r || E'\n3) BOT sinf               : OK';
  EXCEPTION WHEN others THEN
    r := r || E'\n3) BOT sinf               : ' || SQLSTATE || ' ' || SQLERRM; END;

  BEGIN
    INSERT INTO classes (id, workspace_id, name, grade, section)
    VALUES ('probe-c1', v_ws, '9-Z', 9, 'Z');
    r := r || E'\n4) UZ sinf                : OK';
  EXCEPTION WHEN others THEN
    r := r || E'\n4) UZ sinf                : ' || SQLSTATE || ' ' || SQLERRM; END;

  BEGIN
    INSERT INTO user_telegram (telegram_id, user_id)
    SELECT '999999999999', t.id FROM teachers t
     WHERE NOT EXISTS (SELECT 1 FROM user_telegram u WHERE u.user_id = t.id)
     LIMIT 1;
    r := r || E'\n5) Akkaunt bogʻlash       : OK';
  EXCEPTION WHEN others THEN
    r := r || E'\n5) Akkaunt bogʻlash       : ' || SQLSTATE || ' ' || SQLERRM; END;

  BEGIN
    PERFORM * FROM account_unlink_impact(
      (SELECT user_id FROM user_telegram LIMIT 1));
    r := r || E'\n6) Uzish oqibati          : OK';
  EXCEPTION WHEN others THEN
    r := r || E'\n6) Uzish oqibati          : ' || SQLSTATE || ' ' || SQLERRM; END;

  RAISE EXCEPTION 'SINXRON SMOKE (hammasi bekor qilindi):%', r;
END $probe$;
```

Hozirgi natija (2026-09-02 06:00 UTC):

```
1) UZ oʻquvchi + yozilish : 42703 record "new" has no field "class_id"
2) BOT oʻquvchi           : 42703 column c.teacher_id does not exist
3) BOT sinf               : 42703 column "teacher_id" of relation "classes" does not exist
4) UZ sinf                : OK
5) Akkaunt bogʻlash       : 42703 column c.teacher_id does not exist
6) Uzish oqibati          : 42703 column s.class_id does not exist
```

---

## 7-B. Yuqoridagi SQL PRODDA REPETITSIYA QILINGAN

Bu hujjatdagi beshta funksiya **taxmin emas** — ular prod bazada
haqiqatan qoʻllanib, sinovdan oʻtkazilib, keyin **bekor qilingan**
(bitta `DO` bloki: `EXECUTE` bilan DDL → sinovlar → majburiy
`RAISE EXCEPTION` → toʻliq rollback). Bazada hech narsa qolmagan,
funksiyalar hamon **eski, buzuq holatida**.

**1-repetitsiya — beshta funksiya birga:**

```
== DDL qoʻllandi (repetitsiya) ==
1) UZ oʻquvchi -> botga : OK (jurnal raqami=77)
2) BOT oʻquvchi -> UZ   : OK (students+enrollments+roster_links)
3) BOT sinf -> UZ       : OK (classes+class_teachers+class_links, grade/section ajratildi)
4) UZ sinf -> botga     : OK (class_links=1)
5) Akkaunt bogʻlash     : OK
6) reconcile()          : OK
7) Uzish oqibati        : OK
```

1-qatordagi `jurnal raqami=77` muhim: `enrollments.sort_order = 77`
berilgan edi va bot tomonida `student_id_in_class = 77` boʻlib chiqdi —
yaʼni §3 dagi QR zanjiri uzilmagan.

**2-repetitsiya — `reconcile_teacher_links()` haqiqiy maʼlumotda.**
Bogʻlanmagan telegram hisobi (botda 1 sinf + 29 oʻquvchi) hech qanday
Ustozona sinfi boʻlmagan ustozga bogʻlandi:

```
  classes         = 1
  class_teachers  = 1   <- bunsiz ustoz sinfni KOʻRMAYDI
  students        = 29
  enrollments     = 29  <- bunsiz bola sinfsiz qoladi
  class_links     = 1
  roster_links    = 29
  yozilishsiz bola= 0   <- 0 boʻlishi shart
```

Yaʼni §3 dagi «ikki qatorli qoida» amalda tekshirildi: **29 boladan
bittasi ham yozilishsiz qolmadi**.

## 8. Asosiy taklif: bu SQL qayerda yashashi kerak

Ildiz sabab «funksiya buzuq» emas — **Ustozona sxemasini oʻzgartiradigan
odam bu funksiyalarni koʻra olmasdi**. Ular LessonLab repo'sida edi,
migratsiya esa Ustozona repo'sida yozildi. Shuning uchun tuzatib
qoʻyish kifoya qilmaydi.

**Taklif:** butun cross-platform SQL **Ustozona repo'siga** koʻchsin —
`drizzle/sync/` papkasi. Sabablari:

1. Uni buzadigan migratsiyalar aynan shu repoda yoziladi;
2. Sizning tomon **koʻra va reviewda ushlay** oladi (hozir imkoni yoʻq);
3. Bizda ikkala repoga kirish bor — biz hech narsa yoʻqotmaymiz;
4. `prebuild` darvozasi allaqachon shu repoda
   (`scripts/check-server-actions.mjs` — namunasi bor).

Bilan birga: §7 dagi skript `drizzle/sync/SMOKE.sql` boʻlib qoʻyilsin
va **ustun oʻchiradigan/nomini oʻzgartiradigan har migratsiyadan
keyin** bir marta yurgizilsin. U Actions daqiqasi ham sarflamaydi —
SQL Editor'da bitta bosish.

⛔ Bitta narsa **kerak emas**: `prisma db push`. LessonLab tomonida bu
qatʼiy taqiq — faqat migratsiya fayli.

Boshqacha taqsimot maʼqul boʻlsa ayting — muhimi tuzatilishi, kim
qilgani emas.

---

## 9. Sizdan javob kutilayotgan savollar

1. **§8 — repo egaligi.** Rozimisiz? Rozi boʻlsangiz koʻchirishni biz
   qilamiz va sizga PR yuboramiz.
2. **§4.1 — trigger `enrollments` ga koʻchishi.** Ustozona tomonida
   `enrollments` ga yozadigan boshqa yoʻl bormi (import, seed, admin
   amali)? Bor boʻlsa trigger u yerda ham ishga tushadi — bu bizga
   maʼqul, lekin bilib turishimiz kerak.
3. **Bola sinfdan sinfga koʻchsa** (`enrollments` qatori oʻchib,
   yangisi paydo boʻlsa) botda nima boʻlishi kerak? Hozir hech narsa —
   bola eski sinfda qoladi. Bu alohida ish, hozir tegmayapmiz.
4. **Maktab maydoni** (`kind <> 'personal'`) hozir bazada **0 ta**.
   Yaʼni «har doim shaxsiy maydon» qarori bugun hech kimga taʼsir
   qilmaydi va sizni bloklamaydi. Maktab qoidasi kerak boʻlganda
   ikkala tomonda birga ochamiz.

---

## 10. Model — oʻzgarmadi

`class_links`, `roster_links`, `test_links`, `user_telegram` —
tegilmadi, ishonch bilan tayanish mumkin. Model **nusxa emas,
BOGʻLASH**: har tizim oʻz qatorida qoladi, bogʻlash jadvali ikkisini
ulaydi. Yuqoridagi tuzatishlarning birortasi bu qoidani oʻzgartirmaydi.
