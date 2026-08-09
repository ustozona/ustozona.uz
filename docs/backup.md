# Zaxira (backup) va koʻchirish yoʻli

Yagona haqiqat manbai — **Supabase**'dagi Postgres (loyiha
`lxppxnawxmcfebmzdgil`). Neon 2026-08-10 da prod rolidan chiqdi va endi
**dev bazasi** sifatida ishlatiladi (`docs/supabase-kochish.md`).

> ⚠️ **Bu baza LessonLab bilan UMUMIY.** `public` sxemada 175 dan ortiq
> jadval bor, ularning koʻpi Ustozona'niki emas. Buning zaxiraga ikkita
> oqibati bor va ikkalasi ham quyida alohida yozilgan — oʻqimasdan
> `pg_restore` yurgizmang.

## 1. Supabase avtomatik zaxiralari — BIZDA YOʻQ

Supabase kunlik avtomatik zaxirani **faqat Pro, Team va Enterprise**
rejalarida oladi. Point-in-Time Recovery ham pullik qoʻshimcha.

**Loyiha bepul rejada (2026-08-10 da tasdiqlangan) — yaʼni avtomatik
zaxira umuman yoʻq.** Supabase hujjatlarining oʻzi bepul loyihalarga
maʼlumotni muntazam qoʻlda eksport qilib, nusxasini tashqarida saqlashni
tavsiya qiladi.

Demak quyidagi 2-boʻlim tanlov emas — **yagona himoya**. U bajarilmasa,
baza buzilganda tiklash yoʻli yoʻq.

Yana bir eslatma: loyiha oʻchirilsa Supabase zaxiralarni ham butunlay
oʻchiradi. Oflayn nusxa shuning uchun ham kerak.

## 2. `pg_dump` — toʻliq oflayn nusxa (asosiy yoʻl)

Server **PostgreSQL 17.6** da ishlaydi, shuning uchun `pg_dump` ham
**17.x** boʻlishi shart — eski client yangi serverdan dump ola olmaydi
va "server version mismatch" bilan toʻxtaydi.

```powershell
winget install PostgreSQL.PostgreSQL.17
```

### Qaysi ulanish satri — bu yerda adashish oson

`.env.local` dagi `DATABASE_URL` **transaction pooler** (6543-porti).
U ilova uchun toʻgʻri, lekin `pg_dump` uchun **yaramaydi** — Supabase
hujjatlari native Postgres buyruqlari uchun direct connection yoki
session pooler talab qiladi:

| Maqsad | Host:port | Holat |
|---|---|---|
| Ilova (`DATABASE_URL`) | `aws-1-…pooler.supabase.com:6543` | ishlaydi |
| Direct connection | `db.lxppxnawxmcfebmzdgil.supabase.co:5432` | ⛔ **bizda ULANMAYDI** |
| **`pg_dump` uchun** | `aws-1-…pooler.supabase.com:5432` | ✅ session pooler |

Direct endpoint faqat **IPv6**'da (IPv4 pullik qoʻshimcha), bizning
tarmoq esa IPv4-only — 2026-08-10 da tekshirilgan, TCP ulanish
oʻrnatilmadi. Shuning uchun yagona yoʻl — **session pooler**: oʻsha
pooler hosti, lekin **5432**-port va foydalanuvchi `postgres.<ref>`.

### Nusxa olish

```powershell
# Faqat Ustozona jadvallarini olish shart emas — butun bazani olish
# soddaroq va LessonLab uchun ham foydali.
pg_dump "postgresql://postgres.lxppxnawxmcfebmzdgil:<PAROL>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres" `
  --format=custom --no-owner --no-privileges `
  --file="ustozona-$(Get-Date -Format 'yyyy-MM-dd').dump"
```

### Tiklash

```powershell
pg_restore --no-owner --no-privileges `
  --dbname="<YANGI_DATABASE_URL>" "ustozona-2026-08-10.dump"
```

> ⛔ **`--clean --if-exists` ni jonli bazaga ISHLATMANG.** U tiklashdan
> oldin jadvallarni oʻchiradi — baza umumiy boʻlgani uchun bu LessonLab'ning
> maʼlumotini ham yoʻq qiladi. Bu bayroqlar faqat boʻsh yoki oʻzingizga
> tegishli bazaga tiklashda oʻrinli.

Eslatmalar:
- `--format=custom` — siqilgan, `pg_restore` bilan tanlab tiklash mumkin.
- Auth jadvallari (`user`, `session`, `account`, `verification`) ham dump
  ichida — parol hashlari scrypt, boshqa serverda ham ishlayveradi.
- Muntazamlik: hozircha qoʻlda. Bepul rejada avtomatik zaxira boʻlmagani
  uchun **oyiga bir marta yetarli emas** — haqiqiy oʻqituvchilar ishlay
  boshlagach haftada bir marta qiling. Keyinchalik GitHub Actions cron
  bilan avtomatlashtirsa boʻladi.

## 3. Foydalanuvchi darajasidagi eksport (ilova ichida)

Sozlamalar → Maʼlumotlar → **"Maʼlumotlarni eksport qilish"** — joriy
hisobning oʻquvchilari, sinflari, darslari va topshiriqlarini bitta
`.xlsx` faylga yuklab beradi (server-backed store'lardan, yaʼni bazadagi
joriy holatdan). Bu oʻqituvchining "oʻz nusxam" ehtiyoji uchun; texnik
zaxira emas.

## Dev bazasi (Neon) — zaxira kerak emas

Neon'dagi maʼlumot butunlay sinov maʼlumoti. Buzilsa tiklash yoʻli bitta:

```powershell
npm run db:seed   # idempotent — demo oʻqituvchi qatorlarini qayta yozadi
```

Oʻz hisobingiz ostida ishlash uchun: `SEED_EMAIL=<pochtangiz> npm run db:seed`.

## UzCloud'ga koʻchish (kelajak, vendor lock-in yoʻq)

Stack sof Postgres boʻlgani uchun koʻchish = `pg_dump` → UzCloud'dagi
Postgres'ga `pg_restore` → `.env`da `DATABASE_URL` almashtirish.

Driver tomondan endi hech qanday toʻsiq yoʻq: kod `postgres-js` ishlatadi,
u istalgan Postgres bilan gaplashadi (Supabase koʻchishida `neon-http`
dan aynan shuning uchun voz kechilgan). Yagona ish — ulanish satrini
almashtirish.

Bitta strategik eslatma: baza LessonLab bilan umumiy boʻlgani uchun
koʻchish endi bir tomonlama qaror emas — ikkala mahsulot birga koʻchadi
yoki avval bazalar ajratiladi.
