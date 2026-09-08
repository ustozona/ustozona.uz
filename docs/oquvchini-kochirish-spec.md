# Oʻquvchini boshqa sinfga koʻchirish

Holat: 1–4-qadam bajarildi (2026-09-08). 5-qadam (sudrab tortish) qoldi.

## 1. Muammo

Falonchi oʻtgan yili 5-A da oʻqigan, bu yil 6-B ga (oʻtgan yilgi 5-B)
oʻtdi. Ilovada bu amalni bajarib boʻlmaydi.

Sabab: `enrollments` — bola ↔ sinf koʻp-koʻpga bogʻlanishi, va uning
YAGONA maʼnosi «hozir shu guruhda oʻqiydi». Ikkita yozilish = bola ikkala
sinfda ham oʻqiyapti. «Ilgari u yerda edi, endi bu yerda» degan holatni
model umuman ifodalay olmaydi.

### ⛔ Qoʻlda «oʻchirib-qoʻshish» maʼlumotni yoʻq qiladi

`detachOrDeleteStudents` (`dal/grades.ts`) oʻquvchini sinf roʻyxatidan
olib tashlaganda uning yozilishlarini **oʻqituvchining barcha
sinflaridan** birdan uzadi. Agar hech qayerda yozilish qolmasa —
`students` qatorining oʻzi oʻchiriladi, FK cascade esa uning butun
bahosi va davomatini olib ketadi.

Yaʼni «5-A dan chiqarib 6-B ga qoʻshaman» qadamlari orasida bola
butunlay yoʻqoladi. Koʻchirish shu bois ATOMAR amal boʻlishi shart.

## 2. Qaror

**Yozilish oʻchirilmaydi — sana bilan YOPILADI.**

```
enrollments
  + started_at  text  "YYYY-MM-DD"  null = boshidan (eski yozuvlar)
  + ended_at    text  "YYYY-MM-DD"  null = ochiq, hozir oʻqiydi
```

Koʻchirish = bitta tranzaksiyada eski yozilishga `ended_at`, yangi
sinfga `started_at` bilan yangi yozilish. Bola hech qachon «yozilishsiz»
holatga tushmaydi, demak oʻchirilish xavfi yoʻq.

### Nega sana, oʻquv yili id'si emas

`academic_years` jadvali **oʻqituvchiga** bogʻlangan (`teacher_id`),
`enrollments` esa ish maydoniga. Yozilishga `academic_year_id` FK qoʻyish
uchun avval butun oʻquv yili modelini maydon darajasiga koʻtarish kerak
boʻlardi. Sana ikkala modelga ham bogʻlanmaydi va oʻrta yilda koʻchishni
ham (dekabrda boshqa sinfga oʻtgan bola) toʻgʻri ifodalaydi.

### Tarix eski sinfda qoladi

Baho va davomat `student_id` ga bogʻlangan, `enrollments` ga emas —
demak ular koʻchirishda umuman qimirlamaydi. 5-A ning oʻtgan yilgi
jurnalida Falonchi va uning baholari joyida turadi; 6-B da esa faqat
koʻchgan sanadan keyingi ustunlar.

Buning uchun roster soʻrovi ochiq yozilishlar bilan cheklanmasligi kerak
— pastdagi §4 ga qarang.

## 3. Server

Yangi amal: `moveStudentsAction(studentIds, fromClassId, toClassId, date)`
— `server/actions/grades.ts` da, DAL'i `dal/student-move.ts`.

Bitta tranzaksiya:

1. `enrollments` da `(fromClassId, studentId)` qatoriga `ended_at = date`.
2. `(toClassId, studentId)` ga `started_at = date` bilan insert
   (`onConflictDoUpdate` — bola allaqachon u yerda boʻlsa `ended_at` ni
   tozalaydi, yaʼni qaytib kelishi ham ishlaydi).

⚠️ Bu amal **snapshot sync'dan oʻtmaydi.** Store butun sinf roʻyxatini
yuborib «kelmagani oʻchirilsin» tamoyilida ishlaydi — koʻchirish oʻsha
yoʻlga tushsa eski yozilish yopilmay, oʻchiriladi. Alohida amal, oʻz
action'i bilan; muvaffaqiyatdan keyin store qayta yuklanadi.

### Ruxsat

- Oddiy oʻqituvchi: `fromClassId` ham, `toClassId` ham `taughtClassIds()`
  ichida boʻlishi shart.
- Maktab admini: maydon boʻylab chegarasiz.
- `visibleClassIds("data")` YETARLI EMAS — admin koʻrishi bilan
  oʻzgartirishi bir xil narsa emas (§11.6).

## 3.1. Qaysi sinflar orasida — DARAJA qoidasi

Koʻchirish ixtiyoriy ikki sinf orasida emas:

1. **Daraja bir xil boʻlishi shart.** 7-sinf oʻquvchisini 6-sinfga
   koʻchirish sinf almashish emas, bolani bir yil pastga tushirish — bu
   boshqa qaror va boshqa hujjat.
2. **Darajasiz guruh (`grade = null`) qatnashmaydi** — na manba, na
   maqsad. Toʻgarak yoki qoʻshimcha darsdan «koʻchirish» maʼnosiz: bola
   toʻgarakni tashlab matematikaga oʻtmaydi, u toʻgarakdan CHIQADI,
   sinfda esa qolaveradi. Bu qoʻshish/chiqarish amali.

Qoida **serverda** — `assertSameGrade` (`dal/student-move.ts`).
Interfeys uni takrorlamaydi, balki bajarib boʻlmaydigan tanlovni
koʻrsatmaydi: roʻyxat darajaga filtrlanadi, darajasiz sinfda esa menyu
bandi umuman chiqmaydi (`canMove`).

⚠️ Faqat interfeysda filtrlash YETARLI EMAS edi — amal server action
orqali ochiq turadi, yaʼni tekshiruv faqat u yerda boʻlsa qoida
tavsiyaga aylanadi.

`grade` faol oʻquv yiliga proyeksiya qilingan qiymat (rollover uni
joyida yangilaydi, tarixi `gradeByYear` da) — ikkala sinf ham bir xil
yoʻldan oʻtgani uchun solishtirish toʻgʻri.

❓ **Ochiq savol — sinfda qoldirish.** Hozirgi qoida qatʼiy, yaʼni
oʻquvchini pastki darajaga tushirib boʻlmaydi. Bu holat kerak boʻlsa
alohida amal sifatida qilinadi.

## 4. Roster oʻqilishi — eng nozik joy

Hozir roster shunchaki `enrollments` ni oʻqiydi. `ended_at` qoʻshilgach
har soʻrov «qaysi paytdagi roʻyxat» degan savolga javob berishi kerak:

| Joy | Nima koʻrsatiladi |
|---|---|
| Sinf roʻyxati, davomat olish, yangi topshiriq | faqat OCHIQ yozilishlar |
| Jurnal (baho jadvali) | ochiq + shu sinfda bahosi bor yopilganlar, «chiqib ketgan» belgisi bilan |
| Oʻquvchi profili | hamma yozilishlar, sana oraligʻi bilan |

Yopilgan yozilishni jurnaldan butunlay yashirib boʻlmaydi — aks holda
oʻtgan yilgi baholar egasiz qolib koʻrinmay ketadi, yaʼni §1 dagi
muammoning aynan oʻzi qaytadi.

Tegiladigan soʻrovlar: `dal/grades.ts:168`, `dal/baholash-sheets.ts:106`,
`dal/grades.ts:529` (oʻchirish qamrovi), `dal/lessonlab-import.ts:253`,
`dal/student-merge.ts:114`.

## 5. Interfeys

Uch joyda, bittagina umumiy `MoveStudentsDialog` bilan.

1. **Sinf roʻyxatidagi «⋮» menyu** — «Boshqa sinfga koʻchirish».
   Bittalab koʻchirishning tabiiy joyi.
2. **Oʻquvchilar sahifasi** (`students/page.tsx`) — qatordagi
   `DropdownMenu` ga oʻsha band. Sahifada belgilash (`selectedIds`)
   allaqachon bor, demak **koʻp oʻquvchini birdan** koʻchirish shu
   yerdan chiqadi: belgilangan bolalar ustidagi panelga tugma.
3. **Admin paneli** — ALOHIDA ekran KERAK EMAS (amalda tekshirildi).
   Maktab admini oddiy panelda ishlaydi va `role === "admin"` boʻlgani
   uchun `visibleClassIds("data")` unga butun maydonni beradi, `moveStudents`
   dagi `movableClassIds` esa koʻchirishni ham chegarasiz qiladi. Yaʼni
   yuqoridagi ikki joy admin uchun avtomatik maydon boʻylab ishlaydi.
   (`/admin` — Ustozona xodimlari paneli, boshqa narsa.)

Oynada: qayerdan → qayerga, sana (default — bugun), va tarix eski
sinfda qolishi haqida bir satr eslatma.

### Sudrab tortish

Oʻquvchilar sahifasida chap ustunda sinflar, oʻngda oʻquvchilar —
`@dnd-kit` allaqachon loyihada bor (`components/jadval/`). Bolani sinf
ustiga tashlash mumkin, LEKIN tashlangach **soʻralishi shart**:

> «Qoʻshilsinmi (ikkala sinfda oʻqiydi) yoki koʻchirilsinmi
> (5-A dan chiqadi)?»

Ikkala amal bir xil imo-ishora bilan boshlangani uchun, farqni
foydalanuvchi tasdiqlashi kerak — bu ikkisining oqibati juda har xil.

## 6. Ketma-ketlik

1. Migratsiya: ikki ustun (`ADD COLUMN`, ikkalasi ham nullable —
   qaytariluvchan, mavjud qatorlarga tegmaydi).
2. `dal/student-move.ts` + action + ruxsat testi.
3. §4 dagi roster soʻrovlari.
4. `MoveStudentsDialog` va uchta chaqiruv joyi.
5. Sudrab tortish — ⏸ HALI QILINMADI. Sabab: sinflar ustuni
   `components/ClassListPanel.tsx` orqali chiqadi va u 10+ sahifada
   ishlatiladigan MARKAZIY fayl. AGENTS.md 5-qoidasi boʻyicha bunday
   faylni yolgʻiz tahrir qilmaslik kerak — avval kelishiladi. Asosiy
   oqim usiz toʻliq ishlaydi.

⚠️ Prodda `db:migrate` ishlatilmaydi (migratsiya hash nomuvofiqligi) —
migratsiya prodga qoʻlda, alohida kelishilgan tartibda chiqadi.
