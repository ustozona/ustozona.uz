# Ustozona EMS — Mantiq va ma'lumot modeli

> Bu hujjat loyihaning **mantig'ini va ma'lumot modelini** (entities + bog'lanishlar) jamlaydi.
> Backend hozir yozilmaydi — butun loyiha frontendда tugagandan keyin yoziladi.
> Bu — o'sha paytда tayyor bo'lishi uchun kelishilgan **spetsifikatsiya**.
> Maydon nomlari ingliz tilida (kod uchun), izohlar o'zbekcha.

---

## 1. Maqsad va prinsiplar

- Bu **yuqoridan boshqariladigan** maktab tizimi EMAS. Admin darslarni tayinlamaydi.
- Bu — **o'zini tizimli tutmoqchi bo'lgan o'qituvchilar uchun vosita**.
- **Yolg'iz ishlash birinchi (solo-first):** bitta o'qituvchi maktabsiz hammasini ishlata oladi.
- **Maktab — ixtiyoriy umumiy ish maydoni:** 2-3 o'qituvchi birga ishlatishi mumkin; biri admin.
- **Har o'qituvchi o'z jadvalini o'zi quradi.** Admin faqat umumiy resurslarni tayyorlaydi.

---

## 2. Rollar va hamkorlik (3-yo'l — yengil rollar)

- Maktabni **yaratgan** o'qituvchi — **admin**.
- Admin **boshqa o'qituvchilarni ham admin qila oladi** (bir necha admin bo'lishi mumkin → yagona-nuqta-xavfi yo'q).
- **Admin(lar)** umumiy resurslarni boshqaradi: `Class`, `Student`, `Division`/`Subgroup`, `BellSchedule`.
- **Oddiy o'qituvchi**: umumiyni faqat **o'qiydi**; o'z `TeachingUnit`, `TimetableEntry`, jurnal/davomat/bahosini **to'liq o'zi** boshqaradi.
- O'qituvchi maktabga **taklif kodi** orqali qo'shiladi (tafsilot keyin).

| Amal | Admin | Oddiy o'qituvchi |
|---|---|---|
| Sinf/o'quvchi/bo'linish/qo'ng'iroq qo'shish-tahrirlash | ✅ | ❌ (faqat ko'radi) |
| Boshqani admin qilish | ✅ | ❌ |
| O'z dars birligi + jadvali | ✅ | ✅ |
| O'z jurnali/davomati/bahosi | ✅ | ✅ |
| O'quvchiga izoh yozish | ✅ | ✅ |

---

## 3. Entitilar va bog'lanishlar

### School (maktab) — ixtiyoriy
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| name | string | "1-son maktab" |
| createdBy | teacherId | yaratuvchi (boshlang'ich admin) |

### Teacher (o'qituvchi / user)
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| name, email, … | | akkaunt |
| schoolId | id? | null bo'lsa — yolg'iz ishlaydi |
| role | "admin" \| "teacher" | maktab ichidagi roli |

> Yolg'iz o'qituvchi: `schoolId = null` yoki o'zi yaratgan "shaxsiy" maktab; o'zi admin.

### Class (sinf-guruh, masalan 9-A) — UMUMIY
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| schoolId | id | |
| name | string | "9-A" |
| grade | number? | 9 |
> Admin yaratadi. Bu — o'quvchilarning **to'liq guruhi** (fan biriktirilmagan).

### Student (o'quvchi) — UMUMIY
| Maydon | Tip | Izoh |
|---|---|---|
| id (`studentId`) | id | **barqaror** — izoh/davomat/baho shunga bog'lanadi |
| classId | id | qaysi sinf-guruhga tegishli |
| name | string | |
> Umumiy ro'yxat: 9-A ni o'qitadigan barcha o'qituvchilar shu ro'yxatni ko'radi.

### Division (bo'linish) — sinfni kichik guruhlarga bo'lish usuli
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| classId | id | qaysi sinf |
| name | string | "Til bo'linishi", "Informatika bo'linishi" |
> Bir sinfning **bir necha bo'linishi** bo'lishi mumkin (bir xil ham, har xil ham).

### Subgroup (kichik guruh, 1-guruh/2-guruh)
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| divisionId | id | qaysi bo'linishga tegishli |
| name | string | "1-guruh", "2-guruh" |

### StudentSubgroup (o'quvchi ↔ kichik guruh) — ko'p-ko'p
| Maydon | Tip | Izoh |
|---|---|---|
| studentId | id | |
| subgroupId | id | |
> Bir o'quvchi har bo'linishда boshqacha guruhда bo'lishi mumkin
> (masalan "Til"да 1-guruh, "Informatika"да 2-guruh).

### TeachingUnit (dars birligi) — o'qituvchiNИКИ; chapdagi sidebar kartasi
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| teacherId | id | egasi |
| classId | id | qaysi sinf-guruh |
| subgroupId | id? | null = butun sinf; aks holda — aniq kichik guruh |
| subject | string | "Matematika", "Ingliz tili" |
| color | ClassColor | dizayn rangi |
> Misol: "9-A Matematika" (subgroupId=null) yoki "9-A · 1-guruh · Ingliz tili".
> Davomat/baho shu birlikning nishonidan (butun sinf yoki kichik guruh) keladi.

### TimetableEntry (jadval yozuvi) — katakka qo'yilgani
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| teachingUnitId | id | qaysi dars birligi |
| dayOfWeek | 1–6 | 1=Dushanba … 6=Shanba |
| startMin | number | 00:00 dan daqiqa |
| endMin | number | |
| kind | "lesson" \| "club" | oddiy dars yoki erkin-vaqtli to'garak |
> **Takrorlanuvchi haftalik shablon** — sana yo'q. (4-bo'limga qarang.)

### TimetableException (istisno) — sana bo'yicha farq
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| teacherId | id | kimning jadvalida |
| date | date | aniq sana |
| type | "holiday" \| "cancel" \| "move" | bayram / bekor / ko'chirish |
| entryId | id? | qaysi yozuvga tegishli (move/cancel) |
| newStartMin, newEndMin | number? | "move" uchun |
> Shablon + istisnolar = real hafta (4-bo'lim).

### BellSchedule / BellConfig (qo'ng'iroq jadvali) — UMUMIY (maktabники)
| Maydon | Tip | Izoh |
|---|---|---|
| schoolId | id | |
| profile | "single" \| "double" | 1 yoki 2 smena |
| shift1, shift2 | ShiftConfig | har smena parametrlari |

**ShiftConfig:** `startMin`, `lessonCount`, `lessonMin` (45), `breakMin` (oddiy tanaffus, 5), `longBreakAfter` (3-darsdan keyin), `longBreakExtraMin` (katta tanaffus qo'shimchasi).
> Period qatorlari ("1-soat", "2-soat" …) shu sozlamadan HOSIL qilinadi.

### StudentNote (o'quvchi izohi)
| Maydon | Tip | Izoh |
|---|---|---|
| id | id | |
| studentId | id | kim haqida (**barqaror studentId**) |
| authorTeacherId | id | kim yozdi |
| text | string | |
| createdAt | datetime | |
> Bir o'quvchiga **bir necha o'qituvchi** izoh yozishi mumkin (umumiy o'quvchi → umumiy kuzatuvlar).

### Kelajak (sanali — jurnal uchun)
- **Lesson** (dars nusxasi): `teachingUnitId`, `date`, `startMin`, `topic` — shablon+istisnodan hosil bo'ladi.
- **Attendance** (davomat): `lessonId`, `studentId`, `status` (bor/yo'q/kech).
- **Grade** (baho): `lessonId` (yoki classId+date), `studentId`, `value`.

---

## 4. Jadval mantig'i: shablon + istisnolar (B = 3-variant)

- Jadval — **muhr** kabi: bitta haftalik naqsh har haftaga bosiladi (`TimetableEntry`, sanasiz).
- Ko'p haftalar bir xil → naqshни bir marta saqlaymiz.
- Ba'zi kun boshqacha → faqat **farqни** (`TimetableException`) saqlaymiz, butun haftani emas.

**Misol:**
- Shablon: "Dushanba 08:00 — 9-A Matematika".
- Istisno: `2026-05-13 = holiday` → o'sha kunги darslar yashiriladi (boshqa haftalar tegilmaydi).
- Istisno: `2026-05-14 08:00 → 10:00 move` → faqat o'sha sana ko'chadi.

**Rejalashtiruvchi** real haftani: `shablon → istisnolarni qo'llash` orqali hosil qiladi.

---

## 5. Jadval → Jurnal/Davomat/Baho zanjiri (C)

1. **TimetableEntry** (reja): 9-A · Dushanba · 08:00 · Matematika.
2. → Aniq sanada **Lesson** (dars nusxasi): 2026-05-11 09-A Matematika.
3. → O'sha dars uchun: **topic** yoziladi, **Attendance** belgilanadi, **Grade** qo'yiladi.

> Jadval — **asos (backbone):** Jurnalga "qaysi sinf, qachon, qaysi o'quvchilar" ekanini aytadi.
> Katakдаги "Jurnal →" havola — shu darс jurnalини ochadi.
> Davomat/baho ro'yxati `TeachingUnit` nishonidан keladi (butun sinf yoki kichik guruh).

---

## 6. To'qnashuv qoidalari (D)

- **Bitta o'qituvchi bir vaqtда ikki darсда bo'lolmaydi** → `(teacherId, dayOfWeek, startMin)` bo'yicha bitta yozuv (UI'да: katakka bitta dars birligi).
- **To'garaklar** (kind="club") erkin, lekin bir-biriga to'qnashsa — **ogohlantirish** (qattiq taqiq emas).
- **Kelajak (multi-teacher):** xona/resurs to'qnashuvi qo'shiladi (hozir kerak emas).

---

## 7. Hozirgi frontend → backend mapping

Hozir hammasi `localStorage`да (mock):

| Hozir (localStorage / fayl) | Kelajak (backend) |
|---|---|
| `murabbiyona-timetable-events` | `TimetableEntry` (+ `kind`) |
| `murabbiyona-bell-config-v1` | `BellSchedule` (schoolId bilan) |
| `lib/classes-data.ts` (mock CLASSES) | `Class` + `TeachingUnit` ga **ajraladi** |
| `murabbiyona-timetable-overrides-v1` | `TeachingUnit` (rang/nom) |
| `murabbiyona-timetable-custom-classes-v1` | `Class` / `TeachingUnit` |

**Muhim o'zgarish:** hozir "sinf" deganда fan ichiga qotirilgan ("5-A Informatika").
Backendда **`Class` (9-A, umumiy guruh)** va **`TeachingUnit` (fan, o'qituvchиники)** ajraladi.
Har bir yozuvga **egasi** (`teacherId` / `schoolId`) boshidan qo'shiladi (solo bo'lsa ham).

---

## 8. Kelishilgan qarorlar (qisqa)

- **A (qamrov):** multi-teacher + ixtiyoriy maktab; solo-first; egasi (owner) boshidan.
- **B (jadval):** shablon + istisnolar.
- **C:** jadval → dars nusxasi → jurnal/davomat/baho.
- **D (to'qnashuv):** (o'qituvchi, kun, vaqt) bo'yicha bitta dars; to'garaklarда ogohlantirish.
- **Rollar:** 3-yo'l (bir necha admin bo'lishi mumkin).
- **Kichik guruh:** `Division` (bo'linish) — bir xil ham, har xil ham bo'lishi mumkin.
- **O'quvchi izohi:** barqaror `studentId` ga, bir necha o'qituvchi yozadi.

---

*Bu hujjat ushbu suhbatда kelishilgan qarorlarni aks ettiradi. Yangi qarorlar bo'lsa, shu yerга qo'shib boriladi.*
