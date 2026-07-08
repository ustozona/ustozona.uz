# Davomat modeli (v1) — pedagogik spec

Daisy Christodoulou va Komil Jalilov sharhlari asosida yakunlangan qarorlar.
Konstrukt: **"Oʻrganish imkoniyati" (Opportunity to Learn / Ishtirok)** — oʻquvchi
darsda boʻlganmi va oʻquv materialidan namuna olganmi.

## 1. Holat ogʻirliklari (foiz hisobida)
Foiz = `Σ(weight) / counted`, faqat **belgilangan** kataklar hisobga olinadi
(belgilanmagan — denominatorga kirmaydi). Vaznlar holat sozlamasidagi
`scoreImpact` siyosatidan keladi (`full`=×1, `half`=×0.5, `none`=×0,
`excluded`=maxrajdan chiqariladi) — SIS'lardagi "presence value" modeli;
`statusWeights`/`weightedRate` — `lib/attendance-data.ts`. Standart qiymatlar:

| Holat    | key     | weight | Izoh                                               |
|----------|---------|--------|----------------------------------------------------|
| Keldi    | present | 1.0    | Toʻliq ishtirok                                    |
| Kechikdi | late    | 0.5    | Darsning muhim boshini boy berdi (qisman)          |
| Sababli  | excused | 0.0    | Sababli boʻlsa ham darsda yoʻq — foizni kamaytiradi |
| Kelmadi  | absent  | 0.0    | Ishtirok yoʻq                                      |

> Oʻzgarish: ilgari Sababli neytral (chiqarib tashlanardi), Kechikdi positive edi.

## 2. Hisoblash davri
- **Oylik** — tezkor diagnostika / surunkali holatlarni erta aniqlash.
- **Choraklik** — barqaror (summativ) monitoring.

Jadvalda doimiy **% ustuni**; sarlavhani bosib Oylik ⇄ Choraklik almashtiriladi;
katak tooltipida ikkalasi (`Oylik X% · Choraklik Y%`). Foiz **dars kunlari**
boʻyicha hisoblanadi (koʻrinish rejimidan mustaqil).

## 3. "Xavfli" (flag) — gibrid model
Oʻquvchi qizil belgilanadi, agar:
- davr foizi **< 75%** (absolyut floor), **YOKI**
- sinf ichida **eng past 25-pertsentil**da.

Qatʼiy yagona chegara emas — 74/76 jarligi yumshatiladi. UI: ism yonida ⚠
belgisi + qator chap chetida qizil aksent + % soni qizil tonda.

## 4. Surunkali (chronic)
**Oyiga jami ≥3 "Kelmadi"** = surunkali (ketma-ket emas). ⚠ belgisi va tooltipда sabab.

## 5. Statuslar — global, QULFLANGAN toʻplam, sozlanadigan vazn
Toʻplam = 4 ta built-in, ataylab qulflangan: maxsus status qoʻshish YOʻQ
(model, zod va DAL darajasida ham — notanish kalit rad etiladi/tashlanadi).
Real foydalanuvchilar soʻrasa qoʻshiladi. Tahrir YAGONA joyda — **Sozlamalar > Davomat** (davomat
sahifasidagi tugma oʻsha yerga deep-link): holatni yoqish/oʻchirish va
vaznini (×1 / ×0.5 / ×0 / hisobdan chiqarish) tanlash. Keldi/Kelmadi —
yadro, oʻchirib boʻlmaydi; yozuvlari bor holatni oʻchirish tasdiq soʻraydi.
Kunlik moslashuvchanlik — **Izoh**da.

## 6. Termostat — diqqatni yuzaga chiqarish
Funnel filtrida **"Diqqat talab qiladiganlar (N)"** — bir bosishda xavfli +
surunkali oʻquvchilar roʻyxati.

## Keyingi (implement qilinmagan)
- Izoh maxfiyligi: texnik (oʻqituvchi) vs ota-ona uchun — kirish huquqlari (roles).
- Oflayn/PDF chop etish.
- Real backend / saqlash.
