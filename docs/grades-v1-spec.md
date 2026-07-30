# Baholar jurnali (Grades) — v1 spetsifikatsiyasi

> **Holat:** kelishilgan (Daisy Christodoulou + Komil Jalilov prinsiplari asosida).
> Bu hujjat — yagona haqiqat manbai. Implementatsiya shunga qarab boradi.

## 0. Falsafa (nega shunday)

Tizim shunchaki "ball yigʻish asbobi" emas, **valid inferensiya** (oʻquvchi bilimi haqida toʻgʻri xulosa chiqarish) tizimi. Har topshiriq — bilim domenidan olingan **namuna** (sample). Asosiy tamoyillar:

- **Termometr va termostat ajratiladi:** summativ (natijani oʻlchaydi) va formativ (jarayonni yoʻnaltiradi) hech qachon aralashmaydi.
- **Ochiq vazn (explicit), yashirin emas:** baholash niyati oʻqituvchi tomonidan koʻrinadigan, audit qilinadigan tarzda belgilanadi.
- **Soddalik validlik xizmatida:** kognitiv yukni oshiruvchi har qanday murakkablik subyektiv xato manbaidir; uni olib tashlaymiz.
- **Dalil yoʻqligi ≠ bilim yoʻqligi.**

## 1. Atamalar

| Atama | UI'da | Maʼnosi |
|---|---|---|
| Baholash toifasi | tugma: **"Toifa"**, modal: **"Baholash toifasi"** | Topshiriqlar guruhi (Uy vazifasi, Nazorat, Imtihonlar…). Oʻqituvchi yaratadi. Ichki/hujjat atamasi: "domen". |
| Topshiriq | "Topshiriq" | Bitta baholash tadbiri (bitta ustun). |
| Baholash turi | Toifa modalida savol: **"Yakuniy bahoga: Kiradi / Kirmaydi"** | Summativ / Formativ. **Toifa darajasida** belgilanadi (topshiriqda emas). "Maqsad" emas. Modalda pedagogika atamasi (Summativ/Formativ) soʻralmaydi — natija tilida soʻraladi; atama faqat **roʻyxat badge'ida** koʻrinadi, oʻqituvchi uni natijani koʻrib oʻrganadi. |
| Toifa % | "Vazn" | Toifaning yakuniy bahodagi ulushi (faqat Summativ toifalarda). |
| Baholash shkalasi | "Shkala" | Foiz qaysi yorliqda koʻrsatiladi (5-ballik, A+…F, Pass/Fail…). **Toifa darajasida**, presetdan. |

**"Mavzu" atamasi butunlay olib tashlanadi.** Summativ/Formativ — **"Baholash turi"**, hech qachon "Maqsad" emas.

## 2. Hisoblash yadrosi (eng muhim)

### 2.1. Normalizatsiya
Har topshiriq ichkarida **0..1 (foiz)** ga keltiriladi:
```
foiz = score / maxScore
```
- `maxScore` — **faqat texnik kiritish shkalasi**. Vaznga **umuman taʼsir qilmaydi**.
  (Aks holda yashirin distorsiya qaytadi — bu rad etilgan.)
- maxScore vazifalari: xom ball kiritish qulayligi, oʻquvchiga ish hajmini bildirish, qisman ball aniqligi.

### 2.2. Bir darajali vazn — faqat Toifa %
**Koʻpaytuvchi (Yengil/Oddiy/Ogʻir/Imtihon ×0.5..×3) butunlay olib tashlanadi.**

- Bitta toifa ichida **barcha topshiriqlar teng tortadi**, hajmidan qatʼi nazar (5 savolli quiz = 40 savolli test, agar bir toifada boʻlsa).
- Topshiriq ahamiyatini farqlash kerak boʻlsa → **alohida toifa**. (Har xil ogʻirlik = har xil toifa.)

### 2.3. Yakuniy summativ baho
```
toifa_oʻrtachasi = mean(shu toifadagi summativ topshiriqlar foizi)   // teng oʻrtacha
yakuniy = Σ (toifa_oʻrtachasi × toifa_normallashgan_vazni)
```
- Vaznli toifalar yigʻindisi **avtomatik 100% ga normallashadi** (boʻshliq uchun oʻquvchi jazolanmaydi).
- Faqat foizi bor (summativ, ball kiritilgan) topshiriqlar qatnashadi.

### 2.4. Formativ
- Yakuniy bahoga **kirmaydi**. Diagnostik signal.
- Diagnostik qiymat: formativ > summativ boʻlsa — oʻquvchi tushunyapti, lekin nazoratda koʻrsatolmayapti (transfer muammosi).
- **Alohida ustun YOʻQ** (eski dizayn olib tashlandi). Formativ signal — toolbar'dagi **toggle** orqali "Holat" ustunining ikkilamchi qatorida koʻrsatiladi (default: Trend). Daisy: oʻqituvchi diqqati attainment'da qoladi, signal esa bir bosishda koʻrinadi.

### 2.5a. "Holat" ustuni (Daraja % + Trend) — muzlatilgan langar
Eski **Summativ** va **Trend** ustunlari bitta **"Holat"** ustuniga birlashtirildi (Daisy + Komil Jalilov kelishuvi):
- **Daraja % (attainment)** — yirik, markaziy, doimo koʻrinadi. BSB/ChSB rasmiy hisobotining poydevori — uni demote qilib boʻlmaydi (Komil Jalilov). Default anchor.
- **Trend chip** — burchakdagi kichik ↗/↘. Faqat **|Δ| > ±3pp deadband** boʻlganda koʻrsatiladi; aks holda neytral (yashirin) — oʻlchash shovqinini (SEM) trend deb koʻrsatmaslik uchun. Bu **±3pp = v1 SEM-proksisi**.
- **Toggle** yoqilsa, trend chip oʻrnida **formativ %** koʻrsatiladi.
- **Hover** (shadcn `HoverCard`) — katak ustiga kelganda "diagnostika xonasi". Katak minimal qoladi, tafsilot hover'da. Tushunarlilik qatlami (Daisy + Komil Jalilov):
  - **Sodda oʻzbekcha yorliqlar + ⓘ tooltip (har biriga qisqa izoh):** "Oʻzlashtirish", "Dinamika", "Formativ baho", "Summativ ishlar".
  - **Sinf bilan solishtirish:** alohida vizual chiziq (`LevelBar`) — oʻquvchi toʻldirilishi + sinf oʻrtachasi belgisi + "{±N}% sinfdan" (Daisy: ikkilamchi, mezonli baholashdan chalgʻitmaydi).
  - **Trend shovqini:** deadband ichida rang/raqam emas, **"Barqaror"** (Daisy: soxta aniqlikdan qochish).
  - **Baho dinamikasi grafigi** (oylik) — legenda: "Davr oʻrtachasi" / "Umumiy daraja".
  - **Pedagogik signal** (pastda, `Lightbulb`): tayyor "verdikt" emas — ehtiyotkor, ishonchlilikka qaratilgan yoʻnaltiruvchi qator. Ustuvorlik: dalil yoʻq → kam dalil (<3) → transfer → pasayish (+SEM eslatma) → oʻsish → barqaror.
  - **v2 ga:** "baho ehtimoli" (grade probability, boʻsaga ehtimolligi) — Daisy taklifi.
- Summary ("Oʻquvchi") qatorida: **sinf darajasi % + sinf trendi** (Daisy: sinf trendi ↘ boʻlsa — pedagogika/dastur muammosi signali, "termostat").
- **v2 ga:** haqiqiy per-student SEM (baholar soniga bogʻliq) bilan trend gating; retrieval/decay'ni hisobga oluvchi regressiya.

### 2.5. Q / T (Qatnashmadi / Topshirmadi)
- Ikkalasi ham oʻrtachadan **chiqariladi**.
- "T = 0 ball" qilinmaydi — bu xulq-atvorni akademik koʻrsatkich bilan jazolash boʻladi, validlikni buzadi.

## 3. Ishonchlilik (reliability) signali

- Summativ dalil kam boʻlsa (**N < 3** summativ topshiriq) — Summativ katakda **`!` indikator** (`text-warning`).
- `Tooltip`: *"Atigi N ta summativ topshiriq — dalil kam, baho ishonchliligi past."*
- Summativ ustunda **yorliq + aniq foiz birga**: masalan `4 (82%)` — chegara ("Paul va George") muammosi yechiladi.
- **v2 ga:** Kronbax-alfa, SEM ishonch oraligʻi, toʻliq statistik ekvayting.

## 4. Baholash shkalalari

- **Shkala toifa darajasida tanlanadi** (global emas) — chunki har xil toifa har xil oʻlchaydi (Ishtirok = Pass/Fail, Testlar = 5-ballik…).
- **Faqat preset** roʻyxatdan tanlanadi; **chegara (cut-score) raqamlari qulflangan** — oʻqituvchi qoʻlda surmaydi (Daisy: standartlar izchilligi).
- **"Custom" (qoʻlda chegara) v1 da YOʻQ.**
- **Pass/Fail (va sifat) toifalarda yorliq matni tahrirlanadi** (Oʻtdi/Oʻtmadi, Bajardi/Bajarmadi, Ha/Yoʻq), lekin chegara (50%) emas.
- ❌ **"Tanlash" (yorliq belgilash) kiritish usuli OLIB TASHLANDI (2026-07-30).** Ball — yagona kiritish usuli. Sabab (Daisy Christodoulou tahlili asosida): yorliq belgilash (masalan "Faol qatnashdi") aslida mavhum, subyektiv rubrika — akademik jurnalning ishonchliligini pasaytiradi. «Uy vazifasi topshirildimi» kabi *compliance* (tartibga boʻysunish) signallari endi **Xulq-atvor tizimi**da (`behavior_*` jadvallari) kuzatiladi — akademik jurnaldan mustaqil, chorak bahoga taʼsir qilmaydi. `topics.inputMode`/`passLabel`/`failLabel` ustunlari va `SelectCell` UI'i sxemadan chiqarildi (`drizzle/0024_same_photon.sql`).
- **Yakuniy kurs bahosi shkalasi — sinf darajasida** (`journalScaleByClass[classId]`), oʻqituvchi darajasidagi `journalScale` esa **fallback** (yangi sinf/eski hisob avtomatik ishlaydi). Sinflar aro jamlanma koʻrinishlar (Statistika umumiy sahifasi) **teacher default**da qoladi — bitta sinfning shkalasi hammasiga tatbiq etilmaydi. Jadvaldagi `Jami` ustuni va sinf oʻrtachasi shu (sinf) shkalada koʻrsatiladi.

**Maktab shkala kutubxonasi (preset):**
- 🇺🇿 Oʻzbekiston (yuqorida, default): **5-ballik** (default), **10-ballik**, **100-ballik/Foiz**, **Pass/Fail** (yorliq tahrirlanadi), **Sifat yorliqlari** (Aʼlo/Yaxshi/Qoniqarli/Qoniqarsiz).
- 🌍 Xalqaro maktab dasturlari: US letter +/− (A+…F), US letter (A…F), IB (1–7), Britaniya GCSE (9–1), Germaniya (1–6 teskari), Fransiya (0–20).
- Oliy taʼlim shkalalari (GPA 4.0, ECTS) — **kiritilmaydi** (bu maktab mahsuloti).

> Teskari shkalalar (5-ballik 5=aʼlo; 1–6 da 1=aʼlo) `min%/max%` orqali toʻgʻri boshqariladi.

## 5. Boshqaruv (governance-ready)

- Toifa, Shkala, Vazn — **alohida data qatlamda** saqlanadi.
- v1 da boshqaruv **oʻqituvchi darajasida**.
- Kelajakda "Loyiha/Maktab sozlamasi" yoqilganda — oʻqituvchidagi tahrirlash tugmalari **disable** boʻladigan qilib arxitektura tayyorlanadi.

## 6. Modal: "Yangi topshiriq" (yengil — v1)

- **Hammasi ochiq, Collapsible YOʻQ.** Toʻrt maydon:
  1. Sarlavha (`Input`, majburiy)
  2. Toifa (dropdown, **ixtiyoriy** — 2026-07-30: `topicId` NULL boʻlishi mumkin, boʻsh boʻlsa jadvalda **"Toifasiz"** virtual guruhga tushadi: DB qatori emas, tahrirlanmaydi/oʻchmaydi, vazn olmaydi) — **Summativ/Formativ va shkala toifadan meros olinadi**
  3. Sana (`Popover`+`Calendar`, default bugun)
  4. Maksimal ball (`Input number`, default 100)
- **"Baholash turi" (Summativ/Formativ) topshiriqda YOʻQ** — toifadan keladi.
- Eski "Vazn (Yengil/Oddiy/Ogʻir/Imtihon)" maydoni **olib tashlanadi**.
- **Sxemaga qoʻshildi (2026-07-30):** `assignments.kind` (`manual` | `test` | `deck` — qoʻlda / test / taqdimot, default `manual`) va `assignments.instructions` (oddiy matn). Hozircha faqat `manual` uchun muharrir bor; `test`/`deck` **tanlanadi va saqlanadi**, lekin "tez orada" holatida — hech qachon vaʼda qilinmagan funksiya sifatida koʻrsatilmaydi.
- **v2:** topshiriq → toʻliq hujjat (yoʻriqnoma, ilova, oʻquvchi topshiriqlari, Assign/Return — Google Classroom uslubi; toʻliq ekran overlay muharriri — bu C ishning keyingi bosqichiga qoldirildi).

## 7. Modal: "Baholash toifasi"

- Maydonlar: nom + rang, qaysi sinflarga, **Vazn** (dropdown: Vaznli/Vaznsiz + `%` — Vaznli tanlansa Toifa % koʻrinadi), **Baholash shkalasi (preset)**. Kiritish usuli maydoni **YOʻQ** — Ball yagona usul (2026-07-30, "Tanlash" olib tashlandi, §4 ga qarang).
  - **Vaznli** → `purpose: summative`, kiritilgan vazn.
  - **Vaznsiz** → `purpose: formative`, `weightPercent: 0`.
- **Toifa % editori:** oddiy `Input` + jonli `Progress` (normallashgan ulush). Yigʻindi **kam ham, koʻp ham** boʻlsa `Alert` bilan ogohlantirish.
- **Cut-score spreadsheet jadvali OLIB TASHLANADI** — shkala endi preset dropdown (`Select`). `Custom` preset ham YOʻQ.
- Roʻyxat kartalari — `.list-card`, `topicHex` accent; roʻyxat **grid/list/table** koʻrinish tabi bilan almashtiriladi (classes sahifasidagi naqsh).

## 8. Modal: "Qayta ishlatish"

- Boshqa sinfdagi topshiriqni joriy sinfga nusxalash. (Mantiq oʻzgarmaydi.)

## 9. Nashr (publish) xavfsizligi

- Har topshiriq ustunida **alohida nashr** qoladi.
- Global "Hammasini qaytarish" **`AlertDialog` tasdigʻi bilan** qoladi:
  *"N ta topshiriqdagi jami M ta baho nashr qilinadi."*

## 10. shadcn komponent xaritasi

| Yuza | Komponentlar |
|---|---|
| Yangi topshiriq modali | `Dialog`, `Form`/`FormField`, `Input`, `Select`, `Popover`+`Calendar` |
| Baholash toifasi modali | `Dialog`, `Select` (Vazn, shkala), `Input`+`Progress` (Toifa %), `Alert` (status), `.list-card` |
| Jadval | mavjud custom `Table` (TanStack'ga oʻtmaydi) + `Tooltip` (ishonchlilik) |
| Nashr tasdigʻi | `AlertDialog` |

Tokenlar: `text-label`, `.text-caption`, `scoreBarColor`, `topicHex`, `classTints`. Xom Tailwind/hex yoʻq.
Yangi oʻrnatish: majburiy emas (ixtiyoriy `Kbd`).

## 11. Tuzatilishi shart boʻlgan mavjud defektlar

1. **Cut-score editing olib tashlanishi** ilgari topilgan "shkala `rows` saqlanmaydi" defektini **yopadi** — endi shkala preset, qoʻlda tahrir yoʻq.
2. **Sinflar aro vazn jimgina tekislanadi:** tahrirda `Math.max(...weights)` olinib, saqlasa hammasiga bir xil yoziladi. Per-sinf farq yoʻqoladi — yo saqlanishi, yo ataylab "barchasiga tenglashtirish" deb soʻralishi kerak. ⚠️ Hali ochiq — C ishda tegilmadi.
3. ⚠️ **ESKIRGAN (2026-07-30, tarixiy):** `select` rejimi + sifat shkalasi mos kelmasligi `tierMidpoint()` bilan tuzatilgan edi, lekin shu kunning oxirida `select` kiritish usulining oʻzi butunlay olib tashlandi (§4) — bu yozuv endi amal qilmaydi, faqat tarix uchun saqlanadi.

## 12. v1 doirasidan tashqari (v2+)

> Toʻliq roʻyxat va tafsilot: [grades-v2-backlog.md](./grades-v2-backlog.md).

- Topshiriq → toʻliq hujjat (yoʻriqnoma, ilova, oʻquvchi topshiriqlari, Assign/Return).
- "Custom" shkala (qoʻlda chegara) — zavuch/governance qatlami bilan.
- Toʻliq statistik ekvayting (item qiyinchilik koeffitsiyenti).
- Kronbax-alfa / ichki ishonchlilik koeffitsiyenti.
- Comparative Judgement (insho/ochiq ishlar uchun alohida interfeys).
- Zavuch/kafedra roli va maktab darajasidagi qulflangan sozlamalar.
