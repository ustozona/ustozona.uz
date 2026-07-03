# Zaxira (backup) va koʻchirish yoʻli

Yagona haqiqat manbai — Neon'dagi Postgres. Uch qatlamli zaxira:

## 1. Neon'ning oʻz zaxiralari (avtomatik)

Neon bepul rejada **point-in-time restore** beradi (odatda ~24 soatlik
tarix, branch orqali). Baza buzilsa: Neon konsoli → Branches → istalgan
vaqtdagi holatdan yangi branch → `DATABASE_URL`ni shu branchga almashtirish.
Hech narsa sozlash shart emas — bu doim yoniq.

## 2. `pg_dump` — toʻliq oflayn nusxa (asosiy yoʻl)

PostgreSQL 16+ client oʻrnatilgan boʻlsin (Windows: `winget install
PostgreSQL.PostgreSQL.16` client tools bilan, yoki scoop/EDB installer).

```powershell
# .env.local'dagi DATABASE_URL bilan (psql formatidagi to'liq URL):
pg_dump "$env:DATABASE_URL" --format=custom --no-owner --no-privileges `
  --file="ustozona-$(Get-Date -Format 'yyyy-MM-dd').dump"
```

Tiklash (istalgan Postgres'ga — Neon, lokal, UzCloud):

```powershell
pg_restore --no-owner --no-privileges --clean --if-exists `
  --dbname="<YANGI_DATABASE_URL>" "ustozona-2026-07-03.dump"
```

Eslatmalar:
- `--format=custom` — siqilgan, `pg_restore` bilan tanlab tiklash mumkin.
- Neon URL'ida `?sslmode=require` boʻlishi shart (URL'da allaqachon bor).
- Auth jadvallari (`user`, `session`, `account`, `verification`) ham
  dump ichida — parol hashlari scrypt, boshqa serverda ham ishlayveradi.
- Muntazamlik: hozircha qoʻlda, oyiga ~1 marta yetarli (maʼlumot hajmi
  kichik). Keyinchalik GitHub Actions cron bilan avtomatlashtirsa boʻladi.

## 3. Foydalanuvchi darajasidagi eksport (ilova ichida)

Sozlamalar → Maʼlumotlar → **"Maʼlumotlarni eksport qilish"** — joriy
hisobning oʻquvchilari, sinflari, darslari va topshiriqlarini bitta
`.xlsx` faylga yuklab beradi (server-backed store'lardan, yaʼni bazadagi
joriy holatdan). Bu oʻqituvchining "oʻz nusxam" ehtiyoji uchun; texnik
zaxira emas.

## UzCloud'ga koʻchish (kelajak, vendor lock-in yoʻq)

Stack sof Postgres boʻlgani uchun koʻchish = `pg_dump` → UzCloud'dagi
Postgres'ga `pg_restore` → `.env`da `DATABASE_URL` almashtirish.
Bitta ehtiyot: kod `@neondatabase/serverless` (neon-http) driver'ida —
oddiy Postgres'ga oʻtishda `drizzle-orm/node-postgres` (pg Pool) ga
almashtirish kerak (faqat `src/server/db/client.ts` va
`scripts/{seed,migrate}.ts` tegadi, sxema/DAL oʻzgarmaydi).

## Demo maʼlumotni tiklash

```powershell
npm run db:seed   # idempotent — demo o'qituvchi qatorlarini qayta yozadi
```
