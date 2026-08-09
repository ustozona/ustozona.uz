# Demo, shablon va mock ma'lumotlar — uchtasi, va ular BIR XIL EMAS

Ustozonada «haqiqiy bo'lmagan» ma'lumot uch xil ko'rinishda uchraydi.
Ular tashqaridan bir xil ko'rinadi, lekin **qayerda yashashi** va
**bazaga tegishi** butunlay boshqacha. Bu hujjat 2026-08-09 da yozildi:
o'sha kuni farqni bilmaslik ikki marta muammo keltirdi (pastda).

| | qayerda yashaydi | bazaga yoziladimi | kimga ko'rinadi |
|---|---|---|---|
| **1. Tur demosi** | kodda | **yo'q** | bo'sh hisobda, tur ochilganda |
| **2. Yangi hisob shabloni** | **bazada** | **ha** | har bir yangi o'qituvchida |
| **3. `demo@ustozona.uz`** | eski Neon bazasida | ha (o'sha bazada) | hech kimga — sinov hisobi |

---

## 1. Tur demosi — ko'rsatiladi, lekin YOZILMAYDI

Yangi o'qituvchi bo'lim turini ochganda panellar bo'sh bo'lsa, tur
ma'nosini yo'qotadi. Shuning uchun tur davomida bo'sh panellar namunaviy
sinf/o'quvchi bilan to'ldiriladi.

**Manba:** `src/components/tour/*-tour-demo.ts` (10 fayl) va
`src/components/tour/mocks/` (4 ta interaktiv namuna).

**ID'lari doim `demo-` bilan boshlanadi:** `demo-cl-1`, `demo-gr-s3`,
`demo-attendance-cl-2`, `demo-tt-e5` …

**Nomlari:** Matematika 7-A · Ona tili 8-B · Fizika 9-A · Ingliz tili 6-D.
O'quvchilar faqat bosh harflar bilan (AB, DC, EF).

### Nega bazaga tushmaydi

Har sahifa uni shu shart bilan chizadi:

```ts
const isDemoMode = tourActive && Object.keys(classDataMap).length === 0;
const demoClasses = useMemo(() => (isDemoMode ? makeClassesTourDemo() : null), [isDemoMode]);
```

Ya'ni: **faqat hisob bo'sh bo'lganda**, `useMemo` bilan xotirada, hech
qanday store setter'iga uzatilmasdan. Ustiga `TourDemoBanner` chiqadi.
Real ma'lumoti bor o'qituvchi buni umuman ko'rmaydi.

Tekshirildi (2026-08-09, prod bazada): `demo-%` ID'li qatorlar —
`classes` 0, `students` 0, `attendance_records` 0, `bot_classes` 0.

> ⚠️ Yangi demo qo'shsangiz shu naqshni buzmang: demo ma'lumotni
> store'ga yozadigan yo'l ochilsa, u real ma'lumotga aylanadi va
> `demo-…` ID bazaga tushadi.

---

## 2. Yangi hisob shabloni — HAQIQIY qatorlar

Mana bu «mock» emas. Ro'yxatdan o'tgan **har** o'qituvchiga avtomatik
yaratiladi va darhol uning **o'z ma'lumotiga** aylanadi: tahrirlaydi,
ballarini o'zgartiradi, o'chiradi.

| nima | nechta | yozuvchi kod |
|---|---|---|
| Xulq ko'nikmalari | 10 | `src/lib/behavior-data.ts` → `DEFAULT_SKILL_DEFS` |
| Xulq mukofotlari | 4 | `DEFAULT_REWARD_DEFS` |
| Xulq avto-sozlamalari | 1 | `src/server/dal/behavior.ts` → `seedDefaults()` |
| O'quv yili kalendari | 1 | `useCalendarStore` (joriy sanadan yasaydi) |
| «Dastlabki jadval» versiyasi | 1, bo'sh | `useTimetableStore.ts` → `seedIfEmpty()` |

`seedDefaults()` faqat to'rt jadval ham bo'sh bo'lganda ishlaydi.

### ⚠️ ID'lar o'qituvchiga bog'langan

```ts
export function defaultSkillId(slug: string, teacherId: string) {
  return `bhs-${slug}-${teacherId}`;
}
```

Bu **ko'chirishda tuzoq**: bir xil ko'nikma ikki bazada ikki xil ID
oladi, `ON CONFLICT DO NOTHING` ularni bir xil deb tanimaydi.

---

## 3. `demo@ustozona.uz` — eski Neon bazasidagi sinov hisobi

Ishlab chiqish jarayonida qo'lda to'ldirilgan test hisobi: 11 sinf
(beshtasi bo'sh), 75 o'quvchi (o'ylab topilgan ismlar), 1350 davomat,
666 xulq hodisasi.

**Supabase'da YO'Q** — 2026-08-05 dagi ko'chishda olib kelinmagan va
ataylab olib kelinmayapti (loyiha hamkorining talabi: sinov ma'lumoti
real ma'lumot bilan aralashmasin). To'liq nusxasi Neon zaxirasida
saqlanadi.

Tekshirildi: `"user"` jadvalida `demo|test|mock` bo'yicha 0 qator;
LessonLab tomonida ham (`bot_users`, `bot_classes`) 0.

---

## Nima uchun bu hujjat bor — ikkita real hodisa

**2026-08-09, Otabek Abdusattorovning ma'lumotini Neon'dan ko'chirish.**

1. **Takror standart to'plam.** Ko'chirishdan keyin uning ko'nikmalari
   10 emas, **20** ta bo'lib qoldi. Sabab 2-kategoriya: Supabase hisob
   ochilganda o'z 10 tasini yaratgan, Neon'dan yana 10 tasi kelgan, ID
   esa `bhs-{slug}-{teacherId}` bo'lgani uchun har xil. Neon nusxasi
   o'chirildi — bu bazada kanonik ID Supabase'niki.

2. **Davomat ko'rinmadi.** Hisob ochilganda `seedIfEmpty()` va kalendar
   **2026–2027** o'quv yilini yaratgan (avgustda joriy kalendar keyingi
   yilni beradi). Otabekning ishi esa 2025–2026 yiliga tegishli. Davomat
   ustunlari faol o'quv yili oralig'idan chiqarilgani uchun
   (`AttendanceView` → `deriveLessonDays`) jadval **bo'sh** ko'rinardi —
   4202 yozuv joyida turgani holda. Faol yil almashtirilgach tuzaldi.

**Xulosa:** boshqa bazadan ma'lumot ko'chirayotganda 2-kategoriyani
oldindan hisobga oling — maqsad hisobda **allaqachon** shablon qatorlar
bor. Va tekshiruvni faqat SANOQ bilan qilmang: «Neon 1 : Supabase 1»
degan natija ikki BOSHQA qator bo'lishi mumkin. ID yoki mazmun bo'yicha
solishtiring.

---

## Yo'l-yo'lakay: ishlatilmayotgan mock

`src/lib/journal-data.ts` → `JOURNAL_ENTRIES` (refleksiv kundalik
namunalari). Eksport qilingan, lekin hech qayerda import qilinmaydi —
qoldiq kod.
