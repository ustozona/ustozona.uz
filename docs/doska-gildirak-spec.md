# Doska — Gʻildirak (tasodifiy ism tanlash)

Bogʻliq: `docs/ost-loyihalar-arxitektura.md` R111 (bitta gʻildirak
primitivi, uchta manba), R141 (randomizer → sinf roʻyxatidan), B2.5;
`docs/doska-dizayn-tizimi.md`; `docs/roadmap-muhokama.md` («Ruletka»
qatori). Bu hujjat R289 dan boshlanadi.

**Holat: v1 qurildi (2026-09-25). Uchta asosiy qaror pastda,
«Qarorlar» boʻlimida.**

Kod: `src/lib/spin-wheel.ts` (tasodif va burchak — umumiy),
`src/components/stage/SpinWheel.tsx` (SVG gʻildirak — umumiy),
`src/components/stage/spin-sound.ts` (Web Audio),
`src/lib/doska/wheel.ts` (vidjet holati),
`src/components/doska/widgets/WheelWidget.tsx` (vidjet),
tarjimalar — `messages/*.json` → `Doska`.

---

## Referens koʻrigi (R289–R292)

Manba: ommabop onlayn ism gʻildiragi — bosh sahifa, FAQ va sinf uchun
qoʻllanma, matn orqali oʻqildi (2026-09-25). UI va animatsiya hali
koʻrilmagan — ular aniq UI qarorlaridan oldin koʻriladi.

**R289 — Tasodif kriptografik, natija fizikadan.** `crypto.getRandomValues()`
ishlatiladi, aylanish fizikasi shu tasodifdan boshqariladi, har aylanish
mustaqil. Ishonch uchun «10 000 aylanish» tekshiruv vositasi alohida
turadi. Bizga: tasodif manbai shu, lekin fizika shart emas — gʻolib
aylanish **boshida** tanlanadi, animatsiya unga toʻxtaydi. Taqsimot bir
xil, kod sodda, sinash oson (R298).

**R290 — Gʻolibdan keyin uch yoʻl: yopish · olib tashlash · hamma
nusxasini olib tashlash.** Qaytarishsiz tanlov standart emas — har safar
qoʻlda bosiladigan tugma. Sinf qoʻllanmasi aynan «har aylanishdan keyin
olib tashlang» deb maslahat beradi, yaʼni oʻqituvchi har aylanishda bitta
ortiqcha bosish qiladi. Bizda bu tugma emas, **rejim** (R294).

**R291 — Vazn = segment oʻlchami.** Vaznli yozuv gʻildirakda kattaroq
boʻlak boʻlib koʻrinadi — tasodif halol qoladi, chunki koʻz koʻrgan narsa
ehtimolga teng. ❌ Sinf uchun olinmaydi: projektorda bir bolaning boʻlagi
kattaroq boʻlishi — ochiq kamsitish. «Kam soʻralganga ogʻdirish»
kerak boʻlsa, u vazn bilan emas, qaytarishsiz aylanma bilan beriladi
(R294).

**R292 — Sozlamalar koʻp, bizga ikkitasi kerak.** Referensda: aylanish
vaqti, tiq-tiq va olqish tovushlari (alohida oʻchiriladi), gʻolib xabari
matni, ranglar, markaz logosi, fon rasmi, 1000 tagacha yozuv, `ctrl+enter`,
bir sahifada bir nechta gʻildirak, havola orqali ulashish, jadvaldan
import. Bizga: **vaqt + tovush** (bitta oʻchirish tugmasi bilan). Qolgani
ortiqcha yoki bizda bepul keladi:

| Referensda | Bizda |
|---|---|
| Bir nechta gʻildirak | Doskaga ikkinchi vidjet qoʻyiladi |
| Jadvaldan import | Jurnaldagi sinf roʻyxati |
| Havola orqali ulashish | Doska ekranining oʻzi |
| 1000 yozuv | Sinf ≤ 40 — oʻqiladigan chegara shu |

### DOM koʻrigi (R300–R304)

Foydalanuvchi referens sahifaning DOMʼini berdi (2026-09-25). Matnli
koʻrikda koʻrinmagan tuzilma shu yerdan olindi.

**R300 — Tahrir paneli yigʻiladi, gʻildirak yolgʻiz qoladi.** Tuzilma:
markazda gʻildirak, oʻngda tahrir kartasi. Kartaning chap chetida
«Hide editor» tugmasi (chevron) — bosilsa faqat gʻildirak qoladi. Bu
R297 dagi «roʻyxat bolalar oldida ochilib turmaydi» talabining ular
tomondagi yechimi. Bizda vidjet ichida: **gʻildirak ⇄ roʻyxat**
almashtirish, standart — gʻildirak.

⚠️ Qaysi tomon ochiqligi va gʻolib kartochkasi **saqlanmaydi**
(komponent holati). Saqlansa, ertasi kuni proyektor ochilganda sinf
oldida butun ismlar roʻyxati yoki kechagi gʻolib chiqib turardi — kod
koʻrigida topilgan (2026-09-25).

**R301 — Ikki varaq, ikkalasida son: «Entries 8» · «Results 0».**
Yozuvlar va tanlanganlar tarixi alohida, son nishoni bilan. Bu R294
hisoblagichining («12 / 28») tayyor shakli: roʻyxat tomonida ikki
boʻlim — **Hovuz** va **Soʻralganlar**, har birida son. «Soʻralganlar»
dan bolani qoʻlda hovuzga qaytarish mumkin boʻlsin (R295 ning qoʻlda
varianti).

**R302 — Ism maydoni: `spellcheck="false"`, `translate="no"`.**
Tahrirlagich — contenteditable, har ism alohida `<div>`. Ikkala atribut
ham bizga kerak: imlo tekshiruvi har oʻzbekcha ismni qizil chiziq bilan
belgilaydi, brauzer avto-tarjimasi esa ismni «tarjima» qilib buzishi
mumkin. Bizda oddiy `<textarea>` yetadi, lekin shu ikki atribut bilan.

**R303 — Namuna ismlar oldindan qoʻyilgan (8 ta).** Birinchi aylanish
hech qanday sozlashsiz ishlaydi — R134 («3 soniyada ishlaydi») bilan
bir ruh. Bizda: mehmon vidjetni qoʻyganda u boʻsh emas, **namuna
ismlar** bilan tushadi (oʻzbekcha, 6–8 ta) va roʻyxat birinchi
tahrirlanganda almashtiriladi. Sinf bogʻlangan boʻlsa namuna yoʻq —
darhol sinf roʻyxati.

**R304 — Gʻildirak `canvas` da (700×700), yozuv ustidagi SVG da.**
Gʻildirak ustida egri `textPath` bilan «Click to spin» / «or press
ctrl+enter» — bosish mumkinligining oʻzi gʻildirakda yozilgan. Canvas
ularga 1000 yozuv uchun kerak; bizda ≤ 40 ism, shuning uchun **SVG**
yetadi va vidjetning `cqw` masshtabiga tabiiy mos keladi. Gʻildirak
ustidagi «Bosing — aylanadi» yozuvi olinadi.

Olinmaydi: «Shuffle» (tasodif baribir bor, boʻlak tartibi ahamiyatsiz),
«Sort», «Add image», «Advanced» (vazn, R291), «Add wheel» (R292).

---

## Tadqiqot (R293)

**R293 — Tasodifiy chaqirish qatnashishni oshiradi va noqulaylik
tugʻdirmaydi.**

- **Dallimore, Hertenstein, Platt (2013, *Journal of Management
  Education*)** — 16 guruh, kuzatuv + soʻrovnoma. Koʻp chaqiriladigan
  guruhlarda **ixtiyoriy** javob beruvchilar soni sezilarli yuqori va vaqt
  oʻtishi bilan oʻsadi; talabalar oʻzini noqulay his qilmaydi. 2019-yilgi
  davomi: qizlar va oʻgʻil bolalarning ixtiyoriy qatnashishi tenglashadi.
- **Wiliam, «qoʻl koʻtarmasdan» naqshi** — ismlar tayoqchalarda, idishdan
  tasodifiy olinadi. Tayoqcha **qaytariladi**: bir bola ikki marta chiqishi
  mumkin, shuning uchun «meni soʻrab boʻlishdi» deb boʻshashish yoʻq.
- **Lemov, «No Opt Out»** — «bilmayman» bilan qutulib boʻlmaydi: boshqalar
  javob bergach oʻqituvchi oʻsha bolaga qaytadi.
- **Amaliy tavsiya** (tadqiqot emas, oʻqituvchi qoʻllanmalari): savol →
  5–10 soniya oʻylash → keyin aylantirish.

Ikki naqsh bir-biriga zid: qaytarishsiz — adolat, qaytarish — hushyorlik.
Sintez R294 da.

---

## Jahon amaliyoti (R305–R309, 2026-09-25)

Foydalanuvchi ikki savol berdi: standart rejim va nom jahon amaliyotida
qanday? Koʻrildi: sinf ekrani vositalari, sinf boshqaruvi platformalari,
ochiq shablonli oʻyin konstruktorlari, oddiy ism tanlagichlar va rus
tilidagi ommaviy vositalar.

**R305 — Ikki oila, ikki standart.**

| Vosita turi | Standart | Olib tashlash |
|---|---|---|
| **Sinf roʻyxatini biladigan** (sinf ekrani, sinf boshqaruvi platformasi) | kim chaqirilgani **kuzatiladi** | tumbler, oʻchirsa boʻladi |
| **Umumiy gʻildirak / ism tanlagich** | qaytariladi | har safar qoʻlda bosiladigan tugma («Remove», «Eliminate», «✕», «remove name?») |

Chegara aniq: roʻyxat **sinf** boʻlsa, vosita adolatni oʻzi yuritadi;
roʻyxat **ixtiyoriy** boʻlsa (sovgʻa oʻyini, taom tanlash), qaytarish
standart. Doska — birinchi oila. Standartimiz shunga mos: **«Hamma bir
martadan»**, lekin tanlovni oʻqituvchi qiladi (tumbler, R294).

**R306 — Aylanma oxiri avtomatik yangilanmaydi.** Sinf ekrani vositasi
hamma soʻralgach **aylanma tugaganini eʼlon qiladi** va yangisini
boshlashni **taklif qiladi**. Avtomatik yangilash (R294 dagi dastlabki
taklif) rad etildi: oʻqituvchi va sinf «hamma soʻraldi» paytini
koʻrmasdan oʻtib ketadi. Bu esa bolalar uchun kichik bayram lahzasi.

**R307 — Nom: taʼlim vositalari obyekt yoki funksiya nomini oladi.**
Inglizcha: «randomizer», «random name picker», «random wheel», «spin the
wheel». Rus tilidagi ommaviy vositalar: «колесо фортуны», «рандомайзер»,
«рулетка» — lekin ular maktab uchun emas, umumiy (sovgʻa, tanlov).
Oʻzbekcha barqaror atama **yoʻq**, «omad» soʻzi esa lotereya va teleshou
bilan band.

Doska vidjetlari **obyekt nomi** bilan atalgan: Soat, Taymer, Svetofor,
Shakl. Shu qatorda → **«Gʻildirak»**. ❌ «Ruletka» rad etildi: kazino
maʼnosi, sinf ekranida notoʻgʻri signal. «Omad gʻildiragi» ham xuddi
shu sabab bilan rad.

| Til | Nom |
|---|---|
| uz | Gʻildirak |
| uz-Cyrl | Ғилдирак |
| ru | Колесо |
| en | Wheel |
| kk | Дөңгелек |
| ky | Дөңгөлөк |
| kaa | Dóńgelek (ona tili egasi tekshirsin) |

**R308 — «8 belgi» qoidasi notoʻgʻri oʻlchov: chegara 52 px.** Panel
tugmasi `w-[52px]`, yorliq `text-tag` (11 px), DM Sans. Kenglik
`next/font` ichidagi fontkit bilan shrift metrikasidan oʻlchandi:

| Yorliq | Kenglik | Natija |
|---|---|---|
| Yopishqoq | 54.6 px | kesiladi — kodda yozilgan «Yopishq…» ga mos |
| Taqdimot | 49.2 px | sigʻadi |
| **Gʻildirak** | ~39 px | sigʻadi (9 belgi boʻlsa ham) |
| Dóńgelek | 47.0 px | sigʻadi |

⚠️ **DM Sansʼda kirill glifi yoʻq** (`subsets: ["latin"]`, shriftning
oʻzida ham kirill yoʻq). ru, uz-Cyrl, kk, ky yorliqlari **tizim
shriftida** chiqadi. Segoe UI / Arial bilan: Ғилдирак 48, Колесо 36,
Дөңгелек 47–48, Дөңгөлөк 47–49 px — hammasi sigʻadi, lekin ky
chegaraga yaqin. `registry.ts` dagi «8 belgidan oshmasin» izohi
«52 px, oʻlchab koʻring» deb tuzatiladi.

Oʻlchov boshqa vidjet nomlarida ham ikkitasini ushladi — ular tarjimada
almashtirildi (500 vazn uchun +3% bilan oʻlchangan):

| Vidjet | Kesiladi | Oʻrniga |
|---|---|---|
| Taqdimot (ru, en, kaa) | Презентация 67.7 · Presentation 66.8 · Prezentaciya 67.6 px | Слайды · Slides · Slaydlar; kk/ky — Слайдтар · Слайддар |
| Svetofor (en, kk) | Traffic light 59.2 · Бағдаршам 58.3 px | Stoplight · Светофор |
| Fon (en) | Background 62.5 px | Backdrop |

**R309 — Doskada i18n umuman yoʻq.** Barcha matn oʻzbekcha qotirilgan:
`registry.ts` dagi `label`, vidjet ichlari, menyu, mehmon eslatmasi.
Ilova esa 7 tilda (cookie orqali, standart — uz, yetishmagan kalit
oʻzbekchaga qaytadi). Taklif:

- `registry.ts` da `label` → tarjima kaliti (oddiy satr, registry
  Reactʼsiz qoladi); panel yorligʻi `useTranslations` dan. Mavjud 7
  vidjet nomi shu PR da 7 tilga oʻtadi.
- Gʻildirak birinchi kundan tarjima kalitlari bilan yoziladi.
- Namuna ismlar (R303) har til uchun **oʻz roʻyxati** (messages massivi).

**Qilingani (v1):** vidjet paneli («Fon», «Tozalash» bilan), yuqori va
pastki tugmalar, menyu tugmasi, fon va shakl nomlari (`backgrounds.ts`
va `shapes.ts` dagi `label` olib tashlandi — nom `Doska.backgrounds.<id>`
/ `Doska.shapes.<id>` da), mehmon eslatmasi, gʻildirak. Yarim
tarjima qilingan panel ikki tilda aralash koʻrinardi — kod koʻrigida
topilgan.

**Qolgani — alohida PR:** menyu ichi (`DoskaMenu`), taymer va svetofor
tugmalarining `aria-label` lari, taqdimot vidjeti, standart ekran nomi
(«Ekran»).

---

## Taklif

### R294 — Ikki rejim, oʻqituvchi tanlaydi; standart — «Hamma bir martadan»

Rejim — roʻyxat tomonidagi tumbler, vidjet holatida saqlanadi. Standart
jahon amaliyotidagi sinf vositalari bilan bir xil (R305).

| | **Hamma bir martadan** (standart) | **Qaytarilsin** |
|---|---|---|
| Tanlangan bola | gʻildirakdan chiqadi | gʻildirakda qoladi |
| Aylanma tugasa | «Hamma soʻraldi!» + «Yangi aylanma» tugmasi (R306) | — |
| Kuchli tomoni | «nega doim men?!» yoʻqoladi | hech kim boʻshashmaydi |
| Asos | `roadmap-muhokama.md`: «bir soʻralgan qayta chiqmaydi» | Wiliam (R293) |

Soʻralganlar gʻildirakdan chiqadi — bolalar kim qolganini koʻradi
(shaffoflik). Hisoblagich: «12 / 28».

Aylanma holati **sinfga** bogʻlanadi va dars tugasa ham saqlanadi —
hafta davomida hamma navbat bilan soʻraladi. Bu «kam soʻralganga
ogʻdirish»ning vaznsiz, koʻzga koʻrinadigan shakli (R291).

### R295 — «Keyinroq» (oʻtkazish ≠ qutulish)

Gʻolib ekranida ikki tugma: **Yana** (keyingi aylanish) va **Keyinroq**
(bola hovuzga qaytadi, soʻralgan hisoblanmaydi). Lemov naqshi: bola
qutulmaydi, keyingi aylanishlarda yana chiqadi. Hayajonlangan yoki til
oʻrganayotgan bola uchun bosimni tushiradi, lekin qatnashishdan ozod
qilmaydi.

### R296 — Maʼlumot manbai: uch qatlam

1. **Mehmon** — vidjet namuna ismlar bilan tushadi (R303), roʻyxat
   qoʻlda tahrirlanadi (bir qatorga bitta ism). 5-ismda yumshoq
   taklif: «Sinfingizni ulang — roʻyxat jurnaldan keladi». Ishlatish
   **bloklanmaydi** (Doska biznes modeli).
2. **Kirgan** — sinf tanlanadi, jurnaldan faol oʻquvchilar keladi
   (arxivlanganlar yoʻq). Bittasini vaqtincha oʻchirib qoʻyish mumkin.
   **Qaror (2026-09-25): premium.** Darvoza — mavjud `teachers.plan`
   ustuni (`"free"` | `"pro"`, AI limitlari ham shundan foydalanadi):
   faqat `"pro"` da ochiladi. Mehmon va `"free"` tugmani yulduzcha bilan
   koʻradi, bosilsa taklif ochiladi (`DoskaMenu` dagi pro band naqshi).
   Ruxsat serverda tekshiriladi, UIʼda emas.
3. **2-qatlam (keyin)** — bugun davomatda «yoʻq» belgilangan bola
   avtomatik chiqadi. Projektorda yoʻqlar roʻyxati **koʻrsatilmaydi**.

### R297 — Projektorda faqat ism

Gʻildirakda: ism + familiya bosh harfi («Aziza K.»); ikkita bir xil
chiqsa harf qoʻshiladi. Baho, ball, davomat belgisi — **hech qachon**.
Roʻyxat tahriri vidjetning «orqa tomoni»da (tugma bilan almashadi,
R300) — bolalar oldida roʻyxat ochilib turmaydi.

B3.3 bilan munosabat: u yerda projektor javobni ismsiz koʻrsatadi. Bu
yerda aksincha — ism aynan maqsad, lekin ismdan boshqa hech narsa.

### R298 — Aylanish

- Gʻolib aylanish boshida `crypto.getRandomValues` bilan tanlanadi
  (modulo ogʻishisiz); animatsiya sekinlashib unga toʻxtaydi.
- Davomiylik: 4 s standart (qisqa / oʻrta / uzun).
- Tovush: tiq-tiq Web Audio bilan sintez qilinadi (fayl yoʻq); bitta
  ovoz tugmasi.
- `prefers-reduced-motion` → qisqa aylanish.
- Boʻlak ranglari — `src/lib/class-colors.ts` palitrasidan, yangi rang
  ixtiro qilinmaydi.
- Gʻolib — vidjet ichida katta ism, butun ekranni yopuvchi modal emas.

### R299 — Arxitektura: bitta primitiv

- `SpinWheel` — `src/components/stage/` da, sof komponent (`entries`,
  `onResult`). `wheel.v1` vidjeti uni oʻraydi. Keyin xuddi shu primitiv
  Baholash «Random wheel» shabloniga (atamalar) va jonli darsga
  (ishtirokchilar) xizmat qiladi — R111.
- Vidjet qoʻshish ikki fayl qoidasi boʻyicha: `src/lib/doska/registry.ts`
  + `src/components/doska/widgets/index.ts`, va `WidgetKind` ga
  `"wheel.v1"`.
- Nom — **«Gʻildirak»** va 6 tildagi tarjimasi (R307); kengligi
  52 px ga sigʻadi (R308).
- Ikona: Solar oilasidan; mosi boʻlmasa oʻzimiz chizamiz
  (`docs/doska-dizayn-tizimi.md` §3).

### Olinmaydi

Vazn (R291) · rasm, fon, logo yuklash · koʻp tovush tanlovi · havola
orqali ulashish · jadvaldan import · 1000 yozuv · alohida koʻp gʻildirak
rejimi.

---

## Bosqichlar

- **v1** ✅ (PR #201) — Doska yorliqlari tarjima kalitiga (R309) +
  vidjet, qoʻlda roʻyxat, ikki rejim, «Keyinroq», tovush.
- **v1.1** ✅ — sinf roʻyxati, premium (`teachers.plan === "pro"`).
  Tafsiloti pastda.
- **v2 (2-qatlam)** — bugungi yoʻqlar davomatdan; gʻolib ekranida
  «+1 ball» → xulq ballariga.

### v1.1 — sinf roʻyxatini ulash (2026-09-25)

Kod: `server/dal/doska-wheel.ts` (ruxsat + tarif + roster),
`server/dal/class-roster.ts` (joriy roʻyxat — Baholash varaqlari bilan
umumiy), `server/actions/doska-wheel.ts`, roʻyxat tomonidagi
`ConnectClass` va `RosterNames` (`WheelWidget.tsx`), umumiy
`components/doska/ProBadge.tsx` va `ClassList.tsx`.

| Qaror | Sabab |
|---|---|
| Tarif SERVERDA tekshiriladi; «kirmagan / Pro emas / sinf sizniki emas» — `denied` javobi, xato emas | yulduzcha — taklif, himoya emas; `/doska` kirmasdan ochiladi (R134) |
| Ism SERVERDA qisqartiriladi («Aziza K.», `wheelDisplayNames`) | toʻliq ism brauzerga tushmaydi (R297) |
| Kalit — oʻquvchi ID si, ism — faqat koʻrinish. «Soʻralganlar» va «bugun yoʻq» ID bilan saqlanadi | qisqa ism butun roʻyxatdan hisoblanadi: yangi «Aziza Komilova» kelsa, eski «Aziza K.» «Aziza Ka.» boʻladi — ism kalit boʻlsa, soʻralgan bola gʻildirakka qaytardi |
| Ismlar localStorageʼda SAQLANMAYDI — faqat `classId`, sinf nomi va «bugun yoʻq» ID lari; ismlar har sahifa ochilishida serverdan olinadi, xotirada turadi | umumiy sinf kompyuterida keyingi odam roʻyxatni koʻrmasin; Pro tugasa roʻyxat ham yopilsin |
| Roʻyxat sahifa davomida bir marta soʻraladi (faqat muvaffaqiyatli javob keshlanadi); mehmon deb topilsa xotiradagi ismlar ham tozalanadi | ekranlar orasida yurganda qayta soʻrov yoʻq |
| Kirish turi keshlanmaydi — roʻyxat tomoni har ochilganda soʻraladi | mehmon «Kirish» dan qaytganda ham «kiring» koʻrmasin |
| Tarmoq uzilsa — «Roʻyxat yuklanmadi» + «Qayta urinish», server matni koʻrsatilmaydi | server xabari faqat oʻzbekcha; tugmalar qotib qolmasin |
| Bugun yoʻq bola — ismini bosib chiqariladi (`excluded`) | R296: «bittasini vaqtincha oʻchirib qoʻyish»; davomatdan avtomatik — v2 |
| Qoʻlda yozilgan roʻyxat sinf ulanganda OʻCHIRILMAYDI | «Uzish» bosilsa u qaytadi |
| Mehmon → «Kirish» (`/login`); bepul → «Pro haqida» (`/dashboard/settings?section=tarif`) | pullik band oʻchirilmaydi, taklif ochadi (DoskaMenu naqshi) |
| 5-ism qoʻlda yozilganda yumshoq eslatma | Doska biznes modeli: ogʻriq his qilingandan keyin taklif, bloklamasdan |

⚠️ Hozir hech kimda `plan = "pro"` yoʻq va toʻlov yoʻq — imkoniyat faqat
`teachers.plan` qoʻlda oʻzgartirilganda ochiladi.

## Qarorlar (2026-09-25)

1. **Rejim** — oʻqituvchi tanlaydi (tumbler); standart «Hamma bir
   martadan»; aylanma oxiri eʼlon + «Yangi aylanma» (R294, R305, R306).
2. **Nom** — «Gʻildirak» + 6 tilga tarjima; Doska yorliqlari tarjima
   kalitiga oʻtadi (R307–R309).
3. **Sinf roʻyxati** — premium, `teachers.plan` bilan (R296).
