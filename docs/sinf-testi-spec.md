# Sinf testi — QR-karta va radio pult Doskada

> Holat: 1-versiya (2026-10-02). Kod: `src/components/class-test/`,
> `src/lib/class-test.ts`, `src/styles/class-test-board.css`.
> Bogʻliq: [`ustoz-pulti-spec.md`](./ustoz-pulti-spec.md) (telefon pulti),
> [`dars-studiyasi-spec.md`](./dars-studiyasi-spec.md).

## 1. Nima va nega

Telefonsiz sinfda test: oʻquvchilarda **QR-karta** (burab koʻtariladi)
yoki **radio pult** boʻladi. Savol aqlli doskada (proyektorda) chiqadi.
Natija jurnalga tushadi.

Ilgari Doskada test umumiy taqdimot vidjetida koʻrsatilardi. Unda kim
javob bergani, savol natijasi va yakuniy reyting yoʻq edi. Telefondagi
karta skaneri esa Doska bilan bogʻlanmagan edi: savolni oʻzi sanardi,
natija faqat oxirida serverga ketardi.

Endi bitta **sinf testi sahnasi** bor. U LessonLab botidagi smart doska
oynasi bilan koʻrinishi va oqimi boʻyicha bir xil. QR-karta ham, radio
pult ham shu sahnada oʻtadi.

## 2. Oqim (4 ekran)

| Ekran | Nima koʻrinadi |
|---|---|
| **Kutish zali** | Test nomi, jurnal roʻyxati (tartib raqami + ism), sozlamalar: savol vaqti (s, 0 — taymersiz) va «har savoldan soʻng toʻgʻri javob». Kartasi oʻqilgan / pulti bosilgan oʻquvchi **yashil** boʻladi («keldi»). Telefon ulanmagan boʻlsa — pult QR'i. |
| **Savol** | Katta savol kartasi, A/B/C/D rangli plitkalar, tepada taymer chizigʻi, «N / M javob berdi», oʻquvchi chiplari. Javob bergani yashil ✓, **harf yashirin**: bolalar bir-birinikini koʻrmasin. Chip bosilsa javobni qoʻlda belgilash mumkin. Oʻngda «Javoblar» paneli. |
| **Savol natijasi** | «Javobni koʻrsatish» dan keyin chiqadi (sozlama yoqilgan boʻlsa): toʻgʻri javob foizi chizigʻi, variantlar taqsimoti (toʻgʻrisi yashil), reyting (ball). Sozlama oʻchiq boʻlsa — plitkalar xiralashadi, javob qulflanadi, toʻgʻrisi koʻrsatilmaydi. |
| **Yakuniy natijalar** | Kubok, umumiy foiz, ikki varaq: **Natijalar** (oʻquvchi × savol jadvali ✔/✘/○, savol boʻyicha %) va **Savollar** (har savol taqsimoti). Konfetti. **Jurnalga saqlash**. |

Boshqaruv uch joydan, hammasi Doskaning bitta amaliga tushadi:

- **telefon** (ustoz pulti) — asosiy yoʻl;
- **kompyuter** — pastdagi tugmalar va klaviatura: → / PageDown — keyingi,
  ← / PageUp — oldingi, Space / Enter — boshlash yoki javobni koʻrsatish,
  Esc — yopish;
- **radio pult** — faqat javob beradi, boshqarmaydi.

## 3. Qayerdan ochiladi

1. **Telefon** → Ustoz pulti → «QR-kartalar» yoki «Pult (radio)». Joriy
   ekrandagi taqdimot testi va sinfi bilan ochiladi.
2. **Topshiriqlar** → test → «QR-kartalar» → «Doskaga chiqarish». Bu
   `/doska?setId&classId&mode=cards` ni ochadi, sahna darhol chiqadi.
3. **Doska** → taqdimot vidjeti → «QR-kartalar» tugmasi. U faqat testda
   variantli savol boʻlsa chiqadi; sinf maʼlum boʻlmasa, avval sinf
   tanlanadi.
4. **Topshiriqlar** → «Pult» rejimi (`useLaunchFlow` → `PultRunner`). Endi u
   ham shu sahnada ochiladi.

Sahnani `DoskaRemote` chizadi, chunki ustoz pulti kanali ham u yerda.
Ochish soʻrovi `lib/doska/class-test-request.ts` orqali beriladi.

## 4. Maʼlumot oqimi

```
Telefon kamerasi (CardScanner, jonli rejim)
   │  ikki kadr bir xil → tasdiqlangan karta
   ▼
{type:"card", q, no, letter}  ── ustoz pulti kanali (broadcast) ──►  DoskaRemote
                                                                        │ remote-bus
                                                                        ▼
                                                    ClassTestRunner → useClassTest.receive()
                                                                        │
                                       ClassTestBoard (proyektor)  ◄────┘
                                                                        │ «Jurnalga saqlash»
                                                                        ▼
                                          /api/baholash/scan/apply → applyOmrScan (varaq bilan bir yoʻl)
```

- **Javob modeli:** savol raqami → oʻquvchi tartib raqami → harf. Bu
  `useClassTest` dagi `answers`.
- **Tartib raqami** — jurnal roʻyxatidagi oʻrin (`buildSheetPlan`). Karta,
  pult va varaq QR'i uchun qoida bir xil, alohida bogʻlash jadvali yoʻq.
- **Savol raqami** — qogʻoz varaqdagi raqam (`buildPultPlan`, faqat
  variantli savollar). Shu raqam bilan jurnalga yoziladi.
- **Holat** Doskada saqlanadi (localStorage, `ustozona_cards_…` /
  `ustozona_pult_…`). Sahifa yopilsa ham dars oʻsha savoldan davom etadi.
  Saqlangach yozuv oʻchiriladi.
- **Telefon kamerasi Doskaga ergashadi:** `live.question` oʻzgarsa,
  skaner yangi savolni oʻqiydi. Bola kartani burab javobini oʻzgartirsa,
  yangi harf ham yuboriladi. Javob ochilguncha Doska uni qabul qiladi,
  ochilgandan keyin savol qulflanadi.
- `q = 0` — kutish zali. Bu javob emas, «karta oʻqildi» belgisi.

## 5. Xavfsizlik

- **Toʻgʻri javob telefonga va kanalga chiqmaydi.** Ball Doskada
  hisoblanadi (oʻqituvchi cookie sessiyasi, `pultPlanAction`). Telefon
  faqat harf yuboradi, Doska esa telefonga faqat sanoqlarni
  (`ClassTestStatus`: bosqich, savol raqami, nechta javob) eʼlon qiladi.
- Kanal ommaviy broadcast boʻlsa-da, mavzusi tasodifiy 128-bitli va faqat
  imzolangan pult chiptasi orqali beriladi (`ustoz-pulti-spec.md` §4).
  Kelgan har buyruq `parseRemoteCommand` da tekshiriladi:
  - `q` va `no` — butun son, chegarada;
  - harf — faqat A–D yoki `null`.
- Ismlar (kamerada «Ali · B») telefonga skaner chiptasi bilan keladi.
  Test egaligi serverda tekshiriladi (`remoteScanTicketAction`).
- Jurnalga yozish mavjud yoʻldan boradi (`applyOmrScan`):
  - roʻyxatda yoʻq id rad etiladi;
  - allaqachon kiritilgan oʻquvchi qayta yozilmaydi.

## 6. Dizayn

Sahna — ilova paneli emas, **proyektor sahnasi** (`quiz-stage.css` bilan
bir xil istisno), shuning uchun stili alohida faylda:
`styles/class-test-board.css`.

- **Doim yorugʻ.** Qora fon proyektorda xira chiqadi. Rang qiymatlari
  Ustozona yorugʻ mavzusiga teng.
- **A/B/C/D ranglari — javob belgisi** (koʻk, moviy-yashil, sariq,
  pushti), brend urgʻusi emas.
- **Shrift** — Plus Jakarta Sans (`board-font.ts`, `preload: false`).
  Kirill harflari ilova shriftiga qaytadi.
- **Z-qatlam** — Doska qatlamlari ustida, parda ostida: telefondan
  «Ekranni yopish» sahnani ham yopadi. Chiqishni tasdiqlash oynasi
  sahnaning ichida.
- **Toʻliq ekran** — sahnaning oʻz tugmasi. Taqdimot vidjeti toʻliq
  ekranda boʻlsa, sahna ochilganda u yopiladi (aks holda sahna
  koʻrinmasdi).

## 7. Cheklovlar va keyingi qadamlar

- Bitta Doska — bitta sinf testi. Ikkinchisi birinchisi yopilgach ochiladi.
- Yakuniy ekranda taymer statistikasi (kim qancha vaqtda javob bergani)
  yoʻq.
- Telefonsiz kompyuter kamerasi bilan karta oʻqish yoʻq (keyingi bosqich).
- Doskasiz yoʻl saqlandi: telefonda «Doskasiz: kartalarni faqat telefonda
  yigʻish» bandi avvalgidek ishlaydi (`ScanPanel` → roʻyxat → «Jurnalga
  kiritish»).
