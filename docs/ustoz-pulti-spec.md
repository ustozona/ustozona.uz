# Ustoz pulti — darsni telefondan boshqarish

> **Holat:** 1-bosqich amalga oshirildi (2026-10-02). Doska ishi
> yakunlangach (Doska jamoasi tasdiqladi), loyiha egasining talabi bilan.
>
> Bogʻliq: `dars-studiyasi-spec.md` (§8 — shu ishning rejasi),
> `taqdimot-spec.md` (R284 jonli sessiya), `baholash-integratsiya.md`
> (skaner chiptasi, OMR, QR-karta), `doska-*.md`.

---

## 1. Maqsad

Oʻqituvchi dars paytida sinf oldida turadi, doska (proyektor) esa
kompyuterdan boshqariladi. Har slayd, har «Javobni ochish», har tekshiruv
uchun kompyuterga qaytish — darsning eng katta toʻsigʻi.

**Yechim:** Doska — darsni oʻtkazish maydoni, oʻqituvchi telefoni — pult
va skaner. Bitta QR bilan ulanadi (telefonda kirish shart emas), kirgan
oʻqituvchi esa QR'siz.

## 2. Arxitektura

```
Dars studiyasi ──(localStorage)──► Doska ◄──(Realtime broadcast)──► Telefon
   ssenariy                         hokimiyat: ekranlar,              /pult/<chipta>
                                    taqdimot qadami                   buyruq yuboradi,
                                                                      holatni koʻrsatadi
                                                                          │
                                         /api/baholash/scan/apply ◄───────┘ skaner
                                         (mavjud yoʻl → responses → jurnal)
```

- **Hokimiyat — Doska.** Holat Doskada (brauzer xotirasi) hisoblanadi va
  kanalga eʼlon qilinadi; telefon faqat buyruq yuboradi. Ikki telefon
  ulansa ham ziddiyat yoʻq.
- **Kanal** — Supabase Realtime broadcast (`useRealtimeChannel`), tasodifiy
  128-bitli mavzu (`remote-<32 hex>`). DB ga hech narsa yozilmaydi.
- **Buyruqlar Doskaning OʻZ amallari orqali bajariladi:** ekran —
  `setActiveScreen`; taqdimot — vidjetning oʻz tugmalari
  (`lib/doska/remote-bus.ts`). Shuning uchun jonli sessiya ham xuddi
  qoʻlda bosilgandek suriladi (oʻquvchi telefonlari ergashadi). Ikkinchi
  mantiq yozilmadi.
- **Shartnoma** — `lib/doska/remote-protocol.ts` (yagona manba).

### Buyruqlar (telefon → Doska)

| Buyruq | Natija |
|---|---|
| `hello` | Doska holatni qayta eʼlon qiladi; har 20 s — «telefon ulangan» belgisi |
| `screen` next/prev, `screen-goto` | Ekran almashadi |
| `step` next/prev, `reveal` | Joriy ekrandagi taqdimot qadami / javob |
| `curtain` | Parda (ekran yopiladi) |
| `scanned` | Telefonda javoblar yozildi — Doskada xabar |

### Holat (Doska → telefon)

Ekranlar roʻyxati (taqdimot nomi yoki vidjet turi), faol ekran, faol
ekrandagi taqdimot (nom, qadam, turi, matni, javob ochilganmi, jonli
sessiya PIN va qoʻshilganlar, variantli savollar soni), dars nomi, parda.

## 3. Dars rejimi (`/doska?lesson=1`)

Studiyada «▶ Darsni boshlash» → ssenariy `localStorage` orqali Doskaga
(`lib/doska/lesson-handoff.ts`; URL ga sigʻmaydi, Doska dashboard'dan
tashqarida). 10 daqiqadan eski yozuv eʼtiborsiz.

| Blok | Doska ekrani |
|---|---|
| Dars boshi, tushuntirish, tekshiruv, chiqish chiptasi | Taqdimot vidjeti (toʻliq ekran). Jonli usul yoki telefon+ekran boʻlsa — sessiya shu ekranga kelinganda oʻzi ochiladi |
| Guruh ishi | Yoʻriqnoma matni + bosqich taymeri + sinf roʻyxati bilan guruhlar |
| Mashq oʻyini | «Sayt» vidjetida Ustozona-Games oʻyini |
| Tashqi havola | Yoʻriqnoma + «Havola» vidjeti |
| Baholanadigan oʻyin, uy vazifasi | Yoʻriqnoma (boshlash — Topshiriqlardan, natija jurnalga) |
| Material tayyor emas | Yoʻriqnoma matni |

Mavjud ekranlar **oʻchirilmaydi** — dars ekranlari oxiriga qoʻshiladi,
birinchisi ochiladi va pult oynasi oʻzi chiqadi. Hamma vidjet odatdagi:
oʻqituvchi ekranni tahrirlay oladi, Doskada hech narsa cheklanmagan.

Kompyuterdagi roʻyxat (dars pulti, Doskasiz) — «Kompyuterda roʻyxat
boʻyicha» sifatida qoldi.

## 4. Xavfsizlik

- **Pult chiptasi** (`server/remote/remote-ticket.ts`) — imzo (HMAC,
  `BETTER_AUTH_SECRET` dan alohida maqsad yorligʻi bilan), jadval yoʻq;
  oʻqituvchi id + mavzu + muddat (12 soat). ~70 belgi — QR yirik.
- Chipta ruxsat beradigani: shu Doska kanaliga ulanish va **oʻqituvchining
  oʻz testi** uchun skaner chiptasi olish (`remoteScanTicketAction` —
  `buildSheetPlan` bilan egalik tekshiriladi). Jurnalni oʻqish, sinf yoki
  oʻquvchini oʻzgartirish — yoʻq. Toʻgʻri javoblar telefonga kelmaydi.
- Kanal ommaviy (`private: false`), himoya — mavzuning tasodifiyligi.
  Kanal faqat navigatsiya buyrugʻi tashiydi; kelgan har buyruq
  `parseRemoteCommand` bilan tekshiriladi.
- Prod Supabase'da ommaviy kanalga mijozdan yozish ochiq — 2026-10-02 da
  ikki mijoz bilan tekshirilgan (anon va publishable kalit, ikki
  tomonga: buyruq → Doska, holat → telefon). Loyiha sozlamasida
  «faqat yopiq kanallar» yoqilsa pult ulanmaydi — oʻshanda kanalni
  `private: true` + RLS siyosatiga oʻtkazish kerak.
- «Yangi QR» yangi kanal ochadi — eski chipta Doskani boshqara olmaydi.

## 5. QR'siz ulanish (`/pult`)

Doskada pult ochilganda chipta `teachers.prefs.doskaRemote` ga yoziladi
(atomik `||`). Telefonda kirgan oʻqituvchi (brauzer, Telegram, Ustozona
ilovasi) `/pult` ni ochsa — oxirgi Doskaga yoʻnaltiriladi.

## 6. Telefonda tekshirish

**QR-kartalar** endi Doskada **sinf testi** sahnasini ochadi
([`sinf-testi-spec.md`](./sinf-testi-spec.md)). Sahna LessonLab botidagi
smart doska kabi: kutish zali → savol → savol natijasi → yakuniy
natijalar. Telefon kamera boʻladi va Doskadagi joriy savolga ergashadi.
Doskasiz eski yoʻl ham qoldi («Doskasiz: kartalarni faqat telefonda
yigʻish»).

Joriy ekrandagi taqdimot testi uchun **Varaq (OMR)** va doskasiz karta —
mavjud `ScanPanel` (Topshiriqlardagi bilan aynan bir yoʻl). Natija
avval roʻyxatda, «Jurnalga kiritish» bilan `responses` ga; jurnal ustuni —
kompyuterda bitta tugma (oʻzgarmadi). Telefon ekrani oʻchmaydi (Wake Lock).

## 7. Tezkor tekshirish (2-bosqich)

Maxsus varaq chop etish shart emas:

1. Telefonda **«Shablon doskaga»** — Doskada yangi ekran: «Ism Familiya:
   ___» va «1) ___ 2) ___ …» (savollar soni — testdagi variantli
   savollar). Joriy ekranga tegilmaydi.
2. Oʻquvchi oddiy qogʻozga ismini va javoblarini yozadi.
3. Telefonda **«Qoʻlda yozilgan»** → surat → `POST /api/baholash/quick-check`
   (cookie yoki skaner chiptasi, `/api/baholash/scan` bilan bir qoida).
   AI (Gemini, rasm) FAQAT oʻqiydi: ism va harflar; toʻgʻri javob unga
   berilmaydi, ball serverda. Bitta surat — bitta AI krediti.
   **Bitta suratda 4 tagacha varaq** (`QUICK_MAX_SHEETS`, 2026-10-03):
   ustoz varaqlarni stolga yonma-yon teradi, model `{"sheets":[…]}`
   qaytaradi (chapdan oʻngga, yuqoridan pastga), har varaq roʻyxatga
   alohida tushadi. 32 kishilik sinf — 8 kredit (oldin 32). Koʻprogʻi
   kadrga sigʻmaydi — qoʻlyozma kichrayib oʻqilmay qoladi. Javobda eski
   `read` ham bor (birinchi varaq): deploy paytida ochiq qolgan sahifa
   buzilmasin.
4. Ism sinf roʻyxatiga moslanadi (`lib/quick-check.ts`: kirill → lotin,
   apostroflar, qisqartma, 1–2 harf xato). Ikki oʻquvchi deyarli teng mos
   kelsa — tanlanmaydi, oʻqituvchi tanlaydi. AI ishonchsiz harf — sariq.
5. Natija QR-karta va OMR bilan BIR roʻyxatga tushadi → «Jurnalga kiritish».

Provayder: `StreamChatArgs.image` (faqat Gemini; rasm boʻlsa zanjir
Gemini bilan cheklanadi — boshqa model rasmsiz javob toʻqimasin).

## 8. Radio pult (3-bosqich)

- Telefonda **«Pult (radio)»** → Doskada joriy taqdimot testi bilan pult
  rejimi ochiladi (`PultRunner`, Topshiriqlardagi bilan bir yoʻl). Endi bu
  ham **sinf testi** sahnasi (`sinf-testi-spec.md`), QR-karta bilan bir
  xil koʻrinishda.
- **Bosishsiz qayta ulanish:** brauzer qabul qilgichga ilgari ruxsat
  bergan boʻlsa (`navigator.serial.getPorts()`), port tanlash oynasisiz
  ulanadi. Birinchi ruxsat — baribir kompyuterda bir marta (brauzer
  qoidasi, chetlab boʻlmaydi).
- Sinf testi ochiq boʻlsa telefon uni boshqaradi (`remote-bus` →
  `publishClassTest`, buyruq `{type:"test", action}`):
  - boshlash, «Javobni koʻrsatish», keyingi va oldingi savol;
  - telefonda «N / M javob berdi» koʻrinadi.
- Saqlash — yakuniy ekranda «Jurnalga saqlash». Uni kompyuterda ham,
  telefonda ham bosish mumkin.

## 9. Telegram va Ustozona ilovasi (4-bosqich)

- **Telegramga yuborish** — Doskadagi pult oynasida tugma: bot
  oʻqituvchining Telegramiga «Pultni ochish» tugmali xabar yuboradi
  (`sendRemoteToTelegramAction`). Havola mijozdan olinmaydi — serverdagi
  oxirgi chiptadan quriladi. Telegram bogʻlanmagan boʻlsa — aniq sabab.
- **Ilova** — `GET /api/mobile/v1/remote` (Bearer): oxirgi Doskaning pult
  havolasi. Ilova uni brauzerda ochadi — brauzerda kirish shart emas.
  Ilova tomoni (LessonLab repo, `mobile/`) — Skaner boʻlimida
  «Doska pulti».
- **Ilovaning oʻz kamerasi (3.8)** — Skaner → «QR-kartalar» / «Pult»
  brauzer ochmaydi: ilova Doska kanaliga oʻzi ulanadi va sinf testini
  boshqaradi, kartalarni oʻz kamerasi bilan oʻqiydi.
  - `GET /api/mobile/v1/remote` endi `live: {topic, realtime, expiresAt}`
    ham qaytaradi (eski ilova uni eʼtiborsiz qoldiradi);
  - `POST /api/mobile/v1/remote/roster {setId, classId}` — karta raqami
    → ism; egalik Bearer sessiyadagi oʻqituvchidan tekshiriladi, faqat
    `no` va `name` qaytadi;
  - xabarlar shu hujjatdagi protokol (`remote-protocol.ts`) — ilova
    `hello`, `cards`/`pult`, `test`, `card` yuboradi;
  - aniqlagich `src/lib/cards/detect.ts` ning Dart nusxasi; moslik
    etalon kadrlar bilan tekshiriladi (`scripts/gen-card-app-fixtures.ts`
    → `mobile/test/fixtures/cards/`). ⛔ Aniqlagich yoki lugʻat
    oʻzgarsa — ilovani ham.

## 10. Keyingi bosqichlar

1. ~~**Kartani savolga bogʻlash**~~ — bajarildi: sinf testi
   (`sinf-testi-spec.md`).
2. ~~**Ilova ichida native kamera**~~ — bajarildi (§9, ilova 3.8).
