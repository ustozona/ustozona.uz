# Prod zaxirasi — 2026-08-26

> Ish maydoni migratsiyasidan (0034–0038) oldin olindi.

---

## Nima qilindi

Supabase prod bazasida `zaxira_20260826` **sxemasi** yaratildi va
migratsiya tegadigan jadvallarning toʻliq nusxasi olindi:

| Jadval | Qatorlar | Tekshirildi |
|---|---|---|
| `teachers` | 17 | ✅ |
| `classes` | 33 | ✅ |
| `students` | 429 | ✅ |
| `attendance_records` | 4202 | ✅ |
| `roster_links` | 207 | ✅ |
| `class_links` | 13 | ✅ |

Har bir jadval asl nusxa bilan **qator soni boʻyicha taqqoslandi** —
hammasi mos.

⚠️ `grades` va `student_notes` nusxalanmadi: ular **boʻsh** (0 qator).

---

## ⚠️ Bu qanday zaxira — va qanday emas

| Xavf | Qoplanadimi |
|---|---|
| Migratsiya maʼlumotni buzadi/oʻchiradi | ✅ **Ha** |
| Migratsiya yarim yoʻlda toʻxtaydi | ✅ Ha |
| Koʻrinishlar notoʻgʻri qayta yoziladi | ✅ Ha (maʼlumot tegilmaydi) |
| Butun Supabase loyihasi yoʻqoladi | ❌ **Yoʻq** — nusxa oʻsha bazada |

⭐ Bu **proporsional** qaror: bizning xavfimiz «migratsiya xato ketadi»,
«Supabase yoʻqoladi» emas. Ikkinchisi allaqachon mavjud boʻshliq
(`docs/backup.md` — bepul rejada avtomatik zaxira yoʻq) va u bu
migratsiya tugʻdirgan muammo emas.

**Toʻliq (server tashqarisidagi) zaxira uchun** baza paroli kerak:

```bash
"/c/Program Files/PostgreSQL/17/bin/pg_dump.exe" "ULANISH_SATRI" \
  -Fc -f ustozona-zaxira-2026-08-26.dump
```

Ulanish satri: Supabase loyihasi → yuqoridagi **Connect** tugmasi →
Connection string → URI. Parol unutilgan boʻlsa: Settings → Database →
Reset database password.

---

## Tiklash — agar migratsiya xato ketsa

⛔ Shoshilmang. Avval **nima buzilganini** aniqlang: koʻrinishlarmi yoki
maʼlumotmi. Koʻrinishlar buzilgan boʻlsa maʼlumot tegilmagan —
`drizzle/views/lessonlab-eski.sql` ni qayta yuritish yetarli.

Maʼlumot buzilgan boʻlsa (bitta jadval uchun namuna):

```sql
BEGIN;

-- 1. Yangi model qatorlarini olib tashlash (FK tartibida)
DELETE FROM public.attendance_records;
DELETE FROM public.enrollments;
DELETE FROM public.class_teachers;
DELETE FROM public.students;
DELETE FROM public.classes;

-- 2. Zaxiradan qaytarish
INSERT INTO public.classes  SELECT * FROM zaxira_20260826.classes;
INSERT INTO public.students SELECT * FROM zaxira_20260826.students;
INSERT INTO public.attendance_records
  SELECT * FROM zaxira_20260826.attendance_records;
INSERT INTO public.roster_links SELECT * FROM zaxira_20260826.roster_links;
INSERT INTO public.class_links  SELECT * FROM zaxira_20260826.class_links;

-- 3. Tekshiring, keyin: COMMIT;  (yoki ROLLBACK;)
ROLLBACK;
```

⚠️ `INSERT ... SELECT *` ustun tartibiga tayanadi. Sxema migratsiyadan
keyin **oʻzgargan** boʻladi (masalan `classes.teacher_id` oʻchgan), shu
bois ustunlarni **aniq sanab** yozish kerak boʻlishi mumkin.

---

## Zaxirani qachon oʻchirish

Migratsiya muvaffaqiyatli tugab, **kamida bir hafta** ishlagandan keyin:

```sql
DROP SCHEMA zaxira_20260826 CASCADE;
```

⚠️ Undan oldin oʻchirmang. Ba'zi nosozliklar (masalan yoʻqolgan
davomat) faqat oʻqituvchi jurnalni ochganda maʼlum boʻladi.
