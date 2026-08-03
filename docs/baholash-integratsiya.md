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

## 6. Hali qilinmagan

- **Oʻyin qobiqlarini moslash.** `quiz-loader.js` hamkor rejimini
  qoʻllab-quvvatlaydi, lekin oltita qobiqning oʻzi hali javobni
  mahalliy solishtiradi (`chosen === item.answer`). Har birida uni
  `await LLQuiz.check(chosen)` ga oʻgirish kerak.
- **OMR endpointi.** Skaner dvigateli LessonLab tomonida serverga
  koʻchirilmoqda (varaq geometriyasi va oʻqish mantigʻi tayyor va test
  bilan qoplangan). `POST /api/v1/scan/omr` chiqqach `scanOmrSheet()`
  ishlaydi.
- **Javob varagʻi PDF endpointi** — hamkor uchun ochilmagan.
- **QR-kartalar** — telefonsiz sinf uchun; hali boshlanmagan.
- **`pairs` qobiqlari.** Hozircha hamkor rejimida faqat `mcq` qadamlar
  uzatiladi.
