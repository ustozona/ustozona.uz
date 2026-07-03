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
