# Doska — referens koʻriklari (boshqa doskalardan nima olamiz)

> **Holat (2026-10-01):** 2 ta referens koʻrildi, kod YOʻQ. Foydalanuvchi
> keyingi referenslarni ham beradi — har biri shu hujjatga alohida
> boʻlim boʻlib qoʻshiladi, raqamlar davom etadi.
>
> Referens topilmalari **R380–R442** (oldingilari
> [doska-tezlik-tadqiqot.md](./doska-tezlik-tadqiqot.md) da, R372–R379).
> Mahsulot nomlari yozilmaydi (AGENTS.md) — referens oʻz xususiyati
> bilan tasvirlanadi.
>
> **Usul.**
> - 1-referens: foydalanuvchi bergan bir lahzalik HTML (DOM) nusxasi.
>   Manba kodi oʻqilmagan.
> - 2-referens: brauzerda toʻliq koʻrildi (sayt, yordam markazi, ilova
>   mehmon rejimida, ilova kodidagi interfeys matnlari) — §2.1.
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
- sekundomer — A (taymerning rejimi sifatida, R141 dagi «bitta
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
- R409 bugungi dars;
- R411 guruh tuzuvchi;
- R407 voqea sanogʻi;
- R408 budilnik ← qoʻngʻiroq;
- R412 doskada ovoz berish;
- R384/R418 rasm va nusxalab joylash (saqlash joyi hal boʻlgach).

**C — server bilan:**
- ekranlarni saqlash (Pro);
- R423 shablonlar (statik boshlanishi A ga olinishi mumkin);
- R424 ulashish;
- R425 boshqaruv paneli;
- «Yaqinda oʻchirilganlar».

**D — keyinroq:**
- R413 shovqin;
- R414 hisob taxtasi;
- veb-kamera, video, embed, havola;
- R420 bayram fonlari;
- R417 matn formatlash.

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

## 3. Keyingi referenslar

Har yangi referens shu yerga «Referens N» boʻlimi boʻlib qoʻshiladi.
Tuzilishi oldingilardek: nima koʻrildi → bizda bor → topilmalar →
tartib. Keyingi raqam — **R443**. Xulosa jadvali (§0) ham har safar
yangilanadi.
