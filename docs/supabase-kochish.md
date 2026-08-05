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
| Maʼlumot | — koʻchirilmadi, toza boshlandi |
| Vercel `DATABASE_URL` | ✅ almashtirildi (2026-08-05) |
| Drizzle baseline (30 migratsiya) | ✅ bajarildi |
| Super-admin tiklandi | ✅ |

**Koʻchish tugadi (2026-08-05).** Ikkala mahsulot bitta bazada:
`ustozona.uz/api/health` → `ok`, `lessonlab.uz/api/health` → `ok`.
LessonLab maʼlumotlari daxlsiz (116 test, 19 sinf, 278 oʻquvchi).

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
postgresql://postgres.lxppxnawxmcfebmzdgil:<parol>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **`aws-1`, `aws-0` EMAS.** Bu prefiks pooler klasterini bildiradi va
har loyihada bir xil emas. Bu loyihaniki — `aws-1` (LessonLab boti ham
aynan shu manzil bilan ishlaydi). Ishonch hosil qilish uchun aniq satrni
Supabase panelidan oling: **Connect → Transaction pooler**. Xato prefiks
`Tenant or user not found` beradi.

⚠️ **6543, 5432 EMAS.** Serverless toʻgʻridan-toʻgʻri ulanishda
Postgres ulanish limitini tez tugatadi va bu bazani baham koʻrayotgan
LessonLab botiga ham tegadi.

⚠️ **Parolda maxsus belgi boʻlsa URL-kodlang.** `@ # / ? % &` kabi
belgilar ulanish satrini boʻlib yuboradi. Masalan `#` → `%23`.

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

Kamida **bir hafta** tegmasdan tursin.

⚠️ **Orqaga qaytish BIR TUGMA bilan boʻlmaydi — buni oldindan bilib
turing.** Vercel'dagi `DATABASE_URL` «Sensitive» qilib saqlangan, yaʼni
uni QAYTA OʻQIB BOʻLMAYDI: na panelda koʻrinadi, na `vercel env pull`
chiqaradi (2026-08-05 da tekshirildi — `"[SENSITIVE]"` qaytdi). Ustiga
Supabase satrini yozganda eski Neon satri **butunlay yoʻqoladi**.

Bu **maʼlumot yoʻqolishi degani emas**: Neon loyihasi va undagi baza
oʻz joyida qoladi. Qaytish kerak boʻlsa Neon konsolidan parolni qayta
tiklab yangi ulanish satri olinadi — yaʼni yoʻl bor, lekin u
«nusxa-joylashtir» emas, bir necha qadamlik ish.

Qaror shu asosda qabul qilingan: Neon'dagi maʼlumot sinov maʼlumoti,
qaytish ehtimoli past. Kod tomoni esa haqiqatan ikkala bazada ham
ishlaydi (`postgres-js` Neon bilan ham gaplashadi) — muammo faqat
parolda.

Hammasi bir hafta silliq ishlagach Neon loyihasini oʻchirish mumkin.

---

## 7. Koʻchishda nima notoʻgʻri ketdi (2026-08-05)

Kelasi safar bu qidiruv takrorlanmasin — uchta haqiqiy tuzoq:

**1. Parol ikkala joyda ham almashtirilishi kerak.** Supabase'da parol
qayta tiklandi, lekin LessonLab botining EC2'dagi `.env` fayli eskicha
qoldi. Bot **darhol yiqilmadi** — Postgres parol oʻzgarganda ochiq
ulanishlarni uzmaydi, shuning uchun `/api/health` bir muddat `ok`
koʻrsatib turdi va nosozlik faqat qayta ulanishda chiqdi. Yaʼni
«ishlayapti» degani «sozlamasi toʻgʻri» degani EMAS.

Endi baza bitta — parol almashtirilsa **ikkovini birga** yangilang:
Vercel `DATABASE_URL` **va** EC2 `.env` dagi `SUPABASE_DB_URL`.

**2. `aws-0` ↔ `aws-1`.** Namunada `aws-0` yozilgan edi, bu loyihaniki
esa `aws-1`. Xato prefiks bilan ulanish umuman ochilmaydi. Aniq satrni
doim Supabase panelidan oling (Connect → Transaction pooler).

**3. Eski deploy chalgʻitadi.** `DATABASE_URL` almashtirilgach Vercel
avtomatik qayta deploy qilmaydi. Shu sabab health endpoint bir muddat
`teachers: 7` deb turdi — u hali NEON'ga ulangan eski deploy edi.
Toza Supabase'da bu son **0** boʻlishi kerak. Env oʻzgartirgach
**Redeploy** shart, aks holda eski qiymat bilan ishlaydi.

Uchala holatda ham asosiy xato — sabab oʻrniga alomatga qarash.
Shuning uchun `/api/health` endi sababni oʻzi aytadi (pastga qarang).

---

## Nima oʻzgardi (kod)

| fayl | oʻzgarish |
|---|---|
| `src/server/db/client.ts` | `neon-http` → `postgres-js` + pooler sozlamalari; klient endi **dangasa** |
| `scripts/{metrics,migrate,migrate-feedback-status,promote-admin,seed}.ts` | shu drayver + `process.exit(0)` |
| `src/server/dal/admin/stats.ts` | `result.rows` → `result` (postgres-js massiv qaytaradi) |
| `src/server/dal/health.ts` | **yangi** — ulanish tekshiruvi, xato sababini aytadi |
| `src/app/api/health/route.ts` | mantiq DAL'ga koʻchdi (klient faqat DAL'da) |
| `.env.local.example` | Supabase pooler namunasi |
| `package.json` | `@neondatabase/serverless` olib tashlandi, `postgres` qoʻshildi |

### `/api/health` endi sababni aytadi

Ilgari u faqat `Failed query: select count(*) from "teachers"` derdi —
bu Drizzle oʻrami, asl sabab esa `cause` ichida koʻrinmay qolardi.
Koʻchish paytida nosozlik shu tufayli TAXMIN qilindi.

Endi javobda xato **kodi** va tayyor izoh boʻladi:

```json
{ "ok": false, "db": "error", "code": "XX000",
  "sabab": "Pooler loyihani topmadi — manzil prefiksi (aws-0/aws-1) notoʻgʻri boʻlishi mumkin." }
```

Xom Postgres matni ATAYLAB qaytarilmaydi: endpoint ochiq, xom xato esa
foydalanuvchi nomi va ichki manzillarni koʻrsatib qoʻyardi. Kod
diagnostika uchun yetarli, sir ochilmaydi.

### Klient dangasa (lazy) boʻldi

Ilgari `DATABASE_URL` tekshiruvi modul sathida turardi — faylni
IMPORT qilishning oʻzi baza sirini talab qilardi va `next build`
sirsiz muhitda yiqilardi (`Failed to collect page data for /api/health`).
Endi klient birinchi ishlatilganda quriladi: build sir talab qilmaydi,
xato xabari esa yoʻqolmadi — u haqiqiy soʻrov paytida chiqadi.

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
