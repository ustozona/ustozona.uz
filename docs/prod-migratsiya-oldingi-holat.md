# Prod holati — migratsiyadan OLDIN

> **Olingan:** 2026-08-26 · Supabase (prod)
> **Nima uchun:** migratsiyadan keyin AYNAN shu soʻrovlar qayta
> yuritiladi. Natija bir xil chiqsa — LessonLab uchun hech narsa
> oʻzgarmagan (`docs/prod-migratsiya-reja.md` §4).

⚠️ Bu fayl **taqqoslash asosi**. Migratsiyadan keyin qayta olib
boʻlmaydi — shuning uchun oldindan yozilgan.

---

## 1. Koʻrinishlar — qator soni

| Koʻrinish | Qatorlar |
|---|---|
| `v_unified_classes` | **36** |
| `v_unified_students` | **503** |
| `v_duplicate_candidates` | **0** |
| `v_teacher_totals` | **17** |

## 2. Koʻrinishlar — mazmun barmoq izi (md5)

⭐ Sondan kuchliroq: maʼlumotning **oʻzi** oʻzgarmaganini koʻrsatadi.

| Koʻrinish | md5 |
|---|---|
| `v_unified_classes` | `099070656494ff43f1d6d4db383a732f` |
| `v_unified_students` | `c68c7378f9177a4d224a44a1cb52eefb` |
| `v_teacher_totals` | `5670ee33a68c0eec0fa75188e2e65571` |

Qayta olish uchun soʻrov:

```sql
SELECT 'v_unified_classes' AS nom,
       md5(string_agg(t::text, '|' ORDER BY t::text)) AS barmoq_izi
  FROM v_unified_classes t
UNION ALL SELECT 'v_unified_students',
       md5(string_agg(t::text, '|' ORDER BY t::text)) FROM v_unified_students t
UNION ALL SELECT 'v_teacher_totals',
       md5(string_agg(t::text, '|' ORDER BY t::text)) FROM v_teacher_totals t
 ORDER BY nom;
```

## 3. Asosiy jadvallar

| Jadval | Qatorlar |
|---|---|
| `teachers` | 17 |
| `classes` | 33 |
| `students` | 429 |
| `attendance_records` | 4202 |
| `grades` | 0 |
| `student_notes` | 0 |
| `roster_links` | 207 |
| `class_links` | 13 |

---

## 4. ⭐ Nima kutiladi

**Barmoq izlari OʻZGARMASLIGI kerak.**

Sabab: hozir har sinfning bitta oʻqituvchisi, har bolaning bitta sinfi
bor. Yangi koʻrinishlar «egani» va «eng eski yozilishni» tanlaydi —
tanlash uchun esa bittadan boshqa variant yoʻq. Demak natija aynan
oʻsha.

Farq **keyin** paydo boʻladi: kimdir ikkinchi oʻqituvchini darsga
biriktirganda yoki bolani ikkinchi guruhga qoʻshganda. Bu esa faqat shu
yangilanish chiqqandan keyin mumkin.

## 5. 🔴 Agar barmoq izi oʻzgarsa

Migratsiyani **davom ettirmang**. Tekshiring:

| Belgi | Ehtimoliy sabab |
|---|---|
| `v_unified_classes` soni kamaydi | Egasiz sinf bor — `class_teachers` da `role='owner'` qatori yoʻq |
| `v_unified_students` soni kamaydi | Yozilishsiz bola bor — `enrollments` da qatori yoʻq |
| Soni bir xil, izi boshqa | Vakil tanlash tartibi boshqacha ishlagan |

Tekshiruv soʻrovlari `docs/prod-migratsiya-reja.md` §4 da.

## 6. Kuzatilgan qoʻshimcha

- `grades` va `student_notes` — **0 qator**. Yaʼni prodda hali baho ham,
  qayd ham qoʻyilmagan. Migratsiyaning eng qimmatli maʼlumoti —
  `attendance_records` (4202) va `students` (429).
- `v_unified_students` (503) > `students` (429): farq LessonLab
  tomonidagi bogʻlanmagan bolalar (`lessonlab_only`).
