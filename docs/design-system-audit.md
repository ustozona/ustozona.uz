# Dizayn tizimi auditi — sahifalar boʻyicha TODO

Har sahifani `docs/design-system.md` standartiga solishtirib tekshirish va tuzatish.
Token tugasa, keyingi sessiya shu fayldan davom etadi: birinchi `⬜ Tekshirilmagan`
sahifani ol, tekshir, topilmalarni yoz, tuzat, soʻng `✅ Bajarildi` qil.

## Tekshirish mezonlari (har sahifa uchun)

1. **Tipografika** — `.heading-page/.heading-section/.heading-small/.text-body/.text-caption/.text-label`
   yoki `Typography*`/`CardTitle`. Xom `text-xl font-semibold`, `text-xs uppercase` boʻlmasin.
2. **Ranglar** — tokenlar (`bg-card`, `text-muted-foreground`, `bg-primary`...) + sinf rangi
   `classTints`/`CLASS_COLOR_HEX`. Xom `#hex`/`rgb()` boʻlmasin (qiymatga bogʻliq badge palitralari joiz).
3. **Boshqaruv oʻlchami** — toolbar tugmalari/inputlar **36px** (`h-9`/`size-9`), ikona `size-4`. Kichik `h-8`.
4. **Panel header** — `border-b border-border px-5 py-5`, `min-h-[4.5rem]`; ichida `SectionIcon` + `CardTitle`.
5. **Radius** — map jadval (karta `rounded-xl`, tugma `rounded-lg`, input `rounded-md`, aylana `rounded-full`)
   + konsentrik: card-ichida-card → tashqi > ichki (`r_tashqi = r_ichki + padding`).
6. **Ikona** — `lucide-react`, standart oʻlchamlar.

## Sahifalar

- [x] ✅ **Oʻquvchilar** — `src/app/dashboard/(with-sidebar)/students/page.tsx`
      (+ `_components/CreateStudentModal.tsx`) — bajarildi: tipografika, 36px toolbar,
      header border, sinf ranglari (-400), radius iyerarxiya (panel xl > karta lg).
- [x] ✅ **Bosh sahifa** — `src/app/dashboard/page.tsx` — tuzatildi: xom `rgb(229,231,235)` border → `var(--border)`; nested dars kartasi `rounded-xl`→`rounded-lg`. Kechiktirilgan: dars/jadval mock ranglari xom `rgb()` (fan ranglari, maʼlumot modeli refaktori kerak).
- [x] ✅ **Mening sinflarim** — `src/app/dashboard/classes/page.tsx` — tuzatildi: toolbar (Search/Filter/Sort/Yangi sinf/Toggle) `size="sm"` (32px)→36px, ikonalar `size-3.5`→`size-4`. Ranglar/radius/tipografika allaqachon mos.
- [x] ✅ **Dars jadvali** — `src/app/dashboard/timetable/page.tsx` — tuzatildi: "Erkin/Dars soatlari" toggle `size="sm"`(32px)→36px, ikona size-4. Qolgani mos (CardTitle/SectionIcon/TypographyLabel/classTints). Eslatma: grid header `border-b-0` ataylab (kun ustunlari ajratadi). `components/timetable/*` alohida tekshirilmadi.
- [x] ✅ **Rejalashtiruvchi** — `src/app/dashboard/planner/page.tsx` — tuzatildi: 3 xom uppercase yorliq → `.text-label`. Eslatma: kalendar nav (Hafta/Oy, Bugun, oʻqlar) `size="sm/icon-sm"` — kompakt nav, hozircha qoldirildi.
- [x] ✅ **Darslar** — `src/app/dashboard/(with-sidebar)/lessons/page.tsx` — "2 xom sarlavha" false-positive (placeholder + stat raqami, standart). "Yangi mavzu" h-8→h-9. Ranglar/radius mos.
- [x] ✅ **Jurnal** — `src/app/dashboard/(with-sidebar)/grades/page.tsx` (+ `_components/*`) — tuzatildi: NewAssignment/NewTopic/GradesTable xom uppercase yorliqlar → `.text-label`; `text-red-600`→`text-destructive`. Stat raqamlari (`text-lg font-bold`) joiz. Modal action tugmalari `size="sm"` (dialog footer, joiz). Jurnal sahifasi (`src/components/journal/*`) — tuzatildi: radiuslar, xom ranglar, margin/padding standartlashtirildi, ruxsat berilmagan hover effektlar olib tashlandi, card-elevation va panel sarlavhalari design-systemga moslandi.
  **Standartlashtirildi:** topic ranglar dublikati (`helpers.ts TOPIC_HEX` ↔ `grades-data bar`) → yagona `TOPIC_COLOR_HEX` (-500); baho/davomat badge mantiqi → `src/lib/score-colors.ts` (students ham shundan import qiladi); `barColorForPercent` → `scoreBarColor`.
- [x] ✅ **Davomat** — `src/app/dashboard/(with-sidebar)/attendance/page.tsx` — "Oʻquvchi ismi" yorligʻi → `.text-label`. Kun nomi (132) conditional rangli uppercase — qoldirildi (rang oʻzgaruvchan, token).
- [x] ✅ **Standartlar** — `src/app/dashboard/(with-sidebar)/standards/page.tsx` — 3 form yorligʻi `text-[10px]...uppercase` → `.text-label`. Bloom kategoriya ranglari (sky/blue/green/...) = semantik palette, joiz.
- [x] ✅ **Vazifalar** — `src/app/dashboard/tasks/page.tsx` (+ `components/tasks/*`) — bajarildi: tipografika/sarlavhalar, toolbar 36px/32px o'lchamlari, panel header balandligi.
- [x] ✅ **Dars muharriri** — `src/app/lessons/[id]/page.tsx` (+ `components/lesson-editor/*`) — `DetailsPanel` SectionLabel xom uppercase → `.text-label`. Qolgani toza (dinamik sinf-rangli oy yorligʻi — joiz). Jonli koʻrish dars ochishni talab qiladi.

## Topilmalar jurnali (har sahifa tekshirilganda toʻldiriladi)

> Quyidagi topilmalar tezkor grep-skan asosida (xom hex, xom sarlavha tipografikasi,
> `uppercase` yorliqlar, `h-11/size-11` oʻlchamlar, `rounded-[...]` arbitrary).
> Har sahifani tuzatishdan oldin TOʻLIQ oʻqib chiqish kerak — bu faqat boshlangʻich xarita.
> Umumiy: `rounded-[...]` arbitrary **0 ta** (radius shkalaga amal qilingan — yaxshi).

### Oʻquvchilar — ✅
Standartga toʻliq mos (yuqoriga qarang).

### Bosh sahifa — ⬜
`dashboard/page.tsx`. Greplarda anti-naqsh **yoʻq**. Toʻliq oʻqib: sarlavhalar
`CardTitle`/`heading-*` mi, kartalar radiusi/iyerarxiyasi, banner bloklari tekshirilsin.

### Mening sinflarim — ⬜
`dashboard/classes/page.tsx` + `components/ClassCard.tsx`.
- Xom sarlavha tipografikasi: 1 ta (`text-xl font-bold` ehtimol "Mening sinflarim") → `CardTitle`.
- `h-11/size-11`: 2 ta — toolbar 36px standartiga solishtirish (Filter/Sort/Yangi sinf).
- Sinf kartalari radius iyerarxiyasi (panel > karta) tekshirilsin.

### Dars jadvali — ⬜
`dashboard/timetable/page.tsx` + `components/timetable/*`.
- Greplarda heading/uppercase yoʻq; lekin `rounded-*` aralash (12). Panel header konvensiyasi,
  period kataklari radiusi, sinf rangi ishlatilishi tekshirilsin.

### Rejalashtiruvchi — ⬜
`dashboard/planner/page.tsx`.
- `uppercase`: 3 ta → `text-label`/`TypographyLabel`.
- Kalendar bloklari radiusi/tipografikasi tekshirilsin.

### Darslar — ⬜
`(with-sidebar)/lessons/page.tsx`.
- Xom sarlavha: 2 ta → `CardTitle`/`heading-small`ga solishtirish.
- Bu sahifa students uchun layout namunasi edi — koʻp qismi mos, faqat tipografika/radius nuance.

### Jurnal — ✅
`(with-sidebar)/grades/page.tsx` + `_components/*` va `components/journal/*`.
Tuzatildi: Barcha komponentlarda dizayn tizimi talablari qanoatlantirildi (radiuslar, borderlar, typography, ranglar va marginlar moslashtirildi).

### Davomat — ⬜
`(with-sidebar)/attendance/page.tsx`.
- `uppercase`: 2 → `text-label`. `h-11`: 1 — kontekst.

### Standartlar — ⬜
`(with-sidebar)/standards/page.tsx`.
- `uppercase`: 3 → `text-label`. `h-11`: 1 — kontekst.

### Vazifalar — ⬜
`dashboard/tasks/page.tsx` + `components/tasks/*`.
- ⚠️ `TasksList.tsx` da avval **build xatosi** koʻrilgan (301-qator) — avval shuni tekshir/tuzat.
- Tipografika/radius tekshirilsin.

### Dars muharriri — ⬜
`lessons/[id]/page.tsx` + `components/lesson-editor/*`. Toʻliq ekran, alohida tartib.
Eng katta — oxirida, alohida koʻrib chiqiladi.

## Eslatma (oʻlcham nuance)
`h-11` (44px) har doim xato emas: u **forma inputlari / asosiy CTA** uchun joiz.
**36px standarti faqat panel toolbar boshqaruvlariga** tegishli. Tuzatishda kontekstga qarang.
