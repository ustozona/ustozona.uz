---
name: ustozona-dizayn
description: >-
  Ustozona EMS dizayn tizimi bilan ishlash tartibi. Har qanday UI/frontend ishida
  ishlating — yangi sahifa yoki komponent qurish, mavjud ekranni qayta shakllantirish,
  referens rasm yoki kodni ilovaga koʻchirish, panel/karta/modal/toolbar tuzish,
  rang / tipografika / radius / masofa / animatsiya tanlash, Tailwind yoki shadcn
  komponentiga tegish. Foydalanuvchi «dizayn» soʻzini aytmasa ham, UI koʻrinadigan
  har oʻzgarishda shu skillni oching. Bu skill kod yozdirmaydi — u ishni toʻgʻri
  tartibda, mavjud tokenlarga tayangan holda olib borishni taʼminlaydi va
  kanonik hujjatlarга yoʻnaltiradi.
---

# Ustozona EMS — dizayn ishi tartibi

Bu loyihaning dizayn tili **yashovchi kontrakt**: shadcn/ui (`new-york`,
`neutral`) + Tailwind v4 CSS-tokenlar (OKLCH) ustida qurilgan, neytral-birinchi
tizim. Yangi naqsh oʻylab topish emas, **mavjud tizimga map qilish** asosiy ish.

## Har UI ishidan oldin — shu 3 faylni oʻqing

Tartib muhim: avval oʻqing, keyin yozing.

1. **[`DESIGN.md`](../../../DESIGN.md)** — siqilgan kontrakt (stek, ranglar,
   tipografika, radius shkalasi, panel 3-qatlami, motion budjeti, karta
   pasporti, oxirida oʻz-oʻzini tekshirish checklisti).
2. **[`docs/design-system.md`](../../../docs/design-system.md)** — batafsil
   qoʻllanma misollar bilan: rang jadvali, panel konvensiyalari, radiusni
   element turiga map qilish, interaksiya standarti, «Karta pasporti v2»,
   modal sarlavha/footer standartlari.
3. **Kod manbalari** — ish qaysi sohaga tegsa:
   - `src/app/globals.css` — barcha semantik ranglar va `.heading-*` / `.text-*`
     shkalasi shu yerda (`@theme inline`).
   - `src/styles/components.css` — 3-qatlam: komponent tokenlari
     (`surface-card-*`, `control-*`, `choice-*`). Yangi token faqat shu yerda,
     semantik nom bilan.
   - `src/components/ui/*` — primitivlar (`Panel`, `Button`, `Card`, `Dialog`…).
   - `src/lib/class-colors.ts` / `src/lib/score-colors.ts` /
     `TOPIC_COLOR_BASE` — qiymatga bogʻliq ranglar (sinf, baho, davomat, toifa).
   - Oʻxshash mavjud sahifa (masalan `students`, `lessons`, `timetable`) —
     naqshni undan koʻchiring.

## Referensni map qilish (rasm yoki kod berilganda)

Xom Tailwind bilan noldan yozmang. Referensning **har elementini** mavjud
token yoki komponentga bogʻlang:

| Referensda | Ilovada |
|---|---|
| «sarlavha», `text-xl font-semibold` | `.heading-page` / `.heading-section` / `CardTitle` |
| rang, `#hex`, `bg-blue-500` | token (`bg-primary`, `text-muted-foreground`) yoki `classTints` / `CLASS_COLOR_HEX` / `score-colors` helperlari |
| oʻlcham, `h-10`, `h-11` | 36px toolbar standarti (`h-9` / `size-9`) |
| quti / karta / panel | `<Panel>` + `<PanelHeader>`/`<PanelBody>`/`<PanelFooter>` (yoki `panelCard*Class`) |
| soya berilgan statik quti | panel = **border**, soya emas (border YOKI shadow, ikkisi emas) |
| radius, `rounded-lg`/`rounded-2xl` | element turiga qarab shkaladan (`DESIGN.md` §4) — tasodifiy emas |
| hover lift + scale | **bitta** hover-harakat (lift YOKI scale) |

Xom qiymatni faqat tizimda umuman yoʻq boʻlsa ishlating — u holda **avval**
`globals.css` yoki `components.css` + `docs/design-system.md` ga qoʻshing,
keyin foydalaning.

## Ish uslubi qoidalari

- **Umumiy komponentni toʻgʻridan-toʻgʻri global tahrirlang.** «Boshqa joyga
  taʼsir qilmasin» deb ixtiyoriy prop / indirection qoʻshmang — bir xil
  tushuncha hamma joyda bir xil koʻrinsin. Haqiqatan turli xatti-harakat
  kerak boʻlsagina prop qoʻshing.
- **Dark mode** — alohida kod bilan emas, faqat tokenlar orqali.
- **Motion** — mikro (hover/press) = Tailwind klass; makro (enter/exit/stagger)
  = `motion` kutubxonasi, `src/components/animations/` primitivlari
  (`<FadeIn>`, `<StaggerList>`). Raw `0.2s ease-out` yozmang — `duration-fast
  ease-standard` yoki `var(--transition-duration-*)`. Tugmaga `active:scale`
  qoʻshmang (`Button` da `whileTap` allaqachon bor).

## Matn: oʻzbekcha apostrof

Oʻzbekcha matn (UI satrlari, JSX, izoh, data) **dedicated Unicode harflari**
bilan yoziladi, ASCII `'` emas:

- **ʻ (U+02BB)** — `Oʻ` va `Gʻ` harflari uchun: `Boʻlimlar`, `Qoʻshish`,
  `oʻquvchi`, `toʻgʻri`.
- **ʼ (U+02BC)** — tutuq belgisi va chet soʻzga qoʻshimcha: `taʼsir`,
  `maʼlumot`, `storeʼdan`.

## Mahsulot nomlari

Raqobatchi yoki boshqa loyiha nomlari kod izohi, commit, PR, `docs/` — hech
qayerda yozilmaydi. Naqsh boshqa joydan olingan boʻlsa — **nomini emas,
naqshning mohiyatini** tasvirlang. Yagona istisno: ataylab raqobat tahliliga
bagʻishlangan hujjat.

## Tugatishdan oldin — checklist

`DESIGN.md` §8 dagi oʻz-oʻzini tekshirish roʻyxatidan oʻting:

- [ ] Har rang tokendan yoki helper'dan (xom hex yoʻq)
- [ ] Har sarlavha/matn `.heading-*` / `.text-*` klassidan (inline `text-[13px]` yoʻq)
- [ ] Radius element turiga mos (shkaladan, tasodifiy emas)
- [ ] Panel — border YOKI shadow, ikkisi emas; `card-elevation` panelга emas
- [ ] Har interaktiv element bitta hover-harakat
- [ ] Toolbar boshqaruvlari 36px (`h-9` / `size-9`)
- [ ] Yangi panel qoʻlda klass emas — `<Panel>` yoki `panelCard*Class`
- [ ] Dark mode token orqali ishlaydi (alohida kod yoʻq)
- [ ] Oʻzbekcha matnda ʻ / ʼ toʻgʻri

## Dizaynni oʻzgartirish (yangi token / qoida)

Dizayn kontraktini oʻzgartirish mumkin, lekin bu **ongli, alohida qaror**
boʻlishi kerak — koʻr-koʻrona emas. Oʻzgartirilganda:

1. Sababini `DESIGN.md` ga yozing.
2. Eski qoidaga tayangan joylarni topib mos yangilang (yoki «deviatsiya» deb
   hujjatlang).
3. `DESIGN.md` (qisqa kontrakt) va `docs/design-system.md` (batafsil) sinxron
   turishini taʼminlang.
