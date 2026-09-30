# Sinf aʼzoligi — davrlar modeli

Holat: **taklif** (2026-09-29). Q1–Q3 va §6.1–6.2 foydalanuvchi tomonidan
tasdiqlangan; jamoa tasdigʻi kerak — markaziy model.
Oldingi qadam: [oquvchini-kochirish-spec.md](oquvchini-kochirish-spec.md) (§4.1).

## 1. Muammo

Savol har ekranda bitta: **«bola shu kuni shu sinfda edimi?»** Hozirgi
model bunga toʻliq javob bera olmaydi:

- `enrollments` da juftlik (sinf, bola) uchun **bitta qator**, bitta
  `started_at` va bitta `ended_at`. Bola sinfga qaytsa sana ustidan
  yoziladi (`student-move.ts`), birinchi davr yoʻqoladi.
  *Misol:* 1–10-sentabr 7-A, 10–20 7-D, 20 dan yana 7-A → 7-A da faqat
  «20 dan» qoladi.
- Koʻchirish sanasini **tuzatib boʻlmaydi**. Dialog sukut boʻyicha
  «bugun» qoʻyadi, kechikib kiritilgan koʻchirishda oraliq kunlarni hech
  bir sinfda belgilab boʻlmaydi.
- Eski sinf koʻchgan bolani davomatdan **butunlay** olib tashlaydi —
  uning koʻchishdan oldingi kunlari ham yoʻqoladi.
- Javob **bitta joyda emas**: har DAL `ended_at` ni oʻzi tekshiradi va
  toʻrt joyda unutilgan (§2.3).

## 2. Tadqiqot xulosasi

### 2.1. Xalqaro amaliyot (taʼlim maʼlumotlari standartlari)

| Naqsh | Izoh |
|---|---|
| Aʼzolik — **davr**; bir juftlikda bir nechta davr boʻladi | Boshlanish sanasi kalitning qismi. Qaytish — yangi davr, eskilari birlashtirilmaydi |
| Davrlar **ustma-ust tushmaydi** | Oldingisining tugashi ≤ keyingisining boshlanishi |
| Tugash sanasi — **sinfda boʻlmagan birinchi kun** | Yarim-ochiq oraliq `[boshlanish, tugash)`. 15-sentabrda koʻchdi → 15 yangi sinfniki. (Baʼzi tizimlar oxirgi *boʻlgan* kunni yozadi — muhimi bitta konvensiya; bizda yarim-ochiq) |
| Davomat **faqat davr ichida** | Davomat foizining maxraji — aʼzolik kunlari |
| **Chiqish turi** saqlanadi | koʻchdi / maktabdan ketdi / kelmadi / yil tugadi |
| «Kelmadi» (bironta kun kelmagan) — oʻchirilmaydi | Tugash sanasi + «kelmadi» turi; birinchi kungacha ketgan bola jurnalda umuman koʻrinmaydi |
| Xato sana — **keng tarqalgan** | Bir tuman tahlilida 6 830 chiqishdan 135 tasida chiqishdan keyin davomat bor edi. Yozuv toʻsilmaydi, **ogohlantiriladi** — odam tuzatadi |
| Baholar **sinfda qoladi** | Yangi sinfga avtomatik koʻchmaydi |
| Guruh almashishi — **bitta hodisa** | Kuchga kirish sanasi, sabab va kim qilgani tarixda saqlanadi |
| Bir kursning bir nechta guruhi boʻlsa | Yangi guruhni **odam tanlaydi** (qidiruv / oʻrin soni bilan) |
| **Yil oxiri** | Barcha aʼzoliklar oxirgi dars kuni bilan yopiladi; keyingi yil uchun **yangi** yozuv ochiladi. Sinfda qoldirilgan, ketgan, boshqa maktabga oʻtgan — rollover paytida belgilanadi |

### 2.2. Oʻzbekiston — 2684-son nizom (2015, 2023 tahriri)

[lex.uz/docs/-2678463](https://lex.uz/docs/-2678463):

- Parallel sinfga oʻtkazish — ota-ona arizasi, direktor **bir ish kuni
  ichida** buyruq chiqaradi (9-band).
- **Uch kun ichida** sinf jurnali va «oʻquvchilar harakati daftari»ga
  yozuv kiritiladi (10-band).

Oqibat: koʻchish sanasi = **buyruq sanasi**, tizimga u kechikib kiritiladi.
Orqaga qarab sana qoʻyish — asosiy holat, istisno emas.

Qogʻoz jurnal anʼanasi: ketgan bola qatoriga «chiqdi, buyruq №…, sana»
yoziladi; yangi kelgan roʻyxat oxiriga qoʻshiladi.

### 2.3. Koddagi holat

| Talab | Hozir |
|---|---|
| Bir nechta davr | ❌ PK `(class_id, student_id)` |
| Yarim-ochiq oraliq | ✅ koʻchirish ikkala tomonga bir xil sana yozadi |
| Davomat faqat davr ichida | ⚠️ yangi sinfda bor; eski sinfda bola butunlay yoʻqoladi |
| Sanani tuzatish | ❌ |
| Chiqish turi, buyruq | ❌ |
| Yagona manba | ❌ — `ended_at` tekshiruvi unutilgan joylar: |

- `dal/play/join.ts` — koʻchgan bola eski sinf oʻyiniga kira oladi
  (mehmon roʻyxati ham, `joinByCode` tekshiruvi ham).
- `ai/class-context.ts` — «faol oʻquvchilar» soniga koʻchganlar kiradi.
- `dal/admin/stats.ts`, `dal/admin/users.ts` — oʻqituvchining oʻquvchilar
  soniga ketgan bolalar ham kiradi (`COUNT(DISTINCT …)` yopilgan
  yozilishlarni ajratmaydi).

## 3. Qarorlar (2026-09-29)

| # | Savol | Qaror |
|---|---|---|
| Q1 | Koʻchgan bolaning chorak / yakuniy bahosi | **Faqat yangi sinf baholari.** Eski sinfda uning yakuniy koʻrsatkichi chiqmaydi («—») |
| Q2 | Ketgan bolaning qatori | **Roʻyxat oxiriga tushadi** (belgi bilan) |
| Q3 | Bir vaqtda nechta sinf | **Bitta darajali sinf** |

✅ **Q3 taʼrifi tasdiqlandi (2026-09-29).** `classes` qatori aslida *fan guruhi*
(«7-A Matematika», «7-A Ingliz 1-guruh» — ish-maydoni-arxitektura.md
§4.3): maktab rejimida bitta bola bir vaqtda bir nechta darajali
`classes` qatorida boʻladi va bu toʻgʻri. Shuning uchun Q3 **parallel**
darajasida taʼriflanadi:

> Bir sanada bolaning barcha darajali guruhlari **bitta parallelga**
> tegishli. «7-A Matematika» + «7-A Ingliz» — mumkin; «7-A Matematika»
> + «7-D Ingliz» — mumkin emas.
>
> Parallel kaliti: `parentClassId` boʻlsa — maʼmuriy sinf; boʻlmasa —
> faol yilga proyeksiya qilingan `(grade, section)`. Darajasiz guruh
> (toʻgarak) qoidaga kirmaydi.

## 4. Model

### 4.1. `enrollments` — bogʻlanish (kaliti oʻzgarmaydi)

«Bu bola bu guruh bilan bogʻlangan» fakti va **jurnal raqami**
(`sort_order`). PK `(class_id, student_id)` **saqlanadi**. Sabablari:

- Prod bazada LessonLab triggeri `sync_student_from_bot` shu jadvalga
  `ON CONFLICT (class_id, student_id) DO NOTHING` bilan yozadi
  (lessonlab-sinxron-tuzatish.md §4.2). PK oʻzgarsa bu soʻrov xato beradi
  va botda bola qoʻshish **toʻxtaydi**.
- `trg_sync_student_from_uz` (AFTER INSERT) va `v_unified_students`
  viewʼi ham shu jadvalga tayanadi.
- Jurnal raqami bola qaytganda oʻzgarmasligi kerak — u davrga emas,
  bogʻlanishga tegishli.

`started_at` / `ended_at` qoladi — **oxirgi davrning nusxasi** (kesh),
DAL uni davr bilan bitta tranzaksiyada yangilaydi. Hali koʻchirilmagan
oʻquvchilar (`ended_at IS NULL` filtri) oʻzgarishsiz ishlayveradi.
Ustunlar oʻchirilmaydi (DROP COLUMN qaytarilmas).

### 4.2. Yangi: `enrollment_periods` — haqiqat manbai

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE enrollment_periods (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    text NOT NULL,
  student_id  text NOT NULL,
  started_on  date,           -- NULL = boshidan
  ended_on    date,           -- NULL = ochiq; sinfda BOʻLMAGAN birinchi kun
  exit_reason text,           -- moved | left_school | no_show | year_end | removed
  move_id     uuid,           -- student_moves.id (koʻchirish boʻlsa)
  created_at  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (class_id, student_id)
    REFERENCES enrollments (class_id, student_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (started_on IS NULL OR ended_on IS NULL OR ended_on >= started_on),
  -- ustma-ust tushmaydi (PG 17: btree_gist + EXCLUDE)
  EXCLUDE USING gist (
    class_id WITH =, student_id WITH =,
    daterange(started_on, ended_on, '[)') WITH &&
  )
);
```

- Sanalar `date` turida (yangi jadval, eski `text` ustunlarga tegilmaydi).
- `started_on = ended_on` — boʻsh oraliq = «kelmadi».
- **Invariant:** har `enrollments` qatorida kamida bitta davr.
  Tashqi yozuvchilar (bot) uchun — repodagi migratsiyada trigger:
  `AFTER INSERT ON enrollments` → `[NEW.started_at, NEW.ended_at)` davri.
  ⚠️ Trigger **repoda** yoziladi — qoʻlda yaratilgan triggerlar bu
  bazada allaqachon muammo boʻlgan.

### 4.3. Yangi: `student_moves` — koʻchirish hodisasi

```
id, workspace_id, student_id, from_class_id, to_class_id,
effective_on date,      -- buyruq sanasi
order_no text NULL,     -- buyruq raqami (ixtiyoriy)
created_by, created_at, updated_at
```

Koʻchirish = bitta hodisa: eski davr `ended_on = effective_on`
(`exit_reason = moved`), yangi davr `started_on = effective_on`, ikkalasi
`move_id` bilan bogʻlangan. Sanani tuzatish hodisa boʻyicha **ikkala
tomonni birga** oʻzgartiradi — dead zone tuzilmaviy jihatdan paydo
boʻlmaydi.

## 5. Yagona oʻqish

`server/dal/class-roster.ts` — boshqa hech bir DAL «kim sinfda» ni oʻzi
hisoblamaydi. (Fayl allaqachon «joriy roʻyxat — bitta qoida bir joyda»
vazifasida; yangi modul ochilmaydi.)

```ts
rosterOn(classId, date)          // shu kuni aʼzo boʻlganlar
rosterDuring(classId, from, to)  // oraliqda kamida bir kun aʼzo boʻlganlar + har birining davrlari
membershipOf(studentId)          // bolaning barcha davrlari (profil, tarix)
isMember(classId, studentId, date)
```

Qaytadigan qator: `{ student, periods: [{ from, to, exitReason, moveId }] }`.
Arxivlangan oʻquvchi (`status = archived`) — alohida qoida, shu yerda
filtrlanadi.

| Chaqiruvchi | Funksiya |
|---|---|
| Davomat (sayt, mobil) | `rosterDuring(koʻrilayotgan oy/chorak)` |
| Davomatni saqlash (server) | `isMember` |
| Jurnal | `rosterDuring(oʻquv yili)` |
| Baholash varaqlari, doska, oʻyin, AI konteksti | `rosterOn(bugun)` |
| Admin statistikasi | SQL: davr jadvali bilan `JOIN` |
| Profil | `membershipOf` |

Mijoz tomonidagi qoida — `lib/membership.ts` (`isMemberOn`,
`overlapsRange`); server SQL qismi — `memberOnSql` (aynan bir xil shart).

**PR-1 da bajarilgan (hozirgi ustunlar ustida):** `rosterOn`, `isMember`,
`activeClassRoster` (Toshkent «bugun»i boʻyicha), `boundedSpans`; §2.3
dagi toʻrt joy tuzatildi; davomat server guardi ikkala chegarani
tekshiradi; eski sinf davomati bolani chiqish sanasigacha oxirida
koʻrsatadi; jurnalda ikki tomonlama yopiq kataklar va Q1.
**PR-2 da bajarilgan (davr jadvali, 0049):** `enrollment_periods` va
`student_moves`; davrlar ustma-ust tushmaydi (`EXCLUDE`), `enrollments` ga
default-davr triggeri (LessonLab boti yozganda ham). `memberOnSql` /
`periodOnSql` (server/db/membership.ts) davr jadvalidan oʻqiydi;
`rosterOn` va `boundedSpans` ham; mobil sinxron va admin statistikasi
ham. Yozish — faqat `dal/enrollment-periods.ts` (`openPeriods`,
`closeOpenPeriods`, `reopenLatestPeriods`) orqali, `enrollments.started_at/
ended_at` keshi har safar oxirgi davrdan qayta yoziladi. Koʻchirish
`student_moves` yozadi va ikkala davrni `move_id` bilan bogʻlaydi; bolani
qaytarish — yangi davr (tarix saqlanadi); bolalarni birlashtirish umumiy
sinflarda davrlarni birlashma oraligʻiga keltiradi. Mijozga bola 2+
davrli boʻlsagina `Student.periods` boradi (`isMemberOn` ularni hisobga
oladi). Prod uchun qoʻlda SQL: `drizzle/PROD-0049-azolik-davrlari.sql`.
`rosterDuring` — hozircha chaqiruvchisi yoʻq, yozilmagan.

**PR-3 da bajarilgan (koʻchirish dialogi va profil tarixi):** dialogda
«Buyruq sanasi» majburiy va sukutsiz, «Buyruq raqami» ixtiyoriy
(`student_moves.order_no`). Profilda «Aʼzolik» tabi — `membershipOf`
(`dal/student-move.ts`): har davr sinf, oraliq, chiqish sababi va
koʻchirish hodisasi bilan. «Sanani tuzatish» — `correctMoveDate`: hodisa
boʻyicha ikkala sinfdagi davrni birga oʻzgartiradi, kesh yangilanadi;
oraliqdan chiqib qolgan davomat yozuvlari OʻCHIRILMAYDI, faqat soni
ogohlantirish sifatida chiqadi.

**Q3 da bajarilgan (2026-09-30):** parallel kaliti — `lib/parallel.ts`
(`parentClassId` yoki `(grade, section)`; darajasiz guruh — kalitsiz).
Server qoidani koʻchirish va qaytishda MAJBURLAYDI
(`assertSingleParallel`, `dal/enrollment-periods.ts`): bola shu sanada
boshqa parallelda ham aʼzo boʻlsa — sabab bilan rad. Roʻyxat sinxroni
(qoʻshish) orqali kelgan buzilishni rad etib boʻlmaydi — butun batch
yiqilardi, klient qayta-qayta yuborardi — shuning uchun u profil
«Aʼzolik» tabida ogohlantirish sifatida koʻrsatiladi
(`MembershipHistory.parallelWarning`). Prod (2026-09-30): maʼmuriy sinf
(`parent_class_id`) hali ishlatilmagan, bitta bola 2 parallelda.
Qolgan: parallel almashishi (§6.1) — bola bir vaqtda bir necha fan
guruhida boʻlganda koʻchirish hozir rad etiladi, toʻliq amal keyingi PR.

## 6. Yozish amallari

| Amal | Nima boʻladi |
|---|---|
| Qoʻshish | `enrollments` + davr `[NULL, NULL)` — oʻqituvchi oldingi haftalarni toʻldira oladi |
| Qoʻshish (sana bilan) | davr `[sana, NULL)` — dialogda ixtiyoriy maydon |
| Koʻchirish | `student_moves` + ikki davr (§4.3), bitta tranzaksiya |
| Sanani tuzatish | hodisa boʻyicha ikkala davr; oraliqdan chiqib qolgan yozuvlar **oʻchirilmaydi** — roʻyxat va ogohlantirish |
| Qaytish | yangi davr; `enrollments` qatori va jurnal raqami oʻsha |
| Maktabdan ketdi | ochiq davr yopiladi, `exit_reason = left_school` |
| Kelmadi | `ended_on = started_on`, `exit_reason = no_show` → hech qayerda koʻrinmaydi |
| Roʻyxatdan olib tashlash | hozirgidek (`detachOrDeleteStudents`) — xato qoʻshilganni tuzatish uchun |
| Bolalarni birlashtirish | `student-merge.ts`: davrlar birlashtiriladi (ustma-ust tushsa — birlashma oraligʻi) |

Q3 tekshiruvi (§3) — qoʻshish, koʻchirish va importda serverda.

### 6.1. Parallel almashishi — maktab rejimi

Koʻchirish **parallel darajasidagi bitta hodisa** (`student_moves`), bitta
tranzaksiya:

1. Eski paralleldagi bolaning **barcha darajali guruhlari** yopiladi
   (`ended_on = effective_on`, `exit_reason = moved`). Q3 buni talab qiladi:
   bitta guruh yopilmay qolsa bola ikki parallelda boʻlib qoladi.
2. Har yopilgan guruh uchun yangi paralleldan **shu fandagi** guruh
   qidiriladi:
   - bitta topildi — avtomatik ochiladi;
   - bir nechta (boʻlingan fan: Ingliz 1/2-guruh) — dialogda **tanlanadi**,
     yonida oʻquvchilar soni;
   - topilmadi — ochilmaydi, natijada roʻyxat bilan koʻrsatiladi
     («7-A da Informatika guruhi yoʻq»).
3. Darajasiz guruhlar (toʻgarak) **tegilmaydi**.
4. Baho va davomat koʻchmaydi (Q1).
5. Ruxsat: maʼmuriy sinfni boshqara oladigan (`assertCanManageClass` —
   admin yoki ega). Fan oʻqituvchisi faqat oʻz guruhini koʻchira olmaydi —
   aks holda Q3 buziladi.
6. Taʼsirlangan guruhlarning oʻqituvchilari xabar oladi.

Yakka oʻqituvchi rejimida (`parentClassId` yoʻq) parallel = oʻz guruhi:
amal hozirgidek bitta guruhdan bitta guruhga.

### 6.2. Yil oxiri — rollover

1. Rollover barcha ochiq darajali davrlarni eski yilning **oxirgi kuni**
   bilan yopadi (`exit_reason = year_end`).
2. Davom etayotgan bolalarga yangi yilning **birinchi kunidan** yangi davr
   ochiladi — oʻsha guruhda (rollover sinfni joyida koʻtaradi, id
   oʻzgarmaydi; jurnal raqami `enrollments` da saqlanadi).
3. Rollover sehrgarida bitta qadam: bolalar roʻyxati, sukut boʻyicha
   «davom etadi». Istisnolar:
   - **ketdi** — yangi davr ochilmaydi;
   - **sinfda qoldi** — yangi davr tanlangan quyi darajadagi sinfda
     (koʻchirish amali emas: u faqat bir xil daraja orasida).
4. Bitiruvchi (arxivlanadigan) sinf — yangi davr ochilmaydi.
5. Sanalar faol oʻquv yili taqvimidan (`academic_years`); maktab rejimida
   rollover qiluvchining (admin) taqvimi.

Natija: yil chegarasi maʼlumotda aniq, «oʻtgan yil kim bor edi» — oddiy
oraliq soʻrovi; yozgi oraliqda hech kim aʼzo emas (darslar yoʻq —
toʻgʻri).

## 7. Ekranlar

**Davomat**
- Qatorlar: davr oraligʻi koʻrilayotgan davr bilan kesishganlar.
- Katak davr ichida — ochiq; tashqarida — yopiq. Yopiq kunda yozuv boʻlsa
  koʻrsatiladi va ogohlantiriladi (yetim yozuvlar paneli naqshi).
- Ketganlar roʻyxat oxirida, belgi: «→ 7-A, 15.09» (Q2).
- Foiz va «Belgilanmagan» — faqat aʼzolik kunlari boʻyicha.

**Jurnal**
- Topshiriq sanasi davrdan tashqarida — katak yopiq, «baholanmagan»ga
  kirmaydi (yangi sinfda qoʻshilishdan oldingi, eski sinfda ketishdan
  keyingi topshiriqlar).
- Ketgan bolaning yakuniy koʻrsatkichi eski sinfda «—» (Q1); sinf
  oʻrtachalariga kirmaydi.
- Ketganlar oxirida (Q2).

**Koʻchirish dialogi**
- Sana **majburiy, sukutsiz**, yorligʻi «Buyruq sanasi».
- Buyruq raqami — ixtiyoriy.
- Q3 buzilsa — sabab bilan rad.

**Profil** — aʼzolik tarixi: davrlar, chiqish turi, «Sanani tuzatish».

## 8. Migratsiya (prod — qoʻlda)

Prodda `db:migrate` ishlatilmaydi (hash nomuvofiqligi). Tartib:

1. Sana shakli tekshiruvi — nol boʻlishi shart:
   ```sql
   SELECT count(*) FROM enrollments
    WHERE (started_at IS NOT NULL AND started_at !~ '^\d{4}-\d{2}-\d{2}$')
       OR (ended_at   IS NOT NULL AND ended_at   !~ '^\d{4}-\d{2}-\d{2}$');
   ```
2. `btree_gist`, `enrollment_periods`, `student_moves` — faqat **qoʻshish**.
3. Backfill: har `enrollments` qatoriga bitta davr
   `[started_at::date, ended_at::date)`.
4. Default-davr triggeri (§4.2).
5. Tekshiruv: `enrollments` soni = davri bor juftliklar soni.
6. LessonLab triggerlari **tegilmaydi**; bot tomonida sinov: botda bola
   qoʻshish → Ustozonada davr paydo boʻldi.

Orqaga qaytarish: yangi jadvallar va trigger oʻchiriladi, `enrollments`
tegilmagan.

## 9. Bosqichlar

| PR | Ish | Migratsiya |
|---|---|---|
| 1 | `roster.ts` hozirgi ustunlar ustida; §2.3 dagi toʻrt xato; barcha chaqiruvchilar koʻchadi; eski sinf davomati ketish sanasigacha | yoʻq |
| 2 | §8 migratsiya; `roster.ts` davr jadvalini oʻqiydi; DAL ikkala joyga yozadi | bor |
| 3 | Koʻchirish hodisasi, sanani tuzatish, dialog, profil tarixi; parallel almashishi (§6.1) | — |
| 4 | Jurnal: Q1, davrdan tashqari kataklar | — |
| 5 | Q3 tekshiruvi + yaxlitlik soʻrovi (ogohlantirish) | — |
| 6 | Rollover: yil oxirida yopish, yangi davr, istisnolar (§6.2) | — |

PR-1 dan keyin 2–5 ekranlarga tegmaydi — faqat `roster.ts` ichi almashadi.

## 10. Ochiq savollar

1. ✅ Sinf paneli statistikasi (Keldi / Kelmadi / Davomat) ketgan bolaning
   aʼzolik kunlaridagi yozuvlarini hisoblaydi (2026-09-30): maxraj —
   aʼzolik kunlari, arxivlanganlar chiqarilgan
   (`hooks/useClassPanelStats.ts`).
