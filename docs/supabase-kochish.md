# Neon → Supabase koʻchish qoʻllanmasi

Ustozona bazasi LessonLab bilan **bitta Supabase loyihasiga** koʻchadi
(`lxppxnawxmcfebmzdgil`). Bu hujjat — bir martalik amaliyot tartibi.

> Holat: sxema Supabase'ga **allaqachon qoʻyilgan** (55 jadval, 101 FK,
> 68 indeks). Maʼlumot hali koʻchirilmagan. Kod `postgres-js` ga
> oʻtkazilgan.

---

## 0. Nimani kutish kerak — va nimani KUTMASLIK

✅ Bitta ulanish satri, bitta zaxira, bitta hisob. Kelajakda sxemalarni
birlashtirishga yoʻl ochiladi.

⛔ **Dublikat OʻZ-OʻZIDAN yoʻqolmaydi.** Bitta bazada `students` va
`bot_students` baribir ikkita alohida jadval boʻlib qolaveradi. Botda
oʻquvchi ismini oʻzgartirsangiz `students.name` oʻzgarmaydi — xuddi
avvalgidek. Konflikt maʼlumot MODELIDA, server manzilida emas.

Toʻliq birlashtirish (bitta `students` jadvali, ikkala ilova ham
oʻshani oʻqib-yozadi) — alohida, kattaroq loyiha: identifikatorlar
turlicha (Telegram `user_id` bigint / better-auth `user.id` text),
kalitlar butun/UUID, LessonLab'ning `db/` qatlami qayta yozilishi kerak.

⚠️ **Umumiy nosozlik doirasi.** Endi baza yiqilsa IKKALA mahsulot ham
toʻxtaydi. Ilgari ular mustaqil edi.

---

## 1. Maʼlumotni koʻchirish (SIZ bajarasiz)

Neon ulanish satri Vercel'dagi eski `DATABASE_URL` da. Supabase satri —
Supabase → Connect → **Session pooler yoki Direct** (koʻchirish uchun
6543 emas, 5432 maʼqul: `pg_dump` uzoq tranzaksiya ochadi).

```bash
# 1) Neon'dan FAQAT maʼlumot (sxema allaqachon Supabase'da)
pg_dump "$NEON_URL" \
  --data-only --no-owner --no-privileges \
  --disable-triggers \
  -f ustozona-data.sql

# 2) Supabase'ga quyish
psql "$SUPABASE_DIRECT_URL" -v ON_ERROR_STOP=1 -f ustozona-data.sql
```

`--disable-triggers` — FK tekshiruvi quyish tartibiga bogʻliq boʻlib
qolmasin (`pg_dump` jadval tartibini alfavit boʻyicha yozadi, FK esa
boshqa tartib talab qilishi mumkin).

`ON_ERROR_STOP=1` — birinchi xatoda toʻxtaydi. Yarim koʻchgan
maʼlumotdan koʻra toʻxtagani yaxshi.

### Tekshirish

```sql
-- Har ikkala tomonda bir xil chiqishi kerak
SELECT 'teachers' t, count(*) FROM teachers
UNION ALL SELECT 'classes', count(*) FROM classes
UNION ALL SELECT 'students', count(*) FROM students
UNION ALL SELECT 'grades', count(*) FROM grades
UNION ALL SELECT 'user', count(*) FROM "user";
```

### `student_number` ketma-ketligi

`students.student_number` — `GENERATED ALWAYS AS IDENTITY`. Maʼlumot
koʻchgandan keyin hisoblagichni oldinga surish SHART, aks holda yangi
oʻquvchi qoʻshganda «duplicate key» chiqadi:

```sql
SELECT setval(
  pg_get_serial_sequence('students', 'student_number'),
  COALESCE((SELECT max(student_number) FROM students), 0) + 1,
  false
);
```

---

## 2. Drizzle migratsiya tarixini baseline qilish

Sxema **qoʻlda** (Supabase migratsiyasi bilan) qoʻyilgan, yaʼni
`drizzle.__drizzle_migrations` jadvali boʻsh. Baseline qilmasangiz
keyingi `db:migrate` 30 ta migratsiyani QAYTADAN bajarishga urinadi va
«already exists» bilan yiqiladi:

```bash
npx tsx --env-file=.env.local scripts/migrate.ts --baseline
```

---

## 3. Vercel

`DATABASE_URL` ni Supabase **transaction pooler** (6543) satriga
almashtiring — Production va Preview uchun.

```
postgresql://postgres.lxppxnawxmcfebmzdgil:<parol>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **6543, 5432 EMAS.** Serverless toʻgʻridan-toʻgʻri ulanishda
ulanish limitini tugatadi va bu bazani baham koʻrayotgan LessonLab
botiga ham tegadi.

Kod tomonida `prepare: false` allaqachon qoʻyilgan
(`src/server/db/client.ts`) — transaction pooler'da `PREPARE`
ishlamaydi. Uni olib tashlamang.

---

## 4. Tekshirish roʻyxati

- [ ] `/api/health` — 200
- [ ] Kirish/chiqish ishlaydi (better-auth: `user`, `session`, `account`)
- [ ] Jurnal ochiladi, baho koʻrinadi
- [ ] Davomat yoziladi
- [ ] `/baholash` — sinf va test roʻyxati keladi
- [ ] Yangi oʻquvchi qoʻshiladi (`student_number` ketma-ketligi tekshiruvi)
- [ ] Admin panel: `/admin/users`

---

## 5. Neon — DARHOL OʻCHIRILMAYDI

Kamida **bir hafta** tegmasdan tursin. Orqaga qaytish yoʻli: Vercel'da
`DATABASE_URL` ni eski Neon satriga qaytarish — boshqa hech narsa
kerak emas, chunki kod ikkala tomonda ham bir xil (`postgres-js`
Neon bilan ham ishlaydi, faqat pooler manzili boshqa).

Hammasi bir hafta silliq ishlagach Neon loyihasini oʻchirish mumkin.

---

## Nima oʻzgardi (kod)

| fayl | oʻzgarish |
|---|---|
| `src/server/db/client.ts` | `neon-http` → `postgres-js` + pooler sozlamalari |
| `scripts/{metrics,migrate,migrate-feedback-status,promote-admin,seed}.ts` | shu drayver + `process.exit(0)` |
| `src/server/dal/admin/stats.ts` | `result.rows` → `result` (postgres-js massiv qaytaradi) |
| `.env.local.example` | Supabase pooler namunasi |
| `package.json` | `@neondatabase/serverless` olib tashlandi, `postgres` qoʻshildi |

Skriptlarda `process.exit(0)` qoʻshilgani muhim: `postgres-js` hovuzi
ochiq qolsa Node hodisa sikli tugamaydi va skript qotib qoladi.
`neon-http` stateless edi, shuning uchun ilgari bu kerak emasdi.
