# Dashboard bloklari — 323 ta blok, 28 kategoriya

Dashboard, statistika va admin panel uchun tayyor UI bloklarining toʻliq
asl toʻplami: KPI kartalar, grafiklar, jadvallar, filtrlar, monitoring,
sozlamalar, onboarding. Fayllar **asl holicha**, bir bayt ham
oʻzgartirilmagan. Umumiy qoidalar: [`../README.md`](../README.md).

| | |
|---|---|
| Manba | `github.com/tremorlabs/tremor-blocks` (`src/content/components/`, `src/components/`, `src/lib/`, `public/thumbnails/`) |
| Commit | `b319e8d3d3678a4f60f4802f7e85bc1abc52d598` (2025-01-22) — saytdagi soni bilan mos keladi |
| Litsenziya | MIT — [`LICENSE.md`](LICENSE.md) (asl matn) |
| Olingan | 2026-09-24 |
| Asl stek | React 18, Tailwind v3, recharts 2.15, Radix, `tailwind-variants`, `@remixicon/react` |

## Tarkib

```
dashboard-bloklari/
├── bloklar/<kategoriya>/   323 ta blok (.tsx) + asl index.ts — har biri mustaqil demo
├── components/             39 ta primitiv — bloklar @/components/* orqali import qiladi
├── lib/                    utils.ts (cx), chartUtils.ts, useOnWindowResize.ts, useToast.ts
├── rasmlar/                kategoriya eskizlari (.webp) — har blok skrinshoti emas
├── katalog/<kategoriya>.md har kategoriyaning katalogi (oʻzbekcha, shu toʻplam uchun yozilgan)
└── LICENSE.md
```

`bloklar/`, `components/`, `lib/` — asl kod, tahrirlanmaydi. `katalog/`
va shu README — bizning hujjat. Katalogdagi «Primitivlar» va «Toʻsiq»
ustunlari koddan avtomatik hisoblangan, «Koʻrinish» — qoʻlda yozilgan.

## Kategoriyalar

### Statistika — grafiklar va koʻrsatkichlar

| Kategoriya | Bloklar | Toʻsiqlar |
|---|---|---|
| [KPI kartalar](katalog/kpi-cards.md) | 29 | recharts 3 — 4 |
| [Area grafiklar](katalog/area-charts.md) | 16 | recharts 3 — 16 |
| [Bar grafiklar](katalog/bar-charts.md) | 12 | recharts 3 — 12, react-countup — 1 |
| [Chiziqli grafiklar](katalog/line-charts.md) | 12 | recharts 3 — 12, react-day-picker 10 — 1 |
| [Donut grafiklar](katalog/donut-charts.md) | 7 | recharts 3 — 6 |
| [Sparkline kartalar](katalog/spark-charts.md) | 6 | — |
| [Bar roʻyxatlar](katalog/bar-lists.md) | 7 | React 19 — 2, react-countup — 1 |
| [Grafik kompozitsiyalari](katalog/chart-compositions.md) | 15 | recharts 3 — 13, React 19 — 1 |
| [Grafik tooltipʼlari](katalog/chart-tooltips.md) | 21 | recharts 3 — 21 |

### Admin — jadvallar, filtrlar, boshqaruv

| Kategoriya | Bloklar | Toʻsiqlar |
|---|---|---|
| [Jadvallar](katalog/tables.md) | 11 | — |
| [Jadval amallari](katalog/table-actions.md) | 11 | tanstack — 11 |
| [Jadval sahifalash](katalog/table-pagination.md) | 8 | tanstack — 8 |
| [Filtr panellari](katalog/filterbar.md) | 16 | react-day-picker 10 — 3 |
| [Holat monitoringi](katalog/status-monitoring.md) | 10 | — |
| [Grid roʻyxatlar](katalog/grid-lists.md) | 15 | — |
| [Hisob va sarf](katalog/billing-usage.md) | 10 | — |
| [Hisob va foydalanuvchilar](katalog/account-and-user-management.md) | 15 | — |

### Umumiy — sahifa boʻlaklari

| Kategoriya | Bloklar | Toʻsiqlar |
|---|---|---|
| [Nishonlar (badge)](katalog/badges.md) | 13 | — |
| [Sahifa karkaslari](katalog/page-shells.md) | 6 | — |
| [Boʻsh holatlar](katalog/empty-states.md) | 10 | recharts 3 — 1 |
| [Dialoglar](katalog/dialogs.md) | 9 | — |
| [Onboarding va lenta](katalog/onboarding-feed.md) | 16 | — |
| [Fayl yuklash](katalog/file-upload.md) | 7 | — |
| [Forma maketlari](katalog/form-layouts.md) | 6 | — |
| [Bannerlar](katalog/banners.md) | 5 | — |

### Marketing — landing

| Kategoriya | Bloklar | Toʻsiqlar |
|---|---|---|
| [Kirish sahifalari](katalog/logins.md) | 10 | — |
| [Tarif boʻlimlari](katalog/pricing-sections.md) | 8 | — |
| [Funksiya boʻlimlari](katalog/feature-sections.md) | 12 | recharts 3 — 1, cobe — 2 |

«—» — ikon va `tailwind-variants` almashtirilgach loyiha paketlari bilan
tip xatosiz (pastda «Loyiha bilan moslik»).

## Ustozona uchun: qayerda nima

Gʻoya va boshlangʻich nuqta — qaror emas. Har blok olinishidan oldin
dizayn tizimiga map qilinadi (pastdagi tartib).

### Statistika sahifasi (`dashboard/statistics`)

| Mavjud komponent | Mos bloklar | Nima beradi |
|---|---|---|
| `OverviewPanel` / `StatCard` | [KPI](katalog/kpi-cards.md) 01–08, 15; [kompozitsiya](katalog/chart-compositions.md) 04, 06, 13 | KPI kartasi = tab: bosilsa ostidagi grafik shu metrikaga almashadi |
| `AttendanceTrendCard` | [area](katalog/area-charts.md) 06, 07; [line](katalog/line-charts.md) 04; [KPI](katalog/kpi-cards.md) 17–19 | Joriy vs oʻtgan davr; hoverʼda oy qiymati va oʻzgarish tepada chiqadi |
| `DistributionCard` | [KPI](katalog/kpi-cards.md) 21, 25; [bar](katalog/bar-charts.md) 12; [tooltip](katalog/chart-tooltips.md) 04, 05 | Baho taqsimoti CategoryBarʼda; foizli stacked bar; holat % tooltipʼi |
| `CompletionDonutChart`, `GenderDonutChart` | [donut](katalog/donut-charts.md) 06, 07, 02 | Donut + legenda roʻyxati (soni, ulush); ichma-ich halqalar |
| `TopicStudentMatrixCard` | [jadval](katalog/tables.md) 11 | Kohort issiqlik xaritasi — mavzu × oʻquvchi matritsasi uchun tayyor naqsh |
| `StudentRiskCard`, `AbsenceTierList` | [KPI](katalog/kpi-cards.md) 10, 11, 29; [bar-list](katalog/bar-lists.md) 01, 02 | Xavf darajasi nishoni / «signal» indikatori; top-N + qidiruvli toʻliq roʻyxat |
| `ClassesTable`, `StudentsTable` | [jadval](katalog/tables.md) 05, 09; [amallar](katalog/table-actions.md) 01–03 | Qatorda progress halqa yoki trend; saralanadigan sarlavhalar |
| `PeriodSelect` | [filtr](katalog/filterbar.md) 04, 05, 10 | Segmentli davr tugmalari (Tooltipʼda sana) yoki preset dropdown |
| `StatEmpty` | [boʻsh holat](katalog/empty-states.md) 06, 08 | Legenda saqlanadi, grafik oʻrnida xira fon + izoh |

### Admin dashboard (`admin`)

| Boʻlim | Mos bloklar | Nima beradi |
|---|---|---|
| Bosh sahifa (`FunnelStats`, `SignupsChart`) | [kompozitsiya](katalog/chart-compositions.md) 04, 13; [bar](katalog/bar-charts.md) 10; [line](katalog/line-charts.md) 11 | KPI-tab → grafik; sinxron mini-grafiklar; metrika kartalari toʻri |
| `ai` — kvota va sarf | [line](katalog/line-charts.md) 05; [hisob](katalog/billing-usage.md) 05, 07; [KPI](katalog/kpi-cards.md) 15 | Kumulyativ sarf + limit chizigʻi; sarf taqsimoti; chegara + Switch |
| `users`, `schools` | [foydalanuvchilar](katalog/account-and-user-management.md) 08, 13, 14; [amallar](katalog/table-actions.md) 06, 10; [sahifalash](katalog/table-pagination.md) 05 | Taklif + qidiruv + rol filtri; tanlab bulk-amal; raqamli sahifalash |
| `audit` | [foydalanuvchilar](katalog/account-and-user-management.md) 15; [onboarding](katalog/onboarding-feed.md) 05 | Accordion audit boʻlimlari; faoliyat timelineʼi |
| `feedback` | [grid](katalog/grid-lists.md) 13, 14; [badge](katalog/badges.md) 05, 06 | Holat tablari (soni bilan); holat + filtr chiplari |
| Tizim holati (bot, cron, AI) | [monitoring](katalog/status-monitoring.md) 06, 08 | Xizmatlar roʻyxati: uptime % va kunlik holat chizigʻi |
| Filtrlar | [filtr](katalog/filterbar.md) 11–16 | Sana oraligʻi + shart Popoverʼi; ustun filtri (matn / son / checkbox) |

## Loyiha bilan moslik — tekshirilgan

2026-09-24 da butun toʻplam loyihaning **haqiqiy paketlari** bilan (React
19, recharts 3.8, react-day-picker 10, date-fns 4, react-dropzone 17,
`radix-ui`) vaqtincha tip-tekshiruvdan oʻtkazildi. Loyihada yoʻq paketlar
asl versiyasida faqat vaqtinchalik papkaga oʻrnatildi, loyihaning
`package.json` iga tegilmadi.

Natija: **323 blokda jami 56 ta tip xatosi**, hammasi 4 ta sababdan
(pastda «Toʻsiq belgilari»). 53 tasi umumiy primitivlarda yoki bloklar
fayl ichiga koʻchirib olgan grafik nusxalarida; bloklarning oʻz
kodida — atigi 3 ta (React 19 ref turi).

⚠️ Bu **faqat tip** tekshiruvi. Grafiklarning recharts 3 dagi runtime
xatti-harakati (hover, animatsiya, legend slider) sinalmagan — grafikli
blok olinganda brauzerda tekshirilsin.

### Loyihada yoʻq paketlar

| Paket | Qayerda | Tavsiya |
|---|---|---|
| `@remixicon/react` | 203 blok + 13 primitiv | `lucide-react` ga almashtirish (pastdagi jadval) |
| `tailwind-variants` | 9 primitiv: Badge, Button, Callout, DatePicker, Input, ProgressBar, ProgressCircle, SelectNative, Switch | `class-variance-authority` (bor) yoki loyihaning `ui/*` primitivi |
| `@tanstack/react-table` | 19 blok: jadval amallari, sahifalash | Kerak boʻlsa oʻrnatiladi (bu alohida qaror) yoki oddiy `useMemo` saralash / sahifalash |
| `react-countup` | bar-chart 07, bar-list 07 | Loyihada `ui/number-ticker` bor |
| `cobe` | feature-section 06, 07 | Faqat landing globusi uchun |
| `@react-aria/datepicker`, `@react-stately/datepicker`, `@internationalized/date` | `DatePicker` primitivi (vaqt kiritish) | Loyihaning `ui/calendar` + `ui/popover` ustiga qayta quriladi |

### Toʻsiq belgilari

Katalogdagi «Toʻsiq» ustuni shu belgilardan biri. «—» — ikon va
`tailwind-variants` almashtirilgach toza.

| Belgi | Sabab | Tuzatish |
|---|---|---|
| `recharts 3` | Asl kod recharts 2 ga yozilgan: tooltip `label` turi endi `string \| number \| undefined` (AreaChart, BarChart, LineChart, ComboChart — 4 tadan xato; DonutChart — 1). area-chart 16, bar-chart 10/11, line-chart 04/05/12 grafikni **fayl ichida** moslab olgan — xato oʻsha yerda | `String(label ?? "")` yoki loyihaning `ui/chart` |
| `react-day-picker 10` | `Calendar` v8 APIʼga yozilgan (`useDayRender`, `useNavigation`, `DayPickerRangeProps`) — v10 da yoʻq; `DatePicker` shunga tayanadi | Loyihaning `ui/calendar` (v10) ustiga qayta qurish |
| `React 19` | `useRef<HTMLDivElement>(null)` endi `RefObject<… \| null>` (bar-list 02/03, chart-composition 07); `TabNavigation` da `props` — `unknown` | Bitta satrlik tur tuzatishi |
| `tanstack`, `react-countup`, `cobe`, `react-aria` | Paket loyihada yoʻq | Yuqoridagi jadval |

## Ilovaga olish tartibi

1. **Avval mavjudini tekshiring.** `src/components/ui/*` va
   `StatCard`, `statistics/_components/*` — koʻp naqsh allaqachon bor.
   Mavjud umumiy komponentni **kengaytiring**, nusxa koʻpaytirmang
   (`ustozona-dizayn` skill, «Ish uslubi»).
2. **Blokni `src/` ga koʻchiring**, arxivdan import qilmang.
3. **Map qiling** — pastdagi jadvallar boʻyicha: primitivlar, rang,
   tipografika, ikonlar, Tailwind v4.
4. **Demo qoldiqlarini olib tashlang** (pastdagi roʻyxat).
5. Katta boʻlak (ayniqsa grafik primitivi) koʻchgan boʻlsa — litsenziya
   izohi ([`../README.md`](../README.md), 4-qoida).
6. `npx tsc --noEmit` va `npm run check:tokens` (dizayn-token darvozasi
   `prebuild` da ham ishlaydi).
7. Pastdagi «Ishlatilgan joylar» jadvaliga qator qoʻshing.

### Primitivlar → Ustozona

| Arxivda (`components/`) | Ustozonaʼda (`src/components/ui/`) | Izoh |
|---|---|---|
| `Card` | `panel` (`<Panel>`) yoki `StatCard` | Asl Cardʼda border **va** soya bor — DESIGN.md: panel = border YOKI soya |
| `AreaChart`, `BarChart`, `LineChart`, `ComboChart`, `DonutChart` | `chart` (recharts 3) | `tooltipCallback` (hoverʼda tepadagi raqamni almashtirish) — `Tooltip` `content` orqali |
| `SparkChart` | `sparkline` | `StatCard` ning `sparkline` propi |
| `ProgressBar` / `ProgressCircle` | `progress` / `progress-ring` | |
| `BarList`, `CategoryBar`, `Tracker` | — (yoʻq) | Kerak boʻlsa yangi `ui/` primitiv; oddiy holatda `flex` + `progress` yetadi |
| `Button` | `button` | Asl `variant="light"`, `position` — loyihada yoʻq |
| `Badge`, `Callout` | `badge`, `alert` / `inline-banner` | |
| `Table` (`TableRoot`, `TableHead`, `TableFoot` …) | `table` | |
| `Tabs`, `TabNavigation` | `tabs`, `segmented-toggle`, `toggle-pill`, `navigation-menu` | Asl `TabsList variant="solid"` ≈ `segmented-toggle` |
| `Select`, `SelectNative` | `select` | |
| `Input`, `Textarea`, `Label`, `Checkbox`, `Switch`, `Slider` | shu nomli `ui/*` | |
| `RadioGroup`, `RadioCardGroup` | `radio-group` | Karta uslubidagi variant loyihada yoʻq |
| `Dialog`, `Drawer`, `Popover`, `DropdownMenu`, `Tooltip`, `Accordion` | shu nomli `ui/*` (`drawer`, `sheet`) | Asl animatsiya klasslari (`animate-slideDownAndFade` …) asl Tailwind configʼdagi keyframeʼlarga tayanadi — loyihada `tw-animate-css` |
| `Calendar`, `DatePicker` | `calendar` + `popover`, `date-key-picker` | react-day-picker 10 |
| `Divider` | `separator` | |
| `Toast`, `Toaster`, `useToast` | `sonner` | |
| `lib/utils` → `cx`, `focusInput`, `focusRing` | `cn` (`@/lib/utils`), loyiha fokus tokenlari | Yangi `text-*` rol boʻlsa — `TEXT_ROLES` (DESIGN.md §3) |
| `lib/chartUtils` rang xaritasi | `--chart-1…5` tokenlari | |
| Boʻsh holat bloklari | `empty` | |

`@radix-ui/react-*` importlari → `radix-ui` monopaketi:
`import { Slot } from "radix-ui"` → `<Slot.Root>` (`ui/button` kabi).

### Rang → token

| Arxivda | Token |
|---|---|
| `text-gray-900 dark:text-gray-50` | `text-foreground` |
| `text-gray-500`, `text-gray-600` | `text-muted-foreground` |
| `bg-white dark:bg-[#090E1A]`, `dark:bg-gray-950` | `bg-card` / `bg-background` |
| `border-gray-200 dark:border-gray-800/900` | `border-border` (`StatCard`: `border-border/60`) |
| `emerald-*` (ijobiy) | `text-success`, nishon: `bg-success/10 text-success` |
| `red-*` (salbiy, xato) | `text-destructive`, `bg-destructive/10` |
| `yellow-*`, `orange-*`, `amber-*` (ogohlantirish) | `text-warning`, `bg-warning/10` |
| `blue-500` (havola, asosiy seriya) | `text-primary` |
| `blue`, `violet`, `fuchsia`, `indigo`, `cyan`, `sky` (seriya ranglari) | `--chart-*`; sinf rangi boʻlsa `classTints` / `CLASS_COLOR_HEX` |
| `bg-gray-100/60 hover:bg-gray-100` | `bg-muted/60` — lekin **hoverʼda fon oʻzgarmaydi**: sahifa foni naqshli, sabab `StatCard` izohida |

`dark:` klasslari map qilingandan keyin yoʻqoladi — dark mode faqat
tokenlar orqali.

### Tipografika

| Arxivda | Ustozonaʼda |
|---|---|
| `text-3xl font-semibold` (asosiy raqam) | `StatCard` qiymat uslubi — oʻzboshimcha `text-[Npx]` qoʻshmang (token darvozasi) |
| `text-lg font-semibold` (karta / boʻlim sarlavhasi) | `text-title` |
| `text-xl`/`text-2xl` (sahifa sarlavhasi) | `text-headline` |
| `text-sm` (asosiy matn, nom) | `text-body`, rangi alohida |
| `text-xs` (nishon, chip) | `text-tag` |
| `text-xs text-gray-500` (izoh, vaqt) | `text-caption text-muted-foreground` |

Raqamlar uchun `tabular-nums`. Sonlar `Intl.NumberFormat('en-US')` emas —
oʻzbekcha format: `src/lib/format-count.ts`.

### Ikonlar → lucide

Toʻplamda 148 xil ikon. Eng koʻp uchraydiganlari:

| `@remixicon/react` | `lucide-react` |
|---|---|
| `RiArrowDownSLine` / `RiArrowUpSLine` / `RiArrowLeftSLine` / `RiArrowRightSLine` | `ChevronDown` / `ChevronUp` / `ChevronLeft` / `ChevronRight` |
| `RiArrowUpSFill` / `RiArrowDownSFill` | `ArrowUp` / `ArrowDown` (`StatCard` kabi) |
| `RiArrowUpLine` / `RiArrowDownLine` / `RiArrowRightUpLine` | `ArrowUp` / `ArrowDown` / `ArrowUpRight` |
| `RiCheckLine`, `RiCheckboxCircleFill` | `Check`, `CircleCheck` |
| `RiCloseLine`, `RiCloseFill`, `RiCloseCircleLine` | `X`, `CircleX` |
| `RiErrorWarningLine` / `Fill`, `RiInformationLine` | `CircleAlert`, `Info` |
| `RiExternalLinkLine` | `ExternalLink` |
| `RiAddLine`, `RiAddFill` | `Plus` |
| `RiDeleteBin7Line`, `RiDeleteBinLine` | `Trash2` |
| `RiSearchLine`, `RiFilter2Line`, `RiEqualizer2Line` | `Search`, `Filter`, `SlidersHorizontal` |
| `RiBarChartFill`, `RiDonutChartFill` | `ChartColumn`, `ChartPie` |
| `RiDatabase2Line`, `RiStackLine`, `RiFileLine` | `Database`, `Layers`, `File` |
| `RiCalendar2Line`, `RiTimeLine` | `Calendar`, `Clock` |
| `RiUserLine`, `RiUpload2Line`, `RiEyeLine` | `User`, `Upload`, `Eye` |
| `RiGoogleFill`, `RiGithubFill`, `RiYoutubeFill` | brend ikonlari lucideʼda yoʻq — loyihadagi mavjud auth ikonlari |

### Tailwind v3 → v4

Arxiv v3 da yozilgan, loyihada v4.2. Nomi oʻzgargan klasslar:

| v3 (arxivda) | v4 |
|---|---|
| `shadow-sm` / `shadow` | `shadow-xs` / `shadow-sm` |
| `rounded-sm` / `rounded` | `rounded-xs` / `rounded-sm` |
| `ring` | `ring-3` |
| `outline-none` | `outline-hidden` |
| `!p-0` (boshida `!`) | `p-0!` |
| `space-x-*`, `space-y-*` | v4 da selektor oʻzgargan — `gap-*` afzal |

Radius baribir DESIGN.md §4 shkalasidan olinadi — bu jadval asl
koʻrinishni solishtirish uchun.

## Umumiy naqshlar va demo qoldiqlari

Olinganda olib tashlanadi yoki qayta yoziladi:

- `<div className="obfuscate">` oʻrami — asl demo-saytning klassi.
- `//array-start` / `//array-end` izohlari — asl sayt kod generatori belgilari.
- `tremor-id="tremor-raw"` atributi — 38 ta primitivda, asl sayt belgisi.
- **Ikki marta chizilgan grafik** (grafikli bloklarning aksariyati): biri
  `hidden sm:block` (Y-oʻqli), biri `sm:hidden` (Y-oʻqsiz, `startEndOnly`).
  Bu responsiv naqsh — bitta grafik + `useMediaQuery` bilan ham boʻladi.
- «Show Demo» tugmasi (tooltip va dialoglar) va yopilgach 1 soniyadan keyin
  qayta ochiladigan bannerlar (`// just for demo purposes`) — faqat demo.
- Inglizcha matn, `Lorem ipsum`, demo ism va kompaniyalar, `$` summalar.
- `href="#"` havolalar — Next `<Link>` va haqiqiy yoʻl.
- `<a className="focus:outline-none">` + `<span className="absolute inset-0">`
  — havolani butun kartaga yoyadi, lekin klaviatura fokusini koʻrinmas
  qiladi. Loyihada fokus halqasi saqlanadi (`focus-visible:outline-*`).
- `images.unsplash.com` rasmlari (badge 09/10, grid-list 12, onboarding 08)
  — tashqi rasm, olinmaydi.
- Inline `style={{ animation: 'revealBottom …' }}` (onboarding 10–12,
  login 10, billing 08) — keyframe asl Tailwind configʼda, loyihada yoʻq;
  `src/components/animations/` primitivlariga almashtiriladi.
- Dinamik klass nomlari (`` `dark:${COLOR}` ``, KPI 29) — Tailwind skaner
  topa olmaydi; toʻliq klass satrlari bilan yozing.

## Ishlatilgan joylar

| Blok | Qayerda | Sana | Izoh |
|---|---|---|---|
| kpi-cards 06 | `src/components/StatCard.tsx` | arxivdan oldin | Naqsh asosida, tokenlarga moslangan |

## Yangilash

Asl toʻplam yangilansa — yangi commit bilan solishtirib, `bloklar/`,
`components/`, `lib/`, `rasmlar/` va `LICENSE.md` ni **butunlay**
almashtiring (qoʻlda tahrir qilmang):

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/tremorlabs/tremor-blocks.git /tmp/bloklar-manba
```

```bash
git -C /tmp/bloklar-manba sparse-checkout set src/content/components src/components src/lib public/thumbnails
```

Keyin:

1. Yuqoridagi «Commit» qatorini yangilang.
2. `rasmlar/` da ikki fayl nomi papkaga moslab oʻzgartirilgan:
   `user-management.webp` → `account-and-user-management.webp`,
   `table-action.webp` → `table-actions.webp`.
3. Yangi yoki oʻzgargan bloklar uchun `katalog/` ni yangilang, «Loyiha bilan
   moslik» boʻlimini qayta tekshiring.
