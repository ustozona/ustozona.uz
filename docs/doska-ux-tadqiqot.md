# Doska UX tadqiqoti — asboblar va dizayn yoʻnalishi

> **Holat (2026-09-25):** tadqiqot tugadi, qarorlar qabul qilindi (§0),
> **1–3-bosqich qurildi** (§5).
> [doska-dizayn-tizimi.md](./doska-dizayn-tizimi.md) §1–4 shu hujjat
> asosida qayta yozildi.
>
> Sabab: foydalanuvchi Doskaning dizayn tizimini maʼqul koʻrmadi va
> «uskunlarni ishlatish UX/UI jihatidan qulay boʻlishi shart» dedi.
>
> Referens topilmalari **R310–R329**. Nomlar yozilmaydi — naqshning
> mohiyati tasvirlanadi (AGENTS.md). Ilmiy manba va standartlar
> (maqola, WCAG, oʻrnatish tavsiyasi) muallifi bilan keltiriladi.

Asosiy xulosa bitta jumla: **muammoning kattasi rangda emas, asboblar
qanday ishlashida** — bekor qilish yoʻq, taymerga vaqt qoʻyib boʻlmaydi,
har vidjet sozlamani oʻzicha ixtiro qilgan, interaktiv panelda yuqori
tugmalarga qoʻl yetmaydi. Vizual yoʻnalish ikkinchi darajali.

---

## 0. Qabul qilingan qarorlar (2026-09-25)

### Q1. Vizual uslubni oʻqituvchi tanlaydi; mantiq va UX — bitta

Foydalanuvchi taklifi: «dizaynni user tanlaydigan qilsakchi? Qolgan
mantiq, arxitektura, UX ni jahon amaliyoti asosida qilaveramiz».
Qabul qilindi, quyidagi chegara bilan:

| Uslubga KIRADI (tanlanadi) | Uslubga KIRMAYDI (hammada bir xil) |
|---|---|
| Rang, burchak, kontur, soya, shrift, ikona ogʻirligi, harakat egri chizigʻi, vidjet bezaklari (masalan svetofordagi yuz ifodasi) | Boshqaruv joylashuvi, nishon oʻlchami, sozlama naqshi, xatti-harakatlar, yorliqlar, yozuvlar, qaytarish, «rang + belgi + soʻz» |

- Uchta uslub: **Sokin** (A, standart), **Oʻyinchoq** (B), **Doska** (C —
  qogʻoz + magnit). Nomi — «Uslub», «Mavzu» emas: «mavzu» ilovada dars
  mavzusi maʼnosida band; sahnadagi «uslub» presetlari bilan bir xil soʻz.
- Arxitektura: `data-doska-style="sokin|oyinchoq|doska"` — faqat
  **token qatlami** (qurilishda `src/styles/doska.css` ga tushdi —
  Doskaga xos tokenlar umumiy `components.css` ni shishirmasin),
  komponent fork qilinmaydi.
  Komponentlar oʻz qiymatini `var(--doska-…)` dan oladi va qaysi uslub
  yoqilganini bilmaydi (hozirgi «boʻr rejimi» bilan bir xil naqsh).
- C variantidagi yon relsalar **uslub emas** — ular alohida sozlama:
  «Panel joyi: past / chap / oʻng» (Q3).
- ⚠️ **Standart hal qiluvchi (R329):** foydalanuvchilarning 5% dan kami
  sozlamani oʻzgartiradi. Demak 95% oʻqituvchi standart uslubni koʻradi
  — u eng kuchli variant boʻlishi kerak: **Sokin**. Kirgan oʻqituvchi
  uchun keyinroq «aqlli standart» mumkin: jurnaldagi sinflari 1–4-sinf
  boʻlsa — Oʻyinchoq.
- Har uslub **proyektor sinovidan** oʻtadi: yorugʻ sinf simulyatsiyasida
  (qora 25% gacha koʻtarilgan, toʻyinganlik ¼ ga tushgan) vidjet fondan
  ajralib turishi va matn oʻqilishi shart (R324).
- Mavjud qarorlar endi uslubga bogʻlanadi: «panel jim» va «panelga
  toʻyingan idish hech qachon» — **Sokin** va **Doska** uslubi uchun
  qoida; **Oʻyinchoq** ularni ataylab buzadi (oʻqituvchi oʻzi tanlaydi).
- Saqlanishi: oʻqituvchi sozlamasi (mehmonda — shu brauzer). Toʻplam
  (deck) boʻyicha alohida uslub — keyin, kerak boʻlsa.

### Q2. Sozlama — vidjet YONIDAGI karta (UX qarori)

Foydalanuvchi qarorni UX tomonga topshirdi. Uchta variant solishtirildi:

| | Vidjet yonidagi karta | Vidjet orqasi (aylanish) | Pastki varaq |
|---|---|---|---|
| Yaqinlik (koʻz va qoʻl) | ✓ vidjet yonida | ✓ vidjetning oʻzida | ✗ 75″ doskada 1 m gacha uzoq |
| Oʻzgarishni koʻrish | ✓ vidjet koʻrinib turadi | ✗ vidjet yuzi yopiq | ✓ |
| Kichik vidjet | ✓ karta oʻlchami oʻzgarmas | ✗ sigʻmaydi | ✓ |
| Qoʻl yopishi (R328) | ✓ yon tomonda | — | ✓ |
| Noutbuk + sichqoncha | ✓ odatiy | ✓ | ✗ mobil naqsh |

Qaror: **yonidagi karta**, joylashish qoidalari bilan:

1. Vidjetning **boʻsh joyi koʻproq tomoniga** ochiladi; teng boʻlsa
   sensorli ekranda **chapga** (oʻng qoʻl oʻng-pastni yopadi, R328),
   sichqonchada oʻngga.
2. Hech qachon vidjetdan **yuqoriga** chiqmaydi — vidjet qoʻl yetgan
   joyda, uning ustidagi karta yetmasligi mumkin (R319).
3. Kenglik vidjetga bogʻliq emas (~320 px), tugmalar ≥ 44 px.
4. **Klaviatura kerak emas**: vaqt — presetlar va ± tugmalar, rejim —
   segment. Interaktiv doskada matn maydoni ekran klaviaturasini
   ochadi va u ekranning yarmini yopadi; matn faqat mazmun uchun (ism,
   yozuv).
5. Oʻzgarish darhol qoʻllanadi, «Saqlash» yoʻq; tashqariga bosish yoki
   `Esc` yopadi; bir vaqtda bitta karta.
6. Ekran 640 px dan tor boʻlsa (telefon) karta pastki varaqqa aylanadi
   — mazmun bir xil, faqat idish boshqa.

Aylanish (B) naqsh sifatida **olinmaydi**; gʻildirakning «roʻyxat tomoni»
2-bosqichda shu kartaga koʻchadi.

### Q3. Asosiy qurilma — interaktiv doska; noutbuk va proyektor ham

«Doska ost-loyihasi e-doska uchun. Kompyuter/noutbuk uchun ham mos
boʻlishi kerak, keyin proyektorda ishlaydiganlar uchun ham.» Oqibatlari:

- **Sensor birinchi**: har amal bosish bilan bajariladi; hoverga
  bogʻliq hech narsa yoʻq; bosish maydoni ≥ 44 px; yorliqlar faqat
  tezlashtiradi (Ctrl+Z, Delete, strelkalar), yagona yoʻl emas.
- **Yetish**: butun boshqaruv pastki qatorda, tepada hech narsa yoʻq
  (R319). «Panel joyi» sozlamasi (past / chap / oʻng) — 3-bosqichda;
  standart — past.
- **Qoʻl yopishi**: kontekst panel vidjetning **ustida** qoladi (R328 —
  bilak teginish nuqtasining pastini yopadi). ⚠️ Bu C variantidagi
  «amallar vidjet ostida» gʻoyasini va R318 dagi «ostida boʻlishi
  kerak» degan xulosani **tuzatadi**.
- **Proyektor**: har uslub proyektor sinovidan oʻtadi (Q1), sinf matni
  `cqw` da.

### Q4. 1-bosqich yoʻnalish tanlovini kutmaydi

Boshlandi va qurildi (§5).

---

## 1. Referens topilmalari (R310–R329)

### Sinf ekrani va interaktiv panel dasturlari

**R310 — Boshqaruv uch qatlamda.** Bozordagi yetakchi sinf ekrani
vositasida: (1) pastki panel — vosita **qoʻshish**; (2) vidjet
tanlanganda uning **ustida** suzuvchi kontekst panel — amallar;
(3) har vidjetning **yagona sozlama oynasi** (kontekst paneldagi
tugma yoki `S`). Bizda uchinchi qatlam yoʻq — har vidjet oʻz yoʻlini
ixtiro qilgan (§2, A4).

**R311 — Kontekst panelning «yana» amallari.** Nusxa · barcha
ekranlarda koʻrsatish (pin) · markazga kattalashtirish (spotlight,
`Esc` bilan qaytadi, qolgan vidjetlar yashiriladi) · qulflash · qatlam
(oldinga/orqaga). Sensorli panelda **qulflash** alohida muhim: bola
tegib ketsa vidjet siljimaydi.

**R312 — Qaytarish majburiy.** Yetakchi vosita 2025–26 da panelga
qaytarish/takrorlash tugmasini va `Ctrl+Z` / `Ctrl+Y` ni qoʻshdi; u
izohlar ham, vidjet siljishlari ham qaytariladi. Oʻchirilgan ekranlar
«yaqinda oʻchirilganlar»dan tiklanadi.

**R313 — Klaviatura toʻplami.** `1` — ekranni pardalash (istalgan
tugma qaytaradi) · `2` — qoʻngʻiroq ovozi · `B` — panelni yashirish ·
`F` — toʻliq ekran · `S` — sozlama · `K` — yorliqlar roʻyxati ·
`Delete` · `Esc` · `Shift+D` nusxa · `Shift+S` spotlight · `Shift+P`
pin · `Shift+L` qulf · `Ctrl+↑/↓` qatlam · strelkalar 1 px, `Shift` bilan
10 px · `→ ←` ekranlar. Bizda faqat `Esc`.

**R314 — Interaktiv panelda menyu chetdan, tepadan emas.** Panel
ishlab chiqaruvchilari dasturida umumiy menyu **pastdan, chapdan va
oʻngdan** ochiladi — oʻqituvchi ham, oʻquvchi ham yetadi. Taymer va
tasodifiy tanlash har qanday kontent ustida suzadi (ekranda 4 tagacha
taymer). Koʻp ishlatiladigan vositani oʻqituvchi panelga **qadaydi**.

**R315 — «Bitta vosita = butun ekran» modeli.** Sinf boshqaruvi
ilovasida kanvas yoʻq: har vosita (taymer, tanlash, guruh, shovqin)
ekranni toʻliq egallaydi, telefondan proyektorga uzatiladi. Bizda
kanvas saqlanadi, bu model **«Markazga»** rejimi sifatida olinadi.

**R316 — Tor joyda ustuvorlik, aylantirish emas.** Kanvas
muharrirlarida joy yetmasa tugmalar oʻz ustuvorligi boʻyicha «yana»
menyusiga oʻtadi; uslub paneli desktopda yonda, mobilda popover.
Asosiy asboblar pastda — «qoʻl tabiiy turadigan joyga yaqin». Bizdagi
gorizontal aylanadigan panel (`WidgetBar` izohi) buning oʻrniga
ustuvorlik bilan yashirishi kerak.

**R317 — Ikki xil toolbar, ikki xil urgʻu.** 2025 yilgi ommaviy dizayn
tizimi: *biriktirilgan* toolbar — global amallar, *suzuvchi* — kontekst
amallari. Rang sxemasi ikki: **past urgʻu** (eʼtibor kontentda) va
**yuqori urgʻu** (eʼtibor boshqaruvda). Har element ≥ 48 dp, «koʻp
boshqaruv qoʻshmang». Sinf ekrani uchun past urgʻu toʻgʻri.

**R318 — Buyruq qoʻl turgan joyda.** Katta doska uchun tadqiqot
prototipida buyruqlar ekran chetida emas, foydalanuvchi qoʻli turgan
joyda chiqadi — tanlov va amal bitta harakat. Bizning kontekst panel
shu naqsh. ⚠️ Dastlab «sensorli panelda u vidjetning ostida boʻlishi
kerak» deb yozilgan edi — **notoʻgʻri**, R328 tuzatadi: ostidagi panel
qoʻl va bilak ostida qoladi. Panel vidjetning **ustida** qoladi.

### Ergonomika va idrok

**R319 — Yetish balandligi.** Interaktiv panel oʻrnatish tavsiyasi
(AVIXA): pastki chet poldan ≤ 40–48″ (≈ 100–120 sm), kichik sinflarda
≈ 90 sm. 16:9 panel balandligi 75″ da ≈ 93 sm, 86″ da ≈ 107 sm →
tepasi **≈ 1,83 m / 1,97 m**. Bizning uy · toʻliq ekran · menyu
tugmalari shu chiziqda: 160 sm boʻyli oʻqituvchi qoʻlini toʻliq
choʻzadi, bola yetmaydi. Qulay zona ≈ 1,0–1,55 m; pastki panel
≈ 0,9–1,0 m (bel balandligi — yetadi, lekin egilishga yaqin).

**R320 — Katta sensorli ekran (NN/g).** Foydalanuvchi qoʻl uzunligida
turadi va bosh buradi; sudrash va chimchilash charchatadi («gorilla
qoʻli»); tez-tez ishlatiladigan nishon katta, kam ishlatiladigani
minimal; ekran tartibsizligini kamaytirish.

**R321 — Nishon oʻlchami jismoniy, px emas.** Kattalar ≥ 1 × 1 sm,
9 yoshgacha bolalar ≥ 2 × 2 sm (NN/g); 6–8 yosh sudrashda qiynaladi →
bitta amalga ikki yoʻl (bosish ham, sudrash ham). 1 CSS px:

| Qurilma | CSS kenglik | 1 px | 44 px | 16 px |
|---|---|---|---|---|
| 75″ panel, FHD CSS | 1920 | 0,86 mm | 3,8 sm | 1,4 sm |
| 65″ panel, FHD CSS | 1920 | 0,75 mm | 3,3 sm | 1,2 sm |
| 86″ panel, 4K, 100% | 3840 | 0,50 mm | 2,2 sm | **0,8 sm** |
| Proyektor 2 m, noutbuk | 1366 | 1,46 mm | 6,4 sm | 2,3 sm |
| Planshet 10,9″ | 820 | 0,28 mm | 1,2 sm | **0,4 sm** |

Xulosa: hozirgi 40 px tugma panelda yetarli, **16 px tutqich esa
planshetda va 4K panelda yetmaydi** — koʻrinishi kichik qolsa ham bosish
maydoni 44 px boʻlsin.

**R322 — Ikona + doim koʻrinadigan yozuv (NN/g).** Koʻp ikonalarning
umumiy maʼnosi yoʻq; yozuv hoverga yashirilmaydi — sensorli ekranda
hover yoʻq. Bizning kontekst panel nomlari faqat tooltipʼda.

**R323 — Bezak chalgʻitadi.** Fisher, Godwin, Seltman (2014,
*Psychological Science*): bezakli sinfda bolalar koʻproq chalgʻidi,
vazifadan tashqari koʻproq vaqt oʻtkazdi va kamroq oʻrgandi. Doska
uchun: sinfga koʻrinadigan boshqaruv minimal, vidjet tugmalari faqat
tanlanganda.

**R324 — Proyeksiya yuvilishi.** Atrof yorugʻligi qorani kulrangga
koʻtaradi, kontrast va toʻyinganlik tushadi; boʻgʻiq ranglar bir-biriga
qoʻshiladi. Toʻyingan, qarama-qarshi yuza tanlanadi. Bizning vidjet
kartalari toʻq fonda 8% oq, och fonda pastel (L ≈ 0,93) — yorugʻ
sinfda fondan ajralmaydi.

**R325 — Oʻqish masofasi.** AV muhandisligi qoidasi: har 4,5 m ga
kamida 25 mm harf (bu minimal, qulay emas). 7 m dagi oxirgi qator uchun
≈ 39 mm harf → bosh harf ≈ 0,7 em deb olinsa: proyektor (1366, 2 m)
≈ 38 px, 75″ ≈ 64 px, 65″ ≈ 74 px, 86″ 4K ≈ 112 px. Sinfga
qaratilgan matn `cqw` da boʻlishi (hozir shunday) toʻgʻri.

**R326 — Rang yolgʻiz maʼno tashimaydi.** Qizil-yashilni farqlamaslik:
Yevropa kelib chiqishli erkaklarda ~8%, Sharqiy Osiyoda 4–6,5%
(2025 sharhi); WCAG 1.4.1. 30 kishilik sinfda ~1 bola. Svetofor holati
hozir faqat rangda.

**R327 — Vizual taymer.** Tashqi belgisiz vaqtni baholash 20–40% xato
(⚠️ manba — ishlab chiqaruvchi, ehtiyotkorlik bilan). Kamayib boruvchi
disk raqamdan tezroq idrok qilinadi; taymer «neytral hakam» boʻlib,
oʻqituvchi oʻrniga gapiradi.

**R328 — Qoʻl yopishi.** Vogel va hamkorlar (CHI 2009/2010): qalam, qoʻl
va bilak 12″ ekranning **47% gacha** qismini yopadi; oʻng qoʻlda yopilgan
joy teginish nuqtasidan **pastda va oʻngda**. Vertikal doskada bilak
pastdan keladi — nuqtaning pasti yopiladi. Xulosa: kontekst panel
vidjetning ustida, sozlama kartasi yon tomonda (tenglikda chapda),
natija va xabarlar teginish nuqtasi ostiga qoʻyilmaydi.

**R329 — Standart hal qiladi.** Bir necha yuz foydalanuvchining matn
muharriri sozlamalari oʻrganilganda 5% dan kami **birorta ham**
sozlamani oʻzgartirgan (J. Spool, 2011; J. Nielsen «Default dominance»).
Foydalanuvchi standartni ishlab chiqaruvchining tavsiyasi deb qabul
qiladi. Xulosa: tanlanadigan uslub boʻlsa ham, standart uslub — 95%
oʻqituvchi koʻradigan yagona koʻrinish; eng kuchlisi boʻlishi shart.

---

## 2. Hozirgi Doska auditi (2026-09-25, `main` #204)

| # | Daraja | Muammo | Joy |
|---|---|---|---|
| A1 | Jiddiy | Bekor qilish yoʻq (storeʼda tarix yoʻq, klaviaturada faqat `Esc`) | `lib/doska/store.ts`, `InteractionLayer.tsx` |
| A2 | Jiddiy | «Tozalash» qoʻshish tugmalari yonida, bir bosishda ekran boʻshaydi, qaytarilmaydi | `WidgetBar.tsx`, `clearScreen` |
| A3 | Jiddiy | Taymerga vaqt qoʻyib boʻlmaydi (5:00 + «+1»); tugash ovozi va disk yoʻq | `widgets/TimerWidget.tsx` |
| A4 | Jiddiy | Yagona sozlama naqshi yoʻq: taymer — ichki tugma, gʻildirak — orqa tomon, soatda `showSeconds` bor, UI yoʻq | registry + vidjetlar |
| A5 | Jiddiy | «Keyingi ekran» tugmasi yoʻq — faqat «oldingi» va «+» | `DoskaShell.tsx` |
| A6 | Jiddiy | Uy / toʻliq ekran / menyu tepada — panelda ≈ 1,8–1,9 m (R319) | `DoskaShell.tsx` |
| A7 | Oʻrta | Vidjet tugmalari sinfga doim koʻrinadi (R323) | `TimerWidget.tsx` |
| A8 | Oʻrta | Kontekst panel nomlari faqat tooltipʼda (R322) | `WidgetToolbar.tsx` |
| A9 | Oʻrta | Vidjet yuzasi proyektorda yuviladi (R324) | `globals.css` `--doska-*` |
| A10 | Oʻrta | Svetofor holati faqat rangda (R326) | `TrafficLightWidget.tsx` |
| A11 | Oʻrta | Qulflash yoʻq (R311) | — |
| A12 | Mayda | Bir sirtda ikki ikona oilasi: panelda Solar, vidjet ichida lucide | `TimerWidget.tsx`, `WheelWidget.tsx` |
| A13 | Mayda | 16 px tutqich planshetda ≈ 4,4 mm (R321) | `SelectionOverlay.tsx` |
| A14 | Mayda | Taymer, svetofor, menyu matnlari tarjima kalitisiz | `TimerWidget.tsx`, `TrafficLightWidget.tsx`, `DoskaMenu.tsx` |

---

## 3. UX yadrosi — hamma uslubga umumiy (qabul qilindi)

Vosita oltita lahzadan oʻtadi; har biriga bitta qoida.

| Lahza | Qoida |
|---|---|
| **Topish** | Panelda ≤ 9 ta vosita + «Hammasi» (toifali oyna: Vaqt · Sinf · Yozuv · Oʻyin · Media). Ikona ostida doim yozuv. Panelni oʻqituvchi tuzadi (R132). |
| **Qoʻyish** | Bir bosish → boʻsh joyga tushadi va tanlanadi; birinchi marta tez sozlash ochiq. Sudrab tashlash — ixtiyoriy ikkinchi yoʻl (R321). |
| **Sozlash** | Yagona joy: kontekst paneldagi «Sozlash» yoki `S`. Tartib: Mazmun → Koʻrinish → Ovoz. Saqlash tugmasi yoʻq, `Esc` yopadi. Vidjet faqat sozlama **sxemasini** eʼlon qiladi, oynani umumiy komponent chizadi. |
| **Ishlatish** | Asosiy amal — ALOHIDA, doim koʻrinadigan nishon: taymerda ▶/⏸ tugmasi, gʻildirakda doiraning oʻzi, svetoforda chiroqlar. U hech qachon vidjetni tanlamaydi va sudramaydi — sinf ekranida tanlov ramkasi chiqmaydi, barmoq sal siljisa ham amal bajariladi. Ikkilamchi tugmalar faqat tanlanganda (R323). |
| **Boshqarish** | Asosiy amal nishonidan tashqari istalgan joyidan tanlash va sudrash; sudrash ostonasi sichqonchada 3 px, barmoq/qalamda 10 px (teginish «suzadi»); sudrashdan keyingi `click` yutiladi. Qulflash, «Markazga», qatlam; strelkalar bilan siljitish (R311, R313). |
| **Olib tashlash** | Tasdiq oynasi yoʻq — 6 soniyalik «Qaytarish» xabari + `Ctrl+Z` (R312). «Ekranni tozalash» — menyuda, xuddi shunday qaytariladi. |

Umumiy qoidalar:

- **Yetish zonasi** — oʻqituvchi boshqaruvi ekranning pastki 45% ida yoki
  yon chetda, oʻrtadan pastda; yuqori burchaklar boʻsh (R314, R319).
- **Bosish maydoni ≥ 44 px** — panel tugmasi ≥ 56, kontekst ≥ 44,
  tutqich koʻrinishi kichik boʻlsa ham maydoni 44 (R321).
- **Rang + belgi + soʻz** — hech bir holat faqat rangda emas (R326).
- **Sinf matni oxirgi qatordan oʻqilsin** — ≈ 4 sm harf, `cqw` bilan (R325).
- **Diqqat tugmalari** — `1` parda, `2` qoʻngʻiroq (R313) — 2-bosqichda.
- **Bitta ikona oilasi** — panelda ham, vidjet ichida ham (A12).

---

## 4. Vizual uslublar (Q1 — oʻqituvchi tanlaydi)

Uchala variant §3 ga tayanadi. Q1 dan keyin ular **tanlanadigan
uslubga** aylandi: koʻrinish farqi uslubda qoladi, joylashuv va
xatti-harakat farqi esa §3 va Q2–Q3 ga koʻra bittaga keltirildi
(sozlama — hammada yonidagi karta; kontekst panel — hammada ustida;
C ning yon relsalari — «Panel joyi» sozlamasi). Jonli maketlar (oʻqituvchi/sinf koʻrinishi,
proyektor simulyatsiyasi): Claude artifact — «Doska dizayn
yoʻnalishlari» (shaxsiy havola, egasi orqali).

| | A · Sokin sahna | B · Oʻyinchoq | C · Magnit doska |
|---|---|---|---|
| Gʻoya | Boshqaruv bitta grafit materialda, faqat pastki qatorda; vidjetlar toʻyingan bir tekis blok + oq matn | Qalin siyoh kontur, qattiq soya, rangli plitkalar; sozlama — kartaning orqasi | Asboblar chap/oʻng relsada (≈ 1,0–1,6 m); vidjet — magnitli qogʻoz, tus faqat magnitda |
| Boshqaruv | Grafit, 1px oq/10 chegara, 64 px | Oq patnis, 3 px kontur, 56 px plitka | Toʻq relsa, 72 px element |
| Sozlama | Vidjet yonidagi karta (hammasida, Q2) | ~~Karta aylanadi~~ | ~~Pastki varaq~~ |
| Kontekst | Vidjet ustida, yozuvli | Vidjet ustida, yozuvli | ~~ostida~~ → ustida (R328) |
| Shrift | Onest | Nunito | Rubik |
| Kuchli | Proyektorda eng aniq; chalgʻitmaydi; 20+ vositaga oʻsadi | 1–6-sinf uchun eng quvnoq | Interaktiv panel uchun eng ergonomik |
| Xavf | Kichik sinfga quruqroq | Vizual shovqin (R323); yuqori sinfga bolalarcha; panel ekranning ~13% i | 4:3 da relsalar joy yeydi; sichqonchada odatiy emas |
| Mavjud qarorlar | «Panel jim» ✓; panel 40→64 px, oq→grafit (§2 qayta yoziladi) | «Panel jim» ✕; «panelga toʻyingan idish hech qachon» ✕ | «Panel jim» ✓; «blur soya yoʻq» ✕; tus kartada emas, magnitda |

**Standart — Sokin (A)** (R329). Qolgan ikkitasi tanlov sifatida.
Taymerdagi vizual disk va svetofordagi belgi+yozuv uslubga bogʻliq emas
— ular vidjet mazmuni, hamma uslubda bor; uslub faqat ularning
koʻrinishini (masalan Oʻyinchoqda yuz ifodasi) oʻzgartiradi.

---

## 5. Bosqichlar

1. **Xavfsizlik va yetish — QURILDI** (branch `maxdum/doska-ux-1-bosqich`):
   - qaytarish tarixi storeʼda (`past`/`future`, 50 qadam, saqlanmaydi);
     sudrash va strelkalar ketma-ketligi — bitta qadam (`beginGesture`);
     vidjetning ichki holati tiklanmaydi — ishlayotgan taymer orqaga
     sakramaydi (`keepLiveState`);
   - oʻchirish / ekranni tozalash / ekranni oʻchirish — tasdiqsiz, 6 s
     «Qaytarish» xabari (`DoskaNotice`);
   - «Tozalash» vidjet panelidan olindi (menyuda qoldi);
   - butun boshqaruv pastki qatorda: chap — bekor qilish/qaytadan
     bajarish, oʻng — ‹ n/N › + · toʻliq ekran · menyu; bosh sahifa
     havolasi menyuda; «keyingi ekran» qoʻshildi;
   - kontekst panelda yozuvli tugmalar (`BarTextButton`) va ekran
     chetiga qisish;
   - yorliqlar (`useDoskaShortcuts`): `Ctrl/⌘+Z`, `Ctrl+Y`/`⌘+Shift+Z`,
     `Ctrl/⌘+D`, `Delete`, strelkalar (`Shift` — 10 px), tanlovsiz ← →
     ekranlar, `Esc`, `F`, `B`;
   - tutqich bosish maydoni 44 px (koʻrinishi 16 px);
   - yangi matnlar 7 tilda.
2. **Yagona sozlama — QURILDI** (oʻsha branch):
   - `WidgetSettingsCard` — vidjet yonidagi karta, Q2 joylashuv qoidalari
     bilan; `SettingsFields` — umumiy maydonlar (tayyor variantlar,
     ± qadam, tumbler; hammasi ≥ 44 px, klaviaturasiz);
   - vidjet → sozlama: `widgets/index.ts` dagi `WIDGET_SETTINGS` (soat,
     taymer, svetofor, shakl) va `INLINE_SETTINGS` (gʻildirak);
     reyestrga React kirmadi, faqat `openSettingsOnAdd` bayrogʻi;
   - taymer: ▶/⏸ tugmasi (tugaganda ↻) — tanlamaydi, sudramaydi; yuzni
     bosish — tanlaydi (ishlab turgan taymer toʻxtamaydi); kartada
     1/3/5/10/15 daqiqa va ± (2 daqiqagacha 30 s qadam), disk / raqam /
     ikkalasi, tugash ovozi (`sounds.ts`, Web Audio); qoʻyilganda karta
     darhol ochiladi; «Qaytadan» va «+1» faqat tanlanganda;
   - svetofor: rang + belgi + soʻz, yozuvni oʻchirish mumkin;
     standart oʻlcham 160×380 → 180×420;
   - soat: soniyalar; shakl: figura almashtirish va harflar;
   - kontekst panel: Sozlash · Nusxa · Qulflash · Markazga │ Oʻchirish
     («Oldinga» olib tashlandi — vidjetni bosish uni oldinga chiqaradi);
   - qulf (`DoskaWidget.locked`): sudralmaydi, oʻlchanmaydi, oʻchirilmaydi,
     tozalashdan ham omon qoladi; tutqich oʻrnida qulf belgisi;
   - «Markazga» (`spotlightId`): aynan shu vidjet ekran oʻrtasida
     kattalashadi (nusxa emas — taymer ikki marta sanamasin), parda,
     pastda «Kichraytirish», `Esc`;
   - parda (`1`, menyu) va qoʻngʻiroq (`2`, menyu); menyu 7 tilga
     oʻtkazildi (A14), pastdan yuqoriga ochiladi;
   - yorliqlar: `S` sozlama; `Esc` zanjiri — markaz → karta → tanlov;
   - gʻildirak: roʻyxat tomoni «Sozlash»/`S` bilan ochiladi (joyida
     qoldi — ismlar mazmun, sinf roʻyxati 320 px ga sigʻmaydi);
     burchakdagi qalam va ovoz tugmalari olindi; aylantirish tanlamaydi
     va sudramaydi — vidjet kartaning chetidan tanlanadi;
   - z-qatlamlar: «Markazga» va parda mavjud tokenlardan hosil qilinadi
     (`lib/doska/layers.ts`) — umumiy `globals.css` tahrirlanmadi;
   - kod koʻrigidan keyin: sensorda sudrash ostonasi 10 px; sudrashdan
     keyingi `click` yutiladi; strelkalar vidjet ichidagi fokusda
     vidjetniki (taqdimot), vidjet oʻz toʻliq ekranida boʻlsa Doska
     yorliqlari jim; bosib turilgan tugma takrorlanmaydi (strelkadan
     tashqari); «Markazga» tanlovni ham yopadi; qulflangan vidjeti bor
     ekran oʻchirilmaydi (menyuda sababi bilan); kontekst panel va
     sozlama kartasining joyi umumiy `usePinnedPosition` bilan, karta
     panelni chetlab oʻtadi; gʻildirak va Doska ovozi bitta
     AudioContextʼda (`stage/audio-context.ts`);
   - changelog: bitta umumiy yozuv `doska-qulay-boshqaruv` (1+2-bosqich).

   Keyinga qoldi: «Barcha ekranlarda» (pin) — ekranlar toʻplami serverga
   koʻchgach; gʻildirak roʻyxat tomonidagi lucide ikonalar (A12).
3. **Uslublar — QURILDI** (branch `maxdum/doska-uslublar`):
   - token qatlami `src/styles/doska.css`: uchta uslub bloki (Sokin —
     standart, Oʻyinchoq, Doska) va materiallar — `.doska-ctl`
     (boshqaruv), `.doska-sheet` (karta, menyu, oynalar), `.doska-card`
     + `data-card` (vidjet), `.doska-tool` (panel tugmasi),
     `.doska-selection`/`.doska-handle`, `.doska-ink`, `.doska-digits`;
     komponentlar uslubni bilmaydi. Doska boʻlimi `globals.css` dan shu
     faylga koʻchdi (oʻrnida bitta `@import`); u yerdagi yashil
     `[data-product="doska"]` qoidasini `products.css` baribir
     bosib qoʻyardi — u olib tashlandi;
   - uslub `<html data-doska-style>` va sahna shriftlari klasslari bilan
     (`DoskaShell`) — portal qilingan menyu va oynalar ham uslubni oladi;
     shriftlar: Sokin — Onest, Oʻyinchoq — Nunito, Doska — Rubik (kirill
     bilan, preloadsiz);
   - sozlama alohida store `lib/doska/prefs.ts` (`skipHydration`, mount'dan
     keyin, lekin birinchi chizishdan oldin oʻqiladi; `localStorage`
     yopiq boʻlsa standart bilan ishlaydi); qaytarish tarixiga kirmaydi;
   - «Koʻrinish» — menyu ichidagi boʻlim: uslub (haqiqiy tokenlar bilan
     chizilgan namuna) va «Panel joyi» (past / chap / oʻng); yon relsa
     oʻrtadan pastda, panel oynalari relsa tomonidan ochiladi (`dock.ts`);
   - «Hammasi» oynasi (`ToolCatalog`): toifalar Vaqt · Sinf · Yozuv ·
     Media, qator — ekranga qoʻyish, qadash belgisi — panelga; panelda
     ≤ 9 vosita, tartib doim `TOOL_ORDER`; tuzmagan oʻqituvchi standart
     panelni koʻradi;
   - nishonlar: panel tugmasi 64 px (butun tugma bosiladi), ikonali
     tugma 48 px, kontekst panel 44 px — hamma uslubda bir xil;
   - raqamlar uslub shriftida, har raqam `1ch` qutida (`Digits`);
     taymer diski kartaning urgʻu rangida; toʻq fonda endi faqat
     idishsiz matn boʻrga oʻtadi — shaffof karta proyektorda yuvilardi (A9);
   - bitta ikona oilasi: Doskada lucide qolmadi — gʻildirak, fon
     tanlash, mehmon eslatmasi Solarʼga oʻtdi (A12);
   - proyektor sinovi: `node scripts/doska-projector-check.mjs` — 34
     juftlik, hammasi oddiy ekranda ≥ 4,5:1, proyektorda ≥ 3:1 (R324);
   - matnlar 7 tilda; changelog yozuvi `doska-uslublar`.

   Keyinga qoldi: «aqlli standart» (§6); panelni sudrab tartiblash;
   uslubni toʻplam boʻyicha saqlash.

---

## 6. Qarorlar

Toʻrttala savol yopildi — §0 (Q1–Q4). Ochiq qolgani: «aqlli standart»
(kirgan oʻqituvchining sinflari 1–4-sinf boʻlsa Oʻyinchoq). 3-bosqichda
QURILMADI: Doska hozir mehmon rejimida va oʻqituvchining sinflarini
bilmaydi; sinf roʻyxati Doskaga ulanganda (ekranlar serverga koʻchishi
bilan) koʻriladi. Qoida oʻshanda ham faqat STANDARTni tanlaydi —
oʻqituvchi bir marta oʻzi tanlagan uslub ustun.

---

## Manbalar

- Fisher A. V., Godwin K. E., Seltman H. (2014). *Visual Environment,
  Attention Allocation, and Learning in Young Children.* Psychological
  Science. <https://journals.sagepub.com/doi/abs/10.1177/0956797614533801>
- NN/g — Icon Usability. <https://www.nngroup.com/articles/icon-usability/>
- NN/g — Design for Kids Based on Their Stage of Physical Development.
  <https://www.nngroup.com/articles/children-ux-physical-development/>
- NN/g — Very Large Touchscreen UX Design.
  <https://www.nngroup.com/articles/very-large-touchscreen-ux-design/>
- WCAG 2 — 1.4.1 Use of Color.
  <https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-without-color.html>
- Rang koʻrligining global tarqalishi (2025).
  <https://www.mdpi.com/2227-9032/13/16/2031>
- Interaktiv panel oʻrnatish balandligi (AVIXA tavsiyasi).
  <https://touchwall.us/blog/interactive-flat-panel-display-buyers-guide-k12-schools-specs-mounting-av-it-setup/>
- Masofa va shrift oʻlchami. <https://www.extron.com/article/videowallfontsize>
- Vogel D., Balakrishnan R. (2010). *Occlusion-Aware Interfaces.* CHI.
  <https://dl.acm.org/doi/abs/10.1145/1753326.1753365>; Vogel va b. (2009).
  *Hand Occlusion with Tablet-sized Direct Pen Input.* CHI.
  <https://dl.acm.org/doi/10.1145/1518701.1518787>
- J. Nielsen — Default Dominance. <https://jakobnielsenphd.substack.com/p/defaults>
- Proyeksiya va atrof yorugʻligi.
  <https://www.uking-online.com/blogs/stage-lighting-dmx-knowledge-hub/stop-projection-washout-on-screens>

