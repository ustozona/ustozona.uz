# Neon → Supabase: bitta bazaga oʻtish

Ustozona bazasi LessonLab bilan **bitta Supabase loyihasiga** koʻchdi
(`lxppxnawxmcfebmzdgil`).

> **Qaror (2026-08-05, Behruz + Otabek):** Neon'dagi maʼlumot
> koʻchirilMAYDI. U sinov maʼlumoti edi — haqiqiy foydalanuvchi yoʻq,
> testlar esa LessonLab bazasida saqlanadi va OAuth import orqali
> qaytadan olinadi. Shuning uchun Supabase **toza sahifadan** boshlaydi.

---

## Holat

| qism | holat |
|---|---|
| Sxema (55 jadval, 101 FK, 129 indeks) | ✅ Supabase'da |
| RLS (55/55 jadval) | ✅ yoqilgan |
| Kod (`postgres-js` drayveri) | ✅ tayyor |
| Maʼlumot | — koʻchirilmaydi, toza boshlanadi |
| Vercel `DATABASE_URL` | ⏳ almashtirilishi kerak |

---

## 0. Nimani kutish kerak — va nimani KUTMASLIK

✅ Bitta ulanish satri, bitta zaxira, bitta hisob. Kelajakda sxemalarni
birlashtirishga yoʻl ochiladi.

⛔ **Dublikat OʻZ-OʻZIDAN yoʻqolmaydi.** Bitta bazada `students` va
`bot_students` baribir ikkita alohida jadval boʻlib qolaveradi. Botda
oʻquvchi ismini oʻzgartirsangiz `students.name` oʻzgarmaydi. Konflikt
maʼlumot MODELIDA, server manzilida emas.

Toʻliq birlashtirish — alohida, kattaroq loyiha: identifikatorlar
turlicha (Telegram `user_id` bigint / better-auth `user.id` text),
kalitlar butun/UUID, LessonLab'ning `db/` qatlami qayta yozilishi kerak.
Koʻprik allaqachon bor: `user_telegram` jadvali.

⚠️ **Umumiy nosozlik doirasi.** Endi baza yiqilsa IKKALA mahsulot ham
toʻxtaydi. Ilgari ular mustaqil edi.

---

## 1. RLS — nega yoqilgan va nega siyosat yoʻq

Supabase `public` sxemani PostgREST orqali **tashqariga ochadi**, anon
kalit esa ochiq hisoblanadi (u brauzer kodida boʻladi). RLS yoqilmasa
oʻsha kalit bilan hamma narsa oʻqilardi: oʻquvchi ismlari, ota-ona
telefonlari, baholar, `account` dagi parol xeshlari.

Shuning uchun 55 ta jadvalda RLS **yoqilgan**, siyosat esa **ataylab
qoʻshilmagan**: siyosatsiz RLS = «hech kimga ruxsat yoʻq». Ustozona
ilovasi bazaga JADVAL EGASI (`postgres`) sifatida ulanadi, egasi esa
RLS dan chetlab oʻtadi — ilova ishlashda davom etadi.

⛔ **`FORCE ROW LEVEL SECURITY` qoʻshmang** — u egani ham cheklaydi va
ilova butunlay ishlamay qoladi.

Aynan shu holat LessonLab jadvallarida ham (78 tasida RLS yoqilgan,
siyosat yoʻq).

---

## 2. Vercel

`DATABASE_URL` ni Supabase **transaction pooler** (6543) satriga
almashtiring — Production va Preview uchun.

```
postgresql://postgres.lxppxnawxmcfebmzdgil:<parol>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **6543, 5432 EMAS.** Serverless toʻgʻridan-toʻgʻri ulanishda
Postgres ulanish limitini tez tugatadi va bu bazani baham koʻrayotgan
LessonLab botiga ham tegadi.

Kod tomonida `prepare: false` allaqachon qoʻyilgan
(`src/server/db/client.ts`) — transaction pooler'da `PREPARE`
ishlamaydi. Uni olib tashlamang.

---

## 3. Drizzle migratsiya tarixini baseline qilish

Sxema **qoʻlda** (Supabase migratsiyasi bilan) qoʻyilgan, yaʼni
`drizzle.__drizzle_migrations` jadvali boʻsh. Baseline qilmasangiz
keyingi `db:migrate` 30 ta migratsiyani QAYTADAN bajarishga urinadi va
«already exists» bilan yiqiladi.

`.env.local` da `DATABASE_URL` ni Supabase satriga qoʻying, keyin:

```bash
npx tsx --env-file=.env.local scripts/migrate.ts --baseline
```

---

## 4. Birinchi kirish — toza bazada

Baza boʻsh, yaʼni akkauntlar ham yoʻq. Tartib:

1. `ustozona.uz` da **qaytadan roʻyxatdan oʻting** (Google OAuth).
   Bu `user` + `teachers` qatorlarini yaratadi.
2. Oʻzingizga super-admin roli bering:

   ```bash
   npx tsx --env-file=.env.local scripts/promote-admin.ts <email>
   ```

3. `/baholash` → **«Sinflarni koʻchirish»** — LessonLab'dan sinf va
   oʻquvchilar OAuth orqali keladi.
4. Sinf tanlab **«Testlarni koʻchirish»** — testlar keladi.

Yaʼni sinf/oʻquvchi/test qaytadan yozilmaydi — LessonLab'dan olinadi.

---

## 5. Tekshirish roʻyxati

- [ ] `/api/health` — 200
- [ ] Roʻyxatdan oʻtish va kirish ishlaydi
- [ ] `promote-admin` dan keyin `/admin/users` ochiladi
- [ ] `/baholash` → «Sinflarni koʻchirish» ishlaydi
- [ ] «Testlarni koʻchirish» ishlaydi
- [ ] Jurnal ochiladi, baho qoʻyiladi
- [ ] Davomat yoziladi
- [ ] Yangi oʻquvchi qoʻshiladi (`student_number` ketma-ketligi)
- [ ] Qogʻoz test → varaq PDF chiqadi

---

## 6. Neon — DARHOL OʻCHIRILMAYDI

Kamida **bir hafta** tegmasdan tursin. Maʼlumot koʻchirilmagan boʻlsa
ham, orqaga qaytish yoʻli ochiq qolsin: Vercel'da `DATABASE_URL` ni
eski Neon satriga qaytarish kifoya (kod ikkala tomonda ham bir xil —
`postgres-js` Neon bilan ham ishlaydi).

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

Uchta nozik joy bor edi:

1. **`prepare: false`** — transaction pooler'da `PREPARE` ishlamaydi,
   chunki har soʻrov boshqa backendga tushishi mumkin. Usiz
   «prepared statement does not exist» chiqadi: doim emas, faqat
   ulanish almashganda — yaʼni testda koʻrinmay prodda.
2. **`db.execute()`** postgres-js'da massiv qaytaradi, neon-http'da
   `{ rows: [...] }` edi.
3. **Skriptlarda `process.exit(0)`** — postgres-js hovuzi ochiq qolsa
   Node hodisa sikli tugamaydi va skript qotib qoladi. neon-http
   stateless edi.
