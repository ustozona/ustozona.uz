# Ustozona Baholash — mantiq qanday ishlaydi

> Bu hujjat **tushuntirish** uchun. Texnik shartnomalar
> [baholash-integratsiya.md](./baholash-integratsiya.md) da, baho
> formulasi [grades-v1-spec.md](./grades-v1-spec.md) da.
>
> Holat: 2026-08-04. Yozilgan narsalar real kodga tekshirilgan.

---

## 1. Eng avvalo: ikkita daftar bor

Chalkashlikning asosiy sababi shu — Ustozonada **ikkita mustaqil hisob
daftari** bor va ular bir-biriga tegmaydi:

| | Nima yozadi | Kim koʻradi |
|---|---|---|
| **Oʻlchov daftari** | `responses.isCorrect`, `responses.score` — savol toʻgʻrimi | Jurnal, ota-ona, hisobot |
| **Oʻyin daftari** | tezlik, ketma-ket toʻgʻri javob, jamoa bali, animatsiya | Faqat oʻyin ekrani, oʻsha dars davomida |

Qoida (`ost-loyihalar-arxitektura.md` R33): **oʻyin daftari jurnalga hech
qachon yozmaydi.** Bola 3 soniyada javob bergani uchun ham, 30 soniyada
javob bergani uchun ham bahoga bir xil taʼsir qiladi.

Bu shunchaki gap emas — **tip darajasida qulflangan**.
`src/lib/assess/score.ts` dagi `ScoreInput` tipida `elapsed_ms` maydoni
ataylab YOʻQ. Kelajakda kimdir tezlikni bahoga qoʻshmoqchi boʻlsa,
TypeScript uni oʻtkazmaydi.

**Nega bu muhim:** Blooketʼda aynan shu chalkashlik bor — bola koʻp
«oltin» yigʻadi, lekin javoblarining yarmi notoʻgʻri. Oʻqituvchi
gʻolibni koʻradi, bilimni koʻrmaydi. Biz shu tuzoqqa tushmaslik uchun
ikkalasini boshidan ajratdik.

---

## 2. Baho qanday hisoblanadi

Bu qism oʻyin yoki qogʻozdan mutlaqo mustaqil — natija qayerdan
kelishidan qatʼi nazar bir xil.

### 2.1. Xom ball → foiz

Bazada ikkita narsa saqlanadi:

- `grades.score` — **xom ball** (masalan `8`)
- `assignments.maxScore` — **maxraj** (masalan `10`)

Foiz jurnal tomonida hisoblanadi: `8 / 10 = 80%`.

> ⚠️ **Shu yerda jiddiy bug bor edi, tuzatildi** (commit `ff4ce87`).
> `publish.ts` xom ball oʻrniga foizni (`80`) yozardi, jurnal esa uni
> yana `maxScore` ga boʻlardi → **800%**. Endi xom ball yoziladi.
>
> **Lekin:** tuzatishdan OLDIN prodga chiqqan baholar hali ham bazada
> notoʻgʻri turibdi. Ularni oʻsha sessiyani **qayta nashr qilib**
> tuzatish kerak — takroriy nashr xavfsiz, `sourceSessionId` boʻyicha
> ustiga yozadi.

### 2.2. Nega foizga normalizatsiya

Chunki turli topshiriqlar turli maxrajga ega:

- Diktant — 20 ball
- Test — 10 ball
- Ogʻzaki — 5 ball

Xom ballarni qoʻshib boʻlmaydi: 20 ballik diktant 5 ballik ogʻzakini
bosib ketardi. Shuning uchun hammasi avval foizga aylanadi, keyin
oʻrtachalanadi.

### 2.3. Vazn faqat BITTA qatlamda

Faqat **mavzu/toifa** vazn oladi:

- Nazorat ishlari — 50%
- Uy vazifalari — 20%
- Ogʻzaki — 30%

Toifa ichida topshiriqlar bir-biriga teng. **Ikki qavatli vazn
(topshiriqning oʻz vazni) ataylab yoʻq** — u oʻqituvchini chalkashtiradi
va amalda hech kim toʻgʻri sozlay olmaydi.

### 2.4. Formativ vs Summativ

- **Summativ** — yakuniy bahoga kiradi.
- **Formativ** — jurnalda koʻrinadi, lekin **yakuniy bahoga umuman
  qoʻshilmaydi**.

Oʻyin koʻpincha formativ boʻlishi kerak: u mashq, imtihon emas.

### 2.5. Q/T (qatnashmadi / topshirmadi)

Bunday yozuv **0 deb hisoblanmaydi**, balki **oʻrtachadan butunlay
chiqariladi**.

Sabab: kasal boʻlgan bola nol olmasligi kerak. `0` — «yechdi, bilmadi»
degani; `Q/T` — «maʼlumot yoʻq» degani. Ikkisi bir narsa emas.

---

## 3. Oʻqituvchining ish ketma-ketligi

> «Topshiriq dashboardda qilinsa, `/baholash` da nima boʻladi?»

```
1. DASHBOARD → Topshiriqlar
   Test TUZILADI: savol, variantlar, toʻgʻri javob, maxScore
   (activity_sets + activities + activity_items)
        ↓
2. /baholash
   Test TUZILMAYDI — faqat YETKAZILADI.
   Sinf tanlanadi → test tanlanadi → uchta tugmadan biri:
        ↓
   ┌──────────────┬──────────────┬──────────────┐
   │ Jonli oʻyin  │ Uy vazifasi  │ Qogʻoz test  │
   │ (LessonLab   │ (oddiy       │ (PDF chop    │
   │  qobigʻi)    │  ekran)      │  + kamera)   │
   └──────────────┴──────────────┴──────────────┘
        ↓              ↓              ↓
3. Uchalasi ham BITTA `quiz_session` ochadi
   va BITTA `responses` jadvaliga yozadi
        ↓
4. publishSessionToGrades() → jurnal
```

**Asosiy dizayn qarori:** yetkazish usuli — bu faqat **koʻrinish**. Bola
oʻyin oʻynadimi, uyda ishladimi, qogʻozga belgiladimi — bazaga bir xil
`responses` qatori tushadi va jurnalga bir xil yoʻl bilan koʻchadi.

Nega test `/baholash` da tuzilmaydi: muharrir Topshiriqlar boʻlimida
allaqachon bor. Ikkinchi marta yozish — dublikat.

---

## 4. Oʻquvchi roʻyxatdan oʻtishi kerakmi?

**Yoʻq.** `joinByCode()` hech qanday akkaunt talab qilmaydi
(`src/server/dal/play/join.ts`).

```
Oʻquvchi telefonda ochadi:  ustozona.uz/play/ABC123
        ↓
listRosterByCode() → sinf roʻyxati keladi (faqat id + ism)
        ↓
Bola oʻz ismini ROʻYXATDAN TANLAYDI (yozmaydi!)
        ↓
joinByCode() → bir martalik token beradi
        ↓
Oʻyin qobigʻi ochiladi, javoblar oʻsha token bilan ketadi
```

Uchta muhim nuqta:

**a) Ism yozilmaydi, tanlanadi** (qoida R43). Agar bola ism yozsa —
«Alisher», «alisher», «Alixer» uchta boshqa odam boʻlib qoladi va
jurnalga bogʻlab boʻlmaydi. Roʻyxatdan tanlash `student_id` ni darhol
bogʻlaydi. Anonim ishtirokchi (`studentId = null`) texnik jihatdan
mumkin, lekin bu **istisno, standart emas**.

**b) Token URLʼda ketadi va bu maqbul.** Token faqat oʻsha bitta
sessiyaga tegishli, sessiya yopilishi bilan kuchini yoʻqotadi, bazada
faqat hash saqlanadi. Havolani boshqaga berish — oʻz oʻrniga boshqa bola
oʻynagani, akkaunt oʻgʻirlangani emas.

**c) Toʻgʻri javob brauzerga chiqmaydi.** `getSessionContent()` javobni
olib tashlab yuboradi (`answer: -1`). Qobiq har javobni serverdan
soʻraydi (`LLQuiz.check()`). Bu shart — aks holda bola sahifa kodini
ochib hammasini koʻrardi.

---

## 5. LessonLab bilan qanday ulanadi

### Bizning maʼlumot LessonLabga koʻchmaydi

| Narsa | Egasi |
|---|---|
| Savol, variant, toʻgʻri javob | **Ustozona** |
| Sessiya, ishtirokchi, javob | **Ustozona** |
| Baho, jurnal | **Ustozona** |
| Oʻyin qobigʻi (koʻrinish) | LessonLab |
| OMR skaner dvigateli | LessonLab |
| Javob varagʻi PDF | LessonLab |

LessonLab bizdan **hech nima olmaydi va saqlamaydi**. Oʻquvchi ismi,
sinfi, bahosi u tomonga umuman oʻtmaydi.

### Qobiq qanday ishlaydi

```
lessonlab.uz/edugames/poyga.html?src=https://ustozona.uz&token=…
        ↓
GET  ustozona.uz/api/play/content?token=…   ← savollar BIZDAN keladi
POST ustozona.uz/api/play/answer            ← javob BIZGA ketadi
```

Yaʼni **qobiq — shunchaki chiroyli ekran**. U bizning serverdan savol
soʻraydi, bizning serverga javob yuboradi, oʻzida hech narsa saqlamaydi.
Shu sababli «dublikat» muammosi printsipial ravishda mavjud emas: ikki
tizim bir xil maʼlumotni saqlamaydi.

**Qobiq ochilmasa** — oʻquvchi oddiy ekranda davom etadi. Oʻyin hech
qachon test topshirishga toʻsiq boʻlmasligi kerak.

### OMR (qogʻoz test) — sof funksiya

Rasm yuboriladi → belgilangan kataklar qaytadi. Tamom. LessonLab kimning
varagʻi ekanini bilmaydi ham. Shuning uchun oʻqituvchida LessonLab
akkaunti boʻlishi **shart emas** — `/api/v1/engine/*` ishlatiladi,
`/api/v1/scan/*` emas (ikkinchisi OAuth talab qiladi va natijani oʻz
jurnaliga yozadi).

---

## 6. Jahon tajribasi — nimani oldik, nimani olmadik

### Kahoot!

- Har bola oʻz qurilmasida, savol umumiy ekranda.
- **Tezlik ballga kiradi** — tez javob koʻproq ball.
- Jamoa rejimi bor: bolalar guruhga boʻlinadi, lekin **har biri oʻz
  telefonida**.

**Oldik:** har-qurilma modeli va jamoa tushunchasi.
**Olmadik:** tezlik ballanishi. Kahoot — oʻyin platformasi, jurnal emas.
Bizda natija bahoga aylanadi; tezlikni qoʻshsak sekin oʻqiydigan bola
jazolanadi.

### Blooket

- Kahoot ustiga oʻyin iqtisodi qoʻshgan (oltin, savdo, oʻgʻirlash).
- **Muammosi:** gʻolib ≠ eng koʻp bilgan. Oʻyin mexanikasi tasodifga
  tayanadi.

**Oldik:** aynan shu muammoning oʻzi bizga **R33 (ikkita daftar)**
qoidasini bergan.

### Wayground (eski nomi Quizizz)

- Har bola **oʻz tezligida** ishlaydi, umumiy ekran shart emas.
- Uy vazifasi rejimi kuchli.

**Oldik:** «Uy vazifasi» yetkazish usuli aynan shu — sessiya ochiq
turadi, bola istagan paytda kiradi.

### Wordwall

- Bitta kontent → **oʻnlab shablon**.
- Eng muhim jihati: **qaysi shablon mos kelishini oʻzi hisoblaydi**;
  mos kelmasa **sababini aytadi**.

**Oldik:** bu naqsh allaqachon qurilgan — `shellAvailability()`
(`src/lib/baholash-shells.ts`). Har qobiq oʻz talabini eʼlon qiladi:

```ts
accepts:  { shapes, optionRange, minQuestions, maxQuestions? }
supports: { teams, capture }
gradable: boolean
```

Mos kelmagan qobiq **yashirilmaydi**, sababi bilan turadi: *«Kamida 6
savol kerak — hozir 3 ta»*. Oʻchiq tugma «nega?» degan savol qoldiradi,
sabab esa nima qilishni aytadi.

### Pear Deck

- Slaydga savol qoʻshadi, oʻqituvchi darsni boshqaradi.
- «Ustoz tezligi» rejimi — hamma bir vaqtda bitta slaydda.

**Olmadik:** bu prezentatsiya mahsuloti, biz jurnal mahsulotimiz. Lekin
«ustoz boshqaradigan tempo» tushunchasi jonli oʻyin rejimida bor.

### Plickers — eng muhim saboq

- **Bitta qurilma** — faqat oʻqituvchi telefoni.
- 30 bolada QR-karta. Kamera hammasini bir zumda oʻqiydi.

Dastlab kodda `perDevice: boolean` degan maydon bor edi — «har bola oʻz
qurilmasidami?» degan savol. **Bu xato edi**: Plickers rejimida qurilma
bitta, lekin **karta oʻzi roʻyxat bogʻlovchisi** — har javob oʻz
`student_id` siga tushadi.

Toʻgʻri savol qurilma soni emas: **«javob egasi aniqmi?»**

Shuning uchun hozir uchta holat bor (`AnswerCapture`):

| `capture` | Qurilma | Egasi aniqmi | Jurnalga |
|---|---|---|---|
| `device` | har bolada | ha | ✅ tushadi |
| `qrcard` | **bitta** kamera | **ha** (karta) | ✅ tushadi |
| `teacher` | bitta | **yoʻq** | ❌ tushmaydi |

`teacher` — ustoz butun sinf uchun bitta javob belgilaydi. Kim bilgani
nomaʼlum → baholab boʻlmaydi.

---

## 7. Hozirgi holat

**Ishlayotgani:**

- Test tuzish, sessiya, javob yigʻish, jurnalga koʻchirish
- Ikkita oʻyin qobigʻi: **Arqon tortish**, **Poyga**
- Qobiq mosligini avtomatik hisoblash (Wordwall naqshi)
- LessonLabʼdan sinf va test import qilish
- Javob varaqlari PDF

**Hali yoʻq:**

- Varaqni skanerlash UIʼsi — server funksiyasi (`scanOmrSheet()`) tayyor,
  oʻqituvchi rasm yuklaydigan ekran yoʻq
- QR-kartalar UIʼsi — `answerCardsPdf()` tayyor, ekran yoʻq
- **Jamoa qatlami** — `session_teams` jadvali va
  `session_participants.team_id` sxemada bor, lekin ularga murojaat
  qiladigan kod umuman yoʻq (oʻlik sxema)
- `pairs` (juftlash) uchun qobiq yoʻq — bunday savollar oddiy ekranda
  oʻynaladi

---

## 8. Guruh bali — QAROR: yigʻindi + tenglashtiruvchi

**Qaror qabul qilindi (2026-08-04).** Ilgari bu ochiq savol edi:

- **Yigʻindi:** 6 kishilik guruh 4 kishilikni avtomatik yengadi —
  adolatsiz.
- **Oʻrtacha:** bola «mening ballim qoʻshildi» hissini yoʻqotadi.

`ost-loyihalar-arxitektura.md` (315-satr) yigʻindi deydi, lekin bu
yolgʻiz holda yetarli emas.

### Jahon amaliyoti — uchtasi uch xil

| Mahsulot | Qoida |
|---|---|
| **Kahoot!** | **Oʻrtacha.** Lekin u yerda jamoada BITTA qurilma — bolalar kelishib bitta javob beradi, yaʼni jamoa allaqachon bitta birlik. |
| **Wayground** (Quizizz) | **Yigʻindi + «Equalizer Points».** Kam sonli jamoaga oʻsha jamoaning OʻZ OʻRTACHASI bilan oʻynaydigan xayoliy aʼzo qoʻshiladi. |
| **Blooket** | Yagona qoida yoʻq — har oʻyinning oʻz mexanikasi. Namuna emas. |

### Tanlangan yechim: Wayground modeli

Sabab — u ikkala eʼtirozni ham hal qiladi:

| Eʼtiroz | Yigʻindi | Oʻrtacha | Yigʻindi + tenglashtiruvchi |
|---|---|---|---|
| Katta jamoa avtomatik yengadi | ❌ | ✅ | ✅ |
| «Mening ballim qoʻshildi» hissi | ✅ | ❌ | ✅ |

Bola ekranda oʻz balining jamoa raqamiga **qoʻshilishini koʻradi**
(yigʻindi saqlanadi), lekin kichik jamoa ham gʻalaba qila oladi
(tenglashtiruvchi).

Matematik jihatdan bu `oʻrtacha × eng_katta_jamoa_soni` ga teng — lekin
**koʻrsatilishi** boshqacha, va bu yerda muhimi aynan koʻrinish.

```
jamoa_bali = Σ(aʼzolar bali) + (eng_katta_jamoa − shu_jamoa) × shu_jamoa_oʻrtachasi
```

### Nega xavf past

- Jamoa bali — **faqat oʻyin daftari** (R33), jurnalga umuman tegmaydi.
  Yaʼni bu «adolatli baholash» emas, «sinfda janjal chiqmasin» masalasi.
  Xato qilsak, tuzatish arzon.
- Jamoani **oʻqituvchi** tuzadi, bolalar oʻzlari emas. Sonlar odatda teng
  yoki 1 taga farq qiladi. Tenglashtiruvchi kamdan-kam ishlaydi, lekin
  ishlaganda muhim (23 bola, 4 jamoa → 6/6/6/5).

**Manbalar:**
[Kahoot team mode](https://support.kahoot.com/hc/en-us/articles/4408679135891-Kahoot-game-play-in-team-mode) ·
[Kahoot how points work](https://support.kahoot.com/hc/en-us/articles/115002303908-How-points-work) ·
[Wayground uneven teams](https://support.quizizz.com/hc/en-us/articles/360031033971-Can-I-have-uneven-teams-for-a-Team-Assessment-Quiz) ·
[Blooket game modes](https://help.blooket.com/hc/en-us/articles/21408591795351-Blooket-Game-Mode-Previews)

---

## 8a. Hali hal qilinmagan: `capture` — qobiqning xususiyatimi yoki sessiya sozlamasimi?

LessonLabʼning Poyga sozlash ekranida *«Javobni qabul qilish: Ustoz
belgilaydi / QR kartalar»* degan tanlov bor. Yaʼni **bitta qobiq**
sozlamaga qarab baholanadigan ham, baholanmaydigan ham boʻlishi mumkin.

Bizning kodda esa `capture` — qobiqning **doimiy** xususiyati
(`GameShell.supports.capture`). Bu nomuvofiqlik hal qilinishi kerak.

---

## 9. Eslatma — nima aniq QILINMAYDI

Bular ataylab rad etilgan, qaytadan taklif qilinmasin:

- ❌ Tezlikni bahoga qoʻshish (R33, tip darajasida bloklangan)
- ❌ LessonLab bilan jonli ikki tomonlama sinxronizatsiya — muqarrar
  nizoga olib keladi; import bir martalik, undan keyin EGASI Ustozona
- ❌ Bitta qurilmada bir necha oʻquvchi (javob egasi noaniq boʻladi)
- ❌ Ikki qavatli vazn tizimi (toifa + topshiriq vazni)
- ❌ Krossvord/Xotira kabi oʻz kontenti bilan ishlaydigan oʻyinlarni
  baholanadigan roʻyxatga qoʻshish — oʻqituvchini aldaydi
