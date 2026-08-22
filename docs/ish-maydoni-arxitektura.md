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

- **UI:** hamkasbni taklif qilish (hozircha admin paneli orqali) · maʼmuriy
  sinfga guruh ulash (`parentClassId` UI'da hali yoʻq)
- **Prod migratsiyasi** (Supabase) — hali qoʻllanmagan
- §6 dagi qolgan ikki band: `teachers.school` matn maydonini guruhlashdan
  butunlay chiqarish, client store'da oʻqish-uchun qismni ajratish
- Qaydlarni ulashish (oʻqish filtrini olib tashlash) — ATAYLAB hali
  qilinmadi: avval bogʻlanishlar haqiqiy maktabda tekshirilsin

---

## 9. Nima QILINMAYDI

- ⛔ **Shaxs qatlami yamogʻi** (`school_students` + `students.personId`) —
  rad etildi. Sabab: oxiri yoʻq edi, notoʻgʻri model ustida abadiy yashardi.
- ⛔ **`grades`/`attendance`/`notes` dagi `teacherId` ni olib tashlash** — ular
  mualliflik, ular toʻgʻri (§3.2).
- ⛔ **Ikki xil kod yoʻli** ("yakka" va "maktab") — yadro gʻoyaga zid (§1).
