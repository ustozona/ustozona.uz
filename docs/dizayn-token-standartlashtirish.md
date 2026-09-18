# Tipografika va boʻshliq shkalasini standartlashtirish

**Holat:** 2-tahrir, bosqichlar boshlanmagan. **Sana:** 2026-09-04,
qayta oʻlchov va qayta koʻrib chiqish 2026-09-18.

`DESIGN.md` §3 (tipografika) va §4 (radius) yozilgan, lekin **boʻshliq
shkalasi yoʻq**, tipografika qoidasi esa amalda ishlamayapti. Quyida
oʻlchov, sanoatda sinalgan tamoyillar, qaror va bosqichlar.

---

## 1. Oʻlchov — 2026-09-18

`src/**/*.tsx` boʻyicha sanoq (04-09 dagi qiymat qavsda).

### Tipografika

| | Soni |
|---|---|
| Shkala klasslari (`.heading-*`, `.text-caption/label/body/micro`) | **259** (190) |
| Xom Tailwind (`text-sm` 677, `text-xs` 526, `text-base` 69, `text-lg` 51, `text-2xl` 26, `text-xl` 21, `text-3xl…5xl` 48) | **1418** (1352) |
| Ixtiyoriy oʻlcham (`text-[10px]` 92, `text-[11px]` 64, `text-[13px]` 13, `text-[9px]` 6, `text-[15px]` 5, boshqalar 11) | **191** (181) |
| 10px dan kichik (`text-[8px]`, `[9px]`, `[9.5px]`) | **10** |

Vazn: `font-medium` 443 · `font-semibold` 377 · `font-bold` 80 ·
`font-normal` 73.

Xulosa: oʻtgan ikki haftada shkala klasslari koʻpaydi (+69), lekin
ixtiyoriy px ham oʻsdi (+10). **Hujjat yolgʻiz oʻzi oqimni toʻxtatmayapti.**

### Boʻshliqlar (`p/m/gap/space` qadamlari)

| Qadam | px | Soni | 4px toʻrida? |
|---|---|---|---|
| `2` | 8 | 1001 | ✅ |
| `3` | 12 | 864 | ✅ |
| `4` | 16 | 666 | ✅ |
| `1.5` | 6 | 635 | yarim qadam |
| `1` | 4 | 581 | ✅ |
| `6` | 24 | 325 | ✅ |
| `5` | 20 | 292 | ✅ |
| `2.5` | 10 | **265** | ❌ |
| `0.5` | 2 | 240 | yarim qadam |
| `8` | 32 | 110 | ✅ |
| `3.5` | 14 | **57** | ❌ |
| `9`, `7`, `4.5`, `11`, `15` | 36, 28, 18, 44, 60 | 42 | koʻpi ❌ |

Ixtiyoriy qiymat (`p-[13px]` kabi) — 23 ta.

### 1-tahrirdagi xato

1-tahrir `p-5` va `7` ni «4px toʻridan tashqari» deb taqiqlagan edi. Bu
notoʻgʻri: 20px va 28px — 4 ga karrali. Toʻrdan haqiqatan chiqadiganlar
faqat `2.5` (10px), `3.5` (14px), `4.5` (18px) va toq katta qadamlar.

### Yangi topilma — sirt tizimini aylanib oʻtish

`globals.css` dagi `[data-surface="stage"|"handheld"]` projektor va
telefon uchun `--text-*` va `--spacing` ni qayta belgilaydi — butun
daraxt bir zumda kattalashadi. Lekin:

- `text-[10px]`, `p-[13px]` kabi **ixtiyoriy qiymatlar bu tizimga
  boʻysunmaydi** — projektorda ham 10px qoladi;
- shkala klasslari (`.heading-*`, `.text-caption` …) esa boʻysunadi:
  `src/styles/surfaces.css` sirt uchun `--typo-*` ni ham qayta
  belgilaydi. Faqat `.text-micro` qatʼiy 0.625rem edi.

Yaʼni muammo endi faqat estetika emas: ixtiyoriy qiymat **funksional
xato** — sinf ekranida matn mayda qoladi.

### Yana bir topilma — rollar eʼtiborsiz qoldirardi

Eski shkala klasslari CSS qatlamidan tashqarida edi va har qanday
Tailwind utility'sidan kuchli chiqardi. Natijada ~32 joyda yozilgan
`text-label font-semibold`, `text-body leading-relaxed`,
`text-caption text-foreground` **jimgina ishlamasdi**. Bundan tashqari
`cn()` (tailwind-merge) `text-caption` ni rang deb oʻylab, yonida rang
utility'si boʻlsa rolni butunlay tashlab yuborardi. Ikkalasi 2-bosqichda
(PR #155) tuzatildi.

---

## 2. Tamoyillar — sanoatda sinalgan naqshlar

Katta dizayn tizimlarida takrorlanadigan va bu loyihaga toʻgʻri
keladiganlari:

1. **Tokenlar uch qatlamli.** *Primitiv* (xom shkala: 12px, 14px…) →
   *semantik* (rol: `caption`, `body`, `title`) → *komponent*. Kod
   semantik qatlamni ishlatadi, primitivga faqat token fayli tegadi.
   Sirt/zichlik rejimi primitivni almashtiradi, rollar oʻz-oʻzidan
   ergashadi.
2. **Tipografik token — bitta oʻlcham emas, toʻplam.** Rol oʻlcham,
   qator balandligi, vazn va harf oraligʻini **birga** belgilaydi.
   Alohida `text-sm` + `leading-snug` + `font-semibold` yigʻish — har
   joyda turlicha yigʻiladi.
3. **Rol nomi oʻlchamni emas, vazifani aytadi.** `text-caption`,
   `text-title` — `text-13` emas. Oʻlcham keyin oʻzgarsa, nom yolgʻonga
   aylanmaydi.
4. **Birlik — `rem`.** Foydalanuvchi brauzer shriftini kattalashtirsa
   (koʻrish qiyinligi) matn ergashadi. px bunga toʻsqinlik qiladi.
5. **Pastki chegara.** Ekranda oʻqiladigan matn 12px dan kichik
   boʻlmaydi; zich maʼlumot toʻri uchun yagona istisno 10px. 10px dan
   kichik — umuman yoʻq.
6. **Boʻshliq — 4px toʻri, 2px yarim qadam faqat zich joyda.** Qatorlar
   rol boʻyicha nomlanadi, qiymat roldan kelib chiqadi.
7. **Mobil kiritish maydoni ≥ 16px.** Aks holda telefon brauzeri fokusda
   sahifani avtomatik kattalashtiradi. `input.tsx`/`textarea.tsx` da
   `text-base md:text-sm` shu sababdan — tegilmaydi.
8. **Majburlash — asta-sekin (ratchet).** Buzilishlar soni bazaviy
   qiymat sifatida yoziladi, u faqat kamayishi mumkin. Yangi kod toza,
   eski kod tegilganda tozalanadi.

---

## 3. Qaror

### 3.1 Semantik rollar — Tailwind'ning oʻz tokeni sifatida

Hozirgi `.heading-*` / `.text-*` — oddiy CSS klasslari. Kamchiliklari:
`md:` kabi variantlar ishlamaydi, sirt tizimiga boʻysunmaydi, Tailwind
ularni bilmaydi.

Tailwind v4 `@theme` da `--text-<nom>` bilan birga
`--text-<nom>--line-height`, `--text-<nom>--font-weight`,
`--text-<nom>--letter-spacing` qabul qiladi. Rollar shu yerga koʻchadi —
natijada `text-caption` haqiqiy utility boʻladi: variantli
(`md:text-title`), IntelliSense'da koʻrinadi, bitta klass toʻliq
toʻplamni beradi.

| Rol (utility) | px / lh / vazn | Vazifa | Hozir |
|---|---|---|---|
| `text-micro` | 10 / 1.2 / 600 tabular | zich toʻr katagi (jadval) | `.text-micro`, `text-[10px]` |
| `text-label` | 11 / 1.4 / 500 caps +0.05em | boʻlim yorligʻi | `.text-label`, `text-[11px]` |
| `text-caption` | 12 / 1.4 / 400 | izoh, meta, vaqt | `.text-caption`, `text-xs` |
| `text-body` | 14 / 1.5 / 400 | ilova asosiy matni | `.text-body`, `text-sm` |
| `text-reading` | 16 / 1.6 / 400 | uzun oʻqiladigan matn | `text-base` |
| `text-title-sm` | 15 / 1.3 / 600 | karta sarlavhasi, ism | `.heading-small` |
| `text-title` | 18 / 1.3 / 600 | panel/boʻlim sarlavhasi | `.heading-section`, `text-lg` |
| `text-headline` | 24 / 1.2 / 700 −0.02em | sahifa sarlavhasi | `.heading-page`, `text-2xl` |
| `text-display` | 30+ / 1.1 / 700 | landing, hero | `text-3xl…5xl` |

Rang rolga **kiritilmaydi** (hozir `.text-caption` oʻzi muted beradi) —
rang alohida oʻq: `text-caption text-muted-foreground`. Aks holda
«muted boʻlmagan izoh» uchun yana xom klassga qaytiladi.

Eski `.heading-*` / `.text-*` klasslar koʻchish davrida **alias**
boʻlib qoladi (yangi tokenni oʻqiydi), keyin olib tashlanadi.
`--typo-*` mexanizmi (`.readable-scale`) rollar ustidan ishlashda
davom etadi.

### 3.2 13px — pogʻona emas

1-tahrir 13px ni yangi pogʻona (`.text-event`) qilishni taklif qilgan
edi. Qayta koʻrib chiqildi: 13 ta joy, 12 va 14 orasida 1px farq koʻzga
ilinmaydi, lekin shkalaga yana bitta qadam qoʻshadi. **13px → 12px
(`text-caption`) yoki 14px (`text-body`)** ga koʻchiriladi. Toast
(`DESIGN.md` §9) — ongli istisno, oʻz klassida qoladi.

### 3.3 `text-base` — hal qilindi

Ochiq savol yopildi: 16px roli bor — **`text-reading`**: blog, yordam
markazi, jurnal yozuvi, uzun tavsif. Plus mobil kiritish maydoni
(2-tamoyil 7). Qolgan `text-base` lar (sarlavha oʻrnida ishlatilganlar)
tegishli rolga koʻchadi.

### 3.4 Pastki chegara

`text-[8px]`, `[9px]`, `[9.5px]` — 10 ta joy, 9 faylda. Hammasi
`text-micro` (10px) ga koʻtariladi. Chop etish varagʻi
(`TimetablePrintSheet`) — yagona istisno: qogʻoz ekran emas, u yerda pt
birligi ishlatiladi.

### 3.5 Vazn

Uch vazn: 400 · 500 · 600. **700 faqat `text-headline` va
`text-display` ichida** — rol orqali keladi. Qoʻlda `font-bold` (80 ta)
yozilmaydi.

### 3.6 Boʻshliq shkalasi

4px toʻri. Ruxsat: `0 · 0.5(2) · 1(4) · 1.5(6) · 2(8) · 3(12) · 4(16) ·
5(20) · 6(24) · 8(32) · 10(40) · 12(48) · 16(64)`.
Taqiq: `2.5 · 3.5 · 4.5` va ixtiyoriy `[Npx]`.

`2.5` (265 ta) eng katta koʻchish: koʻpi ikona↔matn va chip ichi —
`gap-2` yoki `gap-3` ga ketadi. Qaysi biri — rol jadvalidan.

| Rol | Qiymat |
|---|---|
| Karta ichidagi matn qatorlari | `gap-0.5` (2) |
| Yonma-yon belgilar, badge ichi | `gap-1` (4) |
| Ikona ↔ matn | `gap-1.5` (6) · kattaroq ikonada `gap-2` |
| Bir qatordagi boshqaruvlar · zich karta paddingi | `gap-2` · `p-2` (8) |
| Karta ichidagi bloklar · karta paddingi | `gap-3` · `p-3` (12) |
| Panel ichidagi bloklar · panel paddingi · panel ↔ panel | `gap-4` · `p-4` (16) |
| Keng panel paddingi, dialog | `p-5` (20) |
| Sahifa boʻlimlari · hero | `gap-6` · `p-6` (24) |
| Sahifa yuqori/quyi chegarasi | `gap-8` (32) va undan katta |
| Chip / badge | `px-2 py-0.5` |

Boʻshliq uchun alohida semantik token (`--space-card` kabi) **hozircha
kiritilmaydi**: Tailwind qadamlari allaqachon `--spacing` orqali sirtga
boʻysunadi, rol jadvali yetarli. Qayta koʻriladi, agar bir rolning
qiymati kelajakda oʻzgartirilishi kerak boʻlsa.

### 3.7 Darvoza — `scripts/check-design-tokens.mjs`

`prebuild` da toʻrtinchi tekshiruv (mavjud uchtasi:
`check-server-actions`, `check-school-grouping`, `check-migrations`).

Sanaydi: ixtiyoriy `text-[…]`, 10px dan kichik oʻlcham, taqiqlangan
boʻshliq qadamlari, ixtiyoriy boʻshliq `[…]`, qoʻlda `font-bold`.

**Ratchet:** bazaviy son `scripts/design-tokens-baseline.json` ga
yoziladi. Son oshsa — build yiqiladi va yangi buzilish qaysi faylda
ekanini koʻrsatadi. Kamaysa — baza yangilanadi. Hech kim bir haftalik
koʻchishga majbur emas.

Istisnolar fayl ichida izoh bilan: `// design-tokens-ignore: <sabab>`
(chop etish varagʻi, toast). Sababsiz istisno qabul qilinmaydi.

---

## 4. Bosqichlar

| | Nima | Fayllar | Xavf |
|---|---|---|---|
| 1 ✅ #154 | Darvoza — **faqat hisoblagich**, bazaviy son bilan | `scripts/`, `package.json` | yoʻq — koʻrinish oʻzgarmaydi |
| 2 ✅ #155 | Rollar `@theme` ga; eski klasslar alias; `cn()` tuzatildi | `globals.css`, `utils.ts`, `DESIGN.md` §3 | past — qiymatlar bir xil, ~32 joyda override endi ishlaydi |
| 3 ✅ | `DESIGN.md` §3.5 «Boʻshliq shkalasi» — rol jadvali | `DESIGN.md`, `docs/design-system.md` | yoʻq |
| 4 ✅ #157 | Pastki chegara (10 joy) + 13px (13 joy) | 9 + ~8 fayl | past, koʻrinadi |
| 5 ✅ | Namuna koʻchish: `EventCard` | `calendar/EventCard.tsx` | past |
| 6+ | Tegilgan fayl tozalanadi — alohida koʻchish sprinti yoʻq | — | — |

1-tahrirdan farq: darvoza **birinchi** keladi. Hisoblagich hech narsani
buzmaydi, lekin shu kundan boshlab yangi buzilish qoʻshilmaydi —
tozalash davomida son qayta oʻsib ketmaydi.

2-bosqich 1-tahrirdagi «`text-sm` ni shkalaga bogʻlash» oʻrnini egallaydi:
xom `text-sm` ga vazn va qator balandligi **tiqilmaydi** — bu 677 joyda
kutilmagan oʻzgarish beradi (`font-medium` bilan toʻqnashuv, qatorlar
siljishi). Xom klasslar primitiv boʻlib qoladi, rollar ulardan ustun turadi.

---

## 5. RAD ETILGAN takliflar

Yozib qoʻyilyapti, chunki qayta koʻtarilishi mumkin.

- **Soat balandligini 180px dan 72px ga tushirish.** Taklif qilingan edi:
  hozirgi zichlikda noutbuk ekraniga oʻquv kunining yarmi ham sigʻmaydi va
  45 daqiqalik blok ichida ~90px boʻsh maydon qoladi. **Foydalanuvchi
  hozirgi zichlikni maʼqul koʻrdi** — oʻzgartirilmaydi.
- **Mobil koʻrinishni haftadan bitta kun ustuniga oʻtkazish.** 375px enida
  6 ustunga 62px dan tushadi. Hozircha koʻtarilmaydi.

---

## 6. Aloqador, lekin alohida ish

**`TimetableEvent.subjectId`** — hozir fan hodisada emas, sinfda saqlanadi
(`ClassInfo.subject`), shuning uchun bitta sinfda oʻtiladigan ikki xil fan
(«Ona tili» va «Adabiyot» ikkalasi ham 9-A da) jadvalda ajralmaydi.

Jahon amaliyotidagi model: jadval hodisasi sinfga emas, **oʻquv guruhiga**
(`sinf × fan × oʻqituvchi`) bogʻlanadi. Bu `school-timetable.ts` da
allaqachon bor (`SchoolClass.plan`, `assignments`), lekin oʻqituvchi
jadvalida yoʻq — nashr koʻprigi qurilganda maʼlumot yoʻqoladi.

Taʼsir doirasi: `lib/timetable.ts` · `store/useTimetableStore.ts` ·
`lib/timetable-versions.ts` (eski hodisalarni normalizatsiya) ·
`lib/sync/timetable-*.ts` · tahrir dialogi · `PeriodGrid` · chop etish
varagʻi. Markaziy fayllar — AGENTS.md 5-qoidasi, yolgʻiz tegilmaydi.

Vaqtinchalik yoʻl (kod talab qilmaydi): har fanga alohida sinf yaratish.

Birinchi qadam bajarilgan: taqvim kartasi endi fanni koʻrsatadi —
[PR #105](https://github.com/ustozona/ustozona.uz/pull/105).
