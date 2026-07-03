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

- Hero h1: `text-5xl md:text-7xl lg:text-8xl font-medium`; urg'u so'zi `Instrument_Serif` italic + `text-primary`.
- Bo'lim sarlavhasi (h2): `text-3xl md:text-5xl font-medium` (yoki feature: `md:text-4xl font-semibold`).
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
