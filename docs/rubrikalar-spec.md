# Rubrikalar — v1 spetsifikatsiyasi

> Holat: **taklif** (2026-08-18). Rubrika kodi yozilmagan; §2.5 dagi
> kirish nuqtasi esa topshiriq muharririda ALLAQACHON mavjud.
> Bogʻliq: `docs/grades-v1-spec.md`, `docs/ost-loyihalar-arxitektura.md`,
> `docs/roadmap-muhokama.md` (14-iyul: «rubrika oʻrniga CJ» qarori).

## 0. Nega qaytadan koʻrilyapti

Roadmapda rubrika ataylab kechiktirilgan (`roadmap-muhokama.md:96`), sababi
Christodoulou eʼtirozi: rubrika baholash ishonchliligini oshirmaydi, **yashiradi**.
Bu eʼtiroz kuchda qoladi va spec unga ikki qadam bilan javob beradi:

1. Rubrika standart holatda **feedback vositasi**, bahoga ulanishi — ONGLI TANLOV
   (Canvasdagi «use for grading» bayrogʻi).
2. Deskriptor **majburiy** — deskriptorsiz rubrika oʻchirilgan «Tanlash» kiritish
   usulining (`grades-v1-spec.md:89`) kattalashgan nusxasi boʻlib qoladi.

## 1. Qaysi oʻqqa tushadi

`assignments.kind` (`manual | test | deck`) — MAZMUN IDISHI, baholash usuli emas.
U `setId` dan hisoblanadi va **tegilmaydi**. Rubrika `GradingKind` oʻqiga tegishli
(`assess.ts` da `manual`/`cj`/`aiDraft` yonida). Amalda:

- rubrika `kind: "manual"` topshiriqqa qoʻyiladi (insho, taqdimot, laboratoriya);
- `kind: "test"` bilan birga turishi TAQIQLANMAYDI, lekin v1 UI'da taklif etilmaydi.

## 2. Maʼlumot modeli

### 2.1 `rubrics` — kutubxona obyekti

Classroom modelidan ATAYLAB voz kechildi (u rubrikani topshiriq ichida saqlaydi;
natijada 6 sinfga bitta nazorat = 6 ta ajralib ketgan nusxa).

```ts
export const rubrics = pgTable("rubrics", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  /* Kutubxona filtrlari — soʻralmaydi, kontekstdan olinadi (R227a naqshi). */
  subject: text("subject"),
  grade: integer("grade"),
  visibility: text("visibility").notNull().default("private"),
  copiedFrom: text("copied_from"),
  /* Darajalar RUBRIKA darajasida — har mezonda takrorlanmaydi (Schoology naqshi).
     Yuqoridan pastga tartibda. */
  levels: jsonb("levels").$type<RubricLevel[]>().notNull().default([]),
  criteria: jsonb("criteria").$type<RubricCriterion[]>().notNull().default([]),
  /* Tahrirlanganda oshadi; baho qoʻyilganda tanlov shu versiyaga qulflanadi
     (`activities.version` naqshi). Canvasning «Insho rubrikasi FINAL (2)»
     muammosining oldini oladi. */
  version: integer("version").notNull().default(1),
  createdAt: ..., updatedAt: ...,
});
```

```ts
type RubricLevel = {
  id: string;
  label: string;      // "Aʼlo"
  points: number;     // 4
};

type RubricCriterion = {
  id: string;
  name: string;             // "Dalil bilan asoslash"
  /** Har daraja uchun deskriptor: levelId → matn. MAJBURIY (boʻsh qoldirilmaydi). */
  descriptors: Record<string, string>;
  /** Mezonning ogʻirligi = maksimal balli. Alohida vazn qatlami YOʻQ. */
  weight: number;           // 1 = darajaning oʻz balli; 2 = ikki barobar
  /** `standard_sets.data` ichidagi id — FK EMAS (`activities.standardId` naqshi). */
  standardId?: string;
};
```

**Nega `levels` rubrika darajasida:** muharrir oddiy toʻrtburchak jadval boʻlib
qoladi, va bir rubrika ichida «bu mezon 4 pogʻona, bu 6 pogʻona» degan chalkashlik
chiqmaydi. Canvas per-mezon darajaga ruxsat beradi va aynan shu sababdan uning
rubrika muharriri ogʻir.

### 2.2 Tayyor daraja toʻplamlari — `src/lib/rubric-levels.ts`

Yangi jadval EMAS, registr (`material-kinds.ts` naqshi):

| Preset | Darajalar |
|---|---|
| `four` (default) | Aʼlo 4 · Yaxshi 3 · Qoniqarli 2 · Yetarli emas 1 |
| `three` | Bajardi 3 · Qisman 2 · Bajarmadi 1 |
| `single` | **Single-point**: bitta ustun «Kutilgan daraja» |
| `custom` | Oʻqituvchi oʻzi tuzadi |

`single` — Gonzalez single-point rubrikasi. 16 katak deskriptor yozish talab
qilinmaydi, lekin deskriptor baribir yoziladi. Kirish toʻsigʻi eng past variant,
shuning uchun muharrirdagi TAVSIYA ETILGAN boshlanish.

⚠️ Bu `GradingScale` (jurnal katagi shkalasi: 10-ballik, A+…F) BILAN BIR NARSA
EMAS. Ikkalasini birlashtirish urinishi «A+ darajali mezon» kabi maʼnosiz holat
tugʻdiradi.

### 2.3 Topshiriqqa bogʻlanish

```ts
// assignments jadvaliga:
rubricId: text("rubric_id").references(() => rubrics.id, { onDelete: "set null" }),
/** Rubrika bahoga ulanadimi, yoki faqat feedbackmi (Canvas «use for grading»).
    Default: false — feedback. */
rubricScored: boolean("rubric_scored").notNull().default(false),
```

`set null`: rubrika oʻchsa topshiriq va baholari QOLADI (`setId` bilan bir xil
qaror, va `activity_sets.classId` dagi 2026-08-18 tuzatishining sababi bilan bir xil).

`rubricScored: true` boʻlsa `assignments.maxScore` rubrika yigʻindisiga QULFLANADI
(`setId` maks. ballni qanday qulflasa, shunday). `false` boʻlsa `maxScore` erkin.

### 2.4 Baholash natijasi

Yangi jadval YOʻQ — `grades` PK (student, assignment) va idempotent batch upsert
saqlanadi:

```ts
// grades jadvaliga:
/** { v: <rubrika versiyasi>, sel: { criterionId: levelId }, notes?: { criterionId: matn } } */
rubricScores: jsonb("rubric_scores").$type<RubricScores>(),
```

`grades.score` — HAR DOIM yigʻindi natija (foizga normallanadi, grades v1 qulfi
buzilmaydi). `rubricScores` esa oʻqituvchi tanlovining izi.

⚠️ `stableStringify` ishlating (JSONB key-order gotcha).

**Qoʻlda bekor qilish:** oʻqituvchi yigʻindini oʻzgartira oladi. Uchala referens
mahsulotda ham shunday — bu sanoat standarti. Bunda `rubricScores.sel` saqlanadi,
`score` esa qoʻlda qiymatga oʻtadi va katakda «qoʻlda oʻzgartirilgan» belgisi.

## 2.5 Kirish nuqtasi — «Baholash usuli» tanlovi

Qaror 2026-08-18 da topshiriq muharriri qayta ishlanayotganda qabul qilindi
va **kod allaqachon shu shaklda turibdi** — rubrika qoʻshilganda tuzilma
qayta yozilmaydi, faqat toʻldiriladi.

Topshiriq muharririda yoʻriqnoma ostida bitta qator bor:

```
BAHOLASH USULI                    [✎ Qoʻlda] [⚡ Avtomatik]
```

Tanlangach ostida ikkita teng karta ochiladi. Ikkala tarmoq BIR XIL shaklga
ega — «yangi tuzaman» yoki «tayyorini olaman»:

| Tanlov | Chapdagi karta | Oʻngdagi karta |
|---|---|---|
| **Qoʻlda** | Rubrika yaratish | Rubrikalardan tanlash |
| **Avtomatik** | Test yaratish | Materiallardan tanlash |

Hozir faqat «Avtomatik» tarmogʻi toʻlgan; «Qoʻlda» tanlanganda hech narsa
chiqmaydi (bu toʻgʻri holat — insho, diktant, ogʻzaki javob uchun rubrika
ham shart emas). M3 da chap tomon toʻldiriladi.

**Nega aynan shu joy.** Rubrika alohida sahifada tursa, oʻqituvchi uni izlab
borishi kerak boʻlardi va amalda hech qachon bormasdi. Bu yerda esa u kerak
boʻlgan lahzada — insho topshirigʻi tuzilayotgan paytda, «Qoʻlda» tanlangan
soniyada — oʻzi koʻrinadi.

**Nega tanlov saqlanmaydi.** «Qoʻlda / Avtomatik» tugmasi bazaga yozilmaydi,
u faqat koʻrinishni ochadi. Baholash usuli baribir hisoblanadi: `setId` bor
→ avtomatik. Tanlov ustun boʻlib saqlansa, «avtomatik» deb belgilab test
biriktirmagan topshiriq ikkita bir-biriga zid haqiqatga ega boʻlib qolardi
(§1 dagi «`kind` ga tegilmaydi» qoidasining oʻsha oʻzi). Rubrika qoʻshilgach
ham shunday qoladi: haqiqat `rubricId` ning bor-yoʻqligida, tugmada emas.

## 3. Muharrir — AI markazda

Boʻsh 4×4 jadval KOʻRSATILMAYDI. Oqim:

```
┌─ Rubrika: Tarixiy manba tahlili ──────────────── [4 daraja ▾] ─┐
│                                                                 │
│  Mezon nomini yozing:                                           │
│  ┌───────────────────────────────────┐  ┌────────────────────┐  │
│  │ Dalil bilan asoslash              │  │ ✨ Toʻldirish      │  │
│  └───────────────────────────────────┘  └────────────────────┘  │
│                                                                 │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ Aʼlo  4  │Yaxshi  3 │Qoniq.  2 │Yetarli.1 │                  │
│  ├──────────┼──────────┼──────────┼──────────┤                  │
│  │ Har      │ Daʼvolar │ Baʼzi    │ Fikr     │  ← ✨ qoralama   │
│  │ daʼvo…   │ dalil…   │ daʼvolar │ bayon…   │     (tahrirlang) │
│  └──────────┴──────────┴──────────┴──────────┘                  │
│  🔗 Standart: [ 7.2.1 Manba ishonchliligi ▾ ]  ← ✨ taklif      │
│                                                                 │
│  + Mezon qoʻshish                          Jami: 4 ball         │
└─────────────────────────────────────────────────────────────────┘
```

- ✨ belgisi — AI qoralamasi. Tahrirlanmaguncha koʻrinib turadi.
- «Toʻldirish» faqat mezon nomidan ishlaydi (+ fan, sinf, daraja soni).
- Butun rubrikani topshiriq nomi/mavzusidan generatsiya qilish — alohida tugma.
- Standart taklifi — mezon matnini standartlar bankiga moslash.

## 4. Baholash paneli

Jurnal katagi bosilganda oʻng panel (SpeedGrader naqshi):

```
┌─ Aliyev Sardor · Tarixiy manba tahlili ─────────┐
│ Dalil bilan asoslash                            │
│  [ Aʼlo ][•Yaxshi•][ Qoniq. ][ Yetarli emas ]   │
│  + izoh                                         │
│                                                 │
│ Xulosa mantiqi                                  │
│  [•Aʼlo•][ Yaxshi ][ Qoniq. ][ Yetarli emas ]   │
│                                                 │
│ ───────────────────────────────────────────     │
│ Jami: 7 / 8            [ qoʻlda oʻzgartirish ]  │
│                          ← → keyingi oʻquvchi   │
└─────────────────────────────────────────────────┘
```

AI baholashda QATNASHMAYDI. Chegara: AI faqat YARATISH paytida.

## 5. Mezon kesimidagi hisobot

Classroomda ham, koʻpchilikda ham yoʻq. `rubricScores` saqlangani uchun deyarli
bepul: «5-A · Dalil bilan asoslash — oʻrtacha 2.1/4». Statistika sahifasiga
qoʻshiladi. Mezon `standardId` ga bogʻlangan boʻlsa — Standartlar sahifasiga ham.

## 6. Bosqichlar

- **M1** — sxema + `rubrics` CRUD + kutubxonada «Rubrika» turi
  (`material-kinds.ts` ga yangi yozuv; `isContainer: false`, `attachable: true` —
  registrga «biriktiriladi, lekin savol idishi emas» holati qoʻshiladi)
- **M2** — muharrir (AI'siz), single-point + 4 daraja
- **M3** — topshiriqqa biriktirish (§2.5 dagi «Qoʻlda» tarmogʻi toʻldiriladi)
  + baholash paneli + `maxScore` qulfi
- **M4** — AI: deskriptor toʻldirish, rubrika qoralamasi, standart taklifi
  (strukturaviy chiqish yoʻli kerak — hozirgi provayder qatlami faqat oqimli)
- **M5** — mezon kesimidagi hisobot

## 7. v1 QAMROVIDAN TASHQARI

- Diapazonli darajalar (Canvas ranges) — muharrirni qimmatlashtiradi, foydasi
  qoʻlda bekor qilish orqali arzonroq olinadi
- Holistik rubrika
- Oʻzaro baholash (peer review)
- AI ishni baholashi — `submissions`/OCR boʻlmaguncha maʼlumot yoʻq
  (`GradingKind: "aiDraft"` sloti sxemada band, boʻsh turadi)
- Oʻquvchiga koʻrsatish — parent/student mini-app bosqichida
