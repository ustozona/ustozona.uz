# Dizayn tizimi (shadcn asosida)

Murabbiyona EMS dizayn tizimi. shadcn/ui (`new-york`, `neutral`) + Tailwind v4
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

## 4. Panel konvensiyalari

- Panel/karta: `bg-card rounded-xl card-elevation` (chegara emas, yumshoq soya).
- Panel headeri: `border-b border-border px-5 py-5`, `min-h-[4.5rem]` (~76px).
  Ichida: `SectionIcon` + `CardTitle` + (ixtiyoriy) `TypographyMuted` sanoq.
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
- Elevation: `.card-elevation` (ikki qatlamli yumshoq soya, dark mode mos).
- Interaktiv: `.card-interactive` (hover scale+shadow), `.animate-fade-slide-up`,
  `.animate-fade-in`. (`.animate-spring-bounce` — list-card uchun ishlatilmaydi.)

---

## 6. List-card holatlari (default / hover / active)

Barcha sahifalardagi interaktiv roʻyxat kartalari (Boʻlimlar, Mavzular, Oʻquvchilar,
Topshiriqlar, Sinflar roʻyxati) **yagona qobiq** — `globals.css` dagi `.list-card`.
Har sahifa faqat ichki kontentini (leading, badge, trailing) beradi; holat tili bitta.

**Tamoyil:** rang FAQAT active'da (tanlangan signali). Hover NEYTRAL — ikki holat
toza ajraladi, a11y (och sinf ranglarida border kontrast muammosi) yo'qoladi.

| Holat | Qoida |
|---|---|
| Default | `.list-card` — `rounded-xl` (14px), 1px `border`, `bg-card` (oq). Separatsiya border orqali |
| Hover | Neytral yumshoq **koʻtarilish soyasi** + leading ikona `scale(1.08)`. ❌ fon oʻzgarmaydi, ❌ rangli border, ❌ translate-x |
| Active | `data-active="true"` — sinf rangi: accent chegara + inset ring (2px-koʻrinish, **reflowsiz**) + inline tint fon (`classTints(color).tint`). Ikona scale YOʻQ |
| Accent | `style={{ ["--card-accent"]: hex }}` — sinf rangi (`CLASS_COLOR_HEX`) yoki topic (`topicHex`); faqat active'da ishlatiladi |

```jsx
<div
  className="list-card group flex items-center gap-3 p-4 cursor-pointer"
  data-active={isSelected || undefined}
  style={isSelected ? { ["--card-accent"]: hex, ...classTints(color).tint } : undefined}
>
  <div className="list-card-icon size-11 rounded-lg …" style={classTints(color).iconBg}>…</div>
  …
</div>
```

**Leading / tipografika standarti:**

| Element | Standart |
|---|---|
| Ikona qutisi | `size-11` (44px) `rounded-lg` + `list-card-icon` (hover scale), fon `classTints(color).iconBg`, ikona `size-5` rang `iconText` |
| Shaxs avatari | `size-14` (56px) `rounded-full`, solid rang + oq bosh harflar |
| Sarlavha | `.heading-small` (yoki `text-sm font-semibold`), `truncate`, hover `group-hover:text-primary` |
| Meta / subtitle | `.text-caption` / `text-muted-foreground` |
| Badge | `inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border` + `score-colors.ts` |

**Kompakt nav-row** (chap panel: Sinflar/Boʻlimlar roʻyxati) — kanonik namuna
`ClassListPanel.tsx`: default = `size-3 rounded-[4px]` swatch + `min-h-12` + `hover:bg-muted/50`;
active = `min-h-20` ikona-quti karta (`border-2`, `classTints`). `hover:translate-x` ishlatilmaydi.

> ⚠️ `color-mix(… var() …)` ni **CSS faylida** ishlatmang — Lightning CSS (build) uni
> mangle qiladi. Faqat **inline `style`** da ishlaydi (`classTints` shunday). Stylesheet'da
> dinamik rang kerak boʻlsa — `var(--card-accent)` orqali, inline berib.

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
3. Toolbar = 36px. Panel header = `border-b px-5 py-5`.
4. Sinf rangi = `classTints` / `CLASS_COLOR_HEX`, qoʻlda hex yozmang.
5. Dark mode'ni alohida kod bilan emas, tokenlar orqali hal qiling.
