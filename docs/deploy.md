# Vercel Hobby'ga deploy

`next build` lokal oʻtadi (tsc TOZA — 31 baseline 2026-07-04 da tuzatilgan,
`ignoreBuildErrors` bayrogʻi olib tashlangan; build toʻliq type-check bilan).

> **Holat (2026-07-14):** domen ULANGAN — asosiy manzil `https://www.ustozona.uz`
> (apex `ustozona.uz` → www ga 308 redirect, DNS ahost.uz'da). Demo seed
> yuritilgan (`npm run db:seed`). Health + demo login ikkala domenda ham OK.
> Google OAuth ham sozlangan va ishlaydi (sign-in/social → haqiqiy Google URL).
> Qolgan: faqat telefon-qurilmada prod tekshiruv.

## 1. Repo → Vercel

1. Loyihani GitHub'ga push qiling (private repo boʻlsa ham boʻladi).
2. vercel.com → **Add New → Project** → repo'ni tanlang.
   Framework: Next.js (avtomatik aniqlanadi), build sozlamalari default.

## 2. Environment Variables (Project → Settings → Environment Variables)

| Nomi | Qiymat | Muhit |
|---|---|---|
| `DATABASE_URL` | Neon connection string (`?sslmode=require` bilan) | Production (+Preview ixtiyoriy) |
| `BETTER_AUTH_SECRET` | 64 belgili maxfiy satr (lokaldagidan BOSHQA yangi qiymat tavsiya) | Production |
| `BETTER_AUTH_URL` | `https://<loyiha>.vercel.app` (birinchi deploy'dan keyin aniq URL bilan yangilang) | Production |
| `ANTHROPIC_API_KEY` | ixtiyoriy — dars muharriri AI yordamchisi | Production |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ixtiyoriy — Google login | Production |

Eslatmalar:
- `BETTER_AUTH_URL` notoʻgʻri boʻlsa login cookie'lari ishlamaydi —
  birinchi deploy'dan keyin haqiqiy domen bilan tekshirib qoʻying.
- Google OAuth yoqilsa Google konsolida redirect URI qoʻshing:
  `https://<loyiha>.vercel.app/api/auth/callback/google`.
- Neon Frankfurt'da — Vercel funksiya regionini ham `fra1`ga qoʻyish
  kechikishni kamaytiradi (Project → Settings → Functions → Region).

## 3. Sxema va demo maʼlumot

Baza allaqachon mavjud (dev bilan bir xil Neon). Yangi/toza baza uchun:

```powershell
npm run db:migrate   # drizzle/ migratsiyalarini qo'llaydi
npm run db:seed      # ixtiyoriy — demo o'qituvchi
```

Sxema oʻzgarish oqimi (push EMAS):
`schema tahriri → npm run db:generate → npm run db:migrate → deploy`.
Mavjud (push bilan qurilgan) bazani migratsiya tarixiga bogʻlash allaqachon
bajarilgan (`scripts/migrate.ts --baseline`, 2026-07-03).

## 4. Deploy'dan keyingi tekshiruv

1. `https://<loyiha>.vercel.app/api/health` → `{"ok":true,...}` JSON.
2. Telefondan kirish: demo@ustozona.uz / demo12345 → Baholar jurnalida
   baho oʻzgartirish → sahifani yangilash → baho turibdi (9-bosqich
   qabul mezoni).
3. Yangi hisob roʻyxatdan oʻtkazish → boʻsh holatlar (demo maʼlumot
   koʻrinmasligi kerak).

## 5. ustozona.uz domenini ulash (deploy'dan keyin)

1. **Domen sotib olish.** `.uz` zonasini UZINFOCOM (cctld.uz) boshqaradi —
   akkreditatsiyalangan registratordan olinadi (ahost.uz, webspace.uz va
   boshqalar; narx ~100–150 ming soʻm/yil). cctld.uz saytida ustozona.uz
   bandligini tekshirish mumkin.
2. **Vercel'ga qoʻshish.** Project → Settings → Domains → `ustozona.uz`
   (va `www.ustozona.uz` → apex'ga redirect). Vercel koʻrsatadigan DNS
   yozuvlarini registrator panelida kiritasiz:
   - apex `ustozona.uz` → **A** yozuv `76.76.21.21`
   - `www` → **CNAME** `cname.vercel-dns.com`
   SSL sertifikatni Vercel oʻzi chiqaradi (Let's Encrypt, avtomatik).
   DNS tarqalishi odatda bir necha daqiqa–soat.
3. **Env yangilash.** `BETTER_AUTH_URL=https://ustozona.uz` → redeploy.
   Bu qilinmasa login cookie'lari yangi domenda ishlamaydi.
4. **Google OAuth** (agar yoqilgan boʻlsa): Google konsolda redirect
   URI'ga `https://ustozona.uz/api/auth/callback/google` qoʻshiladi.
5. Tekshiruv: `https://ustozona.uz/api/health` → JSON; login → dashboard.

Kod oʻzgarishi kerak EMAS — domen faqat DNS + env masalasi.

## Cheklovlar (Hobby reja)

- Serverless funksiya timeout ~10s (AI stream uchun yetarli, Neon cold
  start ~1s qoʻshiladi).
- Cron yoʻq — zaxira qoʻlda (docs/backup.md).
