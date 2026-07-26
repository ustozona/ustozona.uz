# Dizayn tizimi (shadcn asosida)

Ustozona EMS dizayn tizimi. shadcn/ui (`new-york`, `neutral`) + Tailwind v4
(CSS-variables) asosida. **Yagona manba — `src/app/globals.css`.** Hech qaerda
xom rang yoki ixtiyoriy oʻlcham ishlatmang; quyidagi tokenlardan foydalaning.

---

## 1. Ranglar (tokenlar)

Barcha ranglar OKLCH'da `:root` (light) va `.dark` da aniqlangan, `@theme inline`
orqali Tailwind utilitilariga bogʻlangan. Dark mode avtomatik.

| Token | Utility | Ishlatish |
|---|---|---|
| `--background` / `--foreground` | `bg-background` / `text-foreground` | Sahifa foni / asosiy matn |
| `--card` / `--card-foreground` | `bg-card` | Panel va kartalar |
| `--muted` / `--muted-foreground` | `bg-muted` / `text-muted-foreground` | Ikki darajali matn, fonlar |
| `--primary` / `--primary-foreground` | `bg-primary` | Asosiy CTA tugmalar |
| `--secondary`, `--accent` | `bg-secondary`, `bg-accent` | Ikkilamchi yuzalar |
| `--border` / `--input` / `--ring` | `border-border` | Chegaralar, inputlar, fokus |
| `--destructive` | `text-destructive` | Oʻchirish / xato |
| `--success` / `--warning` / `--info` | `text-success`, `bg-warning/10`, `text-info` | Semantik holatlar |

**Qiymatga bogʻliq ranglar** (baho/davomat/progress) — Tailwind palette (maʼno
bildiradi, tema tokeni emas), lekin **yagona manba: `src/lib/score-colors.ts`**
(`gradeBadgeClass`, `attendanceBadgeClass`, `scoreBarColor`). Har sahifada qoʻlda
takrorlamang — shu helperlardan import qiling.

**Topic (baholash turi) ranglari** — sinf ranglari bilan **bitta engine**.
Yagona manba `TOPIC_COLOR_BASE` (`@/lib/grades-data`, OKLCH `-400`, v3.shadcn.com/colors).
Hex (`TOPIC_COLOR_HEX`) va ottenkalar (`topicTints`) `class-colors.ts`'ning
`oklchToHex`/`makeColorTints` orqali HOSIL qilinadi — qotirilgan Tailwind klasslar
yoʻq, dark mode avtomatik. helpers `topicHex` — `TOPIC_COLOR_HEX` ustidagi deprecated
re-export.

### Sinf ranglari
`src/lib/class-colors.ts` — yagona manba (`CLASS_COLOR_BASE`, OKLCH). Qiymatlar
rasmiy Tailwind/shadcn palitrasining **`-400`** darajasi (v3.shadcn.com/colors).
Hosilalar:
- `CLASS_COLOR_HEX[color]` — solid hex (ikona, avatar, progress).
- `classTints(color)` — tayyor inline-style (surface, tint, badge, text, ring, ...).
- `color-mix(in srgb, ${hex} N%, transparent)` — shaffof ottenka.

---

## 2. Tipografika shkalasi

Utility klasslar (`globals.css`) — inline uchun; React analoglar
(`@/components/ui/typography`, `CardTitle`) — semantik JSX uchun. Ikkalasi mos.

| Klass | React | Oʻlcham / vazn | Ishlatish |
|---|---|---|---|
| `.heading-page` | `TypographyH1` | 24px / 700 | Sahifa sarlavhasi |
| `.heading-section` | `CardTitle` | 18px / 600 | Panel / boʻlim sarlavhasi |
| `.heading-small` | — | 15px / 600 | Karta ichidagi ism, kichik sarlavha |
| `.text-body` | `TypographyP` | 14px / 400 | Asosiy matn (`body` ham 14px) |
| `.text-caption` | `TypographyMuted` | 12px / 400 muted | Izoh, ikkilamchi maʼlumot |
| `.text-label` | `TypographyLabel` | 11px / 500 UPPERCASE | Boʻlim yorliqlari (Sinf, Aloqa) |

Rang har doim tokendan (`--foreground` / `--muted-foreground`).

---

## 3. Oʻlcham standartlari

**Toolbar / boshqaruv elementlari = 36px** (shadcn `h-9` / `size-9`). Yagona qoida:
toolbar tugmalari va inputlari bir qatorda 36px balandlikda boʻladi.

| Element | Oʻlcham | shadcn |
|---|---|---|
| Toolbar ikona tugmasi | `size-9` (36px), ichida `size-4` (16px) ikona | `Button size="icon"` |
| Toolbar matnli tugma (Sort, CTA) | `h-9` (36px) | `Button` default |
| Kichik tugma | `h-8` (32px) | `Button size="sm"` |
| `SectionIcon` (panel ikonasi) | `size-9` quti, 18px svg | `SectionIcon` default |
| Avatar (roʻyxat) | `size-14` (56px) | — |
| Avatar (preview) | `size-28` (112px) | — |

> Uslub (boxed: border + `card-elevation` vs ghost) kontekstga qarab tanlanadi —
> lekin **oʻlcham** hamma joyda yuqoridagidek. (Students = boxed, Lessons = ghost.)

---

## 4. Panel konvensiyalari — Ustozona panel tili v1

**Yuza modeli (3 qatlam, har birining oʻz tili — aralashtirilmaydi):**

| Qatlam | Til |
|---|---|
| Sahifa foni | `bg-background`, tekis |
| **Panel** (statik kontent qutisi) | `bg-card` + **1px `border border-border`** + `rounded-xl` + **soya YOʻQ** |
| Koʻtarilgan qatlam (vaqtinchalik/interaktiv: modal, dropdown, drag, hover-lift) | border + `.card-elevation` (yumshoq soya) |

`.card-elevation` panel darajasida ISHLATILMAYDI — u faqat yuqoridagi
"koʻtarilgan qatlam" uchun qoladi. Sabab: dark mode'da soya deyarli
koʻrinmaydi, zich yonma-yon panellarda soyalar bir-biriga tushib "iflos"
oraliq hosil qiladi, va statik qutiga soya berish notoʻgʻri semantik signal
(interaktivlik/vaqtinchalik) beradi. Border + shadow bir vaqtda ishlatilmaydi
— ikkisidan bittasi tanlanadi (bu holatda border).

Amalga oshirish: `<Panel>`/`<PanelHeader>`/`<PanelBody>`/`<PanelFooter>`
(`src/components/ui/panel.tsx`) — yangi kod shu komponentdan foydalanadi.
Mavjud `Card`-asosli sahifalar `panelCardClass`/`panelCardHeaderClass`/
`panelCardContentClass`/`panelCardFooterClass` orqali bir xil natijaga keladi
(`src/components/DashboardPage.tsx`) — bu konstantalar allaqachon border+
shadow-none/px-5/py-4/min-h-16 qotirilgan holda.

- Panel/karta: `bg-card rounded-xl border border-border` (soya emas, chegara).
- Panel headeri: `border-b border-border px-5 py-4`, `min-h-16` (68px).
  Ichida: `SectionIcon` + `CardTitle` + (ixtiyoriy) `TypographyMuted` sanoq.
- Panel footeri: `border-t border-border bg-muted/20 px-5 py-4` — modal
  footeri bilan bir xil (7-boʻlim).
- **Header ajratuvchi chizigʻi — qoida, tasodifiy tanlanmaydi.** Default:
  header `border-b` saqlaydi. **Istisno** (`border-b-0` / `<PanelHeader
  divider={false}>`): kontent header ostida bevosita davom etganda va oʻzi
  tabiiy chegara hosil qilganda — masalan taqvim tarmogʻi (`TodayRail`,
  "Bugungi darslar") yoki jadval grid chizigʻi (`timetable/page.tsx`,
  "Dars jadvali" paneli). Bunda header'ning oʻz chizigʻi ikkinchi, ortiqcha
  ajratuvchi boʻlib koʻrinadi. Roʻyxat/scroll kontent (fade bilan tugaydigan)
  panellarida esa border-b HAR DOIM qoladi — bu istisno faqat "kontent
  oʻzi grid/tarmoq chizigʻi bilan boshlanadi" holatiga tegishli.
- **Gorizontal gutter — bitta qiymat: `px-5` (20px)** — header, ichki kontent
  (`inset` rejim), footer, roʻyxat boʻshligʻi hammasida bir xil.
- Radius — bitta qiymat: `rounded-xl` (14px) barcha panel/karta/modalga.
  `rounded-2xl` faqat hero/banner blokka (masalan `HomeHero`), panelga emas.
- **Header toolbar tugmalari** — yagona uslub: ikkilamchi amallar `variant="outline"`
  **`shadow-none`** (tekis, faqat chegara, 36px), asosiy CTA `variant="default"` (solid).
  Soya QOʻSHMANG (shadcn outline'ning `shadow-xs`ini `shadow-none` bilan oʻchiring).
  Ghost faqat kompakt/ikkilamchi joyda. Hammasi bir xil: students/classes/timetable.
- Roʻyxat: `ScrollArea` + pastda `bg-gradient-to-t from-card` fade.
- Roʻyxat ichki boʻshliq: `px-5 pt-5 pb-5` — yon tomonlar bilan yuqori va pastki masofa teng (`px = pt = pb = 20px`). `pt-1` yoki `pt-2` ishlatmang.
- **Koʻp-ustunli layout (kanonik) — `DashboardColumns` (`components/DashboardPage.tsx`).**
  CSS Grid asosida: `<DashboardColumns template="minmax(0,2fr) minmax(0,3fr) …">`.
  `min-w-0` grid track (`minmax(0,1fr)`) orqali avtomatik — **inline `flexGrow/flexBasis`
  ishlatmang**. Dinamik nisbat (sinf/oʻquvchi tanlanganda) `template` string'ida hisoblanadi.
  `< lg` da bitta ustun (`grid-cols-1`); ustunni yashirish `<DashboardColumn hideBelow="lg|xl">`.
  Faqat `xl+` da chiqadigan ustun boʻlsa `xlTemplate` bering (track soni oshadi).
  Breakpoint siyosati: chap "Sinflar" paneli = `lg`, oʻng detal/preview paneli = `xl`
  (students preview `lg` da — ustunlar bilan birga chiqadi, hujjatlangan istisno).

### Brend CTA tugmasi (`variant="brand"` / `BrandCtaButton`)

Marketing/konversiya nuqtalari uchun maxsus sariq tugma — oddiy ish amallarida
ISHLATMANG (ular qora `default` boʻlib qoladi). Qoʻllash joylari: upgrade/pricing
modal CTA, landing hero, Pro-banner kabi kamdan-kam, eʼtibor talab qiluvchi harakatlar.

- **`Button variant="brand"`** (`components/ui/button.tsx`) — `rounded-full`, fon
  brend sarigʻi `#FBC02D`, matn `#3B2F0B`, ostida 3px toʻq sariq asos
  (`shadow-[0_3px_0_0_#C08D1B]`); bosilganda tugma 3px pastga tushib asosga
  "oʻtiradi" (`active:translate-y-[3px] active:shadow-none`). Ranglar ataylab
  hardcoded — brend rangi mavzudan qatʼi nazar oʻzgarmaydi.
- **`BrandCtaButton`** (`components/brand-cta-button.tsx`) — shu variant ustiga
  qurilgan tayyor CTA: `h-12` pill, oʻngda oq aylana ichida `ArrowUpRight`,
  hoverda strelka chapga suzib 45° buriladi. `href` bersangiz `<a>` sifatida
  render boʻladi.

---

## 5. Radius, soya, animatsiya

### Radius shkalasi
`--radius: 0.625rem` (10px) → `rounded-sm/md/lg/xl/2xl/3xl/4xl` (koʻpaytma orqali
hosila): sm 6 · md 8 · lg 10 · xl 14 · 2xl 18 · 3xl 22 · 4xl 26 px.

### Radiusni element turiga MAP qilish (standart — tasodifiy tanlamang)

| Element turi | Radius | px |
|---|---|---|
| Aylana: avatar, nuqta, status pill, badge, dumaloq icon-tugma | `rounded-full` | — |
| Input, textarea, kichik chip/tag | `rounded-md` | 8 |
| Tugma (shadcn standart — variant default) | `rounded-md` | 8 |
| Kichik ikona qutisi (`SectionIcon`) | `rounded-lg` | 10 |
| Karta, panel, modal, sinf/oʻquvchi kartasi | `rounded-xl` | 14 |
| Katta hero / banner bloklar | `rounded-2xl` | 18 |

### Ikki qoida
1. **Proporsional**: radius element oʻlchamiga mos — katta element = katta radius.
2. **Konsentrik (card ichida card)**: ichki rounded element tashqi qutiga
   **padding** bilan yopishganda, burchaklar parallel "oqishi" uchun:

   ```
   r_tashqi = r_ichki + padding      (⇔  r_ichki = r_tashqi − padding)
   ```

   Mas. ichki karta `rounded-lg` (20px) + `p-2` (8px) → tashqi `28px`
   (`outer = 20 + 8`). Notoʻgʻri: tashqi = ichki (ikki radius bir xil boʻlsa,
   burchaklar bir-biriga "yopishadi", siqilgan koʻrinadi).

   **Qachon qoʻllanadi:** ichki element tashqi BURCHAKKA yaqin (kichik padding
   bilan) joylashganda — modal ichidagi panel, karta ichidagi rasm/header,
   track ichidagi toggle-pill, avatar ring. Agar ichki element burchakdan uzoq
   (katta padding, yoki ustida header) boʻlsa — burchaklarni boʻlishmaydi,
   ikkalasi mustaqil radius olishi mumkin.
- Elevation: `.card-elevation` (ikki qatlamli yumshoq soya, dark mode mos) —
  FAQAT koʻtarilgan qatlam uchun (modal, dropdown, drag, hover-lift), panel
  darajasida emas (4-boʻlimga qarang).
- Interaktiv: `.card-interactive` (hover scale+shadow), `.animate-fade-slide-up`,
  `.animate-fade-in`. (`.animate-spring-bounce` — list-card uchun ishlatilmaydi.)

### Motion tokenlar (globals.css `@theme`)

| Token | Qiymat | Utility | Qayerda |
|---|---|---|---|
| `--transition-duration-fast` | 150ms | `duration-fast` | hover, ikon, rang almashishi |
| `--transition-duration-base` | 250ms | `duration-base` | karta/dropdown kirishi |
| `--transition-duration-slow` | 350ms | `duration-slow` | modal, sheet, sahifa oʻtishi |
| `--ease-standard` | cubic-bezier(0.2,0,0,1) | `ease-standard` | barcha standart harakat (Material 3) |

### Interaksiya standarti (minimal — "jonli, bachkana emas")

| Element | Hover | Bosish (active) | Kirish |
|---|---|---|---|
| **Tugma** (`Button`) | rang oʻzgaradi | `whileTap scale 0.93` (motion) | — |
| **Asosiy karta/panel** (`Card`) | — (konteyner, statik) | — | qobiq `.stagger-children` |
| **Kichik karta — roʻyxat** (`.list-card`: sinf/boʻlim/dars/standart/oʻquvchi qatorlari) | neytral soya koʻtarilishi + leading ikona `scale(1.08)` | `scale(0.99)` tactile | `.animate-fade-slide-up` / stagger |
| **Kichik karta — sinf kartochkasi** (`.class-card`) | `translateY(-2px)` + rangli soya | `translateY(0)` | — |
| **Kichik karta — umumiy** (`.card-interactive`) | `scale(1.015)` + soya | `scale(0.98)` | — |
| **Ikona — chevron** (collapsible/dropdown) | — | ochilганда `rotate` `duration-fast` | — |
| **Ikona — leading** (`.list-card-icon`, ClassCard) | `scale(1.08)`/`scale(1.1)` (+ba'zan rotate) | — | — |

Prinsip: har element BITTA hover harakati oladi (lift YOKI scale, ikkalasi emas);
press feedback qisqartirish (0.98–0.99); ikonlar faqat maʼnoli momentda (holat
almashishi yoki leading-hover). Bir vaqtda bitta "katta" harakat.

Qoidalar:
- Yangi transition/animatsiyada raw `0.2s ease-out` yozmang — token utility
  (`duration-fast ease-standard`) yoki plain CSS'da `var(--transition-duration-*)`.
- Faqat `transform`/`opacity` animatsiya qilinadi (layout xossalari emas).
- **Mikro** (hover/press) = Tailwind klasslari komponent ichida; tugma press
  allaqachon `Button`dagi `whileTap` — CSS `active:scale` QOʻSHMANG (ikkilanadi).
- **Makro** (enter/exit, stagger, layout shift) = `motion` kutubxonasi,
  `src/components/animations/` primitivlari orqali: `<FadeIn>` (fade + 8px
  koʻtarilish), `<StaggerList>`+`<StaggerItem>` (40ms ketma-ket kirish).
- Reduced motion uch qatlamda avtomatik yopilgan: Tailwind `motion-reduce:`,
  globals.css'dagi `@media (prefers-reduced-motion)` guard (custom klasslar),
  va `MotionProvider` (`MotionConfig reducedMotion="user"`, layout.tsx'da).

---

## 6. Karta pasporti v2 (Yagona karta va roʻyxat standarti)

Ilovadagi barcha karta va roʻyxat elementlari "Karta pasporti v2" qoidalariga boʻysunadi. Bu tizimni EMStudio dizaynidan farqlaydi va yagona vizual tilni ta'minlaydi.

**Asosiy qoidalar:**

1. **Iconbox / Tile**: Kvadrat emas, **44px DOIRA**. Fon — bir xil hue asosidagi GRADIENT (135 gradus burchak ostida, `-400` dan `-600` ga qarab). Glif rangi doim **OQ**. Och ranglar (sariq, ohak) uchun gradientning toʻqroq qismi glif oʻqilishini ta'minlaydi.
2. **Avatar**: Iconbox dan farqlash uchun u gradient emas, balki **tint** fonga ega boʻladi va ichidagi initsial/matn `text` rangida boʻladi.
3. **Chegara (Border) va Rang tashuvchilar**: Karta va roʻyxatlarda doimiy rangli ramka YOʻQ. Ular neytral (`border` token) chegaraga ega. Sinf/toifa rangi quyidagilarda aks etadi:
   - Katta kartalarda: Gradient doira (Tile).
   - Zich roʻyxatlarda (nav, dropdown): 10px swatch (rangli nuqta).
   - Faol (Selected) holatda: chap tomondagi 3px `rail` (chiziq).
4. **Tanlov holati (Selected / Active)**: `data-active="true"`. Karta shakli/oʻlchami oʻzgarmaydi (morf bekor). Faqat vizual holat oʻzgaradi:
   - `tint` fon qoʻshiladi.
   - Chap tomonda 3px rangli `rail` paydo boʻladi (rang `--card-accent` dan olinadi).
5. **Anatomiya va oʻlchamlar (4pt-grid)**:
   - Asosiy karta paddingi: **16px** (zich rejimda 12px).
   - Elementlar orasidagi ichki masofa (gap): **12px**.
   - Karta minimal balandligi (min-h): **72px**.
   - Burchaklar (radius): **14px** (`rounded-xl`).
   - Sarlavha: `15px`, `font-semibold` (600).
   - Izoh/Subtitle: `12px` `muted-foreground`.
   - Kartalar orasidagi masofa: **8px**.
   - Panel chekkalari (padding): **20px**. (p-3.5 kabi oraliq qiymatlar yo'qoladi).
6. **Holatlar (States)**:
   - **Default**: 1px neytral border.
   - **Hover**: Karta = shadow-lift (yumshoq koʻtarilish soyasi). Qator (row) = `bg-muted`. (Sinf rangi aralashmaydi).
   - **Press / Active**: `scale(0.985)`.
   - **Selected**: `tint` fon + 3px chap `rail`.
   - **Focus-visible**: 2px neytral ring.
   - **Disabled**: `opacity-45` + `pointer-events-none`.
7. **Qator (Row) tili (zich roʻyxatlar uchun)**: 
   Chap navigatsiya, dropdown, jurnal yon paneli kabilar uchun ishlatiladi (min-h 44-48px). Standart `.list-row` yordamida yoziladi (swatch + nom). Tanlov = `tint` + 3px chap `rail`. Morf yoʻq.
8. **Signal grammatikasi (Trailing)**: Karta oxirida **maksimal 2 ta signal** ruxsat etiladi:
   - Metrika (kulrang yozuv).
   - Status (outline chip + nuqta).
   - Progress (bar + foiz).
   - Oʻquvchi kartalarida 0%/boʻsh qizil emas, neytral kulrang boʻladi.

> ⚠️ **Taqiqlar**: Koʻp rangli (candy) gradientlar, ochiq rangli (sariq/ohak) tile ustida oq glifning oʻqilmay qolishi (qorayuvchi gradient orqali yechiladi).

---

## 7. Modal sarlavhasi (standart)

Barcha modallar **bir xil** sarlavha qatoridan foydalanadi — `DialogHeaderBar`
(`components/ui/dialog.tsx`). Tuzilishi: chapda **ikon** (`SectionIcon`), yonida
**sarlavha** (+ ixtiyoriy tavsif), markazda **ixtiyoriy slot** (masalan line-tab),
oʻngda **ghost X** tugmasi. Kanonik namuna: `AddStandardsModal.tsx`.

```jsx
<DialogContent showCloseButton={false} className="p-0 gap-0 overflow-hidden …">
  <DialogHeaderBar
    icon={<GraduationCap className="size-[18px]" aria-hidden />}
    title="Yangi sinf yaratish"
    description="Sinf nomi, rangi va haftalik jadvalini kiriting."
    // center={<Tabs>…</Tabs>}   // ixtiyoriy
  />
  …
</DialogContent>
```

- `DialogContent`'ga **`showCloseButton={false}`** bering — standart burchak X'ni
  oʻchiradi; `DialogHeaderBar` oʻzining ghost X'ini (`DialogClose`) chizadi.
- Qator: `flex items-center gap-3 px-6 py-5 border-b min-h-[4.5rem]`. X = `variant=ghost size=icon`, `ml-auto`.
- **Portal qilingan popover/select Dialog ichida**: Dialog'ning `react-remove-scroll`
  lock'i gʻildirak (wheel) skrollni bloklaydi — portal dialog daraxtidan tashqarida.
  Yechim: ScrollArea + qoʻlda `onWheel` (viewport.scrollTop += e.deltaY). Namuna:
  `ClassFormModal.tsx` ikonka tanlash popoveri.

---

## 8. Modal footeri (standart)

Barcha modal footerlari **`px-6 py-4`** ishlatadi (24px yon, 16px tepa-past) —
jahon amaliyoti (Radix/shadcn default, Material) shu balandlikda; `p-6`/`pt-4`
kabi 24px vertikal padding footer'ni kerakidan baland qiladi.

```jsx
<DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
  <Button variant="outline" onClick={onClose}>Bekor qilish</Button>
  <Button onClick={submit}>Saqlash</Button>
</DialogFooter>
```

- Chegara: `border-t border-border`, fon: `bg-muted/20` (sarlavha bilan bir xil qoʻshimcha yuza).
- Toʻliq ekranli/scroll ichidagi modallarda `shrink-0` qoʻshing (footer siqilib qolmasin).
- `sm:justify-between` — footer'da chap tomonda oʻchirish tugmasi boʻlsa.

---

## Qoidalar

1. Xom rang (`#hex`, `rgb()`) yoki ixtiyoriy `text-[13px]` ishlatmang — token/shkaladan.
2. Yangi sarlavha = mavjud `heading-*` / `text-*` klassidan. Yangi oʻlcham kerak boʻlsa,
   avval shu fayl + bu hujjatga qoʻshing.
3. Toolbar = 36px. Panel header = `border-b px-5 py-4`, `min-h-16`.
6. Yangi panel/karta qoʻlda klass yozmang — `<Panel>`/`<PanelHeader>`/
   `<PanelBody>`/`<PanelFooter>` (`src/components/ui/panel.tsx`) yoki mavjud
   `panelCard*Class` konstantalaridan foydalaning; `card-elevation`ni panelga
   qoʻshmang (4-boʻlim).
4. Sinf rangi = `classTints` / `CLASS_COLOR_HEX`, qoʻlda hex yozmang.
5. Dark mode'ni alohida kod bilan emas, tokenlar orqali hal qiling.
