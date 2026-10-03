# Dars studiyasi — Topshiriqlar sahifasining yangi markazi

> **Holat:** 1-bosqich amalga oshirildi (2026-10-02). Loyiha egasi va jamoa
> tasdiqlagan reja asosida.
>
> Bogʻliq: `topshiriq-boshlash-markazi.md` (oʻtkazish oynasi — oʻzgarmadi,
> qayta ishlatiladi), `darslar-oqimi-taklif.md` (ish reja, dars oqimi),
> `taqdimot-spec.md` (jonli dars, Doska), `doska-*.md`.

---

## 1. Muammo

Topshiriqlar sahifasi **jurnal ustunlari** atrofida qurilgan edi: «Tayyor
testlar», toifalar, «Toifasiz», «Baho ustuni». Oʻqituvchining boshidagi
savol esa boshqa: **«ertaga 9-A da nima qilaman?»**. Kerakli gʻishtlar
(13 dars modeli, ish reja, AI materiallar, QR-karta, pult, OMR, jonli dars,
oʻyinlar, Doska) kodda bor edi, lekin toʻrt xil joyga sochilgan va
ularni bitta dars ketma-ketligiga yigʻadigan joy yoʻq edi. Real
foydalanuvchiga sahifa tushunarsiz edi (loyiha egasining bahosi).

## 2. Asosiy gʻoya

Sahifa **DARS** atrofida. Bir sinf, bitta dars (ish rejadan oʻzi keladi),
uch ustun:

```
┌─ 1. DARS REJASI ─────┬─ 2. DARS SSENARIYSI ─────┬─ 3. TAVSIYALAR ──────┐
│ Sinf pasporti        │ Tayyor: 4/6              │ Tanlangan blok uchun │
│ Model (avto-tavsiya) │ 1 Kirish · 5 daq         │ • material (AI,      │
│ Daqiqalar, maqsad    │   Dars boshi  ✓          │   shablon, tayyor)   │
│ Standartlar          │ 2 Tushuntirish · 10 daq  │ • tekshirish usuli   │
│ [AI bilan] [Shablon] │   Slaydlar   ✓           │   + SABABI           │
│ Bosqichlar, kim nima │ 3 Tekshiruv · QR-karta   │ • oʻyinlar           │
│ qiladi               │ ...                      │ • tashqi manbalar    │
│ [Qabul qilish]       │ [▶ Darsni boshlash]      │ [Hozir oʻtkazish]    │
└──────────────────────┴──────────────────────────┴──────────────────────┘
```

Yuqori qator: sinf chiplari (chap ustundan koʻchdi) va koʻrinish —
**Dars studiyasi** (standart) | **Barcha ishlar** (avvalgi roʻyxat, mantigʻi
oʻzgarmadi: ochiq ishlar, tayyor testlar, toifalar).

**Oʻqituvchi yoʻli — uch bosish:** sinf (mavzu oʻzi keladi) → «AI bilan
reja va ssenariy» → «▶ Darsni boshlash». Qolgan hamma narsa tahrirlash
uchun ochiq, lekin majburiy emas.

## 3. Tamoyillar

1. **Reja → ssenariy → oʻtkazish.** Reja (pedagogik tuzilma) va ssenariy
   (darsda qadamma-qadam nima ochiladi) ajratilgan, lekin bitta hujjatda.
2. **AI taklif qiladi, oʻqituvchi qaror qiladi.** AI natijasi «Taklif —
   koʻrib chiqing» deb belgilanadi; «Qabul qilish» — oʻqituvchining
   amali. Material (slayd, test) hech qachon oʻquvchiga toʻgʻridan-toʻgʻri
   ketmaydi: avval toʻplam muharririda ochiladi.
3. **Sharoit hal qiladi, taxmin emas.** Qaysi usul bu sinfda ishlashi —
   qoida asosidagi hisob (`lib/studio-advice.ts`), AI emas: tez, bepul,
   har safar bir xil. AI — mazmun uchun.
4. **Har tavsiyada sabab.** «Telefon yoʻq → QR-kartalar», «printer kerak»,
   «testda variantli savol yoʻq». Oʻchiq tugma emas, sabab.
5. **Tavsiya tartibi** (loyiha egasining talabi): avval Ustozona ichidagi
   va natijasi jurnalga tushadigan yoʻl → Ustozona-Games mashq oʻyinlari →
   tashqi saytlar.
6. **Ikkinchi nusxa yoʻq.** Reja — Darslar sahifasidagi oʻsha darsning
   oʻzida; oʻtkazish — mavjud oyna (`useLaunchFlow`); natija — mavjud
   `responses` → `publish.ts`.
7. **Halollik.** Mashq oʻyinlari oʻz soʻz bazasi bilan ishlaydi — bu ochiq
   yoziladi («mashq, jurnalga tushmaydi»).

## 4. Maʼlumot modeli — migratsiyasiz

| Ehtiyoj | Qayerda |
|---|---|
| Reja + ssenariy | `lessons.data.studioByClass[classId]` (`LessonStudio`, `lib/lesson-studio.ts`) |
| Sinf pasporti | `teachers.prefs.classEnv[classId]` (`ClassEnvironment`, `lib/lesson-models.ts`) |
| Blok materiali | `activity_sets.id` havolasi (`StudioBlock.setId`) |
| Oʻtkazish | mavjud `quiz_sessions` (oʻzgarmadi) |
| Refleksiya, «Oʻtildi» | `Lesson.reflection`, `setTaught()` (oʻzgarmadi) |

**Nega sinf boʻyicha:** bitta mavzu ikki sinfda turli sharoitda oʻtadi
(9-A da telefon bor, 9-B da yoʻq). Boshqa sinfdan nusxa olish mumkin —
usullar keyin shu sinfga qayta tekshiriladi.

**Nega `classPrefs` emas:** u `useClassStore` tomonidan snapshot bilan
yoziladi va yangi kalitni har safar oʻchirib yuborardi. `classEnv` alohida
kalit, sinf boʻyicha `jsonb_set` bilan atomik yoziladi.

Saqlangan hujjat erkin JSONB — oʻqishda `normalizeStudio()` yumshoq
tozalaydi (buzilgan blok tashlanadi, butun ssenariy emas).

### `LessonStudio`

```ts
{ v: 1, modelKey, duration, objective?, criteria?, accepted, source: "ai" | "template",
  stages: [{ id, code, name, minutes, goal, teacher?, students?,
             blocks: [{ id, kind, title?, brief?, setId?, setTitle?, method?, game? }] }] }
```

**Blok turlari** (vazifa, material turi emas): `warmup` (dars boshi),
`explain` (tushuntirish), `activity` (guruh ishi), `game` (oʻyin),
`check` (tekshiruv), `exit` (chiqish chiptasi), `homework` (uy vazifasi —
bitta, oxirgi bosqichda).

**Blok = Doskaning bitta ekrani** (kelgusi Dars rejimi, §8): blokda faqat
havola turadi, mazmun mavjud jadvallarda.

## 5. Reja tuzish

- **Model** — `selectModel()` fan va mavzudan tavsiya qiladi (13 model),
  oʻqituvchi almashtira oladi.
- **AI yoʻli** — `/api/ustozona-ai/generate` `kind: "studio"`
  (`lib/ai-studio.ts`). Ikkinchi AI yoʻli ochilmadi: kvota, provayder
  zanjiri, JSON rejimi umumiy; bitta reja — bitta kredit. Soʻrovga:
  mavzu, fan, sinf, ish reja atrofi, model bosqichlari va daqiqalari,
  sinf pasporti, darsga bogʻlangan standartlar, oldingi dars mulohazasi.
- **Tahlil yumshoq:** bosqichlar model shablonidan olinadi, AI faqat
  mazmun beradi. Model usulni sharoitga zid aytsa (telefonsiz sinfga
  «jonli») — tuzatiladi, rad etilmaydi.
- **AI'siz yoʻl** — `templateStudio()`: model bosqichlari + rol boʻyicha
  standart bloklar (boshlash → dars boshi, tushuntirish → slayd, mashq →
  guruh ishi + oʻyin (ekran boʻlsa), tekshirish → tekshiruv, yakun → chiqish
  chiptasi + uy vazifasi).

## 6. Tavsiyalar (`lib/studio-advice.ts`)

**Tekshirish usuli:**

| Usul | Kerak | Eng mos qachon |
|---|---|---|
| Jonli dars | telefon + ekran | ikkalasi bor |
| QR-kartalar | variantli savol; kartalar BIR MARTA chop etiladi | printer bor, telefon yoʻq (printersiz — «mos», bloklanmaydi) |
| Pult | pult toʻplami | pult bor |
| Qogʻoz + skaner | printer (har test uchun varaq) | — |
| Mustaqil test | telefon | — |
| **Tezkor (daftar varagʻi)** | variantli savol + ustoz telefoni | telefon ham, printer ham yoʻq — texnikasiz sinfning standart usuli |
| Ogʻzaki | hech narsa | doim «mos», jurnalga avtomatik tushmaydi |

**Tezkor tekshirish (2026-10-03).** Qishloq sinfida koʻpincha na printer,
na oʻquvchi telefoni boʻladi — ilgari bunday sinfga faqat «ogʻzaki»
(baholanmaydigan) usul tavsiya qilinardi. Endi standart usul — tezkor:
savol doskada yoki ovoz bilan, oʻquvchi istalgan varaqqa ismi va javob
harflarini yozadi, ustoz varaqlarni telefonda suratga oladi, AI oʻqiydi
(`/api/baholash/quick-check`), ustoz koʻrib chiqib jurnalga yozadi.
«Darsda oʻtkazish» oynasida alohida plitka (`LaunchMode = "quick"`),
kompyuterdagi QR telefonda shu rejimni ochadi (`?mode=quick`). Sinfda
internet boʻlmasa ham ishlaydi — suratlar keyin yuklanadi. ⚠️ Har surat
1 AI krediti (`quick-check` route) — free taʼrifda 300/oy.

**Oʻyinlar:** Arqon, Poyga — telefonda, test asosida, jurnalga
(`shellAvailability` sababi bilan); mashq oʻyinlari (Soʻz topish,
Krossvord, Xotira, Qaysi katta) — fanga qarab tartib, «oʻz mazmuni».

**Tashqi saytlar:** roʻyxat kodda YOʻQ (AGENTS.md — boshqa mahsulot nomi
yozilmaydi). Super-admin uni **`/admin/settings` → «Dars studiyasi —
tashqi saytlar»** da tahrirlaydi: nom, qidiruv qolipi, tartib, «Sinash»
(qolipni namunaviy mavzu bilan ochadi). Qiymat `app_settings` jadvalida
(`studio.externalSites`, migratsiya `0051`), har oʻzgarish audit
jurnalida, studiyada darhol koʻrinadi — deploy kerak emas.

Bazada yozuv boʻlmasa — zaxira sifatida muhit sozlamasi:

```
STUDIO_EXTERNAL_SITES='[{"name":"…","search":"https://…/search?q={q}"}]'
```

Faqat `https`, qolipda `{q}` (mavzu) shart, koʻpi bilan 8 ta. Oʻqituvchi
oʻz havolasini ham qoʻsha oladi (faqat http/https).

## 7. Darsni oʻtkazish — Dars pulti (1-bosqich)

«▶ Darsni boshlash» — toʻliq ekranli pult: chapda butun dars, markazda
joriy blok (bosqich maqsadi, «oʻqituvchi / oʻquvchilar», material),
tepada bosqich taymeri, strelkalar bilan oldinga/orqaga. Har blok mavjud
yoʻl bilan ochiladi:

| Blok | Ochiladi |
|---|---|
| Tushuntirish | Doska taqdimoti (`/doska?setId=…`) |
| Dars boshi, chiqish chiptasi | telefon + ekran boʻlsa — jonli (`&live=1`), aks holda taqdimot |
| Tekshiruv | usulga qarab: jonli → Doska; QR-karta / qogʻoz → oʻtkazish oynasining oʻz qadami; pult, mustaqil → usul ekrani |
| Oʻyin | Arqon/Poyga → oʻtkazish oynasi (oʻyin tanlangan); mashq → `/dashboard/games/<nom>`; havola → yangi oyna |
| Guruh ishi | Doska (taymer, guruhlar, gʻildirak) |
| Uy vazifasi | «Uyga berish» oynasi |

«Darsni yakunlash» — mulohaza (keyingi darsning AI rejasiga kiradi) va
«Oʻtildi» belgisi (Darslar sahifasidagi bilan bitta amal).

## 8. Keyingi bosqich — Doska «Dars rejimi» (muhokama uchun)

> **2026-10-02:** amalga oshirildi — `ustoz-pulti-spec.md` (Doska dars
> rejimi va telefon pulti).

Loyiha egasining taklifi: darsni oʻtkazishning asosiy maydoni **Doska**.
Yoʻnalish: **Studiya — tayyorlash, Doska — oʻtkazish.**

- «▶ Darsni boshlash» Doskani shu dars bilan ochadi
  (`/doska?lesson=<id>&classId=…`); ssenariy Doska ekranlariga aylanadi —
  har blok bitta ekran (taqdimot vidjeti, savol + yigʻish, oʻyin «Sayt»
  vidjetida, taymer/guruhlar).
- **Oʻqituvchi telefoni** bitta QR bilan ulanadi va **pult** (keyingi /
  oldingi ekran) hamda **skaner** (QR-karta, OMR varaq) boʻladi.
- Natija mavjud sessiyalar orqali, dars oxirida «Jurnalga yozish» —
  bitta bosish.

⚠️ Doska maʼlumoti hozir faqat brauzerda (`murabbiyona-doska-v1`) va
uning ustida jamoadoshlar faol ishlayapti — bu bosqich ular bilan
kelishib, alohida PR'da quriladi. Studiya bloklari shunga tayyor shaklda
saqlangan.

## 9. Nomlar — bir xil nomli, turlicha ishlaydigan tugmalar ajratildi

| Joy | Eski | Yangi | Nega |
|---|---|---|---|
| Tezkor yaratish (AI) | «Test» | «AI test» | qoʻlda yaratishdagi «Test» bilan bir xil nom, ishi boshqa |
| Tezkor yaratish (AI) | «Taqdimot» | «AI taqdimot» | xuddi shunday — qoʻldagi «Taqdimot» |
| Tezkor yaratish (AI) | «Interaktiv dars» | «Slayd + savollar» | «Dars» hujjati va «Dars rejasi» bilan chalkashardi; aslida savolli taqdimot |
| Tezkor yaratish | «45 daqiqalik dars rejasi» | «Dars rejasi hujjati» | endi Dars studiyasi ham reja tuzadi: biri — matnli hujjat (muharrir), ikkinchisi — tuzilgan reja + ssenariy |

Oʻzgarmadi (nomi bir xil koʻrinsa ham bir narsa): «Tayyor testlar»
roʻyxati va «Tayyor testni tanlash» — ikkalasi shu sinfning tuzilgan
testlari; «Test banki» (butun test sinfga) va «Test bankidan savollar
olish» (savollar joriy testga) — nomlari allaqachon farqli.

## 9.1 Ish maydoni, fokus rejimi va yoʻl-koʻrsatkich (2026-10-03)

Loyiha egasining talabi: ustunlar ustida uch qavat (brauzer, Ustozona
sarlavhasi, studiya qatorlari) joyni yeydi va matn mayda; oʻqituvchi
uch ustunda nima qilishini qisqa, xalaqitsiz koʻrsatmalardan bilsin.

- **Bitta qator.** Sinflar (`ClassChips`), dars tanlagich, amallar va
  koʻrinish (`ViewToggle`) — BITTA panelda; 2xl+ da bir qatorda.
  Studiyada sahifa chekkasi va oraliqlar ham ixcham (p-4 / gap-3).
- **Kattaroq matn.** Ustunlar `.studio-scale` ostida (DESIGN.md §3).
- **Fokus rejimi** (`useStudioFocus`, ⛶ tugmasi): brauzer toʻliq ekrani +
  Ustozona sarlavhasi yashiriladi (`html[data-studio-focus]`) + yon panel
  yigʻiladi. Esc yoki shu tugma — hammasi avvalgi holatiga qaytadi.
- **Yoʻl-koʻrsatkich** (`StudioGuide.tsx`). Toʻrt qadam, har biri oʻz
  vaqtida va BIR MARTA (brauzer xotirasi):
  1. reja yoʻq → «Dars rejasi» (chap ustun);
  2. reja endi tuzildi → «Dars ssenariysi» (oʻrta ustun);
  3. tayyor boʻlmagan blok tanlandi → «Tavsiyalar» (oʻng ustun);
  4. hamma blok tayyor → «Darsni boshlash» (tugma).
  Pufakcha yorqin (`bg-info`), 10 soniyada oʻzi yopiladi (sichqoncha
  ustida taymer toʻxtaydi), fonni qoraytirmaydi va sahifani bloklamaydi.
  «?» tugmasi — hozirgi qadamni qayta koʻrsatadi, «Keyingi qadam» bilan
  toʻrttalasini ketma-ket oʻtish mumkin.
- **Animatsiya.** Reja tuzilgan zahoti ssenariy va tavsiyalar ustunlari
  pastdan koʻtarilib «ochiladi», ssenariy halqasi ikki marta yonadi.
  Tayyor boʻlmagan blok bosilsa — nuqta tavsiyalar ustuniga uchadi va
  ustun bir marta yonadi: «endi shu yerda sozlanadi». Faqat
  `transform`/`opacity`; «kam harakat» rejimida animatsiyasiz.

## 10. Keyingi qadamlar

1. Doska «Dars rejimi» (§8) — jamoa bilan kelishib.
2. «Hammasini tayyorla» — barcha bloklar materialini bir bosishda (koʻrib
   chiqish roʻyxati bilan).
3. Arqon «2 jamoa» rejimi Ustozona testi bilan — smartdoskada butun sinf.
4. Mashq oʻyinlari Ustozona mazmunini oʻqisin (soʻzlar, juftliklar).
5. LessonLab va Ustozona QR-kartalari yagona tizimga.
6. Qoʻlyozma varaqni rasmdan tekshirish Ustozona'da.
7. Tashqi saytlar roʻyxati uchun admin sahifasi (hozir muhit sozlamasi).
