# Standartlar sahifasi — yoʻnalish hujjati (v3 — QULFLANGAN)

> **v3 holati (2026-06-22):** Daisy & Komil Jalilov bilan ikki bosqichli muhokama yakunlandi. **Markaziy qaror: Standart = oʻlchanadigan psixometrik konstrukt.** Barcha v2 tamoyillari + R2 detallari tasdiqlandi (§9). Implementatsiya yoʻl xaritasi §10 da. Asos: **Daisy Christodoulou falsafasi** + **baholash nazariyasi (validity/reliability)**.

---

## 1. Sahifa nima uchun kerak

Oʻqituvchi sinflari uchun **taʼlim standartlarini** (oʻquv natijalari — "Oʻquvchi … qila oladi") tashkil qiladi, biriktiradi va — eng muhimi — ularning **oʻzlashtirilishini dalil bilan** kuzatadi. Bu sahifa oʻquv dasturining poydevori: domen va konstruktni aniqlash bosqichi.

---

## 2. Asosiy tushunchalar

**Standart (bitta natija):** kod (`DT.01`) · taʼrif ("Oʻquvchi … qila oladi") · **Bloom darajasi** · **fundamental/bazaviymi** belgisi · (ixtiyoriy) bogʻlangan dars/quiz.

**Toʻplam / papka (StandardSet):** nomi · fan · bir nechta sinf · ichidagi standartlar · manba (DTS / DTM / Maxsus).

---

## 3. ⚠️ Asosiy tamoyil: «Qamrov» ≠ «Oʻzlashtirish»

v1 da bitta `Qamrov %` ikkita boshqa konstruktni aralashtirgan edi. v2 da ular **qatʼiy ajratiladi**:

| Metrika | Nimani oʻlchaydi | Tabiati | Qayerda |
|---|---|---|---|
| **Qamrov (Coverage)** | Domenning qancha qismi **oʻqitildi** | Input / oʻquv-reja | **Bu sahifada** |
| **Oʻzlashtirish (Mastery)** | Oʻquvchi qancha qismni **oʻrgandi** (dalil) | Outcome / prediktiv | `ozlashtirish` sahifasi |

**Sabab (Daisy):** "Oʻtdim" tugmasi faqat *oʻqitildi*ni anglatadi, *oʻrganildi*ni emas — bu "vague progression statement". Qamrov oʻquvchi natijasini **bashorat qila olmaydi**; faqat dalilga asoslangan, ogʻirlikli Oʻzlashtirish bashorat qiladi.

---

## 4. Qaror qilingan tamoyillar

### 4.1. "Oʻzlashtirildi" holati — qoʻlda EMAS, avtomatik (dalilga asoslangan)
- Standart holati unga **bogʻlangan quiz/baholash natijalariga koʻra avtomatik** oʻzgaradi.
- Oʻquvchi standart boʻyicha quizdan oʻtsagina — "oʻzlashtirildi".
- Qoʻlda belgilash "tizimli xatolik" (systematic error) xavfini tugʻdiradi.
- Ishonchlilik (reliability) uchun har standart **~10 talik quiz**ga ega boʻlishi tavsiya etiladi (sampling shovqinini kamaytiradi).

### 4.2. Bloom mosligi — majburiy va tekshiriladigan
- Har standartga Bloom darajasi biriktiriladi.
- Bogʻlangan topshiriq/quizning Bloom darajasi standart darajasiga **mos** boʻlishi shart. "Tahlil" standartini "bilish" savoli bilan oʻlchash → **invalid** natija.

### 4.3. Tayyor toʻplam manbasi — DTS (asosiy) + DTM (diagnostik)
- **DTS** — mazmuniy validlik (content validity) uchun eng ishonchli manba; domenni rasman belgilaydi.
- **DTM** — "muvaffaqiyat testi" (achievement) uchun diagnostik vosita.
- Oʻqituvchi qoʻlda yaratgan noaniq ("word salad", "adverb soup") standartlardan qochish uchun import afzal.
- **Import = nusxa:** foydalanuvchi erkin tahrirlaydi, asl shablonga taʼsir qilmaydi.

### 4.4. Qamrov/Oʻzlashtirish hisobi — ogʻirlikli, oddiy emas
- "Go slow to go fast": **fundamental standartlarga koʻproq ogʻirlik**. Bazaviy standart ("feʼlni aniqlash") oʻzlashtirilmasa, yuqori daraja ("murakkab gap tuzish") foizga katta taʼsir qilmasligi kerak.
- Ogʻirlik manbalari: (a) fundamental/bazaviy belgisi, (b) Bloom darajasi, (c) keyinroq — yakuniy natija bilan **empirik korrelyatsiya** (predictive weighting).

### 4.5. Integratsiya — standart ⇄ dars + quiz + baho
- Standart darsdan/baholashdan uzilgan boʻlsa, u "qogʻozdagi maqsad".
- Har standart **quiz va topshiriqlar bilan uzviy bogʻlanadi** → "aniq va oʻlchanadigan" (precise & measurable) boʻladi.
- Bu curriculum ⇄ pedagogy ⇄ assessment uchligi uygʻunligini taʼminlaydi.

---

## 5. Prediktivlik — daʼvo emas, validatsiya talab qiladigan gipoteza

"Oʻzlashtirish % yakuniy (DTM) natijani bashorat qiladi" — bu hozir **gipoteza** (Kane: argument-based validity). Prediktiv deb atashdan oldin:

1. **Konstrukt mosligi** — quiz standartni toʻgʻri Bloomда oʻlchasin.
2. **Ishonchlilik** — har standartda yetarli savol.
3. **Empirik ogʻirlik** — ogʻirliklar tarixiy data bilan kalibrlansin.
4. **Decay/retrieval** — nuqtaviy % unutishni hisobga olsin (`diagnostics.ts` decay modeli).
5. **Domen qoplamasi** — standart toʻplam yakuniy imtihon oʻlchaydigani bilan ustma-ust tushsin.

**Goodhart ogohlantirishi:** metrika *maqsadga* aylansa, *oʻlchov* boʻlishdan toʻxtaydi (oʻqituvchi yengil savol qoʻyib foizni koʻtaradi). Shuning uchun quiz banki kalibrlangan/mustaqil boʻlishi kerak.

**Validatsiya rejasi:** oʻtgan yil oʻzlashtirish → haqiqiy DTM natijasi korrelyatsiyasi; ogʻirliklarni shu data bilan kalibrlash.

---

## 6. "Standart qoʻshish" oqimi (tasdiqlangan)

Asosiy amal — ikki yoʻl:

### A) Tayyor toʻplamdan import (afzal, efficiency)
DTS/DTM dan butun toʻplamni bir bosishda olish → fan+sinf filtr, qidiruv, oldindan koʻrish (necha standart, namuna) → import → tahrirlash.

### B) Oʻzi yaratish
Boʻsh toʻplam + standartlarni qoʻlda yoki kutubxonadan (hozirgi 2-tabli modal).

```
[Standartlar]                         [🔍]  [+ Standart qoʻshish ▾]
                                                  ├─ Tayyor toʻplamdan (DTS/DTM)
                                                  └─ Yangi toʻplam yaratish

┌─ Informatika diagnostik   ·Informatika·  [9-A][9-B]   Qamrov 50% ┐
│   12 standart · 6 oʻtildi (avtomatik, quizdan)   [+ Standart] [🗑] │
│   ▸ DT.01 ⭐fundamental  ✓oʻzlashtirildi  Oʻquvchi …      [📄][🧩] │
│   ▸ DT.02               ✗ (quiz topshirilmagan) Oʻquvchi …        │
└────────────────────────────────────────────────────────────────────┘
   📄 = bogʻlangan dars   🧩 = bogʻlangan quiz (10 savol)
```

---

## 7. Hozirgi holat (qurilgan) — v2 gacha boʻlgan masofa

**Bor:** papka/toʻplam modeli (nom+fan+koʻp sinf), per-class koʻrinish, 2-tabli "Standart qoʻshish" (Katalog/Yangi), holat toggle, qamrov %, localStorage.

**v2 uchun qoʻshilishi kerak:**
1. Tayyor toʻplam (DTS/DTM) import — butun toʻplam shabloni.
2. "Fundamental" belgisi + ogʻirlikli hisob.
3. Standart ⇄ quiz bogʻlanishi; "oʻtildi" ni quizdan **avtomatik** qilish.
4. Qamrov(oʻqitildi) ni `ozlashtirish`(mastery, prediktiv) dan rasman ajratish.
5. (keyin) prediktiv ogʻirliklarni empirik kalibrlash.

---

## 8. Qarorlar jadvali (yakuniy)

| Mavzu | Qaror |
|---|---|
| "Oʻtildi" belgilash | **Avtomatik** (quiz/baho dalili), qoʻlda emas |
| Tayyor toʻplam manbasi | **DTS** (asosiy) + **DTM** (diagnostik) |
| Qamrov hisobi | **Ogʻirlikli** (fundamental + Bloom + empirik) |
| Qamrov ↔ Oʻzlashtirish | **Ajratiladi**: Coverage=oʻqitildi (bu sahifa), Mastery=oʻrganildi (ozlashtirish) |
| Bloom | **Majburiy**, topshiriq darajasi standartga mos |
| Modul bogʻliqligi | Standart ⇄ **dars + quiz + baho** |
| Prediktivlik | **Gipoteza** — empirik validatsiyadan keyin daʼvo qilinadi |

---

## 9. R2 yakuniy qarorlar — ✅ QULFLANGAN (LOCKED, 2026-06-22)

Daisy & Komil Jalilov tasdiqladi. **Markaziy qaror: Standart = oʻlchanadigan psixometrik konstrukt** (reja bandi emas). Demak savol-daraja teglash, decay, CJ, empirik ogʻirlik — "qoʻshimcha" emas, **poydevor**.

| # | Qaror | Asos |
|---|---|---|
| **Q1 Mastery qoidasi** | 3 daraja (<50% boshlangʻich · 50–80% shakllanmoqda · ≥80% mustahkam) **+** "mustahkam" faqat **takroriy retrieval**dan keyin | Haqiqiy oʻrganish = uzoq muddatli xotiradagi oʻzgarish; "banking model"dan saqlaydi |
| **Q2 Bogʻlanish** | **Savol-daraja teglash** — har savol → standart | Aralash testlar; misconception tahlili; content validity |
| **Q3 Badge** | **Coverage(oʻqitildi ✓) + Mastery(oʻzlashtirish %) yonma-yon** | curriculum⇄pedagogy⇄assessment mosligi; "termostat" signali |
| **Q4 Coverage** | **Lessons modulidan avtomatik** (dars tugasa → oʻqitildi) | "assessment operationalises curriculum"; qoʻl mehnatini kamaytiradi |
| **Q5 Decay** | **Faqat `ozlashtirish` sahifasida** | Standartlar = statik xarita/reja; chalgʻituvchi shovqinni kamaytiradi |
| **Q6 Obyektiv emas** | **Comparative Judgement (asosiy) + rubrika (zaxira)** | MCQ konstruktga mos emas → invalid; CJ inter-rater reliability |
| **Q7 Manba** | **Ustozona curated DTS/DTM bazasi** (MVP); crowdsource keyin (moderatsiya bilan) | "word salad"/systematic error xavfi; fairness — yagona mezon |

---

## 10. Implementatsiya yoʻl xaritasi (konstrukt yoʻnalishi)

> Bosqichma-bosqich. MVP — bitta vertikal kesim: **Informatika · 9-sinf**.

**Faza 0 — Data poydevori.** `StandardItem` ni kengaytirish: `level` (none/emerging/secure), `foundational: boolean`, `assessType` (objective/subjective), `lessonIds[]`, `quizItemIds[]`. Ustozona curated DTS bazasi (1 fan+sinf).

**Faza 1 — Savol-daraja teglash.** Savol banki; har savol `standardId`ga teglanadi. Quiz natijasi → standart dalili.

**Faza 2 — Mastery dvigateli** (`ozlashtirish` + `diagnostics.ts`). Har oʻquvchi×standart boʻyicha teglangan javoblardan daraja; 3 daraja; "mustahkam" uchun takroriy-retrieval qoidasi; decay shu yerda.

**Faza 3 — Coverage avtomatlashtirish.** Lessons↔standart bogʻlanishi; dars tugasa → oʻqitildi.

**Faza 4 — Standartlar sahifasi UI (konstrukt).** Badge = Coverage✓ + Mastery% yonma-yon (Q3); ogʻirlikli qamrov (foundational+Bloom).

**Faza 5 — CJ.** Obyektiv boʻlmagan standartlar uchun Comparative Judgement; standart `assessType`ga qarab quiz yoki CJ.

**Faza 6 — Empirik validatsiya.** Tarixiy mastery ↔ haqiqiy DTM korrelyatsiyasi; ogʻirliklarni kalibrlash; prediktivlikni daʼvo qilish (Kane).

**Tavsiya etilgan MVP kesimi:** Faza 0 + 1 + 2(soddalashtirilgan, dastlab bir-nuqtali) + 4. Decay(5'siz)/CJ/empirik — keyingi iteratsiyalar.

### 10.1. MVP holati — ✅ QURILDI (2026-06-22, Informatika 9-sinf)

- **Faza 0:** `StandardItem`ga `foundational` + `assessType` qoʻshildi; kutubxonada bazaviy va subʼektiv standartlar belgilandi.
- **Faza 1+2:** Parallel tizim qurilmadi — mavjud **`diagnostics.ts`** dalil-engine'i (item-level `standardId`, `mastery()` 75%+MIN_ITEMS=10, 9-B seed) qayta ishlatildi. Koʻprik: `src/lib/standards-mastery.ts` → `classStandardMastery(classId, standardId)` (sinf darajasida agregat). MVP = bir-nuqtali; takroriy retrieval (Q1.c) keyin.
- **Faza 4:** Standartlar sahifasida har satr **Coverage(Oʻqitildi ✓, toggle) + Mastery(Oʻzlashtirish %, dalildan, read-only) yonma-yon**; bazaviy ⭐ chip; subʼektiv standartlar "Subʼektiv · CJ" deb belgilanadi (Q6); quiz dalili yoʻq → "Baholanmagan".
- **Koʻrish uchun:** 9-B sinfini tanlang → toʻplam yarating → katalogdan DT.01/DT.02/DT.04 qoʻshing → oʻzlashtirish % real seed dalildan chiqadi.

**Keyingi iteratsiyalar:** Faza 3 (lessons→coverage avto), retrieval/decay sahifaga (yoʻq — ozlashtirishda), Faza 5 (CJ oqimi), Faza 6 (empirik kalibrlash), ogʻirlikli qamrov.

---

## 11. Referens koʻrik — oʻquvchi darajasidagi standart oʻzlashtirishi (2026-09-03)

Savol: **oʻquvchi profilidagi radar** standartga erishishni kuzatadigan
qilinsinmi, va dalil dars/topshiriq bogʻlanishidan qanday keladi?

### 11.1. Jahon amaliyotidagi zanjir

Sanoatda oʻrnashgan naqsh **toʻrt bogʻʻin**:

```
Standart ──(reja)──> Dars            → Qamrov (oʻqitildi)
   │
   └──(oʻlchov)──> Topshiriq/Savol   → Dalil (score)
                        │
                        └─> Agregatsiya qoidasi → Oʻzlashtirish darajasi
                                                     │
                                                     └─> Oʻquvchi profili / hisobot
```

Muhim tafsilot: yetuk jurnal tizimlarida bogʻlanish **topshiriq darajasida
ham, savol darajasida ham** boʻladi. Aralash testda har savol oʻz
standartiga teglanadi va tizim shu standartga tegishli savollarni
**ajratib** ball hisoblaydi — bitta topshiriq bir nechta standartga bir
vaqtda dalil beradi. Bu bizning R2-Q2 qaroriga (savol-daraja teglash) toʻliq
mos.

### 11.2. Agregatsiya qoidalari (asosiy topilma)

Bir standart boʻyicha bir nechta urinish borligi uchun tizimlar
**tanlanadigan** hisob usulini beradi. Sanoatda uchraydigan roʻyxat:

| Usul | Hisob | Xulq |
|---|---|---|
| Oʻrtacha (mean) | barcha urinish oʻrtachasi | anʼanaviy; oʻsishni jazolaydi |
| Moda (mode) | eng koʻp takrorlangan daraja | «izchil dalil» falsafasi |
| Eng yuqori | max | inflyatsiya xavfi |
| Oxirgi | oxirgi urinish | kontekstni yoʻqotadi |
| **Soʻnuvchi oʻrtacha** | oxirgi ball 65%, oldingi yigʻindi 35% | oʻsishni mukofotlaydi |
| Quvvat qonuni | oldingi ballar 35% ogʻirlik, eskisi eng kam — «keyingi ball» bashorati | prediktiv |
| N/M | oxirgi M urinishdan N tasi ketma-ket ≥ chegara | eng qatʼiy |

Soʻnuvchi oʻrtacha va quvvat qonuni **bir xil gʻoyaning ikki shakli**:
oʻrganish jarayon, boshlangʻich past ball yakuniy xulosani belgilamasin.
4-balli proficiency shkalasi (0–4; 3.0 = «standartga erishdi») de-fakto
standart, va u anʼanaviy bahoga alohida konversiya jadvali orqali
oʻtkaziladi — **foizga aralashtirilmaydi**.

Bizga taʼsiri: hozirgi `standards-mastery.ts` **oddiy foiz + 75% chegara**
ishlatadi va urinishlar tartibini eʼtiborga olmaydi. Bu v1 uchun yetadi,
lekin **oʻquvchi darajasida** (radar) tartibsiz oʻrtacha adolatsiz — oʻsish
koʻrinmaydi. Tavsiya: oʻquvchi darajasida **soʻnuvchi oʻrtacha** (65/35),
sinf darajasida esa hozirgidek taqsimot (secure/developing/beginning).

### 11.3. Qamrov ≠ oʻzlashtirish — tashqi tasdiq

Kurrikulum-xaritalash amaliyoti standartni **Introduced → Developed →
Practiced → Mastered** bosqichlarida belgilaydi va «kam qamralgan» yoki
«ortiqcha qamralgan» standartni alohida hisobot qiladi. Bu §3 dagi
qatʼiy ajratishimizni tasdiqlaydi: dars → qamrov, topshiriq → oʻzlashtirish.
Qoʻshimcha imkoniyat: **boʻshliq hisoboti** («oʻqitildi, lekin hech qachon
oʻlchanmadi» va «oʻlchandi, lekin oʻqitilmadi») — arzon va oʻqituvchiga
darhol foydali.

### 11.4. Radar chart — ehtiyot boʻlish kerak

Vizualizatsiya adabiyoti radar/oʻrgimchak diagrammasini **tanqid qiladi**:
odam burchak va yuzani uzunlikka qaraganda yomonroq oʻqiydi; qoʻshni
boʻlmagan oʻqlarni taqqoslash qiyin; **oʻqlar tartibi shaklni tubdan
oʻzgartiradi** (maʼnosiz «oʻtkir/silliq» taassurot); yuza idroki kichik
farqni dramatik koʻrsatadi; oʻq soni oshsa oʻqilmay qoladi.

Shu bilan birga, kognitiv-diagnostika tadqiqotlarida oʻquvchining
bilim holatini konseptlar boʻyicha 0..1 oraligʻida radar bilan koʻrsatish
**odatiy** — yaʼni radar «gestalt profil» sifatida oʻrinli, «oʻlchov
asbobi» sifatida emas.

Xulosa (taklif): radar **saqlanadi**, lekin faqat:
- **5–8 taʼdan koʻp boʻlmagan oʻq** (standart emas, **domen/toifa** —
  masalan Bloom yoki standart toʻplamining boʻlimlari);
- oʻqlar tartibi **barqaror** (kod boʻyicha), sinfdan sinfga oʻzgarmaydi;
- yonida **haqiqiy oʻlchov** — gorizontal bar/roʻyxat: har standart, uning
  darajasi, dalil soni, oxirgi sana.

Yaʼni radar navigatsiya (qayerga qarash kerak), bar esa qaror
(nima qilish kerak) uchun. Hozirgi `BloomRadar` aynan shu rolga mos —
lekin **haqiqiy dalildan** oziqlanishi kerak (hozir soxta).

### 11.5. Ishonchlilik chegarasi

Uch-ikki urinishdan kam dalil bilan «oʻzlashtirdi» deyish oʻlchov
xatosi. Amaliyotda: bir standart boʻyicha **kamida 3 mustaqil dalil
nuqtasi**, savol darajasida esa ~10 element (bizning MIN_ITEMS=10 shu
yerdan). Dalil yetarli boʻlmasa daraja koʻrsatilmaydi —
«**Baholanmagan**» (hozirgi xulq toʻgʻri).

### 11.6. Amaliy sxema oʻzgarishi (taklif, hali kod yoʻq)

1. `Assignment` ga `standardIds?: string[]` (topshiriq → standart) —
   hozir YOʻQ; `Lesson.standards` esa BOR.
2. Test elementiga `standardId` (savol → standart) — `diagnostics.ts` da
   allaqachon bor, lekin haqiqiy test builder bilan ulanmagan.
3. `studentStandardMastery(studentId, standardId)`:
   dalillarni sanaga qarab tartiblab → soʻnuvchi oʻrtacha → 0..1;
   `evidenceCount < 3` → `null` («baholanmagan»).
4. Profil: radar (domen agregati) + «Standartlar» roʻyxati (bar).
5. Boʻshliq hisoboti: qamrov ⨯ oʻzlashtirish matritsasi.

Ochiq masalalar: (a) agregatsiya usuli sozlanadigan boʻlsinmi yoki bitta
qatʼiy (soʻnuvchi oʻrtacha) boʻlsinmi; (b) radar oʻqlari Bloom
boʻyichami yoki standart toʻplamining boʻlimlari boʻyichami; (c)
topshiriq → standart bogʻlash UI qayerda (topshiriq muharririda
ixtiyoriy maydonmi yoki standart sahifasidan teskari bogʻlashmi).

---

## 12. R3 — Komil Jalilov koʻrigi va uch qarorning yechimi (2026-09-03) — ✅ QULFLANGAN

§11 dagi izlanish baholash mutaxassisi tomonidan koʻrib chiqildi. Nazariy
asoslar tasdiqlandi, uch ochiq masala hal qilindi.

### 12.1. Tasdiqlangan tamoyillar (nazariy nom bilan)

| §11 topilmasi | Nazariy asos |
|---|---|
| Standart → Dars → Topshiriq/Savol zanjiri | **Uygʻunlik (Alignment)** tamoyili — tizim samaradorligining bosh omili |
| Savol-darajali teglash | **Koʻp oʻlchamli testlar** (multidimensional tests) tahlilining toʻgʻri yoʻli |
| Oʻquvchida oddiy foiz adolatsiz | **Ipsativ baholash dinamikasi** — boshlangʻich qiynalish va yakuniy yutuq bir xil vaznda boʻlmasligi kerak |
| Radar faqat «gestalt profil» | Qaror qabul qilish gorizontal bar/jadvalda — vizualizatsiya xatosidan qochish |
| Kamida 3 dalil nuqtasi | Bitta nuqta **tasodifiy xatolikka** moyil; 3 nuqta oʻlchashning standart xatosini kamaytiradi va **tasniflash barqarorligini** (classification consistency) taʼminlaydi |
| Boʻshliq matritsasi | **Construct underrepresentation** (oʻqitildi, oʻlchanmadi) va **construct-irrelevant variance** (oʻlchandi, oʻqitilmadi) xavflarini tezkor aniqlaydi |

### 12.2. Q1 — Agregatsiya usuli: **SOZLANADIGAN** ✅

- **Default = Soʻnuvchi oʻrtacha (65/35).**
- Oʻqituvchi/maktab dropdown orqali oʻzgartira oladi: «Eng yuqori ball»,
  «Oxirgi urinish», «Oddiy oʻrtacha».
- Sabab: **xulosalovchi** (summativ) baholashda oddiy oʻrtacha,
  **shakllantiruvchi** (formativ) baholashda soʻnuvchi oʻrtacha
  samaraliroq ishlaydi — bitta qatʼiy usul ikkala holatni qoplay olmaydi.

### 12.3. Q2 — Radar oʻqlari: **DOMEN (toʻplam boʻlimlari)** ✅

Bloom oʻqlari **RAD ETILDI** (profil koʻrinishida).

- Bloom oʻz oʻrnida qoladi — u **oʻqituvchi va test tuzuvchi** uchun
  kognitiv darajalar muvozanatini saqlash asbobi (topshiriq ↔ standart
  darajasi mosligi, §4.2).
- Lekin **oʻquvchi va ota-onaga** «Sintezda muammo bor» degani mavhum va
  tushunarsiz. Ularga fanning **amaliy boʻlimlari** kerak:
  Ingliz tili → Reading / Writing / Listening / Speaking;
  Tarix → Xronologiya / Sabab-oqibat tahlili.
- Yaʼni radar oʻqi = standart toʻplamining **domeni**, standart emas va
  Bloom darajasi ham emas. Oʻq soni 5–8, tartibi barqaror.

⚠️ Sxemaviy oqibat: `StandardItem` ga **`domain`** maydoni kerak (yoki
`StandardSet` ichida domenlar roʻyxati). Hozir bunday maydon YOʻQ —
`bloom` bor. Tayyor toʻplamlarga (`standard-templates.ts`) domen
qoʻshilishi kerak.

### 12.4. Q3 — Bogʻlash UI: **GIBRID, asosiysi topshiriq muharririda** ✅

1. **Asosiy kirish nuqtasi — topshiriq yaratish oqimi.** Oʻqituvchi test
   savoli yoki uy vazifasini tuzayotganda **oʻsha yerda** har topshiriq/
   savol maydonida standart kodini qidirib topib belgilaydi (tagging).
   Ish oqimini buzmaydi — alohida sahifaga oʻtish talab qilinmaydi.
2. **Teskari bogʻlanish — standart sahifasida.** Boʻshliq hisobotida kam
   oʻlchangan yoki umuman oʻlchanmagan standart yonida **«Topshiriq
   biriktirish»** tugmasi boʻladi va u topshiriq muharririga yoʻnaltiradi.

### 12.5. Shu qarorlardan kelib chiqadigan ish roʻyxati

1. `Assignment.standardIds?: string[]` — sxemaga qoʻshish (hozir YOʻQ).
2. Test elementiga `standardId` — builder bilan ulash.
3. `StandardItem.domain?` + tayyor toʻplamlarga domen berish.
4. `studentStandardMastery(studentId, standardId, method)` — usul
   parametri bilan; default soʻnuvchi oʻrtacha; `evidenceCount < 3` → `null`.
5. Agregatsiya usuli sozlamasi (Sozlamalar > Baholash yoki toʻplam
   darajasida — joyi hali ochiq).
6. Profil: domen radar (gestalt) + standartlar bar roʻyxati (qaror).
7. Standart sahifasi: boʻshliq matritsasi + «Topshiriq biriktirish» CTA.
8. Topshiriq muharririda standart qidirish/teglash maydoni.

---

## 13. R4 — Daisy Christodoulou koʻrigi (2026-09-03) — §12 qarorlarini TASDIQLADI

Ikkinchi mustaqil koʻrik. Uch qarorning uchalasi ham **oʻzgarishsiz**
tasdiqlandi, lekin ikkitasining **asosi kuchaytirildi** va bir necha yangi
mazmuniy nuqta qoʻshildi.

### 13.1. Zanjir — «baholash kurrikulumni operatsionallashtiradi»

Dylan Wiliam: *assessment operationalises curriculum*. Standart qogʻozdagi
mavhum jumla boʻlib qolmasligi uchun u **topshiriq va savol darajasida**
bogʻlanishi shart. Bu §11.1 zanjirining asosiy oqlanishi.

**Savol-daraja teglashning aniq kuchi:** u umumiy natijani emas, **qaysi
kognitiv boʻgʻinda** xato borligini koʻrsatadi. Namuna: oʻquvchi kasrlarni
qoʻshishni biladi, lekin maxrajlarni tenglashtirish standartida oqsaydi —
bu faqat savol darajasidagi teglashda koʻrinadi. Yaʼni teglash
**misconception diagnostikasining shartidir** (bizda `classStandardMisconceptions`
allaqachon bor — u shu teglashga tayanadi).

**Bir topshiriq → koʻp standart — CJ bilan birga:** bitta insho yoki ochiq
murakkab topshiriq **CJ orqali umumiy** baholansa ham, undan grammatika,
soʻz boyligi, matn tarkibi boʻyicha **alohida sub-skill dalillari** ajratib
olinib agregatsiya qilinishi mumkin. Yaʼni `Assignment.standardIds`
koʻplik boʻlishi subʼektiv topshiriqlar uchun ham kerak, faqat testlar
uchun emas.

### 13.2. Nega 75% chegara adolatsiz — «chegara buzilishlari»

Hozirgi `standards-mastery.ts` dagi qatʼiy 75% chizigʻi **threshold
distortion** keltirib chiqaradi: chegaraning ikki yonidagi ikki oʻquvchi
amalda deyarli bir xil darajada boʻlsa ham, biri «muvaffaqiyatli», ikkinchisi
«oqsoq» deb tasniflanadi. Oʻlchov xatosi chegara atrofida eng katta —
aynan u yerda qatʼiy kesish qilinadi.

**Soʻnuvchi oʻrtachaning kognitiv asosi:** «oʻrganish — uzoq muddatli
xotiradagi oʻzgarish». Boshlovchi (novice) oʻrganishning dastlabki
bosqichida koʻp xato qilishi **tabiiy**. Oddiy oʻrtacha bu dastlabki
xatolarni yakuniy darajaga surib, oʻquvchini pastga tortadi va
motivatsiyani oʻldiradi. Vazn **65/35 yoki 70/30** — ikkalasi ham maqbul
oraliq.

**0–4 proficiency shkalasi** standart-asosli taʼlimning de-fakto global
tili; foizni shkala balliga (3.0 = «standartga erishdi») alohida jadval
orqali oʻtkazish oʻqituvchiga kompetensiya darajasini aniq koʻrsatadi.

### 13.3. Radar — «ikki yon koʻzgu» tamoyili

§11.4/§12.3 qarori ilgari kelishilgan **«ikki yon koʻzgu» (wing mirrors)**
konsepsiyasiga toʻliq mos deb topildi:

- **Radar = gestalt profil** — fanning tarkibiy qismlari boʻyicha umumiy
  manzara, «qayerga qarash kerak»;
- **Gorizontal barlar = aniq oʻlchov** — har standart boʻyicha daraja,
  dalillar soni, oxirgi oʻzlashtirish sanasi, «nima qilish kerak».

### 13.4. Q2 kuchaytirildi — Bloom radar nafaqat noqulay, balki **pedagogik jihatdan xato**

§12.3 da Bloom «ota-onaga mavhum» degan sabab bilan rad etilgan edi.
Koʻrik **kuchliroq sabab** keltirdi:

> Umumiy tanqidiy fikrlash yoki mavhum «tahlil qilish» koʻnikmasi
> **fanning oʻzidan ajratilgan holda mavjud emas** — uni bilimdan mustaqil
> oʻrgatib ham, oʻlchab ham boʻlmaydi.

Yaʼni Bloom oʻqli radar oʻqituvchini **«koʻnikmani bilimdan ajratib
oʻrgatish mumkin»** degan notoʻgʻri tasavvurga yetaklaydi. Bu shunchaki UX
masalasi emas.

Domen namunalari (kengaytirildi):
- **Ingliz tili:** Reading, Writing, Language Mechanics, Vocabulary, Oracy.
- **Tarix:** Chronological Knowledge, Source Analysis, Historical Argumentation.

Bloom `StandardItem` da **qoladi** — u test tuzuvchi uchun kognitiv
muvozanat asbobi (§4.2), lekin oʻquvchi profilida oʻq boʻlmaydi.

### 13.5. Q3 kuchaytirildi — kognitiv yuklama argumenti

Bogʻlash **topshiriq muharririda va savol darajasida** boʻlishi shart.
Sabab: oʻqituvchi topshiriqni yaratib boʻlgach boshqa sahifaga oʻtib
teskari bogʻlashga majbur boʻlsa, **kognitiv yuklama** ortadi va amalda
teglash qilinmay qoladi. Tizimning muvaffaqiyati oʻqituvchi vaqtini
qanchalik tejashiga bogʻliq.

§12.4 dagi gibrid **oʻzgarmaydi**, lekin ustuvorlik aniqlashdi: standart
sahifasidagi «Topshiriq biriktirish» — faqat **boʻshliq hisobotidan
chiqadigan yordamchi yoʻl**, asosiy oqim emas. Kod bosqichlarida muharrir
ichidagi teglash **birinchi** qilinadi.

### 13.6. Q1 — oʻzgarishsiz, qoʻshimcha asos

Sozlanadigan, default soʻnuvchi oʻrtacha. Qoʻshimcha sabablar:
(a) formativ va summativ baholashni aralashtirish taʼlimdagi eng katta
xatolardan biri — usul tanlovi shu ikkisini ajratishga xizmat qiladi;
(b) moslashuvchanlik tizimning turli maktablarga moslashuvini
(commercial scalability) taʼminlaydi.

### 13.7. §12.5 ish roʻyxatiga qoʻshimchalar

9. `Assignment.standardIds` — **subʼektiv/CJ topshiriqlar uchun ham**
   koʻplik (sub-skill dalillari).
10. 0–4 proficiency shkalasi ↔ foiz konversiya jadvali (koʻrsatish
    qatlami; hisob ichkarida 0..1 qoladi).
11. Vazn 65/35 va 70/30 — sozlama sifatida ochib qoʻyish mumkin
    (default 65/35).

---

## 14. Domen (Reading/Listening…) qayerda saqlanadi — R5 (2026-09-03)

Savol: standartda hozir **kod + matn + Bloom** bor. «Listening», «Reading»
kabi narsalar qayerga yoziladi — har standartgami, yoki toʻplam nomiga
chiqariladimi?

### 14.1. Jahon tajribasi — domen **ierarxiya qavati**, nom emas

Yirik ramkalarning uchalasida ham bir xil naqsh: **fan → domen (strand) →
standart**. Domen standartning ustidagi **qavat**, va u koʻpincha
**kodning oʻzida** kodlangan:

| Ramka | Kod namunasi | Domen qismi |
|---|---|---|
| CCSS ELA | `CCSS.ELA-LITERACY.RL.9-10.1` | `RL` = Reading: Literature (strand). Boshqalari: RI, RF, W, SL, L |
| CCSS Math | `CCSS.MATH.CONTENT.6.NS.A.1` | `NS` = The Number System (domain), `A` = cluster |
| NGSS | `MS-PS1-4` | `PS` = Physical Sciences (disciplinary core idea) |

Yaʼni `RL.9-10.1` da: **RL = domen**, `9-10` = sinf, `1` = standart raqami.
Domen hech qachon alohida «toʻplam nomi» boʻlmaydi — u **bitta toʻplam
ichidagi guruh**.

CCSS'da hatto **ikki qavat** bor: strand (RL) → cluster («Key Ideas and
Details») → standart. Bizga ikkinchi qavat hozircha kerak emas.

### 14.2. ⚠️ Domenlar **qatʼiy roʻyxat (enum) boʻlmasligi kerak**

Til fanida 4 koʻnikma (Listening/Reading/Writing/Speaking) — eng tanish
boʻlinish, lekin **zamonaviy CEFR undan voz kechgan**. Yangi ramka
faoliyatni **4 muloqot rejimi** boʻyicha beradi: **retseptsiya, produksiya,
interaksiya, mediatsiya** — chunki anʼanaviy 4 koʻnikma modeli muloqotning
real murakkabligini qamray olmaydi.

Bundan amaliy xulosa: agar biz kodga `type Domain = "Reading" | "Writing"
| …` deb yozib qoʻysak, tizim **bitta ramkaga qulflanib qoladi** va
matematika, tarix, CEFR-2018 ning hech biriga toʻgʻri kelmaydi.

**Domen — maʼlumot, kod emas.** Har toʻplam oʻz domenlar roʻyxatini
oʻzi olib yuradi.

### 14.3. Qaror: uch variantdan qaysi biri

| Variant | Baho |
|---|---|
| (a) Har standartga erkin matn maydoni (`domain: string`) | ⛔ Imlo xilma-xilligi («Reading» / «reading» / «Oʻqish») radar oʻqlarini parchalaydi; tartib yoʻq |
| (b) Domen = alohida toʻplam nomi | ⛔ Bir fan uchun 5 ta toʻplam yaratishga majbur qiladi; radar bitta toʻplam ichida qurilmaydi; sinfga biriktirish 5 barobar ish |
| **(c) Toʻplamda eʼlon qilingan domenlar roʻyxati + standart unga havola** | ✅ **QABUL QILINDI** |

Sabab: radar oʻqlariga **barqaror tartib** va **koʻrsatiladigan nom**
kerak. Ikkalasi ham erkin matndan chiqmaydi — ular eʼlon qilinishi kerak.

### 14.4. Sxema (taklif)

```ts
export type StandardDomain = {
  id: string;      // "R", "W", "L" — kod prefiksi bilan bir xil boʻlgani maʼqul
  name: string;    // "Reading" / "Oʻqib tushunish" — radar oʻqi va bar guruhi
  order: number;   // radar oʻqlari tartibi — BARQAROR, hech qachon alfavit emas
};

export type StandardSet = {
  // …mavjud maydonlar
  domains: StandardDomain[];   // YANGI — 0..8 ta
  standards: StandardItem[];
};

export type StandardItem = {
  id: string;        // kod: "R.03"
  // …matn, bloom, foundational, assessType
  domainId?: string; // YANGI — StandardDomain.id ga havola
};
```

Qoidalar:
- `domainId` **ixtiyoriy**. Boʻsh boʻlsa standart «Boʻlimsiz» guruhiga
  tushadi — mavjud toʻplamlar buzilmaydi (migratsiyasiz).
- Toʻplamda **3 tadan kam** domen boʻlsa profil radari **chizilmaydi** —
  faqat bar roʻyxati qoladi. 3 oʻqli radar maʼnosiz shakl.
- 8 tadan koʻp domen boʻlsa radar yopiladi (§11.4: oʻqilmay qoladi).
- Domen **bir dona** (koʻplik emas). Standart ikki domenga tegishli boʻlsa
  — bu standart juda keng yozilgan degani, ikkiga boʻlinishi kerak.
- `order` — **muallif bergan tartib**, alfavit emas. Radar shakli
  tartibga bogʻliq (§11.4), shuning uchun u maʼlumotning bir qismi.

### 14.5. Bloom bilan aralashtirmaslik

Ikkisi **ortogonal ikki oʻq**, biri ikkinchisining oʻrnini bosmaydi:

- **Domen = gorizontal.** Fanning qaysi qismi? (Reading / Sonlar tizimi)
- **Bloom = vertikal.** Qanchalik chuqur kognitiv talab? (Eslash / Tahlil)

Har standartda **ikkalasi ham** boʻladi. Domen — oʻquvchi va ota-onaga
koʻrinadigan oʻq (§13.4); Bloom — oʻqituvchining test muvozanati asbobi
(§4.2), profilda oʻq boʻlmaydi.

### 14.6. Import va yangi OʻzDTS uchun amaliy tavsiya

Hozir yangi oʻquv dasturi va standartlar ishlab chiqilmoqda
(muhokama portali: `dts.rtmuzedu.uz`). Shu bosqichda soʻralishi kerak
boʻlgan narsa:

1. **Har fan uchun domenlar roʻyxati alohida eʼlon qilinsin** — 4–7 ta,
   tartibi bilan. Bu standart matnlaridan keyin emas, **oldin** yoziladi.
2. **Kod prefiksi domenni koʻrsatsin** (`R.03`, `W.01`, `SN.05`) — jahon
   ramkalari shunday qiladi va bu import/tekshirishni arzonlashtiradi.
3. Excel importiga (`standard-import.ts`) **«Boʻlim»/«Domen» ustuni**
   qoʻshiladi; ustun boʻlmasa — kod prefiksidan **taxmin qilinadi**
   (`R.03` → `R`), lekin taxmin foydalanuvchiga koʻrsatiladi va
   tahrirlanadi.
4. Tayyor toʻplamlar (`standard-templates.ts`) domenlar bilan
   toʻldiriladi. CEFR shabloni uchun **ikki variant** boʻlishi mumkin:
   anʼanaviy 4 koʻnikma va CEFR-2018 rejimlari — ikkalasi ham shunchaki
   maʼlumot, kodga tegmaydi.

### 14.7. §12.5 ish roʻyxatiga oʻzgarish

3-band aniqlashtirildi: `StandardItem.domain?` emas —
**`StandardSet.domains[]` + `StandardItem.domainId?`**.
Qoʻshimcha bandlar: import ustuni + prefiksdan taxmin;
`AddStandardModal` da domen tanlash; toʻplam sozlamalarida domenlarni
tahrirlash/tartiblash.

### 14.8. Qoʻlda kiritishda domen — UX qarori (kod oʻqilgandan keyin)

#### Jahon tajribasi: oʻqituvchi standartni **yozmaydi**, tanlaydi

Muhim tuzatish. Yetuk tizimlarda standart yozish **individual oʻqituvchining
ishi emas**:

- Standartlar **ramkadan** keladi (DTS/CCSS/NGSS/CEFR) — import qilinadi.
- Oʻqituvchi/komissiya yozadigan narsa — bir qavat **pastdagi**
  «oʻquv maqsadi» («I can» statement): ramka standartini **ochib berish**
  (unpacking), oʻquvchi tilida.
- Bu maqsadlar **markaziy bankda** turadi, **fan / sinf / boʻlim** boʻyicha
  tartiblanadi, **qayta ishlatiladi** (yillar va oʻqituvchilar aro) va
  boshqa foydalanuvchilarniki **koʻrib, nusxa olinadi**.
- Yozish **komissiya** ishi sifatida tashkil qilinadi, yolgʻiz oʻqituvchi
  ishi sifatida emas.

Xulosa bizga: **qoʻlda nol'dan yozish — asosiy oqim emas, oxirgi chora.**
Agar oʻqituvchi 20 ta standartni qoʻlda teryapti, bu bizda **bank
qatlami yetishmayotganining** belgisi. Shuning uchun domen UX'i qoʻlda
kiritishni qulaylashtirishi kerak, lekin unga **tayanmasligi** kerak.

#### Kodning hozirgi holati (tekshirildi)

| Joy | Holat |
|---|---|
| `StandardItem` (`standards-data.ts:95`) | `id, covered, bloom, desc, file?, foundational?, assessType?` — **domen YOʻQ** |
| `STANDARDS_DATA` seed | Allaqachon **prefiks boʻyicha guruhlangan**: `V.01`, `G.01`, `S.01`, `L.01`, `R.01`, `W.01` — lekin guruh faqat **kod izohi** (`// ── Vocabulary (V) ──`), maʼlumot emas |
| `AddStandardModal` «Yangi yaratish» | kod (avto `DT.NN`) + **Bloom majburiy** + tavsif majburiy + dars ixtiyoriy |
| `AddStandardsModal` → `CustomSetRow` inline | **faqat** kod + tavsif + `+` — Bloom **soʻralmaydi** |
| `standard-import.ts` | `CODE/DESC/BLOOM/FOUND/ASSESS` kalitlari bor — **domen kaliti yoʻq** |

Ikki topilma:

1. ⚠️ **Ikki qoʻlda-kiritish yoʻli bir-biriga mos emas** — birida Bloom
   majburiy, ikkinchisida umuman soʻralmaydi. Domen qoʻshishdan **oldin**
   shu nomuvofiqlik hal qilinishi kerak, aks holda uchinchi maydon
   chalkashlikni ikki barobar qiladi.
2. ✅ **Prefiks konvensiyasi bizda allaqachon bor** — faqat izohda yotibdi.
   Yaʼni «prefiksdan domen taxmin qilish» sunʼiy qoida emas, mavjud
   maʼlumotni rasmiylashtirish.

#### Qaror

**Ha, maydon qoʻshiladi — lekin erkin matn input EMAS, Select.**
Domen toʻplam darajasida **bir marta** eʼlon qilinadi (§14.4),
standartda faqat **tanlanadi**. Erkin input imlo xilma-xilligini
(«Reading» / «reading» / «Oʻqish») keltirib chiqaradi va radar oʻqlarini
parchalaydi — muammoni hal qilmay, yashiradi.

Qoidalar:

1. **Progressiv ochilish.** Toʻplamda hali domen yoʻq boʻlsa, maydon
   **umuman koʻrsatilmaydi**. Birinchi standartlar hozirgidek kiritiladi.
2. **Prefiksdan avto-tanlash.** Kod `R.03` yozilsa va toʻplamda `R`
   domeni bor boʻlsa — **oʻzi tanlanadi**. Domen yoʻq boʻlsa, «Yangi
   boʻlim: R?» degan **bir klik** taklif chiqadi. Yaʼni oʻqituvchi kod
   yozish orqali domenlarni ham tuzib boradi.
3. ⚠️ **`nextCode()` oʻzgartirilishi kerak.** Hozir u har doim `DT.NN`
   qaytaradi (`AddStandardModal.tsx:28`) — bu 2-qoidani buzadi, chunki
   `DT` hech qanday domenga tegishli emas. Domenlar mavjud boʻlsa, avto-kod
   **oxirgi ishlatilgan domen prefiksini** davom ettirsin (`R.03` → `R.04`).
4. **Keyin belgilash rejimi.** Toʻplam ichida «Boʻlimlarni belgilash» —
   roʻyxatda har satrga tez domen berish. Har standartni alohida ochib
   tahrirlashdan arzon, va bu import qilingan toʻplamlar uchun ham asosiy
   tuzatish yoʻli.
5. **Import.** `standard-import.ts` ga `DOMAIN_KEYS = ["boʻlim", "bolim",
   "domen", "domain", "strand", "boʻlimi"]`; ustun boʻlmasa prefiksdan
   taxmin, va taxmin natijasi importdan keyin **koʻrsatiladi va
   tahrirlanadi** (jim qilinmaydi).
6. **Hech qachon majburiy emas.** Domensiz standart «Boʻlimsiz» guruhida
   qoladi; qamrov, oʻzlashtirish, bar roʻyxati — hammasi ishlaydi.
   Yagona yoʻqotish: radar chizilmaydi (§14.4, 3–8 domen sharti).

#### Shundan kelib chiqadigan ish roʻyxati (§12.5 ga qoʻshimcha)

12. Ikki qoʻlda-kiritish yoʻlini moslashtirish (Bloom majburiymi yoki
    yoʻqmi — bitta javob).
13. `nextCode()` ni domen-xabardor qilish.
14. `STANDARDS_DATA` seed'ini rasmiylashtirish: izohdagi V/G/S/L/R/W
    guruhlari → haqiqiy `domains[]` + `domainId`.
15. «Boʻlimlarni belgilash» ommaviy rejimi.

### 14.9. ✅ Yangi OʻzDTS kod tuzilmasi — domen modeli TASDIQLANDI (2026-09-03)

Yangi umumiy oʻrta taʼlim oʻquv dasturi (muhokama: `dts.rtmuzedu.uz`)
koʻrildi. **Informatika va axborot texnologiyalari (IAT)** namunasi.

#### Kod formati (rasmiy)

```
IAT5.AD.01
 │   │  │   └── oʻquv maqsadi tartib raqami
 │   │  └────── FANNING MAZMUN SOHASI bosh harfi
 │   └───────── sinf raqami
 └───────────── fan bosh harfi
```

Rasmiy atamalar bilan: **fan bosh harfi + sinf raqami + fanning mazmun
sohasi bosh harfi + oʻquv maqsadi tartib raqami**.

#### «Mazmun sohasi» = bizning «domen»

DTS'ning **«fanning mazmun sohasi»** — bu §14 da «domen» deb atagan
qavatimizning aynan oʻzi. Informatika uchun rasmiy roʻyxat:

| Mazmun sohasi | Kod |
|---|---|
| Algoritm va dasturlash | `AD` |
| Maʼlumotlarni boshqarish | `MB` |
| Tarmoqlar va xavfsizlik | `TX` |
| Kompyuter tizimlari | `KT` |
| Kontent yaratish | `KY` |
| Sunʼiy intellekt | `SI` |

Oʻquv maqsadlari sinflar kesimida **aynan shu sohalar boʻyicha
guruhlangan jadvallarda** beriladi (5-sinf → «Algoritm va dasturlash (AD)»
sarlavhasi ostida IAT5.AD.01…04, keyin «Maʼlumotlarni boshqarish (MB)»
ostida IAT5.MB.01…04, va h.k.).

#### Bu nimani tasdiqlaydi

1. **§14.3 (c) varianti toʻgʻri.** Mazmun sohasi — standartning ustidagi
   **qavat**, na erkin matn, na toʻplam nomi. DTS uni jadval sarlavhasi
   qilib beryapti, biz `domains[]` qilib saqlaymiz — bir xil narsa.
2. **§14.6 tavsiyasi allaqachon bajarilgan.** «Kod prefiksi domenni
   koʻrsatsin» degan tavsiyamiz DTS'da bor — domen kodning **uchinchi
   segmenti**.
3. **§14.2 (enum qilma) toʻgʻri chiqdi.** Informatika sohalari
   (AD/MB/TX/KT/KY/SI) hech qanday jahon ramkasiga oʻxshamaydi va boshqa
   fanlarda butunlay boshqacha boʻladi. Qatʼiy tip yozganimizda,
   OʻzDTS'ning oʻzi sigʻmasdi.
4. **Radar oʻlchami mos.** 6 ta mazmun sohasi — §14.4 dagi 3–8 oraligʻiga
   toʻgʻri tushadi. Informatika profili radari tayyor holda chiqadi.

#### ⚠️ Ikki texnik tuzatish

**(a) Prefiks parsing yangilanadi.** §14.8/2-qoida «kod prefiksidan domen
taxmin qil» degan edi — lekin **birinchi segment domen EMAS**:
`IAT5.AD.01` da birinchi segment `IAT5` (fan+sinf), domen esa `AD`.
Sodda «birinchi nuqtagacha» qoidasi **notoʻgʻri natija beradi**.

Ikki format qoʻllab-quvvatlanadi:

| Shakl | Namuna | Domen |
|---|---|---|
| 3 segment (OʻzDTS) | `IAT5.AD.01` | 2-segment (`AD`) |
| 2 segment (bizning seed) | `R.01`, `V.03` | 1-segment (`R`) |

Yaʼni qoida: **oxirgi segment — tartib raqami; undan oldingi harfli
segment — domen.** Bu ikkala shaklni ham qamraydi.

Bonus: 3 segmentli shaklda **fan va sinf ham kodda bor** — import
paytida toʻplamning `subject` va `grade` maydonlarini kod'dan taklif
qilish mumkin (foydalanuvchi tasdiqlaydi).

**(b) Yakuniy nuqta tozalanadi.** DTS jadvallarida kod `IAT5.AD.01.`
koʻrinishida — **oxirida nuqta bilan** yozilgan. Import (`standard-import.ts`)
kodning oxiridagi nuqtani olib tashlashi kerak, aks holda `IAT5.AD.01` va
`IAT5.AD.01.` ikki xil standart boʻlib qoladi.

#### Atama qarori: UI'da **«mazmun sohasi»**

Ichki kodda `domain` / `domainId` qoladi (xalqaro atama, ramkalar aro
neytral). Lekin **oʻqituvchiga koʻrinadigan matnda** «domen» ham,
«boʻlim» ham emas — **«mazmun sohasi»** yoziladi, chunki bu OʻzDTS'ning
rasmiy atamasi va oʻqituvchi uni hujjatdan tanib oladi.

#### Atama haqida ikkinchi kuzatuv

DTS bularni **«oʻquv maqsadlari»** deb ataydi, «standart» demaydi.
Bu §14.8 dagi jahon tajribasi bilan **aynan mos**: ramka darajasida
standart, uning ostida oʻqituvchi ishlaydigan **oʻquv maqsadi** qavati.
Yaʼni bizning `StandardItem` amalda **oʻquv maqsadi** — nomlashda buni
hisobga olish kerak (hozircha kod nomi oʻzgartirilmaydi, faqat UI matni).

#### Ish roʻyxatiga qoʻshimcha

16. `parseStandardCode(code)` yordamchisi: `{subject?, grade?, domain?, seq}`
    — 2 va 3 segmentli shakllarni qoʻllab-quvvatlaydi, oxirgi nuqtani
    tozalaydi.
17. Informatika 5–11 sinf mazmun sohalari (`AD/MB/TX/KT/KY/SI`) tayyor
    toʻplam sifatida `standard-templates.ts` ga; qolgan fanlar DTS
    hujjatlaridan bosqichma-bosqich.
18. UI matnlarida «mazmun sohasi» atamasi (6 tilga tarjima bilan).
