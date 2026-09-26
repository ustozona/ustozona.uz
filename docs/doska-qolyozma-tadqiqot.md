# Doska — qoʻlda yozish (qalam) tadqiqoti

> **Holat (2026-09-26):** tadqiqot tugadi, §6 dagi savollar tavsiya
> boʻyicha hal qilindi; **0-qadam va 1–3-bosqichlar qurildi** (§7–§9).
> Kaft oʻchirgichi haqiqiy panel natijasini, server sinxroni esa
> ekranlarning serverga koʻchishini kutmoqda.
> Branch: `maxdum/doska-qolyozma`, `maxdum/doska-qolyozma-2`,
> `maxdum/doska-qolyozma-3`.
>
> Referens topilmalari **R330–R341** (oldingi raqamlar
> [doska-ux-tadqiqot.md](./doska-ux-tadqiqot.md) da, R310–R329).
> Mahsulot nomlari yozilmaydi — naqshning mohiyati tasvirlanadi
> (AGENTS.md). Standart, ilmiy maqola va brauzer hujjatlari manbasi
> bilan keltiriladi.

Asosiy xulosa bitta jumla: **sinf doskasining birinchi vazifasi —
yozish; qolgan vidjetlar uning atrofida.** Hozirgi Doska vidjetlar
toʻplami, lekin unga qalam bilan bir soʻz ham yozib boʻlmaydi.
Interaktiv panel xarid qilinishining asosiy sababi ham aynan shu.

---

## 1. Qalam nima uchun «eng asosiy»

- Matematika, fizika, til darsida oʻqituvchi misolni **jonli yechadi** —
  tayyor matn emas, qadam-baqadam paydo boʻlayotgan yozuv. Matn vidjeti
  buning oʻrnini bosmaydi: formula, chizma, strelka, tagiga chizish
  klaviaturada yozilmaydi.
- Interaktiv panel (IFP) ishlab chiqaruvchilarining hammasi qurilmani
  birinchi navbatda «yozuv sirti» sifatida sotadi: panel bilan birga
  kelgan oʻz doska ilovasi — standart ochiladigan dastur. Oʻqituvchi
  Doskamizga oʻtishi uchun qalam **kamida oʻsha darajada** boʻlishi kerak,
  aks holda u yozish uchun panelning oʻz ilovasiga qaytadi va vidjetlar
  ham yoʻqoladi.
- Taqdimot, gʻildirak, taymer ustiga **belgi qoʻyish** (aylantirish,
  tagiga chizish, strelka) — sinfga «qayerga qarash»ni koʻrsatishning eng
  tez yoʻli.

---

## 2. Jahon amaliyoti — topilmalar

### R330 — Kechikish: qalam uchidan siyohgacha < 50 ms

Qalam bilan yozishda kechikish sichqonchadagidan ancha sezgir: siyoh
qalam uchidan «ajralib» qolsa yozuv qoʻpol chiqadi va oʻqituvchi
sekinlashadi. Tadqiqotlar: sudrashda bir necha millisekundlik farq ham
seziladi (Ng va hamkorlar, UIST 2012), yozishda sezish chegarasi
≈ 50 ms atrofida (Annett va hamkorlar, Graphics Interface 2014).
Brauzerda erishiladigan real maqsad — **≤ 1 kadr kechikish** chizishda,
umumiy qalam→piksel ≈ 30–50 ms.

Brauzer vositalari (kuchliligidan tartib bilan):

| Vosita | Nima beradi | Cheklov |
|---|---|---|
| `PointerEvent.getCoalescedEvents()` | Qalam 120–240 Hz da nuqta beradi, brauzer esa kadrga bitta `pointermove` yuboradi — oraliq nuqtalar shu yerda. Ularsiz tez yozuvda chiziq «siniq» boʻladi. | Hamma zamonaviy brauzerda bor. |
| `requestAnimationFrame` da chizish | Har `pointermove` da emas, kadrda bir marta — ortiqcha ish yoʻq. | — |
| `getPredictedEvents()` | Keyingi bir necha ms ning taxminiy nuqtalari — «dum» chiziladi va keyingi haqiqiy nuqtada oʻchiriladi. | Faqat Chromium; taxmin notoʻgʻri boʻlsa dum titraydi. |
| Canvas `desynchronized: true` | Kanvas DOM kompozitsiyasini chetlab ekranga chiqadi. | **Shaffof kanvasda deyarli foydasiz** — ustida/ostida DOM boʻlmasligi kerak. Bizning siyoh qatlami vidjetlar ustida, shaffof → tegishli emas. |
| Delegated Ink Trail (`navigator.ink.requestPresenter`) | Oxirgi chizilgan nuqtadan qalam uchigacha boʻlgan boʻlakni OS kompozitori chizadi. | Faqat Chromium, eksperimental; boshqa brauzerlar qiziqish bildirmagan. Faqat **qoʻshimcha** (feature-detect) sifatida. |

Xulosa: asos — coalesced + rAF + «quruq/hoʻl» ikki qatlam (§4.3).
Predicted va Ink API — 2-bosqichda, borligini tekshirib.

### R331 — Siyoh shakli: chiziq emas, kontur

Oddiy `lineTo` chizigʻi bir xil qalinlikda, boʻgʻinlarda sinadi va
«kompyuterda chizilgan» koʻrinadi. Zamonaviy yondashuv: nuqtalardan
**silliqlangan kontur (poligon)** quriladi va toʻldiriladi —

- bosim boʻlsa (faol qalam) — qalinlik bosimdan;
- boʻlmasa (barmoq, passiv qalam, sichqoncha) — **tezlikdan simulyatsiya**:
  sekin — qalinroq, tez — ingichka, xuddi haqiqiy ruchka kabi;
- uchlari ingichkalashadi (taper), burchaklar keskin qoladi;
- «streamline» — qoʻl titrashini yutadi, lekin kechikish qoʻshadi
  (qiymat kichik boʻlishi kerak).

Bu algoritm ochiq kodda, tayyor kutubxona sifatida mavjud (MIT, ≈ 4 KB,
bogʻliqliksiz, sof funksiya: nuqtalar → kontur; paket nomi —
`package.json` da). Oʻzimiz yozish ham
mumkin (Catmull-Rom + normal boʻyicha kenglik), lekin burchak va
uchlardagi nozik holatlar koʻp — tayyor, sinalgan funksiya arzonroq.

### R332 — Qurilmani farqlash: qalam / barmoq / kaft

Panel ishlab chiqaruvchilarining oʻz ilovalarida asosiy qulaylik:
**qalam yozadi, barmoq suradi, kaft oʻchiradi** — rejim almashtirmasdan.

⚠️ Brauzerda bu **qurilmaga bogʻliq**:

- `pointerType === "pen"` faqat faol/elektromagnit qalamda (planshet,
  Windows noutbuk-transformer, baʼzi panellar). Koʻp IFP (infraqizil
  ramka) passiv qalamni ham, barmoqni ham `"touch"` deb yuboradi.
- Kaftni tanish — kontakt oʻlchami (`PointerEvent.width/height`). IR ramka
  soya oʻlchamini oʻlchaydi, lekin uni brauzerga yetkazish drayverga
  bogʻliq: baʼzida hamma teginish 1×1 keladi.
- Bosim (`pressure`) koʻp panelda doim 0,5 (yaʼni «maʼlumot yoʻq»).

Xulosa: **aniq rejim (tugma) — asos**, avtomatik farqlash — ustiga
qoʻshimcha. Maktabdagi haqiqiy panellarda nima kelishini bilmay turib
evristikaga tayanib boʻlmaydi → §5, 0-qadam: sinov sahifasi.

### R333 — «Qalam rejimi»: qalam koʻrilgach barmoq chizmaydi

Keng tarqalgan naqsh: sahifada birinchi marta `pointerType === "pen"`
kelsa, ilova «qalam rejimi»ga oʻtadi — shundan keyin chizishni faqat
qalam qiladi, barmoq va kaft teginishlari chizmaydi (kaft yozuvni
buzmaydi), barmoq esa surish/tanlash uchun qoladi. Rejimni oʻchirish
imkoni boʻlishi shart (baʼzi foydalanuvchilar barmoq bilan ham yozadi).

Qoʻshimcha: qalam ekranga tekkanda OS koʻpincha barmoq hodisalarini
brauzerga **umuman yubormaydi** — bu OS darajasidagi kaft rad etish.
Demak «ikkinchi barmoq bilan modifikator» kabi gʻoyalar qalam bilan
ishlamaydi.

### R334 — Oʻchirgich

- Qalamning orqa uchi / oʻchirgich tugmasi Pointer Events standartida:
  `button === 5`, `buttons === 32` (W3C Pointer Events). Qalamni
  aylantirib oʻchirish — qurilmasi borlar uchun bepul qulaylik.
- Ikki xil oʻchirgich: **butun chiziq** (tekkan chiziq toʻliq oʻchadi —
  sinfda eng koʻp kerak, tez va aniq) va **qisman** (piksel kabi, chiziq
  boʻlinadi — murakkabroq). Taʼlim ilovalarida ikkalasi ham bor; birinchi
  navbatda butun chiziq yetadi.
- «Hammasini oʻchirish» — alohida amal, qaytarib boʻladi (R312 bilan bir
  xil: tasdiq oynasi yoʻq, «Qaytarish» xabari bor).

### R335 — Taʼlim doskalaridagi standart asboblar toʻplami

Sinf uchun doska ilovalari deyarli bir xil yadroga keladi:

| Asbob | Vazifasi | Izoh |
|---|---|---|
| Qalam | asosiy yozuv | 3 qalinlik, 6–8 rang |
| Marker (highlighter) | ustidan boʻyash | yarim shaffof, keng, matnni yopmaydi |
| Oʻchirgich | chiziqni olib tashlash | butun chiziq → keyin qisman |
| Lazer koʻrsatkich | vaqtincha koʻrsatish | chiziq 1–2 s da soʻnadi, **saqlanmaydi**, tarixga yozilmaydi |
| Tekislash | toʻgʻri chiziq / shakl | §R336 |
| Chizgʻich, transportir | geometriya | keyingi bosqich |

Ranglar kam va katta: proyektorda yaqin ranglar farqlanmaydi (R324).
Toʻq (boʻr) fonda standart siyoh oq boʻlishi kerak — qora siyoh
koʻrinmaydi.

### R336 — «Chiz va ushlab tur» → tekislash

Chiziq chizib, oxirida qalamni ~0,5 s qimirlatmay ushlab tursa, u
toʻgʻri chiziqqa (yoki aylana/toʻrtburchakka) aylanadi va qoʻyib
yuborilgunga qadar uzunligi/yoʻnalishi oʻzgartiriladi; burchak 15°/45°
ga yopishadi. Alohida «Chiziq» asbobini tanlash shart emas — oʻqituvchi
yozuvdan chiqmaydi. Matematikada koordinata oʻqi, jadval chizish uchun
juda kerak.

### R337 — Bir vaqtda bir necha yozuvchi

Panellar 10–20 teginish nuqtasini qoʻllaydi: ikki oʻquvchi doskaning
ikki chetida birga yozadi. Brauzerda har `pointerId` — alohida chiziq;
bu arzon va birinchi bosqichdan qoʻllanishi kerak (aks holda ikkinchi
barmoq birinchisining chizigʻini «tortib» ketadi).

### R338 — Mazmun ustiga yozish

Yozuv vidjetlar va taqdimot slaydi **ustida** boʻlishi kerak —
«shu yerga qarang» degan aylana taqdimot ustida chiziladi. Slayd
almashganda slaydning siyohi ham almashadi (siyoh slaydga tegishli).
Bu Doskada ikki darajada: ekran siyohi (1-bosqich) va taqdimot
slaydining siyohi (keyin).

### R339 — Qoʻl yopishi va asboblar joyi

R328 (Vogel va hamkorlar): yozayotgan qoʻl teginish nuqtasining pasti
va yon tomonini yopadi. Siyoh asboblari paneli yozuv joyida emas —
pastki panelda yoki yon relsada (R319 yetish zonasi); tanlangan rang va
qalinlik doim koʻrinib tursin (oʻqituvchi qaysi rangda yozayotganini
bilishi kerak).

### R340 — Saqlash hajmi

Qalam 120–240 Hz: 2 soniyalik chiziq ≈ 250–500 nuqta. Xom JSON
(`[123.4567, 456.789, 0.5]`) — chiziqqa 5–10 KB, dars davomidagi 300
chiziq — 2–3 MB. `localStorage` esa butun sayt uchun ~5 MB va har
yozuvda **butun deck** `JSON.stringify` qilinadi (store.ts).

Amaliyot: nuqtalarni soddalashtirish (Ramer–Douglas–Peucker, ~0,5 px
toleransda 70–90% nuqta ketadi, koʻzga farqi yoʻq), koordinatani butun
songa yaxlitlash, bosim boʻlmasa uni saqlamaslik. Natijada chiziq
≈ 0,3–1 KB. Katta hajmda — alohida kalit yoki IndexedDB.

### R341 — Chizishni tezlashtirish: «quruq» va «hoʻl» qatlam

Har kadrda hamma chiziqni qayta chizish 500+ chiziqda sekinlashadi.
Standart yechim — ikki kanvas: **quruq** (tugagan chiziqlar, faqat
chiziq qoʻshilganda/oʻchganda qayta chiziladi) va **hoʻl** (hozir
yozilayotgan chiziq, har kadrda). SVG (`<path>` har chiziqqa) ham
ishlaydi, lekin yuzlab chiziqda DOM ogʻirlashadi va oʻchirgich uchun
urilish tekshiruvini baribir oʻzimiz yozamiz.

---

## 3. Hozirgi Doska bilan toʻqnashuv nuqtalari

| # | Nuqta | Nima qilish kerak |
|---|---|---|
| T1 | Yagona dispatcher (R135, `InteractionLayer.tsx`) har bosishni vidjet tanlash/sudrashga yoʻnaltiradi | Chizish rejimida dispatcher **birinchi** siyohga beradi; vidjetlar tanlanmaydi |
| T2 | Vidjet ichidagi tugmalar (taymer ▶) chizish rejimida | Qalam rejimida vidjet ustidan ham yoziladi (R338); vidjetni ishlatish uchun «Tanlash»ga qaytiladi. Barmoq/qalam farqlansa — barmoq vidjetni ishlataveradi |
| T3 | `touch-action` hozir faqat vidjetda `none` | Chizish rejimida siyoh qatlamida `touch-action: none` — aks holda brauzer surish/zoom qiladi |
| T4 | Saqlash: butun deck bitta JSON, 350 ms kechiktirilgan yozuv | Siyoh ixcham formatda (R340); hajm oʻlchanadi; kerak boʻlsa alohida kalit |
| T5 | Tarix (`pushHistory`) — deck snapshot, 50 qadam | Har chiziq — bitta qadam; snapshot havola bilan saqlanadi, nusxa emas → xotiraga yengil |
| T6 | Toʻq fon (`data-bg-tone`) | Standart siyoh rangi fonga qarab: yorugʻda toʻq, toʻqda oq (boʻr) |
| T7 | «Markazga», parda, taqdimotning oʻz toʻliq ekrani | Bu rejimlarda siyoh qatlami yashirin / chizish oʻchiq; taqdimot toʻliq ekranida yozish — alohida (R338, keyin) |
| T8 | Koordinata — ekran pikseli | Vidjetlar bilan bir tizim → mos keladi. Ekran oʻlchami oʻzgarsa (noutbuk → proyektor) vidjetlar bilan birga bir xil siljiydi |
| T9 | «Ekranni tozalash» (`clearScreen`) | Siyohni ham tozalaydimi — qaror kerak (tavsiya: ha, bitta qadam bilan qaytariladi) |
| T10 | Klaviatura (`useDoskaShortcuts`) | `P` qalam, `E` oʻchirgich, `V`/`Esc` tanlash — mavjud yorliqlarga zid emas |

---

## 4. Yechim variantlari

### 4.1. Siyoh qayerda yashaydi (maʼlumot modeli)

**A. Siyoh = vidjet (`ink.v1`).** Har yozuv seansi — chegaralangan quti,
boshqa vidjetlar kabi tanlanadi, suriladi, qulflanadi.
+ Mavjud mexanizmlar (sudrash, qulf, nusxa, tarix) bepul.
− Doska «qutilar»ga boʻlinadi: vidjet ustidan yozib boʻlmaydi, qutidan
  tashqariga chiqqan yozuv kesiladi, oʻchirgich qutilar oraligʻida
  ishlamaydi. Oʻqituvchi uchun gʻalati.

**B. Ekran siyoh qatlami (`screen.ink: Stroke[]`).** Har ekranda bitta
shaffof qatlam, vidjetlar ustida; chiziqlar vektor sifatida saqlanadi.
+ Oddiy doska kabi: istalgan joyga, vidjet ustiga ham yoziladi.
+ Oʻchirgich, tozalash, tarix oddiy.
+ Ikki kanvas bilan tez (R341).
− Yozuvni guruh qilib surish yoʻq (keyin lasso bilan qoʻshiladi —
  vektor saqlangani uchun mumkin).

**C. Gibrid = B + keyinchalik lasso.** B bilan boshlanadi; chiziqlar
vektor boʻlgani uchun keyin lasso bilan belgilash, surish, rangini
oʻzgartirish, «vidjetga aylantirish» qoʻshiladi.

**Tavsiya: B (C ga ochiq).** Taʼlim doskalarining deyarli hammasi shu
naqshda: yozuv — sirt, vidjet — sirt ustidagi obyekt.

### 4.2. Kiritish rejimi

1. **Aniq rejim (asos).** Panelda «Qalam» tugmasi → chizish rejimi,
   ostida kichik siyoh paneli (qalam · marker · oʻchirgich · rang ·
   qalinlik · tozalash · «Tanlash»ga qaytish). Har qanday qurilmada
   ishlaydi — IR panelda ham.
2. **Avto qalam rejimi (R333).** Faol qalam aniqlansa: qalam har doim
   chizadi (rejim tanlanmagan boʻlsa ham), barmoq — vidjetlarni
   boshqaradi. Qalami bor qurilmada rejim almashtirishning oʻzi kerak
   boʻlmaydi.
3. **Kaft = oʻchirgich (R332).** Kontakt maydoni katta boʻlsa —
   oʻchirgich. Faqat sinov sahifasida qurilmalar maʼlumot berishi
   tasdiqlansa; standart oʻchiq.

**Tavsiya:** 1 + 2 birinchi bosqichda, 3 — sinovdan keyin.

### 4.3. Chizish texnologiyasi

| Variant | Tezlik | Murakkablik | Xulosa |
|---|---|---|---|
| SVG `<path>` har chiziqqa | 200 gacha yaxshi, keyin sekinlashadi | Oddiy | Prototip uchun |
| Canvas 2D, quruq + hoʻl (R341) | 1000+ chiziq 60 fps | Oʻrta (DPR, resize) | **Tavsiya** |
| WebGL | Eng tez | Yuqori | Bizning hajmga ortiqcha |

Kontur: ochiq kodli kontur kutubxonasi (R331). Kiritish: coalesced + rAF (R330).

### 4.4. Saqlash

Chiziq formati (tavsiya):

```ts
type InkStroke = {
  id: string;
  tool: "pen" | "marker";
  color: string;     // palitra kaliti, hex emas — uslub/fon almashsa moslashadi
  size: 1 | 2 | 3;   // qalinlik darajasi, piksel emas
  points: number[];  // [x0, y0, x1, y1, …] butun son, soddalashtirilgan
  pressure?: number[]; // faqat haqiqiy bosim kelganda
};
```

`screen.ink?: InkStroke[]` — ixtiyoriy maydon: eski saqlangan
ekranlar buzilmaydi (`locked` bilan bir xil naqsh). 1-bosqichda deck
ichida, hajm oʻlchanadi; 1 MB dan oshsa alohida kalit/IndexedDB.

---

## 5. Tavsiya etilgan bosqichlar

**0. Sinov sahifasi (yarim kun).** `/doska/sinov` — ekranga tekkan har
kontakt uchun `pointerType`, `pressure`, `width×height`, `pointerId`,
coalesced nuqtalar soni va chastotasini koʻrsatadi. Maktabdagi 2–3 xil
panelda ochib koʻriladi. Bu R332 dagi asosiy nomaʼlumni yopadi: kaft
oʻchirgichi va avto qalam rejimi haqiqiy qurilmada ishlaydimi.

**1. Asosiy qalam (MVP).**
- «Qalam» rejimi + siyoh paneli; `P` / `E` / `Esc`
- asboblar: qalam, marker, butun-chiziq oʻchirgich, «Siyohni tozalash»
- 6 rang (fonga mos standart), 3 qalinlik
- coalesced nuqtalar, rAF, quruq/hoʻl kanvas, kutubxona konturi,
  tezlikdan bosim simulyatsiyasi, haqiqiy bosim boʻlsa — undan
- bir necha yozuvchi (har `pointerId` alohida)
- qalam oʻchirgich tugmasi (`buttons === 32`), avto qalam rejimi
- har chiziq — bitta qaytarish qadami; ekran bilan saqlanadi
- 7 tilda matnlar

**2. Oʻqituvchi qulayliklari.**
- «Chiz va ushlab tur» → toʻgʻri chiziq / aylana / toʻrtburchak (R336)
- lazer koʻrsatkich (soʻnuvchi, saqlanmaydi)
- qisman oʻchirgich; kaft oʻchirgichi (0-qadam natijasiga koʻra)
- taqdimot slaydi ustiga yozish (siyoh slaydga bogʻlanadi)
- `getPredictedEvents` va Ink API — borligini tekshirib

**3. Kengaytma.**
- lasso: belgilash, surish, rang almashtirish
- chizgʻich / transportir
- ekranni PNG qilib saqlash / oʻquvchilarga yuborish
- server sinxroni (ekranlar serverga koʻchgach)
- qoʻlyozmani matnga aylantirish — alohida tadqiqot

---

## 6. Qarorlar (2026-09-26 — tavsiya qabul qilindi)

1. **Siyoh vidjetlar ustidami?** Tavsiya: ha (R338). Oqibati: chizish
   rejimida vidjet tugmalari ishlamaydi (barmoq/qalam farqlansa —
   barmoq bilan ishlaydi).
2. **«Qalam» tugmasi qayerda?** Tavsiya: vidjet panelining eng chap
   doimiy tugmasi (vidjet emas, rejim — panel tuzilmasidan tashqarida,
   yashirib boʻlmaydi); siyoh paneli uning ustida/yonida ochiladi.
3. **«Ekranni tozalash» siyohni ham oʻchiradimi?** Tavsiya: ha, bitta
   qadam. Siyohning oʻzini tozalash — siyoh panelida alohida.
4. **Pro cheklovi bormi?** Tavsiya: yoʻq — qalam doskaning asosi,
   mehmon rejimida ham ishlashi kerak.

---

## 7. Qurilgani (1-bosqich)

| Joy | Nima |
|---|---|
| `lib/doska/types.ts` | `InkStroke`, `DoskaScreen.ink?` (ixtiyoriy — eski ekranlar migratsiyasiz) |
| `lib/doska/ink.ts` | palitra kalitlari, qalinlik darajalari, bosim simulyatsiyasi, kontur (kutubxona, `streamline: 0`), oklch → rgba (kanvas notanish rangni jim rad etadi), RDP soddalashtirish (bosim — uchinchi oʻlcham), oʻchirgʻich urilishi; React/DOMsiz |
| `lib/doska/ink-tool.ts` | rejim (`null` · qalam · marker · oʻchirgʻich), rang, qalinlik, «Faqat qalam» (`penSeen` / `penOnly`, qayta oʻchiriladi); saqlanmaydi, tarixga kirmaydi |
| `lib/doska/store.ts` | `addStroke` (bitta qadam, chiziq BOSHLANGAN ekranga), `removeStrokes` (harakat boshida `beginGesture`), `clearInk` («Qaytarish» xabari), `clearScreen` siyohni ham tozalaydi; `saveFailed` — `localStorage` toʻlsa oʻqituvchi koʻradi |
| `components/doska/InkLayer.tsx` | quruq + hoʻl kanvas (+ marker oraligʻi), `getCoalescedEvents`, rAF, uzun chiziq boʻlaklarga muzlatiladi, ildizda capture-listener — hodisa toʻxtatilmaydi, `claimForInk` bilan belgilanadi (menyular yopiladi), oʻchirgʻich hodisada bir marta qoʻllanadi, ekran almashsa chiziq oʻz ekraniga saqlanadi, yozuvdan keyingi `click` yutiladi |
| `components/doska/InkBar.tsx` | yozish rejimida vidjet paneli oʻrnida: Tanlash │ Qalam · Marker · Oʻchirgʻich │ rang │ qalinlik │ Tozalash [│ Faqat qalam] |
| `components/doska/WidgetBar.tsx` | birinchi doimiy tugma — «Qalam» (rejim, vidjet emas) |
| `useDoskaShortcuts.ts` | `P` · `M` · `E` (qayta bosilsa — tanlash), `Esc` zanjirida markazdan keyin |
| `styles/doska.css` | `--doska-pen-*`, `--doska-marker-*` (toʻq fonda ochroq), `--z-doska-ink` |
| `/doska/sinov` | 0-qadam: kiritish sinovi va JSON hisobot |

Oʻlchov (sinov skripti): 1000 nuqtali aylana soddalashtirishdan keyin
40 nuqta, JSON 41 KB → 0,4 KB.

«Faqat qalam» qalam yozish rejimida birinchi marta yozganda yoqiladi va
siyoh panelida oʻchiriladi — tanlash rejimidagi qalam bosishi uni
yoqmaydi.

---

## 8. Qurilgani (2-bosqich)

| Joy | Nima |
|---|---|
| `lib/doska/types.ts` | `InkStroke.shape?` (`line` · `rect` · `ellipse`, ikki nuqta) va `InkStroke.anchor?` (`widgetId`, `page`, yozilgandagi vidjet eni) — ikkalasi ixtiyoriy, migratsiyasiz |
| `lib/doska/registry.ts` | `WidgetMeta.inkPage` — vidjetning hozirgi sahifasi; taqdimotda `toʻplam#slayd` |
| `lib/doska/ink.ts` | `recognizeShape` (chiziq; yopiq shaklda toʻrtburchak — qutining toʻrt burchagidan oʻtadi, ellips — radial ogʻish; deyarli teng tomon → aylana/kvadrat), `snapLineEnd` (15°), `eraseAlong` (qisman: zichlashtirib kesadi, boʻlaklar RDP bilan), `strokeHit` endi oʻchirgʻich YOʻLI bilan (kesma–kesma), `inkAnchorAt` / `visibleInk` / `anchorsKey`, `laserPath` (kometa izi), `inkWidthAt` |
| `lib/doska/store.ts` | `removeStrokes` → `replaceStrokes` (boʻlaklar asl chiziq oʻrniga); «Tozalash» faqat koʻrinayotgan yozuvni; vidjet oʻchirilsa unga bogʻlangan yozuv ham (bitta qadam) |
| `lib/doska/ink-tool.ts` | `laser` rejimi, `eraserPartial` |
| `components/doska/InkLayer.tsx` | ushlab turish taymeri (`HOLD_MS` 550, `HOLD_RADIUS` 6 px), tekislangan chiziq uchi qalam ortidan; lazer izlari hoʻl qatlamda, soʻnguncha kadr davom etadi; bogʻlangan yozuv vidjet bilan surilib, slayd almashsa yashirinadi; tizim siyoh izi (`navigator.ink`, faqat qalam) yoki bashorat nuqtalari |
| `components/doska/InkBar.tsx` | «Lazer» tugmasi (rang va qalinlik yashirinadi), oʻchirgʻichda «Qisman» |
| `useDoskaShortcuts.ts` | `L` — lazer |
| `styles/doska.css` | `--doska-laser` |

Qarorlar:

- **Bogʻlash mezoni — chiziq BOSHLANGAN nuqta.** Slayddan tashqaridan
  ichiga chizilgan strelka ekranniki. Nuqta ustidagi eng yuqori vidjet
  sahifasiz boʻlsa (slayd ustidagi taymer) — bogʻlanmaydi.
- **Sahifa va vidjet burchagi QOʻYIB YUBORILGANDA olinadi.** Yozish
  paytida barmoq vidjetni sursa yoki pult slaydni almashtirsa, chiziq
  ekranda koʻringan joyida qoladi (yangi slaydga tushadi), sakramaydi va
  yoʻqolmaydi.
- **«Ekranni tozalash» qulflangan vidjetning sahifa yozuvini qoldiradi**
  — vidjet bilan birga. «Tozalash» (siyoh paneli) esa faqat koʻrinib
  turgan yozuvni oʻchiradi.
- **Shakl tanish soddalashtirilgan yoʻlda** (RDP, 3 px) va qalam
  toʻxtagan nuqtagacha: 240 Hz qalamning titrashi va ushlab turish
  paytidagi shovqin yoʻl uzunligini oshirib, toʻgʻri chiziqni «egri»
  qilib qoʻyardi.
- **Bashorat nuqtalari bir kadr yashaydi** va tizim izi bor boʻlsa ham
  ishlaydi: qalam toʻxtasa dum qalam uchidan oldinda qolib ketmaydi.
- **Yozuv vidjet eni boʻyicha bir tekis masshtablanadi.** Vidjet
  nisbati oʻzgarsa slayd ichida biroz siljishi mumkin — slayd oʻzi
  16:9 da markazlanadi, vidjet esa erkin choʻziladi.
- **«Markazga» va toʻliq ekrandagi taqdimotda yozuv koʻrinmaydi** —
  1-bosqichdagi kabi (siyoh qatlami parda ostida). Kattalashtirilgan
  slayd ustiga yozish — keyingi qadam.
- **Tanilmagan shakl qoʻlyozmaligicha qoladi.** Uchburchak yoki harf
  «deyarli toʻrtburchak»ka aylantirilmaydi.
- **Kesilgan shakl oddiy chiziqqa aylanadi** — yarim aylana endi aylana
  emas.

Oʻlchov (sinov skripti): qoʻlda chizilgan kabi titrashli chiziq,
aylana, ellips, toʻrtburchak, kvadrat tanildi; uchburchak, «S», «C» va
qisqa vergul — yoʻq. Qisman oʻchirish chiziqni ikki boʻlakka kesadi,
yoʻl boʻylab oʻtsa — butunlay.

**Kutilmoqda — kaft oʻchirgichi.** `/doska/sinov` hisoboti kelmaguncha
qurilmaydi: koʻp infraqizil panel kontakt oʻlchamini 1×1 yuboradi
(R332) va taxminiy chegara kaftni emas, qalin barmoqni oʻchirgʻichga
aylantirib qoʻyardi.

---

## 9. Qurilgani (3-bosqich)

| Joy | Nima |
|---|---|
| `lib/doska/guides.ts` | chizgʻich (720×88 px, 40 px birlik, oʻndan boʻlingan) va transportir (radius 220 px) geometriyasi: toʻgʻri chetlar va tashqi normal, `snapToGuide` (chetdan 32 px gacha tashqarida yoki asbob ustida), `isAlongEdge` (birinchi 14 px harakat chetga ±25° parallelmi), `alongEdge` (chetga proyeksiya, chet uzunligi ichida), `clampGuidePose` (markaz kanvas ichida), `snapGuideAngle` (15° ga ±2°), `guideAngleLabel` (0–179°, soat miliga teskari) |
| `lib/doska/ink.ts` | `lassoPick` (chiziq uzunligining 60 % i halqa ichida), `strokeAt` (bosishda ustki chiziq), `selectionBounds`, `movedStroke` (bogʻlangan chiziq oʻz koordinatasida suriladi, bogʻlanishi qoladi) |
| `lib/doska/ink-tool.ts` | `lasso` rejimi, `selection`, `ruler` / `protractor` holati; `recolorSelection`, `resizeSelection`, `deleteSelection` — har biri bitta qadam va faqat oʻzgargan chiziqqa |
| `components/doska/InkLayer.tsx` | halqa va belgilash chegarasi hoʻl qatlamda (uzuq chiziq, chegara keshda); belgilangan yozuv sudralganda quruq qatlamdan olinib hoʻlda siljish bilan chiziladi; asbob cheti yonida boshlangan va chetga parallel yurgan chiziq toʻgʻri chiziqqa aylanadi |
| `components/doska/InkGuides.tsx` | asboblarning oʻzi: bir barmoq — surish, ikki barmoq — surish va burish, tutqich — burish; yopish tugmasi (chizgʻichda — tanasi ichida); SVG yuzlar `memo` — sudrashda faqat `transform` oʻzgaradi |
| `components/doska/InkBar.tsx` | «Belgilash» (lasso), belgilanganda rang · qalinlik · «Oʻchirish» (belgilashsiz — joyini saqlab yashirin / nofaol); «Chizgʻich» · «Transportir» |
| `lib/doska/export.ts`, `DoskaMenu.tsx` | «Rasm qilib saqlash» — joriy ekran PNG (fon, vidjetlar, yozuv), Blob havola orqali |
| `useDoskaShortcuts.ts` | `Delete` belgilangan yozuvni oʻchiradi, `Esc` avval belgilashni bekor qiladi — ikkalasi ham faqat KOʻRINIB turgan belgilashga |

Qarorlar:

- **Lasso ulushi uzunlik boʻyicha**, nuqtalar soni boʻyicha emas:
  saqlangan chiziq soddalashtirilgan, toʻgʻri boʻlak atigi ikki nuqta —
  nuqta sanalsa, uzun chiziqning yarmini oʻragan halqa uni butunlay
  olardi.
- **Belgilangan yozuvga rang qoʻllanganda palitra asbobi saqlanadi.**
  Qalam va marker birga belgilansa «qizil» faqat qalamga tushadi —
  markerda qizil yoʻq. Hammasi marker boʻlsa marker palitrasi chiqadi.
- **Lassoda panel asbobni emas, belgilangan yozuvni boshqaradi.**
  Belgilash yoʻq paytda rang va qalinlik yashirin — aks holda rang
  bosilishi rejimni jimgina qalamga almashtirib yuborardi.
- **Asbob ustida barmoq SURADI, qalam YOZADI.** Qalami yoʻq panelda
  barmoq asbob chetining tashqarisidan boshlab yozadi. Tutqich va yopish
  tugmasi — hamma uchun tugma; qalam ularni bossa «Faqat qalam» yoqilmaydi
  (bu yozish emas).
- **Chetga yopishish — joy VA yoʻnalish boʻyicha.** Faqat masofa
  boʻlsa, chizgʻich yonidagi yozuv («AB = 5 sm») harf-harf toʻgʻri
  chiziqqa aylanardi. Qaror qalam 14 px yurgach qabul qilinadi: chetga
  ±25° parallel boʻlsa — chet boʻylab, aks holda qoʻlyozma.
- **Chizgʻich tugmalari tanasining ichida**, pastki burchaklarda:
  tashqarida boʻlsa 720 px chizgʻich tor ekranda tugmalarini kanvasdan
  chiqarib yuborardi. Asbob markazi kanvasdan chiqmaydi, yangi asbob
  kanvas (oyna emas) oʻrtasida ochiladi.
- **Transportir yoy boʻylab chizmaydi** — faqat toʻgʻri chet. U
  oʻlchash uchun: markazni burchak uchiga qoʻyib, darajani oʻqish.
- **Asboblar saqlanmaydi va rasmga chiqmaydi** (sessiya holati, lazer
  kabi). Rejimdan chiqilsa yashirinadi, qaytilsa oʻsha joyida.
- **Rasm butun kanvas ildizidan** olinadi, boshqaruv izlari
  (`data-doska-no-export`) — tanlov ramkasi, hoʻl qatlam, asboblar —
  tashlanadi. Kutubxona faqat bosilganda yuklanadi. Qurilma zichligi
  2× dan oshmaydi. Fayl `data:` URL emas, Blob havola bilan yuklanadi —
  katta rasm (5–15 MB) `data:` havolada rad etiladi.

Oʻlchov (sinov skripti): chet topish (gorizontal, 90° burilgan,
transportir; uchidan narida va uzoqda — yoʻq), proyeksiya va chet
uchida toʻxtash, yoʻnalish (parallel, teskari — ha; harf, 45° — yoʻq),
kanvasga qisish, burchak yopishishi va yorligʻi, lasso (toʻliq, yarim —
yoʻq, 85 % — ha, nuqta), bosishda topish, chegara (qalinlik bilan,
bogʻlanganda masshtablangan) va surish (bogʻlanganda oʻz koordinatasida).

**Keyinga qoldi:**

- **Oʻquvchilarga yuborish** — Doskada sinf bilan aloqa kanali yoʻq;
  sinf roʻyxati ulanganda (Pro) koʻriladi. Hozircha rasm faylini
  oʻqituvchi oʻzi yuboradi.
- **Server sinxroni** — ekranlar hali faqat brauzerda; ular serverga
  koʻchgach siyoh ham shu yoʻl bilan ketadi (maydon ixtiyoriy, alohida
  sxema kerak emas).
- **Qoʻlyozmani matnga aylantirish** — alohida tadqiqot (tanish
  qurilmada yoki serverda, oʻzbek lotin/kirill yozuvi).

---

## Manbalar

- W3C, *Pointer Events Level 3* — `getCoalescedEvents`,
  `getPredictedEvents`, qalam oʻchirgichi (`button` 5, `buttons` 32).
  https://w3c.github.io/pointerevents/
- WICG, *Ink API (Delegated Ink Trail)*. https://wicg.github.io/ink-enhancement/
  va MDN: https://developer.mozilla.org/en-US/docs/Web/API/Ink_API
- Chrome for Developers, *Low-latency rendering with the desynchronized
  hint*. https://developer.chrome.com/blog/desynchronized
- Ng, A., Lepinski, J., Wigdor, D., Sanders, S., Dietz, P. (2012).
  *Designing for Low-Latency Direct-Touch Input.* UIST.
- Annett, M., Ng, A., Dietz, P., Bischof, W., Gupta, A. (2014).
  *How Low Should We Go? Understanding the Perception of Latency While
  Inking.* Graphics Interface.
- Vogel, D. va hamkorlar (2009/2010). *Hand Occlusion with Tablet-sized
  Direct Pen Input.* CHI. (R328)
