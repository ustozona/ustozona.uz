# Ustozona Baholash — LessonLab integratsiyasi

> Holat: qurilmoqda. Bu hujjat **qaror qabul qilingan** narsalarni yozadi,
> reja emas. Rejadagi qismlar oxirida alohida ajratilgan.

## 1. Nima uchun umuman integratsiya

`/baholash` mahsulot sahifasida beshta vaʼda bor: test tuzish, jonli
oʻtkazish, qogʻoz test skaneri (OMR), QR-kartalar va natijaning jurnalga
avtomatik koʻchishi.

Ulardan **test tuzish, sessiya va jurnal** allaqachon Ustozonada bor
(`activity_sets`, `quiz_sessions`, `responses`, `publishSessionToGrades`).
Yetishmaydigani — **ijro qobigʻi** (oʻyin koʻrinishi) va **OMR skaneri**.
Ikkalasi ham LessonLabda tayyor va ishlab turibdi.

Shuning uchun ularni qaytadan yozish emas, ulash tanlandi.

## 2. Chegara — kim nimaga egalik qiladi

Bu jadval integratsiyaning **eng muhim qismi**. Uni buzish ikki tizimni
bir-birining ustiga yozdiradi.

| Narsa | Egasi | Izoh |
|---|---|---|
| Savol, variant, toʻgʻri javob | **Ustozona** | `activities`, `activity_items` |
| Sessiya, ishtirokchi, javob | **Ustozona** | `quiz_sessions`, `responses` |
| Baho va jurnal | **Ustozona** | `publishSessionToGrades` |
| Oʻyin qobigʻi (koʻrinish) | **LessonLab** | `/edugames/*.html` |
| OMR skaner dvigateli | **LessonLab** | rasm → belgilangan kataklar |
| Javob varagʻi PDF | **LessonLab** | QR + katak geometriyasi |

Yaʼni **LessonLabga bizning maʼlumot koʻchmaydi**. Unga faqat xizmat
chaqiriladi: rasm yuboriladi — belgilangan kataklar qaytadi. Oʻquvchi
ismi, bahosi, sinfi u tomonga oʻtmaydi.

Shu sababli «dublikat» muammosi tugʻilmaydi: ikki tizim umuman bir xil
maʼlumotni saqlamaydi.

## 3. Oʻyin qobigʻi qanday ishlaydi

Qobiq — LessonLab domenidagi oddiy HTML sahifa. U savolni LessonLabdan
**olmaydi**:

```
oʻquvchi  →  /play/KOD?game=arqon        (Ustozona)
             ↓ roʻyxatdan ismini tanlaydi, token oladi
             ↓ qobiqqa yoʻnaltiriladi
          lessonlab.uz/edugames/arqon.html?src=https://ustozona.uz&token=…
             ↓ GET  {src}/api/play/content?token=…     ← savollar
             ↓ POST {src}/api/play/answer              ← javob
          natija → responses → jurnal                   (Ustozona)
```

### Toʻgʻri javob brauzerga chiqmaydi

`getSessionContent()` javobni allaqachon olib tashlab beradi. Qobiq
`answer` oʻrniga `-1` koʻradi va `await LLQuiz.check(i)` chaqirib
serverdan soʻraydi.

Bu shart, chunki natija **jurnalga** tushadi: oʻquvchi sahifa kodini
ochib toʻgʻri javobni koʻra olmasligi kerak. LessonLabning oʻz mashq
rejimida javob brauzerga keladi — u yerda ball hech qayerga yozilmaydi,
shuning uchun muammo yoʻq.

### Tezlik ballanmaydi

Qobiq oʻz ballini (animatsiya, musobaqa) koʻrsatishi mumkin, lekin
jurnalga faqat `responses.isCorrect` boradi. Ikki daftar mustaqil —
`docs/ost-loyihalar-arxitektura.md` R33.

### Qobiq ochilmasa

Oʻquvchi oddiy ekranda davom etadi. Oʻyin — qobiq, majburiyat emas;
u test topshirishga hech qachon toʻsiq boʻlmasligi kerak.

## 4. Xavfsizlik

### CORS — `*` emas, roʻyxat

`/api/play/*` soʻrovlarida ishtirokchi **tokeni** boradi.
`Access-Control-Allow-Origin: *` qoʻyilsa, istalgan sayt oʻquvchining
savol-javobini oʻqiy olardi. Shuning uchun `PLAY_ALLOWED_ORIGINS`
roʻyxati bor va javobda aynan soʻrovchi origin qaytariladi.

Roʻyxat boʻsh boʻlsa — hech kim oʻtmaydi. Yopiq holat — xavfsiz standart.

### `src` parametri tekshiriladi

Qobiqqa `?src=` beriladi. Tekshirilmasa, hujumchi qobiq havolasini
oʻzgartirib oʻquvchi tokenini begona saytga yuborardi. Shuning uchun
`quiz-loader.js` faqat `https` (yoki `localhost`) originni qabul qiladi
va yoʻlni tashlab yuboradi.

### Token URL'da — nega maqbul

Ishtirokchi tokeni bitta sessiyaga tegishli, sessiya yopilishi bilan
kuchini yoʻqotadi va bazada faqat hash saqlanadi. Havolani boshqaga
berish — oʻz oʻrniga boshqa bola oʻynashi bilan teng, akkaunt oʻgʻirlash
emas.

### Imzo (LessonLab tomonga)

`src/server/lessonlab/client.ts` har soʻrovni HMAC bilan imzolaydi:

```
canonical = "{ts}.{nonce}.{METHOD}.{path?query}.{sha256(body)}"
signature = HMAC-SHA256(partner_secret, canonical)
```

Query ham imzoga kiradi va har soʻrovga yangi `nonce` kerak — takrorlangan
nonce server tomonda rad etiladi.

## 5. Muhit oʻzgaruvchilari

| Oʻzgaruvchi | Nima uchun |
|---|---|
| `PLAY_ALLOWED_ORIGINS` | `/api/play/*` ga kira oladigan domenlar (vergul bilan) |
| `LESSONLAB_GAMES_BASE` | Oʻyin qobiqlari manzili, masalan `https://lessonlab.uz/edugames` |
| `LESSONLAB_API_BASE` | Partner API manzili |
| `LESSONLAB_PARTNER_KEY` | Hamkor kaliti |
| `LESSONLAB_PARTNER_SECRET` | Imzo siri — hech qachon brauzerga chiqmaydi |

Oxirgi uchtasi oʻrnatilmagan boʻlsa integratsiya **oʻchiq** holatda
qoladi: sahifa ochiq aytadi, soxta tugma koʻrsatmaydi.

Ikki bayroq **alohida** tekshiriladi va bu ataylab:
`isConfigured()` — imzo kalitlari (PDF/OMR), `isGamesConfigured()` —
qobiq manzili. Bittasi sozlanib ikkinchisi sozlanmasligi mumkin;
ilgari ikkalasi bitta bayroqqa bogʻlangani uchun panel notoʻgʻri
sababni koʻrsatardi.

### Prod qiymatlari (Vercel → Settings → Environment Variables)

```
LESSONLAB_API_BASE     = https://lessonlab.uz
LESSONLAB_PARTNER_KEY  = pk_live_ustozona_a03b2cfbecd27232
LESSONLAB_PARTNER_SECRET = (LessonLab tomonidan beriladi — pastga qarang)
LESSONLAB_GAMES_BASE   = https://lessonlab.uz/edugames
PLAY_ALLOWED_ORIGINS   = https://lessonlab.uz
```

`LESSONLAB_PARTNER_SECRET` hech qayerda saqlanmaydi — u LessonLab
serverida master kalitdan hosil qilinadi:

```
secret = HMAC_SHA256(PARTNER_MASTER_SECRET, "ustozona:1")
```

Uni koʻrish uchun LessonLab VM'ida:

```bash
docker compose exec bot python scripts/partner_admin.py show ustozona
```

Buning ishlashi uchun LessonLab `.env` da `PARTNER_MASTER_SECRET`
boʻlishi shart. Boʻlmasa hamkor API butunlay oʻchiq boʻladi va har
soʻrov `503 server_misconfigured` qaytaradi.

## 6. Qaysi oʻyinlar bor — va nega faqat ikkitasi

LessonLabda oltita oʻyin bor, lekin ulardan **faqat ikkitasi**
oʻqituvchi testini oʻynaydi:

| Oʻyin | Savol manbai | Roʻyxatda |
|---|---|---|
| Arqon tortish | oʻqituvchi testi | ha |
| Poyga | oʻqituvchi testi | ha |
| Krossvord | oʻz soʻz bazasi (`EG_WORDS`) | yoʻq |
| Soʻz topish | oʻz soʻz bazasi | yoʻq |
| Xotira | oʻz generatori | yoʻq |
| Qaysi katta | oʻz generatori | yoʻq |

Qolgan toʻrttasini roʻyxatga qoʻshish oʻqituvchini aldardi: u oʻz testi
oʻynalyapti deb oʻylardi, aslida bolalar boshqa soʻzlar bilan mashq
qilardi va jurnalga hech narsa tushmasdi.

### Baholanadigan sessiyada nima oʻzgaradi

Arqon va Poyga hamkor rejimida boshqacha ishlaydi:

- **Toʻgʻri javob koʻrsatilmaydi.** Mashq rejimida xato javobdan keyin
  toʻgʻrisi yonardi — baholanadigan ishda bu testni buzadi.
- **Savol taymeri oʻchadi (arqon).** Vaqt tugashi savolni javobsiz
  qoldirardi, yaʼni sekin oʻquvchi ball yoʻqotardi. «Tezlik hech qachon
  ballanmaydi» qoidasi shuni talab qiladi.
- **Jamoaviy rejim oʻchadi.** Arqonda duo, poygada esa butun musobaqa
  qatlami (jamoalar, olimpiada, QR-kartalar) chetlab oʻtiladi: ular
  bitta ekranda oʻynaladigan sinf oʻyini uchun, baholanadigan sessiyada
  esa har bola oʻz qurilmasida. Aks holda jamoaning javobi bitta
  bolaning jurnaliga tushardi.
- **Savollar takrorlanmaydi (poyga).** Mashq rejimida savollar qayta
  aylanadi, baholanadigan ishda esa bir element ikki marta javob olsa
  bazaga ikkita yozuv tushardi. Savollar soni ham testdan olinadi,
  sozlamadan emas.
- **Matematikaga tushib ketmaydi.** Savol yuklanmasa oʻyin boshlanmaydi;
  aks holda bola oʻqituvchi bermagan misollarni yechardi va natija hech
  qayerga yozilmasdi.
- **Tarmoq uzilsa javob «notoʻgʻri» boʻlmaydi.** Server javob bermasa
  oʻquvchiga eslatma chiqadi va u qayta bosa oladi.

## 7. Qogʻoz test (OMR) — ishlaydi

Uchala chaqiruv ham `/api/v1/engine/*` orqali ketadi, `/api/v1/scan/*`
orqali EMAS. Farqi hal qiluvchi:

| | `/scan/*` | `/engine/*` |
|---|---|---|
| Oʻqituvchining LessonLab akkaunti | **kerak** (OAuth) | kerak emas |
| Natija LessonLab jurnaliga yoziladi | ha | yoʻq |
| Nima saqlanadi | test, natija | **hech narsa** |

Ustozona oʻqituvchisida LessonLab akkaunti yoʻq va boʻlishi ham shart
emas — «hech qanday toʻsiqsiz ishlasin» talabi shuni anglatadi. Yon
foydasi: hech qanday maʼlumot koʻchmagani uchun dublikat ham, ustiga
yozish ham printsipial ravishda mumkin emas.

Ishlatiladigan uchtasi:

- `POST /api/v1/engine/answer-sheets` → varaqlar PDF
- `POST /api/v1/engine/answer-cards` → QR-kartalar PDF
- `POST /api/v1/engine/scan-omr` → rasm (xom baytlar) → javoblar

### QR ichida nima ketadi

QR faqat **uchta butun son** tashiydi, Ustozona kalitlari esa UUID.
Sigʻdirish uchun:

- `test_ref` / `class_ref` — UUID'ning turgʻun 31-bitli xesh'i.
  Bu **kalit emas, tekshiruv**: skanerlashda oʻqituvchi allaqachon
  testni tanlagan boʻladi, xesh «bu varaq oʻshanikimi» degan savolga
  javob beradi.
- `student_ref` — sinf roʻyxatidagi **tartib** raqami (1..N).
  `students.studentNumber` ishlatilmaydi: u butun bazada yagona
  identity, qiymati 4821 boʻlishi mumkin, dvigatel esa `max(no)`
  tagacha varaq chizadi — 4821 sahifalik PDF.

⚠ Tartib raqamining narxi: varaq chop etilgandan keyin sinfga oʻquvchi
qoʻshilsa yoki oʻchirilsa raqamlar suriladi va eski varaqlar notoʻgʻri
odamga bogʻlanadi. Panel buni oʻqituvchiga ochiq aytadi.

Javob HAR DOIM roʻyxat: bitta A4 sahifada 4 tagacha varaq boʻlishi
mumkin.

Bilish kerak boʻlgan uchta narsa:

- **Varaq toʻliq kadrga sigʻishi shart.** Cheti kesilgan surat rad
  etiladi — chala suratdan taxmin qilgandan koʻra qayta suratga
  olishni soʻrash afzal.
- **Ishonchsiz varaq javobga umuman kirmaydi.** Boʻsh roʻyxat — xato
  emas. Taxminiy natijani oʻqituvchi haqiqiy deb qabul qilardi.
- **`"X"` — ikki pufakcha belgilangan.** Baholashda XATO hisoblanadi,
  boʻsh emas: oʻquvchi javob bergan, lekin noaniq.

`scanOmrSheet()` javobni xom holda qaytaradi — ballash Ustozonaning
`submitResponse()` zanjiridan oʻtadi, aynan onlayn javob kabi.

## 8. Teskari yoʻnalish — LessonLab'dan koʻchirish

Yuqoridagi hamma narsa bir yoʻnalish edi: Ustozona oʻqituvchisi
LessonLab dvigatelidan foydalanadi. Teskari yoʻnalish boshqacha
masala.

### Nega u simmetrik EMAS

LessonLab dvigateli — **sof funksiya**: rasm kiradi, belgilangan
kataklar chiqadi. Unga kimlik kerak emas, shuning uchun
`/engine/*` endpointlari oʻqituvchi tokenisiz ishlaydi.

Ustozona jurnali esa — **oʻqituvchiga tegishli maʼlumot**. Kimningdir
jurnaliga akkauntsiz yozib boʻlmaydi; bu texnik cheklov emas, mantiqiy.
Shuning uchun teskari yoʻnalishda «toʻsiqsiz» degani boshqa narsani
anglatadi.

### Amaldagi yechim: import

Oʻqituvchi LessonLab botida yillar davomida sinf va test yigʻgan
boʻlishi mumkin. Ularni qoʻlda kiritish — yuzlab ism yozish degani va
Ustozonaga oʻtishning eng katta toʻsigʻi.

```
/baholash → «LessonLab'dan koʻchirish»
   → /api/lessonlab/start   (PKCE, code_verifier httpOnly cookie'da)
   → LessonLab: oʻqituvchi Telegram orqali rozilik beradi
   → /api/lessonlab/callback → token → sinf + oʻquvchilar koʻchadi
```

Muhimi: bu oqimni **Ustozona oʻqituvchisi** boshlaydi va u OʻZ
LessonLab maʼlumotiga ruxsat beradi. Yangi kimlik tizimi qurish shart
emas — LessonLab'dagi OAuth yetarli.

### Qoidalar

- **Hech narsa ustiga yozilmaydi.** Nomi bir xil sinf/test uchrasa —
  oʻtkazib yuboriladi va hisobotda «nizo» deb koʻrsatiladi. Qaysi
  birini qoldirishni oʻqituvchi hal qiladi.
- **Takrorlash xavfsiz.** Ikkinchi marta hech narsa qoʻshilmaydi.
- **Token saqlanmaydi.** Import tugagach unutiladi.
- **Nom solishtirishda oʻzbek apostroflari normallashtiriladi** —
  aks holda «Gʻafur» va «G'afur» ikki xil sinf boʻlib qolardi.

### Nega «jonli sinxron» emas

Doimiy ikki tomonlama oqim muqarrar nizoga olib keladi: bir joyda
tuzatilgan ism ikkinchisida qaytadan yoziladi, oʻchirilgan oʻquvchi
qayta paydo boʻladi. Koʻchirishdan keyin EGASI Ustozona boʻladi,
LessonLab'dagi nusxa oʻz holicha qolaveradi va ular bir-birini
quvmaydi.

## 9. Hali qilinmagan
- ~~Javob varagʻi PDF endpointi~~ — tayyor va UI'ga ulangan:
  `/baholash` → Qogʻoz test → «Sinf roʻyxati bilan» / «Imtihon».
- ~~Testlarni import qilish~~ — tayyor: sinf tanlanganda «Testlarni
  koʻchirish» tugmasi chiqadi (`/api/lessonlab/start?class=…`).
- **Varaqni skanerlash UI'si** — server funksiyasi (`scanOmrSheet()`)
  tayyor, lekin oʻqituvchi rasm yuklaydigan ekran hali yoʻq. Undan
  keyingi qadam — natijani `submitResponse()` zanjiriga ulash.
- **QR-kartalar** — `answerCardsPdf()` tayyor, UI hali yoʻq.
- **`pairs` uchun qobiq yoʻq.** Hamkor rejimida faqat `mcq` qadamlar
  uzatiladi; juftlash savollari oddiy ekranda oʻynaladi.

## 10. Oʻzgarish qanday prodga yetadi — DIQQAT

Ish `roziyevbehroz-tech/ustozona.uz` da olib borilishi mumkin, lekin
haqiqiy Vercel deploy `ustozona/ustozona.uz` dan ketadi.

`roziyevbehroz-tech/ustozona.uz` GitHub maʼnosida **fork emas** —
klon push qilib yaratilgan mustaqil repo. Shuning uchun cross-repo PR
umuman ochilmaydi: `compare/main...roziyevbehroz-tech:<branch>`
havolasi har doim «There isn't anything to compare» beradi.

Ishlaydigan yagona tartib:

```bash
git remote add upstream https://github.com/ustozona/ustozona.uz.git  # bir marta
git fetch upstream main

# 1. Branch UPSTREAM main'dan ochiladi — boshqa main'dan emas, aks
#    holda diff upstream'dagi yangi ishni orqaga qaytaradi.
git checkout -b behroz/<tavsif> upstream/main

# 2. npm run build lokal oʻtishi shart — Vercel bitta umumiy deploy.
npm run build

# 3. Branch UPSTREAM'ga push qilinadi (main'ga emas, branch'ga).
git push upstream behroz/<tavsif>
```

PR upstream ichida, oddiy same-repo PR sifatida ochiladi:

```
https://github.com/ustozona/ustozona.uz/compare/main...behroz/<tavsif>?expand=1
```

Upstream'dagi mavjud PR'lar aynan shunday qilingan — merge
xabarlaridagi `men/marketing-brifi` va
`roziyevbehroz-tech/claude/baholash-integratsiya` fork emas, upstream
ichidagi branch nomlari.

## 11. Keyingi qadam — uchta yoʻl

> Holat: **(b) TANLANDI va bajarildi** (2026-08-04). (a) va (c) ochiq
> qolmoqda — quyida saqlanadi, chunki (a) endi (b) ustiga quriladi.

### (a) Guruh qatlami (B5.1)

`session_teams` jadvali va `session_participants.team_id` sxemada bor,
lekin ularga murojaat qiladigan kod **umuman yoʻq** — oʻlik sxema.

⚠️ Atama chalkashligiga eʼtibor bering. §6 dagi «jamoaviy rejim
oʻchadi» — bu **qobiqning oʻz ichki** jamoa boʻlinishi (bitta ekran,
javob egasi noaniq). B5.1 esa butunlay boshqa narsa va u **oʻchirilgan
emas, hali qurilmagan**:

- guruhni **Ustozona** tuzadi (`session_teams`), qobiq emas;
- har oʻquvchi **oʻz qurilmasida**, oʻz `participant` qatori bilan
  javob beradi — individual baho toʻliq saqlanadi;
- qobiq faqat guruh ballarini koʻrsatadi, jurnalga taʼsiri yoʻq (R33).

Kahoot team mode va Blooket shu modelda ishlaydi.

**Qaror (2026-08-04):** guruhni oʻqituvchi tuzadi, **tasodifiy ham,
qoʻlda ham** — alternativa emas, ketma-ket bosqich: avval «Tasodifiy
taqsimlash» bosiladi, keyin karta sudrab tuzatiladi. Faqat guruh soni
soʻraladi. Sessiya `running` boʻlgach guruh qulflanadi. Guruhsiz
(`team_id = null`) bola oddiy oʻynaydi — xato holat emas.

⚠️ **Ochiq savol:** guruh bali **yigʻindimi yoki oʻrtachami?**
Yigʻindida katta guruh avtomatik yutadi; oʻrtachada bola «mening
ballim qoʻshildi» hissini yoʻqotadi. `ost-loyihalar-arxitektura.md`
(satr 315) yigʻindi deydi. (a) ni boshlashdan oldin hal qilinsin.

### (b) Qobiq kontrakti — ✅ BAJARILDI

`GameShell` endi oʻz talab va imkoniyatlarini eʼlon qiladi, moslik esa
`shellAvailability()` sof funksiyasi bilan **hisoblanadi**
(`src/lib/baholash-shells.ts`). Naqsh Wordwall'dan: u ham kontentga
qarab mos shablonni oʻzi topadi va mos kelmasa **sababini** aytadi.

```
accepts:  { shapes, optionRange, minQuestions, maxQuestions? }
supports: { teams, capture }        // capture: device | qrcard | teacher
gradable: boolean
```

- **Chegara qurilmalar sonida emas, EGALIKDA.** Faqat
  `capture: "teacher"` (ustoz butun sinf uchun bitta javob belgilaydi)
  baholanmaydi.
  ⚠️ **`qrcard` (Plickers) BAHOLANADI** — 30 oʻquvchi, bitta kamera,
  lekin karta oʻzi roʻyxat bogʻlovchisi va har javob `student_id` ga
  tushadi (`quiz_sessions.mode = "qrcards"`,
  [ost-loyihalar-arxitektura.md:2438](./ost-loyihalar-arxitektura.md)).
  Dastlab bu maydon `perDevice: boolean` edi va u «oʻz qurilmasi» bilan
  «javob egasi aniq» ni bitta bayroqqa qoʻshib yuborgandi — QR-karta
  rejimi notoʻgʻri bloklanardi.
- **`optionRange` ataylab tor (2..4).** Qobiq nechta tugma chiza
  olishini tashqaridan koʻrolmaymiz; tor kontrakt xato tomonga
  xavfsiz.
- **Mos kelmagan qobiq yashirilmaydi** — panelda sababi bilan turadi
  («Kamida 6 savol kerak — hozir 3 ta»). Oʻchiq tugma «nega?» degan
  savol qoldiradi.
- Kontent xulosasi serverda hisoblanadi: `summarizeSetContent()`
  (`server/dal/assess/sets.ts`), hamma toʻplamga uchta soʻrov.

Qolgan ochiq ish: `supports.teams` hozir ikkala qobiqda ham `false` —
u (a) bilan birga jonlanadi.

<details>
<summary>Dastlabki taklif (tarix uchun)</summary>

Kichik, faqat bizning kod, LessonLabga bogʻliq emas. `GameShell` ga:

- `optionRange: { min, max }` — qobiq nechta variantni chiza oladi.
  Hozir `shapes: ["mcq"]` «har qanday mcq» degan maʼno beradi, bu
  notoʻgʻri: `mcq` variantlari **2 tadan 8 tagacha** boʻlishi mumkin
  (`actions/assess.ts` zod sxemasi), qobiq esa 4 tada qotib qolgan
  boʻlishi mumkin. True/False = 2 variantli `mcq`, alohida shakl
  kerak emas. Ikki qobiq (arqon 6, poyga 5) allaqachon har xil
  `minQuestions` talab qiladi — oʻlchov oʻqi bitta emasligi koʻrindi.
- `supportsTeams: boolean` — (a) tayyor boʻlgach kerak boʻladi.
- `gradable: boolean` — krossvord/xotira kabi oʻyinlarni **mashq**
  sifatida koʻrsatib, «jurnalga tushmaydi» deb ochiq yozish. Hozirgi
  «roʻyxatdan yashiramiz» yechimi muammoni berkitadi.

</details>

### (c) Toʻxtash

Nashr bugi tuzatildi (`publish.ts` xom ball yozadi, foiz emas). Shu
holat barqaror — yangi ish boshlamasdan turish ham asosli tanlov.
