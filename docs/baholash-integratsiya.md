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

## 8-bis. Varaqni skanerlash — qaysi ekranda va NEGA aynan u

Qogʻoz testning qaytish yoʻli `/baholash` → Qogʻoz test panelida, chop
etish tugmalarining OʻZIDA (`ScanPanel.tsx`). Uchta muqobil koʻrib
chiqilgan edi:

| Joy | Nega yoʻq |
|---|---|
| LessonLab Telegram boti | Bot LessonLab kimligini biladi, Ustozona oʻqituvchisini emas. Natija Ustozona jurnaliga tushishi kerak, jurnal esa akkauntga bogʻlangan — bot uchun kimlik koʻprigi qurish kerak boʻlardi. Aynan shu koʻprik keraksiz deb `/engine/*` tanlangan edi (§7). |
| Alohida mobil ilova | Telefon brauzeri kamerani `capture="environment"` bilan oʻzi ochadi. Ilova hech narsa qoʻshmaydi, lekin oʻrnatish toʻsigʻini qoʻshadi. |
| Dashboard ichida alohida boʻlim | Oʻqituvchi uchun bu BITTA ish — «qogʻoz test». Chop etish bir joyda, kiritish boshqa joyda boʻlsa yoʻlning ikkinchi yarmi topilmay qolardi. |

### Oqim ikki qadam — ataylab

```
surat → POST /api/baholash/scan → EKRANDA javoblar   (hech narsa yozilmaydi)
        ↓ oʻqituvchi tekshiradi/tuzatadi
        applyOmrScanAction() → participant + responses → sessiya (mode=paper)
        ↓ oʻqituvchi Topshiriqlar boʻlimida
        publishSessionToGrades() → jurnal
```

Oradagi koʻrib chiqish qadami **shart**, chunki QR tartib raqamini
tashiydi: varaq chop etilgandan keyin sinfga bola qoʻshilsa raqamlar
suriladi va varaq boshqa bolaga bogʻlanadi. Buni kod sezmaydi — faqat
oʻqituvchining koʻzi ushlaydi. Shuning uchun oʻquvchi roʻyxatdan
qoʻlda ham tanlanadi (ismsiz imtihon varagʻi ham shu yoʻl bilan
kiritiladi).

### Noutbuk → telefon: QR, «havolani yuboring» EMAS

Birinchi versiyada skaner faqat `/baholash` panelida edi va bu amalda
ishlamadi: **oʻqituvchi Ustozonani noutbukda ochadi, kamera esa
telefonda**. Oradagi «havolani telefonga yuboring» qadami — oqimning
eng zaif joyi, hech kim oʻziga oʻzi havola yubormaydi.

Endi noutbukda **QR** chiqadi, oʻqituvchi telefon kamerasini oʻz
monitoriga tutadi:

```
noutbuk  «Telefonda skanerlash»
         → createScanHandoffAction()  → imzolangan CHIPTA + QR (SVG)
telefon  kamera QR ni oʻqiydi
         → /baholash/skaner/<chipta>   ← kirish TALAB QILINMAYDI
         → surat → tekshirish → kiritish
```

Chipta — `server/baholash/scan-ticket.ts`, HMAC bilan imzolangan
`{teacherId, setId, classId, exp}`. Jadval yoʻq: migratsiya, tozalash
vazifasi va yana bitta saqlash joyi qoʻshmaslik uchun server oʻzi
bergan chiptani imzodan tanib oladi.

⚠️ Narxi: chiptani **bekor qilib boʻlmaydi**. Shuning uchun umri 2
soat va qamrovi tor — faqat bitta test + bitta sinfga varaq kiritish.
Chiptani qoʻlga kiritgan odam jurnalni oʻqiy olmaydi, boshqa sinfga
tegmaydi. Bu `/play` ishtirokchi tokeni bilan bir xil savdo (§4).

Telefon sahifasi ataylab yalangʻoch: bitta test, bitta ish, menyu yoʻq
— chipta boshqa hech narsaga ruxsat bermaydi. `robots: noindex`.

## 8-ter. Telegram bot yoʻli — NEGA HALI YOʻQ

«Bitta tugma bilan `@uzlessonlabbot` ga oʻtsin, botda hammasi tayyor»
degan talab tabiiy, lekin ikkita toʻsiq bor.

**1. Bot LessonLab jurnaliga yozadi.** Botdagi tayyor OMR funksiyasi
`/api/v1/scan/*` yoʻlidan ketadi va natijani **LessonLab** jurnaliga
yozadi (§7 dagi jadval). Ustozona jurnaliga tushishi uchun bot suratni
bizga qaytarishi kerak — bu bot tomonida YANGI ishlov, mavjud
funksiya emas.

**2. Chipta Telegram havolasiga sigʻmaydi.** `t.me/<bot>?start=<payload>`
da `payload` **64 belgi** va faqat `A-Za-z0-9_-`. Bizning chiptada
uchta UUID + muddat + imzo bor — eng ixcham koʻrinishda ham 80+ belgi.

Demak bot yoʻli uchun kerak boʻladi:

| Tomon | Ish |
|---|---|
| Ustozona | qisqa kod jadvali (`scan_codes`: kod → chipta, TTL), kod beruvchi endpoint |
| Ustozona | `POST /api/baholash/scan/relay` — bot suratni shu yerga yuboradi (kod + rasm) |
| LessonLab bot | `/start <kod>` ishlovi: kodni eslab qoladi, keyingi suratni relay'ga yuboradi |
| LessonLab bot | natijani foydalanuvchiga koʻrsatish (yoki «Ustozonada koʻring» deyish) |

Tekshirish qadami (kim qaysi varaq) baribir kerak, u esa katta ekranda
qulayroq — shuning uchun bot yoʻlida ham tasdiqlash noutbukda qolishi
maʼqul, bot faqat KAMERA boʻladi.

QR yechimi shu ishning hammasini talab qilmaydi va bugun ishlaydi,
shuning uchun avval u qilindi. Bot yoʻli — yuqoridagi toʻrt qadam
bajarilganda qoʻshiladi.

## 8-quater. Jonli skaner — kamerani tutasiz, oʻzi oʻqiydi

Surat-yuklash oqimi ishladi, lekin sekin edi: har varaqqa kadr olish,
3-8 MB yuklash, dvigatel javobini kutish — 30 ta varaq yarim soat.
LessonLab botidagi mini-app esa varaqni **kameraga tutgan zahoti**
oʻqirdi.

Endi oʻsha dvigatel Ustozonada. Muhimi: **u serversiz ishlaydi.**
LessonLab skanerining butun OMR mantigʻi brauzerda — server bilan u
faqat maʼlumot olish/saqlash uchun gaplashardi, ularni esa bizda
allaqachon bor narsalar almashtiradi.

```
kamera kadri
  → jsQR          QR ni topadi (avval yuqori-chap 60%×55% — 4x tez)
  → findSheetCorners()   QR oʻlchamidan masshtab, 3 ta qora burchak
                         belgisi suratdan aniqlashtiriladi
  → CV.warp()            varaq 600×600 kvadratga yoyiladi
  → CV.adaptiveThreshold()
  → readBubbles()        qator belgilari bilan Y tuzatiladi, katak
                         qator ICHIDA solishtiriladi
  → 3 kadr kelishuvi → qabul
```

### Uch kadr qoidasi

Natija ketma-ket **uch kadr bir xil** oʻqilgandagina qabul qilinadi.
Bu ayni paytda harakat tekshiruvi ham: telefon qimirlasa warp siljiydi,
chegaradagi kataklar oʻzgaradi, oʻqishlar mos kelmaydi va sanoq nolga
tushadi. Alohida «qimirlamang» detektori kerak emas.

### Nima koʻchirildi, nima yoʻq

| Narsa | Qaror |
|---|---|
| `cv.js` (950 satr) | FAQAT `Image`, `warp`, `adaptiveThreshold` koʻchirildi — skanerlash yoʻlida boshqasi chaqirilmaydi. MIT litsenziyasi saqlangan. |
| `jsQR` | npm paketi (CDN emas — offline va CSP uchun) |
| Supabase chaqiruvlari | Olib tashlandi. Roʻyxat `buildSheetPlan()` dan, yozish `applyOmrScan()` ga. |
| Baholash mijozda | **Olib tashlandi.** LessonLab varianti toʻgʻri javoblarni brauzerga yuklab, ballni oʻsha yerda hisoblardi — bizda toʻgʻri javob mijozga umuman chiqmaydi (§7). Ekranda faqat «nechta javob oʻqildi». |
| Telegram WebApp SDK | Kerak emas — oddiy sahifa. |

### Geometriya shartnomasi

`src/lib/omr/sheet-layout.ts` dagi raqamlar `answer_sheet_generator.py`
dan koʻchirilgan va har biri manbasi bilan izohlangan. Chizuvchi va
oʻquvchi bir xil oʻlchovga tayanishi SHART: bir tomon oʻzgarsa,
ikkinchisi notoʻgʻri joyni oʻqiydi va buni sezmaydi — natija boʻsh
emas, XATO boʻladi. Dvigatel yangilansa avval shu fayl solishtiriladi.

### Tekshirish qadami saqlandi

Jonli skaner varaqni roʻyxatga qoʻshadi, **darhol yozmaydi**. Sabab
oʻzgarmadi (§8-bis): QR tartib raqamini tashiydi, roʻyxat surilgan
boʻlsa varaq boshqa bolaga bogʻlanadi. Kamera yopilgach oʻqituvchi
hammasini koʻrib chiqib «Jurnalga kiritish» ni bosadi.

## 8-quinquies. QR-kartalar — faqat chop etish

`answerCardsPdf()` UI'ga ulandi: Qogʻoz test panelida «QR-kartalarni
chop etish». Plickers naqshi — har bolaga bitta karta, u burab javob
beradi, oʻqituvchi butun sinfni bitta suratga oladi. Karta testga
emas SINFGA bogʻlangan: bir marta chop etilib yil boʻyi ishlatiladi.

⚠️ **Kartani oʻqiydigan skaner YOʻQ.** Kartaning qaysi burilishi qaysi
javobni bildirishi LessonLab tomonidagi kelishuv va u bizga
hujjatlashtirilgan holda berilmagan. Panelda buni ochiq yozdik —
«tayyor» deb koʻrsatib keyin oʻqiy olmaslik eng yomon holat boʻlardi.
Kerak boʻlsa: burilish → javob jadvali va karta geometriyasi.

### Qaror qilingan mayda narsalar

- **Bir varaq — bir marta.** Oʻquvchi kiritilgan boʻlsa ikkinchi varaq
  oʻtkazib yuboriladi. `publishSessionToGrades()` ishtirokchining hamma
  javobini qoʻshadi, demak takror kiritish ballni ikki barobar qilardi
  — «800%» xatosi aynan shu turkumdan.
- **Bitta sessiya.** Har surat yangi sessiya ochsa, jurnalda bitta test
  uchun beshta topshiriq paydo boʻlardi. Shuning uchun test+sinf uchun
  `mode = "paper"` sessiyasi qayta ishlatiladi.
- **`submitResponse()` emas, toʻplam INSERT.** U bitta onlayn javob
  uchun yozilgan (urinish sanash, sessiya holati) va 30 javobga 150
  soʻrov qilardi. Ballash baribir bitta joyda qoladi — `scoreResponse()`.
- **Boʻsh katak yozilmaydi**, `X` esa yoziladi va XATO boʻladi: bola
  javob bergan, lekin noaniq.
- **Past ishonchli katak** sariq belgi bilan koʻrsatiladi; oʻqituvchi
  bosib tuzatadi.
- **Variantli boʻlmagan savol** (juftlash) qogʻozdan oʻqilmaydi va buni
  panel ochiq aytadi — jim tashlab ketmaydi.
- **Surat brauzerda kichraytiriladi** (2000 px, JPEG): Vercel soʻrov
  tanasi ~4.5 MB, telefon surati esa bemalol 8 MB boʻladi.

## 9. Hali qilinmagan
- ~~Javob varagʻi PDF endpointi~~ — tayyor va UI'ga ulangan:
  `/baholash` → Qogʻoz test → «Sinf roʻyxati bilan» / «Imtihon».
- ~~Testlarni import qilish~~ — tayyor: sinf tanlanganda «Testlarni
  koʻchirish» tugmasi chiqadi (`/api/lessonlab/start?class=…`).
- ~~Varaqni skanerlash UI'si~~ — tayyor: shu panelda «Varaqni suratga
  olish» (§8-bis).
- ~~Noutbukdan telefonga oʻtish~~ — tayyor: «Telefonda skanerlash» → QR.
- ~~Jonli kamera skaneri~~ — tayyor (§8-quater).
- ~~QR-kartalar PDF~~ — tayyor (§8-quinquies), lekin faqat chop etish.
- **QR-kartalarni oʻqish** — LessonLab'dan burilish→javob shartnomasi kerak.
- **Telegram bot yoʻli** — shartnoma §8-ter da yozilgan, ikki tomonlama
  ish talab qiladi.
- **QR-kartalar** — `answerCardsPdf()` tayyor, UI hali yoʻq.
- **Skanerlangan sessiyani jurnalga koʻchirish** hali Topshiriqlar
  boʻlimidagi sessiya panelidan qilinadi. `/baholash` dan toʻgʻridan-
  toʻgʻri koʻchirish tugmasi — keyingi qadam.
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
git checkout -b <ism>/<tavsif> upstream/main

# 2. npm run build lokal oʻtishi shart — Vercel bitta umumiy deploy.
npm run build

# 3. Branch UPSTREAM'ga push qilinadi (main'ga emas, branch'ga).
git push upstream <ism>/<tavsif>
```

PR upstream ichida, oddiy same-repo PR sifatida ochiladi:

```
https://github.com/ustozona/ustozona.uz/compare/main...<ism>/<tavsif>?expand=1
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

**Guruh bali (2026-08-04, HAL QILINDI): yigʻindi + tenglashtiruvchi.**
Yalangʻoch yigʻindida katta guruh avtomatik yutadi; oʻrtachada bola
«mening ballim qoʻshildi» hissini yoʻqotadi. Wayground modeli ikkalasini
ham hal qiladi — kam sonli guruhga oʻz oʻrtachasi bilan oʻynaydigan
xayoliy aʼzo qoʻshiladi:

```
guruh_bali = Σ(aʼzolar bali)
           + (eng_katta_guruh − shu_guruh) × shu_guruh_oʻrtachasi
```

Kahoot oʻrtacha ishlatadi, lekin u yerda guruhda BITTA qurilma — guruh
allaqachon bitta birlik. Bizda har bola oʻz qurilmasida, shuning uchun
yigʻindi koʻrinishi saqlanishi kerak. Toʻliq tahlil:
[baholash-mantigi-tushuntirish.md](./baholash-mantigi-tushuntirish.md) §8.

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
