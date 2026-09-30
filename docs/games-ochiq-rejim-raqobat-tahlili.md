# Games — ochiq rejim: jahon amaliyoti va tavsiya

> **Holat (2026-09-30): TAKLIF — qaror emas.** Qarorlar §8 da, foydalanuvchi
> tasdiqlaguncha hech narsa qurilmaydi.
>
> **Nomlar haqida:** bu hujjat ataylab raqobat/amaliyot tahliliga
> bagʻishlangan, shuning uchun AGENTS.md dagi istisnoga koʻra mahsulot
> nomlari shu yerda oʻrinli (§2). Boshqa hujjat, kod izohi yoki commit'ga
> nom koʻchirilmaydi — naqshning oʻzi yoziladi.
>
> **Dalil sifati:** har band oxirida manba turi: **[rasmiy]** — mahsulotning
> yoki davlat organining oʻz sahifasi; **[ilmiy]** — meta-tahlil/maqola;
> **[ikkilamchi]** — uchinchi tomon sharhi (tekshirib qoʻyish kerak);
> **[oʻlchov]** — bugun men oʻzim jonli serverdan oʻlchaganim.

## 0. Xulosa

1. **`/games` sahifasi allaqachon ochiq** — kirish talab qilmaydi. Lekin
   mehmon u yerda *faqat oʻynay oladi*, *boshqara olmaydi*: jonli xona
   ochish, oʻz testi, sinf roʻyxati — hammasi LessonLab serverida
   autentifikatsiya talab qiladi (§1). Yaʼni «ochiq» boʻlishi uchun hal
   qilinadigan savol **«mehmon nimani qila oladi»**, sahifa emas.
2. **Jahon amaliyoti bir ovozdan:** *oʻynash — ochiq; yaratish/boshqarish
   — hisob bilan; saqlash va hisobot — hisobning asosiy sababi.* Hech bir
   yetakchi mahsulot oʻquvchini roʻyxatdan oʻtishga majburlamaydi (§2).
3. **Eng muhim mahalliy topilma:** Vazirlar Mahkamasining 139-son qarori
   darsda oʻquvchi telefonidan **har qanday maqsadda** foydalanishni
   taqiqlaydi (§4.1). Telefonda PIN bilan qoʻshiladigan jonli oʻyin
   (asosiy jahon formati) bizda sinf ichida rasmiy ravishda mumkin emas.
   Shuning uchun Ustozona oʻyinlarining **birinchi formati — sinf ekrani,
   oʻqituvchi boshqaradi**; telefon — uy vazifasi va dars tashqarisi uchun.
4. **Mehmon uchun tayyor kontent juda kam:** ochiq bazada 9 fan, 30 test,
   **880 savol**, sinf va mavzu boʻyicha boʻlinmagan (§4.4). Ochiq
   rejimning birinchi daqiqasi shu bazaga tayanadi — bu roʻyxatsiz
   kirishdan koʻra katta toʻsiq.
5. **Tavsiya:** toʻrt daraja (§5) — *Oʻynash* (ochiq) → *Sinfda sinash*
   (mehmon mezbon, cheklovli) → *Oʻz savollarim* (yengil muallif) →
   *Saqlash va jurnal* (hisob). Bu Doska uchun qabul qilingan bepul/pullik
   qoidaning oʻzi (R134, `ost-loyihalar-arxitektura.md`).

---

## 1. Hozir nima ochiq, nima yopiq

Manba: Ustozona kodi + LessonLab oʻyinlarining ochiq HTML/JS fayllari +
jonli `lessonlab.uz` (2026-09-30). **[oʻlchov]** Men jonli serverda xona
yaratmadim; `live/create` ga faqat boʻsh soʻrov yuborib `code_required`
javobini oldim. Xona ochishning autentifikatsiya talab qilishi — sahifa
kodidagi izoh va xato matnidan (`live-host.html`).

| Imkoniyat | Mehmon | Izoh |
|---|---|---|
| `/games` katalogi, oʻyin sahifalari | ✅ ochiq | `src/app/games/[[...game]]/page.tsx` |
| Arqon, Poyga — ommaviy test bazasi bilan yakka/duel | ✅ | `/api/game/catalog` tokensiz |
| Xotira, Qaysi katta, Soʻz topish, Krossvord | ✅ | oʻz generatori — testga bogʻliq emas |
| Jonli oʻyinga PIN bilan **qoʻshilish** | ✅ | `live-play.html` |
| Jonli oʻyin **xonasini ochish** (mezbon) | ❌ | «ustoz sifatida kiring» — `live-host.html` |
| Oʻz (shaxsiy) testlari | ❌ | faqat `?uid=` yoki sessiya bilan |
| Sinf roʻyxati, Kubok (turnir) | ❌ | `/api/game/classes` — auth |
| Test yaratish | ❌ | «Test botda yaratiladi» — Telegram bot |
| Natijani saqlash / jurnalga tushirish | ❌ | mehmon natijasi hech qayerga yozilmaydi |

Qoʻshimcha kuzatuvlar:

- **Mehmonga koʻrinadigan matn uni botga yuboradi.** Katalog pastidagi
  yozuv: «Test botda yaratiladi — oʻyin shu yerda oʻynaladi». `GamesFrame`
  sarlavhasida mehmon uchun faqat «Telegram bot» tugmasi bor, «Kirish /
  Roʻyxatdan oʻtish» yoʻq.
- **«Ommaviy» testlar roʻyxati moderatsiyasiz.** `/api/game/tests` istalgan
  foydalanuvchi yuklagan testni qaytaradi (oʻlchov paytida birinchi
  natijalar oʻzbekcha emas, fani `BOSHQA`). Mehmonni shu roʻyxatga
  chiqarish — sifatni nazoratsiz qoldirish. Tartibli boʻlimi — 9 fanli
  «baza-*» testlari.
- **Jonli xona holati serverning XOTIRASIDA** (`webapi/live.py`, sahifa
  izohlari). Mehmon xona ochsa, xotira va qayta ishga tushirishda
  yoʻqolish muammosi darhol oʻsadi (§6).
- **SEO: chuqur sahifalar qidiruvga yopiq.** `/games/<oʻyin>` ning
  `metadata` si bitta statik obyekt, `canonical` = `/games`; sitemap'da
  faqat `/games` bor (`src/app/sitemap.ts`). «Arqon tortish oʻyini»,
  «Krossvord onlayn» kabi qidiruvlardan kiradigan ochiq yoʻl hozir yoʻq.
- **Kod Ustozona repo'sida emas.** Oʻyinlar va ularning API'si LessonLab
  repo'sida; u yerdagi sahifalar qulflangan (`docs/lessonlab-birlashtirish.md`,
  LessonLab yaratuvchisi qarori). Ochiq rejimning asosiy qismi
  (mehmon mezbon, cheklovlar) — oʻsha repo'da va u bilan kelishib qilinadi.

---

## 2. Jahon amaliyoti

### 2.1 Mahsulotlar taqqoslanishi

| Mahsulot | Oʻquvchi/oʻynovchi | Yaratish | Mezbonlik | Saqlash/hisobot |
|---|---|---|---|---|
| Kahoot | hisobsiz: PIN + ism [rasmiy] | hisob | hisob; ixtiyoriy **mehmon mezbonlik** (yaratuvchi yoqadi, tarifga bogʻliq) [rasmiy] | mehmon mezbonda hisobot **yoʻq** [rasmiy] |
| Wordwall | hisobsiz [ikkilamchi] | hisob; bepulda **3 ta** faoliyat, 12 shablon [rasmiy] | havola orqali | kuzatuv pullik [rasmiy] |
| Baamboozle | hisobsiz, kodsiz [ikkilamchi] | hisob (email) [ikkilamchi] | — | bepulda oʻyinni **yashirib boʻlmaydi**; yashirish pullik [ikkilamchi] |
| Blooket | kod + ism [ikkilamchi] | hisob | hisob | hisob |
| Gimkit | kod + ism | hisob | bepulda jonli oʻyinda **5 oʻyinchi**gacha [ikkilamchi, blog sahifasi ochilmadi] | hisob |
| Wayground (ex-Quizizz) | kod + ism, hisobsiz [ikkilamchi] | hisob | hisob | hisob |
| ClassTools | hisobsiz, roʻyxat shart emas [ikkilamchi] | **hisobsiz**, har natija oʻz havolasi | — | havola = saqlash |
| LearningApps | hisobsiz | hisobsiz boshlanadi, **saqlashdan oldin** roʻyxat soʻraydi [ikkilamchi, ECML] | — | saqlash = hisob |
| ABCya, Toy Theater | hisobsiz, roʻyxatsiz [ikkilamchi] | — | — | yoʻq (progress yoʻq) |
| Duolingo (oʻyinlashtirilgan taʼlim) | birinchi darsni hisobsiz oʻtadi; roʻyxat **keyinroq** taklif qilinadi [ikkilamchi] | — | — | reyting jadvallari mehmonga yopiq |

### 2.2 Umumiy naqsh

**Oʻynash ochiq, yaratish va saqlash — hisob bilan.** Ikki istisno
foydali:

- *Yaratishni ham hisobsiz boshlatish* (ClassTools, LearningApps): qurish
  ochiq, **saqlash** nuqtasida hisob soʻraladi. Foydalanuvchi qiymatni
  koʻrib boʻlgan boʻladi.
- *Mezbonlikni hisobsiz ruxsat etish* (Kahoot «mehmon mezbonlik»): bor,
  lekin **bahosi aniq — hisobot yoʻq**, baʼzi savol turlari kirish talab
  qiladi [rasmiy; sahifa ochilmadi, qidiruv xulosasi]. Yaʼni qiymat ochiq,
  **yoʻqotmaslik** — hisobning sababi.

### 2.3 Roʻyxatni kechiktirish — dalil

- Kirish devori (login wall) yuqori oʻzaro taʼsir narxiga ega;
  foydalanuvchilar odatda undan oʻtmay ketadi, shuning uchun hisobni
  «eng oxirgi payt»ga qoldirish tavsiya qilinadi [ikkilamchi: Nielsen
  Norman Group videosi va sharhlar].
- Duolingo roʻyxatni birinchi mashqdan **keyinga** surgan; manbalardan biri
  (Taplytics) DAU da ~20% oʻsish haqida yozadi [ikkilamchi — raqamni
  mustaqil tasdiqlamadim; yoʻnalish tasdiqlangan, kattalik emas].
- Doskada bizning oʻz qarorimiz ham shu: «oʻqituvchi darsga kirdi,
  projektorni yoqdi — 3 soniyada taymer kerak» (R134). Mehmon ishlatadi,
  pul/hisob **ishni saqlab qolishda** tushadi (jadval —
  `ost-loyihalar-arxitektura.md`, «Doska» bandi).

### 2.4 Suiiste'mol — ochiq xonalarning narxi

Ochiq PIN bilan qoʻshilish hamma joyda bir xil muammo beradi: begona
ishtirokchilar va botlar, nomaqbul ismlar [ikkilamchi — Kahoot
moslamalari haqidagi sharhlar]. Javoblari ham bir xil: ism filtri,
**tasodifiy xushmuomala ism generatori**, xonani qulflash, qoʻshilishda
oddiy tekshiruv, xona roʻyxatini mezbon koʻrishi va chiqara olishi. Bular
«ochiq» qilishning **shartli qismi**, keyinga qoldiriladigan qoʻshimcha
emas (§6).

---

## 3. Oʻyinlar qanday boʻlishi kerak — dalillar

### 3.1 Nima ishlaydi (ilmiy)

| Topilma | Qiymat | Bizga ta'siri |
|---|---|---|
| Raqamli oʻyinlar oʻrganishga taʼsiri (Wouters va b., 2013, 77 tadqiqot) | oʻrganish d=0.29, esda saqlash d=0.36; **motivatsiya boʻyicha ustunlik isbotlanmagan** (mualliflar: oʻyinlar anʼanaviy usuldan koʻra koʻproq motivatsiya bermadi; d=0.26 koʻrsatilgan). Oʻyin **boshqa oʻqitish bilan toʻldirilganda**, **bir necha seansda** va **guruhda** koʻproq foyda [ilmiy] | Oʻyin darsning oʻrniga emas, **darsning ichida**; jamoaviy formatlar afzal |
| Geymifikatsiya meta-tahlili (Sailer & Homner, 2020) | bilish natijalariga g=0.49, motivatsiyaga 0.36, xulqqa 0.25; bilish natijasi metodik jihatdan puxta tadqiqotlarda ham barqaror, motivatsiya/xulq — kamroq [ilmiy] | Asosiy va'da — **oʻrganish**, «qiziqarli» ikkinchi |
| Amaliy test (Adesope va b., 2017, 118 maqola) | test bilan takrorlash qayta oʻqishdan **yaxshiroq**; koʻp variantli savol qisqa javobdan kuchliroq test effekti beradi [ilmiy] | Variantli savolga asoslangan Arqon/Poyga pedagogik jihatdan **asosli** — lekin qaytar aloqa bilan |
| Kahoot boʻyicha sharh (Wang & Tahir, 2020, 93 tadqiqot) | koʻpchiligida ijobiy; xavotirni oʻrgangan 14 tadqiqotning 10 tasida kamaygan. Kamchiliklar: **vaqt bosimi, yutqazish qoʻrquvi, xatodan keyin ortda qolish**, internetga bogʻliqlik, tez-tez takrorlanganda charchash [ilmiy] | Tezlik balli **standart boʻlmasin**; ortda qolmaydigan tuzilma |
| Ichki integratsiya (Habgood & Ainsworth, 2011) | oʻrganish mazmuni oʻyinning **asosiy harakatiga** singdirilganda bolalar koʻproq oʻrgandi va erkin tanlovda ~7 marta uzoq oʻynadi (58 va 16 bola — kichik tanlama) [ilmiy] | «Savol → toʻgʻri javob → mukofot» (qobiq) bilan «harakatning oʻzi koʻnikma» (Xotira, Krossvord) oʻrtasidagi farq |

### 3.2 Xulosa: oʻyin qanday boʻlishi kerak

1. **Sinf ekrani, oʻqituvchi boshqaradi — birinchi.** Bizning oʻz
   maʼlumotimiz (R54): bir oʻqituvchining bir yildagi ~165 sessiyasi sinfda
   oʻqituvchi boshqargan, oʻz tezligida — 3 marta. §4.1 shuni rasmiy
   jihatdan ham tasdiqlaydi.
2. **Kontent ≠ oʻyin.** Bir savollar toʻplami — koʻp qobiq: sanoat
   standarti (bir nechta shablonli va rejimli mahsulotlar). Bizning
   `GAME_SHELLS` (`accepts` / `supports` / `gradable`) modeli shunga mos.
3. **Yakka tezlik emas, jamoa va ortda qolmaslik.** Arqon/Poyga jamoaviy
   shaklda kuchli; tezlik ballini oʻchirish imkoni standart holat.
   Reyting jadvalida faqat tepa uch.
4. **Har javobdan keyin qaytar aloqa** (nega toʻgʻri/notoʻgʻri) — test
   effektining asosiy kuchi, faqat ball emas.
5. **Ichki integratsiyalangan oʻyinlarni kengaytirish.** Bugungi yettitadan
   4 tasi (Xotira, Qaysi katta, Soʻz topish, Krossvord) oʻz generatori
   bilan ishlaydi va shu yoʻnalishga yaqin; Arqon/Poyga/Jonli — qobiq.
   Muvozanat kerak: qobiq — tez tayyorlash va takrorlash uchun, ichki
   integratsiyalangan — asosiy koʻnikmalar (sanoq, imlo, lugʻat) uchun.
6. **Boshlanishi — sozlamasiz.** Mehmon 30 soniyada birinchi oʻyinni
   boshlashi kerak: test tanlash → «Boshlash». Hisob, sinf, sozlama yoʻq.
7. **Mashq va baho ochiq ajratiladi** — kodda allaqachon bor
   (`gradable: false`, «Mashq»); ochiq rejimda mehmon barcha oʻyin
   mashq ekanini koʻrsatishi kerak (jurnalga tushmaydi).

---

## 4. Oʻzbekiston konteksti

### 4.1 Telefon qoidasi — oʻyin formatini belgilaydi

**Vazirlar Mahkamasining 2012-yil 21-maydagi 139-son qarori** [rasmiy,
gov.uz «Maktabda mobil telefondan foydalanish tartibi»]: oʻquv
mashgʻulotlari vaqtida oʻquvchi telefondan foydalana olmaydi — hisoblagich,
yozuv daftari kabi taʼlimiy vazifalarda ham; istisno — tanaffusda shoshilinch
qoʻngʻiroq. Xalq taʼlimi vazirligining 2023-yil 31-avgustdagi 282-son
buyrugʻi nazoratni oʻqituvchi va sinf rahbariga yuklaydi; qoida
buzilsa telefon olinadi, direktor va ota-ona xabardor qilinadi
[ikkilamchi — qidiruv xulosasi; buyruq matnini oʻqimadim].

⚠️ Men gov.uz sahifasini qisqa xulosa orqali oʻqidim — qaror matnini
(ayniqsa «taʼlimiy maqsad»ga istisno yoʻqligini) huquqshunos bilan
tekshiring. Amalda bu qoida qanday bajarilishi — boshqa masala: jamoa
bilishi kerak.

Oqibatlari:

- Jonli PIN oʻyini (har bola oʻz telefonida) — dars ichida **rasmiy yoʻl
  emas**; uy vazifasi, toʻgarak, dars tashqarisi va telefoni ruxsat etilgan
  muhit (xususiy/xalqaro maktab, universitet, ustoz kurslari) uchun.
- Sinf ichida ishlaydigan formatlar: **bitta ekran** (proyektor/televizor):
  Arqon (ikki jamoa), Poyga duel, QR-karta (oʻqituvchining bitta telefoni
  kameradan skaner qiladi — bolalarda telefon yoʻq; allaqachon qurilgan,
  `baholash-shells.ts`: `capture: "qrcard"`), oʻqituvchi javobni belgilaydigan
  shakllar.
- Landing va `/games` matnida «hamma oʻz telefonida» obrazini asosiy qilib
  koʻrsatmaslik.

### 4.2 Qurilma va internet

- 2025-yil oxirida 33,1 mln internet foydalanuvchisi (89%), 33,9 mln
  mobil ulanish (91%) [ikkilamchi, DataReportal Digital 2026]. Qamrov
  yuqori; lekin **maktab ichidagi** qurilma va tarmoq boshqa masala
  (bu yerda maʼlumot topilmadi).
- Yengil sahifa, kam trafik, sahifani yangilash/uzilishdan keyin tiklanish —
  ochiq rejimda muhim (mehmon sabr qilmaydi).

### 4.3 Shaxsiy maʼlumot qonuni va server joylashuvi

- 2026-yilda «Shaxsga doir maʼlumotlar toʻgʻrisida»gi qonun yumshatildi:
  chet elda saqlash **uch shart bir vaqtda** bajarilganda ruxsat etiladi
  (axborot xavfsizligi, xalqaro standartlar, davlat organlari nazorati);
  biometrik, genetik va telekom foydalanuvchi maʼlumotlari esa
  Oʻzbekistonda qolishi shart [ikkilamchi]. ⚠️ Manbalar kuchga kirish
  sanasini turlicha yozadi (22-yanvar / 27-mart) — aniq sanani va
  shartlarning amaldagi talqinini huquqshunos aytsin.
- Oʻyinlar serveri **Stokgolmda** (AWS eu-north-1), Ustozona — AQSH
  (Vercel) [oʻlchov: DNS + IP geolokatsiya].
- Bolalar maʼlumoti boʻyicha maxsus qoida topilmadi; 16 yoshgacha ijtimoiy
  tarmoq cheklovi **taklif bosqichida** (2026-iyun), qonun emas [ikkilamchi].
- **Amaliy xulosa — minimal maʼlumot:** mehmon oʻyinchidan faqat
  laqab; ism-familiya, email, telefon soʻralmaydi; xona ma'lumoti
  vaqtinchalik. Bu yuridik yukni ham, suiiste'mol sirtini ham kamaytiradi.
- **QR-karta:** kamera tasviri saqlanmasligini tasdiqlash kerak (yuz
  biometrik maʼlumot sanaladi).

### 4.4 Mehmon uchun kontent bazasi — haqiqiy toʻsiq

**[oʻlchov, `/api/game/catalog`, 2026-09-30]:**

| Fan | Testlar | Savollar |
|---|---|---|
| Biologiya | 3 (oson/oʻrta/qiyin) | 75 |
| Fizika | 3 | 62 |
| Geografiya | 3 | 75 |
| Informatika | 3 | 76 |
| Kimyo | 3 | 68 |
| Matematika | 3 | 75 |
| Ona tili | 3 | 75 |
| Tarix | 3 | 74 |
| Ingliz tili | 6 (A1–C2) | 300 |
| **Jami** | **30 test, 9 fan** | **880 savol** |

Sinf boʻyicha ham, mavzu boʻyicha ham boʻlinmagan — faqat «oson / oʻrta /
qiyin». 7-sinf oʻqituvchisi «Fotosintez» mavzusini topa olmaydi. Mehmonning
birinchi daqiqasi shu bazaga tayanadi: u **kerakli mavzuni topolmasa**,
hisobsiz kirish ham foyda bermaydi. Ustozona'da testlarni AI orqali
yaratish, import va test banki allaqachon bor (Topshiriqlar) — shundan
**tayyor mavzular toʻplami** shakllantirish mumkin (moderatsiya bilan).

---

## 5. Tavsiya: toʻrt daraja

| Daraja | Nom | Hisob | Nima qila oladi | Holat |
|---|---|---|---|---|
| **1** | **Oʻynash** | yoʻq | Barcha oʻyin, tayyor baza, yakka va sinf ekranida; PIN bilan qoʻshilish | **asosan bor** — matn va yoʻl-yoʻriq yetishmaydi |
| **2** | **Sinfda sinash** | yoʻq | Mehmon **jonli xona ochadi** va jamoa oʻyinini boshqaradi, faqat tayyor bazadan; cheklovlar bilan (§6); oxirida natija **ekranda** | **yoʻq** — LessonLab tomonida |
| **3** | **Oʻz savollarim** | yoʻq → saqlashda hisob | Savollarni qoʻyib/yuklab oʻyin yasash, **havola orqali** ulashish (vaqtinchalik) | keyingi bosqich |
| **4** | **Saqlash va jurnal** | **bor** | Oʻz testlar kutubxonasi, sinf roʻyxati, natijani jurnalga/hisobotga, tarix, kattaroq xona, xususiy toʻplam | bor (dashboard) |

**Qoida — «qiymat koʻringach, hisob».** Hisob *faqat* yoʻqotib boʻlmaydigan
nuqtada soʻraladi: natijani saqlash, test saqlash, sinf roʻyxati,
hisobot/yuklab olish, jurnal. Ikki oʻyin oʻrtasida, oʻyin boshlanishida
— hech qachon. (Doska qoidasi; §2.3.)

**Mehmon → hisob oʻtishi yoʻqolmasin.** Mehmon boshqargan oʻyinning
natijasi hisobga **biriktirilishi** (qurilma kaliti orqali) — Kahoot
«hisobot yoʻq» deb qoʻyib, qiymatni yoʻqotadi; biz roʻyxatdan oʻtgan
zahoti oxirgi sessiyalarni koʻrsatishimiz mumkin. Texnik muammo: oʻyin
`lessonlab.uz` domenida, iframe ichida; brauzerlar begona domen
iframe xotirasini ajratadi (`lessonlab-birlashtirish.md`). Oʻqituvchilar
uchun mavjud bir martalik chipta yoʻli (`games-sso.ts`) bilan bir xil
mexanizm mehmon «daʼvo kaliti»ga ham moslashishi mumkin — **hali
tekshirilmagan**.

**Nomlash:** landing/`/games` da **«Oʻynash — roʻyxatsiz»**, «Sinfda
sinash — roʻyxatsiz, natija saqlanmaydi», «Saqlash — kirish bilan». Faqat
qurilgan darajalar haqida va'da beriladi (memory: landingda hali va'da
qilinmagan — 2026-09-19).

---

## 6. Xavfsizlik va suiiste'molga qarshi qoidalar (2-daraja uchun shart)

Bular «qoʻshimcha» emas — mehmon xonasi **bularsiz ochilmaydi**.

| Xavf | Qoida (taklif, raqamlar — boshlangʻich taxmin) |
|---|---|
| Anonim xona spami; xona holati xotirada | IP/qurilma boʻyicha kunlik xona limiti (masalan 3), xona **TTL** (masalan 2 soat), butun serverda ochiq xonalar tepa chegarasi, xona ochilganda 1 ta qadam tekshiruv |
| PIN ni topish (6 raqam = 1 mln kombinatsiya) | PIN tekshiruviga IP boʻyicha tezlik limiti va vaqtinchalik bloklash; xato PIN javobi bir xil |
| Nomaqbul laqab, bot oʻyinchilar | laqab filtri (oʻzbek/rus/ingliz), **tasodifiy xushmuomala ism** — mehmon xonada standart; mezbon ishtirokchini chiqara oladi; xona boshlangach **qulflanadi** |
| Mehmon mezbon — katta xona | mehmon uchun ishtirokchi chegarasi (sinfga yetadigan, masalan 40); undan koʻpi hisobda |
| Moderatsiyasiz ommaviy kontent | mehmon **ommaviy roʻyxatga chiqara olmaydi**; ochiq roʻyxatda faqat tartibli baza; foydalanuvchi testlari alohida «Hamjamiyat» boʻlimi va shikoyat tugmasi bilan — keyingi bosqich |
| Bolalar maʼlumoti | faqat laqab; chat yoʻq; erkin matn boshqalarga koʻrinmaydi; mehmon xonalari qidiruvga yopiq (`noindex`) |

---

## 7. Bosqichlar

**0-bosqich — faqat Ustozona repo'si, LessonLab'ga tegmasdan:**
- `/games` mehmon matni: nima hisobsiz, nima hisob bilan; «Kirish / Roʻyxatdan
  oʻtish» tugmasi (Telegram'dan tashqari), sinf ekrani va uyda mashq uchun
  qisqa yoʻl-yoʻriq.
- Oʻyin sahifalari uchun alohida `generateMetadata` (sarlavha, tavsif,
  `canonical` — oʻz manzili) va sitemap'ga `/games/<oʻyin>`. «Ochiq» ni
  qidiruvdan kirish ma'nosida ham oʻrinli qiladi.
- Landing'dagi oʻyinlar bayonoti faqat 1-daraja haqiqatiga mos.

**1-bosqich — LessonLab repo'si (egasi bilan kelishib):**
- Mehmon mezbon: jonli xona ochish faqat tayyor bazadan, §6 cheklovlari bilan.
- Laqab filtri va tasodifiy ism; PIN tezlik limiti; xona TTL va chegarasi.
- Ochiq roʻyxatda faqat tayyor baza (ommaviy testlar alohida).

**2-bosqich:**
- Mehmon sessiyasini hisobga biriktirish («Natijani saqlash — kirish»).
- Tayyor baza: sinf × mavzu boʻyicha (§4.4) — moderatsiya bilan AI yordamida
  toʻldirish; AI limitini hisobga oling (memory: `ai-kvota-…`).

**3-bosqich:**
- Yengil muallif: savollarni qoʻyish/yuklash → vaqtinchalik havola.
- «Hamjamiyat» kutubxonasi — moderatsiya va shikoyat bilan.

---

## 8. Qaror kerak

1. **Mehmon jonli xona ocha oladimi?** (2-daraja.) Tavsiya: ha, §6
   cheklovlari bilan — aks holda «ochiq» faqat oʻynashni bildiradi.
2. **Jonli PIN oʻyinining oʻrni.** §4.1 ga koʻra sinf ichida rasmiy emas.
   Tavsiya: uy vazifasi/dars tashqarisi sifatida ajratib koʻrsatish,
   asosiy obrazni **sinf ekrani** qilish. Bu landing matniga ham taʼsir
   qiladi.
3. **Yengil muallif (3-daraja) kerakmi va qachon?** Bu eng katta ish va
   moderatsiya yukini keltiradi; 1–2-bosqichlardan keyin.
4. **LessonLab repo egasi** bilan: mehmon mezbon va cheklovlar uning
   qulflangan sahifalarini oʻzgartiradi.
5. **Tayyor baza hajmi.** 880 savol yetmaydi. Kim va qanday toʻldiradi
   (AI, import, qoʻlda) — alohida qaror.
6. **Huquqiy tekshiruv:** 139-son qarorining oʻqitish maqsadiga
   munosabati; shaxsiy maʼlumot qonunidagi amaldagi shartlar.

---

## 9. Manbalar

**Mahsulotlar**
- Wordwall — tariflar: <https://wordwall.net/en/price-plans> [rasmiy; oʻquvchi hisobsiz ishlashi haqida sahifada maʼlumot yoʻq — bu qism ikkilamchi]
- Kahoot — qoʻshilish va mehmon mezbonlik: <https://support.kahoot.com/hc/en-us/articles/360039890713-Kahoot-join-How-to-join-a-Kahoot-game>, <https://support.kahoot.com/hc/en-us/articles/29428983927059-How-to-allow-guest-hosting> [rasmiy yordam markazi; ikkinchi sahifa toʻgʻridan-toʻgʻri ochilmadi, xulosa qidiruvdan]
- Gimkit Basic: <https://blog.gimkit.com/blog/gimkit-basic-has-changed> [sahifa ochilmadi; raqam qidiruv xulosasidan]
- LearningApps: <https://www.ecml.at/en/Resources/ICT-tools/InventoryID/166> [ikkilamchi]
- Duolingo kechiktirilgan roʻyxat: <https://taplytics.com/blog/duolingo-ab-test-onboarding> [ikkilamchi]
- Kirish devori: <https://www.nngroup.com/videos/login-walls/>

**Ilmiy**
- Sailer & Homner (2020), *The gamification of learning: a meta-analysis*, Educational Psychology Review: <https://link.springer.com/article/10.1007/s10648-019-09498-w>
- Wouters va b. (2013), *A meta-analysis of the cognitive and motivational effects of serious games*: <https://research-portal.uu.nl/en/publications/a-meta-analysis-of-the-cognitive-and-motivational-effects-of-seri/>
- Adesope, Trevisan, Sundararajan (2017), *Rethinking the use of tests*, Review of Educational Research: <https://www.learningscientists.org/blog/2017/2/9-1> (sharh)
- Wang & Tahir (2020), *The effect of using Kahoot! for learning — a literature review*, Computers & Education: <https://research.gold.ac.uk/id/eprint/39435/1/1-s2.0-S0360131520300208-main.pdf>
- Habgood & Ainsworth (2011), *Motivating children to learn effectively: exploring the value of intrinsic integration in educational games*: <https://shura.shu.ac.uk/3556/>

**Oʻzbekiston**
- Maktabda mobil telefondan foydalanish tartibi (Vazirlar Mahkamasi 139-son, 21.05.2012): <https://gov.uz/oz/advice/65/document/1744>
- Shaxsiy maʼlumotlar lokalizatsiyasi (2026): <https://settleadvisory.com/news-en/localization-of-personal-data-in-uzbekistan-transition-to-a-more-flexible-regulatory-model/>, <https://kun.uz/ru/news/2026/03/28/xraneniye-nekotoryx-personalnyx-dannyx-za-predelami-uzbekistana-razresheno> (Dentons sahifasi 403 berdi — oʻqilmadi)
- Digital 2026: Uzbekistan: <https://datareportal.com/reports/digital-2026-uzbekistan>
- 16 yoshgacha ijtimoiy tarmoq taklifi: <https://www.gazeta.uz/en/2026/06/30/social-media/>

**Ichki**
- `docs/lessonlab-birlashtirish.md`, `docs/ost-loyihalar-arxitektura.md` (R54, R134, R158, «Doska» bepul/pullik jadvali), `docs/topshiriq-boshlash-markazi.md` §6, `src/lib/baholash-shells.ts`, `src/lib/games.ts`, `src/app/games/`.
