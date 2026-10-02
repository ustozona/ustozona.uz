# Doska — referens koʻriklari (boshqa doskalardan nima olamiz)

> **Holat (2026-10-01):** 3 ta referens koʻrildi; 2-referensning vizual
> tizimi alohida chuqur koʻrildi (§4 — vidjet yuzasi, «Varaq» taklifi).
> Foydalanuvchi keyingi referenslarni ham beradi — har biri shu hujjatga
> alohida boʻlim boʻlib qoʻshiladi, raqamlar davom etadi.
>
> Referens topilmalari **R380–R467** (oldingilari
> [doska-tezlik-tadqiqot.md](./doska-tezlik-tadqiqot.md) da, R372–R379).
> Mahsulot nomlari yozilmaydi (AGENTS.md) — referens oʻz xususiyati
> bilan tasvirlanadi.
>
> **Usul.**
> - 1-referens: foydalanuvchi bergan bir lahzalik HTML (DOM) nusxasi.
>   Manba kodi oʻqilmagan.
> - 2-referens: brauzerda toʻliq koʻrildi (sayt, yordam markazi, ilova
>   mehmon rejimida, ilova kodidagi interfeys matnlari) — §2.1.
> - 3-referens: oʻsha xizmatning «kundalik ekran» shablonlari —
>   foydalanuvchi bergan skrinshot va DOM, ustiga beshta shablon ilovada
>   ochib koʻrildi — §3.1.
> - 2-referensning vizual tizimi: ilova mehmon rejimida qayta ochildi,
>   vidjetlarning hisoblangan uslublari va rang mavzulari oʻlchandi,
>   oʻzimizning fonlarimiz boʻyicha hisob qilindi — §4.1.
>
> Ikkalasi ham hozirgi Doska kodi bilan solishtiriladi. DOMda
> koʻrinmagan, mahsulotning maʼlum xususiyatidan olingan narsa alohida
> belgilanadi.

---

## 0. Xulosa — nima qilamiz

### 0.1. Referens 1 (umumiy chizma doskasi)

| # | Nima | Qaror | Hajm |
|---|---|---|---|
| R380 | Rus/kirill klaviaturasida yorliqlar ishlamaydi | ✅ **Qurildi** (§2.10) | 1 fayl |
| R381 | Butun Doskaga `translate="no"` | ✅ **Qurildi** (§2.10) | 3 joy |
| R382 | Yashirin imo-ishoralarga bir qatorli yoʻriqnoma | Navbatdagi Doska ishiga | kichik |
| R383 | Tooltipda yorliq harfi («Qalam · P») | ✅ **Qurildi** (§2.10) — tooltipli tugmalarda | kichik |
| R384 | Rasm qoʻyish: Ctrl+V va faylni tashlash | Navbatga — yangi vidjet | oʻrta |
| R385 | Strelka | Qaror kerak (qanday chaqiriladi) | oʻrta |
| R386 | Oʻz shablonlarim (chizmani saqlab qayta qoʻyish) | Keyin — ekranlar serverga koʻchgach | oʻrta |
| R387 | Kanvas tuzilmasi: statik + interaktiv | Tasdiq — bizda ham shunday | — |
| R388 | Cheksiz kanvas, qoʻl asbobi, masshtab | RAD | — |
| R389 | Alohida shakl asboblari va «asbobni qulflash» | RAD | — |
| R390 | Bosim almashtirgichi, toʻldirish, pipetka | RAD | — |
| R391 | Jonli hamkorlik | Keyin — sinf roʻyxati ulangach | katta |
| R392 | Faylga saqlash, PNG ichida tahrirlanadigan sahna | Qaror foydalanuvchida, tavsiya — hozircha yoʻq | oʻrta |

### 0.2. Referens 2 (vidjetli sinf ekrani xizmati)

Batafsil tartib — §2.5. Bu yerda faqat qaror boʻyicha guruhlangan.

| Qaror | Topilmalar |
|---|---|
| **Qaror kerak — server sinxronidan OLDIN** | R397 vidjet joyi piksellarda, ekran nisbati yoʻq |
| **Qaror kerak — biznes** | R393 sinf roʻyxati bepul hisobdami yoki Proʼdami; R392/R424 ulashish |
| **A. Tez, serversiz** | R398 barcha ekranlarda (pin) · R399 ekranlarni tartiblash/nusxa · R401 ekrandan tashqariga qoʻyish · R402 yorliqlar roʻyxati (`K`) · R405 taymer: takrorlash, qizil chegara, yorliqda vaqt · R406 disk ustida sudrab vaqt qoʻyish · R415 ish belgilari · R416 zar (oʻzbek alifbosi bilan) · R419 stikerlar (mavjud illyustratsiyalardan) · R422 faol nusxa nuqtasi, boʻsh holatlar |
| **B. Maʼlumot ustunligi (kirgan oʻqituvchi)** | R407 voqea sanogʻi ← oʻquv kalendari · R408 soat budilnigi ← qoʻngʻiroq jadvali · R409 bugungi dars rejasi ← dars jadvali va planner · R410 tasodifiy ism: standart koʻrinish, tayyor roʻyxatlar · R411 guruh tuzuvchi ← davomat, cheklovlar · R412 doskada bosib ovoz berish |
| **C. Server kerak** | R423 shablonlar (avval statik) · R424 ulashish · R425 boshqaruv paneli, jildlar · R399 yaqinda oʻchirilganlar |
| **D. Keyinroq** | R413 shovqin oʻlchagich · R414 hisob taxtasi · R418 veb-kamera, video, QR, havola, embed · R420 fonlar: bayram va mavsum, oʻz rasmi · R417 matn formatlash |
| **Tasdiq — bizda yaxshiroq** | R394 mehmon ishi saqlanadi · R395 toʻliq oʻzbekcha interfeys · R403 qaytarish koʻrinib turadi · R404 siyoh kanvasda (qalam asboblari kuchliroq) |
| **RAD** | R404 har chiziq alohida SVG · R421 vidjetga oʻz rang mavzusi (hozircha) · §2.6 |
| **UX/UI koʻrigi (R428–R442)** | Yangi vidjetlar uchun 7 ta majburiy qoida — §2.9. Olinadiganlar: R433 koʻrinish shaklga qarab («Avto»), R429 faol nusxa nuqtasi, R435 rasmli kartalar va jonli oldindan koʻrish. Bizda yaxshiroq: R431 birinchi teginishda amal, R439 taymer tugashi, R440 matn ramkaga moslashadi |

### 0.3. Referens 3 (kundalik ekran shablonlari — dizayn)

Batafsil — §3. Tartib — §3.4.

| Qaror | Topilmalar |
|---|---|
| **✅ Qurildi (§3.6)** | R447 «Karta» vidjeti (sarlavha + yozuv, bitta obyekt — R444) · R445 «Sana»: kun nomi oʻzi yangilanadi · R452 shablonda joy ulushi · R454 «Kun rejasi» shabloni · R446 hozirgi darsda vaqt chizigʻi · R448 «yumshoq sahna» CSS fonlari |
| **Keyin** | R449 stikerni burish · R450 qoʻlyozma shrift (glif tekshiruvidan keyin) |
| **Olinmaydi** | R448 fotosurat katalogi va yarim shaffof kartalar · R451 shablon palitrasi vidjetlarga · ularning har qanday fayli (R453) |
| **Qoida** | R453 — «1:1 emas» tekshiruvi: joylashuv, rang, shrift, tasvir, matn — beshalasi oʻzimizniki |
| **Qaror qilindi (§3.5)** | «Karta» alohida vidjet; fon faqat CSS; nomi «Sana» |

### 0.4. Referens 2 — vizual tizim: vidjet yuzasi (R455–R467)

Batafsil — §4. Taklif — §4.3, savollar — §4.5.

| Qaror | Topilmalar |
|---|---|
| **Taklif — «Varaq»** | Har vidjet oq varaqda, fondan qatʼiy nazar (R455, R459, R465); tus — urgʻu, fon emas (R456, R460); butun varaq faqat holat uchun rang oladi; uslub faqat ishlovni tanlaydi (R462) |
| **Tuzatib olinadi** | R458 — chegarasiz oq karta 21 fonimizdan 13 tasida koʻrinmaydi → chiziq + soya |
| **Bizda yaxshiroq / qoladi** | R461 raqam qalinligi 600–700 (proyektor); R464 sozlama vidjet yonida (Q2) |
| **Olinmaydi** | Ularning mavzu ranglari, shrifti, radiusi; vidjetga alohida mavzu (R421 rad qarori kuchda) — R467 |
| **✅ Qaror (2026-10-02)** | «UI toʻliq referens asosida boʻlsin, xuddi shuni olamiz» — §4.5 |
| **✅ Qurildi (§4.6)** | standart uslub — oq panel va oq varaq; qobiq joylashuvi, panel, kontekst panel, sozlama oynasi referensdek; «Karta» sarlavha tasmasi; «Matn» varaqda; taymer halqasi |

---

## 1. Referens 1 — ochiq manbali umumiy chizma doskasi

Brauzerda ishlaydigan, cheksiz kanvasli, diagramma va eskiz uchun
moʻljallangan doska. Taʼlim uchun emas, umumiy maqsadli. Nusxa olingan
holat: qalam rejimi tanlangan, element tanlanmagan, masshtab 100%,
ixcham interfeys.

### 1.1. DOMda koʻrinib turgan tuzilma

- **Yuqori chap:** asosiy menyu (☰) va tanlangan asbob xossalarining
  ixcham paneli: chiziq rangi, fon (toʻldirish) rangi, «Bosim»
  almashtirgichi, qalinlik (popover ichida).
- **Yuqori markaz — asboblar paneli:** qulf (Q) │ qoʻl (H), tanlash,
  toʻrtburchak (R yoki 2), romb (D yoki 3), ellips (O yoki 4), strelka
  (A yoki 5), chiziq (L yoki 6), qalam, matn (T yoki 8), stiker (N),
  oʻchirgʻich (E yoki 0) │ «Boshqa asboblar» (⋮). Panel ichida — joriy
  asbob uchun bir qatorli yoʻriqnoma.
- **Yuqori oʻng:** jonli hamkorlik tugmasi, kutubxona (yon panel, `0`).
- **Pastki chap:** masshtab (− 100% +), qaytarish va qaytarishni bekor
  qilish.
- **Pastki markaz:** shifrlash belgisi. **Pastki oʻng:** yordam (?).
  Interfeysni yashirish rejimidan chiqish tugmasi.
- **Kanvaslar:** `static` va `interactive`, ikkalasi 1344×869 px, CSSda
  1075,2×695,2 (DPR 1,25). Yonida boʻsh SVG qatlam, matn muharriri,
  kontekst menyu va pipetka konteynerlari.
- **Ildiz:** `translate="no"` + `notranslate` klassi, `tabindex="0"`,
  `--ui-pointerEvents` CSS oʻzgaruvchisi.

### 1.2. Bizda allaqachon bor (qayta qilinmaydi)

| Referensda | Doskada |
|---|---|
| Qalam (bosim simulyatsiyasi bilan) | Qalam + marker, bosim simulyatsiyasi (R331) |
| Oʻchirgʻich | Butun chiziq + qisman (R334) |
| Lazer («Boshqa asboblar» ichida) | Lazer, `L` yorligʻi |
| Chiziq, toʻrtburchak, ellips | Tekislash imo-ishorasi — chizib ushlab turish (R336) |
| Stiker, matn | `sticky-note.v1`, `text.v1` vidjetlari |
| Tanlash | Lasso (yozuv) + vidjet tanlash |
| Pastki chapda qaytarish | Pastki chapda ↶↷ (UX 1-bosqich) |
| Interfeysni yashirish rejimi | Boshqaruvni yashirish tugmasi (`DoskaShell`) |
| Rasmga eksport | «Rasm qilib saqlash» (`lib/doska/export.ts`) |

### 1.3. Topilmalar

#### R380 — Yorliq klaviatura tilidan qatʼi nazar ishlaydi

**Referensda:** har asbobning ikkita yorligʻi bor — harf va raqam
(«R yoki 2», «E yoki 0»). Raqam har qanday klaviatura tilida bir xil
tugma.

**Bizda:** [useDoskaShortcuts.ts:104](../src/components/doska/useDoskaShortcuts.ts)
va `:129` — tanish `e.key` boʻyicha. Rus tartibi yoqilgan boʻlsa P →
«з», M → «ь», E → «у», L → «д», S → «ы» keladi — asboblar yoqilmaydi.
Ctrl+Z da ham `e.key` «я» boʻlishi kutiladi. Unda qaytarish ham
ishlamaydi (Chrome/Windowsʼda sinab koʻrish kerak). Oʻzbekistonda koʻp
kompyuterda rus tartibi yoqilgan turadi.

**Xulosa: xato.** Harf lotincha boʻlmasa, tugma joyi boʻyicha tanish
kerak (`e.code`: `KeyP`, `KeyZ`). Raqam muqobili bizga toʻgʻri
kelmaydi: `1` — parda, `2` — qoʻngʻiroq band.

#### R381 — Butun ilovada avtomatik tarjima oʻchirilgan

**Referensda:** ildiz elementida `translate="no"` va `notranslate`.

**Bizda:** faqat [EditableText.tsx:94](../src/components/doska/widgets/EditableText.tsx)
va `WheelWidget` roʻyxatlarida. Doska ildizi
([DoskaShell.tsx:135](../src/components/doska/DoskaShell.tsx), `doska-root`)
ochiq.

**Xulosa:** brauzer tarjimoni matn tugunlarini oʻz elementlariga
oʻraydi. Keyin React ularni topa olmay qulaydi — bu React bilan
tarjimonning maʼlum muammosi. Doska interfeysi baribir 7 tilda, tarjima
kerak emas. Ildizga bitta atribut qoʻshiladi.

Bu tavsiya 2026-07-29 da ham yozilgan edi (R143, 2-referens `<html>`
darajasida qoʻygan), lekin bajarilmagan.

#### R382 — Joriy asbob uchun bir qatorli yoʻriqnoma

**Referensda:** asboblar paneli ichida «bosib torting, tugagach qoʻyib
yuboring» mazmunidagi satr turadi. U tanlangan asbob bilan nima qilishni
aytadi.

**Bizda:** yashirin imo-ishoralar koʻp, lekin hech biri aytilmaydi:
ushlab turib tekislash (R336), lasso bilan belgilash, chizgʻich cheti
boʻylab chizish, «Faqat qalam».

**Xulosa:** rejimga birinchi 2–3 marta kirganda siyoh paneli ustida
bitta satr chiqadi, keyin yashiriladi. Hisob `lib/doska/prefs.ts` da
yuritiladi, matnlar 7 tilda.

#### R383 — Asbob tugmasida yorliq harfi

**Referensda:** tugma burchagida kichik harf (R, D, O…), `title` da
«Toʻrtburchak — R yoki 2».

**Bizda:** yorliqlar bor (P, M, E, L, S, F, B, 1, 2, Ctrl+Z/Y/D),
lekin hech qayerda koʻrsatilmaydi.

**Xulosa:** harfni tugma ustiga chiqarmaymiz — e-doskada bu shovqin
(sensor birinchi, UX Q3). Uni tooltipga qoʻshamiz («Qalam · P»):
sensorli ekranda tooltip chiqmaydi, noutbukda esa yorliqlarni
oʻrgatadi.

#### R384 — Rasm qoʻyish

**Referensda:** rasm asbobi «Boshqa asboblar» menyusida. DOMda menyu
yopiq; nusxalangan rasmni joylash — mahsulotning maʼlum xususiyati.

**Bizda:** rasm vidjeti yoʻq. Registrda faqat clock, timer,
traffic-light, text, sticky-note, shape, presentation va wheel bor.
`paste`/`drop` ishlovchisi ham yoʻq.

**Xulosa:** oʻqituvchi rasmni internetdan nusxalab doskaga tashlaydi —
bu sinfda eng koʻp kerak boʻladigan amallardan biri. Arxitektura
rejasida u 3-bosqichda («Rasm») turibdi. Ochiq savollar:

- rasm qayerda saqlanadi — `localStorage` ~5 MB (R340), shuning uchun
  IndexedDB kerak yoki rasmni kichraytirish;
- mehmon rejimida hajm chegarasi qancha.

#### R385 — Strelka

**Referensda:** strelka — alohida asbob (A yoki 5).

**Bizda:** `InkShape` = `line | rect | ellipse`
([types.ts:67](../src/lib/doska/types.ts)). Strelka yoʻq.

**Xulosa:** «shu yerga qarang» uchun kerak. Lekin alohida asbob
boʻlmasligi kerak — oʻqituvchi yozishdan chiqmasligi shart (R336).
Variantlar:

- tekislangan chiziq uchida bir necha soniya «→» tugmasi chiqadi;
- lasso bilan belgilangan chiziqqa «Strelka» amali qoʻllanadi.

Qaror kerak.

#### R386 — Oʻz elementlar kutubxonasi

**Referensda:** yon panel (`0`). Foydalanuvchi oʻz chizmalarini saqlab,
qayta qoʻyadi.

**Bizda:** bunday kutubxona yoʻq. Fonlar bor: katak, nuqta, daftar,
husnixat, shakllar.

**Xulosa:** foydali — koordinata oʻqi, jadval yoki sxemani har darsda
qayta chizish shart boʻlmaydi. Oqimi: lasso → «Shablon qilib saqlash».
Ekranlar serverga koʻchgach qilinadi. Materiallar kutubxonasi bilan
bogʻlash mumkin.

#### R387 — Kanvas tuzilmasi: statik + interaktiv

**Referensda:** ikkita toʻla kanvas bor — `static` (elementlar) va
`interactive` (tanlov, tutqichlar). DPR cheklanmagan (1344 / 1075,2 =
1,25). Alohida SVG qatlam boʻsh turibdi — ehtimol vaqtinchalik izlar
(lazer, oʻchirgʻich izi) uchun, tekshirilmagan. Chizish paytida
interfeys hodisalari `--ui-pointerEvents` orqali oʻchirilsa kerak —
bu ham taxmin.

**Bizda:** quruq va hoʻl qatlam (R341) — xuddi shu naqsh.

**Xulosa:** arxitekturamiz toʻgʻri, lekin Android panel tezligiga
(R372–R379) bu referens yangi narsa bermaydi.
[doska-tezlik-tadqiqot.md](./doska-tezlik-tadqiqot.md) §6 dagi reja
oʻz kuchida.

#### R388 — Cheksiz kanvas, qoʻl asbobi, masshtab — RAD

**Referensda:** qoʻl asbobi (H), pastki chapda − 100% +.

**Xulosa:** Doska ekranlar (sahifalar) modelida ishlaydi (‹ n/N ›).
Proyektorda surilib ketgan kanvasda oʻquvchi qayerga qarashni
yoʻqotadi. Bitta narsani kattalashtirish kerak boʻlsa, «Markazga»
bor.

#### R389 — Alohida shakl asboblari va «asbobni qulflash» — RAD

**Referensda:** toʻrtburchak, romb, ellips, strelka, chiziq — har biri
alohida asbob. Chizib boʻlgach tanlashga qaytadi, qulf (Q) esa asbobni
ushlab turadi.

**Xulosa:** bizda tekislash imo-ishorasi bor (R336), oʻqituvchi
qalamdan chiqmaydi, shuning uchun qulf ham kerak emas. Strelka alohida
koʻriladi (R385).

#### R390 — Bosim almashtirgichi, toʻldirish, pipetka — RAD

**Referensda:** tanlangan asbobning ixcham paneli — toʻliq palitra,
toʻldirish rangi, «Bosim» almashtirgichi, qalinlik; pipetka.

**Xulosa:** sinf uchun bitta yaxshi standart kerak: ranglar kam va
katta, qalinlik uchta (R335). Sozlamani 5% dan kam odam oʻzgartiradi
(R329).

#### R391 — Jonli hamkorlik — KEYIN

**Referensda:** yuqori oʻngda jonli hamkorlik tugmasi — havola orqali
ulanish, shifrlangan.

**Xulosa:** sinfda buning maʼnosi — oʻquvchilar telefondan doskaga
yozadi. Sinf roʻyxati Doskaga ulangach (Pro) koʻriladi. Taqdimotda
jonli qatlam allaqachon bor.

#### R392 — Faylga saqlash va tahrirlanadigan rasm — QAROR KERAK

**Referensda:** DOMda menyu yopiq; bu mahsulotning maʼlum xususiyati.
Sahnani faylga saqlab, qayta ochish mumkin. Eksport qilingan PNG ichiga
sahna maʼlumoti yoziladi, u qayta ochilsa yana tahrirlanadi. Hammasi
bepul.

**Xulosa:** bu biznes modelga zid. «Ekran istalgan qurilmadan
ochiladi» — pullik tarifning asosiy qiymati. Tavsiya: hozircha
qilinmasin, qaror foydalanuvchida.

---

## 2. Referens 2 — vidjetli sinf ekrani xizmati

Oʻqituvchi uchun eng keng tarqalgan «sinf ekrani»: fon ustida vidjetlar
(taymer, tasodifiy ism, svetofor…), ekranlar toʻplami, ustidan chizish.
2 mln oʻqituvchi, kuniga 450 ming foydalanuvchi, 180+ mamlakat. Doska
aynan shu toifada. Uni 2026-07-29 da qisqa koʻrgan edik
(`docs/ost-loyihalar-arxitektura.md`, R130–R143 — arxitektura va DOM).
Bu safar maqsad boshqa: **har vidjet va har amalni** Doska bilan
solishtirib, nimani qoʻshish kerakligini aniqlash.

### 2.1. Nima koʻrildi (2026-10-01)

- **Sayt:** 26 ta vidjetning har birining sahifasi, narxlar, maktablar
  sahifasi, shablonlar kutubxonasi (11 toifa, 60 ta sahifa roʻyxati),
  6 ta «yangiliklar» maqolasi (2024-12 → 2026-09) va «yashirin
  imkoniyatlar» maqolasi.
- **Yordam markazi:** 20 ta maqola — ekranni sozlash, yorliqlar, siyoh,
  ekran nisbati, roʻyxatlar, saqlash va ulashish, fonlar, hisob turlari,
  interaktiv doskalar, masofaviy dars.
- **Ilova** mehmon rejimida (hisobsiz): salom oynasi, vidjet paneli,
  «Yana» va «Panelni tahrirlash», vidjet asboblar paneli va menyusi,
  sozlama paneli, ekran sozlamalari, siyoh paneli (chizib koʻrildi),
  fonlar, ekranlar paneli, soʻrovnoma, vidjetni ekrandan chiqarish,
  sahifani yangilash.
- **Ilova kodi:** 25 ta vidjet boʻlagidagi interfeys matnlari (har
  vidjetning barcha sozlamalari), tillar roʻyxati, oʻzbekcha til fayli,
  brauzer xotirasi.

Hisob ochilmadi va pullik qism sinalmadi — ular sayt va yordam
markazidagi taʼrifdan olingan.

### 2.2. Bizda allaqachon bor

| Referensda | Doskada |
|---|---|
| Ekranlar toʻplami, ‹ n › va «+» | Bor (`addScreen`, `removeScreen`) |
| `1` — ekranni yashirish, `2` — qoʻngʻiroq, `B` — panelni yashirish, `F` — toʻliq ekran, `S` — sozlama | **Aynan shu tugmalar bor** (`useDoskaShortcuts`) |
| Markazga olish (Shift+S), qulflash (Shift+L) | «Markazga», «Qulflash» |
| Nusxa (Shift+D) | Ctrl+D |
| Qaytarish/qaytarishni bekor qilish (2026-09 da qoʻshilgan!) | UX 1-bosqichdan beri, koʻrinib turadi |
| Panelni oʻqituvchi tuzadi («Panelni tahrirlash») | «Hammasi» katalogi (≤9 qadash, `ToolCatalog`) |
| Siyoh: marker, highlighter, oʻchirgʻich, chiziq/strelka/shakl | Qalam, marker, butun/qisman oʻchirgʻich, lazer, lasso, chizgʻich, transportir, tekislash — **kuchliroq** |
| Tasodifiy ism — gʻildirak (2026-09 da qoʻshilgan) | Gʻildirak, «bir martadan» rejimi, sinf roʻyxati (kirgan) |
| Taymer, soat, svetofor, matn | Bor (+ stiker-yozuv, shakl, taqdimot) |
| Fon: rang, nuqta, chiziqli | Doska, oq doska, katak, nuqta, daftar, husnixat, shakllar |
| Koʻrinish uslubi | Uch uslub (Sokin / Oʻyinchoq / Doska) |

### 2.3. Topilmalar

#### A. Mahsulot va biznes

##### R393 — Tariflar: toʻrt daraja

| | Hisobsiz | Bepul hisob | Pro ($36/yil) | Tashkilot |
|---|---|---|---|---|
| 26 vidjet, siyoh | ✔ | ✔ | ✔ | ✔ |
| Masofadan ovoz berish | — | ✔ | ✔ | ✔ |
| Til va sozlamalar eslab qolinadi | — | ✔ | ✔ | ✔ |
| Ism roʻyxatlari | — | 3 ta | cheksiz | cheksiz |
| Voqea sanogʻi | — | 1–3 | 50 / cheksiz | ✔ |
| Ekranlarni saqlash, ulashish, jildlar | — | — | ✔ | ✔ |
| Oʻz fonlari, rang mavzulari, fon karuseli | — | — | ✔ | ✔ |
| Oʻchirilganni 30 kun tiklash | — | — | ✔ | ✔ |
| Litsenziyani qayta berish, admin paneli | — | — | — | ✔ (5 tadan) |

14 kunlik sinov bor: sinovda ekranlar saqlanadi, sinov tugab keyin
sotib olinsa ular qaytadi.

**Xulosa:** oʻrtadagi «bepul hisob» darajasi — roʻyxatdan oʻtishga
undovchi ilmoq: 3 ta ism roʻyxati va masofadan ovoz berish **bepul**.
Bizda (`doska-arxitektura-qarorlari`) sinf roʻyxatini ulash — **Pro**.
Ustozonada kirish oʻzi jurnal uchun, yaʼni roʻyxat allaqachon bor.
**Qaror kerak:** kirgan oʻqituvchiga oʻz sinflari Doskada bepul
koʻrinadimi? Tavsiya — ha: bu jurnaldan foydalanishga undaydi. Pro
qiymati esa ekranlarni saqlash va ulashishda qoladi (ular ham shunday
qilgan).

##### R394 — Mehmon rejimi hech narsani saqlamaydi

Sahifa yangilansa — yangi toʻplam, yangi tasodifiy fon, hamma ish
yoʻqoladi. Brauzer xotirasida faqat ikkita «koʻrsatma» belgisi turadi.
Chrome faol boʻlmagan varaqni oʻzi yangilab yuborishi ham ish
yoʻqolishiga olib keladi — yordam markazida `chrome://discards` orqali
buni oʻchirish yoʻriqnomasi bor.

Kirishda **salom oynasi** chiqadi: kun vaqtiga qarab salomlashadi
(«Xayrli tun»), «Boshidan boshlash» va 5–6 ta shablon kartasi,
«ekranlaringiz saqlanmaydi — Pro» ogohlantirishi, «boshqa
koʻrsatilmasin» belgisi.

**Xulosa:** Doska mehmon ishini `localStorage` da saqlaydi — bu **bizning
ustunligimiz**, saqlanib qolsin. Salom oynasidan olsa boʻladigan
narsa — shablonlar kartasi (R423), shablon paydo boʻlgach.

##### R395 — Oʻzbek tili: roʻyxatda bor, amalda yoʻq

76 ta til, jumladan oʻzbekcha. Lekin oʻzbek fayli faqat vidjet
nomlarini tarjima qiladi, qolgan butun interfeys inglizcha qoladi.
Tarjima sifati ham past: fon — «kelib chiqishi», taymer — «soniya
hisoblovchi», tasodifiy ism — «ihtiyoriy ism», chizish — «chizmoq».
Yangi vidjetlarning (PDF, taymer-disk, jadval, hisob taxtasi…) oʻzbekcha
nomi umuman yoʻq.

**Xulosa:** toʻliq va toza oʻzbekcha (hamda ruscha) interfeys — aniq
ustunlik. Marketing matnida koʻrsatish mumkin.

##### R396 — Mahsulot qayerga ketyapti (yangilanishlar tarixi)

| Sana | Nima qoʻshildi |
|---|---|
| 2024-12 | Ulashish (havola orqali) |
| 2025-08 | Tekislash, 250 ta yangi fon, stikerlar, pastel mavzular |
| 2026-04 | Boshqaruv paneli qayta qurildi (toʻplam + jild), PDF vidjeti, rasm va PDF ni nusxalab joylash, salom oynasi |
| 2026-06 | Oʻz ranglari (HEX, pipetka), sevimli toʻplamni qadash, jadvalga oʻz rasmlari |
| 2026-09 | Gʻildirak, `2` — qoʻngʻiroq, ekranlarni tartiblash va tiklash, **qaytarish/qaytarishni bekor qilish** |

**Xulosa:** ular koʻp yil qaytarishsiz ishlagan — bizda u birinchi
kundan bor. Yoʻnalishlari: shaxsiylashtirish, tashkil qilish,
shablonlar (200+, chorak qismini oʻqituvchilar yaratgan).

#### B. Ekran va toʻplam

##### R397 — ⭐ Ekran nisbati va vidjet koordinatasi

**Referensda:** har ekranda nisbat tanlanadi: «Ekranni toʻldirish»
(standart), «Qatʼiy 4:3», «Qatʼiy 16:9». Yangi ekranlar uchun standart
ham bor, «toʻplamdagi barcha ekranlarga qoʻllash» ham. Yordam markazida
eng koʻp takrorlangan maslahat: **«noutbukda tayyorladim, doskada
vidjetlar siljib ketdi» → qatʼiy 16:9 ga oʻting.** «Toʻldirish»
rejimidagi ekran ulashilsa, ogohlantirish chiqadi.

**Bizda:** vidjet joyi va oʻlchami **ekran pikselida** saqlanadi
([types.ts:34](../src/lib/doska/types.ts)). Siyoh ham piksel
koordinatada. Hozir mehmon ishi faqat shu brauzerda qolgani uchun
muammo kam koʻrinadi. Lekin ekranlar serverga koʻchib, «istalgan
qurilmadan» ochila boshlaganda u darhol chiqadi: noutbukda (1366×768)
tayyorlangan ekran 4K panelda (1920×1080 CSS) bir burchakka yigʻilib
qoladi. Brauzer masshtabi yoki oynani kichraytirish ham shunday qiladi.

**Xulosa:** saqlanadigan maʼlumot modeli boʻyicha qaror, shuning uchun
u **server sinxronidan OLDIN** qabul qilinishi kerak. Keyin qilinsa,
saqlangan barcha ekranlarni koʻchirish kerak boʻladi. Tavsiya: sahna
mantiqiy 16:9 maydonda (masalan 1920×1080 birlik) quriladi va
ekranga masshtablanadi, bir xil boʻlmagan joylar esa hoshiya boʻladi.
Vidjet ichi allaqachon `cqw` bilan oʻlchanadi, shuning uchun u
masshtabga tayyor. «Toʻldirish» rejimi olinmaydi — u muammoning
oʻzi.

##### R398 — Barcha ekranlarda (pin)

**Referensda:** vidjet menyusida «Barcha ekranlarda koʻrsatish»
(Shift+P). Soat, taymer, jadval ekranlar almashganda ham oʻz joyida
turadi. Yordam markazida eng koʻp tavsiya qilinadigan imkoniyatlardan.

**Bizda:** yoʻq (`doska-qolgan-ishlar` №4).

**Xulosa:** tasdiqlandi, **A bosqichiga**. Ishlayotgan taymer ekran
almashganda toʻxtamasligi shart — bu yerda nusxa emas, aynan shu vidjet
koʻrsatiladi («Markazga» bilan bir xil tamoyil).

##### R399 — Ekranlar paneli

**Referensda:** pastki oʻngdagi raqam bosilsa, ekranlarning **jonli
eskizlari** (vidjetlari bilan) ustun boʻlib chiqadi va «+» tugmasi
turadi. Ekranni yuqoriga/pastga surish, nusxa olish, nomi va tavsifi,
Ctrl+Enter — yangi ekran. Oʻchirilgan ekran va vidjetlar «Yaqinda
oʻchirilganlar» dan tiklanadi (Proʼda 30 kun).

**Bizda:** faqat ‹ n/N › va qoʻshish/oʻchirish. Ekranni tartiblash va
nusxa olish yoʻq.

**Xulosa:** tartiblash va ekran nusxasi — **A bosqichiga** (dars
tuzilishi: kirish → mashq → yakun). Jonli eskiz — oʻrta ish, kerakli.
«Yaqinda oʻchirilganlar» — server bilan birga (C).

##### R400 — Obyektlar ustida amallar

**Referensda:**
- koʻp tanlash (Ctrl/Shift bosish, Ctrl+A) va ramka bilan belgilash;
- «Tekislash» (vidjet, stiker va siyohni birga);
- «Guruhlash» — birga suriladi, ichidagisini alohida tahrirlash mumkin;
- Ctrl+C / Ctrl+V — boshqa ekranga ham;
- oldinga/orqaga (Ctrl+↑/↓);
- burish 0–180° / 0–360° (rasm, stiker, siyoh, kamera);
- Shift + oʻlcham — nisbat saqlanadi;
- strelka bilan 1 px, Shift + strelka bilan 10 px surish.

**Bizda:** bitta tanlov, strelka bilan surish, Ctrl+D, «Oldinga» olib
tashlangan (UX 2-bosqich).

**Xulosa:** sinfda eng kerakli qismi — **ekranlar aro nusxa/joylash**
(taymerni keyingi ekranga olib oʻtish). Koʻp tanlash, tekislash va
guruhlash tayyorlanishni tezlashtiradi, lekin dars paytida kam kerak —
keyinroq.

##### R401 — Vidjetni ekrandan chiqarib qoʻyish

**Referensda:** vidjet ekran chetidan tashqariga sudralsa, u yashirinadi
va chetda uning belgisi bilan kichik tugma qoladi. Bosilsa, vidjet
qaytadi. Ekran tozalanadi, lekin hech narsa oʻchmaydi.

**Bizda:** yoʻq — vidjet oʻchiriladi yoki joyida qoladi.

**Xulosa:** e-doskada juda tabiiy imo-ishora (chetga surib qoʻyish).
Arzon — **A bosqichiga**.

##### R402 — Yorliqlar roʻyxati va pult

**Referensda:** `K` bosilsa yorliqlar roʻyxati chiqadi (qayta bosilsa
yopiladi). Vidjet menyusida har amal yonida uning yorligʻi yozilgan.
Yorliqlarni butunlay oʻchirish mumkin — taqdimot pulti (clicker)
tugmalari bilan toʻqnashmasligi uchun. Yorliqlar bizdagiga juda yaqin:
`1` `2` `B` `F` `S` `Esc` ←→, siyohda `M` `H` `R` `E` `L`.

**Bizda:** yorliqlar bor, lekin roʻyxat va menyudagi yozuv yoʻq
(R383). Pult taqdimot vidjeti ichida ishlaydi (PageUp/PageDown), lekin
ekranlar almashtirishda — yoʻq.

**Xulosa:** `K` → roʻyxat (yoki `?`), menyuda yorliq yozuvi, pult
tugmalari (PageDown/PageUp) ekran almashtirishda ham ishlaydi —
**A bosqichiga**, R380 tuzatishi bilan birga.

##### R403 — Qaytarish menyuda yashirin

**Referensda:** qaytarish va qaytarishni bekor qilish panel yonidagi
«⋮» menyu ichida (va Ctrl+Z/Y bilan).

**Xulosa:** bizda ↶↷ pastda doim koʻrinib turadi va oʻchirilganda
6 soniyali «Qaytarish» xabari chiqadi — **bizniki yaxshiroq, tasdiq**.

#### C. Siyoh

##### R404 — Har chiziq alohida SVG obyekt

**Referensda:** siyoh rejimi vidjet panelining oʻrnida ochiladi:
marker, highlighter, bosimli moʻyqalam, oʻchirgʻich, shakllar (chiziq,
strelka, konturli va toʻldirilgan toʻrtburchak/doira). 11 rang (+pastel,
oʻz rangi HEX yoki pipetka bilan), 3 qalinlik. Tepa markazda
«Chizishni toʻxtatish · ESC» tugmasi, yonida «supurgi» — hammasini
tozalash.

Texnik jihatdan (DOMda tekshirildi): **har chiziq — vidjetlar bilan bir
qatordagi alohida `<svg>` obyekt** (`WIDGET_ANNOTATION_V1`, oʻz
`z-index` i bilan). Chiziqni sudrash, burish, qulflash, tekislash,
barcha ekranlarga qadash mumkin. Kanvas umuman yoʻq.

**Bizda:** siyoh — alohida kanvas qatlami (quruq/hoʻl, R341), qalam
asboblari ancha boy (lasso, chizgʻich, transportir, tekislash, lazer,
qisman oʻchirgʻich, «Faqat qalam», slaydga bogʻlanish).

**Xulosa:**
- SVG-obyekt modeli **RAD**: yuzlab chiziqda DOM ogʻirlashadi, Android
  paneldagi tezlik muammosini kuchaytiradi (R341, R376).
- Olsa boʻladigani: **strelka** (R385 bilan birga) va toʻldirilgan
  shakl — bizning tekislash imo-ishorasiga qoʻshimcha.
- «Toʻxtatish» tugmasini tepaga qoʻyish **olinmaydi** — e-doskada
  tepaga qoʻl yetmaydi (R319).

#### D. Vidjetlar

Har vidjet: referensda nima bor → bizda nima bor → nima olamiz.

##### R405 — Taymer

**Referensda:**
- har raqam ustida va ostida alohida `+`/`−`;
- **N marta takrorlash** (stansiyalar boʻyicha aylanish);
- tugagach avtomatik nolga qaytish;
- **qizil ogohlantirish** — oxirgi N% yoki oxirgi N soniya;
- **brauzer yorligʻida qolgan vaqt**;
- yangi taymerlar uchun standart vaqt;
- 20+ tovush;
- oʻlchamga qarab uch xil koʻrinish (kichraytirilsa ixchamlashadi).

**Bizda:** preset va ±, raqam/disk/ikkalasi koʻrinishi, tovush.

**Olamiz (A):** takrorlash, qizil chegara, yorliqda vaqt (oʻqituvchi
boshqa varaqqa oʻtsa ham qolgan vaqtni koʻradi), oxirgi tanlangan vaqt
eslab qolinadi.

##### R406 — Vizual taymer

**Referensda:** alohida vidjet. Vaqt **disk ustida yoyni sudrab**
qoʻyiladi (soat miliga yoki teskari), raqamlarni yashirish mumkin.

**Bizda:** taymerning «disk» koʻrinishi bor, lekin vaqt faqat ± bilan
qoʻyiladi.

**Olamiz (A):** diskda barmoq bilan sudrab vaqt qoʻyish — e-doskada eng
tabiiy imo-ishora. Alohida vidjet shart emas, taymerning oʻzida.

##### R407 — Sekundomer va voqea sanogʻi

**Referensda:**
- **sekundomer:** aylana va oraliq vaqtlar;
- **voqea sanogʻi:** «taʼtilgacha N kun» yoki foiz chizigʻi, dam olish
  kunlarini hisobga olmaslik, saqlangan voqealar roʻyxati, yulduzcha —
  standart voqea.

Voqealarni oʻqituvchi qoʻlda kiritadi.

**Bizda:** ikkalasi ham yoʻq.

**Olamiz:**
- ✅ sekundomer qurildi (taymer `mode: "stopwatch"`, 5 tagacha oraliq) — A (taymerning rejimi sifatida, R141 dagi «bitta
  primitiv» qarori);
- voqea sanogʻi — **B**: bizda oʻquv kalendari bor — choraklar, taʼtil
  va bayramlar (`blocked-days`, `academic-calendar`). «Chorak oxirigacha
  12 kun», «Navroʻzgacha 3 hafta» — **qoʻlda kiritmasdan**.

##### R408 — Soat

**Referensda:** analog ↔ raqamli koʻrinish **vidjet oʻlchamiga qarab**
oʻzgaradi (alohida sozlama emas). Budilnik — tavsifi bilan, profilga
saqlanadi.

**Bizda:** soat, soniyalarni koʻrsatish.

**Olamiz:** budilnik — **B**: qoʻngʻiroq jadvali bor, «dars tugashiga
5 daqiqa» ogohlantirishi avtomatik chiqadi. Oʻlchamga qarab
koʻrinish — kichik, ixtiyoriy.

##### R409 — Kun jadvali

**Referensda:** uch koʻrinish — belgilash roʻyxati, oddiy roʻyxat,
vaqtli jadval. Har bandga piktogramma (kutubxona + oʻz rasmi), har
band oxirida tovush, tanaffuslar. Hammasi **qoʻlda** kiritiladi.

**Bizda:** Doskada yoʻq. Lekin ilovada dars jadvali, qoʻngʻiroq
jadvali va dars rejasi (planner) bor.

**Olamiz (B):** «Bugungi dars» vidjeti — dars rejasining bosqichlari
yoki kunlik dars jadvali **avtomatik** chiqadi. Belgilash roʻyxati
koʻrinishida oʻqituvchi bosqichni bosib belgilaydi. Bu raqobatchida
yoʻq — ular hech narsani bilmaydi.

##### R410 — Tasodifiy ism

**Referensda:**
- ikki koʻrinish: **standart** (bitta ism katta harfda) va gʻildirak;
- «tanlanganlarni eslab qolish» (hamma navbat olguncha
  takrorlanmaydi), «hamma navbat oldi» yakuni va qaytadan boshlash;
- bir bosishda roʻyxatdan chiqarish;
- **sehrli tayoqcha** — tayyor roʻyxatlar: 1–30 sonlar, alifbo,
  mevalar, hayvonlar, emoji;
- 30+ ismda gʻildirakning kerakli qismini kattalashtirib koʻrsatish;
- oʻz roʻyxati yoki saqlangan roʻyxat, bitta roʻyxat standart.

**Bizda:** gʻildirak, «bir martadan» rejimi, sinf roʻyxati (kirgan).

**Olamiz:**
- standart koʻrinish — A (kundalik soʻrov uchun gʻildirakdan tezroq);
- tayyor roʻyxatlar — A (**oʻzbek alifbosi** bilan: Oʻ, Gʻ, Sh, Ch, Ng);
- kattalashtirilgan gʻildirak — keyin;
- **B:** bugun yoʻq oʻquvchi chiqmaydi — bu Gʻildirak v2 da
  rejalashtirilgan.

##### R411 — Guruh tuzuvchi

**Referensda:**
- guruhlar soni yoki guruhdagi odam soni;
- ismni sudrab boshqa guruhga oʻtkazish;
- «guruhlarni aylantirish» (1→2, 2→3);
- guruh nomi va rangi, avtomatik nomlar;
- A–Z / tasodifiy tartib;
- **cheklovlar:** «birga qoʻyilmasin» va «albatta birga» — oʻquvchi
  sozlamasida saqlanadi, doskada koʻrinmaydi. Bajarib boʻlmasa, xabar
  chiqadi.

**Bizda:** yoʻq (R141 da rejalashtirilgan).

**Olamiz (B):**
- bugun yoʻqlar avtomatik chiqariladi;
- cheklovlar oʻquvchi profilida saqlanadi (bizda profil bor);
- aralash darajali guruh — baholar asosida, faqat oʻqituvchi koʻradi
  (R141);
- sudrab oʻtkazish va aylantirish ham qoʻshiladi.

##### R412 — Soʻrovnoma

**Referensda:**
- turlari: koʻp tanlov (5 tagacha), smayliklar (2–5 ta),
  toʻgʻri/notoʻgʻri; kodda «ochiq savol» turi ham bor;
- oʻquvchilar **doskaga chiqib bosadi**, yoki masofadan havola/QR
  orqali ovoz beradi (hisob kerak);
- ovoz berishni yopish, natijani yashirish, qaytadan boshlash;
- halqa, ustun yoki doira diagramma;
- tayyor savol: «Bugungi dars sizga qanday boʻldi?»;
- vidjet ochilganda ichida tur tanlash taklif qilinadi.

**Bizda:** yoʻq. Masofadan ovoz berish — Baholash sessiyasi orqali
(R140).

**Olamiz (B):** **doskada bosib ovoz berish** — qurilmasiz, bir
daqiqalik «chiqish chiptasi» (smaylik yoki toʻgʻri/notoʻgʻri). Arzon.
Masofadan ovoz berish esa alohida qilinmaydi — Baholash orqali.

##### R413 — Shovqin oʻlchagich

**Referensda:**
- mikrofon va sezgirlikni tanlash;
- maksimal shovqin chegarasi — oshsa qoʻngʻiroq chaladi, 10 soniya
  davom etsa yana chaladi;
- **silliqlash** (jonli / oʻrtacha / silliq) — yoʻtal va tushib ketgan
  qalam hisobga olinmaydi;
- chegaradan oshishlar sanogʻi;
- «olqish oʻlchagich» sifatida ishlatish.

**Bizda:** yoʻq.

**Olamiz (D):** 30–40 kishilik sinfda kerakli. Faqat brauzerda ishlaydi
(Web Audio), server kerak emas. Lekin e-doskada mikrofon bor-yoʻqligi
nomaʼlum — oldin `/doska/sinov` da tekshirish kerak.

##### R414 — Hisob taxtasi

**Referensda:** uch koʻrinish:
- «Uy-mehmon» (2 jamoa);
- ochkolar (koʻp jamoa, qadam sozlanadi);
- **poyga** — marra chizigʻi, raketa yoki toshbaqa belgisi.

Jamoa nomi va rangi, bitta yoki hamma hisobni tozalash, marraga
yetganda tovush.

**Bizda:** yoʻq.

**Olamiz (D):** oʻyin uchun **vaqtinchalik** hisob. Xulq baliga
aralashmasin (R141 ogohlantirishi).

##### R415 — Ish belgilari

**Referensda:** «jimlik», «pichirlash», «qoʻshningdan soʻra», «birga
ishlang». Almashganda tovush chiqadi.

**Bizda:** yoʻq (svetoforning yozuvi bor).

**Olamiz (A):** arzon, sinf boshqaruvi uchun kerakli. Svetofor bilan
bir xil naqsh: belgi + soʻz.

##### R416 — Zar

**Referensda:** 1–3 ta oddiy zar, −6…+6, oʻz oraligʻi (1–12, 1–20,
−999…999), matematik belgilar, tanga, rangli zar, **ingliz** alifbosi
zari, tovush va animatsiya.

**Bizda:** yoʻq.

**Olamiz (A):** arzon. **Oʻzbek alifbosi zari** (Oʻ, Gʻ, Sh, Ch, Ng) —
boshlangʻich sinf uchun, raqobatchida yoʻq.

##### R417 — Matn

**Referensda:** shriftlar (standart shriftni eslab qoladi), qalin,
kursiv, tagiga chizilgan, ustidan chizilgan; tekislash, roʻyxat,
havola; 22 rang va oʻz rangi, belgilash rangi, shaffof fon.

**Bizda:** oddiy matn (`EditableText`).

**Olamiz (D):** qalin va rang — eng kerakli ikkitasi. Qolgani keyin.

##### R418 — Tashqi mazmun

**Referensda:**
- **rasm:** sudrab tashlash va nusxalab joylash (2026-04), 0–360° burish,
  25 MB gacha;
- **PDF:** sahifalab koʻrish, joriy sahifaga chizish (chizma sahifaga
  saqlanmaydi);
- **video:** YouTube havolasi, reklamasiz, video fon qilib ham qoʻyiladi;
- **embed:** tashqi taqdimot, pleylist, aylantirish yoqiladi;
- **havola:** 10 tagacha, sayt belgisi bilan;
- **QR:** matn yoki havola va sarlavha;
- **veb-kamera:** kamera tanlash, gorizontal/vertikal aks ettirish,
  burish — **hujjat kamerasi** sifatida.

**Bizda:** taqdimot vidjeti (oʻz slaydlarimiz). PDF — darslik
tadqiqotida (R342–R371), kod yoʻq.

**Olamiz:**
- rasm va nusxalab joylash — A/B (R384);
- QR — A: Baholash PINʼiga yoki topshiriq havolasiga, arzon;
- veb-kamera hujjat kamerasi sifatida — D: maktablarda hujjat kamerasi
  kam, noutbuk kamerasi bilan daftarni koʻrsatish foydali;
- video, embed, havola — D.

##### R419 — Stikerlar

**Referensda:** 1000+ stiker, toʻplamlar, qidiruv, oxirgi ishlatilgan 10
tasi, koʻzgu aks, burish. Mavsumiy toʻplamlar yarimsharga qarab
almashadi. Stikerlar yoʻl-yoʻriq uchun ham ishlatiladi («Albatta
qil», «Qilsa ham boʻladi», oʻtirish joylari).

**Bizda:** Doskada yoʻq. Ilovada illyustratsiyalar (45 SVG) va
emoji (`AppleEmoji`) bor.

**Olamiz (A):** mavjud illyustratsiya va emoji bilan arzon stiker
vidjeti. Rasm vidjeti (R418) bilan bir xil asos.

##### R420 — Fonlar

**Referensda:**
- toifalar: mavsumiy (hozir — Halloween va kuz, yarimsharga qarab),
  tabiat, hayvonlar, animatsiyalar/GIF, maktab fanlari, joylar,
  bayramlar, illyustratsiyalar, ranglar, nuqta va chiziq (nota chizigʻi,
  husnixat);
- oʻz rasmini yuklash (25 MB);
- sevimlilar (yulduzcha), qidiruv, tasodifiy fon;
- «qoplash» yoki «sigʻdirish» (hoshiya rangi yoki xira fon);
- Pro: fon karuseli (har soniya, daqiqa yoki soat).

**Bizda:** 9 ta tayyor fon (doska, katak, daftar, husnixat…).

**Olamiz (D):**
- **Oʻzbekiston bayramlari** va oʻquv yili sanalari boʻyicha fon
  (Oʻqituvchilar kuni, Navroʻz, Mustaqillik) — oʻquv kalendari bilan;
- oʻz rasmini fon qilish (R384 bilan birga);
- nota chizigʻi.

#### E. Koʻrinish va sozlama

##### R421 — Vidjet rang mavzulari

**Referensda:** har vidjetga 30 ta tayyor rang mavzusidan biri yoki
shaffof fon. Proʼda oʻz mavzusi: mavzu tahrirlansa, uni ishlatayotgan
barcha vidjetlar yangilanadi.

**Bizda:** uch uslub — butun doskaga (token qatlami, UX Q1).

**Xulosa: hozircha RAD.** Q1 qarori — uslub token qatlamida, vidjet
darajasida emas. Kerak boʻlsa, vidjetga bitta urgʻu rangini berish
bilan cheklanadi.

##### R422 — Sozlama naqshlari

**Referensda:**
- sozlama — **oʻngdagi toʻliq balandlikdagi varaq**, boʻlimlarga
  ajratilgan, pastida «Bu vidjet haqida» havolasi;
- **«yangi vidjetlar uchun standart»** (masalan taymer vaqti);
- hisobi bor foydalanuvchi uchun tanlovlar avtomatik saqlanadi;
- vidjet panelida belgi ustidagi **kulrang nuqta** — shu vidjetdan
  ekranda nechta borligini koʻrsatadi;
- boʻsh holatlar vidjet ichida: «roʻyxat tanlash uchun sozlamani
  oching», soʻrovnomada tur tanlash.

**Bizda:** sozlama — vidjet yonidagi karta (UX Q2 qarori).

**Olamiz (A):**
- oxirgi tanlovni yangi vidjetga standart qilib olish;
- paneldagi faol nusxa nuqtasi (R401 bilan juda mos — yashiringan
  vidjetni topish);
- vidjet ichidagi boʻsh holatlar.

Varaq koʻrinishi olinmaydi — karta qarori oʻz kuchida.

#### F. Shablon, ulashish, boshqaruv paneli

##### R423 — Shablonlar kutubxonasi

**Referensda:**
- 200+ shablon, chorak qismini oʻqituvchilar yaratgan;
- 11 toifa: maktabga qaytish, sinf boshqaruvi, kundalik ekranlar, SEL,
  tanaffus, oʻyinlar, til, STEM, sanʼat, asosiy bilimlar, oʻqituvchi
  vositalari;
- yosh boʻyicha filtr, teglar («tayyorgarliksiz», «oʻqituvchi
  yaratgan»), muallif profili, shablon yuborish formasi.

Shablon — tayyor vidjetli toʻplam va «Qanday ishlaydi» yoʻriqnomasi.
Masalan «Oʻtish vaqti»: jadval + tinchlantiruvchi video + taymer.
«Matematika markazlari»: guruhlar aylanishi + svetofor + shovqin +
ish belgilari.

**Bizda:** yoʻq.

**Olamiz (C, lekin arzon boshlanishi bor):** shablon — bu shunchaki
toʻplam JSONʼi. Birinchi 6–10 tasini **statik maʼlumot** qilib ilova
ichida berish mumkin — server kerak emas. Masalan: ertalabki salom,
dars bosqichlari, guruh ishi, nazorat ishi (taymer + jimlik belgisi +
parda), tanaffus. Salom oynasi (R394) va «Yangi ekran» shu yerdan
boshlanadi. Oʻqituvchilar yaratgan shablonlar — server va moderatsiya
bilan keyin.

##### R424 — Ulashish

**Referensda:**
- toʻplamga ochiq havola: «faqat koʻrish» yoki «koʻrish va nusxa olish»;
- roʻyxat, rasm va fonlarni **qoʻshmaslik** almashtirgichi — maxfiylik
  uchun;
- havolani oʻchirish;
- hisobsiz odam ham ochadi va nusxasini tahrirlaydi, lekin uni
  ulasha olmaydi;
- ishlatilishi: oʻrinbosar oʻqituvchi, masofaviy oʻquvchi, hamkasb.

**Bizda:** yoʻq.

**Olamiz (C):** server bilan birga. Ism roʻyxatlari **standart holda
ulashilmaydi** — bizda bu shaxsiy maʼlumot qoidasi.

##### R425 — Boshqaruv paneli

**Referensda:**
- toʻplamlar va jildlar (belgi rangi bilan);
- sevimli toʻplamni tepaga qadash;
- uch xil koʻrinish (setka, kengaytirilgan, roʻyxat);
- toʻplamni arxivlash;
- ism roʻyxatlari va fonlar alohida boʻlimda;
- «Yaqinda oʻchirilganlar» (30 kun).

Koʻp oʻqituvchi **har kun uchun bitta toʻplam** qiladi.

**Olamiz (C):** server bilan birga. Bizda tabiiy bogʻlanish bor:
toʻplam ↔ sinf ↔ dars jadvalidagi dars.

##### R426 — Tashkilot litsenziyasi

**Referensda:** 5 litsenziyadan boshlab, litsenziyani qaytarib olib
boshqaga berish, **oʻqituvchi faolligi koʻrsatkichi**, hisob-faktura
bilan toʻlov, onboarding qoʻllanmalari.

**Olamiz:** Boshqaruv ost-loyihasiga eslatma, Doskaga emas.

#### G. Texnik mayda

##### R427 — Uchta kuzatuv

1. **Realtime** — hali ham Firebase (R140 oʻzgarmagan). Doska uchun
   alohida realtime qatlami kerak emas degan xulosa oʻz kuchida.
2. **Tugmalar nomsiz:** ikonka-tugmalarda `aria-label` yoʻq, faqat
   `data-tooltip-text` bor — ekran oʻquvchi ularni oʻqiy olmaydi. Bizda
   `aria-label` bor — shunday qolsin.
3. **Ilova 25 ta vidjetning hammasini oldindan yuklaydi**
   (`prefetch-manifest.json`, 159 fayl), lekin har biri alohida boʻlak.
   Vidjet ochilganda kutish yoʻq. Doskada vidjetlar kam, hozircha
   kerak emas; 20+ ga yetganda esa shu naqsh olinadi.

### 2.4. Bizning ustunligimiz — ular qoʻlda kiritadi, bizda maʼlumot bor

| Vidjet | Referensda | Doskada (kirgan oʻqituvchi) |
|---|---|---|
| Tasodifiy ism | roʻyxat qoʻlda, 3 tasi bepul | sinf roʻyxati jurnaldan, bugun yoʻqlar chiqmaydi |
| Guruh tuzuvchi | roʻyxat va cheklov qoʻlda | davomat, oʻquvchi profilidagi cheklovlar, baho boʻyicha aralash guruh |
| Kun jadvali | bandlar qoʻlda | dars jadvali va dars rejasi bosqichlari |
| Voqea sanogʻi | sanalar qoʻlda | chorak, taʼtil, bayram — oʻquv kalendaridan |
| Soat budilnigi | vaqt qoʻlda | qoʻngʻiroq jadvali |
| Soʻrovnoma (masofadan) | alohida xizmat | Baholash sessiyasi, natija jurnalda |
| Hisob / xulq | efemer hisob | (ataylab ajratilgan — R141) |
| Til | 76 til, oʻzbekcha faqat nomlarda | toʻliq oʻzbekcha va ruscha |
| Mehmon ishi | sahifa yangilansa yoʻqoladi | shu brauzerda saqlanadi |

### 2.5. Tavsiya etilgan tartib

**0 — qaror (kod oldidan):**
- R397 koordinata modeli — server sinxronidan oldin;
- R393 sinf roʻyxati bepul hisobdami.

**A — tez, serversiz (har biri ½–1 kun):**
1. ✅ R380 + R381 + R383 + R402 — yorliqlar paketi: kirill klaviatura,
   `translate`, tooltipda harf, `K` roʻyxati, pult bilan ekran
   almashtirish. **Qurildi — §2.10.**
2. ✅ R398 — barcha ekranlarda (pin). **Qurildi** (branch `maxdum/doska-pin`): `DoskaWidget.pinned`, `gatherPinned` — ekran almashganda, qoʻshilganda va oʻchirilganda vidjet (bogʻlangan yozuvi bilan) koʻrinayotgan ekranga koʻchadi, nusxa emas; tozalashda qoladi; nusxasi qadalmaydi; kontekst panelda «Barcha ekranlarda». Store testi 9/9.
3. ✅ R399 — ekranni tartiblash va nusxa olish (**qurildi**, branch `maxdum/doska-ekranlar`: menyuda nusxa va oldinga/orqaga surish, store testi 7/7). ✅ R400 ekranlar aro nusxa **qurildi** (Ctrl+C / Ctrl+V, xotira sahifa davomida). Avval qolgan: R400 — ekranlar aro
   nusxa/joylash.
4. ✅ R405 — taymer: takrorlash (0–9), oxirgi soniyalar qizil (10% yoki 10 s), yorliqda vaqt — **qurildi**, branch `maxdum/doska-taymer`. R406 diskda sudrash QILINMADI: bizning disk «qolgan ulush», 60 daqiqalik siferblat emas — sudrash uchun alohida siferblat rejimi kerak. Avvalgi reja:
   diskda sudrash, sekundomer rejimi.
5. ✅ R401 chetga qoʻyish **qurildi** (`DoskaWidget.parked`, barmoq kanvas chetidan 16 px ichida qoʻyib yuborilsa; chetda tugma). ✅ R422 oxirgi tanlov **qurildi** (`WidgetMeta.remember`, prefs `lastState`: taymer, gʻildirak, zar); faol nusxa nuqtasi oldindan bor edi. Avval qolgan: R422 — chetga qoʻyish, faol nusxa nuqtasi, oxirgi tanlovni
   eslab qolish.
6. ✅ R419 stikerlar (`sticker.v1`, 60 ta sinf belgisi, tizim emoji shrifti — sprite 64 px xira boʻlardi) **qurildi**. ✅ R418 QR (`qr.v1`) **qurildi**. ✅ R416 zar (oʻzbek alifbosi, son, tanga) **qurildi** — `dice.v1`. R415 ish belgilari QILINMADI: svetoforimiz (jim · pichirlab · gaplashamiz, belgi + soʻz) uni deyarli toʻliq qoplaydi. Yangi arzon vidjetlar: R415 ish belgilari, R416 zar (oʻzbek
   alifbosi), R419 stikerlar, R418 QR.
7. ✅ R410 **qurildi** (`WheelState.view`: «Gʻildirak / Ism», tayyor roʻyxatlar 1–30 va alifbo) — tasodifiy ism: standart koʻrinish va tayyor roʻyxatlar.

**B — maʼlumot ustunligi (kirgan oʻqituvchi; Gʻildirak v2 bilan bir
oqimda):**
- ✅ R409 «Bugun» qurildi (`today.v1`: jadvaldan bugungi darslar `doskaTodayAction`, yoki qoʻlda dars bosqichlari belgilash bilan); bosqichlar dars rejasidagi sarlavhalardan ham olinadi, taʼtil kuni darslar chiqmaydi;
- R411 guruh tuzuvchi — ✅ 1-qadam qurildi (`groups.v1`: qoʻlda roʻyxat, son yoki hajm boʻyicha); ✅ sinf roʻyxati (Pro, ID saqlanadi) va bugun yoʻqlar davomatdan (`doskaAbsentAction`), ikki teginishda koʻchirish; qoldi: cheklovlar;
- ✅ R407 voqea sanogʻi qurildi (`countdown.v1`: faol yil kalendari — taʼtil, chorak oxiri, yil oxiri; mehmonga oʻz voqeasi; «faqat dars kunlari»);
- ✅ R408 soatda qoʻngʻiroq jadvali qurildi (`doskaBellsAction`: bugungi jadval versiyasining `bellConfig`; dars/tanaffus, ogohlantirish, qoʻngʻiroq);
- ✅ R412 doskada ovoz berish qurildi (`poll.v1`: smaylik, ha/yoʻq, A–E);
- R384/R418 rasm va nusxalab joylash (saqlash joyi hal boʻlgach).

**C — server bilan:**
- ekranlarni saqlash (Pro);
- R423 shablonlar — ✅ statik «Tayyor ekranlar» qurildi (`lib/doska/templates.ts`: dars boshi, guruh ishi, savol-javob, dars yakuni; yangi ekran, bitta qaytarish qadami); qoldi: oʻqituvchining oʻz shabloni (server bilan);
- R424 ulashish;
- R425 boshqaruv paneli;
- «Yaqinda oʻchirilganlar».

**D — keyinroq:**
- ✅ R413 shovqin qurildi (`noise.v1`: Web Audio, chegara, silliqlash, sanoq, qoʻngʻiroq);
- ✅ R414 hisob taxtasi qurildi (`score.v1`, 2–6 jamoa);
- ✅ veb-kamera qurildi (`camera.v1`: kadrni toʻxtatish, kamera almashtirish, koʻzgu); ✅ video (`video.v1`: videoxosting kuzatuvsiz domen orqali yoki .mp4), havola (`link.v1`: yangi varaqda) va sayt (`embed.v1`: sandbox iframe + «yangi varaqda» zaxirasi) qurildi;
- R420 fonlar: ✅ nota chizigʻi, kuz/bahor/qish qurildi; bayram fonlari (sana boʻyicha «Bugunga mos») qurildi; qoldi: oʻz rasmi;
- ✅ R417 matn: rang (qalam palitrasi) va qalinlik qurildi; qolgani keyin.

### 2.6. Rad etilganlar

- **Har chiziq alohida SVG obyekt** (R404) — tezlik.
- **«Ekranni toʻldirish» nisbati** (R397) — siljish muammosining
  manbai; biz bitta mantiqiy 16:9 bilan boshlaymiz.
- **Vidjetga oʻz rang mavzusi** (R421) — uslub qarori (Q1).
- **Sozlama uchun oʻng varaq** (R422) — karta qarori (Q2).
- **Tepadagi «toʻxtatish» tugmasi** (R404) — e-doskada qoʻl yetmaydi.
- **Ingliz alifbosi zari, SEL shablonlarining tarjimasi** — mahalliy
  mazmun oʻzimiz yaratiladi.
- **Pro fonlar toʻplami, fon karuseli** — sinfga taʼsiri kichik.

### 2.7. Ochiq savollar (foydalanuvchidan)

1. Koordinata modeli (R397): mantiqiy 16:9 maydonga oʻtamizmi? Tavsiya —
   ha, server sinxronidan oldin.
2. Sinf roʻyxati (R393): kirgan oʻqituvchiga bepulmi yoki Pro? Tavsiya —
   bepul.
3. A bosqichidan qaysi paketdan boshlaymiz? Tavsiya — 1 (yorliqlar,
   ichida xato bor), keyin 2 va 4.
4. Statik shablonlar (R423) A ga olinadimi?

### 2.8. UX/UI koʻrigi — vidjetlar qoʻlda sinab koʻrildi (R428–R442)

2026-10-01, foydalanuvchi soʻrovi: «UX/UI ni ham oʻrgan, barcha
vidjetlarni koʻrib chiq, qanday ishlashini koʻr». Ilova mehmon rejimida
**21 ta vidjet qoʻshildi, sozlandi va ishlatildi**: taymer, soat,
svetofor, ish belgilari, tasodifiy ism, guruh tuzuvchi, hisob taxtasi,
zar, vizual taymer, sekundomer, kalendar, voqea sanogʻi, kun jadvali,
matn, rasm, chizish, QR, havola, stikerlar, soʻrovnoma, fon, siyoh.
Qolgan beshtasi — shovqin, veb-kamera, video, embed, PDF — mikrofon yoki
kamera ruxsatini yoxud tashqi saytni talab qiladi. Ular koddagi matnlar
va yordam markazi orqali oʻrganildi (§2.3).

#### R428 — Vizual tizim

- **Shrift:** Quicksand (yumaloq, «bolalarga mos»).
- **Ranglar:** asosiy indigo `#6265ED`; urgʻu uchun lime `#8FDD40`,
  teal `#2DE1E1` va rose `#F43E6F`; kulranglar Tailwind shkalasidan.
- **Vidjet paneli:** oq, radius 10 px, 0,8 px kulrang chegara, soyasiz.
  Tugma 52×52 px, ichidagi ikonka 40×40, ostida doim yozuv.
- **Ikonkalar:** chiziqli, ikki rangli (qora kontur + bitta urgʻu
  rangi) kichik illyustratsiyalar.
- **Tooltip:** qora «pill».
- **Vidjet asboblar paneli:** oq «pill», 3 tugma.
- **Tanlov:** indigo ramka va 16 px li oq doira tutqichlar.

**Xulosa:** uslub «Oʻyinchoq» yoʻnalishimizga yaqin. Bizda uslubni
oʻqituvchi tanlaydi (UX Q1), ikonkalarimiz bir tusli ierarxik
(`ikona-ranglash-ierarxik`). Olinadigan narsa yoʻq, faqat tasdiq.

#### R429 — Vidjet qayerda paydo boʻladi

- Har turning **oʻz standart joyi** bor: taymer, soat va svetofor —
  oʻng tepada; tasodifiy ism — chapda; ish belgilari, sekundomer va
  vizual taymer — markazda.
- Bir xil turdan bir nechtasi qoʻshilsa, **ustma-ust tushadi**.
- Vidjet ~0,5 soniyalik animatsiya bilan paydo boʻladi.
- «Yana» menyusi vidjet qoʻshilgandan keyin **yopilmaydi** — bir
  nechtasini ketma-ket qoʻshish mumkin.
- Paneldagi belgi ustida **nuqta** chiqadi: ekranda shu vidjetdan
  nechta borligini koʻrsatadi (••• — uchta). «Yana» ichidagi
  vidjetlarda ham, «Yana» tugmasining oʻzida ham.

**Olamiz:** faol nusxa nuqtasi (R422 da ham qayd etilgan). Ustma-ust
tushish — **olinmaydi**: yangi vidjet boʻsh joyga siljitib qoʻyilsin.

**Holat:** ✅ boʻsh joyga qoʻyish qurilgan (`lib/doska/placement.ts`, `findFreeSpot`) — oddiy qoʻshishda ham, tayyor ekranlarda ham.

#### R430 — Tanlov ramkasi va vidjet paneli

- **Tutqichlar:** 4 burchakda. Matn va jadval kabi choʻziladigan
  vidjetlarda yon tomonda ham bor («pill» shaklida).
- **Burish tutqichi** vidjet ostida, tooltip «0°». Svetofor, zar,
  matn, QR va ish belgilarida bor.
- **Asboblar paneli** vidjet tepasida, markazda: Oʻchirish · Sozlash ·
  ⋮. Tepada joy boʻlmasa, **ostiga oʻtadi**.
- Ichi interaktiv vidjetlarda (guruh, matn, chizish) panelda alohida
  **«Sudrash» ✥** tugmasi bor — tarkibga bosish vidjetni surmasin.
- ⋮ menyusida har amal yonida uning yorligʻi yozilgan (R402).

**Bizda:** kontekst panel yozuvli (`BarTextButton`), 44 px tutqich
maydoni, chetga qisish — ulardan yaxshiroq. **Olamiz:** menyuda
yorliq yozuvi (A1 paketida).

#### R431 — ⭐ Ikki bosqichli teginish (ularning kamchiligi)

Koʻp vidjetda **birinchi teginish faqat vidjetni tanlaydi**, ichidagi
amal esa ikkinchi teginishda ishlaydi: svetofor chirogʻi, QR maydoni,
ish belgisi. Istisnolar: taymerning ▶/⏸ tugmasi va vizual taymerning
disk tutqichi — ular kodda alohida belgilangan (`on-click-not-drag`,
`data-interaction-ignore-drag`). E-doskada bu har amalga ortiqcha bitta
teginish degani.

**Bizda:** asosiy amal alohida nishon va birinchi teginishdayoq
ishlaydi (UX 2-bosqich kod koʻrigi). **Qoida sifatida saqlansin:** har
yangi vidjetda (ish belgilari, zar, hisob…) asosiy amal tanlashsiz
ishlashi shart.

#### R432 — Tanlanmagan vidjet — faqat natija

Ish belgilari tanlanmagan paytda faqat katta belgi va soʻz koʻrinadi.
Tanlov qatori (4 ta doira) **faqat vidjet tanlanganda** chiqadi.
Oʻquvchi ortiqcha tugmani koʻrmaydi.

**Bizda:** taymerda ham shu naqsh bor (`selected && …`). **Qoida:** yangi
vidjetlarda ikkinchi darajali boshqaruv faqat tanlanganda chiqadi,
asosiy amal esa doim koʻrinadi (R431 bilan birga).

#### R433 — Koʻrinish vidjet shakliga qarab oʻzgaradi

| Vidjet | Keng | Oʻrtacha | Kvadrat/tik |
|---|---|---|---|
| Taymer | faqat raqam, **har raqamga ±** | halqa + raqam | katta halqa, markazda vaqt va bitta ± |
| Soat | raqamli | — | analog + raqamli (tik) |
| Kalendar | oy | — | bitta kun (tor) |

Koʻrinishlar orasida **silliq almashuv** (crossfade) bor. Kamchiligi:
juda kichik oʻlchamda tugmalar raqamlar ustiga tushib qoladi.

**Bizda:** taymer koʻrinishi sozlamadan tanlanadi (raqam / disk /
ikkalasi). **Olamiz:** sozlamaga «Avto» varianti qoʻshilsin va u
standart boʻlsin — koʻrinish shakldan tanlanadi, qoʻlda tanlov ham
qoladi. Kichik oʻlchamda ikkinchi darajali tugmalar yashirinadi.

**Holat:** ✅ taymerda «Avto» qurildi va yangi taymerlarda standart (keng yoki tor — faqat raqam, qolganida disk + raqam). Soat va kalendar uchun hozircha kerak emas — ularda bitta koʻrinish.

#### R434 — Proporsional masshtab

Brauzer oynasi ikki marta toraytirildi (1518 → 755 px). Natija:

- **hamma vidjet** joyi va oʻlchami bilan birga proporsional kichraydi;
- vidjet paneli va tugmalar esa **oʻz oʻlchamida qoladi**;
- kichik oynada vidjet ichidagi matn oʻqib boʻlmaydigan darajada mayda
  boʻladi (guruh tuzuvchida ismlar ~6 px).

**Xulosa:** R397 tasdiqlandi — ular joyni ekranga nisbatan saqlaydi.
Bizda mantiqiy 16:9 + masshtab qilinganda boshqaruv (panel, karta,
tutqich) masshtabga kirmasligi va vidjet ichidagi matnga minimal
chegara qoʻyilishi kerak.

#### R435 — Sozlash oqimi

1. **Boʻsh holat vidjet ichida:** ikonka, bir jumla va «Sozlamani
   ochish» asosiy tugmasi (tasodifiy ism, guruh, kun jadvali, voqea
   sanogʻi).
2. **Tur tanlash — vidjet ichida, rasmli kartalar bilan** (soʻrovnoma:
   koʻp tanlov / smaylik / toʻgʻri-notoʻgʻri; hisob taxtasi:
   uy-mehmon / ochko / poyga). Tanlangach sozlama paneli oʻzi ochiladi.
3. **Roʻyxat kiritilgach** («Davom etish») panel oʻzi «Sozlamalar»
   varagʻiga oʻtadi.
4. **Jonli oldindan koʻrish:** forma toʻldirilayotganda vidjet orqada
   darhol yangilanadi (voqea sanogʻi, guruhlar soni).
5. **Tanlov doim rasmli karta:** koʻrinish (standart/gʻildirak), zar
   turlari (12 ta), rang mavzulari (har kartada vidjetning kichik
   nusxasi).
6. **Yordamchi matn natijani aytadi:** «guruhlarda 3 tadan oʻquvchi
   boʻladi».
7. **Tayyor roʻyxat** ustidan yozishda ogohlantirish: «joriy kiritma
   almashtiriladi».

**Olamiz (yangi vidjetlar uchun):** 1, 2, 4, 6 — sozlama kartamizga
(UX Q2) mos, uni oʻzgartirmaydi.

**Holat:** ✅ 1 — `WidgetEmpty` (QR, voqea sanogʻi, dars bosqichlari, video, havola, sayt); ✅ 2/5 — `SettingsCards` rasmli kartalar (soʻrovnoma turi, taymer koʻrinishi); ✅ 4 — sozlama oʻzgarishi vidjetda darhol koʻrinadi (Q2 dan beri); ✅ 6 — guruh sozlamasida «4 ta guruh, har birida 6–7 tadan».

#### R436 — Oʻchirish xabari

Pastki chapda «Vidjet oʻchirildi · Qaytarish ×». **Bizda ham aynan
shunday** (`DoskaNotice`, 6 soniya) — tasdiq.

#### R437 — Tasodifiy ism: kichik detallar

- **Standart koʻrinish:** bosilganda ismlar ~1,5 soniya tez almashadi,
  keyin natija katta harfda qoladi.
- Tugma animatsiya paytida **nofaol**.
- «Tanlanganlarni eslab qolish» **standart yoqiq**. Tanlanganlar
  sozlamada roʻyxat boʻlib koʻrinadi: bittasini qaytarish yoki
  hammasini tozalash mumkin.
- Gʻildirakda burchakda **lupa** tugmasi bor (koʻp ismda yaqinlashtirish).
- Roʻyxat kiritilgach standart koʻrinish **gʻildirak** boʻladi.

**Olamiz:** standart koʻrinish (R410). Qolganlari bizda allaqachon bor
(«bir martadan» rejimi va qoʻlda qaytarish).

#### R438 — Mayda tugmalar (ularning kamchiligi)

Hisob taxtasining ± tugmalari, QR va havola maydonlari juda mayda
(≈12–16 px). E-doskada barmoq bilan bosib boʻlmaydi.

**Bizda:** 44 px teginish maydoni qoidasi (R321) — yangi vidjetlarda
ham majburiy.

#### R439 — Taymer tugaganda

**Ularda:**
- 00:00 da halqa boʻshaydi, **tovushdan boshqa signal yoʻq**;
- «Toʻxtatish» vaqtni **00:00 ga** tushiradi, oldin qoʻyilgan vaqtga
  emas — oʻqituvchi vaqtni qaytadan qoʻyadi;
- nolda «+» 10 soniya qoʻshadi.

**Bizda:** tugaganda karta qizil tusga oʻtadi va «Vaqt tugadi» yozuvi
chiqadi, asosiy tugma «Qaytadan»ga aylanadi — **bizniki yaxshiroq**.
Olinmaydi.

#### R440 — Matn vidjeti

- Qoʻshilishi bilan **darhol tahrir rejimida** ochiladi va «Matn
  kiriting…» degan placeholder turadi.
- Ustidagi panel: sudrash, qaytarish/qaytarishni bekor qilish, shrift,
  oʻlcham, B/I/U, tekislash, roʻyxat, **formula (LaTeX kiritish)**,
  daraja, havola, matn rangi, belgilash, **«matnga moslash»**
  (ramkani matnga qisqartirish), oʻchirish, sozlash.
- 8 ta tutqich.
- Shrift oʻlchami qatʼiy (28) — ramkaga moslashmaydi.

**Bizda:** matn ramkaga moslashadi (`useFitText`) — ekranda
oʻqilishi uchun bu yaxshiroq. **Olamiz (D):** qalin, rang va formula.
Bizda KaTeX allaqachon bor (`lesson-math-katex`).

#### R441 — Siyoh paneli

- Siyoh rejimi **vidjet panelining oʻrnida** ochiladi (bizda ham shunday).
- Asboblar katta, realistik rasmlar (marker, highlighter, moʻyqalam,
  oʻchirgʻich); tanlangani yuqoriga koʻtariladi.
- Shakllar alohida qatorda (popover).
- Ranglar ikki qatorda, qalinlik uchta nuqta.
- Tepa markazda «Chizishni toʻxtatish · ESC».

**Xulosa:** tartib bizniki bilan bir xil. «Asbob yuqoriga koʻtariladi»
— tanlanganini koʻrsatishning yaxshi usuli, lekin bizda tanlov holati
allaqachon aniq. Olinmaydi.

#### R442 — Boshqaruv paneli (mehmon)

Tarkibi: salomlashish, qizil «saqlanmagan» ogohlantirishi, shablonlar
karuseli, toʻplamlar setkasi.

- Toʻplam kartasida **jonli eskiz** va qizil «Saqlanmagan» belgisi.
- Filtr, saralash («Oxirgi tahrir») va koʻrinish («Setka») tugmalari.

**Olamiz (C):** server bilan birga, R425.

### 2.9. UX/UI dan kodga oʻtadigan qoidalar

Yangi vidjet yoki oʻzgarishda **majburiy**:

1. Asosiy amal tanlashsiz, birinchi teginishda ishlaydi (R431).
2. Ikkinchi darajali boshqaruv faqat tanlanganda chiqadi (R432).
3. Har tugma va maydon — kamida 44 px teginish maydoni (R438).
4. Boʻsh holat vidjet ichida: ikonka, bir jumla, asosiy tugma (R435).
5. Tur yoki koʻrinish tanlovi — rasmli kartalar (R435).
6. Koʻrinish vidjet shakliga moslashadi, «Avto» standart (R433).
7. Yangi vidjet mavjudlarining ustiga tushmaydi (R429).

### 2.10. Qurilgani — A1 yorliqlar paketi (2026-10-01)

Branch: `maxdum/doska-yorliqlar`.

| Joy | Nima |
|---|---|
| `useDoskaShortcuts.ts` | `shortcutKey()`: lotin harf — `e.key` dan, lotin boʻlmagan harf — tugma joyidan (`KeyP` → `p`), raqam va belgilar — `e.key` ning oʻzi. PageUp/PageDown — ekran almashtirish, tanlov boʻlsa ham (vidjet ichidagi fokusda — vidjetniki). `K` · `?` — roʻyxat |
| `DoskaShortcuts.tsx` | Roʻyxat oynasi: umumiy · tanlangan vidjet · qalam. Yopish: Esc, fon, ✕, yana `K` / `?` |
| `ShortcutKeys.tsx` | Tugma chiplari (`Kbd`); `Mod` — Windowsʼda «Ctrl», Macda «⌘» |
| `BarGroup.tsx` | `BarIconButton` ga `shortcut` — tooltipʼda nom yonida |
| `DoskaShell.tsx` | Tooltipda yorliq: bekor qilish, qaytadan bajarish, ekranlar, toʻliq ekran, panelni yashirish. `translate="no"` — `.doska-root` da (server HTML) va `<html>` da (`useNoTranslate`, portallar uchun) |
| `DoskaMenu.tsx` | «Klaviatura yorliqlari» bandi, `K` bilan |
| `app/doska/page.tsx` | `<meta name="google" content="notranslate">` |
| `icons.tsx` | `IconKeyboard` (oʻzimiz chizdik, `DOSKA_ICONS` da) |
| `layers.ts` | `Z_SHORTCUTS_SCRIM`, `Z_SHORTCUTS` — boshqaruvdan yuqori, pardadan past |
| `messages/*.json` | 7 tilda `Doska.shortcuts`, `Doska.menu.shortcuts`, changelog |

Qarorlar:

- **Harf faqat lotin boʻlmaganda joyidan taniladi.** Doim `e.code`
  olinsa, AZERTY va boshqa lotin tartibida yorliq tugmaga yozilgan
  harfga mos kelmay qolardi.
- **Raqam va belgilar joyidan tanilmaydi.** Shift+1 «!» boʻlib qoladi
  va parda tushmaydi.
- **Yozuvli panel tugmalarida (Qalam, vidjetlar) tooltip qoʻshilmadi.**
  Yozuv allaqachon koʻrinib turadi (`BarButton` izohi). Ular uchun —
  `K` roʻyxati.
- **Pult uchun `.` va `B` (qora ekran) qoʻshilmadi.** `B` bizda
  boshqaruvni yashiradi. Parda uchun `1` bor.

Tekshiruv: `tsc` va eslint toza, dizayn tokeni darvozasi oʻtdi.
`shortcutKey` 19 holatda sinaldi: rus va kirill harflari, Ctrl+«я»,
AZERTY, raqam, «!», «?», nomli tugmalar, «ʻ».

---

## 3. Referens 3 — kundalik ekran shablonlari (dizayn)

2026-10-01, foydalanuvchi soʻrovi: «Doska dizayni uchun shundan olishimiz
kerak. Lekin 1:1 boʻlmasin, mualliflik huquqi buzilmasin». Berilgani —
2-referensdagi xizmatning bitta tayyor ekrani (skrinshot + DOM):
«Dushanba» sarlavhasi, daftar ustidagi kun jadvali, taymer, «Dars
maqsadi», «Eslatmalar», «Kerakli narsalar», «Tugatdingmi?» kartalari,
fotosurat fon.

Bu safar savol vidjet emas, **ekranning kompozitsiyasi va bezagi**: bitta
ekran qanday qilib «tayyor, chiroyli kun paneli» boʻladi.

### 3.1. Nima koʻrildi

- **Kutubxonadagi «Kundalik ekranlar» toifasi** — 30 ta shablon roʻyxati.
  Kartadagi rasm muqova, ekranning oʻzi emas — shuning uchun beshtasi
  ilovada mehmon rejimida ochildi:

  | | Shablon | Muallif | Ekran |
  |---|---|---|---|
  | A | Kun tartibi — **foydalanuvchi bergan ekran** | oʻqituvchi | 5 (Du–Ju) |
  | B | Haftalik kun tartibi | oʻqituvchi | 5 (Du–Ju) |
  | C | Oddiy boshlanish | oʻqituvchi | 2 |
  | D | Sinf kun tartibi | xizmatning oʻzi | 1 |
  | E | Ertalabki kun tartibi | xizmatning oʻzi | 1 |

- **DOM:** A va B dagi obyektlar turi va soni, shriftlar, rasm manbalari.
- **Toifadan tashqarida:** oʻqituvchilar doʻkonlaridagi «kundalik
  slaydlar» (Slides/PowerPoint/Canva shablonlari) — boʻlimlari bir xil:
  maqsad, kun tartibi, kerakli narsalar, eslatma, uyga vazifa,
  «tugatganlar uchun».

Hech qanday fayl (rasm, stiker, ikonka, shrift) yuklab olinmadi va
loyihaga qoʻshilmadi.

### 3.2. Bizda allaqachon bor

| Referensda | Doskada |
|---|---|
| Kun jadvali vidjeti (qoʻlda yoziladi) | «Bugun» — dars jadvalidan **avtomatik**, hozirgi dars ajratiladi, oʻtgani xira; «Bosqichlar» — belgilanadigan roʻyxat |
| Taymer (halqa + raqam) | Taymer, «Avto» koʻrinish |
| Soat, kalendar | Soat (+ qoʻngʻiroq jadvali) |
| Kun savoli, kayfiyat soʻrovi | Soʻrovnoma (smaylik turi bilan) |
| Shovqin oʻlchagich | Bor |
| Stikerlar | Emoji stikeri (60 ta, 6 toʻplam) |
| Fon toifalari | 13 ta CSS fon, bayram va mavsum («Bugunga mos») |
| Tayyor ekranlar | 4 ta statik shablon (`lib/doska/templates.ts`) |

### 3.3. Topilmalar

#### R443 — «Kundalik ekran» qanday gʻishtlardan iborat

Besh shablonda (A–E) qaysi boʻlim borligi:

| Boʻlim | A | B | C | D | E | Jami |
|---|---|---|---|---|---|---|
| Kun jadvali (ikonka + nom; vaqt yoki belgi) | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** |
| Kun nomi / sana | ✓ | ✓ | ✓ | ✓ | — | **4/5** |
| Dars maqsadi | ✓ | ✓ | ✓ | ✓ | — | **4/5** |
| Fotosurat yoki video fon | ✓ | — | ✓ | ✓ | ✓ | **4/5** |
| Bezak stikerlar | ✓ | ✓ | — | ✓ | — | 3/5 |
| Eslatma / eʼlonlar | ✓ | ✓ | — | — | ✓ | 3/5 |
| Qoʻlyozma shrift (yoziladigan joyda) | ✓ | — | ✓ | — | ✓ | 3/5 |
| Taymer | ✓ | ✓ | — | — | — | 2/5 |
| Kerakli narsalar | ✓ | ✓ | — | — | — | 2/5 |
| «Hozir bajar» / isinish mashqi | — | ✓ | ✓ | — | — | 2/5 |
| Kun savoli | — | — | — | ✓ | ✓ | 2/5 |
| «Tugatdingmi? Keyingi ish» | ✓ | — | — | — | — | 1/5 |
| Soat, shovqin, video, kayfiyat | — | — | — | ✓ | ✓ | 1–2/5 |

**Xulosa:** toifaning yadrosi — **kun jadvali + kun nomi + dars
maqsadi**, atrofida 2–3 ta sarlavhali matn kartasi. Qolgani ixtiyoriy.
Doʻkonlardagi «kundalik slaydlar» ham aynan shu boʻlimlardan tuzilgan.

#### R444 — Karta uchta obyektdan yigʻilgan (ularning kamchiligi)

Ularda «sarlavhali karta» degan vidjet **yoʻq**. Har karta qoʻlda
yigʻilgan:

- **A:** rangli toʻrtburchak (shakl) + qalin sarlavha (matn) + oq yozuv
  maydoni (matn). Uchalasi «guruh» qilingan — ekranda 5 ta guruh.
- **B:** bir ekranda **13 ta matn bloki**, 4 ta rasm, 3 ta stiker,
  taymer va jadval. «Eslatmalar» kartasi — rangli fonli matn bloki
  ustida sarlavha bloki, uning ostida oq fonli matn bloki.

Natija: ekranda 20+ obyekt; bittasi siljisa karta «buziladi»; oʻlchamni
oʻzgartirish uchun uchta obyektni alohida choʻzish kerak. Shuning uchun
ularda guruhlash funksiyasi bor.

**Olamiz — lekin boshqacha:** bizda karta **bitta vidjet** boʻladi
(sarlavha + yozuv maydoni). Guruhlash kerak boʻlmaydi, choʻzilganda ichi
oʻzi moslashadi.

#### R445 — Kun nomi rasm qilib qoʻyilgan → 5 ta ekran

A va B da «Monday» — **rasm** (stiker yoki yuklangan rasm). Shuning
uchun shablon 5 ta ekrandan iborat (Dushanba…Juma), oʻqituvchi har kuni
kerakli ekranga oʻtadi. D va C da esa kalendar vidjeti kun va sanani
oʻzi koʻrsatadi.

**Olamiz — maʼlumot ustunligi bilan:** bizda kun nomi va sana **oʻzi
yangilanadi** — bitta ekran har kuni toʻgʻri kunni koʻrsatadi. Ustiga
oʻquv kalendaridan bayram yoki taʼtil nomi qoʻshiladi («Bugun —
Oʻqituvchilar kuni»; maʼlumot `lib/doska/today.ts` da allaqachon bor).
Koʻrinishi — katta displey yozuv, uslub shriftida.

#### R446 — Kun jadvali: vaqt chizigʻi va ikonka

- B, D, E: har qatorda boshlanish va tugash vaqti, orasida **toʻlib
  boruvchi chiziq**; oʻtgan faoliyatda ✓.
- A: vaqt yoʻq, oʻngda katta belgilash katagi.
- Hammasida har qatorga rasmli ikonka (kitob, matematika, uy, tushlik…)
  qoʻlda tanlanadi.

**Bizda:** «Bugun» darslarni jadvaldan oʻzi oladi, hozirgisi ajratiladi.
**Olamiz:** hozirgi darsda **qolgan vaqt chizigʻi** (kichik ish). Ikonka
— fan katalogidan avtomatik (`subject-catalog-id-storage`), qoʻlda
tanlash yoʻq. Ularning ikonka toʻplami olinmaydi.

#### R447 — Sarlavhali karta: ikki koʻrinish

- **Toʻla:** rangli ramka, ichida qalin sarlavha va oq yozuv maydoni
  (A: «Dars maqsadi», «Eslatmalar»; B: hammasi).
- **Chiziqli:** qoramtir chiziq, yarim shaffof oq ichki, sarlavha va
  ostida stiker (A: «Kerakli narsalar», «Tugatdingmi?»).
- Yozuv maydonida kulrang placeholder («Matn kiriting…»).

**Olamiz:** yangi **«Karta»** vidjeti (R444): sarlavha + yozuv, tusi
sinf palitrasidan (`class-colors.ts`) tanlanadi, matn ramkaga
moslashadi (`useFitText`). Koʻrinishi uslub tokenidan — Sokin, Oʻyinchoq,
Doska har biri oʻz kartasini chizadi (Q1).

#### R448 — Fotosurat fon va «muzli» kartalar

A, C, D, E — yuklangan fotosurat yoki video fon (stol, oʻsimlik,
yomgʻir, barg), avval xira kichik nusxa, keyin toʻliq rasm. Kartalar
yarim shaffof («muzli shisha»).

**Kamchilik:** C, D, E da yarim shaffof karta ustidagi och matn rasm
ustida yuviladi — proyektorda oʻqilishi qiyin (E dagi qoʻlyozma
eʼlonlar ayniqsa).

**Xulosa:** fotosurat katalogi **olinmaydi** — fonlar CSS boʻlib qoladi
(`backgrounds.ts` boshidagi qaror: deploy yuki va proyektor
tiniqligi). Fotosurat kerak boʻlsa — oʻqituvchining oʻz rasmi (R384 +
R420, saqlash joyi qarori kutilmoqda). Oʻrniga 2–3 ta **«yumshoq sahna»**
CSS foni qoʻshish mumkin (iliq stol, koʻkalam — xiralashgan rang
dogʻlari), proyektor sinovidan oʻtkaziladi. Yarim shaffof karta
qilinmaydi.

#### R449 — Bezak stikerlar karta chetiga qoʻyiladi

A va B da qalam, daftar, olma, globus kabi rasmli stikerlar karta
chetiga chiqib, qiya burilib turadi (−6°, 67°, koʻzgu aks). Ekranga
«qoʻlda yasalgan» issiqlik beradi.

**Bizda:** emoji stikeri, burish yoʻq. **Olamiz (keyin):** stikerni
burish (R430 dagi burish tutqichi bilan birga). Rasmli stiker toʻplami —
faqat oʻzimizniki yoki litsenziyasi aniq manbadan; ularniki olinmaydi.
`public/illustrations` dagi chizmalarni stiker qilishdan oldin
litsenziyasi tekshiriladi.

#### R450 — Tipografika

- Sarlavhalar — yumaloq geometrik shrift, qalin.
- Yoziladigan joy — **qoʻlyozma shrift** («oʻqituvchi qoʻli» hissi).
- Kun nomi — katta, qalin, rangli harflar (B da har harf boshqa rangda).

**Bizda:** har uslubning oʻz shrifti (Onest / Nunito / Rubik).
**Xulosa:** sarlavha va kun nomi uslub shriftida qoladi. Qoʻlyozma
shrift **hozircha yoʻq**: (1) oʻqishni endi oʻrganayotgan bola uchun
proyektorda bosma harf tiniqroq; (2) shriftda `ʻ` (U+02BB) va kirill
harflari boʻlishi shart — har nomzod alohida tekshiriladi. Keyin
kartaga ixtiyoriy «qoʻlyozma» tanlovi boʻlib qoʻshilishi mumkin.

#### R451 — Har shablonning oʻz palitrasi

A — marjon + toʻq koʻk + pastel; B — pastel kamalak; D — toʻq yashil.
Taymer halqasi ham shablon rangida. Ularda bu vidjet rang mavzusi bilan
qilinadi (R421).

**Bizda:** vidjet tusi — turining belgisi (taymer doim sariq), koʻrinish
— oʻqituvchi tanlagan uslub (Q1). **Xulosa:** shablon vidjetlar rangini
oʻzgartirmaydi. Shablon faqat **kartalar tusini** (R447) va fonni
tanlaydi. Oq qogʻozli kartalar koʻrinishiga eng yaqini — «Doska»
uslubi (qogʻoz + magnit); u allaqachon bor.

#### R452 — Shablon joylashuvi qoʻlda chizilgan

Ularda har obyekt aniq joyda turadi: chap ustun — jadval, oʻrtada —
sarlavha va taymer, oʻngda — kartalar. Bizning shablonlar esa vidjetlarni
boʻsh joyga **avtomatik** qoʻyadi (`findFreeSpot`) — tartibli
kompozitsiya chiqmaydi.

**Olamiz:** shablon vidjetiga ixtiyoriy joy — **ekranning ulushi**
(`x, y, w, h` 0…1 oraligʻida). Ekran ochilganda joriy oyna oʻlchamiga
koʻpaytiriladi. Bu R397 dagi mantiqiy 16:9 maydonga birinchi qadam va
uni kutmaydi: saqlanishi hozirgidek pikselda qoladi.

#### R453 — Mualliflik huquqi: nima olinadi, nima olinmaydi

Umumiy amaliyot: **gʻoya, janr, funksiya va umumiy joylashuv**
himoyalanmaydi; **aniq ijod mahsuli** — rasm, ikonka, stiker, foto,
shrift fayli, matn — himoyalanadi. Ustiga A va B ni oʻqituvchilar
yaratgan: rasmlar ularning shaxsiy yuklagan fayllari.

| Olinadi (gʻoya) | Olinmaydi (ijod mahsuli) |
|---|---|
| «Kundalik ekran» janri va boʻlimlar toʻplami (R443) | Hech bir fayl: kun nomi stikerlari, daftar/planshet rasmlari, stikerlar, jadval ikonkalari, fotolar |
| Sarlavhali karta tushunchasi (R447) | Ularning shriftlari (ayniqsa litsenziyali qoʻlyozma shrift) |
| Kun nomi koʻrinib turishi (R445) | Aniq matnlar («What's going on today», «Done? Here's what's next…») |
| Jadvalda vaqt chizigʻi (R446) | Biror shablonning aniq joylashuvi va rang birikmasi |
| Bezak stikerni burish (R449) | Mahsulot nomi — kodda, commitda, hujjatda |

**«1:1 emas» tekshiruvi** — har yangi shablon chiqishidan oldin:

1. Joylashuv — oʻzimizniki (R454), ularning biror ekranini takrorlamaydi.
2. Rang — faqat bizning tokenlar va sinf palitrasi.
3. Shrift — faqat bizning uslub shriftlari.
4. Tasvir — faqat emoji yoki oʻzimizning SVG; tashqaridan fayl yoʻq.
5. Matn — oʻzbek maktabi tilida, oʻzimiz yozamiz («Dars maqsadi», «Uyga
   vazifa», «Kerakli narsalar», «Tugatgan boʻlsang»).

Bu yuridik xulosa emas — muhandislik qoidasi: shubhali joyda olinmaydi.

#### R454 — Bizning shablon: «Kun rejasi» (taklif)

Ularnikidan farqi — **bitta ekran, har kuni oʻzi yangilanadi** (R445),
jadval dars jadvalidan oʻzi toʻladi (R446). Joylashuv — tepada keng
sarlavha qatori, ostida teng uch ustun (ularda — markaziy sarlavha va
markaziy ustun):

```
┌──────────────────────────────────────────┬───────────┐
│ Payshanba, 1-oktyabr                      │  Taymer   │
│ Oʻqituvchilar kuni                        │   05:00   │
├──────────────┬───────────────┬────────────┴───────────┤
│ Bugun        │ Dars maqsadi  │ Uyga vazifa             │
│ 08:00 7-A ▬▬ │               │                         │
│ 08:50 8-B    ├───────────────┼─────────────────────────┤
│ 09:40 5-V    │ Kerakli       │ Tugatgan boʻlsang       │
│ …            │ narsalar      │                         │
└──────────────┴───────────────┴─────────────────────────┘
```

Fon — CSS (iliq «yumshoq sahna» yoki bayram foni), uslub — oʻqituvchi
tanlagani. «Uyga vazifa» keyin topshiriqlardan avtomatik toʻlishi mumkin
(alohida qaror).

### 3.4. Tavsiya etilgan tartib

| # | Ish | Topilma | Hajm | Holat |
|---|---|---|---|---|
| 1 | «Karta» vidjeti: sarlavha + yozuv, tus tanlovi, uch uslubda | R444, R447 | oʻrta | ✅ §3.6 |
| 2 | «Sana» vidjeti: kun nomi, sana, bayram nomi — oʻzi yangilanadi | R445 | kichik | ✅ §3.6 |
| 3 | Shablonda joy ulushi (`x, y, w, h` 0…1) | R452 | kichik | ✅ §3.6 |
| 4 | «Kun rejasi» shabloni (1–3 ustiga) | R454 | kichik | ✅ §3.6 |
| 5 | «Bugun»: hozirgi darsda qolgan vaqt chizigʻi | R446 | kichik | ✅ §3.6 |
| 6 | 3 ta «yumshoq sahna» CSS foni + proyektor sinovi | R448 | kichik | ✅ §3.6 |
| 7 | Stikerni burish | R449 | oʻrta | keyin |
| — | Qoʻlyozma shrift, fotosurat katalogi, shablon palitrasi | R448, R450, R451 | olinmaydi / keyin | — |

### 3.5. Qarorlar (foydalanuvchi, 2026-10-01)

1. **«Karta» — alohida vidjet** (`card.v1`), «Eslatma»ning koʻrinishi emas.
2. **Fon — faqat CSS «yumshoq sahna»**; fotosurat katalogi yoʻq.
3. **Nomi «Sana»** (`date.v1`).

### 3.6. Qurilgani (2026-10-01)

Branch: `maxdum/doska-kun-rejasi`. §3.4 dagi 1–6-bandlar.

| Joy | Nima |
|---|---|
| `widgets/CardWidget.tsx` | «Karta»: sarlavha (`preset` kaliti yoki oʻz `title`) + yozuv varagʻi (`EditableText`). Sozlama: 6 ta tayyor sarlavha, oʻz sarlavhasi, 5 tus. Qoʻyilganda sozlama ochiladi va varaq yozishga tayyor |
| `widgets/DateWidget.tsx` | «Sana»: kun nomi, sana, bayram nomi; keng vidjetda bir qatorda; `useFitText` bilan qutiga sigʻadi. Sozlama: sana, yil, bayram |
| `lib/doska/date-label.ts` | Kun va sana 7 tilda: `uz` — `localization.ts`, qolgani `Intl`; brauzer tilni bilmasa (qoraqalpoq) — oʻzbekcha lotin |
| `widgets/useTodayLoad.ts` | «Bugun» va «Sana» uchun bitta server soʻrovi (modul keshi) |
| `widgets/TodayWidget.tsx` | Hozirgi darsda oʻtgan vaqt chizigʻi (R446) |
| `widgets/useFitText.ts` | Har qanday element; eni ham tekshiriladi (bir qatorli matn) |
| `lib/doska/placement.ts` | `usableArea` (boʻsh joy qidiruvi bilan umumiy chegara), `rectInArea` (ulush → piksel, eng kichik oʻlcham saqlanadi) |
| `lib/doska/templates.ts` + `store.ts` | Shablon vidjetida `at`; «Kun rejasi» shabloni (R454 joylashuvi) |
| `lib/doska/backgrounds.ts` | `soft-warm`, `soft-green`, `soft-sky` |
| `styles/doska.css` | `--doska-card-body-*`, `--doska-card-rule-width`; `.doska-card-title`, `.doska-card-body` |
| `scripts/doska-projector-check.mjs` | Karta yozuvi va yumshoq fonlar ustidagi siyoh — 46 juftlik yashil |
| `icons.tsx` | `IconCard`, `IconDate` (oʻzimiz chizdik) |
| `messages/*.json`, `changelog-data.ts` | 7 tilda matn; bitta changelog yozuvi `doska-kun-rejasi` |

Tekshiruv: «Kun rejasi» joylashuvi 1920×1080, 1366×768, 1280×720,
1024×600 va tik 768×1024 da maydon ichida (eng kichik oʻlchamga
kattalashgan vidjet maydon ichiga qaytariladi); 1280×720 da taymer eng
kichik balandligi (180 px) tufayli pastki qatorga 7 px kiradi. Sana 7 tilda
«M10» siz chiqadi.

**Kod koʻrigi (xhigh, 12 topilma — hammasi tuzatildi):**
- shablon vidjeti maydon ichiga qaytariladi (`rectInArea`); «Barcha
  ekranlarda» vidjeti turgan joyga tushmaydi — boʻsh joyga
  (`placeTemplateWidget`);
- `useFitText` uslub shrifti yuklangach qayta oʻlchaydi
  (`document.fonts`) — bir qatorli «Sana» chetidan kesilmaydi;
- uzun bayram nomi oʻzi kesiladi (`truncate`), kun nomini kichraytirmaydi;
- yozish ham, sozlama ham ochiladigan vidjetda (karta) qoʻyilganda yozish
  YOQILMAYDI — ekran klaviaturasi tayyor sarlavhalarni yopardi (`addWidget`);
- «Bugun»da jadval yoʻq boʻlsa — boʻsh holat va «Bosqichlarni yozish»;
- «Sana»: bayram oʻchiq boʻlsa server soʻralmaydi, kirill oʻzbekcha uchun
  oʻz nomlari (`localization.ts`: `DAYS_UZ_CYRL_SUN`, `MONTHS_UZ_CYRL`),
  matn kun almashgandagina hisoblanadi;
- sarlavhasiz kartada «Sarlavha» faqat tanlanganda;
- proyektor sinovi yumshoq fon ranglarini `backgrounds.ts` dan oʻzi
  oʻqiydi (`id: "soft-…"`).

**«1:1 emas» tekshiruvi (R453):** joylashuv — tepada keng sarlavha
qatori va teng uch ustun (referensda markaziy sarlavha va markaziy
ustun); rang — uslub tuslari; shrift — uslub shriftlari; tasvir — faqat
oʻzimiz chizgan ikonalar, stiker va rasm yoʻq; matn — oʻzbekcha,
oʻzimiz yozdik. Hech qanday tashqi fayl yoʻq.

---

## 4. Referens 2 — vizual tizim: vidjet yuzasi (chuqur koʻrik)

2026-10-01, foydalanuvchi soʻrovi: «Doskaning dizayn tizimi boʻlmayapti.
Bulardagi har bir vidjetning oq foni yaxshi — umumiy fondan qatʼiy nazar
vidjetning oʻz oq foni mos boʻlaveradi. Chuqur oʻrgan. 1:1 boʻlmasin,
mualliflik huquqi buzilmasin.» Berilgani — 3-referensdagi oʻsha ekran
(skrinshot + DOM).

§3 da savol ekranning **kompozitsiyasi** edi. Bu safar — **vidjet
yuzasining materiali va rang tizimi**: nega ularning ekrani har qanday
fonda «yigʻilgan» koʻrinadi, bizniki esa yoʻq.

### 4.1. Nima koʻrildi

- **Ilova mehmon rejimida.** 9 ta vidjet qoʻshildi (taymer, soat,
  svetofor, matn, ish belgilari, kun jadvali, soʻrovnoma, tasodifiy ism,
  shovqin) va har birining hisoblangan uslubi oʻlchandi: fon, radius,
  soya, chegara, shrift, ichki elementlar.
- **Rang mavzusi tanlovi** — 30 ta mavzu DOMdan rol boʻyicha oʻqildi;
  mavzu tokenlari (CSS oʻzgaruvchilari) va ularning hosilalari.
- **Bir xil vidjetlar toʻrt fonda:** fotosurat, toʻq bir tekis, oq, och
  kulrang.
- **«Toʻq panel»** ekran sozlamasi yoqib koʻrildi, keyin asliga qaytarildi.
- **Toifa** (bitta referens emas): telefon va kompyuter vidjetlari dizayn
  qoʻllanmasi, ochiq dizayn tizimlaridagi karta turlari, rasm ustidagi
  matn usullari.
- **Oʻzimizning 21 fonimiz** boʻyicha hisob — oq karta har fonda qanchalik
  ajraladi. Formula proyektor sinovidan
  (`scripts/doska-projector-check.mjs`): oddiy kontrast va yuvilgan
  proyektor simulyatsiyasi.

Hech qanday fayl (rasm, ikona, shrift, CSS) olinmadi va loyihaga
qoʻshilmadi.

### 4.2. Topilmalar

#### R455 — Hamma vidjet bitta materialda: oq varaq

Har vidjetning orqa qatlami bir xil: **oq** (`#fff`), radius **8 px**,
**soyasiz, chegarasiz**. Taymer, soat, svetofor, matn, jadval,
soʻrovnoma, tasodifiy ism — hammasi. Istisno faqat oʻzi rasm boʻlgan
vidjet: ish belgisi (oq doira — belgining oʻzi).

Vidjet ichidagi elementlar ham shu varaq ustida chiziladi:

| Element | Koʻrinish |
|---|---|
| Ichki tanlov kartasi (soʻrovnoma turi) | shaffof, 2 px och kulrang chegara, juda yengil soya, radius 8 — tashqi bilan bir xil |
| Asosiy tugma («Sozlamani ochish», ▶) | toʻla yumaloq, urgʻu rangida, oq yozuv |
| Ikkilamchi tugma (⏹) | toʻla yumaloq, faqat kontur |
| Boʻsh holat matni | 20 px, 600 qalinlik, toʻq |

**Maʼnosi:** mazmun fon ustida emas, **oʻz varagʻida** turadi. Oʻqituvchi
qaysi fonni tanlamasin, vidjet ichi bir xil sharoitda oʻqiladi.

#### R456 — Rang mavzusi = rollar, rang emas

Har vidjetga mavzu beriladi va u **beshta rol**dan iborat:

| Rol | Vazifa | Standart mavzuda |
|---|---|---|
| Matn | raqam, yozuv, soat raqamlari | toʻq kulrang-koʻk (sof qora emas) |
| Fon | varaq | oq |
| Urgʻu 1 | bosh grafika: taymer halqasi, soat gardishi, ▶ tugma | indigo |
| Urgʻu 2 | ikkilamchi: kontur tugma, soat millari | matn bilan bir xil |
| Xavf | tugash, ogohlantirish | qizil |

Har rolning **hosilaviy shkalasi** bor: 10% va 20% shaffof (yumshoq fon,
ajratgich chiziq), yorqinligi −5, −10, −25 (hover, bosilgan, toʻq
variant). Vidjet kodi faqat rol nomini oʻqiydi — mavzu almashsa vidjet
koʻdiga tegilmaydi. Masalan jadval qatorlari orasidagi chiziq — «urgʻu 1,
10% shaffof».

**Bizda:** `--card-bg` / `--card-fg` / `--card-accent` — uchta rol bor,
lekin «urgʻu 2», «yumshoq urgʻu» va hosilalar yoʻq; urgʻuni faqat taymer
ishlatadi (R466).

#### R457 — 30 ta tayyor mavzu, standarti oq

Mavzular toʻrt oilada:

| Oila | Soni | Tavsif |
|---|---|---|
| Oq | 5 | oq varaq, toʻq matn; urgʻu besh xil (indigo — **standart**, yashil, sariq, binafsha, koʻk) |
| Shaffof | 3 | fonsiz — yozuv toʻgʻridan-toʻgʻri fon ustida (toʻq yoki oq matn) |
| Pastel | 14 | och tusli varaq, toʻq yoki oʻsha tusning toʻq matni |
| Toʻq | 8 | toʻyingan toʻq varaq, och matn |

- Mavzu **har vidjetda alohida** tanlanadi; koʻrilgan sozlamada «hamma
  vidjetga qoʻllash» yoʻq edi.
- Oʻz mavzusini yaratish — pullik tarifda.
- Mavzu tanlovi — rasmli mini-karta: varaq rangi ustida matn chizigʻi,
  urgʻu chizigʻi va nuqta. Shaffof mavzu katak naqsh bilan koʻrsatiladi.

**Maʼnosi:** rang — **tanlov**, asos emas. Asos — oq varaq; 30 dan 25
mavzu rangli boʻlsa ham, yangi vidjet doim oq chiqadi.

#### R458 — ⭐ Chegarasiz oq karta och fonda yoʻqoladi (ularning kamchiligi)

Sinab koʻrildi:

- **Oq fonda** matn vidjeti faqat placeholder yozuviga aylandi, karta
  koʻrinmaydi. Taymer, svetofor va soat bir-biriga yopishib, bitta shakl
  boʻlib qoldi.
- **Och kulrang fonda** kartalar xira ajraldi, **ustma-ust tushgan
  kartalar** esa chegarasi yoʻqligi sababli bitta dogʻga qoʻshilib ketdi.

Bizda bu xavf kattaroq. 21 fonimizning har biridagi **eng och** nuqta
bilan oq karta orasidagi yorqinlik nisbati:

| Fonlar | Soni | Oq karta ↔ fon | Proyektorda |
|---|---|---|---|
| Oq taxta, katak, nuqta, daftar, husnixat, nota, yumshoq ×3, bahor, Navroʻz, bahor bayrami, Mustaqillik | 13 | **1,01–1,11** — koʻrinmaydi | 1,01–1,08 |
| Oʻqituvchilar kuni (oltin) | 1 | 2,0 | 1,7 |
| Kuz, Yangi yil | 2 | 5,8–6,2 | 3,6–3,7 |
| Yashil va qora doska, qish, shom, shakllar | 5 | 10,8–19,6 | 5,2–9,3 |

Yaʼni ularning naqshi 21 fonimizning **13 tasida** ishlamaydi —
jumladan, eng koʻp ishlatiladigan «Oq taxta»da.

**Olinadi — lekin tuzatilgan holda:** varaq **chiziq + soya** bilan.
Chiziq och fonda va ustma-ust kartalar orasida chegara chizadi, soya esa
uzoqdan (5 m, proyektor) koʻrinadi — 1 px chiziq u masofada yoʻqoladi.
Bu `BarGroup` dagi qaror bilan bir xil (doska-dizayn-tizimi.md §1.5:
ixtiyoriy fonda «border YOKI shadow» emas, ikkalasi).

#### R459 — Toʻq va fotosurat fonda oq karta eng kuchli

- **Toʻq bir tekis fonda** oq vidjetlar eng aniq ajraldi. Bizda: yashil
  doska 11,8:1, qora doska 17:1.
- **Fotosurat fonda** ham vidjet ichi toʻliq oʻqiladi — fon matnga
  tegmaydi. Bu yarim shaffof «muzli» kartadan (R448) tubdan farq qiladi:
  u yerda rasm matn ostidan koʻrinib, uni yuvardi.

Toifa ham shuni aytadi: rasm ustida matnni oʻqitishning eng ishonchli
usuli — yaxlit quti (yarim shaffof parda va gradient esa rasmga qarab
ishlaydi yoki ishlamaydi).

#### R460 — Urgʻu faqat kichik maydonda

| Vidjet | Urgʻu qayerda | Qolgani |
|---|---|---|
| Taymer | halqa (diametrning ~6%), ▶ tugma | raqamlar toʻq, varaq oq |
| Soat | gardish (8 px) | raqamlar va millar toʻq |
| Jadval | qatorlar orasidagi chiziq (10%), belgilash katagi | ism va yozuvlar toʻq |
| Soʻrovnoma | variant doiralari | sarlavha toʻq |

Vidjet maydonining **90% dan koʻprogʻi oq + toʻq matn**. Rang
identifikatsiya qiladi (qaysi vidjet), lekin oʻqishga xalaqit bermaydi.

**Bizda:** Sokin uslubida tus **butun karta foni** — oq matn toʻyingan
rang ustida (R466).

#### R461 — Vidjet ichidagi tipografika

Bitta shrift (yumaloq geometrik), hamma vidjetda. Mantiqiy oʻlchamda
(R463 — masshtabdan oldin):

| Element | Oʻlcham / qalinlik |
|---|---|
| Taymer raqami | 120 px / **500** |
| Soat raqamlari (analog) | 32 / 600 |
| Boʻsh holat va sarlavha | 20 / 600 |
| Tanlov yorligʻi | 18 / 600, ochroq kulrang |
| Matn vidjeti | 28 / 400 |
| Tugma | 14 / 600 |

Matn rangi — toʻq kulrang-koʻk, sof qora emas.

**Bizda:** raqam `--doska-display-weight` (700). 500 qalinlikdagi raqam
yengil va chiroyli, lekin proyektorda ingichka chiziq yuviladi (R324) —
**biz 600–700 da qolamiz**.

#### R462 — Boshqaruv va mazmun alohida

Ekran sozlamasidagi «Toʻq vidjet paneli» faqat **boshqaruvni**
oʻzgartiradi: panel va ekran tugmalari toʻq (deyarli qora, 70% shaffof,
radius 10), panel ikonalari toʻq fon uchun alohida toʻplamdan. Vidjetlar
esa **oq qoladi**.

**Bizda ham shunday ajratish bor** (`.doska-ctl` va `.doska-card` —
alohida tokenlar), lekin uslub ikkalasini birga oʻzgartiradi. Varaq
taklifida (§4.4) uslub vidjet **yuzasini** emas, faqat uning
**ishlovini** (radius, chiziq, soya, shrift) va boshqaruvni oʻzgartiradi.

#### R463 — Mantiqiy oʻlcham va masshtab (R397 tasdigʻi)

Vidjet mantiqiy oʻlchamda yaratiladi va `transform: scale(k)` bilan
ekranga sigʻdiriladi:

| Vidjet | Mantiqiy oʻlcham |
|---|---|
| Taymer | 620 × 230 |
| Soat | 300 × 380 |
| Svetofor | 180 × 343 |
| Matn | 480 × 300 |
| Ish belgisi | 320 × 400 |

1440 px kenglikda k = 0,75; 1264 px da 0,79. Shuning uchun ichki
oʻlchamlar piksel (raqam 120 px) — masshtab hammasini birga
kichraytiradi. Bizda ichki oʻlcham `cqw` — natija bir xil, R397 qarori
oʻzgarmaydi.

#### R464 — Sozlama oynasi

Oʻngdan butun balandlikdagi oq varaq (448 px, kuchli soya). Mavzu
tanlovi — R457 dagi rasmli mini-kartalar, belgilangani 2 px urgʻu ramka
va ✓.

**Bizda:** sozlama vidjet yonidagi karta (UX Q2) — **oʻzgarmaydi**:
e-doskada oʻqituvchi vidjet yonida turadi, oʻng chetga borish shart
emas. Olinadigani — **rasmli namuna**: tus tanlovida oddiy doira emas,
vidjetning kichik nusxasi (R435 bilan bir xil naqsh).

#### R465 — Toifa: konteyner foni oʻqilishni fondan mustaqil qiladi

- **Telefon va kompyuter vidjetlari** (operatsion tizim qoʻllanmasi):
  vidjet mazmuni oʻz konteyner fonida turadi, devor qogʻozi qanday
  boʻlmasin. Fon olib tashlanadigan rejimda (uzoqdan koʻriladigan ekran)
  qoʻllanma mazmunni kattalashtirishni va chetga surishni tavsiya qiladi —
  yaʼni fonsiz holat alohida loyihalanadi, «shunchaki shaffof» emas.
- **Ochiq dizayn tizimlaridagi kartalar** — uch xil ajratish: soya
  (koʻtarilgan), toʻldirish (fondan boshqa tus), kontur (chiziq). Soyali
  karta fondan konturlidan kamroq, toʻldirilgandan koʻproq ajraladi.
- **Rasm ustida matn:** yarim shaffof parda 30–70% (rasmga bogʻliq),
  gradient, yoki yaxlit quti. Faqat yaxlit quti har qanday rasmda
  kafolatli.

**Xulosa:** «oq varaq» — tasodifiy uslub emas, toifaning umumiy yechimi.
Ochiq fonda ajratishni esa **soya** va **chiziq** beradi — referens
ikkalasini ham olib tashlagan va R458 shuning natijasi.

#### R466 — Hozirgi Doska bilan solishtirish (audit)

| | Hozir (Sokin — standart, 95% oʻqituvchi koʻradi) | Varaq |
|---|---|---|
| Yuzasi | vidjet turiga qarab toʻyingan tus | hamma vidjetda oq |
| Matn | oq, rang ustida | toʻq, oq ustida |
| Eng tor kontrast | taymer: 4,63:1, proyektorda **3,23:1** | **15,3:1**, proyektorda **6,8:1** |
| Fon bilan munosabat | sariq taymer iliq fonda, koʻk soat osmon fonida qoʻshiladi | fon qanday boʻlmasin, varaq bir xil |
| Ekrandagi rang soni | har vidjet — bitta katta rangli blok (5–6 rang) | rang faqat urgʻuda; ekran tinch |
| Holat signali (taymer tugadi) | qizil karta — boshqa rangli kartalar orasida | qizil varaq — oq varaqlar orasida **yagona** rang |

Muhim kuzatishlar:

1. **«Doska» uslubi allaqachon shu naqsh** — krem qogʻoz, siyoh matn,
   tus faqat magnitda. Lekin u standart emas, uni deyarli hech kim
   ochmaydi.
2. **Koʻchish asosan token darajasida.** Vidjetlar ichidagi ranglar
   `currentColor` ga nisbatan yozilgan (`bg-current/15`, `opacity-75`) —
   matn rangi siyohga oʻtsa, ular oʻzi moslashadi.
3. **Urgʻuni faqat taymer ishlatadi** (`--card-accent` — disk). Boshqa
   vidjetlarda urgʻu joyi hali belgilanmagan — varaqda ular rangsiz
   qoladi. Har vidjetga urgʻu joyi kerak (§4.4 xaritasi).
4. **Toʻq karta uchun yozilgan istisnolar:** «Taqdimot» (`bg-white/10`,
   `border-white/30`), «Svetofor» (oʻchiq chiroq toʻq fonda xira — oq
   varaqda korpus kerak), «Soʻrovnoma» (ustun brend rangida — maʼlumot,
   harakat emas), «QR» (oʻz oq qutisi bor — `.doska-card` ga oʻtadi).

#### R467 — Mualliflik: nima olinadi, nima olinmaydi

| Olinadi (naqsh) | Olinmaydi (ularning ijodi) |
|---|---|
| Mazmun fon ustida emas, oʻz varagʻida (R455) | Ularning 30 mavzusining ranglari, standart indigo |
| Rang — rol (matn, fon, urgʻu, xavf), fon emas (R456) | Shrift, radius 8 aynan, soyasiz/chegarasiz koʻrinish |
| Urgʻu kichik maydonda (R460) | Ikonalar, ish belgilari rasmlari, mavzu kartasi chizmasi |
| Boshqaruv va mazmun alohida (R462) | Interfeys matnlari |

**«1:1 emas» tekshiruvi (R453 dagi besh band):**

1. **Joylashuv** — vidjet ichini oʻzimiz tuzganmiz; oʻzgarmaydi.
2. **Rang** — tus sinf palitramizdan (`class-colors.ts`, 17 rang,
   yorqinligi kalibrlangan), siyoh va varaq — bizning tokenlar.
3. **Shrift** — uslub shriftlari (Onest / Nunito / Rubik).
4. **Material** — varaq + chiziq + ikki qatlamli soya (ularda ikkalasi
   yoʻq), radius uslubga koʻra 16 / 24 / 10.
5. **Matn** — oʻzbekcha, oʻzimiz yozamiz.

### 4.3. Taklif — «Varaq»: Doska vidjetlarining yagona yuzasi

Maket (hozirgi Sokin · chiziq-soyasiz oq · Varaq; toʻrt fon; proyektor
simulyatsiyasi; «taymer tugadi» holati):
https://claude.ai/artifact/Uy7zYZZgx8VAMk7EVDScXh

#### Yetti qoida

1. **Yuzasi doim varaq.** Har mazmunli vidjet oq varaqda turadi; ekran
   foni unga taʼsir qilmaydi. Boʻr rejimi faqat idishsiz narsaga (qalam,
   shakl, matn, sana).
2. **Matn doim siyoh** (toʻq), varaq ustida. Rangli matn faqat yirik
   sarlavha yoki yorliqda va ≥ 4,5:1 boʻlsa.
3. **Vidjet tusi = urgʻu** — vidjetning **bosh grafikasi** (disk,
   gardish, ustun, sarlavha tasmasi). Maydonning ~10–25% i.
4. **Butun varaq faqat HOLAT uchun rang oladi** — taymer tugadi, shovqin
   oshdi. Identifikatsiya uchun hech qachon. Oq varaqlar orasida qizil
   varaq — ekrandagi yagona katta rang, signal shuning uchun kuchli.
5. **Chegara + soya, ikkalasi.** Och fonda chiziq, uzoqdan va toʻq fonda
   soya ushlaydi (R458).
6. **Ichki qatlamlar varaqdan:** chuqur maydon (roʻyxat qatori, katak) —
   siyoh 5%, ajratgich — siyoh 10%, izoh — `paper-muted`. Ichki radius =
   tashqi radius − ichki chekinish.
7. **Jismoniy narsa jismoniy rangda** — yopishqoq qogʻoz, svetofor
   chiroqlari va korpusi, gʻildirak boʻlaklari, qalam ranglari.

#### Tokenlar

| Token | Vazifa | Sokin | Oʻyinchoq | Doska |
|---|---|---|---|---|
| `--doska-paper` | varaq | `oklch(0.99 0 0)` | `oklch(0.99 0 0)` | krem qogʻoz (hozirgi) |
| `--doska-paper-ink` | matn | siyoh `0.26` | siyoh `0.24` | siyoh `0.25` |
| `--doska-paper-muted` | izoh | `oklch(0.45 0.02 260)` — 7,2:1, proyektorda 3,9:1 | shu | shu |
| `--doska-paper-line(-width)` | chegara | 1 px, siyoh 14% | 3 px siyoh | 1 px, siyoh 14% |
| `--doska-paper-shadow` | soya | ikki qatlam: yaqin (chegara) + yumshoq (masofa) | `0 6px 0` siyoh | yumshoq, chuqurroq |
| `--doska-paper-sunken` | ichki maydon | siyoh 5% | siyoh 6% | siyoh 6% |
| `--doska-{tus}` | urgʻu | **hozirgi Sokin karta tuslari** | yorqin pastel + siyoh kontur | magnit tusi (hozirgi) |
| `--doska-{tus}-soft` | yumshoq urgʻu (yorliq foni, trek) | tus 12% | tus 20% | tus 12% |
| `--doska-done-bg/-fg` | holat — butun varaq | oʻzgarmaydi | oʻzgarmaydi | oʻzgarmaydi |
| `--doska-note-bg/-fg` | jismoniy qogʻoz | oʻzgarmaydi | oʻzgarmaydi | oʻzgarmaydi |

⭐ Sokinning hozirgi karta tuslari **oq matn ostida ≥ 4,6:1** qilib
kalibrlangan. Demak ular oq varaq **ustida** ham ≥ 4,6:1: koʻk 5,5:1,
sariq 4,7:1, firuza 5,1:1 (proyektorda 3,3–3,5:1). Yangi rang ixtiro
qilinmaydi — ular urgʻuga koʻchadi.

Varaq ustidagi siyoh: 15,3:1, proyektorda 6,8:1. Yumshoq urgʻu (12%)
ustidagi siyoh: 12,8:1, proyektorda 5,9:1.

#### Vidjetlar xaritasi

| Vidjet | Hozir (Sokin) | Varaqda | Ish |
|---|---|---|---|
| Taymer | sariq karta, oq raqam, oq disk | oq varaq, siyoh raqam, **sariq disk**; tugadi — qizil varaq (holat); oxirgi soniyalar — qizil ichki chiziq | token |
| Soat | koʻk karta, oq raqam | siyoh raqam; dars holati yorligʻi `blue-soft` fonda; ogohlantirish qizil | kichik (`color-mix` → token) |
| Svetofor | toʻq karta, chiroqlar | varaq ichida **toʻq korpus** (jismoniy), chiroqlar korpus ustida | kichik |
| Bugun / Bosqichlar | toʻq karta | siyoh; hozirgi qator — brend (faol holat, oʻzgarmaydi); oʻtgan qator — `paper-muted` | token + kichik |
| Karta | tusli ramka + oq yozuv varagʻi | varaq + **tusli sarlavha tasmasi** (savol 2) | oʻrta |
| Soʻrovnoma | ustun brend rangida | ustun **vidjet tusida** (maʼlumot, harakat emas) | kichik |
| Guruhlar, Hisob, Gʻildirak, Zar, Shovqin, Kun sanogʻi, boʻsh holat | toʻq yoki tusli karta | `currentColor` orqali oʻzi moslashadi; urgʻu joyi har birida belgilanadi | token + tekshiruv |
| Taqdimot | `bg-white/10`, `border-white/30` | `bg-current/…` | kichik |
| QR | oʻz `bg-white` qutisi | `.doska-card` | kichik |
| Kamera, Video, Havola, Sayt | toʻq karta | mazmun oʻzi (qora / sayt), ramka varaq | token |
| Yopishqoq qogʻoz | qogʻoz | **oʻzgarmaydi** (jismoniy) | — |
| Matn, Sana, Shakl, Stiker, qalam | idishsiz | **oʻzgarmaydi** (savol 3) | — |

#### Uslublar (Q1) nima boʻladi

Uslub endi vidjet **yuzasini** tanlamaydi — u bitta (varaq). Uslub
**ishlov**ni tanlaydi:

| | Sokin (standart) | Oʻyinchoq | Doska |
|---|---|---|---|
| Varaq | oq | oq | krem qogʻoz |
| Chegara | 1 px yengil | 3 px siyoh | 1 px yengil |
| Soya | yumshoq, ikki qatlam | qattiq ofset | yumshoq, chuqur |
| Radius | 16 | 24 | 10 |
| Urgʻu | toʻyingan tus | yorqin pastel + siyoh kontur | magnit + sarlavha chizigʻi |
| Shrift | Onest | Nunito | Rubik |
| Boshqaruv | grafit | oq + siyoh kontur | toʻq relsa |

«Doska» uslubi deyarli oʻzgarmaydi — u allaqachon varaq. Sokin va
Oʻyinchoq rangli fonini yoʻqotadi. Uslub arxitekturasi (faqat token
qatlami, doska-dizayn-tizimi.md §1) oʻzgarmaydi.

#### Proyektor sinoviga qoʻshiladi

- siyoh / varaq, izoh / varaq — har uslubda (≥ 4,5:1 va ≥ 3:1);
- urgʻu / varaq — ≥ 3:1 ikkala sharoitda (grafika chegarasi). Oʻyinchoqda
  urgʻu pastel boʻlgani uchun uning siyoh konturi tekshiriladi;
- siyoh / yumshoq urgʻu.

Varaq chegarasi kontrast bilan tekshirilmaydi — chiziq va soya ikkalasi
ham majburiy, koʻz bilan «Oq taxta» fonida tekshiriladi.

### 4.4. Tavsiya etilgan tartib

| # | Ish | Topilma | Hajm |
|---|---|---|---|
| 1 | Tokenlar: `--doska-paper-*`, tus → urgʻu + yumshoq; `.doska-card` varaqqa; Sokin va Oʻyinchoq qiymatlari; proyektor sinovi | R455, R456, R458, R466 | oʻrta — asosan `doska.css` va skript |
| 2 | Vidjet istisnolari: svetofor korpusi, soat yorligʻi, soʻrovnoma ustuni, taqdimot, QR, oʻtgan dars → `paper-muted`; har vidjetda urgʻu joyi | R460, R466 | kichik, ~8 fayl |
| 3 | Karta sarlavhasi, «Koʻrinish» namunalari (`DoskaAppearance`), sozlamadagi tus namunasi — vidjet nusxasi | R464, savol 2 | kichik |
| 4 | `doska-dizayn-tizimi.md` §1 jadvali va §3 qayta yoziladi; changelog bitta yozuv | — | kichik |

Ataylab **qilinmaydi**: vidjetga alohida rang mavzusi (R421 rad qarori
kuchda — varaq + tus yetarli; ularda ham 95% standartda qoladi),
soyasiz/chegarasiz varaq (R458), 500 qalinlikdagi raqam (R461).

### 4.5. Qaror (foydalanuvchi, 2026-10-02)

«UI toʻliq referens ilovasi asosida boʻlsin. Xuddi shuni olamiz.»
Brauzerda ishlashga ruxsat berildi. Ilova qayta ochilib, endi
**boshqaruv** ham oʻlchandi:

| Qism | Referensda |
|---|---|
| Idish | oq, 1 px och kulrang chegara, radius 10, soyasiz |
| Kichik tugma | 32 × 32, ikona 18 px, kulrang; hover — och kulrang |
| Burchaklar | chap tepa — bosh sahifa; oʻng tepa — toʻliq ekran, menyu (alohida idishlar); oʻng past — ekranlar (‹ 1 +) |
| Vidjet paneli | uch ustun: chap — qalam/tanlash (faol — och indigo plitka); oʻrta — 64 px ustunlar: 3 px nuqta qatori (nusxalar soni), 52 px tugma (ikona 40), 11 px/600 nom; oʻng — ⋮ (Bekor qilish · Qaytadan bajarish · Panelni tahrirlash) va yigʻish |
| Kontekst panel | vidjet ustida markazda: Oʻchirish · Sozlash · ⋮, faqat ikona |
| Tanlov | 2 px brend chiziq vidjet chetida, burchaklarda 16 px oq doira |
| Sozlama | oʻngdan butun balandlik, 448 px; kulrang sarlavha qismi (ikona · nom · ×), boʻlim sarlavhasi 16/600 |
| Tooltip | qora «pill», oq 14 px matn |
| Shrift | yumaloq geometrik, **kirill harflari yoʻq** |

Savollarga javob shu qarordan:

1. **Standart uslub = referens koʻrinishi.** Oʻyinchoq va Doska uslublari
   tanlov sifatida qoldi (faqat token qatlami, joylashuv hammaga umumiy).
2. **«Karta»** — tusli sarlavha tasmasi, oq yozuv (referens ekranidagi
   rangli ramkali kartalar gʻoyasi, bitta vidjetda).
3. **«Matn»** — yangi matn oq varaqda (referensdagi standart mavzu);
   sozlamada «Oq varaqda» tumbleri. **«Sana»** — idishsiz qoldi (kun
   nomi sarlavha).

**Ataylab farq qiladi (asoslanib):**

- **Brend rangi** — ularning indigo emas, Ustozona brendi (firuza):
  brend rangi koʻchirilsa «1:1» boʻladi.
- **Shrift** — ularniki kirill harfisiz; bizda rus va oʻzbek-kirill
  interfeysi bor → oʻxshash yumaloq Nunito.
- **Ikonalar** — ularning rasmlari ularning ijodi (R453); bizda Solar
  ikonalari, ierarxik ranglash.
- **Och fonda varaq chegarasi** — R458: chegarasiz oq karta 21 fonimizdan
  13 tasida koʻrinmaydi. Toʻq fonda — ularniki kabi chegarasiz.
- **Tugma oʻlchami** — 32 emas, 36 px (loyiha standarti, DESIGN.md).
- **Ekranlar** — ‹ 2/3 › + (jami son va «keyingi» qoladi).
- **Taymer halqasi** — sal qalinroq (proyektor, R324).

### 4.6. Qurilgani (2026-10-02)

Branch: `maxdum/doska-referens-ui`.

| Joy | Nima |
|---|---|
| `styles/doska.css` | Sokin tokenlari: oq boshqaruv (`--doska-ctl-*`, `--doska-ctl-active`), oq varaq (radius 8, chegara/soya yoʻq), urgʻu — brend, `--doska-{tus}-mark` («Karta» tasmasi), `--doska-card-line-light*` + `[data-bg-tone="light"]` (R458), tanlov 2 px / tutqich 2 px (`--doska-sel-width`, `--doska-handle-width`), shrift Nunito; `.doska-sheet[data-drawer]`; `.doska-card-title::before` tasma; svetofor korpusi `--doska-light-housing`; varaqdagi rangli matn uchun qalam ranglari |
| `DoskaShell.tsx` | burchaklar: ⌂ · ⛶ · ⋮; pastda: xabar · panel · ekranlar; doimiy «↶ ↷» guruhi olib tashlandi |
| `WidgetBar.tsx` | uch ustun; panel menyusi (bekor qilish, qaytadan bajarish, panelni tahrirlash) |
| `BarButton.tsx` | 64 px ustun: nuqtalar (nusxalar soni) · 52 px plitka · 11 px nom |
| `BarGroup.tsx` | ikonali tugma 36 px |
| `WidgetToolbar.tsx` | Oʻchirish · Sozlash · ⋮ (Nusxa, Qulflash, Barcha ekranlarda, Markazga) |
| `WidgetSettingsCard.tsx` | oʻngdan butun balandlikdagi oyna; `Z_SETTINGS` (`layers.ts`) |
| `DoskaMenu.tsx` | oʻng tepadan pastga ochiladi; `MenuItem` eksport, yorliq massivi |
| `ToolCatalog.tsx`, `ShapePicker.tsx` | nusxalar soni; katalog panel menyusidan ham ochiladi |
| `prefs.ts` | `DEFAULT_TOOLS` — 8 ta standart vosita (ilgari hammasi — 24) |
| `placement.ts` | `TOP_RESERVED` — vidjet burchak tugmalari ostiga tushmaydi |
| `TimerWidget.tsx` | halqa; keng taymerda halqa · raqam · tugma bir qatorda; asosiy tugma brend |
| `ClockWidget.tsx` | soniyali soatda raqam kichrayadi (bir qatorda) |
| `TrafficLightWidget.tsx` | toʻq korpus |
| `CardWidget.tsx` | sarlavha butun kenglikda (tasma), tus namunasi — kartaning kichik nusxasi |
| `TextWidget.tsx`, `registry.ts` | `paper` — yangi matn varaqda, sozlamada tumbler |
| `WidgetEmpty.tsx` | ikona urgʻu rangida, matn qalin |
| `scripts/doska-projector-check.mjs` | karta sarlavhasi va urgʻu (grafika: ≥ 3:1 / ≥ 2:1) — 65 juftlik yashil |
| `messages/*.json`, `changelog-data.ts` | 7 tilda yangi matnlar; changelog `doska-yangi-korinish` |

Tekshiruv: `tsc` va eslint toza, proyektor sinovi yashil; brauzerda
1536 × 864 da yashil doska va oq taxtada koʻrildi (panel, burchaklar,
kontekst panel, sozlama oynasi, ⋮ menyular, qalam paneli, karta tasmasi,
matn varagʻi). `npm run build` — push oldidan.

⚠️ Turbopack keshi eski `globals.css` ni berib turgan edi — `.next`
tozalangach tuzaldi (loyihadagi maʼlum tuzoq).

---

## 5. Keyingi referenslar

Har yangi referens shu yerga «Referens N» boʻlimi boʻlib qoʻshiladi.
Tuzilishi oldingilardek: nima koʻrildi → bizda bor → topilmalar →
tartib. Keyingi raqam — **R468**. Xulosa jadvali (§0) ham har safar
yangilanadi.
