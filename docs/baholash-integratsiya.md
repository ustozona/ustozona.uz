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
- **Jamoaviy rejim oʻchadi (arqon).** Ikki jamoaning javobi bitta
  oʻquvchi tokeni bilan yozilardi — jurnalga boshqa bolaning javobi
  tushardi.
- **Matematikaga tushib ketmaydi.** Savol yuklanmasa oʻyin boshlanmaydi;
  aks holda bola oʻqituvchi bermagan misollarni yechardi va natija hech
  qayerga yozilmasdi.
- **Tarmoq uzilsa javob «notoʻgʻri» boʻlmaydi.** Server javob bermasa
  oʻquvchiga eslatma chiqadi va u qayta bosa oladi.

## 7. Qogʻoz test (OMR) — endpoint tayyor

`POST /api/v1/scan/omr?test_id=…` ishlaydi. Rasm yuboriladi, javob
HAR DOIM roʻyxat: bitta A4 sahifada 4 tagacha varaq boʻlishi mumkin.

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
- ~~Javob varagʻi PDF endpointi~~ — tayyor:
  `POST /api/v1/engine/answer-sheets` (oʻqituvchi tokeni kerak emas).
- **Testlarni import qilish** — `importTests()` yozilgan, lekin UI'ga
  ulanmagan: oʻqituvchi qaysi sinfga koʻchirishni tanlashi kerak.
- **QR-kartalar** — telefonsiz sinf uchun; hali boshlanmagan.
- **`pairs` uchun qobiq yoʻq.** Hamkor rejimida faqat `mcq` qadamlar
  uzatiladi; juftlash savollari oddiy ekranda oʻynaladi.
