# Kalendar arxitekturasi (calendar-core)

## Nega bitta yagona tizim

Loyihada 4 ta joy oʻz kalendarini mustaqil chizar edi (bosh sahifa lentasi,
rejalashtiruvchi, jadval erkin rejimi, qoʻngʻiroq-soati toʻri) — sana/vaqt
matematikasi, event-karta stillari va oyliklar bir necha marta dublikat
qilingan edi. `src/lib/calendar-core/` — shu barchasi uchun yagona pastki
qatlam; `src/components/calendar/` — ustidagi umumiy UI (TimeGrid, MonthGrid,
EventCard, EventPill).

## Federatsiya printsipi

Kalendar — **proyeksiya, ombor emas**. `CalendarOccurrence` (`occurrence.ts`)
faqat oʻqiladigan view-tip: hech qachon bazaga qaytib yozilmaydi. Har manba
(jadval versiyasi, dars sessiyasi, vazifa, taʼtil, oʻquvchi tugʻilgan kuni)
oʻz modulida yashaydi va oʻsha yerda tahrirlanadi. `resolve.ts`dagi
`resolveOccurrences()` — sof funksiya, berilgan sana oraligʻi uchun barcha
manbalarni kun-boʻyicha `CalendarOccurrence[]`ga yigʻadi. Tahrir/deep-link
`ref` maydoni orqali egasi-modulga qaytadi (masalan `task-due` → TaskDetail,
`lesson-session` → Rejalashtiruvchi, `birthday` → oʻquvchi profili).

## Qatlamlar

1. **`src/lib/calendar-core/`** (pure TS, React yoʻq)
   - `date-math.ts` — sana/vaqt matematikasi yagona manbasi (`"YYYY-MM-DD"`
     kalitlar, `minToHHMM/hhmmToMin`, ISO/JS kun konvertorlari).
   - `occurrence.ts` — `CalendarOccurrence` tipi + RFC 5545/8984 moslik jadvali.
   - `resolve.ts` — `resolveOccurrences()` federatsiya resolveri.
   - `layout.ts` — `packColumns` (ustma-ust voqealarni ustunlarga joylash).
   - `timezone.ts` — `CALENDAR_TZID` (hozircha faqat eksport uchun).
   - `ics.ts` — `toICalendar()` — RFC 5545 eksport skeleti (pastga qarang).
2. **`src/components/calendar/`** — `TimeGrid`, `MonthGrid`, `EventCard`,
   `EventPill`, `format.ts` (`useCalendarFormat` — kun/oy nomlari
   message-based, kaa tili uchun date-fns/ICU yoʻq).
3. Isteʼmolchilar: `TodayRail`, `PlannerView` (hafta+oy), `timetable/page.tsx`
   (erkin rejim), `PeriodGrid`, `TasksCalendar` (Vazifalar sahifasi —
   kun/hafta/oy/chorak/yil).

## EventCard — yagona event yuzasi

`EventCard` (`src/components/calendar/EventCard.tsx`) — barcha kalendar
sirtlari (TodayRail, PeriodGrid, timetable erkin rejim, PlannerView hafta)
uchun yagona karta. Ilgari bu retsept beshta joyda mustaqil qoʻlda yozilgan
edi (radius/padding/rang izchil emas edi) — endi **yangi event sirti kerak
boʻlsa, EventCard'ga prop qoʻshiladi, nusxa koʻchirilmaydi**.

Ikki oʻqli model:

- `state?: "filled" | "empty"` — dizayn grammatikasi. `filled` = dars/sinf
  ulangan slot: toʻyingan sinf rangi (`tints.solidSurface`) + ikki qatlamli
  tekstura (nur + nuqta toʻri). `empty` = boʻsh slot: sinf rangining xira
  "arvohi" (`tints.tint`), tekstura arang nuqta. Matn `filled`da
  `tints.textOnSolid` (ikkala temada ham deyarli qora — toʻyingan fon
  ikkala temada bir xil yorugʻ rang boʻlgani uchun), `empty`da
  `text-muted-foreground`.
- `density?: "cozy" | "compact" | "micro"` — tipografika/joy zichligi
  (sarlavha 11–12px, vaqt qatori bor/yoʻq/bir qatorda).

Kompozitsiya slotlari: `leading` (sarlavha oldidagi ikona), `trailing`
(sarlavha qatoridagi oxirgi belgi — masalan "Nazorat" badge), `actions`
(absolute oʻng-yuqori, hover'da chiqadi, `bg-foreground/8` neytral fon —
har qanday sinf rangi ustida ishlaydi), `footer` (pastki CTA zonasi),
`children` (ichki roʻyxat/tutqichlar). `as="div" | "button"` — planner
mustaqil-mavzu kartasi `<button>`. `forwardRef` majburiy (PeriodGrid
Popover `asChild` uchun).

Diagonal chiziq teksturasi (`CardStripes`/`CardCorner`) event
kartalaridan olib tashlangan — faqat `BellSection.tsx` hali ishlatadi
(alohida, oʻz grammatikasi bilan).

## Sana/vaqt qoidalari

- Sana faqat `"YYYY-MM-DD"` kalit, leksikografik solishtiriladi.
  `toISOString()` TAQIQ (UTC+5 off-by-one xatosi).
- Kun-indeks ikkita fazo bor: ISO (1=Dushanba..7=Yakshanba) va JS
  `getDay()` (0=Yakshanba..6=Shanba). Faqat `jsDayToIsoDay`/`isoDayToJsDay`
  orqali oʻtish kerak.
- `sessionMatchesSlot(slot, session, matchMode)`: kanonik semantika
  `"start-in-slot"` (rejalashtiruvchi); TodayRail ataylab `"overlap"`
  saqlagan (tarixiy xatti-harakat, unifikatsiya v2ga qoldirilgan).

## Kelajak: ICS eksport / tashqi sinxron

`ics.ts`dagi `toICalendar(occurrences)` — hozircha hech yerda chaqirilmaydi,
faqat ildiz. Har `CalendarOccurrence` alohida `VEVENT` sifatida eksport
qilinadi (versiya/RRULE siqilmagan — toʻgʻri, lekin katta oraliqda katta
fayl chiqishi mumkin; siqish keyingi ish). Kelajakdagi foydalanish
holatlari: ".ics yuklab olish" tugmasi, Telegram mini-app (resolver
natijasi HTTP orqali uzatiladi — bazaga yozilmaydi, faqat oʻqiladi),
Google Calendar bir tomonlama eksport.

## Hozircha QILINMAGAN

RRULE saqlash migratsiyasi; tashqi sync/OAuth; kutubxona integratsiyasi
(FullCalendar/react-big-calendar ataylab rad etilgan — sabablari git
tarixidagi reja hujjatida); server-persisted blocked days; jurnal-topshiriq
va davomat-badge manbalari kalendarda (v2).
