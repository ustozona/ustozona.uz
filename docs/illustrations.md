# Illyustratsiyalar katalogi

Notion-uslubidagi qoʻlda chizilgan SVG'lar `public/illustrations/`da. Uch oila:

- **Raqamli `1`–`50`** (128×128, kvadrat) — bir rangli (monoline) sketch, `black → currentColor`; accent yoʻq.
- **Nomlangan `oc-/nc-/ec-`** (~343×251, landshaft) — koʻk accent (`#2563EB`), inson-figurali kompozitsiyalar.
- **Duotone nomlangan** (520×520, kvadrat) — `currentColor` + opacity-qatlamlar (kulrang soyalar), inson-figurali sahnalar. Roʻyxati quyida.

Ishlatish: `<Illustration name="14" className="h-32 text-black dark:text-white" />` — bosh joyi boʻsh-holatlar (`<EmptyMedia>` default variant). Qarang: [illustration.tsx](../src/components/ui/illustration.tsx).

## Oʻlcham standarti (empty-state)

Oʻlchamni **balandlik** boshqaradi (`h-*`), eni aspektdan avtomatik chiqadi — oilalar nisbati har xil, balandlik esa `Empty` ichidagi vertikal ritmni belgilaydi. Ikki daraja:

| Daraja | Klass | Qayerda |
|--------|-------|---------|
| **Panel** | `h-32` (128px) | Card/panel ichidagi boʻsh-holat (dashboard panellari, roʻyxat "topilmadi", "tanlanmagan") — **standart tanlov** |
| **Sahifa / hero** | `h-40` (160px) | Butun sahifa markazidagi yirik boʻsh-holat, onboarding sahnasi |

Rang: raqamli scribbles → `text-black dark:text-white` (sof qora, original bold); `oc-/nc-/ec-` va duotone → default (`text-foreground`, accent/soyalar oʻzida). `w-*` bilan oʻlchamlash endi ishlatilmaydi.

## Neytrallik qoidasi (uniseks)

Oʻqituvchilar erkak ham, ayol ham — ilovani jinsga qarab alohida moslashtirmaymiz (ish koʻpayadi). Shuning uchun:

- **Standart tanlov — predmet/belgi-asosli** illyustratsiyalar (raqamli scribbles): jinsi yoʻq, hammaga birdek.
- Inson-figurali oilalardan (oc/nc/ec, duotone, Activities) faqat **jinsi ifodalanmagan yoki aralash** sahnalar umumiy joylarga qoʻyiladi: qoʻllar (oc-taking-note), aralash juftlik (High five, Teamworks), belgisiz figura.
- **Yakka, aniq bir jinsli figura doimiy boʻsh-holatga qoʻyilmaydi.** Shu sababdan students'dagi `oc-thinking` (yakka ayol) → `71` (klik kursori — "sinf tanlang") ga almashtirildi (2026-07-05).

Quyidagi "nom" ustuni — semantik yorliq (fayl nomi oʻzgarmagan, faqat qidirish/tanlash uchun katalog).

## Raqamli (1–50)

| Fayl | Nima chizilgan | Semantik nom | Mos boʻsh-holat / ishlatish |
|------|----------------|--------------|------------------------------|
| 1  | Qoʻl + yulduzchalar | sehr / tabrik | "Ajoyib!", tabrik, boʻsh yutuqlar |
| 2  | Nishonga tekkan oʻq | nishon / aniqlik | Maqsad yoʻq, standart yoʻq |
| 3  | Orbita + qogʻoz samolyot | uchirish / orbit | Boshlash, yangi loyiha |
| 4  | Savol + undov pufakchalari | savol-javob | Fikr/izoh yoʻq, yordam, muhokama boʻsh |
| 5  | Muhrli qogʻozlar dastasi | hujjatlar dastasi | Hujjat/arxiv yoʻq |
| 6  | Kubok + yulduz | gʻalaba / kubok | Yutuq yoʻq, reyting yuqorisi |
| 7  | Medal + yulduz | mukofot / nishon | Baho/mukofot yoʻq |
| 8  | Aylanma strelkalar + pufakchalar | jarayon / almashinuv | Sikl, takrorlanish, almashinuv boʻsh |
| 9  | Oʻsuvchi ustunli diagramma | oʻsish / statistika | Hisobot/analitika yoʻq, maʼlumot yetarli emas |
| 10 | Ochiq konvert | xat / xabar | Xabar yoʻq, pochta boʻsh |
| 11 | Chertayotgan qoʻl | tez / oson | "Bir bosishda", tezkor amal |
| 12 | Ochiq quti + strelka | quti / arxiv | Arxiv boʻsh, import/eksport |
| 13 | Sovgʻa qutisi | sovgʻa / mukofot | Bonus, taklif, yangi funksiya |
| 14 | Lupa + qoʻl | qidiruv | **Topilmadi** (qidiruv natijasi boʻsh) — *ishlatilgan: sinflar* |
| 15 | Toʻrt qoʻl chatishgan | jamoa / hamkorlik | Guruh boʻsh, hamkorlik |
| 16 | Qogʻoz samolyot | yuborish | Yuborilgan xabar yoʻq, joʻnatilgan |
| 17 | Brauzer oynasi + kursor | veb / interfeys | Sahifa boʻsh, integratsiya |
| 18 | Qalqon + belgi | xavfsizlik / tasdiq | Xavfsizlik, tasdiqlangan holat |
| 19 | Kaftda tangalar | pul / daromad | Toʻlov, byudjet, daromad boʻsh |
| 20 | Hamyon | hamyon / toʻlov | Toʻlov usuli yoʻq |
| 21 | Qutidagi papkalar | fayllar / arxiv | Fayl yoʻq, papka boʻsh |
| 22 | Katakli qogʻoz (#) | jadval / reja | Jadval/reja boʻsh, taqvim |
| 23 | Kitoblar dastasi | kitoblar / darslik | Darslik/resurs yoʻq |
| 24 | Muhrli varaq | sertifikat / diplom | Sertifikat/diplom yoʻq |
| 25 | Belgili nishon | tasdiqlangan | Tasdiqlangan/tugallangan holat |
| 26 | Qulfli daftar | qulflangan / maxfiy | Maxfiy, kirish yopiq |
| 27 | Megafon | eʼlon / marketing | Eʼlon yoʻq, xabarnoma |
| 28 | Choʻntak soati | vaqt | Vaqt/jadval, muddat |
| 29 | Ochiq kitob + qoʻl | oʻqish / darslik | Dars/mavzu yoʻq |
| 30 | Ikki belgilangan katak | checklist / bajarildi | Vazifa yoʻq, hammasi bajarildi |
| 31 | Choʻchqa-kassa | jamgʻarma / byudjet | Jamgʻarma, byudjet |
| 32 | Choʻqqidagi bayroq | maqsadga erishish | Maqsad qoʻyilmagan, bosqich yoʻq |
| 33 | Kalkulyator 20% | hisoblash / foiz | Baholash, foiz, hisob-kitob |
| 34 | Printer | chop etish | Chop etiladigan narsa yoʻq |
| 35 | Globus | dunyo / geografiya | Geografiya, til, umumiy |
| 36 | Qoʻl berishish | kelishuv | Hamkorlik, kelishuv boʻsh |
| 37 | Qum soati | kutish / muddat | Kutilmoqda, muddat tugadi |
| 38 | Xarid sumkasi | xarid | Savat boʻsh, xarid |
| 39 | Puzzle boʻlagi | yechim / moslik | Mos element yoʻq, yechim |
| 40 | Labirint | murakkablik / izlash | Yoʻl topish, murakkab jarayon |
| 41 | Xaritadagi joy belgisi | manzil / lokatsiya | Manzil yoʻq, joylashuv |
| 42 | Oshxona tarozisi | oʻlchov / tarozi | Baholash ogʻirligi, muvozanat |
| 43 | Mikrofon | nutq / podkast | Audio yoʻq, nutq |
| 44 | Telefon | aloqa / qoʻngʻiroq | Kontakt yoʻq, aloqa |
| 45 | Lampochka | gʻoya | Gʻoya yoʻq, taklif |
| 46 | Hujjat/varaq | hujjat | Hujjat yoʻq |
| 47 | Bulutdan yuklash | yuklab olish | Yuklanmagan, sinxron |
| 48 | Koʻtarilgan ikki qoʻl | olqish / muvaffaqiyat | Muvaffaqiyat, tabrik |
| 49 | Tishli gʻildirak | sozlama / jarayon | Sozlama yoʻq, jarayon |
| 50 | Kalit + bolgʻa | asboblar / sozlash | Sozlash, texnik |

## Nomlangan (oc-/nc-/ec-)

Bular allaqachon tavsifli nomga ega — koʻk accentli, kattaroq (~343×251), inson-figurali. Boʻsh-holat "hero" uchun ayni muddao.

| Fayl | Nima | Mos ishlatish |
|------|------|----------------|
| oc-taking-note | Planshetга yozayotgan qoʻl | Eslatma/reja yoʻq — *ishlatilgan: WelcomeCard* |
| oc-thinking | Oʻylanayotgan ayol | Tanlanmagan holat, "hali qaror yoʻq" |
| oc-target | Nishon + oʻqlar | Maqsad yoʻq, birinchi maqsad qoʻying |
| oc-sling-shot | Rogatka | Boshlash / uchirish |
| oc-growing | Zinapoyaga chiqayotgan odam | Oʻsish, progress yoʻq |
| oc-handing-key | Kalit uzatish | Ruxsat/kirish, topshirish |
| oc-handshake / oc-hi-five | Qoʻl berishish / besh | Hamkorlik, tabrik |
| oc-lighthouse | Mayoq | Yoʻnalish, boshlangʻich |
| oc-money-profits | Pul qopi | Daromad, tarif |
| oc-on-the-laptop | Noutbukdagi odam | Ish jarayoni, boʻsh workspace |
| oc-project-development | Loyiha ustida ish | Loyiha yoʻq, qurilmoqda |
| oc-puzzle | Puzzle | Yechim, integratsiya |
| oc-time-flies | Uchayotgan soat | Muddat, vaqt |
| oc-work-balance | Muvozanat | Muvozanat, holat |
| nc-no-answer | Yelka qisayotgan odam | Natija yoʻq, javob yoʻq |
| nc-ranking | Yulduz koʻtargan odam | Reyting, yutuq |
| nc-recruit-directly | Kapalak ovlash | Oʻquvchi/aʼzo yigʻish |
| nc-research-panel | Lupa + kapalak | Tadqiqot, tahlil |
| nc-reviewing | Yulduzli baholash | Sharh/baho yoʻq |
| nc-ranking / nc-scale-a-process | Reyting / domino | Reyting, kengaytirish |
| nc-newsletter | Gazeta | Yangilik yoʻq |
| nc-no-answer | — | (yuqorida) |
| ec-launch-project | Raketa | Ishga tushirish, boshlash |
| ec-notification | Qoʻngʻiroq + samolyot | Bildirishnoma yoʻq |
| ec-marketing | Megafonli odam | Eʼlon, kampaniya |
| ec-analyzing-market-price | Grafik tahlil qilayotgan | Analitika, statistika |
| ec-easy-shopping / ec-gift-card | Xarid / sovgʻa | Bonus, taklif |

> Eslatma: nomlangan fayllardan koʻpi savdo/marketing kontekstiga moʻljallangan (ec-/nc-). Taʼlim ilovasi uchun mos kelganlarini tanlaymiz; qolganlari zaxira.

## Duotone (520×520)

`currentColor` + opacity-qatlamlar — light'da qora+kulrang soyalar, dark'da oq+soyalar. Ichki boʻshligʻi (padding) katta, shuning uchun koʻproq **hero darajaga** (`h-40`) mos. `Painting` va `Summer-Collection n.1`dagi qattiq `#242021` 2026-07-05 da `currentColor`ga tuzatilgan (dark-mode-safe).

| Fayl | Nima chizilgan | Mos ishlatish |
|------|----------------|----------------|
| Affiliate-Program | Ikki qoʻl berishish + ikonka-pufakchalar | Hamkorlik, taklif, referal |
| Chill-Time | Kresloda kitob oʻqiyotgan odam + mushuk | Dam, tanaffus, "hammasi bajarildi" |
| Fast-Internet | Raketa minib ketayotgan odam | Tezkor start, onboarding |
| Flag | Bayroq koʻtarib yugurayotgan odam | Maqsadga erishish, gʻalaba |
| Jumping | Quvnoq sakrayotgan ayol | Muvaffaqiyat, tabrik |
| Loading-Time | Boshida turgan (yoga) odam + loading belgisi | Kutish, yuklanmoqda |
| Painting | Yerda rasm chizayotgan ayol | Ijod, boʻsh loyiha/portfolio |
| Planning-A-Trip | Globusni quchoqlab oʻtirgan odam | Reja tuzish, yangi boshlanish |
| Summer-Collection n.1 | Shezlongda quyosh botishini tomosha qilayotgan odam | Taʼtil, dam olish davri |

> `Summer-Collection n.1` nomida probel bor — `<Illustration name="Summer-Collection n.1" />` ishlaydi (brauzer URL'ni oʻzi enkodlaydi), lekin ishlatishdan oldin soddaroq nomga koʻchirish maʼqul.

## Manba-papkalar (zaxira)

`public/illustrations/` ichida 3 ta Figma-community dump papka bor (~2.1MB, deployga kiradi — kerak boʻlmasa keyinroq public'dan chiqarish mumkin). Fayllari **konvertlanmagan** (qattiq `black`/`#231F20` + oq fon-`<rect>`) — toʻgʻridan-toʻgʻri ishlatilmaydi, avval root'ga koʻchiriladi.

**Root'ga koʻchirish retsepti (scribbles):**

```bash
sed 's/<rect width="102" height="102" fill="white"\/>//; s/#231F20/currentColor/g' \
  "Free Notion-style Scribbles (Community)/N.svg" > N.svg
```

### Scribbles 51–150 (100 ta yangi doodle)

Root `1`–`50`dan farqli, bular asosan **dekorativ doodle-elementlar** (strelkalar, urgʻular, belgilar) — boʻsh-holat "sahnasi" emas, koʻproq annotatsiya/bezak/urgʻu uchun. 138 va 148 yoʻq; 111-1 va 122-1 variantlar bor.

| Fayl | Nima chizilgan |
|------|----------------|
| 51 | Kvadrat qavslar `[ ]` |
| 52 | Dengiz yulduzi |
| 53 | Quyosh (nurli) |
| 54 | Yarim oy |
| 55 | Zigzag chiziq |
| 56 | Panjara shtrix (#) |
| 57 | Geometrik shakllar sochmasi |
| 58 | Kub + doira toʻplami |
| 59 | Juft qiya shtrix |
| 60 | Kasr/boʻlish chizigʻi |
| 61 | Aylanma strelka (yangilash) |
| 62 | Uch strelkali sikl |
| 63 | Qalin oʻsish strelkasi |
| 64 | Punktir strelka |
| 65 | S-egri strelka |
| 66 | Zigzag strelka (pastga) |
| 67 | Spiral + strelka |
| 68 | Ilmoqli strelka |
| 69 | Qoʻsh ayri strelka (yuqoriga) |
| 70 | Egik strelka (yuqori-oʻng) |
| 71 | Klik kursori — *ishlatilgan: students "Sinf tanlanmagan" (root'ga koʻchirilgan)* |
| 72 | Spiral aylanma strelka |
| 73 | Orqaga aylanma strelka (undo) |
| 74 | Qoʻsh kontur strelka (yuqori-chap) |
| 75 | Zigzag koʻtarilish strelkasi |
| 76 | Qoʻsh chiziqli strelka (yuqoriga) |
| 77 | Egri koʻtarilish strelkasi |
| 78 | Ikki tomonlama strelka |
| 79 | Portlash / chaqnash |
| 80 | Qarama-qarshi juft strelka |
| 81 | Qoʻsh shevron » |
| 82 | Aylanib qaytish (loop) |
| 83 | Kesishgan strelkalar (X) |
| 84 | Toʻliq boʻyalgan strelka |
| 85 | Nuqta-izli strelka |
| 86 | Yuqori/past koʻrsatkich juftligi |
| 87 | Qoʻsh yoy strelka |
| 88 | Ilonizi strelka |
| 89 | Juft toʻlqin (bezak) |
| 90 | Sochma nuqtali strelka |
| 91 | Sozlama slayderlari (filtr) |
| 92 | Uchqunli ayri strelkalar |
| 93 | Kvadratdan chiqish strelkasi (ulashish) |
| 94 | Pauza (doirada) |
| 95 | Play (doirada) |
| 96 | Pufak-izli strelka |
| 97 | Ekrandan chiqish strelkasi |
| 98 | Yurak + chaqnash |
| 99 | Shtrixli oʻsish strelkasi |
| 100 | Uzun qiya strelka |
| 101 | Uchqunli squiggle-strelka |
| 102 | Doira + kirish-chiqish strelkalari |
| 103 | Smiley (tabassum) |
| 104 | Neytral yuz |
| 105 | 3×3 nuqta panjarasi |
| 106 | Qavs (brace) |
| 107 | Juft qalin strelka (oʻngga) |
| 108 | Tomchili oʻsish strelkasi |
| 109–117 | Qoʻlyozma raqamlar: 109=1, 110=2, 111=3, 111-1=4, 112=5, 113=6, 114=7, 115=8, 116=9, 117=0 |
| 118 | Chaqmoq-shtrix urgʻu |
| 119 | DNK spirali |
| 120 | Belgilangan katak (check) |
| 121 | Xoch / qiya plyus |
| 122 | Pufakchalar |
| 122-1 | Lampochka + yurak (gʻoya) |
| 123 | Bant (lenta) |
| 124 | Lolipop-spiral |
| 125 | Salyut / gul otashinlari |
| 126 | Check-varaqcha |
| 127 | Toj |
| 128 | Barg |
| 129 | Shtrixli doira |
| 130 | Tomchilar (3 ta) |
| 131 | Bugʻ / tutun |
| 132 | Halqali sayyora (Saturn) |
| 133 | V-ishora (qoʻl) |
| 134 | Uchburchak konfetti |
| 135 | Klyaksa konturi |
| 136 | Bulut-dogʻ |
| 137 | Doiralar birikmasi (molekula) |
| 139 | Qiya shtrixli doira |
| 140 | Olmos (brilliant) |
| 141 | Buletli roʻyxat (3 band) |
| 142 | Like (bosh barmoq) |
| 143 | Moʻyqalam |
| 144 | Soat + chaqnash |
| 145 | Juft qiya urgʻu |
| 146 | 3D kub |
| 147 | Uycha |
| 149 | Kamalak |
| 150 | Qogʻoz samolyot |

### Human Activities (10 ta, inson-figurali)

⚠️ Nomlarida probel bor + `fill="black"`/`fill="white"` qatlamli — oddiy sed bilan konvert boʻlmaydi (oq "ich" qatlamlari dark'da muammo). Neytrallik jihati jadvalda:

| Fayl | Nima chizilgan | Jins | Neytral joyga mosmi |
|------|----------------|------|---------------------|
| Chatting | Telefonda yozishayotgan kishi | Erkak | ✗ |
| Delivery | Mopedda yetkazuvchi | Ayol | ✗ |
| High five | Besh urishayotgan ikki kishi | Aralash | ✓ |
| Hiking | Togʻda sayr | Erkak | ✗ |
| Launch | Qogʻoz samolyot ustidagi kishi | Belgisiz | ✓ |
| Meditation | Chordana meditatsiya | Ayol | ✗ |
| Public Speaking | Mikrofonda soʻzlovchi | Erkak | ✗ |
| Reading | Gazeta oʻqiyotgan kishi | Erkak | ✗ |
| Teamworks | Laptopda ishlayotgan ikki kishi | Aralash | ✓ |
| Work | Laptopda ishlayotgan kishi | Erkak | ✗ |

### Vectorly UNI (20 ta mayda ikonka)

Bular illyustratsiya emas, **ikonka** — empty-state uchun ishlatilmaydi (ikonka kerak boʻlsa lucide bor). Roʻyxat: bag, bubble-chat-dotted, butterfly, car, cloud, documents, fan, flash, house-home, instagram, map-pin-mark, money-down, pie-chart, pin, puzzle, rockets, shield, signal, target, warning.
