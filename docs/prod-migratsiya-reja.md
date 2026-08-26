# Prod migratsiyasi — ish maydoni (0034 → 0038)

> **Sana:** 2026-08-26 · **Holat:** ⏸ TAYYOR, BAJARILMAGAN
> **Tegishli:** `docs/ish-maydoni-arxitektura.md` §8a

---

## 0. Hozirgi holat

| | Sxema |
|---|---|
| Dev (Neon) | `0038` |
| **Prod (Supabase)** | **`0033`** |

Beshta migratsiya qoʻllanmagan: `0034` `0035` `0036` `0037` `0038`.

⚠️ **Asosiy xavf — migratsiyaning oʻzi emas, AJRALISH.** Dev va prod
besh qadam farq qiladi; har yangi migratsiya oldingisi ishlagan deb
hisoblaydi. Bu farq oʻz-oʻzidan yopilmaydi, faqat kattalashadi.

---

## 1. Nega toʻsiq bor

`0035` uchta ustunni oʻchiradi:

```sql
ALTER TABLE classes  DROP COLUMN teacher_id;
ALTER TABLE students DROP COLUMN teacher_id;
ALTER TABLE students DROP COLUMN class_id;
```

Prodda ularga **koʻrinishlar** tayanadi → `DROP COLUMN` xato beradi
(*"cannot drop column because other objects depend on it"*).

**2026-08-26 da prodda tekshirilgan roʻyxat (7 ta koʻrinish):**

| Koʻrinish | Holat |
|---|---|
| `v_unified_classes` | 🔴 `classes.teacher_id` — qayta yozildi |
| `v_unified_students` | 🔴 `students.class_id` — qayta yozildi |
| `v_duplicate_candidates` | 🔴 ikkalasi — qayta yozildi |
| `v_teacher_totals` | ⚠️ Yuqoridagilarga tayanadi — faqat tartib uchun |
| `v_teacher_bridge` | ✅ Tegilmaydi |
| `v_test_bank` | ✅ Tegilmaydi |
| `v_test_duplicate_candidates` | ✅ `activity_sets.teacher_id` — u MUALLIFLIK, oʻchmaydi |

⚠️ Hujjatda ilgari 3 ta deb yozilgan edi — amalda `v_teacher_bridge`
ham tekshirildi va u xavfsiz chiqdi.

⛔ **`DROP ... CASCADE` ISHLATILMAYDI.** U koʻrinishlarni jimgina
oʻchirib, LessonLab integratsiyasini sezdirmasdan buzadi.

---

## 2. ⭐ Kardinallik muammosi — eng muhim qaror

Eski ustunlar **skalyar** edi: bitta sinf → bitta oʻqituvchi, bitta
bola → bitta sinf. Yangi modelda ikkalasi ham **koʻp-koʻpga**.

Toʻgʻridan-toʻgʻri `JOIN` qilinsa koʻrinish qatorlari **koʻpayib**
ketardi va bot ularni dublikat deb qabul qilardi.

Yechim — bitta vakil tanlash:

| Eski | Yangi vakil | Nega shu |
|---|---|---|
| `classes.teacher_id` | `class_teachers.role = 'owner'` | Eski maʼnoning aynan oʻzi: «bu sinf kimniki» |
| `students.class_id` | Eng eski `enrollments` qatori | Eski modelda bolaning bitta sinfi bor edi — u birinchi qoʻshilgani |

⚠️ **Yoʻqotish bor va u ochiq yozilsin:** ikki oʻqituvchi oʻtadigan
sinf botda faqat egasi bilan koʻrinadi; ikki guruhdagi bola faqat
birinchi guruhi bilan. Bot uchun bu eski holatdan **yomonroq emas**
(u yerda ham bittadan ortigʻi yoʻq edi), lekin yangi modeldagi
toʻliqlikni ham koʻrsatmaydi.

Toʻliq yechim — botga koʻp-koʻpga shartnoma berish. **Alohida ish**,
bu migratsiyaga kirmaydi.

⭐ Bitta joyda esa yangi model **aniqroq**: `v_duplicate_candidates`
dagi oʻquvchi sanogʻi endi `enrollments` dan olinadi.

---

## 3. Bajarish tartibi

⚠️ Har qadam alohida tekshiriladi. Shoshilinch bajariladigan ish emas.

```bash
# 1. ZAXIRA — avtomatik zaxira YOʻQ (docs/backup.md)
pg_dump "$PROD_DATABASE_URL" -Fc -f ustozona-$(date +%F).dump
```

```
# 2. Koʻrinishlarni oʻchirish (bogʻliqlik tartibida)
#    drizzle/views/lessonlab-yangi.sql faylining boshidagi DROP bloki
```

```bash
# 3. Migratsiyalar
DATABASE_URL="$PROD_DATABASE_URL" npm run db:migrate
```

```
# 4. Koʻrinishlarni yangi model boʻyicha yaratish
#    drizzle/views/lessonlab-yangi.sql — CREATE bloki
```

```
# 5. Tekshirish (§4)
# 6. LessonLab tomonini tekshirish
```

**Qaytarish:** `pg_dump` dan tiklash + `drizzle/views/lessonlab-eski.sql`.

---

## 4. Tekshirish roʻyxati

Migratsiyadan keyin, koʻrinishlar yaratilgunga qadar:

```sql
-- Yetim qolgan yozuv boʻlmasin
SELECT count(*) FROM classes  WHERE workspace_id IS NULL;  -- 0
SELECT count(*) FROM students WHERE workspace_id IS NULL;  -- 0

-- Har oʻqituvchida maydon bor
SELECT count(*) FROM teachers t
 WHERE NOT EXISTS (SELECT 1 FROM workspace_members m WHERE m.teacher_id = t.id);  -- 0

-- Har sinfda EGA bor (0036)
SELECT count(*) FROM classes c
 WHERE NOT EXISTS (SELECT 1 FROM class_teachers ct
                    WHERE ct.class_id = c.id AND ct.role = 'owner');  -- 0
```

Koʻrinishlar yaratilgandan keyin — **qator soni oʻzgarmasligi shart**:

```sql
SELECT count(*) FROM v_unified_classes;
SELECT count(*) FROM v_unified_students;
```

⚠️ Bu sonlarni migratsiyadan **OLDIN** yozib oling — taqqoslash uchun
boshqa asos yoʻq.

---

## 5. 🔴 Men tekshira olmagan narsalar

1. **LessonLab bot kodi.** Koʻrinishlar ustun nomlarini saqlaydi, lekin
   botning ular bilan nima qilishini koʻrmadim. Migratsiyadan oldin
   bot tomoni tasdiqlansin.
2. **Maktab taqvimi.** Chorak oʻrtasida bajarilmasin.
3. **Prod qator soni.** Soʻrov ruxsat berilmadi — §4 dagi «oldin yozib
   ol» qadami shuning uchun majburiy.

---

## 6. Nega hozir (jahon amaliyoti)

**Expand / contract** (Fowler, *parallel change*): sxema oʻzgarishi
kengaytirish va siqishga boʻlinadi. Bizda allaqachon shunday —
`0034` = expand (xavfsiz), `0035` = contract (xavfli). Toʻsiq butun
migratsiyada emas, faqat `DROP COLUMN` larda.

**Nega yarmini qoʻllab, DROP'ni keyinga surmaymiz:** unda eski ustunlar
qolardi, lekin ilova ularga **yozmasdi** — koʻrinishlar yangi sinflar
uchun jimgina **notoʻgʻri** maʼlumot berardi. «Buzilgan» dan koʻra
«yolgʻon gapiradigan» holat battarroq. Koʻrinishlarni baribir oʻsha
oynada qayta yozish kerak, demak boʻlishning foydasi yoʻq.

**Umumiy baza (Integration Database).** Bot bizning jadvallarimizni
oʻqiydi — Fowler buni anti-naqsh deydi, lekin yechimi bor:
koʻrinishlar **shartnoma**. Ichki tuzilma oʻzgaraversin, shartnoma
saqlansin. Aynan shuni qildik.
