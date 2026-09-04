# Tipografika va boʻshliq shkalasini standartlashtirish

**Holat:** kelishilgan, boshlanmagan. **Sana:** 2026-09-04.

`DESIGN.md` §3 (tipografika) va §4 (radius) yozilgan, lekin **boʻshliq
shkalasi umuman yoʻq**, tipografika qoidasi esa amalda ishlamayapti. Quyida
oʻlchov, qaror va bosqichlar.

---

## 1. Oʻlchov — 2026-09-04 holati

`src/**/*.tsx` boʻyicha sanoq.

### Tipografika

| | Soni |
|---|---|
| Shkala klasslari (`.heading-*`, `.text-caption/label/body/micro`) | **190** |
| Xom Tailwind (`text-sm` 649, `text-xs` 526, `text-base` 64, `text-lg` 48, …) | **1352** |
| Ixtiyoriy px (`text-[10px]` 92, `text-[11px]` 61, `text-[13px]` 13, …) | **181** |

`DESIGN.md` §3 «inline `text-[13px]` yozilmaydi» deydi — **181 joyda
buzilgan**. `text-[10px]` 92 marta ishlatilgan, holbuki aynan shu oʻlcham
uchun ochilgan `.text-micro` atigi 10 marta.

Vazn: `font-medium` 427 · `font-semibold` 369 · `font-bold` 80.

### Boʻshliqlar

Ixtiyoriy qiymat deyarli **yoʻq** (~20 ta, koʻpi print va container-query) —
bu yaxshi. Muammo boshqa: **tanlov cheklanmagan**. `p-0.5` dan `p-8`,
`gap-0.5` dan `gap-12` gacha hammasi ishlatilgan.

4px toʻridan chiqadiganlar: `gap-2.5` **118** · `p-5` **60** · `p-3.5` 4 ·
`p-2.5` 3.

---

## 2. Qaror

Ikki muammo bir-biriga oʻxshamaydi, shuning uchun yechim ham ikki xil.

### 2.1 Tipografika — shkalani majburlamaymiz, DEFAULT qilamiz

1352 ta joyni qoʻlda koʻchirish real emas. Teskari yoʻl: `globals.css` da
`@theme` orqali Tailwind ning `text-xs/sm/lg/2xl` larini shkala qiymatlariga
bogʻlash. Shunda mavjud chaqiruvlar **bir qator ham tegilmasdan** shkalaga
boʻysunadi — oʻlcham, qator balandligi va vazn markazdan keladi.

Shu bilan birga shkala haqiqatga moslashtiriladi: 11px va 13px hozir
shkalada yoʻq, lekin kodda 74 marta kerak boʻlgan. Demak ular istisno emas,
**pogʻona**.

| px / vazn | Roli | Tailwind aliasi |
|---|---|---|
| 10 / 600 | zich toʻr katagi | — (`.text-micro`) |
| 11 / 500 caps | boʻlim yorligʻi | — (`.text-label`) |
| 12 / 400 | izoh, meta | `text-xs` |
| 13 / 600 | zich karta sarlavhasi (**yangi** `.text-event`) | — |
| 14 / 400 | asosiy matn | `text-sm` |
| 15 / 600 | karta ichidagi ism | — (`.heading-small`) |
| 18 / 600 | panel sarlavhasi | `text-lg` |
| 24 / 700 | sahifa sarlavhasi | `text-2xl` |

⚠️ **Ochiq savol:** `text-base` (16px, 64 marta) shkalada roli yoʻq. Yo rol
beriladi («keng yuza asosiy matni»), yo 14px ga koʻchiriladi. Hal qilinmagan.

Eslatma: `--typo-*` oʻzgaruvchilari orqali kontekstli shkala mexanizmi
allaqachon bor (`globals.css` `.readable-scale`, `src/styles/surfaces.css`) —
yangi shkala shuning ustiga quriladi, yonига emas.

### 2.2 Boʻshliqlar — qadam soni qisqartiriladi va NOMLANADI

4px toʻri. Ruxsat: `0 · 0.5(2) · 1(4) · 1.5(6) · 2(8) · 3(12) · 4(16) ·
6(24) · 8(32)`. Taqiq: `2.5 · 3.5 · 5 · 7`.

Har qadamga vazifa biriktiriladi — oʻlchamni emas, **rolni** tanlaysiz:

| Rol | Qiymat |
|---|---|
| Karta ichidagi matn qatorlari | `gap-0.5` (2) |
| Yonma-yon belgilar, badge ichi | `gap-1` (4) |
| Ikona ↔ matn | `gap-1.5` (6) |
| Bir qatordagi boshqaruvlar · zich karta paddingi | `gap-2` · `p-2` (8) |
| Karta ichidagi bloklar · karta paddingi | `gap-3` · `p-3` (12) |
| Panel ichidagi bloklar · panel paddingi · panel ↔ panel | `gap-4` · `p-4` (16) |
| Sahifa boʻlimlari · hero | `gap-6` · `p-6` (24) |
| Sahifa yuqori/quyi chegarasi | `gap-8` (32) |
| Chip / badge | `px-2 py-0.5` |

### 2.3 Darvoza — busiz ishlamaydi

`DESIGN.md` da qoida allaqachon yozilgan edi va 181 marta buzildi, chunki
**hujjat hech narsani toʻxtatmaydi**. Loyihada naqsh tayyor: `prebuild` da
uchta tekshiruv turibdi (`check-server-actions`, `check-school-grouping`,
`check-migrations`).

Toʻrtinchisi: **`scripts/check-design-tokens.mjs`** — `text-[Npx]`,
taqiqlangan qadamlar va `font-bold` ni sanaydi.

Muhim: boshida **xatolik emas, hisoblagich**. Bugungi son bazaviy qiymat
sifatida faylga yoziladi va u faqat **kamayishi** mumkin (ratchet). Yangi
kod toza yoziladi, eski kod vaqt bilan tozalanadi, hech kim bir haftalik
migratsiyaga majbur boʻlmaydi.

---

## 3. Bosqichlar

| | Nima | Fayllar |
|---|---|---|
| 1 | `@theme` da `text-xs/sm/lg/2xl` shkalaga bogʻlanadi + `.text-event` qoʻshiladi | `globals.css`, `DESIGN.md` §3 |
| 2 | `DESIGN.md` ga yangi §3.5 «Boʻshliq shkalasi» — rollar jadvali | `DESIGN.md`, `docs/design-system.md` |
| 3 | `check-design-tokens.mjs` + `prebuild`, bazaviy son bilan | `scripts/`, `package.json` |
| 4 | `EventCard` — birinchi mijoz, namuna sifatida koʻchiriladi | `src/components/calendar/EventCard.tsx` |

1 va 2 mustaqil, parallel ketishi mumkin. 3 — ulardan **keyin** (aks holda
darvoza oʻz-oʻzini yiqitadi). 4 — tekshiruv.

---

## 4. RAD ETILGAN takliflar

Yozib qoʻyilyapti, chunki qayta koʻtarilishi mumkin.

- **Soat balandligini 180px dan 72px ga tushirish.** Taklif qilingan edi:
  hozirgi zichlikda noutbuk ekraniga oʻquv kunining yarmi ham sigʻmaydi va
  45 daqiqalik blok ichida ~90px boʻsh maydon qoladi. **Foydalanuvchi
  hozirgi zichlikni maʼqul koʻrdi** — oʻzgartirilmaydi.
- **Mobil koʻrinishni haftadan bitta kun ustuniga oʻtkazish.** 375px enida
  6 ustunga 62px dan tushadi. Hozircha koʻtarilmaydi.

---

## 5. Aloqador, lekin alohida ish

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
