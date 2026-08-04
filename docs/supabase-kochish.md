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

### Hech narsa oʻrnatish KERAK EMAS

`pg_dump` ishlatilmaydi. Sabab: u alohida oʻrnatishni talab qiladi va
versiyasi serverdan past boʻlsa umuman ishlamaydi (PG 17 serverdan
PG 16 `pg_dump` dump ololmaydi). Node va `tsx` esa loyihada allaqachon
bor, shuning uchun koʻchirish oddiy skript bilan bajariladi:
`scripts/kochir-supabase.ts`.

### Buyruqlar (PowerShell)

```powershell
# Neon satri — .env.local dan, ekranga chiqmaydi
$env:SOURCE_DATABASE_URL = (Get-Content .env.local | Select-String '^DATABASE_URL=').Line.Substring(13)

# Supabase → Connect → Direct connection (5432)
$env:TARGET_DATABASE_URL = "postgresql://postgres:<parol>@db.lxppxnawxmcfebmzdgil.supabase.co:5432/postgres"

# 1) QURUQ YURISH — hech narsa yozmaydi, faqat nima koʻchishini koʻrsatadi
npm run db:kochir -- --quruq

# 2) Haqiqiy koʻchirish
npm run db:kochir
```

Skript nima qiladi:

- **Nishon boʻshligini tekshiradi.** Toʻla jadval koʻrsa toʻxtaydi —
  ikki marta yugurtirib maʼlumotni ikkilantirib qoʻyish mumkin emas.
- **Bitta tranzaksiya.** Xato chiqsa hech narsa saqlanmaydi.
- **FK triggerlarini oʻchiradi** (`session_replication_role = replica`),
  shuning uchun jadval tartibi ahamiyatsiz.
- **`student_number` identity ni saqlaydi** — vaqtincha olib turib,
  qaytarib qoʻyadi va hisoblagichni suradi. Aks holda Postgres oʻz
  raqamini berardi va eski raqamlar yoʻqolardi.
- **Oxirida sanoqni solishtiradi** — manba va nishon mos kelmasa
  ochiq aytadi.
- **Manbaga faqat OʻQISH uchun tegadi.** Neon tegilmasdan qoladi.

### Tekshirish

```sql
-- Har ikkala tomonda bir xil chiqishi kerak
SELECT 'teachers' t, count(*) FROM teachers
UNION ALL SELECT 'classes', count(*) FROM classes
UNION ALL SELECT 'students', count(*) FROM students
UNION ALL SELECT 'grades', count(*) FROM grades
UNION ALL SELECT 'user', count(*) FROM "user";
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
