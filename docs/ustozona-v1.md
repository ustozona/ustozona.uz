# Ustozona — v1 dizayn hujjati

> **Falsafa:** Oʻqituvchini *"termometr"dan (oʻlchovchidan) "termostat"ga (oʻzgartiruvchiga)*
> aylantirish. Tizim — **intellektual sherik**, qaror qabul qiluvchi emas.
> Asosiy maqsad: **real oʻquvchi maʼlumotlari asosida dars rejalashtirish.**
>
> Qaror asoslari: Daisy Christodoulou bilan 3 bosqichli Q&A (assessment theory +
> kognitiv fan). Tarix: `~/.claude/.../memory/assessment-philosophy-direction.md`.

> **Brending — "Ustozona" ekotizimi:**
> - **Ustozona** — umumiy platforma (oʻqituvchi dashboard'i, bu hujjat v1 yadrosi).
> - **Ustozona Baholash** — ost-loyiha: interaktiv taqdimot / lecture mode
>   (Kahoot/Wayground/Blooket qobigʻi), real-vaqt formativ baholash.
> - **Ustozona Boshqaruv** — ost-loyiha: maktab/sinf boshqaruvi, maʼmuriy qism.
> - **Ustozona AI** — barcha ost-loyihalarda ishlovchi AI qatlami (savol qoralama,
>   xulosa, hisobot, ball hisobi). **Faqat oʻqituvchi tomonida.**
>   - Mahsulot ichida (tugma/menyu yorligʻi): **"Ustozona AI"** (qisqa, tushunarli).
>   - Marketing/brend nomi: **"Ustozona sunʼiy idrok"** (oʻ ziga xoslik uchun).

> **Texnik qoida:** Butun UI **toʻliq shadcn/ui** komponentlari va loyiha dizayn
> tizimi (`docs/design-system.md`) asosida quriladi. Xom rang/ixtiyoriy oʻlcham,
> ad-hoc Tailwind YOʻQ — faqat tokenlar, `heading-*`/`text-*` shkalasi, 36px
> toolbar, `card-elevation`, mavjud `@/components/ui/*` komponentlari.

---

## 1. Tamoyillar (har bir UX/mantiq qarori shularga boʻysunadi)

1. **Raqam emas, keyingi qadam.** Har ekran "ertaga nima qilaman?" degan savolga javob bersin.
2. **Formativ ≠ summativ.** Oʻrganish uchun ishlar (quiz, vazifa) jurnalga *kirmaydi*;
   ular **diagnoz** sifatida koʻrsatiladi. Aralashtirish = "banking model" = eng katta zarar.
3. **Oʻqituvchi ball qoʻymaydi — tizim hisoblaydi.** Oʻqituvchi *dalil* yigʻadi
   (javoblar, taqqoslash), mastery va ballarni tizim hisoblaydi.
4. **AI tavsiya qiladi, oʻqituvchi qaror qiladi.** AI hech qachon yakuniy qaror chiqarmaydi.
5. **AI oʻquvchiga tegmaydi.** AI faqat oʻqituvchi tomonida (savol qoralama, xulosa,
   hisobot, ball hisobi). Oʻquvchi qogʻozda/mustaqil fikrlaydi ("AI Death Zone"dan qochish).
6. **Diagnostika = qiymat, oʻyin = qobiq.** Ball mantigʻi faqat toʻgʻrilik va distraktor
   tahliliga asoslanadi; tezlikka ball berilmaydi. Oʻyin elementi faqat oʻrganish bosqichida.

---

## 2. v1 qamrovi

### Kiradi
- Formativ/summativ ajratish (`Assessment.purpose`).
- **Misconception diagnostikasi** — MCQ, har distraktor → bitta tushunmovchilik (majburiy yadro).
- **Mastery model** — standart boʻyicha (≥75%, ~10 item).
- **Unutish (decay) + retrieval signali** — "bu mavzuni qayta mustahkamlang".
- **Comparative Judgement** — ochiq ishlar (insho) uchun (imkon boʻlsa v1, yozma baholash ~90% tejaydi).
- **Hisobot generatori** — AI draft → oʻqituvchi tasdiqlaydi → PDF.
- Standart-mastery jadvali (eski A–F "Baholar" oʻrnida).

### Kkeyingi bosqich (v1 da YOʻQ)
- **Ustozona Baholash** — interaktiv taqdimot/lecture mode (Kahoot/Wayground/Blooket qobigʻi),
  real-vaqt darsda tushunishni oʻlchash (hinge questions).
- **ClassDojo-uslub coin tizimi** (bixevioristik).
- Oʻquvchi tomoni (login, quiz interfeysi) — toʻliq.
- Qogʻoz quiz + OCR.

---

## 3. Maqsadli foydalanuvchi va qamrov

- Hozircha **faqat oʻqituvchilar**. Bir maktab — bir nechta oʻqituvchi — umumiy oʻquvchilar.
- Sinflar: **5–11** (keyin 1–11).
- Til: oʻzbekcha (apostrof: ʻ U+02BB, ʼ U+02BC — ASCII `'` ishlatilmaydi).

---

## 4. Data modeli

> Manba: hozir `src/lib/grades-data.ts` (seed) + `src/lib/attendance-data.ts`.
> Quyidagi yangi turlar shu yondashuvda qoʻshiladi.

### 4.1 Mavjud (saqlanadi, kengaytiriladi)
```ts
ClassInfo, Student            // oʻzgarishsiz
Standard {                    // standards/page.tsx ichidan modelга koʻchiriladi
  id; code; desc;
  prerequisites: string[];    // YANGI — bilim grafi (A'siz B yoʻq)
  // bloom?  → default'dan olib tashlanadi (Daisy: ierarxiya chalgʻitadi)
}
```

### 4.2 Diagnostik yadro (YANGI)
```ts
type AssessmentPurpose = "formative" | "summative";

type Misconception = {
  id: string;
  label: string;          // "Email'ni ogʻzaki muloqot deb oʻylaydi"
  remediationRef?: string; // reteach qoʻllanma / video / slayd havolasi (retsept)
};

type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
  misconceptionId?: string; // notoʻgʻri variant → qaysi tushunmovchilik
};

type Question = {
  id: string;
  standardId: string;
  stem: string;
  type: "mcq";            // v1 = faqat MCQ (Daisy: diagnostika uchun eng ishonchli)
  options: Option[];
  source: "ai" | "bank" | "teacher";
  approved: boolean;      // AI draft → oʻqituvchi tasdiqlaydi
};

type Assessment = {        // bir quiz / topshiriq sessiyasi
  id: string;
  classId: string;
  date: string;           // YYYY-MM-DD
  purpose: AssessmentPurpose;  // YADRO AJRATUVCHI
  questionIds: string[];
  scaleMax?: number;      // summativ jurnal uchun: 100 | 10 | 5 (ixtiyoriy)
};

type Response = {
  assessmentId: string;
  studentId: string;
  questionId: string;
  optionId: string | null;
};
```

### 4.3 Ochiq ishlar (CJ)
```ts
type OpenTask = { id; classId; standardId; prompt; date };
type Script   = { id; openTaskId; studentId; content };  // oʻquvchi ishi
type Anchor   = { id; standardId; content; level };       // standartga bogʻlangan namuna
type Judgement= { id; openTaskId; leftId; rightId; winnerId };  // "qaysi yaxshi?"
// → tizim Bradley-Terry/Elo uslubida shkalalangan ball hisoblaydi
```

---

## 5. Mantiq (hisob-kitoblar)

Uchta sof funksiya — UI shularni chaqiradi (qoʻlda takror yoʻq):

```
mastery(student, standard):
  r = toʻgʻri javoblar / jami item        // standart boʻyicha
  return r >= 0.75 ? "mastered" : "not"   // Daisy: 70–80%, ~10 item
  // item < minItems boʻlsa → "tekshirilmagan" (ishonchsiz, taxmin xavfi)

decay(standard):
  days = bugun − lastAssessedDate(student, standard)
  → rang: 0–14k toʻq yashil · 15–35k sariq · 35k+ soʻlgʻin
  → days > retrievalThreshold → { due: true } signal

classMisconceptions(assessment, standard):
  notoʻgʻri javoblarni option.misconceptionId boʻyicha guruhla
  count >= classThreshold (mas. sinfning ≥30%) boʻlsa → sinf xatosi sifatida koʻrsat
  → tegishli remediationRef bilan birga
```

**Formativ/summativ ajratish (eng muhim oqibat):**
- Yakuniy baho / jurnal **faqat `purpose: "summative"`** assessmentlardan hisoblanadi.
- `purpose: "formative"` → bahoga **kirmaydi**, faqat diagnoz panellarida koʻrinadi.
- Eski `getLetterGrade` + ogʻirlikli oʻrtacha headline **olib tashlanadi**;
  oʻrniga standart-mastery jadvali.

**Halol oʻsish koʻrsatkichi** ("baho dinamikasi" oʻrnida):
- oʻzlashtirilgan standartlar/faktlar soni oʻsishi + CJ shkalalangan ball delta.

---

## 6. Ekranlar (UX)

Dizayn tizimi: `docs/design-system.md` (shadcn tokenlari, 36px toolbar,
panel header `border-b px-5 py-5`, `card-elevation`). Yangi xom rang/oʻlcham yoʻq.

### 6.1 Dars xulosa — HERO (bosh sahifa)
**Bitta vazifa:** keyingi darsdan oldin "sinf nimada qoqildi → tavsiya".
- Yuqorida: oxirgi dars/quiz + sinf.
- 🔴 **Sinf misconception kartalari**: "8 dan 5 oʻquvchi email'ni ogʻzaki deb belgiladi" +
  `[Tayyor slayd ▸]` (remediationRef).
- 🔔 **Retrieval signallari**: "DT.02 unutilish arafasida — 5 daqiqalik takrorlash".
- ⚠️ **Alohida eʼtibor**: chegaradan past oʻquvchilar roʻyxati.
- Daisy: bu maʼlumot **keyingi darsdan oldin** eng foydali (whole-class feedback uchun vaqt).

### 6.2 Standart-mastery jadvali ("Baholar" oʻrnida)
- Satr = oʻquvchi, ustun = standart. Katak = mastery holati, **decay-rang** bilan.
- Harf bahosi / ogʻirlikli oʻrtacha YOʻQ.
- Formativ natijalar alohida belgisi bilan (jurnalga kirmaydi).

### 6.3 Standartlar + retrieval
- Mavjud `standards/page.tsx` asosida; "oʻtilgan" qoʻl-toggle oʻrniga **dalilga (diagnostik natija) asoslangan** holat.
- Bloom teglari default'dan olib tashlanadi; oʻrniga prerequisite bogʻlanish.

### 6.4 Quiz yaratish (AI draft → tasdiq)
- Standart tanlanadi → AI MCQ qoralama beradi (darslikdan ham) → oʻqituvchi
  distraktor↔misconception bogʻlanishini tekshiradi/tasdiqlaydi (`approved`).

### 6.5 CJ — taqqoslash
- "Qaysi biri yaxshiroq? Chap / Oʻng" — ~15–20 marta. Anchor namuna bilan.
- Oʻqituvchi audio izoh → AI → "whole-class feedback".

### 6.6 Hisobot generatori
- AI real maʼlumotdan yozadi: **shkalalangan ball + oʻsish delta + aniq misconception**.
- **Mavhum jumla yoʻq** ("tahlil qila oladi" taqiqlanadi).
- Oʻqituvchi tasdiqlaydi → **PDF print**.

---

## 7. Joriy etish bosqichlari (hujjatdan keyin)

- **P0:** `Assessment.purpose` + diagnostik data modeli (`Question`/`Option`/`Misconception`)
  ni `grades-data.ts`ga; seed maʼlumot. Eski headline (A–F, ogʻirlikli oʻrtacha) ajratish.
- **P1:** Dars xulosa hero ekrani + mastery jadvali + decay/retrieval.
- **P2:** CJ oqimi + prerequisite graf; hisobot generatori.

---

## 8. Texnik parametrlar (Daisy tasdigʻi bilan hal qilindi)
- **`minItems = 10`** — ishonchlilik (reliability) uchun standart boʻyicha kamida 10 ta
  diagnostik savol. Kamroq item → "tekshirilmagan" (taxmin xavfi).
- **`masteryThreshold = 0.75`** — 70–80% oraligʻidan; ≥75% toʻgʻri = oʻzlashtirdi.
- **`retrievalThreshold = 14–21 kun`** — boshlangʻich nuqta; fan/yoshga qarab moslashtiriladi.
- **CJ algoritmi: Elo yoki Bradley-Terry** — kichik guruhlar uchun eng yuqori aniqlik.
- Maʼlumot saqlash: hozir seed; keyin localStorage yoki API (`src/app/api/` mavjud).

> **Holat:** Daisy Christodoulou hujjatni toʻliq tasdiqladi (3-bosqich Q&A yakuni,
> 2026-06-16). Falsafa, data modeli, mantiq va UX kelishildi. v1 yadro boʻlib
> `AssessmentPurpose` (formativ/summativ ajratish) xizmat qiladi.
