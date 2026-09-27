# Bogʻlangan darslar (dars oqimi) — taklif

Holat: **1-bosqich qurildi** (2026-09-27, branch `maxdum/darslar-oqimi`).
Ochiq savollar (6-boʻlim) taklif qilingan variantlar bilan yopildi.
Amalga oshirilgan model — **3.3 «Slot havzasi»**; 2- va 3-bosqich hali yoʻq.

Maqsad: darslar bir-biriga ulangan boʻlsin. Bitta darsning sanasi yoki
tartibi oʻzgarsa, keyingilari oʻz-oʻzidan yangi sanalarga joylashsin.
Keyingi bosqichda — boʻlim va darslar qanday ulanganini vizual koʻrish.

---

## 1. Hozirgi holat (kod boʻyicha, `origin/main`)

| Nima | Qayerda | Muammo |
|---|---|---|
| Tartib | `number` / `orderByClass` (`reorderLessons`, `reorderUnits`) | Tartiblash **sanaga tegmaydi** — 5-dars 3-darsdan oldin boʻlishi mumkin |
| Sana | `scheduleByClass[classId][]` (`moveSession`) | Bitta sessiya koʻchadi, **qolganlari joyida** qoladi; band slotga tashlansa bir slotda ikki dars |
| Import | `distributeTopics` (`src/lib/ish-reja/distribute.ts`) | Tartib → slot qoidasi faqat **bir marta**, importda ishlaydi |
| Surish | `planBump` (`src/lib/lesson-shift.ts`) + `useLessonBump` | Faqat oldinga, bitta slot; yagona «bogʻlangan» amal |
| Oʻtildi | `taughtByClass`, `needsTaughtConfirm` | Oʻtilgan dars surishda joyida qoladi — yaxshi, saqlanadi |

Xulosa: kerakli gʻishtlar bor (sof taqsimlash funksiyasi, koʻchishlar
roʻyxati + `applySessionMoves`, `invertMoves` bilan undo). Yetishmayotgani —
**tartib va sanani bogʻlaydigan yagona qoida**.

---

## 2. Jahon amaliyoti — naqshlar

Oʻqituvchi rejalashtiruvchilari va loyiha boshqaruvi vositalarida uchta
naqsh uchraydi:

### A. Amal-asosli surish (eng keng tarqalgan)
Sanalar saqlanadi, maxsus amallar zanjir boʻylab suradi:
- **Oldinga surish** — dars keyingi dars kuniga oʻtadi, undan keyingilar
  ham bittadan suriladi («poyezd vagonlari» — boʻsh joyga yetguncha).
- **Orqaga tortish** — teskarisi; bir tizimda orqaga surish oldingi kundagi
  darsni **oʻchiradi** (xavfli naqsh, takrorlanmaydi).
- **Choʻzish** — dars yana N kunga koʻpaytiriladi, qolganlar suriladi.
- **Kunni surish** — kutilmagan yopilish: kun «dars yoʻq» deb belgilanadi va
  shu bilan birga barcha darslar suriladi (bitta dialogda ikki belgi).
- **Qadash** — muhim dars (nazorat ishi, tadbir) sanaga qadaladi; surishda
  zanjir uni **chetlab oʻtadi**.
- Har amaldan keyin **Bekor qilish** havolasi.
- Surish bir sinf doirasida; har kuni takrorlanadigan emas, faqat
  ketma-ket rejalar suriladi.

### B. Ketma-ketlik-asosli oqim
Oʻqituvchi boʻlim ichida darslarni **tartib** bilan yozadi, tizim ularni
sinfning jadval slotlariga shu tartibda **oʻzi quyadi**. Sana — hosila.
Kutubxonadan boʻlim qoʻshilganda «shu sanadan boshlab joylash, mavjudlarni
surish» tanlovi bor.

### C. Gantt: avto va qoʻlda rejalashtirish
- Avto rejim: vazifa sanasi oldingisidan (bogʻliqlik) hisoblanadi.
- Qoʻlda sana qoʻyilgan vazifa **qadalgan** — bogʻliqlik uni surmaydi.
- Qadalgan vazifa tartibni buzsa (oldingisidan oldin tursa), tizim uni
  **surmaydi, balki ziddiyat sifatida koʻrsatadi**. Sabab: baʼzi sanalar
  tashqaridan belgilangan va avtomatik oʻzgarmasligi kerak.

### D. Pedagogik tadqiqot (pacing)
- Rejaga **zaxira darslar** qoʻyish tavsiya etiladi: har 1–2 (yoki 3–4)
  haftaga bitta; hammasini oxiriga emas — boʻlim oxiriga yoki oraliq
  nazoratdan 2–3 kun keyinga.
- Qaror kalendar emas, oʻquvchi tushunganiga qarab qilinadi — demak surish
  **normal hodisa**, istisno emas; tizim uni arzon qilishi kerak.
- Boʻlimlarni vaqt oʻqida koʻrsatish (boʻlim = boshlanish + davomiylik
  plitkasi, boʻshliqlar koʻrinadi) — yillik rejaning standart koʻrinishi.

---

## 3. Taklif: «Oqim» modeli (B + A ning qadash/undo si + C ning ziddiyati)

### 3.1 Asosiy qoida
> **Tartib — haqiqat manbai, sana — undan hisoblanadi.**
> Sinfning oqimi = boʻlimlar tartibida, har boʻlim ichida darslar
> tartibida (`lessonOrderFor`). Oqimdagi darslar sinfning jadval
> slotlariga shu tartibda ketma-ket quyiladi.

Sana baribir `scheduleByClass` da **saqlanadi** (dashboard, davomat,
planner shundan oʻqiydi — ularga tegmaymiz). Oʻzgarish shundaki, har bir
tahrirdan keyin bitta sof funksiya sanalarni qayta hisoblaydi.

### 3.2 Nima qimirlamaydi
1. **Oʻtmish muzlatilgan.** Bugundan oldingi sessiyalarni qayta hisoblash
   hech qachon koʻchirmaydi (oʻtilgan-oʻtilmaganidan qatʼi nazar).
   Oʻtmishdagi oʻtilmagan dars faqat mavjud «Oʻtildimi? → Yoʻq, sur»
   oqimi bilan keladi. Sabab: oʻqituvchi belgilashni unutgan boʻlsa, dars
   jimgina kelajakka uchib ketmasin.
2. **Oʻtilgan darslar** (`isTaught`) joyida qoladi — eski surish amalidagi qoida.
3. **Qadalgan darslar** — yangi belgi, sinf boʻyicha (`pinnedByClass`).
   Oqim ularning slotini band deb hisoblab, chetlab oʻtadi.

### 3.3 Qayta hisoblash — «slot havzasi» (amalga oshirildi)

Dastlabki gʻoya — «bugundan boshlab hammasini zich joylash» — rad etildi:
u ataylab boʻsh qoldirilgan kunlarni va qoʻlda tanlangan sanalarni
buzardi. Oʻrniga havza modeli (`src/lib/lesson-flow.ts`, sof funksiyalar):

- **Oqim (F)** — sinfning oʻtilmagan, qadalmagan va kelajakda sessiyasi
  bor darslari, ketma-ketlik tartibida (boʻlimlar tartibi → boʻlim ichidagi
  tartib; «Boʻlimsiz» oxirida — Darslar sahifasidagi raqamlash bilan bir
  xil). Davomiylik = kelajakdagi sessiyalar soni.
- **Havza (S)** — F egallagan kelajakdagi slotlar.
- **Qayta joylash** — S ni F ga tartib boʻyicha ketma-ket beradi. Havza
  yetmasa, oxirgi slotdan keyingi boʻsh jadval slotlari qoʻshiladi
  (`distributeTopics`); ortib qolsa, oxirgi slotlar boʻshaydi; joy
  topilmasa dars sanasiz qoladi (`to: null`).
- **Boʻshliqlar saqlanadi** — havza ichidagi boʻsh kun toʻldirilmaydi.
- **Toʻsiqlar** — oʻtilgan va qadalgan darslar: ketma-ketlikdagi oʻrni
  hisobga olinmaydi, slotini oqim chetlab oʻtadi.
- **Oʻtmish muzlatilgan** — bugundan oldingi yoki bugun boshlangan sessiya.
- **Sanasiz darslar** oqimda emas.

Har amal oqimni (F′) va havzani (S′) qanday oʻzgartiradi:

| Amal | F′ | S′ |
|---|---|---|
| Darslar / boʻlimlar tartibi, boʻlimga koʻchirish | yangi tartib (koʻchgan dars boʻlim oxiriga) | S |
| Darsni / boʻlimni oʻchirish, bankka qaytarish | F − X | S (boʻshliq yopiladi, oxiri boʻshaydi) |
| Qadash | F − X | S − X slotlari |
| Qadashni olish | F + X | S + X slotlari |

Planner'da darsni B slotiga qoʻyish (tashlash, sana tahriri, «keyingi /
oldingi slot», bankdan bogʻlash — `planDrop`):

| B da nima bor | Natija |
|---|---|
| Shu boʻlimdagi oqim darsi Y | **Qoʻyish**: tartib oʻzgaradi — keyinroqqa surilsa Y dan keyin, aks holda Y dan oldin; orada qolganlar suriladi |
| Boshqa boʻlimdagi oqim darsi | **Qadash**: dars B ga qadaladi, Y oldinga suriladi (boʻlim chegarasi buzilmaydi) |
| Hech narsa | Dars B ga oʻtadi va sana boʻyicha qoʻshnilari orasiga tartiblanadi; boʻlim chegarasi buzilsa — qadaladi. Eski slot boʻsh qoladi |
| Oʻtilgan / qadalgan dars, yoki B oʻtmishda | Oddiy koʻchirish, oqimga tegilmaydi |

«B da turibdi» planner koʻrinishi bilan bir xil oʻlchanadi: boshlanishi
B oraligʻiga tushgan sessiya (08:05 dagi dars 08:00–08:45 slotida). Dars
aynan oʻsha sessiyaning oʻrnini oladi. «Keyingi / oldingi slot»
oʻtmishdagi band slotni hamisha oʻtkazib yuboradi.

**Mos emaslik:** S ni F ga berish joriy holatni qayta hosil qilmasa —
sinfda «Sanalar darslar tartibiga mos emas · Moslash» chipi. Jimgina qayta
yozilmaydi.

**Qoʻllash va undo** (`useLessonFlow`): amal oldidan holat nusxasi →
amal → har taʼsirlangan sinfda qayta joylash → `applySessionMoves`.
«Bekor qilish» nusxani id boʻyicha qaytaradi (`restoreSnapshot`) — tartib,
boʻlim, oʻchirilgan darslar va sanalar birga.

«Keyingi darsga sur» ham oqimning bir holati (`useLessonFlow().bump`;
eski `planBump` olib tashlandi): oʻtmishdagi oʻtilmagan sessiya kelajakka
olinadi va dars oʻz tartibidagi birinchi slotni oladi, kelajakdagi dars
esa oʻz slotini havzadan chiqaradi — ikkalasida ham keyingilar bittadan
suriladi, oxirgisi yangi boʻsh slotga tushadi. Qadalgan dars surilsa
qadash olinadi. Surish oddiy holatda soʻramasdan qoʻllanadi (oldindan
koʻrish faqat sigʻmay qolish yoki mos emaslikda).

Qadash dars sinfda sessiyasiz qolganda (bankka qaytarish, sessiyani
olib tashlash) oʻz-oʻzidan olinadi — qayta bogʻlangan dars jimgina
«qadalgan» boʻlib qolmaydi.

### 3.4 Qaysi harakatlar oqimni ishga tushiradi

| Harakat | Natija |
|---|---|
| Darslar/boʻlimlarni tartiblash («Tayyor») | Sanalar yangi tartibga moslashadi |
| Boʻlim oʻrtasiga yangi dars | U oʻz oʻrnini oladi, keyingilar bir slot suriladi |
| Darsni oʻchirish / oqimdan chiqarish | Boʻshliq yopiladi, keyingilar orqaga tortiladi |
| Planner'da darsni boshqa sanaga tashlash | **Qoʻyish**: dars shu joyga oʻtadi (tartib ham oʻzgaradi), orada qolganlar suriladi. Menyuda — «Shu sanaga qadash» |
| Muharrirda sanani oʻzgartirish | Planner tashlash bilan bir xil qoida |
| «Keyingi darsga sur» | Mavjud amal — endi reflow orqali |
| Davomiylikni oʻzgartirish (+1 dars) | Keyingilar suriladi |
| Yangi bloklangan kun (taʼtil, kutilmagan yopilish) | «Shu kunlardagi darslarni surish» belgisi — standart yoqilgan |
| Yangi jadval versiyasi (`effectiveFrom`) | Shu sanadan boshlab qayta joylash taklifi |

### 3.5 Avtomatik, lekin nazorat ostida
- Kichik oʻzgarish (≤ 5 dars koʻchadi, hech biri sigʻmay qolmaydi) —
  **darhol qoʻllanadi** + toast: «4 ta dars sanasi surildi · Bekor qilish».
- Katta oʻzgarish, sigʻmay qolish yoki sanalar avvaldan tartibga mos
  emas — **oldindan koʻrish** oynasi: roʻyxat (eski sana → yangi sana) va
  ogohlantirish. Ikkinchi tugma amalga qarab: Darslar sahifasida
  «Sanalarga tegmaslik» (amal qoladi, sanalar oʻzgarmaydi), planner'da
  «Faqat shu darsni» (oddiy koʻchirish). ✕ — planner'da amal bekor.
- Qadalgan dars tartibni buzsa (masalan 8-dars qadalgan, 7-dars undan
  keyin tushib qoldi) — surilmaydi; qadalgan dars toʻsiq, oqim uni
  chetlab oʻtadi.

### 3.6 Sigʻmay qolish (pacing ogohlantirishi)
Oqim boshida kichik chip: «Yil oxirigacha 3 dars sigʻmaydi». Bosilsa —
qaysi darslar, va variantlar: zaxira darsni olib tashlash, darsni
birlashtirish, oqimdan chiqarish. Bu oʻqituvchiga eng foydali signal —
qogʻozda uni hech kim hisoblamaydi.

### 3.7 Zaxira darslar (2-bosqich)
Boʻlimga «+ zaxira dars» qoʻshiladi — slotni egallaydigan, lekin mavzusiz
element (takrorlash / qayta oʻtish uchun). Dars kechiksa, oʻqituvchi
zaxirani oʻchiradi va keyingi boʻlimlar joyidan qimirlamaydi. Tadqiqotdagi
«har 1–2 haftaga bitta, boʻlim oxirida» tavsiyasi shunga asoslanadi.

### 3.8 Koʻp sinfli dars
Har sinfning oqimi alohida (`orderByClass`, `scheduleByClass[classId]`,
`taughtByClass` — hammasi allaqachon sinf boʻyicha). A sinfda surish B
sinfga tegmaydi.

### 3.9 Mavjud maʼlumot
Hozirgi darslarda tartib va sana ajralgan boʻlishi mumkin (tartiblash sanaga
tegmagan). Birinchi marta oqim yoqilganda sinf boʻyicha tekshiriladi: mos
kelmasa — «Sanalarni tartibga moslash» oldindan koʻrish bilan taklif
qilinadi. Jimgina qayta yozilmaydi.

### 3.10 Maʼlumot modeli
`lessons.data` JSONB ichida, migratsiyasiz:
- `pinnedByClass?: Record<string, boolean>` — qadalgan.
- `flowExcludedByClass?: Record<string, boolean>` — oqimdan tashqari
  (gʻoya/zaxira mavzu, avtomatik joylanmaydi).

Zaxira dars (3.7) — `units` jadvaliga ustun yoki alohida `Lesson` turi;
2-bosqichda hal qilinadi.

---

## 4. Vizual bogʻlanish (3-bosqich)

Uch koʻrinish, oddiydan murakkabga:

1. **Zanjir** — Darslar sahifasida roʻyxat chap tomonida vertikal chiziq
   (metro xaritasi): boʻlim = bekat sarlavhasi, dars = nuqta + sana chipi.
   Holatlar: ✓ oʻtilgan (toʻla nuqta), 📌 qadalgan, ⚠ ziddiyat,
   sigʻmagan (uzuq chiziq). Tartiblashda sanalar jonli qayta hisoblanib
   koʻrinadi — «tortsam nima boʻladi» darhol ayon.
2. **Yoʻl xaritasi** — sinf uchun yillik vaqt oʻqi: gorizontal = haftalar,
   chorak chegaralari, taʼtillar soya bilan, «bugun» chizigʻi. Har boʻlim —
   birinchi va oxirgi dars sanasi orasidagi polosa, ichida darslar nuqta.
   Boʻshliqlar va sigʻmay qolish koʻzga tashlanadi. Keyinchalik: boʻlim
   polosasini sudrab tartibni oʻzgartirish.
3. **Planner'da bogʻ** — darsga hover qilinganda oqimdagi oldingi/keyingi
   dars ajratiladi, pill'da tartib raqami («2.3»).

---

## 5. Bosqichlar

1. **Oqim yadrosi:** `planReflow` + testlar; tartiblash, qoʻshish,
   oʻchirish, planner tashlash va sana tahriri shu orqali; qadash; toast +
   undo; oldindan koʻrish; sigʻmay qolish chipi; mavjud maʼlumotni moslash.
2. **Kalendar hodisalari:** bloklangan kun va jadval versiyasi triggerlari;
   davomiylik (choʻzish); zaxira darslar.
3. **Vizual:** Zanjir → Yoʻl xaritasi → planner hover.

## 6. Savollar — qaror (2026-09-27)

1. Planner'da tashlash standarti — **qoʻyish**; qadash menyuda va boʻlim
   chegarasi buzilganda avtomatik.
2. Oʻchirilgan dars boʻshligʻi — **avtomatik yopiladi**, undo bilan.
3. Oqim — **hamma sinfda standart yoqilgan**; mavjud maʼlumot «Moslash»
   chipi va oldindan koʻrish orqali.
4. Oldindan koʻrish chegarasi — **5 dars**.

Hali qilinmagan (1-bosqich ichida ham): dars muharririda sana tahriri
(`addScheduleForClass` / `removeScheduleForClass`), Materiallar va import
oynasidagi oʻchirish oqimga ulanmagan — ular boʻshliq qoldiradi, oqim
uni saqlaydi. Yangi dars sanasiz yaratiladi, shuning uchun «boʻlim
oʻrtasiga yangi dars» hali oqimni surmaydi.
