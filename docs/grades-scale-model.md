# Baholash shkalasi modeli (LOCKED v2)

> Status: kelishilgan (Daisy Christodoulou + Komil Jalilov + jamoa). Implementatsiyadan
> oldingi qaror hujjati. Eski "ikki shkalali" model (`docs/grades-v1-spec.md` ichidagi
> per-toifa `scaleKind` + global header `gradeScale`) bu hujjat bilan **almashtiriladi**.

## Asosiy prinsip — "Daisy-clean"

Ichki tarzda **har baho = foiz (0–100)**. Shkala — bu foizning ustiga qoʻyilgan
**yorliq qatlami** (label), yangi maʼlumot emas. Binlash (foiz → yorliq) faqat
**koʻrsatishda, yagona chegara jadvali** bilan boʻladi.

Eski modeldagi 5 ta mantiqiy xato (ikki marta binlash, bir nomli shkalada ikki xil
chegara, pass/fail soxta aniqligi, katak↔Holat ziddiyati, oʻtkinchi tugma rasmiyga
taʼsir qilishi) — bularning hammasi **ildizdan** yagona-shkala bilan yoʻqoladi.

## Model

### Toifa (kategoriya) — display shkalasi YOʻQ
Toifa endi faqat: `nom + rang + maqsad(summativ/formativ) + vazn% + kiritish usuli`.
- `inputMode`: `score` (raqamli 0..maxScore) yoki `binary` (Bajardi/Bajarmadi).
- `scaleKind` maydoni **olib tashlanadi** (migratsiya: eʼtiborga olinmaydi, baho baribir foiz — maʼlumot yoʻqolmaydi).

### Jurnal — bitta saqlangan shkala (barcha sinflarga)
Qamrov: **jurnal darajasi** (oʻqituvchining barcha sinflari bir xil). Xalqaro maktab
kerak boʻlsa, kelajakda sinf-darajasiga kengaytirilishi mumkin.

```
journalScale = {
  kind: JournalScaleKind,          // barcha shkalalar (default: "five")
  labelStyle: "number" | "word",   // 4  yoki  Yaxshi  (faqat "five"da)
  showPercent: boolean,            // qavsda "(78%)" (default: true)
}
```

> **v3 yangilanish (2026-06):** `kind` endi faqat `five|ten` emas — barcha
> oʻqituvchiga koʻrinadigan shkalalar (`GRADING_SCALE_PRESETS`: five, ten, percent,
> pass_fail, qualitative, letter_plus, letter_basic, ib7, gcse, german6, french20).
> `five`dan boshqa hammasi `formatByScaleKind` orqali yorliqlanadi. Xalqaro shkalalar
> endi alohida "rejim toggle" emas — tanlovda **buklangan guruh** ("Xalqaro dasturlar",
> progressive disclosure) ortida.

**5-ballik va soʻzli BIR XIL shkala** — bitta cut-score jadvali, ikki xil yorliq:
`Aʼlo=5, Yaxshi=4, Qoniqarli=3, Qoniqarsiz=2`. Alohida shkala EMAS.

### Yagona chegara manbasi (Single source of truth)
Bitta `CUT_SCORES` jadvali + bitta `formatScore(percent, journalScale)` formatter.
Eski `formatGrade` (header) va `formatByScaleKind` (toifa) **birlashtiriladi** — endi
katak ham, Holat ustuni ham AYNAN shu formatter/jadvaldan oʻqiydi.

### Koʻrinish qoidalari
- **Raqamli katak** va **Holat**: `baho (foiz)` — masalan `4 (78%)`. (`showPercent`=true)
- **Binary katak**: `Bajardi / Bajarmadi` — bu shkala emas, ikkilik maʼlumotning
  tabiiy koʻrinishi; jurnal shkalasidan mustasno.
- Yorliq uslubi (`labelStyle`) faqat koʻrinish — hisobni va rasmiy hujjatni oʻzgartirmaydi
  (raqam: rasmiy/tahlil; soʻz: ota-ona muloqoti).

### Pass/fail (binary) — validlik cheklovi
- Binary toifa **default — formativ (vaznsiz)**.
- Agar oʻqituvchi uni summativ qilsa: toifa modalida ogohlantirish —
  *"Bu toifa yakuniy oʻrtachaga faqat 0% yoki 100% boʻlib kiradi."* (100% "Bajardi"
  100% bilim degani emas — soxta aniqlikni oldini olamiz.)

### Xalqaro shkalalar
Harf (A–F), IB7, GCSE, nemis-6, fransuz-20 va h.k. — Oʻzbek maktabi uchun shovqin.
Ular **"Xalqaro maktab rejimi"** (default oʻchiq) toggle ortida yashiriladi.

## Workflow

1. **Jurnal yaratishda**: default 5-ballik bilan, koʻzga tashlanadigan lekin
   **skip qilsa boʻladigan** qadam ("Baholash shkalasi: [5-ballik ▾]"). Nol friksiya.
2. **Oʻzgartirish**: faqat **Sozlamalar → Baholash shkalasi**'da (asosiy ekrandagi
   oʻtkinchi tugma EMAS — tasodifiy bosishni oldini oladi).
3. **Oʻzgartirish xavfsiz**: faqat koʻrinishni almashtiradi, bahoni emas (qaytariladigan).
   Izoh: *"Bu faqat koʻrinishni oʻzgartiradi, baholarni emas."*
4. **Ehtiyot**: agar joriy chorak hisoboti allaqachon topshirilgan boʻlsa —
   oʻzgartirishda yengil tasdiq.

## Sozlamalar UI

Joriy: toolbar'dagi **gear ikonasi** (Yaratish'ning oʻngida) **Sozlamalar modalini**
ochadi (`GradesSettingsModal`). Ikki boʻlim: (1) **Baholash shkalasi** — barcha shkalalar
(Oʻzbek koʻrinadi, Xalqaro buklangan), har bandda 78% misol, yorliq uslubi (5-ballik),
foizni koʻrsatish; (2) **Jadval koʻrinishi** — vaznli foiz toggle + Holat ustuni
(Trend/Formativ). Bu ikkita toggle avval alohida toolbar ikonalari edi, modalga jamlandi.

| Sozlama | Variantlar | Default |
|---|---|---|
| Shkala | barcha (Oʻzbek koʻrinadi, Xalqaro buklangan) | 5-ballik |
| Yorliq uslubi | Raqam (4) / Soʻz (Yaxshi) — faqat 5-ballikda | Raqam |
| Foizni koʻrsatish | Ha / Yoʻq | Ha |

## Implementatsiya bosqichlari

1. ✅ Yagona `CUT_SCORES`/`FIVE_CUTS` + `formatScore` (50 vs 60 pass/fail bug oʻldi).
2. ✅ Holat + umumiy/ustun-oʻrtacha → `formatScore` (`4 (78%)`); `journalScale` store'da.
3. ✅ Scale boshqaruvi `GradeScaleSettings` dialogiga koʻchirildi (toolbar'dagi gear
   tugmasi ochadi) — ataylab ochiladigan, tasodifiy oʻzgartirmaydigan. shadcn Dialog +
   ToggleGroup + Switch; jonli namuna + "faqat koʻrinish" izohi. Xalqaro shkalalar UI'dan
   avtomatik chiqdi (per-toifa `scaleKind` selecti olib tashlangani sabab).
   **Qoldi (ixtiyoriy):** alohida global Sozlamalar sahifasi + jurnal-yaratish onboarding
   qadami — app'da settings/onboarding route infra hali yoʻq. Default 5-ballik onboarding
   niyatini qondiradi; dialog = oʻzgartirish yoʻli.
4. ✅ Toifa modalidan `scaleKind` selecti + per-toifa shkala badge'i olib tashlandi;
   binary-summativ ogohlantirishi qoʻshildi. Ustun-oʻrtacha ikkilik toifada Bajardi/Bajarmadi,
   aks holda jurnal shkalasi. (`Topic.scaleKind` maydoni data'da qoldi — write-only, migratsiya xavfsiz.)

### Tozalangan oʻlik kod
`grade-scale.ts`: `formatGrade`, `SCALE_LABELS`, `SCALE_ORDER`, `GradeScale`, `FormattedGrade`
olib tashlandi. `useClassStore`: `gradeScale`/`setGradeScale` olib tashlandi.
