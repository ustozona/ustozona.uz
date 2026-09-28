# Topshiriqlar — «Darsda oʻtkazish» va «Uyga berish» (bitta test, har qanday yoʻl)

> **Holat:** v1 amalga oshirildi (2026-09-27). Bu hujjat Topshiriqlar
> boʻlimining yangi mantigʻi — nima uchun, qanday va qayerda.
>
> Bogʻliq: `ost-loyihalar-arxitektura.md` (B — baholash yadrosi),
> `baholash-integratsiya.md` (OMR/QR shartnomasi), `taqdimot-spec.md`
> (jonli dars), LessonLab repo: `CLAUDE.md` → «Ustozona bilan birlashuv».

---

## 1. Muammo — imkoniyat bor edi, yoʻl yoʻq edi

Kodda deyarli hamma narsa tayyor edi: onlayn test, jonli dars, oʻyin
qobiqlari, qogʻoz test (OMR), QR-kartalar, telefon skaneri, test banki,
jurnalga koʻchirish. Lekin ular **toʻrt xil joyga** sochilgan edi:

| Imkoniyat | Qayerda edi |
|---|---|
| Test tuzish, test banki, «Sessiya» | Topshiriqlar |
| Oʻyin, uy vazifasi, qogʻoz test, skaner, LessonLab importi | `/baholash` (yon menyuda yoʻq) |
| Jonli dars (proyektor + telefon) | Doska → Taqdimot vidjeti |
| Oʻyinlar katalogi | Oʻyinlar (iframe, LessonLab testlari bilan) |
| Pult | faqat LessonLab skaneri (Ustozona jurnaliga ulanmagan) |

Oqibati — oʻqituvchi tilida:

- «Sessiya», «toʻplam», «biriktirilmagan», «nashr», «formativ» — oddiy
  maktab oʻqituvchisiga tushunarsiz atamalar.
- Testni sinfga berish uchun 5–7 qadam va 3 xil ekran.
- Natijani jurnalga oʻtkazish — alohida modalda, toifa tanlab, faqat
  «summativ» toifaga; uy vazifasi natijasi «Uy ishi» ustuniga umuman
  tushmasdi.
- Natija jurnalga yozilgach sahifa yangilanmasdi — baho koʻrinmasdi.

## 2. Tamoyillar (jahon amaliyotidan — nomlar emas, mohiyat)

1. **Qarorlar: NIMA → QAYERDA → QANDAY.** Oʻqituvchi testni tanlaydi
   (qatorda allaqachon tanlangan), keyin tugmaning oʻzi qayerdaligini
   aytadi — «Darsda oʻtkazish» yoki «Uyga berish», va faqat darsda —
   usul. Sinf sahifada tanlangan; qolgan hamma narsaning oqilona
   standarti bor (muddat — ertaga, oʻyin — mos keladigan birinchisi).
2. **Vaziyat tili, texnik til emas.** Darsdagi usullar sinf haqiqatiga
   qarab guruhlangan: «Telefon bilan», «Telefonsiz». Oʻqituvchi
   «selfpaced» haqida emas, «bolalarda telefon bormi?» haqida oʻylaydi.
3. **Tugma nomi nima boʻlishini aytadi.** «Darsda oʻtkazish», «Uyga
   berish», «Testni tugatish», «Jurnalga yozish». Yolgʻiz «Boshlash»,
   «Berish», «Sessiya» ishlatilmaydi — «nimani? kimga?» degan savol
   qoldiradi (loyiha egasining fikri, 2026-09-27; nomlar jadvali — §3).
4. **Bitta bosish — ishlayapti.** Usul tanlangan zahoti sessiya ochiladi
   va kod + QR + havola ekranda. Sozlama faqat kerak boʻlsa (muddat,
   oʻyin turi) va u ham bitta qatorda.
5. **Bitta natija ekrani.** Qaysi yoʻl bilan oʻtmasin — telefon, oʻyin,
   qogʻoz, karta, pult — natija bitta joyda: kim qoʻshildi, kim tugatdi,
   kim necha foiz. «Jurnalga» — bitta tugma.
6. **Hammasi bitta jadvalga.** Arxitekturaning oʻzagi oʻzgarmadi: besh
   xil yigʻish usuli → bitta `responses` jadvali → bitta nashr yoʻli
   (`publish.ts`).
7. **Oʻyin — qobiq.** Tezlik va omad faqat oʻyin reytingiga taʼsir
   qiladi; jurnalga faqat toʻgʻri/notoʻgʻri kiradi (R33, oʻzgarmadi).
8. **Halollik.** Baholanmaydigan oʻyinlar «mashq» deb ochiq yoziladi;
   ishlamaydigan imkoniyat «tayyor» deb koʻrsatilmaydi.
9. **Ish yoʻqolmaydi.** Ochiq va natijasi hali jurnalga oʻtmagan
   ishlar sahifa tepasida turadi — oʻqituvchi «qayerga ketdi?» deb
   qidirmaydi.

## 3. Sahifa tuzilishi

```
Topshiriqlar (sinf tanlangan)
├── Sarlavha: [Test banki]  [+ Yaratish]  [⋯ LessonLab'dan olish]
├── «Hozir ochiq» — bolalar hozir ishlayotgan ishlar
│      Uy vazifasi · 12/28 topshirdi · ertaga 23:59 gacha
├── «Jurnalga yozilmagan» — tugagan, natija hali jurnalda emas
├── «Tugaganlar» (yigʻiq)
├── Tugallanmagan qoralama
├── Tayyor testlar            [Darsda oʻtkazish] [Uyga berish]
└── Toifalar → topshiriqlar   [Darsda oʻtkazish] [Uyga berish]  (test biriktirilgan boʻlsa)
```

Ikki tugma — **koʻrinadigan** (hover emas), test bor har qatorda; tor
ekranda faqat ikonka qoladi (`aria-label` bilan). Xuddi shu ikki tugma
topshiriq muharririda (test kartasida) turadi, test bankida esa
«Sinfga qoʻshish» + «Darsda oʻtkazish». Hammasi bitta komponent —
`components/launch/RunButtons.tsx`.

Sarlavhada «Boshlash» **yoʻq**: u avval «qaysi test?» deb soʻrardi va
nimani boshlashini aytmasdi. Test qatordan beriladi.

### Nomlar — eski va yangi

| Eski | Yangi | Nega |
|---|---|---|
| «Boshlash» (sarlavha) | olib tashlandi | nimani boshlashini aytmasdi |
| «Boshlash» (qator), «Sessiya» (muharrir) | «Darsda oʻtkazish» · «Uyga berish» | oʻqituvchining ikki haqiqiy niyati |
| Test banki: «Berish» | «Sinfga qoʻshish» | oʻquvchilarga hech narsa bermasdi — faqat roʻyxatga qoʻshardi |
| Test banki: «Berish va boshlash» | «Darsda oʻtkazish» | qaysi turdagi ish ochilganini aytmasdi; endi usul tanlanadi |
| «Biriktirilmagan testlar» | «Tayyor testlar» | texnik atama edi |
| «Yakunlash» / «Qayta ochish» | «Testni tugatish» / «Testni qayta ochish» | nimani? |
| «Natija kutmoqda» | «Jurnalga yozilmagan» | kim kutadi? — yangi nom keyingi qadamni aytadi |
| Oʻyinlar: «Sinfga berish» | «Topshiriq qilib berish» | oʻyin Topshiriqlarga baholanadigan ish boʻlib tushadi |
| Oʻyinlar: «Uyga mashq» | «Mashq havolasi» | aslida havola nusxalanadi, baholanmaydi |

## 4. Oʻtkazish oynasi

```
Qaysi test?  →  Oʻquvchilar qayerda ishlaydi?  →  Darsda qanday oʻtkazamiz?
(qatordan kelsa    (tugmadan kelsa                (faqat «Darsda»)
 oʻtkazib           oʻtkazib yuboriladi)
 yuboriladi)
```

«Oʻquvchilar qayerda ishlaydi?» ekrani faqat tugmasiz kelinganda
chiqadi (Oʻyinlar sahifasi — oʻyin darsda ham, uyda ham boʻladi).

**«Darsda oʻtkazish» — usullar:**

| Guruh | Usul | Nima boʻladi | Sessiya |
|---|---|---|---|
| 📱 Telefon bilan | **Jonli dars** | Doska yangi oynada, savol proyektorda, javob telefonda, oʻqituvchi boshqaradi | `live` |
| | **Oʻyin** | Arqon, Poyga… — har kim oʻz telefonida | `selfpaced` + `render_config.shellId` |
| | **Mustaqil test** | Har kim oʻz tezligida, darsda | `selfpaced` |
| 📄 Telefonsiz | **Qogʻoz test** | Varaq chop etiladi, telefon kamerasi tekshiradi | `paper` |
| | **QR-kartalar** | Karta bir marta chop etiladi, bola kartani burab koʻtaradi | `paper` |
| | **Pult** | Radio pultlar (qabul qilgich noutbukka ulanadi) | `paper` |

**«Uyga berish» — bitta ekran:** muddat (Bugun / Ertaga / 3 kun /
1 hafta / sana) va koʻrinishi — «Oddiy test» yoki shu testga mos oʻyin
(Arqon, Poyga). Havola + QR + Telegram. Sessiya: `selfpaced` + `due_at`
(oʻyin boʻlsa + `render_config.shellId`).

Jonli dars sinfda ham, onlayn ham ishlaydi — onlaynda oʻqituvchi Doska
ekranini ulashadi, oʻquvchi havola bilan qoʻshiladi.

⚠️ `paper` sessiyasi — «oʻqituvchi yigʻgan javoblar» maʼnosida:
qogʻoz varaq, QR-karta va pult uchalasi ham `applyOmrScan()` yoʻlidan
yoziladi. Bitta test bitta sinfda bitta `paper` sessiyasiga ega va bola
unda BIR MARTA qatnashadi (takror kiritish ochiq toʻxtatiladi — «800%»
xatosiga qarshi qoida, `baholash-scan.ts`).

## 5. Natija ekrani (sessiya paneli)

- **Qoʻshilish bloki** (ochiq sessiyada): katta kod, QR, havola,
  «Nusxalash», «Telegram'da ulashish», «Ekranga chiqarish» (proyektor
  uchun toʻliq ekran).
- **Sinf roʻyxati** — har bola: kutilmoqda / ishlayapti N/M / tugatdi,
  natija foizi. Ochiq sessiyada 5 soniyada bir yangilanadi (arxitektura
  qarori: realtime shart emas, polling yetarli).
- **Ochiq javoblar** — qoʻlda 0 / ½ / 1 bilan baholanadi (baholanmagani
  jurnalga 0 boʻlib tushadi — shuning uchun «Jurnalga» dan oldin
  koʻrinadi).
- **Tugmalar:** `Testni tugatish` → `Jurnalga yozish` → `Jurnalni
  ochish`. Tugatilgan test `Testni qayta ochish` bilan tiklanadi (R49).

### Jurnalga yozish — bitta bosish qoidasi

1. Test shu sinfdagi topshiriqqa biriktirilgan boʻlsa — natija **aynan
   oʻsha ustunga**, uning toifasi bilan. Savol berilmaydi.
2. Biriktirilmagan boʻlsa — bitta tanlov: «Qaysi toifaga?» (sinf
   toifalari + «Toifasiz»). Yangi ustun yaratiladi.
3. Faqat **tugatilgan**, **muddati oʻtgan** yoki **eskirgan** sessiya
   yoziladi — yarim ishlangan natija jurnalga tushmasin. Eskirgan —
   muddatsiz va 12 soatdan beri ochiq (masalan Doskada yopilmay qolgan
   jonli dars): dars allaqachon tugagan. Bunday ochiq sessiya
   yozilganda avval yopiladi. «Hozir ochiq» roʻyxati ham uni «hozir»
   deb koʻrsatmaydi — «Jurnalga yozilmagan» guruhiga tushadi.
4. Yozilgach jurnal serverdan qayta yuklanadi
   (`reloadGradesFromServer()`) — baho darhol koʻrinadi.

⚠️ **Oʻzgartirilgan qoida (2026-09-27):** natija endi «Uy ishi», «Sinf
ishi» kabi *yakuniy bahoga kirmaydigan* (formativ) toifaga ham
yoziladi. Ilgari `publish.ts` buni rad etardi. Sabab: jurnalda formativ
toifaning vazni 0 — u yakuniy bahoga baribir taʼsir qilmaydi
(`grades-v1-spec.md`: «Yakuniy bahoga: Kirmaydi»), oʻqituvchi esa xuddi
shu ballarni qoʻlda kiritaverardi. Rad etish faqat uy vazifasini
jurnalga oʻtkazish yoʻlini yopib turardi. **Qolgan himoyalar
oʻzgarmadi:** formativ *toʻplam* (fon importi) jurnalga yozilmaydi,
anonim ishtirokchi baho olmaydi, qayta yozish idempotent. Qoʻshimcha:
toifa boshqa sinfniki boʻlsa rad etiladi (ilgari tekshirilmasdi).

## 6. Oʻyinlar bilan bogʻlanish (ikki tomonlama)

**Topshiriqlardan →** «Oʻyin» usuli oʻyin qobiqlari roʻyxatini
(`lib/baholash-shells.ts`) koʻrsatadi, har birining mosligi kontentdan
**hisoblanadi** (`shellAvailability`) va mos kelmasa sababi yoziladi.
Tanlangan oʻyin `render_config.shellId` da saqlanadi — sahifa
yangilansa ham havola toʻgʻri qoladi. Oʻquvchi `/play/KOD?game=arqon`
dan kiradi, ismini roʻyxatdan tanlaydi va oʻyinga oʻtadi; savol va ball
Ustozonada.

Baholanmaydigan oʻyinlar (Xotira, Krossvord, Soʻz topish, Qaysi katta)
«Mashq» boʻlimida: ochish yoki havolasini ulashish (uyda mashq uchun).
Natija jurnalga tushmaydi va bu ochiq yoziladi.

**Oʻyinlardan →** Oʻyinlar sahifasi sarlavhasida «Topshiriq qilib
berish» tugmasi va oʻyin ichidagi test tanlagichida xuddi shu nomli
qator (Ustozona testi bilan). Ikkalasi ham shu oʻtkazish oynasini
ochadi — oʻyin oldindan tanlangan: avval test, keyin «darsda yoki
uyda». Tanlagich qatori faqat baholanadigan
oʻyinlarda (Arqon, Poyga) va faqat dashboard ichida chiqadi: mehmon
`/games` sahifasida uni bosishning maʼnosi yoʻq.

iframe protokoli (LessonLab `eg-embed.js` ↔ `GamesPanel.tsx`):

| Xabar | Yoʻnalish | Mazmun |
|---|---|---|
| `ustozona-games:nav` | oʻyin → Ustozona | `{game}` — qaysi oʻyin ochildi (oldindan bor) |
| `ustozona-games:ctx` | Ustozona → oʻyin | `{theme, lang}` (oldindan bor) + `assign: true` — faqat dashboard (**yangi**) |
| `ustozona-games:assign` | oʻyin → Ustozona | `{game}` — «shu oʻyinni topshiriq qilib berish» (**yangi**) |

Ikkala tomon ORIGIN va manba oynani tekshiradi; `game` faqat
`GAME_FILES` roʻyxatidan qabul qilinadi. Xabarda test yoki oʻquvchi
maʼlumoti YOʻQ — faqat oʻyin nomi; tanlov Ustozona oynasida qilinadi.

`assign: true` — imkoniyat eʼloni: oʻyin tomoni tugmani faqat ota sahifa
buni aytganda chizadi. Bayroq XOTIRADA turadi, saqlanmaydi — bir tabda
dashboard'dan mehmon sahifasiga oʻtilsa, tugma hech narsa qilmaydigan
joyda qolib ketmaydi. `ctx` iframe har yuklanganda (`onLoad`) qayta
yuboriladi, shuning uchun oʻyinlar orasida oʻtganda ham yoʻqolmaydi.

## 7. Pult — Ustozona jurnaliga

Qurilma: Arduino + 433 MHz qabul qilgich (LessonLab `arduino/`), noutbukka
USB orqali. Brauzer uni **Web Serial** bilan oʻqiydi (Chrome/Edge,
kompyuter). Qabul qilgich ikki formatdan birini chiqaradi — ikkalasi
ham qabul qilinadi:

```
{"pult":5,"button":"B"}     ← hozirgi sketch (RUN rejimi)
ID:5,BTN:B                  ← eski format
```

**Pult raqami = jurnaldagi tartib raqami** — QR-karta va OMR varagʻi
bilan bir xil qoida (`buildSheetPlan().roster[].no`). Qoʻshimcha
bogʻlash jadvali kerak emas: 5-raqamli bola 5-pultni oladi.

Oqim: savol katta koʻrinadi → bolalar tugma bosadi (javob berganlar
belgilanadi, harf yashirin) → «Javobni koʻrsatish» (taqsimot + toʻgʻri
variant, keyin oʻzgartirib boʻlmaydi) → «Keyingi». Pult ishlamay
qolsa bolaning kartochkasini bosib javobni qoʻlda qoʻyish mumkin.
Oxirida «Saqlash» → `POST /api/baholash/scan/apply` (qogʻoz varaq
bilan aynan bir yoʻl) → natija ekrani → «Jurnalga».

Savol raqamlanishi qogʻoz varaq bilan AYNAN bir xil
(`buildPultPlan()` — `loadPaperQuestions()` ning oʻzidan), aks holda
3-savol javobi 5-savolga yozilardi. 4 dan koʻp variantli savolda faqat
A–D tanlanadi (pultda 4 tugma) — bu ochiq ogohlantiriladi.

## 8. `/baholash` — arxivlandi

Sahifa endi koʻrinmaydi. Uning hamma imkoniyati Topshiriqlarga koʻchdi:

| Eski `/baholash` | Endi |
|---|---|
| Oʻyin / Uy vazifasi / Qogʻoz test tugmalari | «Darsda oʻtkazish» / «Uyga berish» |
| Varaq va QR-karta chop etish, skaner | «Qogʻoz test», «QR-kartalar» |
| LessonLab'dan sinf/test sinxronlash | Sarlavhadagi `⋯` → «LessonLab'dan olish» |
| Import natijasi (`?import=`) | Topshiriqlar sahifasining tepasida |

- `/baholash` → oʻqituvchi `/dashboard/assignments` ga, mehmon bosh
  sahifaga yoʻnaltiriladi (eski havola va xatchoʻplar uchun).
- Sitemap va bosh sahifa havolalaridan olib tashlandi.
- ⚠️ **Tirik qoladi:** `/baholash/skaner/[ticket]` (telefon skaneri —
  imzolangan chipta bilan ochiladi, navigatsiyada yoʻq) va
  `/api/baholash/*` (PDF, skaner). Skaner komponentlari
  `src/components/scan/` ga koʻchdi.
- Eski ish maydoni kodi git tarixida.

## 9. Maʼlumot modeli — migratsiyasiz

Yangi jadval ham, ustun ham yoʻq. Hammasi mavjud sxemaga tushadi:

| Ehtiyoj | Qayerda |
|---|---|
| Usul (oʻyin qaysi) | `quiz_sessions.render_config.shellId` |
| Qanday boshlangan | `quiz_sessions.render_config.launch` (`class` / `homework` / `game`) |
| Uy vazifasi muddati | `quiz_sessions.due_at` (bor edi) |
| Pult/karta/varaq javoblari | `paper` sessiya + `responses` (bor edi) |
| Jurnal ustuni | `assignments.source_session_id` / `set_id` (bor edi) |

## 10. Keyingi bosqichlar (bu ishga kirmadi)

1. **Topshirmaganlarga «T»** — sessiya yozilganda qatnashmagan bolaga
   `missing = "unsubmitted"` belgisi (hozir katak boʻsh qoladi).
2. **Mashq oʻyinlari testdan** — Xotira (`pairs`), Krossvord va Soʻz
   topish (`wordlist`) hamkor rejimida Ustozona kontentini oʻqisin va
   natija qaytarsin — shunda ular ham baholanadi.
3. **Proyektorda jamoaviy oʻyin** — Arqon «2 jamoa» rejimi Ustozona
   testi bilan (hozir faqat yakka rejim hamkor sessiyasida).
4. **Jonli oʻyin (podium)** — LessonLab jonli xonasi Ustozona testini
   ham qabul qilsin, natija `responses` ga.
5. **Pult bogʻlanishini saqlash** — pult buzilsa raqam almashishi uchun
   (hozir tartib raqami qoidasi).
6. **Telegram eslatma** — uy vazifasi muddatidan oldin botdan xabar.

## 11. Ish reja eslatmasi («+ Yaratish»)

Yangi topshiriq muharririda, sarlavha ostida — sinfning choraklik ish
rejasi (`components/work-plan/WorkPlanCard.tsx`, mantiq —
`lib/work-plan.ts`). Ekranni egallamaydi: yopiq holatda bitta qator
(«Bugun: 05. Reading…»), ochilganda joriy mavzu atrofi (2 oldingi ·
joriy · 2 keyingi), «Butun boʻlim» — chorakning hamma mavzusi.

Joriy mavzu: shu kuni darsi bor mavzu → boʻlmasa eng yaqin keyingi
sanali mavzu → sana umuman boʻlmasa oʻtilmagan birinchi mavzu (koʻp
oʻqituvchida reja import qilingan, sanalar hali joylanmagan).

«Olish» — mavzu nomi sarlavhaga, dars kuni sanaga (oʻtmishdagi kun
qoʻyilmaydi). Reja bu yerda tahrirlanmaydi — manba Darslar sahifasi.

**AI:** dars AI yordamchisi va «AI bilan reja tuzish» soʻroviga shu
darsning oldingi · joriy · keyingi mavzulari qoʻshiladi
(`lesson.plan` → `/api/ustozona-ai`): reja ketma-ketlikka mos boʻladi,
keyingi mavzu materiali oldindan berilmaydi.

## 12. Tezkor yaratish («+ Yaratish» markazi)

Maqsad: oʻqituvchi darsga tayyorgarliksiz kirgan boʻlsa ham 1–2
daqiqada bolalar uchun ish tayyorlay olsin. Muharrirda sarlavha va ish
reja kartasidan keyin — `assignments/_components/quick-create/`.

**Vaqt.** Qurilma mintaqasida jonli soat, hafta kuni, sana va yil
(`hooks/useNow.ts`, daqiqa chegarasida yangilanadi). Sinfning bugungi
darsi ish rejada boʻlsa — «Dars 10:00–10:45 · 18 daqiqadan keyin» yoki
«Dars ketmoqda · 12 daqiqa qoldi». Mintaqa nomi sichqoncha ostida.

**Mavzu.** Ish rejadagi bugungi (boʻlmasa keyingi) mavzu oʻzi turadi,
«Olish» uni almashtiradi, oʻqituvchi istalganini yozadi. Mavzu ish reja
darsiga bogʻlangan boʻlsa, AI soʻroviga shu dars atrofidagi reja qoʻshiladi.

**AI bilan** (`/api/ustozona-ai/generate`, mantiq — `lib/ai-materials.ts`):

| Tugma | Natija | Qayerga tushadi |
|---|---|---|
| Test | 5/10/15 ta 4 variantli savol | Toʻplam muharriri → avtomatik baholanadi |
| Interaktiv dars | Sarlavha → dars boshi (soʻz buluti/soʻrov) → 2–3 slayd + «tushundimi?» savoli (×2–3) → xulosa → chiqish chiptasi | Toʻplam muharriri (taqdimot) |
| Taqdimot | 7–10 slayd | Toʻplam muharriri (taqdimot) |
| Aqliy xarita, Infografika | 16:9 PNG rasm | Koʻrish oynasi: taqdimotga qoʻshish · chop etish (A4) · PNG |

- Javob **JSON**, streaming emas: Gemini'da `responseMimeType`, qolgan
  provayderlarda prompt + yumshoq tahlil (kod bloki qobigʻi, oxirgi vergul,
  1 dan sanalgan javob, harf javob — hammasi tuzatiladi; yaroqsiz
  savol tashlanadi, butun javob emas).
- Test variantlari tahlildan keyin **aralashtiriladi** — model toʻgʻri
  javobni koʻpincha A ga qoʻyadi.
- Kvota va provayder zanjiri dars AI yordamchisi bilan bir xil: bitta
  generatsiya — bitta xabar krediti. Xato kodi qaytadi, matnni mijoz
  oʻz tilida koʻrsatadi.
- Natija **hech qachon toʻgʻridan-toʻgʻri oʻquvchiga ketmaydi**: toʻplam
  muharriri qoralama bilan ochiladi, jim avtosaqlash uni topshiriqqa
  ulaydi, oʻqituvchi koʻrib, tahrirlab, keyin «Darsda oʻtkazish».
- Rasm (aqliy xarita, infografika) SVG → `<canvas>` → PNG; ranglar sinf
  rang dvigatelidan, matn eni tizim shrifti bilan oʻlchanadi. Slaydga
  «Katta media» maketi bilan tushadi — yangi slayd turi kerak boʻlmadi.

**45 daqiqalik dars rejasi** — ikkinchi AI yoʻli ochilmaydi: Darslar
sahifasidagi Reja ustasi shu mavzuning darsida ochiladi
(`/lessons/<id>?panel=plan`). Mavzu ish rejada boʻlmasa — «Boʻlimsiz»
ga yangi dars qoʻshiladi (boʻlimlar tartibi buzilmaydi). «← Orqaga»
oʻqituvchini topshiriq qoralamasiga qaytaradi (sessiya global).

**Tayyor shablonlar** (AI kerak emas, darhol): dars boshi — aqliy hujum
(soʻz buluti + «qancha bilasiz?»), «Tushundingizmi?» soʻrovi, chiqish
chiptasi. Matnlar oʻqituvchi tilida.

**Qoʻlda** — boʻsh test/taqdimot (`MaterialKindPicker`, «tez orada»
turlari joyida) va «Tayyor testni tanlash».

**Proyektorsiz sinf** — test «Qogʻoz test», «QR-kartalar» yoki «Pult»
bilan oʻtadi (faqat oʻqituvchi telefoni), aqliy xarita va infografika
chop etiladi.

Ilgari bu joyda «Baholash usuli: Qoʻlda | Avtomatik» tanlovi turardi va
yaratish yoʻli «Avtomatik» ortida yashirin edi. Tanlov hech narsani
saqlamasdi — u faqat yoʻl ochuvchi edi. Endi yoʻl doim ochiq; qoʻlda
baholanadigan ish uchun hech narsa tanlash shart emas, «Yaratish»
baribir jurnal ustunini tugʻdiradi (R214).

**«← Orqaga»** (`components/ui/back-button.tsx`) — toʻliq ekranli
oynalarning chap yuqori burchagida, ilgari bezak ikonka turgan joyda:
topshiriq muharriri (ostidagi sahifaga, qoralama saqlanadi), toʻplam
muharriri, test banki, dars muharriri (ilova tarixida orqaga; toʻgʻridan
kirilgan boʻlsa — Darslar sahifasi, shu sinf VA boʻlim bilan).

### Keyingi qadamlar

1. Toʻplam muharririda «AI bilan savol qoʻshish» — mavjud slaydlar
   boʻyicha tekshiruv savoli.
2. Taqdimotni PPTX qilib yuklab olish (internetsiz smartdoska uchun).
3. Rasm generatsiyasi (hozirgi provayderlar faqat matn beradi) — slaydga
   rasm hozircha qurilmadan yuklanadi.
