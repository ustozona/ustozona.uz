# Doska — darslik (PDF), audio va video tadqiqoti

> **Holat (2026-09-29):** tadqiqot va taklif (§1–§8); foydalanuvchi
> qarorlari — kitob toʻliq ekranda, oʻng media panel (§9); PDF oʻquvchilar
> tadqiqoti — standart funksiyalar (§10); asboblar va «Fokus» (§11).
> Kod yoʻq.
> Branch: `maxdum/doska-darslik`.
>
> Referens topilmalari **R342–R371** (oldingi raqamlar
> [doska-qolyozma-tadqiqot.md](./doska-qolyozma-tadqiqot.md) da, R330–R341).
> Mahsulot nomlari yozilmaydi — naqshning mohiyati tasvirlanadi
> (AGENTS.md). Ilmiy maqola, standart va brauzer hujjatlari manbasi
> bilan keltiriladi.

Asosiy xulosa bitta jumla: **audio belgisi kitob sahifasining oʻzida
tugmaga aylanishi kerak** — oʻqituvchi papkada fayl qidirmaydi, oyna
almashtirmaydi, sinf kutib turmaydi.

---

## 1. Muammo: ingliz tili darsi bugun qanday oʻtadi

Oʻqituvchi darslikni ekranda koʻrsatadi, u bilan tushuntiradi, keyin
undagi tinglash mashqlarini eshittiradi. Bugungi oqim:

1. PDF alohida dasturda ochiladi. Sahifa orqa partadan oʻqilmaydi,
   kattalashtirilsa oʻqituvchi joyni yoʻqotadi.
2. «Listen and check» — oʻqituvchi PDF dan chiqib, fayl oynasini ochadi
   va 100–150 ta bir xil nomli fayl (`…_SB_047.mp3`) orasidan keraklisini
   qidiradi. Sinf kutadi.
3. Standart pleyer: kichkina surgich, tezlikni pasaytirib boʻlmaydi,
   «oxirgi gapni yana» tugmasi yoʻq — sensorli panelda barmoq bilan
   taxminan orqaga suriladi.
4. Pleyer oynasi PDF ni yopadi: mashq va audio bir vaqtda koʻrinmaydi.

Maqsad — shu toʻrt ishqalanishni bitta vidjetda yoʻqotish.

---

## 2. Jahon amaliyoti — topilmalar

### R342 — Nashriyotlarning oʻqituvchi taqdimot vositalari (eng yaqin naqsh)

Yirik ingliz tili nashriyotlarining har biri oʻz darsligining «sinf
ekrani» versiyasini chiqaradi. Umumiy naqsh:

- Kitob sahifasi **asl koʻrinishida**; audio va video belgilari
  **sahifaning oʻzida** — bosilsa oʻsha joyda pleyer ochiladi.
- Pleyerda **tezlikni sekinlashtirish/tezlashtirish** va **skript**
  (audio matni); baʼzilarida skript audio bilan sinxron belgilanadi.
- Javoblar kaliti **birma-bir yoki hammasi birdan** ochiladi.
- Mashqni **alohida oynada kattalashtirish** («fokus»), lupa, yoritish,
  yashirish/ochish (parda).
- Qalam va marker, eslatma, xatchoʻp, sahifaga oʻz fayli yoki havolasini
  biriktirish.

Cheklov: har vosita **faqat bitta nashriyotning bitta kitobi** uchun va
har kitob qoʻlda tayyorlanadi; litsenziya kodi talab qilinadi, ayrimlari
oʻrnatiladigan dastur. Sinfni, roʻyxatni, dars rejasini bilmaydi.
Maktab oʻqituvchisida bunday litsenziya yoʻq — unda faqat xom fayllar
bor (R345).

### R343 — Vidjetli sinf ekrani xizmatining PDF vidjeti

Keng tarqalgan vidjetli sinf ekrani xizmatida PDF vidjeti bor: fayl
yuklanadi, strelka bilan varaqlanadi, ustiga yoziladi. Lekin:

- **yozuv sahifa boʻyicha saqlanmaydi** — sahifa almashsa yoʻqoladi
  (yordam sahifasida ochiq yozilgan);
- bepul rejada fayl saqlanmaydi, pullikda saqlanadi;
- video vidjeti — **faqat YouTube havolasi**; oʻqituvchining oʻz audio
  yoki video faylini ijro etuvchi vidjet yoʻq.

Yaʼni darslik audiosi masalasi u yerda umuman yechilmagan.

### R344 — Umumiy interaktiv doska dasturlari

Panel bilan keladigan va ochiq kodli doska dasturlarida PDF ning har
sahifasi alohida doska sahifasiga (rasm sifatida) import qilinadi;
audio/videoni **obyektga qoʻlda** biriktirish yoki yon kutubxonadan
sudrab qoʻyish mumkin. Imkoniyat bor, lekin 100+ trekli kitobni qoʻlda
bogʻlash bir necha soatlik ish — amalda hech kim qilmaydi.

**Xulosa (R342–R344):** yaxshi tajriba (audio sahifada) faqat nashriyot
qoʻlda tayyorlagan kitobda bor; universal vositalarda bogʻlash qoʻlda.
**Istalgan kitob uchun avtomatik bogʻlash — hech kimda yoʻq.** Bizning
imkoniyatimiz shu yerda (§6.1).

---

## 3. Mahalliy haqiqat — oʻlchangan

### R345 — Darsliklar va fayllar qayerdan keladi

2022–2023 oʻquv yilidan maktablarda ingliz tili xorijiy nashriyot
darsliklari bilan oʻtiladi: 1–6-sinf uchun bir seriya, 7–11-sinf uchun
boshqa seriya. Oʻqituvchilar PDF va audioni ochiq oʻqituvchilar
saytlari va Telegram kanallaridan oladi. Oʻlchangan (2026-09-28):

| Fayl | Hajm | Izoh |
|---|---|---|
| Audio, 1-sinf | 119 MB | RAR5 arxiv |
| Audio, 10-sinf | 379 MB | RAR5 arxiv |
| PDF namuna, 7-sinf (8 sahifa) | 6,3 MB | ≈ 0,8 MB/sahifa |
| PDF namuna, 1-sinf (12 sahifa) | 21,7 MB | ≈ 1,8 MB/sahifa |

Yaʼni bitta sinf toʻplami (kitob + audio) ≈ **0,3–0,6 GB**. Sayt
muallifining oʻzi ham toʻliq kitobni mualliflik huquqi sababli
joylamaydi — faqat namuna.

### R346 — 7–11-sinf kitobida audio belgilari matn qatlamidan topiladi

7-sinf namunasining matn qatlami (`pdfjs getTextContent`) tahlil qilindi:

- audio belgisidagi raqamlar **alohida shriftda**, balandligi 6 pt —
  sahifa raqami (15 pt) va mashq ichidagi raqamlardan (10 pt) aniq
  farq qiladi;
- raqamlar kitob boʻylab **ketma-ket**: 01, 02 … 14 (8 sahifada 15 ta
  belgi, 14 trek — bitta trek «Listen again» uchun ikki marta chiqadi);
- har belgining **sahifadagi koordinatasi** bor — bosiladigan nuqta aniq.

Audio fayl nomlari: `…_SB_000.mp3`, `…_SB_001.mp3` — belgi «03» = fayl
`…_003.mp3`.

→ Bu seriyada **toʻliq avtomatik bogʻlash mumkin**: shrift imzosi (bir
xil shrift va balandlik, faqat ikki xonali raqam, oʻsuvchi ketma-ketlik)
belgini topadi, raqam faylni topadi.

### R347 — 1–6-sinf kitobida matn qatlami buzilgan

1-sinf namunasida shriftlar Unicode xaritasisiz joylangan: matn
`❈ ✸ ✁ ✁ 1 ▲ ✂ ✄ …` koʻrinishida chiqadi, belgi raqamini matndan oʻqib
boʻlmaydi. Fayl nomlari boshqa naqshda: `…_Grade01_Lesson01_CD1-03.mp3`
(dars + CD-trek).

→ Bu seriyada avtomatik bogʻlash **ishlamaydi**; yarim-avtomatik yoʻl
kerak (§6.1 b).

⚠️ R346 va R347 qisqa namunalarda (8 va 12 sahifa) olingan — toʻliq
kitobda qayta tekshirilishi shart.

---

## 4. Pedagogika — tinglash pleyeri nima qila olishi kerak

### R348 — Tezlikni boshqarish tushunishni oshiradi

Zhao (1997): tinglovchi nutq tezligini oʻzi tanlay olganda tushunish
natijasi sezilarli yuqori boʻlgan; bunga **pauza va gapni qaytarish**
imkoni qoʻshilganda — yana ham yuqori. Tez yozuvni qayta-qayta
eshitish tezlikni pasaytirishning oʻrnini bosmagan.

→ Pleyerda tezlik (0,75 / 0,9 / 1) — ovoz balandligi oʻzgarmasdan
(R352) — va **gap boʻyicha qaytarish**.

### R349 — Muammoli joyni qayta eshittirish, gap oxirida pauza

Field (2008; 2019): javobning toʻgʻri/notoʻgʻriligini tekshirish emas,
**qayerda tushunmaganini aniqlash** (diagnostik yondashuv). Muammoli
boʻlakni qayta eshittirish, **gap oxirida pauza** — yangi kelayotgan
nutq oldingisini xotiradan siqib chiqaradi. 5 daqiqalik
**mikro-tinglash**: qiyin boʻlakni diktant qilib yozdirish. Skript —
tinglashdan **keyin**, tekshirish uchun.

→ «↺ oxirgi gap», A–B boʻlakni takrorlash, gapdan keyin avto-pauza
(diktant rejimi), skriptni keyin ochish.

### R350 — Imtihon formati: har yozuv ikki marta

Xalqaro til imtihonlarining tinglash qismida har yozuv **ikki marta**
eshittiriladi; oʻqituvchi sinfni shunga oʻrgatadi.

→ «2 marta» rejimi: 1-tinglash → belgilangan pauza → 2-tinglash →
toʻxtash; ekranda «1/2», «2/2».

---

## 5. Texnik cheklovlar

### R351 — Server saqlash v1 da imkonsiz; brauzerning shaxsiy fayl tizimi — ha

- Loyiha bepul rejadagi obyekt saqlagichda: **butun loyihaga 1 GB**,
  bitta fayl ≤ 50 MB, oyiga 5 GB chiqish trafigi. Bitta sinf toʻplami
  (R345) ham sigʻmaydi. Bu arxitektura hujjatidagi R6 va «video faqat
  havola» (B4.3) qarori bilan bir xil xulosa: fayl saqlash — alohida
  budjet qarori.
- Brauzerning shaxsiy fayl tizimi (Origin Private File System, OPFS)
  2023 dan barcha zamonaviy brauzerlarda bor. Chromium bitta saytga disk
  hajmining **60% gacha** beradi; `navigator.storage.persist()` bilan
  brauzer uni oʻzi oʻchirmaydi.

→ Fayllar **oʻqituvchi qurilmasida** turadi: serverga ketmaydi,
internetsiz ishlaydi, mehmon rejimida ham. Kitobni biz tarqatmaymiz —
mualliflik masalasi ham shu bilan yopiladi.

### R352 — Brauzer vositalari

| Vosita | Nima beradi |
|---|---|
| `playbackRate` + `preservesPitch` | Sekinlashtirilganda ovoz pastlashmaydi. 2023-12 dan barcha brauzerlarda (Baseline). |
| Web Audio `decodeAudioData` + RMS | Sukunat boʻyicha **gaplarga boʻlish** — skriptsiz «oldingi/keyingi gap». Bir marta hisoblanadi, natija saqlanadi. |
| pdf.js (`pdfjs-dist`) | Loyihada **bor** (`src/lib/pdf-to-images.ts`, dinamik import). Sahifani talab boʻyicha chizish + matn qatlami (R346). |
| `<input multiple>`, `webkitdirectory` | Koʻp faylni yoki butun papkani tanlash (papka — kompyuterda). |
| RAR | Brauzerda ochilmaydi. Oʻqituvchi ochilgan papkani tanlaydi; ZIP ni keyinchalik brauzerda ochish mumkin. |
| Media Session API | Tizim tugmalari bilan ▶/⏸. |

### R353 — Qurilma: Android panel

Mahalliy bozordagi maktab interaktiv panellari: Android 11, 4 GB RAM,
64 GB xotira. Xotira yetarli (R351), lekin RAM cheklangan → butun
kitobni oldindan rasmga aylantirmaslik (taqdimot importi shunday
qiladi, 60 sahifa chegarasi bilan), **faqat koʻrinayotgan sahifa va
keyingisi** chiziladi.

---

## 6. Taklif — nashriyot vositasidan ham yaxshiroq

### 6.1. Avtomatik bogʻlash — istalgan kitob uchun (R346, R347)

Uch pogʻona, har biri oldingisi ishlamaganda:

- **a) Matn qatlami.** Belgi-raqam ↔ fayl nomidagi raqam (R346).
  Oʻqituvchi hech narsa qilmaydi.
- **b) Belgilash rejimi.** Oʻqituvchi sahifadagi belgiga bir marta
  tegadi → ketma-ketlikdagi **keyingi trek** avtomatik taklif qilinadi
  va 2 soniya eshittiriladi; toʻgʻri boʻlsa — keyingi belgiga. Qidiruv
  yoʻq, faqat «ha / yoʻq».
- **c) Umumiy xarita** (keyin, qaror kerak). Bogʻlash xaritasi — faqat
  koordinata va trek raqami, kitobning oʻzi emas — PDF barmoq izi
  boʻyicha saqlanadi. Bitta oʻqituvchi belgilasa, shu faylni ochgan har
  kim tayyor holda oladi. Fayllar bir xil manbadan olinadi (R345),
  shuning uchun barmoq izi koʻp hollarda mos keladi.

### 6.2. Tinglash pulti — tadqiqot talab qilgani (R348–R350)

Bitta pult, ekranning pastida (yetish zonasi R319, qoʻl yopishi R328),
44 px nishonlar:

`▶/⏸` · `↺ gap` · `‹ gap  gap ›` · tezlik `0,75 · 0,9 · 1` · `A–B` ·
`2 marta` · (keyin) `skript`

Audio **Doska darajasida** ijro etiladi, sahifada emas: sahifa
varaqlansa, ekran almashsa ham davom etadi; bir vaqtda bitta audio.

### 6.3. Yozuv sahifada qoladi (R343 ga javob, R338)

PDF sahifasiga yozilgan belgi shu sahifaga bogʻlanadi — mavjud
`WidgetMeta.inkPage` mexanizmi, taqdimot slaydi bilan bir xil. Keyingi
darsda sahifa ochilsa yozuv turadi; tozalash — sahifa boʻyicha.

### 6.4. Mashqni kattalashtirish (R342 «fokus»)

Ikki marta tegish → sahifa shu nuqta atrofida kenglik boʻyicha
kattalashadi. Hudud tanlab «Markazga» chiqarish — mavjud spotlight
ustida yangi ish (hozirgi lasso faqat siyohni tanlaydi).

### 6.5. Sinfni biladi (bizning ustunlik)

Kirgan oʻqituvchida kitob **har sinf uchun** qayerda toʻxtaganini
eslaydi (7-A — 24-bet, 7-B — 22-bet). Yonida Gʻildirak — «3-mashqqa
kim javob beradi». Nashriyot vositasi sinfni bilmaydi.

### 6.6. Internetsiz, hisobsiz (R351)

Bir marta import — keyin har dars bitta bosish. Mehmon ham ishlatadi
(Doskaning mehmon qoidasi). Boshqa qurilmada — qayta import.

Fayl koʻchmaydi, lekin **bogʻlash xaritasi koʻchadi**: u bir necha KB
(belgi koordinatasi + trek raqami), PDF barmoq izi bilan kalitlanadi va
kirgan oʻqituvchida hisob bilan saqlanadi. Oʻqituvchi uyda noutbukda
belgilagan kitobni panelga fleshkadan qoʻshganda belgilar tayyor chiqadi.
Bu 6.1 c (umumiy xarita) ning shaxsiy, kichik qadami.

### 6.7. Video va alohida audio

Oʻsha pult (tezlik, ↺, A–B) mahalliy MP4 uchun; YouTube — havola bilan
(arxitekturadagi «video = havola» qarori). Alohida «Audio» vidjeti —
darsliksiz fayl (qoʻshiq, diktant).

---

## 7. Bosqichlar (taklif)

| Bosqich | Nima | Nega shu tartib |
|---|---|---|
| **1** | «Darslik» vidjeti: PDF (OPFS), varaqlash, kattalashtirish, sahifa siyohi, oxirgi sahifa; audio papkasini ulash + bogʻlash (a, b); pult: ▶/⏸, ↺ 5 s, tezlik, 2 marta | Asosiy ogʻriq — fayl qidirish. Bir oʻzi darsni oʻzgartiradi |
| **2** | Gapga boʻlish (sukunat), A–B, diktant pauzasi; «Audio» va «Video» vidjetlari | Pedagogik chuqurlik; 1-bosqich infratuzilmasi ustida |
| **3** | Sinf boʻyicha sahifa xotirasi (server), umumiy xarita (c), skript | Server va qaror talab qiladi |

Har bosqichdan oldin: toʻliq kitob (ikkala seriya) bilan R346/R347 ni
qayta tekshirish; haqiqiy Android panelda xotira va tezlik.

---

## 8. Qarorlar kerak

1. **Umumiy xarita (6.1 c)** — bogʻlash xaritasini oʻqituvchilar
   orasida ulashamizmi? Server va xato xaritani tuzatish yoʻli kerak.
2. **Vidjetlar soni** — «Darslik» + «Audio» + «Video» alohidami yoki
   bitta vidjet? Tavsiya: uchta alohida; «Darslik» panelda, qolgan
   ikkisi «Hammasi» katalogida.
3. **Pro chegarasi** — tavsiya: hammasi bepul (fayl qurilmada, bizga
   xarajat yoʻq); Pro — keyinchalik «bulutda saqlash» paydo boʻlganda.
4. **Rasmiy yoʻl** — taʼlim idoralari bilan rasmiy elektron darslik va
   audio (kitobni biz tarqatishimiz uchun) — biznes qarori, texnik
   rejaga taʼsir qilmaydi.

---

## 9. Qarorlar (2026-09-29, foydalanuvchi)

Maket 1 (kitob — kanvasdagi vidjet, pult pastda) koʻrib chiqildi.
Foydalanuvchi boshqa modelni tanladi — §6 dagi joylashuv shu bilan
almashadi, mantiq (bogʻlash, pult tugmalari, qurilmada saqlash) qoladi.

1. **Kitob toʻliq ekranda ochiladi.** Kanvasdagi vidjetlardan biri
   emas; boshqaruv faqat pastda.
2. **Audio/video — oʻngdan ochiladigan panel.** Oʻqituvchi papkani
   tanlaydi, ichidagi audio va videolar roʻyxat boʻlib chiqadi. Tavsiya
   (maketda): roʻyxat tepasida «Shu betda» boʻlimi — R346 bogʻlashi shu
   yerga tushadi; kitobdagi belgiga tegish ham panelni ochadi.
3. **Panel ochilsa kitob qisqaradi**, lekin qisqargan joyida
   kattalashtiriladi (ikki marta tegish, − / +, sudrab surish).
4. **Variativ, oʻqituvchi tanlaydi:** 1 bet yoki 2 bet; panel eni
   (sudrash, ikki marta tegish, chetga tortib yopish); panel tomoni.
   Tanlov eslab qolinadi.
5. **Texnika — shadcn Resizable** (`react-resizable-panels` 4.12.3,
   loyihada bor, `src/components/ui/resizable.tsx`, Jadvalda
   ishlatilgan). v4: `collapsible` + `panelRef.collapse()/expand()`,
   `minSize`/`maxSize`, `resizeTargetMinimumSize={{ coarse, fine }}`
   (sensorda katta tutqich), `useDefaultLayout` / `onLayoutChanged`
   (enni saqlash, PDF ni qoʻyib yuborilgandan keyin qayta chizish).
   Doskaga katta tutqich `className` bilan beriladi.

Maket 2 (tirik prototip): https://claude.ai/artifact/SkmgRQAnLsN8DtrPqJGhia

Ochiq: kitob Doska ichidagi rejimmi yoki alohida sahifa (tavsiya —
ichidagi rejim); kitobdagi belgilar qoladimi (tavsiya — ha, oʻchirsa
boʻladigan); video kitob oʻrnida yoki butun ekranda; standart bet soni
(maketda 1 bet).

---

## 10. PDF oʻquvchilar tadqiqoti (2026-09-29) — R354–R365

Foydalanuvchi oʻqituvchilar ishlatadigan PDF oʻquvchining skrinshotini
berdi va talab qoʻydi: uning funksiyalari **standart holatda** boʻlsin,
ustiga yaxshiroq imkoniyatlar. Keyin aniqlashtirdi: faqat bitta dastur
emas, **butun PDF oʻquvchilar** oʻrganilsin. 11 toifa koʻrildi:
panellarga oldindan oʻrnatiladigan ofis paketi, eng keng tarqalgan ish
stoli oʻquvchisi, tasmali ish stoli oʻquvchisi, ikki brauzerning oʻrnatilgan
oʻquvchisi, ochiq kodli veb-oʻquvchi (bizning kutubxona), yengil ochiq
kodli oʻquvchilar, sensor va qalam ilovalari, sinf uchun PDF izoh
platformasi, namoyish konsollari, flipbook platformalari, panelning oʻz
doska ilovasi.

### R354 — Nega oʻqituvchi aynan shu dasturni ishlatadi

Android interaktiv panellar ishlab chiqaruvchilari ofis paketini (PDF
oʻquvchi bilan) **oldindan oʻrnatadi**; maktab kompyuterlarida ham keng.
Skrinshotdagi pastki qator (chapdan): betlar paneli · birinchi · oldingi ·
[7 / 162] · keyingi · oxirgi · «7-betga qaytish» · … · oʻqish foni
(koʻz) · uzluksiz · bitta bet · ikki bet · namoyish · haqiqiy oʻlcham ·
butun bet · eni boʻyicha · 100% ▾ · − surgich + · toʻliq ekran. Tasmada:
qoʻl/belgilash, marker, matn izohi, matn qutisi, qidiruv, tarjima,
hududni kesib ustiga qadash, namoyish, burish; alohida «Skanerlar»
tasmasi (filtrlar, aniqlik, qoʻlyozmani olib tashlash, egrilikni
tuzatish, matnni tanish).

→ Oʻqituvchining qoʻli shu tartibga oʻrgangan. Doska «Darslik» pastki
qatori shu tartibni saqlaydi.

### R355 — «Koʻrish yadrosi» — hammasida bor (majburiy minimum)

Barcha toifalarda takrorlanadi: bet raqami (kiritish) + oldingi/keyingi
+ birinchi/oxirgi; eskizlar va mundarija; bitta bet / uzluksiz / ikki
bet (/ ikki bet uzluksiz); butun bet / eni boʻyicha / haqiqiy / foiz,
− +; burish; toʻliq ekran; qalam va marker.

→ Bu Darslikning standart holatda koʻrinadigan qismi.

### R356 — Muqova alohida (yoyma juftlanishi)

Ikki bet koʻrinishida birinchi bet yolgʻiz turadimi — koʻp oʻquvchida
alohida sozlama (tasmali ish stoli, Windows brauzeri, sensor ilovasi —
«muqova», «muqova uzluksiz»; ochiq kodli veb-oʻquvchida «toq/juft
yoyma»; yengil oʻquvchida «kitob koʻrinishi»). Usiz yoyma teskari
juftlanadi: chap bet oʻngga tushadi, bet raqami va umurtqa soyasi
notoʻgʻri tomonda.

→ Bizda koʻrinish menyusida, standart yoqiq; keyinchalik bosma bet
raqamidan (juft = chap) avtomatik aniqlanadi.

### R357 — Kitob raqami va PDF tartib raqami

PDF da «bet belgilari» (page labels) boʻlishi mumkin. Eng keng tarqalgan
ish stoli oʻquvchisi ikkalasini birga koʻrsatadi (masalan «12 (24 of
480)») va kiritishda bosma raqamni qabul qiladi. Koʻpchilik (skrinshotdagi
ham) faqat tartib raqamini koʻrsatadi — kitob esa «p.141» deb bosma
raqamga yuboradi. Skan kitoblarda belgilar odatda yoʻq.

→ Bizda bet maydoni kitob raqamini oladi, PDF tartib raqami yonida
yoziladi. Manba: `getPageLabels()`; boʻlmasa — sahifa matnidan yoki bir
marta soʻrab siljishni aniqlash.

### R358 — Sensor — alohida rejim sifatida

Ikki yirik ish stoli oʻquvchisida «sensor rejimi» bor: tugma, panel va
menyular orasi ochiladi. Yaʼni ular sichqoncha uchun qurilgan, sensor —
qoʻshimcha.

→ Bizda aksincha (Q3): sensor birinchi, nishon doim ≥ 44 px, alohida
rejim yoʻq.

### R359 — Namoyish rejimlari

- Yengil oʻquvchi: bet ekranga moslanadi, menyu va panel yoʻq, kursor
  3 s da yashirinadi; chap tugma — keyingi, oʻng — oldingi; **qora/oq
  ekran** (tugma bilan), lazer koʻrsatkich; raqam yozib betga oʻtish.
- Ochiq kodli universal oʻquvchi: namoyishda chizish rejimi.
- Namoyish konsollari: keyingi bet koʻrinishi, taymer, izohlar, umumiy
  eskizlar toʻri, ekranni muzlatish/oʻchirish, qalam va oʻchirgʻich,
  video ijrosi.
- Sinf izoh platformasi va ofis paketi: namoyish tugmasi.

→ Darslik namoyishi: boshqaruv yashirin, chetga tegib varaqlash, qora
ekran (B), kichik suzuvchi boshqaruv. Taymer, lazer, parda Doskada bor.

### R360 — Oq chetlarni kesish

Ochiq kodli universal oʻquvchi betning oq chetini olib tashlaydi yoki
tanlangan hududni hamma betga qoʻllaydi; sozlama saqlanib qoladi.
Boshqalarda yoʻq.

→ Proyektorda katta foyda: darslik betida chet qancha keng boʻlsa, matn
shuncha kattaroq chiqadi. Bizda foiz va koʻrinish menyusida.

### R361 — Rang rejimlari

Tun (oq-qorani almashtirish) — tasmali ish stoli, yengil oʻquvchi, sensor
ilovalari, sinf platformasi (qorongʻi rejim); sepiya va oʻz rangi —
sensor ilovasida; koʻz himoyasi — ofis paketida. **Skanni tozalash**
(fonni oqartirish, orqa bet izini olib tashlash) faqat ofis paketida —
va u **faylni tahrirlaydi**.

→ «Proyektor uchun aniq» — jonli filtr, fayl oʻzgarmaydi; hech birida
shu koʻrinishda yoʻq.

### R362 — Qidiruv va matnni tanish

Brauzer oʻquvchisi skan PDF ni avtomatik taniydi (qidiriladigan boʻladi);
ofis paketida alohida funksiya. Bizning kutubxonada qidiruv tayyor.

→ Keyingi bosqich: skan kitobga matnni tanish kerak (audio belgisini
topish uchun ham, R347).

### R363 — Izoh: betga yopishgan va ekranga yozilgan

Hammasida qalam/marker/matn/oʻchirgʻich bor (brauzer oʻquvchisida ham).
Panelning oʻz doska ilovasi esa «suzuvchi qalam» bilan **ekran ustiga**
yozadi yoki skrinshot olib doskaga koʻchiradi — bet surilsa yozuv
mazmundan ajraladi.

→ Doska qalami betga bogʻlanadi (R338) — panel qalamidan ustun.

### R364 — Betdagi audio/video — faqat qoʻlda va faqat ikki toifada

Sinf izoh platformasida video, rasm va ovozli izohni hujjatga **qoʻlda**
qoʻyish mumkin. Flipbook platformasida betga audio pleyer yoki «audio
ijro» amali — **qoʻlda**, yuqori tarifda. Oddiy PDF oʻquvchilarning hech
birida yoʻq.

→ R342–R344 xulosasi kuchaydi: belgini faylga **avtomatik** ulash hech
kimda yoʻq.

### R365 — Texnika: kutubxonada oʻquvchining yarmi tayyor

`pdfjs-dist` 6.3 (`web/pdf_viewer.mjs`) da: `PDFViewer` — `scrollMode`
(VERTICAL, HORIZONTAL, WRAPPED, PAGE), `spreadMode` (NONE, ODD, EVEN),
`currentScaleValue` (butun bet, eni, haqiqiy, avto), `pagesRotation`,
`nextPage/previousPage`, `increaseScale/decreaseScale`,
`setPageLabels` / `currentPageLabel`; `PDFHistory` (`back`, `forward`,
`pushPage`); `PDFLinkService` (`goToPage`, ichki havolalar);
`PDFFindController` (qidiruv); eskizlar va izoh tahrirlovchi qatlami.
`Autolinker` faqat veb-manzillarni topadi — «p.141» ni emas.

→ Koʻrish yadrosi noldan yozilmaydi; biz boshqaruvni (Doska uslubi,
sensor), audio qatlamini, jonli filtrni, «p.141» havolasini va sinf
xotirasini yozamiz.

### Olinmaydi / keyin

Olinmaydi: matnni qayta oqizish (darslik maketi buziladi), tahrir,
formalar, imzo, konvertatsiya, chop etish. Keyin: qidiruv (skanga
matnni tanish), lugʻat va tarjima, lupa. Ovozli oʻqish (kompyuter
ovozi) — tavsiya: yoʻq, ingliz tili darsida haqiqiy audio bor.

Maket 3 (tirik prototip, shu URL, 3-versiya):
https://claude.ai/artifact/SkmgRQAnLsN8DtrPqJGhia

---

## 11. Asboblar: ruchka, marker, lazer, lasso va «Fokus» (2026-09-29) — R366–R371

Foydalanuvchi: PDF darslik bilan ishlashda toʻrt asbob kerak — ruchka
(yozish), marker (belgilash), lazer (diqqatni qaratish), lasso (bir
qismni belgilab, faqat shuni koʻrsatish; butun ekranga chiqarish,
qaytganda yana darslikka). «Jahon tajribasida bormi?»

**Bizda bor narsa.** Doskada R330–R341 boʻyicha qurilgan: qalam, marker,
oʻchirgʻich (qisman), lazer (kometa izi, saqlanmaydi), lasso (faqat
SIYOHNI tanlaydi — rang, oʻlcham, surish, oʻchirish), chizgʻich,
transportir. Darslik shu asboblarni oladi — yangi siyoh tizimi
yozilmaydi; siyoh bet koordinatasida (R338 naqshi, `inkPage` =
kitob#bet). Yangi narsa — lasso bilan **kitob mazmunining** bir qismini
ajratish.

### R366 — Nashriyot «fokus»i — eng yaqin naqsh

Nashriyotning oʻqituvchi vositasida mashq butun ekranga ochiladi —
maqsad «butun betni emas, bitta mashqni» koʻrsatish. Ichida qalam,
marker, javobni tekshirish va koʻrsatish, audio va video ishlaydi;
yopilganda betga qaytiladi. Cheklov: faqat oldindan tayyorlangan
interaktiv mashqlar, faqat oʻsha nashriyotning oʻz kitoblari. Boshqa
nashriyot vositasida: betning istalgan qismini kattalashtirish,
spotlight, javobni ochish va yashirish.

### R367 — PDF oʻquvchilarda hudud bilan ishlash

Toʻrtburchak chizib kattalashtirish (hudud koʻrinishni toʻldiradi), lupa
oynasi, hududni rasm qilib olish, «kesib ustiga qadash» (ofis paketi),
hududni hamma betga qoʻllash. Hech biri alohida «fokus holati» va
«qaytish» bermaydi: kattalashtirish — oddiy masshtab (qaytish — qoʻlda
kichraytirish), rasm — nusxa (ustiga yozilgan narsa betga qaytmaydi).

### R368 — Sinf doskasi dasturlari va panel asboblari

«Sehrli qalam»: aylana chizilsa spotlight, toʻrtburchak — lupa, erkin
chiziq — bir necha soniyada soʻnadigan siyoh. Spotlight (yoritilgan
hududni rasm qilib olish bilan), parda (asta ochish). Panelning suzuvchi
asbobi: qalam, marker, oʻchirgʻich, lazer, spotlight, skrinshot va
ekranni muzlatish. Hammasi **ekran darajasida** — bet surilsa yoki
varaqlansa mazmundan ajraladi.

### R369 — Namoyish va doska platformalari

Slaydning tanlangan qismini 200 % ga lupa; lazer, qalam, marker.
Doska platformasida ramkaga bosilsa oʻsha ramka butun ekranga
kattalashadi, «chiqish» bilan doskaga qaytiladi. Ekran zoom utilitasi:
kattalashtirilgan tasvir ustiga chizish, tanaffus taymeri.

### R370 — Lazer turlari va sensorli ekran

Uch rejim: nuqta (kursor ortidan), iz (vaqtincha chiziq, soʻnadi),
«ushlab chiz». Oq doska ilovasida iz ushlab turilganda **toʻliq
koʻrinadi, qoʻyib yuborilgach soʻnadi**. Sensorli ekranda kursor
(hover) yoʻq — nuqta faqat barmoq tegib turganda koʻrinadi.

→ E-doskada asosiy rejim — iz; sichqoncha yoki pult bilan — nuqta.
Doska lazeri (kometa izi, chizish paytida soʻnadi) — «qoʻyib
yuborilgach soʻnish»ga oʻtkazish tavsiya: oʻqituvchi mashqni aylantirib
chizadi va gapirib turadi, iz shu paytda yoʻqolmasligi kerak.

### R371 — Lasso: avval tanlash, keyin amal

Qaydlar ilovasida lasso bilan belgilangan qismga menyu chiqadi: rang,
oʻlcham, oʻchirish, «skrinshot» (toʻrtburchak rasm), matnga aylantirish.
Tahrirlab boʻlmaydigan PDF mazmuni ustida faqat «skrinshot» qoladi.

→ Bizning lasso ham shunday: halqa yopilgach menyu; ichida siyoh boʻlsa
— siyoh amallari, har doim — «Katta koʻrsatish», «Yoritish», «Saqlash».

**Xulosa (R366–R371):** gʻoya jahonda bor, lekin boʻlak-boʻlak. Toʻliq
«fokus» faqat nashriyotning oʻz kitobida va oldindan tayyorlangan
mashqda; universal vositalarda — ekran darajasidagi lupa, spotlight yoki
rasm nusxasi. Birlashtirilgani yoʻq: **istalgan PDF + erkin hudud +
butun ekran + ichida hamma asbob va audio + yozuv betda qoladi + bir
tegishda qaytish + saqlangan fokuslar**.

### 11.1 Taklif — «Fokus»

1. **Ikki kirish:** lasso (aniq hudud) va ikki marta tegish (mashq bloki
   oʻzi topiladi — mashq raqamidan keyingi mashqqacha).
2. **Lasso menyusi:** «Katta koʻrsatish» · «Yoritish» · «Saqlash»; ichida
   siyoh boʻlsa — «Yozuvni oʻchirish».
3. **Katta koʻrsatish:** hudud ekranni egallaydi, qolgani koʻrinmaydi.
   Boshqaruv pastda: «Darslikka qaytish», «‹ oldingi · keyingi ›
   mashq», «Saqlash». Ichida ruchka, marker, lazer, oʻchirgʻich va
   kitobdagi audio belgisi ishlaydi.
4. **Yozuv betning oʻzida:** fokusda chizilgan chiziq bet koordinatasida
   saqlanadi — qaytganda darslikda oʻsha joyda turadi. Nusxa emas.
5. **Qaytish — bir tegish**, oldingi masshtab va joy tiklanadi.
6. **Saqlangan fokus:** betda kichik yorliq («4-mashq»); keyingi darsda
   va parallel sinfda bir tegishda ochiladi.
7. **Keyingi mashq:** fokusda ‹ › bilan betdagi mashqlar ketma-ket —
   kitob mashqlar slaydiga aylanadi.
8. **Yoritish:** hudud joyida qoladi, qolgani qorayadi — kontekst kerak
   boʻlganda.
9. **Aniqlik:** fokusda bet katta masshtabda qayta chiziladi (rasmni
   choʻzish emas).

### 11.2 Ochiq savollar

- **Yozuv qatlami:** bitta umumiy (bet — bitta yozuv) yoki sinf boʻyicha
  (7-A yozuvi 7-B da koʻrinmaydi) + oʻqituvchining oldindan tayyorlagan
  belgilari alohida qatlam?
- **Lasso bitta asbobmi** (menyu bilan) yoki «Fokus» alohida tugmami?
  Tavsiya: bitta lasso + ikki marta tegish.
- **Standart:** butun ekran yoki yoritish? Tavsiya: butun ekran.

---

## Manbalar

- Zhao, Y. (1997). *The Effects of Listeners' Control of Speech Rate on
  Second Language Comprehension.* Applied Linguistics 18(1), 49–68.
  https://academic.oup.com/applij/article-abstract/18/1/49/233475
- Field, J. (2008). *Listening in the Language Classroom.* Cambridge
  University Press.
- Field, J. (2019). *Second language listening: where are we?*
  https://www.cambridgeenglish.org/Images/524275-second-language-listening-where-are-we-john-field-cambridge-english-teacher-.pdf
- MDN, `HTMLMediaElement.preservesPitch`.
  https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch
- MDN, *Storage quotas and eviction criteria.*
  https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- web.dev, *The origin private file system.*
  https://web.dev/articles/origin-private-file-system
- Obyekt saqlagich cheklovlari: https://supabase.com/docs/guides/storage/uploads/file-limits
- Darslik namunalari va audio arxivlari (R345–R347, 2026-09-28 da
  yuklab oʻlchandi): https://hasanboy.uz/guess-what-va-prepare-darsliklari/
  va https://hasanboy.uz/1-11-sinf-yangi-darslik-audiolari/
- R342–R344: nashriyot vositalari, vidjetli xizmat va doska dasturlarining
  ommaviy yordam sahifalari (2026-09-28 da koʻrildi).
- R354–R364: foydalanuvchi bergan ikki skrinshot (pastki qator va tasma);
  11 toifadagi PDF oʻquvchi va panel ishlab chiqaruvchilarining ommaviy
  qoʻllanmalari, yordam sahifalari va texnik tavsiflari (2026-09-29 da
  koʻrildi; nomlar AGENTS.md qoidasi boʻyicha yozilmaydi).
- R366–R371: nashriyot vositalari, sinf doskasi dasturlari, panel
  asboblari, namoyish dasturlari, doska platformalari, oq doska va
  qaydlar ilovalarining ommaviy yordam sahifalari (2026-09-29 da
  koʻrildi).
- R365: `node_modules/pdfjs-dist` 6.3.289 — `types/web/pdf_viewer.d.ts`,
  `pdf_history.d.ts`, `pdf_link_service.d.ts`, `autolinker.d.ts`,
  `types/src/display/api.d.ts` (`getPageLabels`).
