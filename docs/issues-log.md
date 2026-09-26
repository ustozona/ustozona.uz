# Muammolar jurnali (backend ishi davomida topilganlar)

> Backend migratsiyasi paytida yoʻl-yoʻlakay topilgan, lekin joriy bosqichga
> kirmaydigan muammolar. Har biri alohida sessiyada hal qilinadi.

## 2026-07-03 (7-bosqich tekshiruvi paytida)

### 1. Landing sahifada `?_rsc=` prefetch tsikli (performance)

`/` (landing) ochilganda Network'da **yuzlab takroriy** `GET /?_rsc=wnywt`
soʻrovlari ketadi — bir xil RSC payload qayta-qayta soʻralyapti. Ehtimoliy
sabab: doimiy re-render boʻlayotgan komponent ichidagi `<Link>` prefetch'i
(landing'dagi animatsiya/karusel — framer-motion bloklari shubhali).

- Qayta koʻrish: dev serverda `/` ochib Network'da `_rsc` filtri.
- Tekshirish: `src/app/page.tsx` va u ishlatadigan shadcn-space bloklar
  ([[landing-page-architecture]]) ichidagi Link'lar; kerak boʻlsa
  `prefetch={false}` yoki re-render sababini topish.
- Prod'da ham shundaymi — `next build` (hozircha tsc qarzi bloklaydi) yoki
  Vercel preview'da tekshiriladi.

### 2. TaskComposer: Enter vazifa qoʻshmaydi (UX)

`src/components/tasks/TaskComposer.tsx` — sarlavha inputida **Enter bosilsa
hech narsa boʻlmaydi** (faqat Escape yopadi, qoʻshish faqat submit tugmasi
orqali). TickTick-uslub quick-add odatda Enter bilan qoʻshadi. `onKeyDown`ga
Enter → form submit qoʻshish kerak (Shift+Enter istisnosi shart emas — input
bir qatorli).

## 2026-09-08 (oʻquvchini koʻchirish ishidan qolgan)

Manba: `docs/oquvchini-kochirish-spec.md`, PR #130. Koʻchirishning asosiy
oqimi tugadi va prodga chiqdi; quyidagi ikkitasi ataylab qoldirildi.

### 1. Oʻquvchini sudrab tortib koʻchirish (UI)

Oʻquvchilar sahifasida chapda sinflar, oʻngda oʻquvchilar — bolani sinf
ustiga tashlab koʻchirish tabiiy imo-ishora. `@dnd-kit` loyihada
allaqachon bor (`components/jadval/`), belgilash (`selectedIds`) ham bor.

**Nega qilinmadi:** sinflar ustuni `components/ClassListPanel.tsx` orqali
chiqadi, u esa 10+ sahifada ishlatiladigan MARKAZIY fayl. AGENTS.md
5-qoidasi bunday faylni yolgʻiz tahrir qilishni taqiqlaydi — avval kim
oʻsha faylda ishlayotgani kelishiladi.

**Muhim shart:** tashlangach **soʻralishi kerak** — «qoʻshilsinmi (ikkala
sinfda oʻqiydi) yoki koʻchirilsinmi (eskisidan chiqadi)?». Ikkala amal
bir xil imo-ishora bilan boshlanadi, oqibati esa butunlay boshqa: qoʻshish
qaytariluvchan, koʻchirish esa yozilishni yopadi.

Asosiy oqim (menyu + oyna) busiz toʻliq ishlaydi — bu qulaylik, shart emas.

### 2. Migratsiya jurnalidagi hash drifti (baza)

`npm run db:migrate:dry` lokal bazada **25 ta** migratsiyani «qoʻllanmagan»
deb koʻrsatadi, holbuki ularning obyektlari bazada bor. Sabab hujjatlashtirilgan:
drizzle migratsiyani fayl NOMI bilan emas, MAZMUN hash'i bilan eslaydi, bir
qancha fayl esa qoʻllanilgandan keyin tahrirlangan
(`drizzle/TUZATISH-migratsiya-jurnali-2026-09-04.sql` — oʻshanda 10 tasi
prod uchun tuzatilgan edi).

⛔ **Oqibati:** `db:migrate --yes` ishlatib boʻlmaydi. Roʻyxatda
`CREATE TABLE "account"` kabi mavjud obyektlar ham, `DROP COLUMN "input_mode"`
va `DROP CONSTRAINT` kabi BUZUVCHI amallar ham bor. Har yangi migratsiya
shu sababli qoʻlda qoʻllanmoqda (0047 ham shunday chiqdi).

**Tuzatish yoʻli maʼlum:** 2026-09-04 skripti naqshi boʻyicha
`__drizzle_migrations` ga yetishmagan hash yozuvlari qoʻshiladi — sxemaga
tegilmaydi. Oldin har bir migratsiya obyektlari `information_schema` dan
birma-bir tasdiqlanishi shart.
