# Landing dizayn qatlami

Landing (`src/app/page.tsx`) — **mahsulot UI dizayn tizimidan ALOHIDA qatlam**.
Mahsulot ichi (`docs/design-system.md`) marketing emas: u 14px matn, 36px boshqaruv,
faqat token rang. Landing esa marketing miqyosida ishlaydi. Ikkalasi bir loyihada,
lekin qoidalari boshqacha — bu hujjat landing qatlamini belgilaydi.

## 1. Tema va ranglar

- Butun sahifa `theme-landing-mono` ichida (`globals.css`): `--primary` qora/oq,
  `--accent`/`--muted` neytral. Kartalar, tugmalar, matn — **token** (`bg-card`,
  `text-foreground`, `bg-primary`...).
- **Istisno — gradient porlash:** atayin xom Tailwind ranglari (`sky-100`,
  `amber-100`, `white`) ishlatiladi. Bu landing'ning vizual imzosi (foydalanuvchi
  tanlovi), token emas. Faqat dekorativ porlashda; kontent yuzalarida emas.
- **Istisno — boʻlim ranglari (2026-09-19):** har mahsulot boʻlimining oʻz rangi bor —
  jurnal (brend sarigʻi), baholash (binafsha), taqdimot (toʻq sariq), doska (zumrad),
  blog (kulrang). Yagona manba: `src/components/landing/landing-tones.ts`
  (`LANDING_TONES`). Rang faqat **urgʻu**: ikonka qutisi, yorliq, havola, karta
  chegarasi hoverda, vizual namuna foni. Karta foni va matn tokenda qoladi.

## 2. Gradient porlash — `<LandingGlow />`

Yagona primitiv: `src/components/landing/LandingGlow.tsx`. Uzun `before:` satrini
takrorlamang — shu komponentdan foydalaning.

```tsx
<section className="relative ...">
  <LandingGlow className="left-1/2 top-24 -translate-x-1/2 w-[70%] h-[40%]" />
  ...
</section>
```

- Ota element `relative` bo'lishi shart; glow `absolute -z-10 blur-3xl`.
- Joylashuv/o'lcham/opacity `className` orqali (`opacity-60` markaziy, default `opacity-50`).
- Hozir ishlatilgan: Hero, About (markaziy, kattaroq), Services, Feature, CTA
  (Hero/CTA full-bleed gradientni o'z bloki ichida saqlaydi — shakli farqli).

## 3. Tipografika (marketing miqyosi)

Katta matn — **modulli, suyuq shkala** (`globals.css`, `text-landing-1` … `-6`),
breakpoint kombinatsiyasi (`text-3xl sm:text-5xl`) emas. Baza 16px, qadam n = 16 × nisbatⁿ:

- **≥ 1440px — nisbat 1.2 (Minor Third):** blog va yordam sahifalarining oʻqish
  shkalasi bilan bir xil. Sarlavhalar zich, mazmun (kartalar, namunalar) oldinda.
- **320px — nisbat 1.125 (Major Second):** telefonda farq yumshaydi.
- Oraliqda `clamp()` chiziqli oʻtadi — sakrash yoʻq.

Klass oʻlcham, qator balandligi va harf oraligʻini beradi; **vazn joyida** yoziladi:
sarlavhalarda `font-semibold` (`font-bold` ni dizayn tokenlari darvozasi toʻsadi).
Yoniga `leading-*` faqat ataylab (masalan raqamda `leading-none`).

| Qadam | 320px → 1440px | Qayerda |
|---|---|---|
| `text-landing-6` | 32 → 48px | Hero h1 (+ `text-balance wrap-break-word`) |
| `text-landing-5` | 29 → 40px | Mahsulot/yuridik sahifa h1 |
| `text-landing-4` | 26 → 33px | Har boʻlim sarlavhasi (h2) — hammasida bir xil; narx; CTA kartasi |
| `text-landing-3` | 23 → 28px | Katta raqamlar |
| `text-landing-2` | 20 → 23px | Katta karta sarlavhasi: mahsulot tabidagi savol, tarif nomi |
| `text-landing-1` | 18 → 19px | Mahsulot/yuridik sahifa ichidagi h2 |

Fakt kartalari sarlavhasiz: qalin boshlanish (`font-semibold text-foreground`) + `text-base` davomi.

Tarix: 2026-09-19 da avval 1.333 (Perfect Fourth) qurildi — hero 67px, h2 50px.
Landing mahsulotning oʻzini koʻrsatadigan zich tuzilishga oʻtgach (§7), sarlavha ikkinchi
darajaga tushdi va shkala Minor Third ga almashtirildi.

Oddiy matn shkaladan tashqarida qoladi: `text-base` (16px, qadam 0) va lid `text-lg`.
Hero urgʻu soʻzi — `Instrument_Serif` italic + `text-primary`.

Nega (2026-09-19): ilgari har blok oʻz kombinatsiyasini yozardi (`text-3xl sm:text-5xl`,
`text-3xl md:text-4xl font-semibold`, `text-6xl sm:text-7xl`…) — boʻlimlar bir-biridan
farq qilardi, hero esa 96px da 5 qatorga choʻzilardi. Yangi qadam kerak boʻlsa — shkalaga
qoʻshing, `text-*xl` ga qaytmang.

- Hero konteyneri: `max-w-7xl px-4 md:px-6 lg:px-8` (boshqa bloklar bilan bir xil chet
  boʻshligʻi), matn ustuni `max-w-6xl`. `container` ishlatmang — Tailwind v4 da unda padding yoʻq.
- Bo'lim yorlig'i: `<Badge variant="outline">` (mas. "Xususiyatlar", "Nega Ustozona?").
- Matn: `text-base`/`text-lg text-muted-foreground`.
- Apostrof: [[uzbek-apostrophe-convention]] — `ʻ`/`ʼ`, hech qachon ASCII `'`.

## 4. Shakl standartlari

- **Tugmalar — pill:** `rounded-full h-12` (CTA), ko'pincha aylanma ikona + hover animatsiya.
  (Mahsulotdagi `rounded-md` 36px tugmadan farqli — bu landing uslubi.)
- Kartalar/panellar: `rounded-2xl` (katta blok), `rounded-xl` (karta) — token fon (`bg-muted`/`bg-card`).
- Mahsulot skrinshoti ramkasi: `rounded-2xl border border-border bg-card p-1.5 shadow-2xl` + ichki `img rounded-xl`.

## 5. Real mahsulot rasmlari

`public/screens/*.png` — `scripts/capture-screens.mjs` orqali jonli dashboard'dan
olinadi (playwright-core + Chrome). Placeholder (Unsplash/shadcnspace/logoipsum)
**ishlatmang**. Detallar: memory `landing-page-architecture`.

## 6. Bloklar manbasi

shadcn-space registri (`npx shadcn add @shadcn-space/<block>`). Qo'shilgach **darhol
moslang**: inglizcha→o'zbekcha, soxta kontent→real funksiya, xom rang→token+glow,
placeholder→real skrinshot. Demo route (`src/app/<block>/page.tsx`) qo'shilsa — o'chiring.
`@shadcn-space` mavjud `ui/*` ni `--overwrite`siz clobber qilmaydi (skip qiladi) — `--overwrite` BERMANG.

## 7. Sahifa tuzilishi — vaʼda emas, mahsulotning oʻzi

2026-09-19 da landing qayta qurildi. Tamoyil: kirgan odam vaʼdani emas, mahsulotni koʻrsin.

1. **Hero — vazifa tanlash.** «Bugun darsda nima qilasiz?» paneli: 6 ta vazifa tugmasi,
   har biri oʻz boʻlim rangida va toʻgʻri joyga olib boradi (Doska — roʻyxatsiz).
   Ostida **ikki rol tugmasi**: «Oʻqituvchi · Roʻyxatdan oʻtish» va «Oʻquvchi · Kodni
   kiritish» (`/play`). Landingga aynan shu ikki odam keladi.
2. **«Ustozonada nima bor?» — mahsulot tablari** (`ProductTabs.tsx`). Tab = mahsulot,
   oʻz rangida. Tab ichida chapda katta karta (vizual namuna + ogʻriq savol shaklida +
   havola), oʻngda 4 ta fakt kartasi. Alohida mahsulot boʻlimlari oʻrniga — sahifa
   qisqa qoladi. Hamma panel HTML'da (`forceMount`), faqat faoli koʻrinadi.
   `#jurnal`, `#baholash`, `#taqdimot`, `#doska` langarlari mos tabni ochadi.
3. **Mahsulotlar oilasi** (`ProductsSection`) — tayyor va tez orada chiqadiganlari.
4. **Narxlar.**
5. **FAQ + yopishgan chaqiriq** — ikki ustun; katta ekranda CTA kartasi `sticky`.

**Fakt formulasi** (tablar va har qanday imkoniyat kartasi): bitta jumla, avval
**qalin — nima qiladi**, keyin tire va oʻqituvchiga nima berishi. Masalan:
«**Davomat — bir bosishda** — butun sinf kelgan boʻlsa, sana ustunini bir marta
bosasiz.» Fakt faqat ishlaydigan imkoniyatdan olinadi — yangi vaʼda karta matnida
paydo boʻlmaydi.

**Oʻquvchi yoʻli.** Header'da «Kodni kiritish» tugmasi telefonda ham koʻrinadi
(<640px da «Kod» deb qisqaradi, 360px dan torda yashiriladi — u yerda hero'dagi
tugma qoladi). Toʻliq menyu 1280px (`xl`) dan: 1024px da ruscha yozuvlar
(«Оценивание», «Зарегистрироваться») bilan header sigʻmasdi. Header konteyneri
boʻlimlar bilan bir xil — `max-w-7xl`. `/play` — JS'siz GET forma, kodni tozalab `/play/KOD` ga
yoʻnaltiradi; kod formatini tekshirmaydi (yagona manba —
`src/server/dal/assess/sessions.ts`).

Olib tashlangan: umumiy «Faktlar», «Nega Ustozona», «Qanday ishlaydi», «Kimlar uchun»
boʻlimlari va alohida Jurnal boʻlimi — mazmuni mahsulot tablariga tarqatildi.

Tarjima: yangi kalit boshqa tilda hali yoʻq boʻlsa, oʻzbekcha matn chiqadi
(`src/i18n/request.ts` — asosiy til ustiga yozish), xom kalit emas.
