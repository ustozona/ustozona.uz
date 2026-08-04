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

### Kerakli vosita

`pg_dump` / `psql` — **17-versiya yoki undan yuqori** (Neon ham,
Supabase ham PG 17). Eski `pg_dump` yangi serverdan dump ololmaydi va
«server version mismatch» beradi.

Windows: <https://www.postgresql.org/download/windows/> → EDB
oʻrnatuvchisi → faqat *Command Line Tools* yetarli.

```powershell
pg_dump --version   # 17.x boʻlishi kerak
```

### Ulanish satrlari

Neon satri lokal `.env.local` faylingizda. Uni ekranga chiqarmasdan
oʻzgaruvchiga olamiz:

```powershell
$NEON = (Get-Content .env.local | Select-String '^DATABASE_URL=').Line.Substring(13)
```

Supabase satri: Supabase → Connect → **Direct connection** (5432).
Koʻchirish uchun pooler (6543) MAʼQUL EMAS: `pg_dump`/`psql` uzoq
tranzaksiya ochadi, transaction pooler esa buni uzib qoʻyadi.

```powershell
$SUPA = "postgresql://postgres:<parol>@db.lxppxnawxmcfebmzdgil.supabase.co:5432/postgres"
```

### Koʻchirish

```powershell
# 1) Neon'dan FAQAT maʼlumot (sxema allaqachon Supabase'da)
pg_dump $NEON --data-only --no-owner --no-privileges -f ustozona-data.sql

# 2) FK tekshiruvini vaqtincha oʻchirib, BITTA tranzaksiyada quyamiz
"SET session_replication_role = replica;" | Set-Content -Encoding utf8 quyish.sql
Get-Content ustozona-data.sql | Add-Content -Encoding utf8 quyish.sql
"SET session_replication_role = origin;"  | Add-Content -Encoding utf8 quyish.sql

psql $SUPA -v ON_ERROR_STOP=1 -1 -f quyish.sql
```

**Nega `--disable-triggers` EMAS.** `pg_dump --disable-triggers`
`ALTER TABLE ... DISABLE TRIGGER ALL` chiqaradi, bu esa FK triggerlari
uchun **superuser** talab qiladi. Supabase'ning `postgres` roli
superuser EMAS — buyruq «permission denied» bilan yiqilardi.
`session_replication_role = replica` esa oʻsha ishni qiladi va bu rol
uchun ruxsat etilgan.

**Nega `-1` (bitta tranzaksiya).** Ikki sababdan: `SET` butun quyish
davomida kuchda qoladi, va xato chiqsa **hech narsa saqlanmaydi** —
yarim koʻchgan baza qolmaydi. `ON_ERROR_STOP=1` esa birinchi xatoda
toʻxtatadi.

FK tartibi shu bilan hal boʻladi: `pg_dump` jadvallarni alfavit
boʻyicha yozadi (`account` → `activities` → ...), FK esa boshqa tartib
talab qilishi mumkin edi.

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
