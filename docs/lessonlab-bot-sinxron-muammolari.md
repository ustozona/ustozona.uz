# LessonLab bot ↔ Ustozona sinxroni — buzilgan funksiyalar

> Kimga: LessonLab bot egasiga.
> Sana: 2026-09-02. Holat: 4 tadan 1 tasi tuzatildi.
>
> Bu hujjat **bot tomonida** qilinishi kerak boʻlgan ishni yozadi.
> Ustozona tomoni oʻz qismini bajardi.

## 1. Qisqacha — nima boʻldi

Ikkala mahsulot 2026-08-05 dan **bitta Supabase bazasida** ishlaydi
(`lxppxnawxmcfebmzdgil`). Sinxron qoʻlda yozilgan PL/pgSQL
funksiyalari orqali ketadi.

2026-08-26 da Ustozona **ish maydoni** (workspace) modeliga oʻtdi va
migratsiya (`0035_ish_maydoni_kochirish.sql`) bir nechta ustunni
oʻchirdi. Sinxron funksiyalari hamon oʻsha ustunlarga tayanadi:

```
42703 — record "new" has no field "teacher_id"
PL/pgSQL function sync_class_from_uz() line 8
```

⛔ **Bu jimgina xato emas.** Funksiyalar trigger sifatida osilgan,
yaʼni xato butun `INSERT` ni bekor qiladi. Ustozona tomonida bu
«sinf yaratib boʻlmaydi» boʻlib chiqdi — ilova buni *«Baholar
serverga saqlanmadi»* deb koʻrsatib, toʻxtovsiz qayta urinardi.
Xato **bir hafta sezilmadi**.

⚠️ Migratsiya rejasi (`docs/prod-migratsiya-reja.md`) bu funksiyalarni
umuman koʻrmagan — ular Ustozona repo'sida yoʻq, shuning uchun
migratsiya ularni tekshira olmasdi. Sabab shu.

## 2. Sxema qanday oʻzgardi

| Eski (oʻchirilgan) | Yangi |
|---|---|
| `classes.teacher_id` | `classes.workspace_id` + `class_teachers(class_id, teacher_id, role)` |
| `students.teacher_id` | `students.workspace_id` |
| `students.class_id` | `enrollments(class_id, student_id, sort_order)` |
| `students.sort_order` | `enrollments.sort_order` |
| `teachers.school_id`, `schools` jadvali | oʻchirildi (boʻsh edi) |

Qoʻshilgan jadvallar: `workspaces`, `workspace_members`,
`class_teachers`, `enrollments`.

Maydon id'si **deterministik**: har oʻqituvchining shaxsiy maydoni
`'ws-' || teachers.id`. Egalik `workspace_members.role = 'owner'`
da.

## 3. Qaysi funksiyalar buzuq

| Funksiya | Holat | Nega muhim |
|---|---|---|
| `sync_class_from_uz()` | ✅ **tuzatildi** | Ustozona tomoni. SQL: `drizzle/TUZATISH-sync-class-from-uz.sql` |
| `sync_class_from_bot()` | ❌ buzuq | Botda sinf yaratilganda `INSERT` bekor boʻladi |
| `sync_student_from_bot()` | ❌ buzuq | Botdan oʻquvchi kelganda yiqiladi — sentyabrda roʻyxat toʻldirish avjida |
| `reconcile_teacher_links()` | ❌ buzuq | Akkaunt bogʻlanganda mavjud sinf/oʻquvchini moslashtirish |
| `account_unlink_impact()` | ❌ tekshirilsin | Ustozona vebidan **jonli chaqiriladi** (`src/server/dal/account-link.ts:206`) — Sozlamalar → «Telegramni uzish» |

Roʻyxat toʻliq boʻlmasligi mumkin. Toʻliq audit uchun §6.

## 4. ⚠️ ENG MUHIMI — bitta ustunni almashtirish YETARLI EMAS

Bu hujjatning asosiy xabari. `teacher_id` oʻrniga `workspace_id`
yozib qoʻyish **muammoni yechmaydi** — funksiya yiqilmaydi, lekin
natija koʻrinmaydi.

Sabab: koʻrinuvchanlik endi egalikka emas, **biriktirishga** tayanadi.
`src/server/workspace.ts` dagi `taughtClassIds()` sinflarni
`class_teachers` orqali topadi, oʻquvchilarni esa `enrollments`
orqali. Yaʼni:

```
Sinf:     classes (workspace_id)  +  class_teachers (role='owner')
Oʻquvchi: students (workspace_id) +  enrollments (class_id, student_id)
```

**Ikkinchi qator boʻlmasa** sinf bazada bor, lekin oʻqituvchi uni
Ustozonada umuman koʻrmaydi. Bu eng yomon holat: xato yoʻq, log toza,
maʼlumot esa yoʻqolgandek koʻrinadi.

Bot tomonidagi har `INSERT` shu sababli **ikki qatorli** boʻlishi
kerak.

## 5. Ochiq savol — botdan kelgan sinf QAYSI maydonga tushadi

Bu mahsulot qarori, texnik emas. Kelishilishi kerak.

Oʻqituvchi endi bir nechta maydonda boʻlishi mumkin: oʻz shaxsiy
maydoni (`ws-<teacherId>`) va maktab maydoni (zavuch/direktor
tuzgan). Botdan kelgan sinfni qayerga yozish kerak?

| Variant | Foydasi | Xavfi |
|---|---|---|
| **Har doim shaxsiy** (`ws-<teacherId>`) | Deterministik, egasi aniq | Maktabda ishlaydigan oʻqituvchi sinfni «notoʻgʻri joyda» koʻradi |
| `teachers.active_workspace_id` | Oʻqituvchi qayerda ishlayotgan boʻlsa oʻsha yerga | Bot yozayotgan payt «faol maydon» tasodifiy boʻlishi mumkin; maktab maydoniga begona sinf tushadi |

**Ustozona tomonining tavsiyasi: har doim shaxsiy maydon.**
`sync_class_from_uz()` tuzatilganda aynan shu tanlandi — u FAQAT
shaxsiy maydonni sinxronlaydi, maktab maydonini jimgina oʻtkazib
yuboradi (`RETURN NEW`). Sabab: maktab maydonida ega — zavuch
boʻlishi mumkin, sinfni oʻtadigan oʻqituvchi emas. U holda bot
tomonda sinf **notoʻgʻri odamda** paydo boʻlardi, va buni hech kim
sezmasdi.

Bu vaqtinchalik chegara. Maktab maydoni uchun toʻgʻri qoida
kelishilgach ikkala tomonda birga ochiladi.

## 6. Diagnostika — nimadan boshlash

Prod Supabase → SQL Editor.

**Buzuq funksiyalarni topish:**

```sql
SELECT p.proname, n.nspname
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND (p.prosrc ILIKE '%teacher_id%'
     OR p.prosrc ILIKE '%.class_id%'
     OR p.prosrc ILIKE '%sort_order%')
 ORDER BY p.proname;
```

**Qaysi trigger qaysi jadvalga osilgan:**

```sql
SELECT c.relname AS jadval, t.tgname AS trigger, p.proname AS funksiya
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_proc  p ON p.oid = t.tgfoid
 WHERE NOT t.tgisinternal
 ORDER BY c.relname, t.tgname;
```

**Funksiya matnini olish:**

```sql
SELECT pg_get_functiondef(p.oid)
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.proname = 'sync_student_from_bot';
```

## 7. Namuna — tuzatilgan funksiya

`sync_class_from_uz()` toʻliq matni Ustozona repo'sida:
`drizzle/TUZATISH-sync-class-from-uz.sql`. Muhim qismi — egani
topish:

```sql
SELECT wm.teacher_id INTO v_tid
  FROM workspace_members wm
 WHERE wm.workspace_id = NEW.workspace_id
   AND wm.role = 'owner'
 ORDER BY wm.created_at
 LIMIT 1;
IF v_tid IS NULL THEN RETURN NEW; END IF;

-- FAQAT shaxsiy maydon (§5)
IF NEW.workspace_id IS DISTINCT FROM 'ws-' || v_tid THEN RETURN NEW; END IF;
```

`ORDER BY created_at` ataylab: bir nechta ega boʻlsa natija har
chaqiruvda bir xil boʻlsin, aks holda sinxron qaysi hisobga
tushishi tasodifiy boʻlardi.

`v_unified_classes` / `v_unified_students` / `v_duplicate_candidates`
koʻrinishlari allaqachon yangi modelga koʻchirilgan —
`drizzle/PROD-MIGRATSIYA-2026-08-26.sql` (223-satrdan). Ular
`class_teachers` va `enrollments` ni qanday ishlatishiga namuna
sifatida qarang.

## 8. Bogʻlash qatlami — oʻzgarmagan

Bular tegilmadi, ishonch bilan tayanish mumkin:

| Jadval | Nima |
|---|---|
| `class_links` | `bot_classes.id` ↔ `classes.id`, 1:1 |
| `roster_links` | `bot_students.id` ↔ `students.id`, 1:1 |
| `test_links` | `bot_tests.id` ↔ `activity_sets.id`, 1:1 |
| `user_telegram` | `telegram_id` ↔ `teachers.id` |

Model — **nusxa emas, bogʻlash**: har tizim oʻz qatorida qoladi.
Batafsil: `src/server/db/schema/cross-platform.ts` va LessonLab
repo'sidagi `docs/CROSS_PLATFORM.md`.

## 9. Qadamlar

1. **Bugun:** §6 dagi ikkita soʻrovni yuriting — toʻliq roʻyxat
   olinsin. Sentyabr boshlangani uchun bot trafigi eng yuqori.
2. `account_unlink_impact()` — birinchi navbatda. U Ustozona
   vebidan jonli chaqiriladi, qolganlari bot tomonda.
3. §5 boʻyicha kelishuv. Bunsiz `sync_class_from_bot()` ni yozib
   boʻlmaydi.
4. Qolgan funksiyalarni koʻchirish — §4 dagi ikki qatorli qoidaga
   rioya qilib.
5. Tuzatilgan SQL'ni **repoga** qoʻying (`supabase/migrations/`).
   Hozir bu funksiyalar hech qaysi repoda yoʻq — aynan shu sababli
   migratsiya ularni koʻrmadi va xato bir hafta yashirin qoldi.

## 10. Takrorlanmasligi uchun

Ustun oʻchiradigan yoki nomini oʻzgartiradigan **har** migratsiyadan
oldin, ikkala tomonda ham:

```sql
SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public' AND p.prosrc ILIKE '%<ustun_nomi>%';
```

Baza umumiy — sxema oʻzgarishi ikkala tomonga taʼsir qiladi va
oldindan kelishilishi kerak.
