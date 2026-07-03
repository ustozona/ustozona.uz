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
