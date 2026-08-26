# Ish maydoni (workspace) arxitekturasi

> **Sana:** 2026-08-22 · **Holat:** 1-bosqich (server modeli) QURILDI, UI qolgan
> **Sabab:** bitta maktabda 2+ oʻqituvchi va bitta oʻquvchi ustida bir nechta
> oʻqituvchi ishlashi kerak. Boshida "shaxs qatlami" yamogʻi taklif qilingan
> edi — asoschi rad etdi, toʻgʻri arxitektura talab qilindi.

---

## 1. Yadro gʻoya

> **Yakka oʻqituvchi — bu aʼzosi bitta boʻlgan ish maydoni.**

"Yakka rejim" va "maktab rejimi" degan ikki xil tizim **yoʻq**. Bitta tuzilma,
faqat aʼzolar soni farq qiladi. Slack/Notion/GitHub naqshi: shaxsiy hisob ham
aslida bitta odamli tashkilot.

Kodda `if (isSchool)` kabi shart **hech qachon** paydo boʻlmasligi kerak —
bu yamoq qaytib kelganining birinchi belgisi.

**Foydalanuvchi tajribasi bosqichma-bosqich:**

| Bosqich | Nima boʻladi | Oʻqituvchi nimani koʻradi |
|---|---|---|
| Aziza opa yolgʻiz roʻyxatdan oʻtadi | Tizim jimgina uning ish maydonini yaratadi | Hech narsa — "maktab" soʻzi koʻrinmaydi |
| Laylo opa taklif qilinadi | Ikkalasi bitta maydonda | Hamkasb roʻyxati paydo boʻladi |
| 24-maktab rasman kiradi | Maydonga nom, direktor admin boʻladi | Admin paneli qoʻshiladi |

Hech bir bosqichda **qayta qurish yoʻq** — faqat aʼzo va rol qoʻshiladi.

---

## 2. Nega hozirgi model notoʻgʻri (va nega u xato emas edi)

Hozir bola **oʻqituvchiga** tegishli (`students.teacherId NOT NULL`). Ikki
oʻqituvchi bir bolani oʻqitsa — ikkita alohida bola yozuvi, tizim ularni
bogʻlay olmaydi.

⚠️ **Bu xato qaror emas edi.** Ustozona yakka oʻqituvchi quroli sifatida
boshlangan (Additio/iDoceo toifasi) — u yerda "bola oʻqituvchiniki" normal va
toʻgʻri. Model **bugun** notoʻgʻri boʻlib qoldi, chunki mahsulot maktab tomonga
qadam tashladi (roadmap: "Maktab admin-lite", "Ustozona Boshqaruv").

**Xalqaro standart** — OneRoster (IMS Global / 1EdTech), K-12 uchun SIS↔LMS
maʼlumot almashinuv standarti. Undagi model:

```
Org (maktab)
  ├── User (oʻquvchi va oʻqituvchi — BIR XIL tur)
  ├── Class (dars/kurs nusxasi)
  └── Enrollment (kim qaysi darsga yozilgan — oʻquvchi ham, oʻqituvchi ham)
```

⭐ Eng muhim jihati: **oʻqituvchining bolaga kirish huquqi egalikdan emas,
"biz bir darsdamiz" faktidan** kelib chiqadi.

---

## 3. ⭐ Oʻzak topilma — `teacherId` ning IKKI maʼnosi

Migratsiya hajmi boshida "21 fayl, ~200 joy" deb baholangan edi. **Notoʻgʻri
baho** — chunki bitta ustun nomi ikki xil maʼnoda ishlatilgan:

### 3.1. «Bu yozuv mening shaxsiy maydonimda» — ⛔ NOTOʻGʻRI, olib tashlanadi

| Ustun | Joy soni |
|---|---|
| `students.teacherId` | 8 |
| `classes.teacherId` | 14 |

Namuna bir xil va greplanadi: `eq(students.teacherId, tid)` /
`eq(classes.teacherId, tid)`.

### 3.2. «Bu yozuvni men yaratganman» — ✅ TOʻGʻRI, qoladi

`grades.teacherId` (bahoni kim qoʻygan) · `attendance_records.teacherId`
(davomatni kim belgilagan) · `student_notes.teacherId` (qaydni kim yozgan) ·
`attendance_statuses.teacherId` (kimning holatlar toʻplami) va h.k.

Bular **toʻgʻri modelda ham saqlanadi** — OneRoster'da ham natija oʻqituvchiga
va darsga bogʻlanadi. Bu mualliflik, ijara egaligi emas.

**Xulosa:** haqiqiy migratsiya — **22 ta joy, ~10 faylda**. Aynan shu ikki
maʼnoning bitta ustun nomida aralashib ketgani — arxitektura xatosining oʻzagi.

### 3.3. Mavjud tikuv

`src/server/session.ts` → `requireTeacher()` — **108 joyda** chaqiriladigan
yagona darvoza. Izohi: *"teacherId HECH QACHON clientdan olinmaydi — faqat shu
yerdan"*. Yaʼni qamrovni kengaytirish uchun kerakli nuqta **allaqachon bor**;
yangi seam ixtiro qilinmaydi, shu kengaytiriladi.

---

## 4. Maqsad model

```
workspaces              ish maydoni (yakka oʻqituvchi ham, maktab ham)
  ├── workspace_members     oʻqituvchi ↔ maydon (KOʻP-KOʻPGA) + rol
  ├── students              bola — MAYDONGA tegishli, oʻqituvchiga emas
  ├── school_classes        MAʼMURIY SINF: 7-A, 30 bola (§4.3)
  │     └── class_students     kim 7-A da
  └── classes  (mavjud)     DARS GURUHI: "7-A Ingliz 1-guruh" — oʻqituvchi oʻtadigan narsa
        ├── parentClassId      → school_classes (ixtiyoriy)
        ├── class_teachers     darsni kim oʻqitadi
        └── enrollments        qaysi bolalar shu guruhda
```

### 4.1. Koʻrinuvchanlik qoidasi

> Oʻqituvchi bolaning **maʼlumotini** koʻradi, **agar** oʻzi oʻqitadigan darsga
> oʻsha bola yozilgan boʻlsa.

Hozir bu qoida 22 joyga sochilgan. Maqsad modelda — **bitta funksiyada**.
Kengaytirish (masalan sinf rahbari) shu bitta joyda boʻladi.

#### Qisman umumiy sinflar — ishlaydi

Asoschi holati (22-avgust): *"X oʻqituvchi 6-A ga oʻtadi va bu sinfga Y
oʻqituvchi ham oʻtadi. Lekin X va Y ning umumiy boʻlmagan sinflari ham
boʻladi."*

```
24-maktab (ish maydoni)
├── 6-A ──┬── Matematika  → X        ← UMUMIY
│         └── Ingliz tili → Y
├── 7-B ──── Matematika  → X         ← faqat X
└── 8-C ──── Ingliz tili → Y         ← faqat Y
```

Qoida darsga bogʻlangani uchun bu **avtomatik toʻgʻri ishlaydi**: 6-A bolalarini
ikkalasi ham koʻradi; 7-B bolalarini Y koʻrmaydi (u hech bir darsda ularni
oʻqitmaydi). ⭐ Yaʼni **umumiy ish maydoni maʼlumotni avtomatik ochmaydi** —
aynan shuning uchun qoida "bir maydondamiz" emas, "bir darsdamiz" deb yozilgan.

#### ⭐ Ikki xil koʻrinuvchanlik — ism ≠ maʼlumot

Yuqoridagi holat ziddiyat ochadi: Y 6-A ga ingliz guruhini yaratishi uchun unga
**30 bolaning ismi** kerak, aks holda u 30 ta ismni qoʻlda qayta yozadi. Lekin
u hali ularni oʻqitmaydi.

| Nima | Kim koʻradi |
|---|---|
| **Ism** (maʼmuriy sinf roʻyxati) | Maydondagi hamma oʻqituvchi |
| **Maʼlumot** (baho, davomat, xulq, qayd) | Faqat oʻsha bolani oʻqitadigan |

Bu haqiqatga mos: maktabda istalgan oʻqituvchi 6-A da kim borligini bilishi
mumkin — bu sir emas. Sir — **bahosi va kuzatuvlari**.

⚠️ Demak `resolveVisibleStudentIds` ga **maqsad** parametri kerak:
`"roster"` (ism) va `"data"` (baho/davomat/qayd) turli natija qaytaradi.

#### 🔴 Imtiyoz oshirish xavfi

Agar oʻqituvchi istalgan darsga oʻzini oʻqituvchi qilib qoʻsha olsa, u
**oʻziga oʻzi ruxsat berib** istalgan bolaning maʼlumotini ochadi.

**Talab:** "kim qaysi darsni oʻtadi" — nazorat qilinadigan amal.
- Maktabda: admin belgilaydi
- Ikki hamkasb (adminsiz maydon): oʻzaro — ular allaqachon birga ishlashga
  kelishgan
- Repetitorlik: **alohida ish maydoni** (§4.2) — maktab hamkasblariga umuman
  koʻrinmaydi

⚠️ Bu tekshiruv **hamma joyda** qoʻllanishi kerak — jumladan qidiruv va
oʻquvchi tanlash oynalarida (picker). Bitta unutilgan picker butun qoidani
bekor qiladi.

### 4.2. Koʻp maydonlilik — qaror qabul qilingan

`workspace_members` **koʻp-koʻpga** (asoschi qarori 22-avgust). Sabab:
Oʻzbekistonda oʻqituvchi maktabda ishlab, kechqurun repetitorlik ham qiladi —
repetitorlik oʻquvchilari maktab hamkasblariga koʻrinmasligi kerak.

⚠️ Hozir `teachers.schoolId` — **yagona** FK. U almashtiriladi. Hozir arzon
(jadval deyarli boʻsh), keyin qimmat (butun maʼlumot koʻchiriladi).

UI: yuqorida maydon almashtirgichi.

### 4.3. ⭐ Ikki daraja: maʼmuriy sinf ↔ dars guruhi

Asoschi aniqlashtirdi (22-avgust): *"baʼzida bir sinfga, baʼzida boshqa-boshqa
sinflarga dars oʻtishadi. Baʼzida bir sinfni 2 guruhga boʻlib ham oʻtishadi —
ingliz tili, rus tili, informatika."*

Bu talab **ikki darajani majburiy qiladi**:

| Daraja | Nima | Misol |
|---|---|---|
| **Maʼmuriy sinf** | Bolalar guruhi — birga koʻchadigan, birga bitiradigan | 7-A, 30 bola |
| **Dars guruhi** | Oʻqituvchi aslida oʻtadigan narsa | "7-A Matematika" (30 bola) · "7-A Ingliz 1-guruh" (15 bola) · "7-A Ingliz 2-guruh" (15 bola) |

⭐ **Kodda javob yarim tayyor.** Hozirgi `classes` jadvalida **`subject` ustuni
bor** — yaʼni u allaqachon *dars guruhi*, "sinf" emas. Aziza opaning "7-A" si =
"7-A Matematika", Laylo opaniki = "7-A Ingliz tili". Ular alohida qatorlar.

**Shuning uchun migratsiya QOʻSHIMCHA (additive):**
- `classes` **oʻz maʼnosida qoladi** = dars guruhi. Unga `parentClassId`
  qoʻshiladi
- Yangi `school_classes` = maʼmuriy sinf (7-A)
- ✅ `grades`, `attendance_records`, `behavior_events` — hammasi `classId` ga
  bogʻlangan va **oʻzgarmaydi**. Ular dars guruhiga bogʻlanishi toʻgʻri:
  ingliz tili 1-guruh davomati 2-guruhnikidan alohida boʻlishi **kerak**

**Maʼmuriy sinf nima beradi:**
- Sinf rahbariga: "bugun 7-A dan kim kelmadi" (barcha guruhlar boʻyicha yigʻma)
- Yangi bola qoʻshilsa — barcha fan guruhlariga taklif qilinadi, 30 ta ism
  qayta yozilmaydi
- Yillik koʻchish: 7-A → 8-A, bolalar birga koʻchadi
- Hisobot: "7-A umumiy oʻzlashtirishi"

**UI — rejim almashtirgichisiz:**
- *Yakka oʻqituvchi:* "7-A Matematika" yaratadi, tizim orqasida maʼmuriy 7-A ni
  jimgina yaratadi. U **ikki darajani koʻrmaydi**
- *Maktab:* admin 7-A ni **bir marta** taʼriflaydi, oʻqituvchilar oʻz fan
  guruhini unga ulaydi

Tuzilma bir xil — farqi faqat maʼmuriy sinfni **kim yaratgani**. `if (isSchool)`
sharti paydo boʻlmaydi (§1).

⚠️ **Nomlash tuzogʻi:** UI hozir `classes` ni "Sinf" deb ataydi. Ikki daraja
kirgach atamalar ajratilishi kerak, aks holda "sinf" soʻzi ikki narsani
anglatib chalkashlik tugʻdiradi. Yakka oʻqituvchi uchun "Sinf" soʻzi
saqlanishi mumkin (u bitta darajani koʻradi).

### 4.4. Toʻgarak va darajasiz guruhlar

Asoschi holati (22-avgust): *"Eshmat Falonchi domlaning informatika sinfida ham
bor, toʻgaragida ham. Toʻgarakda 5-sinf ham, 6-sinf ham — istalgan sinfdan
oʻquvchi qoʻshsa boʻladi."*

Model buni **oʻzgarishsiz koʻtaradi**:
- Yozilish (`enrollments`) koʻp-koʻpga — bitta bola bitta oʻqituvchining **ikki
  guruhida** ham boʻla oladi
- `parentClassId` **ixtiyoriy** — toʻgarakda u yoʻq, aʼzolar turli maʼmuriy
  sinflardan yigʻiladi

Ikki darajaning foydasi aynan shu yerda: maʼmuriy sinf — bola **qayerdan**,
dars guruhi — u **nimaga** yozilgan. Bular bogʻliq emas.

#### Rasmiy ↔ qoʻshimcha: ALOHIDA BELGI YOʻQ

Boshida guruhga `type: rasmiy | qoʻshimcha` belgisi taklif qilingan edi
(jahon amaliyoti: kredit beruvchi ↔ kreditsiz kurs). **Asoschi rad etdi va
soddaroq yechim berdi:**

> Daraja tanlansa (5-sinf, 6-sinf…) — rasmiy. Darajasiz guruh ham xuddi
> alohida fandek: oʻz jurnali, oʻz davomati. Tabel esa **majburiy emas** —
> oʻqituvchi xohlasa chiqaradi.

⭐ **Nega bu kuchliroq:** belgi kerak boʻlgan yagona joy — yil oxiridagi
umumiy hisob (tabel). Yigʻish **avtomatik boʻlmasa**, belgi ham kerak emas —
oʻqituvchi tabel chiqarayotganda qaysi guruhlarni qoʻshishni oʻzi tanlaydi.

Tamoyil: *javobi keyin kerak boʻladigan savolni yaratish paytida berma.*
Oʻqituvchi yil oxirida toʻliq manzara bilan yaxshiroq qaror qiladi.

Bu **uchinchi holatni ham hal qiladi**: "qoʻshimcha dars" (toʻgarak emas,
oʻsha fanning oʻzi — darajasi bor, demak belgi boʻyicha "rasmiy" chiqardi,
lekin tabelga tushishi shart emas edi). Yigʻish qoʻlda boʻlgani uchun bu
ziddiyat yoʻqoladi.

✅ **Yangi ustun kerak emas** — `classes.grade` allaqachon mavjud va izohi
aynan shu holatni yozgan: *"null = toʻgarak kabi darajasiz guruh"*.

⚠️ Ochiq qoladi: maktab ish maydonida admin tabel tarkibini nazorat qilishni
xohlashi mumkin (oʻqituvchi emas). v1 da kerak emas — oʻqituvchi qaror qiladi.

---

## 5. Nima OʻZ-OʻZIDAN hal boʻladi

Yamoq variantida ochiq qolgan muammolar maqsad modelda yoʻqoladi:

| Muammo (avvalgi tanqidiy koʻrikdan) | Maqsad modelda |
|---|---|
| Davomat sinf darajasida, "kunlik fakt" yoʻq | Davomat darsga bogʻlanadi — chalkashlik yoʻq |
| Qaydni ulashish shaxs orqali hal qilinishi kerak | Bola bitta — qaydlar tabiiy ulashiladi |
| Ota-ona ilovasi: 1 bola = 3 ta bogʻlanish | 1 bola = 1 yozuv = 1 bogʻlanish |
| "shaxs orqali hal qilishni unutmaslik" doimiy soligʻi | Yoʻq — bitta bola bor |

---

## 6. Migratsiyadan OLDIN tuzatilishi shart

Avvalgi tanqidiy koʻrikda topilgan, maqsad modelga bogʻliq boʻlmagan xatolar:

- 🔴 **`applyStudentNotesBatch` oʻquvchi egaligini tekshirmaydi**
  (`src/server/dal/student-notes.ts`). Clientdan kelgan `studentId`
  tekshiruvsiz yoziladi. Bugun zarari kichik (qaydni faqat muallif oʻqiydi);
  qaydlar ulashilgan kuni — har kim istalgan bolaga qayd yozib qoʻya oladi.
- 🟠 **`teachers.school` (erkin matn) va `teachers.schoolId` (FK) — ikki manba.**
  Guruhlashda **hech qachon** matn maydoni ishlatilmasin.
- 🟠 **Client store "meniki/boshqaniki" ni ajratmaydi.** `useStudentNotesStore`
  yassi roʻyxat + butun roʻyxat diffi. Boshqa oʻqituvchi qaydi tushsa:
  tahrir jimgina rad etiladi (UI muvaffaqiyat koʻrsatadi), oʻchirish lokalda
  ishlaydi-yu serverda yoʻq → sahifa yangilanganda **arvoh yozuv** qaytadi.
  Server himoyasi yetarli emas — store darajasida oʻqish-uchun qism kerak.

---

## 7. Ochiq savollar (qaror kerak)

1. ~~**"Guruh" tushunchasi kerakmi?**~~ ✅ **HAL QILINDI 22-avgust** — ha,
   majburiy. Sabab va model: §4.3. Roadmap buni allaqachon "Kichik guruhlar
   (boʻlinmalar)" nomi bilan ⭐⭐⭐ deb belgilagan va "Maktab admin-lite +
   kichik guruhlar — bogʻliq juftlik" deb yozgan (§4.2, roadmap 4.2-boʻlim).

2. **Mavjud maʼlumot qanday koʻchadi?** Har oʻqituvchiga bitta maydon
   yaratiladi va uning sinf/oʻquvchilari oʻsha maydonga oʻtadi — bu avtomatik
   va xavfsiz. Keyin ikki oʻqituvchi birlashsa, **dublikat bolalarni
   birlashtirish** kerak boʻladi: avtomatik EMAS, ochiq tasdiq bilan, tarixi
   yozilib (xato birlashtirish qaytarilmas — maʼlumot koʻrilgan boʻladi).

3. **Oʻqishlar audit qilinadimi?** `admin_audit_logs` faqat admin
   mutatsiyalarini yozadi. Oʻqituvchi boshqa oʻqituvchi yozgan qaydni oʻqiy
   boshlagach, "bu bolaning qaydlarini kim koʻrgan" savoliga javob kerak
   boʻlishi mumkin. v1 uchun majburiy emas, lekin **modelga kiritilsin**.

4. **Sinf rahbari roli** — avvalgi qaror boʻyicha keyingi bosqich. Maqsad
   modelda bu `workspace_members.role` ga qoʻshimcha, alohida tizim emas.

---

## 8. Qurilgan holat (2026-08-22)

**1-bosqich — server modeli: ✅ TAYYOR** (branch `otabek/ish-maydoni`)

| Nima | Qayerda |
|---|---|
| `workspaces` | `src/server/db/schema/workspaces.ts` |
| `workspace_members` | `schema/workspace-members.ts` (aylanma import boʻlmasin uchun alohida) |
| `class_teachers`, `enrollments`, `classes.parentClassId` | `schema/classes.ts` |
| **Koʻrinuvchanlik seam'i** | `src/server/workspace.ts` — `visibleClassIds` · `visibleStudentIds` · `assertTeachesClass` · `assertCanTouchStudent` |
| Migratsiyalar | `drizzle/0034_ish_maydoni_qoshish.sql` (qoʻshish) + `0035_ish_maydoni_kochirish.sql` (koʻchirish + oʻchirish) |

**Ikki bosqichli migratsiya — nega shunday:** drizzle-kit bitta bosqichda
"bu ustun qayta nomlanganmi yoki yangimi?" deb interaktiv soʻraydi va
`teacher_id` ni maʼlumot koʻchirilishidan OLDIN oʻchirib yuborardi. 0034
faqat qoʻshadi (hammasi nullable), 0035 toʻldiradi va keyin oʻchiradi.

**Dev'da tekshirildi (Neon):** 8 oʻqituvchi → 8 maydon → 8 aʼzolik;
28 sinf va 374 oʻquvchi **yetimsiz** koʻchdi (`workspace_id IS NULL` = 0);
28 dars biriktirish va 374 yozilish yaratildi. `npm run build` ✅

**Yoʻl-yoʻlakay tuzatilgan:** §6 dagi 🔴 `applyStudentNotesBatch` teshigi —
endi `visibleStudentIds("data")` bilan filtrlanadi.

**UI — qurilgani:**
- **Maydon almashtirgichi** (`components/workspace-switcher.tsx`) — sidebar
  sarlavhasida. ⭐ Bitta maydonda UMUMAN koʻrsatilmaydi (§1 qoidasi).
- **«Roʻyxatdan» tugmasi** (`components/students/AddFromRosterDialog.tsx`) —
  sinf sahifasida. Mavjud bolani AYNAN oʻsha `id` bilan qoʻshadi, yaʼni
  server tomonda yangi `students` qatori emas, yangi **yozilish** boʻlib
  tushadi. Butun koʻp-oʻqituvchi gʻoyasining maʼnosi shu tugmada: busiz
  ikkinchi oʻqituvchi 30 ismni qayta yozadi va bola ikkiga boʻlinadi.
  Yakka oʻqituvchiga ham kerak — toʻgarak holati (§4.4).

**Dev'da tekshirilgan stsenariy** (tranzaksiyada, orqaga qaytarilgan):
X 6-A matematika va 7-B ni oʻtadi, Y faqat 6-A inglizni. Natija — X:
Bobur+Vali, Y: faqat Bobur (7-B bolasini koʻrmaydi), roʻyxat qamrovida
ikkalasi ikkala ismni koʻradi. Yaʼni §4.1 dagi qoida amalda ishlaydi.

### Qolgan ish

- ✅ `applyGradesBatch` oʻchirish teshigi (§10.5)
- ✅ Sinf egasi (§10.5a) · ✅ Taklif oqimi (§10.5b) · ✅ Admin roli (§11)
- 🔴 **Audit:** admin boshqaning maʼlumotini oʻqiganda yozuv YOʻQ (§7.3)
- 🔴 **Dublikat oʻquvchilarni birlashtirish** — ikki oʻqituvchi bir bolani
  alohida kiritsa (§7.2). ClassDojo bu haqda ataylab ogohlantiradi.
- **UI:** maʼmuriy sinfga guruh ulash (`parentClassId` UI'da hali yoʻq)
- 🔴 **Prod migratsiyasi (Supabase) — TOʻSIQ BOR, pastga qarang**
- §6 dagi qolgan ikki band: `teachers.school` matn maydonini guruhlashdan
  butunlay chiqarish, client store'da oʻqish-uchun qismni ajratish
- Qaydlarni ulashish (oʻqish filtrini olib tashlash) — ATAYLAB hali
  qilinmadi: avval bogʻlanishlar haqiqiy maktabda tekshirilsin

---

## 8a. 🔴 Prod migratsiyasi toʻsigʻi — LessonLab koʻrinishlari

**Prodda (Supabase) uchta koʻrinish oʻchirilayotgan ustunlarga tayanadi:**

| Koʻrinish | Nimaga tayanadi |
|---|---|
| `v_unified_classes` | `classes.teacher_id` |
| `v_unified_students` | `students.class_id` |
| `v_duplicate_candidates` | `classes.teacher_id`, `students.class_id` |

Ustiga `v_teacher_totals` birinchi ikkitasiga tayanadi.

⚠️ **Oqibat:** prodda `ALTER TABLE classes DROP COLUMN teacher_id` xato
beradi (*"cannot drop column because other objects depend on it"*).
Migratsiya yarim yoʻlda toʻxtaydi.

⛔ **`DROP ... CASCADE` ISHLATILMASIN** — u koʻrinishlarni jimgina
oʻchirib yuboradi va LessonLab integratsiyasi (`/admin/users` sanogʻi,
bot ↔ Ustozona bogʻlanishi) sezdirmasdan buziladi.

**Nega dev'da chiqmadi:** bu koʻrinishlar ham, ular tayanadigan bot
jadvallari (`bot_classes`, `bot_students`) ham Drizzle migratsiyalarida
YOʻQ — ular toʻgʻridan-toʻgʻri Supabase'da yaratilgan. Neon'da ular
umuman mavjud emas, shu bois 0035 u yerda muammosiz oʻtdi.

**Qadamlar (prodga chiqishdan oldin):**
1. Uchala koʻrinish yangi modelga qayta yozilsin: `uzc.teacher_id` →
   `class_teachers` orqali, `uzs.class_id` → `enrollments` orqali
2. Yangi taʼriflar migratsiya fayliga tushsin (hozir ular hech qayerda
   versiyalanmagan — bu alohida muammo)
3. `DROP VIEW` → `ALTER TABLE` → `CREATE VIEW` tartibida qoʻllansin
4. Zaxira: prodda avtomatik zaxira YOʻQ (`docs/backup.md`), shu bois
   migratsiyadan oldin `pg_dump` qoʻlda olinsin

**Yoʻl-yoʻlakay tuzatildi:** `listTeacherTotals` endi koʻrinish yoʻqligiga
chidamli (`to_regclass` bilan tekshiradi) — ilgari `/admin/users` lokalda
HAR DOIM yiqilardi, bu eski xato edi.

---

## 9. Nima QILINMAYDI

- ⛔ **Shaxs qatlami yamogʻi** (`school_students` + `students.personId`) —
  rad etildi. Sabab: oxiri yoʻq edi, notoʻgʻri model ustida abadiy yashardi.
- ⛔ **`grades`/`attendance`/`notes` dagi `teacherId` ni olib tashlash** — ular
  mualliflik, ular toʻgʻri (§3.2).
- ⛔ **Ikki xil kod yoʻli** ("yakka" va "maktab") — yadro gʻoyaga zid (§1).

---

## 10. Raqobat tahlili — ulashish modeli (2026-08-26)

Manba: ClassDojo Help Center «Shared Classes» va «Roles and Permissions»
boʻlimlari, Google Classroom Help, iDoceo forumi. Havolalar §10.5 da.

### 10.1. ClassDojo — ulashish birligi SINF, maydon emas

| Qoida | Tafsilot |
|---|---|
| Har sinfning bitta **egasi** bor | Sinfni yaratgan oʻqituvchi |
| Hamkasb qoʻshishni **faqat ega** qiladi | Co-teacher boshqasini taklif qila olmaydi |
| Co-teacher sinf ichida deyarli hamma narsani qiladi | Ball, ota-ona bilan yozishma |
| ⚠️ Har qanday oʻzgarish **hammaga** taʼsir qiladi | Biri ballarni nolladi — hamma uchun nollandi |
| Co-teacher **oʻzi chiqib keta oladi** | «Leave a shared class» |
| Egalik **oʻtkaziladi** | Eski ega chiqadi yoki co-teacher boʻlib qoladi |
| Hamkasblar **bir maktabda** boʻlishi shart | Affiliation talab qilinadi |

⭐ **Maktab rahbari alohida qatlam:** Directory orqali *istalgan* sinfga
hamkasb qoʻshadi, egalikni oʻtkazadi, ketgan xodimni oʻchiradi — **oʻsha
sinfga ulanmagan boʻlsa ham**. Alohida maqola bor: *«egasi yoʻq holda
egalikni qanday oʻtkazish»* — yaʼni ular «oʻqituvchi gʻoyib boʻldi»
holatini ataylab ishlab chiqishgan.

⭐ **Maktabga qoʻshilish momenti:** oʻqituvchi soʻrov yuborganda ekran
chiqadi — *«shaxsiy sinflaringizni maktabga koʻchiraymi?»*. Ogohlantirish
ham bor: **avval maktab tasdigʻini ol, keyin sinf yarat — aks holda
dublikat oʻquvchilar paydo boʻladi.** Oʻqituvchi bir necha maktabga aʼzo
boʻla oladi (bizdagi koʻp-koʻpga qarori bilan bir xil, §4.2).

### 10.2. Google Classroom — soddaroq

Co-teacher = toʻliq tenglik, faqat **uchta** taqiq: sinfni oʻchirish,
asosiy oʻqituvchini chiqarish, boshqa oʻqituvchini ovozsiz qilish.
Yaʼni ular ham asimmetriyani saqlagan, lekin minimal shaklda.

### 10.3. iDoceo / Additio — bizning toifa, yechilmagan

Yakka oʻqituvchi qurollarida haqiqiy co-teacher **yoʻq**. iDoceo
forumida oʻqituvchilar *«har darsdan keyin sinfni qayta ulashib, eskisini
oʻchiramizmi?»* deb soʻrashadi. ⭐ Demak bu bizning toifada **ochiq
maydon** — raqobat ustunligi boʻlishi mumkin.

### 10.4. Bizning model bilan solishtirish

✅ **Arxitekturamiz kuchliroq.** ClassDojo'da co-teacher sinfga ulanadi va
oʻsha sinfning hamma narsasini koʻradi. Bizda `class_teachers` aynan shu,
ustiga **ism ↔ maʼlumot ajratmasi** bor (§4.1) — ClassDojo'da bu yoʻq.

🔴 **Lekin uchta narsa yetishmaydi, uchalasi ham ClassDojo'da bor:**

**1. «Ega» tushunchasi yoʻq.** `class_teachers` — yassi toʻplam. Kim kimni
chiqaradi? Kim sinfni oʻchiradi? Javob yoʻq; ikki hamkasb bir-birini
chiqarib tashlashi mumkin. §4.1 «nazorat qilinadigan amal» deb yozgan va
maktabda buni admin qiladi — lekin **adminsiz maydonda nazoratchi yoʻq**,
hujjat «oʻzaro kelishadi» deb qoldirgan. ClassDojo bu boʻshliqni aynan
ega bilan toʻldirgan.

**2. Taklif oqimi umuman yoʻq.** Kodda `invite` soʻzi bitta ham yoʻq
(oʻqituvchi uchun; `student_invites` bor va u tayyor naqsh). Hozircha
faqat admin panel — yaʼni ikki oʻqituvchi hamkorlikni **boshlay
olmaydi**.

**3. Ega ketgan holat ishlanmagan.** `class_teachers` da
`onDelete: "cascade"` — oʻqituvchi oʻchsa biriktirish oʻchadi, sinf hech
kimga koʻrinmaydi, baholar bazada qoladi, UI orqali tuzatib boʻlmaydi.

### 10.5. 🔴 Yoʻl-yoʻlakay topilgan HAQIQIY xavf

`src/server/dal/grades.ts` (`applyGradesBatch`, ~455–464-qatorlar):

```ts
.delete(students).where(and(eq(students.workspaceId, ctx.workspaceId), inArray(students.id, part)))
.delete(classes).where(and(eq(classes.workspaceId, ctx.workspaceId), inArray(classes.id, part)))
```

Filtr **faqat `workspaceId`** — «men bu darsni oʻtamanmi?» tekshiruvi
yoʻq. Ikki oʻqituvchili maydonda: **B oʻqituvchining brauzeridagi store
sinxronizatsiyasi A oʻqituvchining sinfini va undagi hamma bahoni
oʻchirib yuborishi mumkin** — jimgina, tasdiqsiz, cascade bilan.

Eski modelda xavfsiz edi (`teacherId` filtri = faqat oʻzimniki).
Maydonga koʻchirilganda filtr kengaydi-yu, himoya kengaymadi. Bu
ClassDojo'ning *«biri nolladi — hamma uchun nollandi»* ogohlantirishining
buzuq versiyasi: ularda qaytariladigan amal, bizda qaytarilmas.

⛔ **Ikkinchi oʻqituvchi qoʻshilishidan OLDIN tuzatilsin.**

### 10.5a. ✅ Qurilgan — sinf egasi (2026-08-26)

`class_teachers.role` (`owner | teacher`) qoʻshildi, migratsiya
`0036_sinf_egasi.sql`. Mavjud biriktirishlar `owner` qilindi — bu paytda
har sinfda aynan bitta oʻqituvchi bor edi (0035 shunday yaratgan,
hamkasb qoʻshish oqimi esa hali yoʻq edi), demak taxmin xavfsiz.

⚠️ Ustun default'i ATAYLAB `teacher`: keyin qoʻshiladigan hamkasblar
tasodifan ega boʻlib qolmasin. Ega faqat sinf yaratilayotganda ochiq
beriladi.

**Qoidalar** (`src/server/dal/class-teachers.ts`):

| Amal | Kim |
|---|---|
| Hamkasb biriktirish | Ega yoki maydon admini |
| Hamkasbni chiqarish | Ega/admin, YOKI hamkasbning oʻzi |
| Egani chiqarish | ⛔ Hech kim — avval egalik oʻtkazilsin |
| Egalik oʻtkazish | Ega yoki admin (ClassDojo'da ham School Leader eganing roziligisiz qila oladi) |

⭐ Qoʻshishda **ikki** tekshiruv: chaqiruvchi ega/admin ekani **va**
qoʻshilayotgan odam shu maydon aʼzosi ekani. Ikkinchisisiz begona
`teacherId` yuborilib, maydondan tashqaridagi odamga bolalar maʼlumoti
ochilardi.

**Egasiz sinf qolmaydi:** ega ulashilgan sinfdan chiqsa (store
sinxronizatsiyasi orqali), eng eski qolgan hamkasb avtomatik ega
boʻladi. Aks holda sinf yetim qolardi — dars oʻtilaveradi, lekin hech
kim hamkasb qoʻsha olmaydi va sinfni oʻchira olmaydi, interfeys orqali
esa tuzatib boʻlmaydi.

**UI:** sinf sahifasi yon ustunidagi «Oʻqituvchilar» kartasi
(`components/classes/ClassTeachersCard.tsx`). ⭐ Yakka maydonda
**umuman koʻrsatilmaydi** — almashtirgich bilan bir xil qoida (§1).

### 10.5b. ✅ Qurilgan — hamkasbni taklif qilish (2026-08-26)

`workspace_invites` jadvali (`0037_hamkasb_taklifi.sql`) va **Sozlamalar
› Jamoa** boʻlimi.

⭐ **Nega kod, email emas:** bizda xat yuborish infratuzilmasi yoʻq, va
Oʻzbekiston maktabida hamkasblar baribir bir xonada — kodni ogʻzaki
yoki Telegram orqali berish tabiiyroq. `student_invites` da ham shu
naqsh tanlangan.

| Xususiyat | Qaror |
|---|---|
| Kod alifbosi | `0/O`, `1/I/L` yoʻq — ogʻzaki aytiladi |
| Amal muddati | 7 kun |
| Necha marta | **Bir marta** — ulashilgan havola qayta ishlatilmasin |
| Bekor qilish | `revokedAt` — qator **oʻchmaydi**, kim taklif qilgani tarixi qoladi |
| Rol | Taklif YOZILAYOTGANDA tanlanadi, qabul qilishda emas |

🔴 **Poyga himoyasi:** kod AVVAL band qilinadi (`usedAt` shart bilan
UPDATE), keyin koʻchirish bajariladi. Teskarisi boʻlsa koʻchirish
tugab, band qilish poygada yutqazsa — kod hali ham "ishlatilmagan"
boʻlib qolardi.

🔴 **Qabul qilish QAYTARILMAS:** oʻqituvchining sinf va oʻquvchilari
yangi maydonga koʻchadi, orqaga qaytmaydi (maktab oʻz yozuvlarini
saqlaydi). Shu bois avval `previewWorkspaceInvite` koʻrsatiladi —
qayerga, kim taklif qildi, qanday rol — va tasdiq soʻraladi.

⭐ **`moveTeacherToWorkspace` umumiy modulga chiqarildi**
(`dal/workspace-membership.ts`). Ilgari bu mantiq faqat
`assignTeacherToSchool` ichida edi; taklif oqimi uni takrorlasa, ikki
nusxa vaqt oʻtib ajralib ketardi. Tranzaksiyada beshta nozik qadam bor
(ish koʻchishi · eski aʼzoliklarni tozalash · shaxsiy maydonni tiklash ·
faol maydonni almashtirish), ular albatta bitta joyda turishi kerak.

### 10.6. Fors-major roʻyxati

| Holat | Hozir | Kerak |
|---|---|---|
| Oʻqituvchi boshqasining sinfini oʻchiradi | ✅ Tuzatildi — «ajrat yoki oʻchir» (§10.5) | — |
| Ega maktabdan ketdi | ✅ Egalik oʻtkazish bor; ega chiqsa voris avtomatik (§10.5a) | Admin UI (aʼzoni butun maydondan chiqarish) |
| Ikki oʻqituvchi bir bolani alohida kiritdi | Ikkita «Bobur» | Birlashtirish, ochiq tasdiq bilan (§7.2) |
| Yakka oʻqituvchi maktabga qoʻshildi | Qisman bor | «Sinflaringizni olib kelasizmi?» ekrani |
| Maktabdan chiqarildi | ✅ Aʼzolik oʻchadi, baholari qoladi (mualliflik, §3.2) | — |
| Oxirgi owner chiqib ketdi | Egasiz maydon | Oxirgi owner chiqa olmasin |
| Repetitorlik bolasi maktabga sizdi | ✅ Alohida maydon himoya qiladi (§4.2) | — |

### 10.7. Uch stsenariy — bitta tuzilma

Yadro gʻoya (§1) buzilmaydi; farq **faqat kim taklif qiladi**:

| | Yakka | Jamoa (2–5) | Maktab |
|---|---|---|---|
| Maydon | Avtomatik, koʻrinmaydi | Bittasi ochadi | Direktor ochadi |
| Hamkasb qoʻshish | — | **Sinf egasi** | **Admin** ham |
| Oʻquvchi qoʻshish | Oʻzi | Roʻyxatdan (bor) | Admin bir marta |
| Koʻrinuvchanlik | Hammasi oʻziniki | `data` = oʻz darsi | shu + admin istisnosi (§11.4) |

⭐ **Bitta yangi ustun** — `class_teachers.role` (`owner | teacher`) —
uch stsenariyni ham yopadi. Maktabda `workspace_members.role = admin`
egadan yuqori turadi; bu aynan ClassDojo'ning School Leader'i.

### 10.8. Manbalar

- https://help.classdojo.com/hc/en-us/articles/202027909-Share-Your-Class-with-Another-Staff-Member
- https://help.classdojo.com/hc/en-us/articles/24932272055181-Accessing-Your-Shared-Class-as-a-Co-teacher
- https://help.classdojo.com/hc/en-us/articles/207086796-Leave-a-Shared-Class
- https://help.classdojo.com/hc/en-us/articles/212393706-Transfer-a-Class-to-Another-Teacher
- https://classdojo.zendesk.com/hc/en-us/articles/360059779572-How-To-Transfer-Class-Ownership-without-the-Class-Admin
- https://help.classdojo.com/hc/en-us/articles/4418617407245-How-School-Leaders-Admins-Can-Add-Co-Teachers-to-Classes
- https://help.classdojo.com/hc/en-us/articles/207813176-What-Can-School-Leaders-See-and-Do
- https://help.classdojo.com/hc/en-us/articles/204365159-Join-Your-School
- https://help.classdojo.com/hc/en-us/articles/28976231612173-What-Account-Type-is-Right-for-Me
- https://help.classdojo.com/hc/en-us/articles/37177475180813-Managing-Staff-in-your-Directory-for-School-Leaders-and-Admins
- https://support.google.com/edu/classroom/answer/6190760
- https://www.idoceo.net/index.php/en/forum/4-general-questions-comments/3286-shared-class

---

## 11. Admin-lite — kim admin boʻladi, maʼmuriyat qayerga tushadi

> **Holat:** izlanish tugadi; admin qamrovi boʻyicha qaror QABUL
> QILINDI (§11.6). Qolgan bandlar (§11.5) kodlashni kutmoqda.

### 11.1. ⚠️ Avval terminologiya — bizda IKKI xil «admin» bor

Bu chalkashlik hujjatlarda ham, kodda ham bor. Ajratamiz:

| Nima | Qayerda | Kim |
|---|---|---|
| **Platforma admini** | `/admin/*`, `super_admin` roli | ⭐ **Ustozona jamoasi** — maktablar, foydalanuvchilar, audit, fikrlar |
| **Maktab admini (admin-lite)** | `/dashboard/*` ichida | ⭐ **Mijoz** — direktor/zavuch |

🔴 **`/src/app/admin` — bu BIRINCHISI.** U admin-lite emas va hech qachon
admin-lite boʻlmaydi. Roadmap'dagi «Maktab admin-lite» — hali
**qurilmagan**, uning oʻrni `/dashboard` ichida.

Hozircha hamkasb qoʻshish uchun platforma paneli ishlatilayotgani —
vaqtinchalik yamoq, arxitektura emas.

### 11.2. 🔴 Ikki parallel rol tizimi — hozirgi holat

```
better-auth user.role   →  teacher | school_admin | super_admin | student | guardian
workspace_members.role  →  owner | admin | teacher
```

`requireSchoolAdmin()` (`src/server/session.ts`) **ikkalasini ham**
talab qiladi: global `school_admin` roli **VA** `workspace_members.role
= "admin"` qatori.

Oqibatlari:
- Kimnidir zavuch qilish uchun **ikki joyni** tahrirlash kerak, biri
  esa faqat platforma admini qoʻlida → mijoz oʻzi qila olmaydi
- Ikki maktabda admin boʻlgan odam uchun `[row]` **birinchi tasodifiy**
  qatorni oladi — qaysi maktab ekani aniqlanmagan
- Bitta haqiqat ikki joyda yashaydi (`workspace-members.ts` izohi
  «ruxsatning YAGONA HOKIMIYATI» deb yozilgan — amalda emas)

### 11.3. ⭐ ClassDojo qanday hal qilgan — asosiy saboq

Ular **«kimsan»** (account type) va **«nima qila olasan»** (admin
permission) ni **ajratgan**:

| Account type | Kim | Nima |
|---|---|---|
| Teacher | Oʻqituvchi | Sinf yuritadi |
| **School Staff** | Maktab xodimi | Directory'ni koʻradi, School Story'ga yozadi — **sinfi boʻlishi shart emas** |
| School Leader | Direktor, oʻrinbosar, dekan | Oʻqituvchi funksiyasi + Directory boshqaruvi |

⭐ **Va eng muhim jumla:** *«Admin permissions can be added to any teacher
or school staff account with permission from the school's leader»* —
yaʼni **psixolog, kotib yoki oʻquv boʻlimi xodimi** ham admin huquqini
ola oladi, buning uchun uni «rahbar» deb atash shart emas. Rahbarlik
lavozimlariga admin **avtomatik** beriladi.

**Xulosa:** lavozim — bu **yorliq**, ruxsat — bu **bayroq**. Ikkisini
bogʻlash mumkin (rahbarga avtomatik), lekin ular bir narsa emas.

### 11.4. 🔴 Hal qilinishi kerak — admin nimani KOʻRADI

Bu §4.1 qoidasi bilan **toʻqnashadi**:

> Oʻqituvchi bolaning maʼlumotini koʻradi, **agar** oʻzi oʻqitadigan
> darsga oʻsha bola yozilgan boʻlsa.

Zavuchning darsi yoʻq. Qoida boʻyicha u **hech narsa koʻrmaydi** — bu
esa admin-lite'ning maʼnosini yoʻqotadi.

ClassDojo javobi: School Leader **hamma sinfni va oʻquvchi ballarini
koʻradi**. FERPA buni «legitimate educational interest» bilan oqlaydi.

⚠️ Demak `visibleClassIds` / `visibleStudentIds` ga **ataylab yozilgan
istisno** kerak: `role === "admin"` boʻlsa `data` qamrovi ham butun
maydon. Bu §1 dagi `if (kind === "school")` taqigʻini **buzmaydi** —
chunki shart maydon *turiga* emas, **rolga** qaraydi (yakka maydonda
admin bitta — oʻzi, natija oʻzgarmaydi).

🔴 Buning yonida **audit shart** (§7.3): admin boshqa oʻqituvchining
qaydini oʻqiy boshlagach, «kim koʻrdi» savoli real boʻladi.

### 11.5. Taklif — qaror uchun

1. ✅ **BAJARILDI (2026-08-26).** `workspace_members.role` yagona
   hokimiyat. Global `school_admin` auth roli ruxsat uchun
   **ishlatilmaydi** — `auth-roles.ts` da eskirgan deb belgilandi
   (yorliq sifatida `/admin/users` da qoladi).

   ⭐ **Topilma:** `requireSchoolAdmin()` amalda **oʻlik stub** ekan —
   yagona foydalanuvchisi `getSchoolForCurrentAdmin()` boʻlib, uning
   oʻzi ham **0 marta** chaqirilgan. Yaʼni ikkinchi rol tizimi hech
   qachon ishlamagan, faqat ishlaydigandek koʻrinib turgan. Ikkalasi
   ham oʻchirildi; oʻrniga `requireWorkspaceAdmin()`
   (`src/server/workspace.ts`) — faol maydon boʻyicha, bitta manbadan.

2. ⭐ **Maʼmuriyat xodimi uchun ALOHIDA account type ixtiro
   QILINMAYDI.** Bizda u kerak emas: xodim — maydon aʼzosi, uning
   `class_teachers` qatorlari boʻsh, xolos. «Darsi bor/yoʻq» — rol
   emas, **fakt**. (ClassDojo'ga School Staff kerak boʻlgan, chunki
   ularda account type auth darajasida.)

3. Rollar roʻyxati qisqa qolsin:
   `owner` (maydonni yaratgan) · `admin` (direktor, zavuch va ruxsat
   berilgan har kim) · `teacher` (oddiy aʼzo).
   ⛔ `psychologist`, `secretary` kabi lavozim rollari **qoʻshilmaydi** —
   bu ruxsat emas, yorliq. Kerak boʻlsa keyin `title` matn maydoni.

4. ✅ **BAJARILDI (2026-08-26).** `role === "admin"` uchun `data`
   qamrovi kengaytirildi (§11.4). ⚠️ Audit yozuvi hali **YOʻQ** —
   ochiq band (§7.3).

   ⭐ Yon qaror: istisno faqat `admin` ga tegishli, **`owner` ga
   EMAS**. Sabab: `owner` — maydonni yaratgan odam (hisob maʼnosida),
   bu maʼlumot roli emas. Aks holda jamoa maydonini ochgan oʻqituvchi
   hamkasblarining baholarini sezdirmasdan koʻra boshlardi — nazorat
   oshirish **ochiq qadam** boʻlishi kerak, yon taʼsir emas.

   ⚠️ Yozish darvozalari uchun `taughtClassIds()` ajratildi — u admin
   istisnosini tan olmaydi. `assertCanTouchStudent` va
   `applyGradesBatch` dagi oʻchirishlar **shundan** oʻtadi.

5. Admin-lite UI **`/dashboard/settings` ichida** joylashsin, `/admin`
   da EMAS (§11.1).

### 11.6. ✅ QAROR — admin v1 da FAQAT OʻQIYDI (asoschi, 2026-08-26)

> Admin roli maydon boʻylab **faqat oʻqish** qamrovini beradi. Baho,
> davomat, xulq yoki qayd **yozish** huquqini bermaydi.

Zavuch biror darsga baho qoʻymoqchi boʻlsa — oʻzini oʻsha darsga
**biriktirishi** kerak (`class_teachers`), va aynan shu amal audit'ga
tushadi.

⭐ **Nega bu kuchliroq:** §4.1 dagi imtiyoz oshirish xavfi yoʻqolmaydi —
u **ochiq va kuzatiladigan** boʻladi. «Zavuch koʻrdi» oddiy hol; «zavuch
oʻzini darsga qoʻshdi va baho oʻzgartirdi» — koʻrinadigan hodisa.
Yashirin yoʻl qoldirilsa, aynan shu ikkinchi holat sezilmay oʻtardi.

**Amaliy oqibati kodda:**
- `visibleClassIds("data")` / `visibleStudentIds("data")` — admin uchun
  butun maydon (oʻqish yoʻllari shu ikkisidan oʻtadi)
- `assertTeachesClass` / `assertCanTouchStudent` — ⛔ admin **istisnosi
  YOʻQ**. Yozish yoʻllari faqat haqiqiy biriktirishni tan oladi.

⚠️ Demak «oʻqish» va «yozish» darvozalari **ataylab boshqacha** javob
beradi. Bu farq tasodifiy koʻrinmasin uchun shu yerda yozilgan: kim
buni «nomuvofiqlik» deb tekislamoqchi boʻlsa — qoidani buzgan boʻladi.
