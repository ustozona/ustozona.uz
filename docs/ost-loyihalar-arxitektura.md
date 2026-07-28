# Ustozona ost-loyihalari — arxitektura va bosqichlar

> **Holat:** tasdiqlangan (2026-07-29). Bu hujjat toʻrtta ost-loyihaning
> (Baholash, Doska, Shogird, Boshqaruv) yagona arxitektura manbai.
> `docs/roadmap-muhokama.md` — nima qilinishi; bu hujjat — qanday qurilishi.
>
> Bogʻliq hujjatlar: `ustozona-v1.md` (baholash falsafasi, Daisy tasdiqlagan),
> `design-system.md` (oʻqituvchi paneli standarti), `MANTIQ.md` (domen modeli),
> `roadmap-texnik.md` (OCR/PDF texnik asos).

## Kontekst

Ustozona (oʻqituvchi paneli) jonli ishlayapti. Endi ustiga toʻrtta ost-loyiha quriladi:

1. **Ustozona Baholash** — Kahoot/Blooket/Wayground uslubidagi kvizlar, interaktiv taqdimot, Plickers uslubidagi QR-kartalar, OCR/OMR qogʻoz testlar, qiyosiy baholash, Wordwall uslubidagi oʻyinlar.
2. **Ustozona Doska** — classroomscreen.com uslubidagi sinf ekrani (Timer, Traffic Light, Random Name, Group Maker, Poll, Draw va h.k.).
3. **Shogird** — oʻquvchi/ota-ona uchun Telegram mini-ilova (natijalar, davomat, baholar, xulq).
4. **Ustozona Boshqaruv** — maktab maʼmuriyati paneli.

Muammo shundaki, mavjud tizim bitta faraz ustiga qurilgan: **bitta oʻqituvchi, bitta yozuvchi, bitta ekran oʻlchami**. Toʻrtala ost-loyiha shu farazni buzadi — anonim kviz ishtirokchisi, oʻquvchi akkaunti, maktab qamrovi, projektor ekrani. Shu bois bu reja avval **umumiy tayanchni** (shaxsiyat, oʻlchov yadrosi, dizayn qatlamlari) tuzatadi, keyin mahsulotlarni quradi.

`d92fb79` commit'ida eski baholash prototipi ataylab oʻchirildi — bu reja aynan uning oʻrniga keladi.

---

## Qabul qilingan qarorlar

| Qaror | Tanlov |
|---|---|
| **Navbat** | Qogʻoz + QR birinchi. OCR blanka, Plickers uslubidagi QR-kartalar, oʻz tezligidagi kvizlar — bularga realtime KERAK EMAS, lekin butun tahlil dvigatelini beradi. Jonli PIN-kviz keyingi bosqichda. |
| **Oʻyin qoidasi** | Oʻyin faqat qobiq. Tezlik va omad faqat oʻyin reytingiga taʼsir qiladi; jurnalga va tashxisga faqat toʻgʻri/notoʻgʻri + distraktor tahlili kiradi. |
| **Realtime** | Hozircha qaror qilinmaydi. 5-bosqichgacha kerak emas; qaror nuqtasi quyida yozilgan. |
| **Dizayn tizimi** | **Mahsulot boʻyicha emas, KONTEKST boʻyicha boʻlinadi** — pastdagi izohga qarang. |

### Nega dizayn tizimi mahsulot boʻyicha boʻlinmaydi

Siz "har biri oʻz dizayn tizimiga ega boʻladi" dedingiz. Kodni oʻrganib chiqib, buni **biroz boshqacha** qilishni tavsiya qilaman — sabab kelajakda.

Oddiy tilda: **bitta mahsulot bir vaqtda uch xil ekranda yashaydi.** Baholash — bu bitta mahsulot, lekin:
- savol yozish va natijalarni koʻrish → **noutbukda, oʻqituvchi**, yaqindan;
- kviz oʻynash → **telefonda, oʻquvchi**, barmoq bilan;
- savolni koʻrsatish → **projektorda**, 5 metrdan.

Yaʼni "Baholash dizayn tizimi" degan narsa aslida mavjud emas — uchta har xil ekran bor. Xuddi shunday, Boshqaruv aslida oʻqituvchi panelining aynan oʻzi shaklida (jadval, panel, filtr) — unga yangi shkala foyda bermaydi, faqat divergensiya yaratadi.

Shuning uchun **ikkita mustaqil oʻq**:

**1-oʻq — Sirt (oʻlcham va zichlik):** `data-surface`
| Qiymat | Kim/qayerda | Matn / boshqaruv | Kim ishlatadi |
|---|---|---|---|
| `desk` (standart) | Noutbuk, yaqindan | 14px / 36px | Dashboard, Baholash muharriri, Boshqaruv |
| `handheld` | Telefon, barmoq | 17px / 48px | Shogird, kviz oʻynash, OCR skanerlash |
| `stage` | Projektor, 5 metr | 24px+ / 56px | Doska, kviz projektor ekrani |

**2-oʻq — Mahsulot (faqat palitra/brend):** `data-product` → `ustozona` \| `baholash` \| `doska` \| `shogird` \| `boshqaruv`. Bu FAQAT `--primary`/`--accent` ranglarini oʻzgartiradi, oʻlchamni emas.

**3-oʻq — Oʻqish yordami (inklyuzivlik):** `data-reading="support"` → kattaroq shrift, kengaytirilgan qator/harf oraligʻi, disleksiya shrifti, qatorga fokus. Bu Pear Deck'ning Immersive Reader'ining CSS qismi (B3.4) va u **shu token mexanizmining oʻzidan bepul keladi** — alohida kod emas.

Sahifa ularni eʼlon qiladi: `<html data-surface="stage" data-product="doska">`.

**Kelajakdagi foydasi (aynan shu sababdan tavsiya qilyapman):**
- Beshinchi ost-loyiha qoʻshilsa — yangi dizayn tizimi kerak emas, u avtomatik mavjud uchta kontekstdan biriga tushadi.
- Roadmap §4.2 dagi "asosiy panelning mobil moslashuvi" — bu shunchaki `desk` → `handheld`, ish allaqachon bajarilgan boʻladi.
- Sirtlar soni **hech qachon 3 tadan oshmaydi**, mahsulotlar soni esa oshaveradi.

**Texnik jihatdan nega ishlaydi:** Tailwind v4 da `h-9` → `height: calc(var(--spacing) * 9)`, `text-sm` → `font-size: var(--text-sm)`. Yaʼni ajdodda `--spacing` va `--text-*` ni qayta belgilash butun daraxtni qayta oʻlchaydi. Bitta `<Button>` komponenti dashboard'da 36px, projektor ekranida 56px boʻladi — **komponent fork qilinmaydi**. `.theme-landing-mono` ([globals.css:347](../src/app/globals.css:347)) allaqachon shu prinsipni ranglar uchun isbotlagan; biz uni oʻlcham va zichlikka kengaytiramiz.

---

## Asosiy gʻoya: bitta oʻlchov dvigateli, besh xil yigʻish usuli

Butun Baholash arxitekturasi bitta jumlaga sigʻadi:

> **Jonli kviz, oʻz tezligidagi kviz, interaktiv taqdimot, qogʻoz OMR va QR-kartalar — bu besh xil MAHSULOT emas, bitta narsani yigʻishning besh xil USULI.** Hammasi bitta `responses` jadvaliga yozadi.

Oddiy tilda: oʻquvchi javobi qanday kelganidan qatʼi nazar — telefonda bosgan boʻlsa ham, qogʻozda doira boʻyagan boʻlsa ham, kartani koʻtargan boʻlsa ham, darsda slaydga yozgan boʻlsa ham — u bitta joyga tushadi. Shuning uchun xato-tashxis, oʻzlashtirish, unutilish tahlili **bir marta** yoziladi, besh marta emas.

Aks holda toʻrtta alohida oʻyinchoq boʻlardi. Shu bitta qaror mahsulotni yaxlit qiladi.

Bundan kelib chiqadigan natija: **arqon tortish, poyga, Wordwall shablonlari uchun bitta ham jadval kerak emas.** Ular — `quiz_sessions.render_config` ichidagi qiymat, xolos. Bu `docs/ustozona-v1.md` dagi *"diagnostika = qiymat, oʻyin = qobiq"* qoidasining kodda ifodasi.

---

## Tuzilmaviy topilmalar (kod bilan tasdiqlangan)

Rejadan oldin uchta masala hal qilinishi shart:

1. **`requireTeacher()` har kimga oʻqituvchi qatori yaratadi.** [`session.ts:43-67`](../src/server/session.ts:43) — rol tekshiruvi yoʻq. Oʻquvchi/ota-ona akkauntlari paydo boʻlishi bilan har bir tasodifiy soʻrov soxta oʻqituvchi ijara egasi yaratadi.
2. **`proxy.ts` matcher'dagi hamma narsani `/login`ga uloqtiradi.** [`proxy.ts:28`](../src/proxy.ts:28) — kviz ishtirokchisi (akkauntsiz) va Telegram WebView (cookie ishonchsiz) uchun bu ishlamaydi.
3. **`students.teacherId` va `classId` NOT NULL.** [`classes.ts:58-63`](../src/server/db/schema/classes.ts:58) — yaʼni 3 oʻqituvchi oʻqitadigan bitta bola = **3 ta alohida qator, 3 xil id**. Bu Shogird va Boshqaruv uchun tuzilmaviy masala (pastda hal qilingan).

---

## A. Shaxsiyat modeli

Bugun bitta ijara egasi bor: `teachers.id`. Yana uchtasi qoʻshiladi.

| Kim | Guvohnoma | Darvoza | Kalit |
|---|---|---|---|
| Oʻqituvchi | better-auth cookie | `requireTeacher()` | `teachers.id` |
| Maktab/super admin | cookie + rol | `requireSchoolAdmin()` | `SchoolScope` |
| Oʻquvchi/ota-ona | Telegram `initData` (cookie YOʻQ) | `requireStudentViewer()` | `students.id[]` |
| Kviz ishtirokchisi | localStorage'dagi token | `requireParticipant()` | `session_participants.id` |

**Yangi jadvallar** — `src/server/db/schema/identity.ts`:
- `student_links(user_id, student_id, relation, granted_by, verified_at, revoked_at)` — PK `(user_id, student_id)`. `students.userId` ustuni qoladi, lekin **hech qachon yozilmaydi**: bogʻlanish ikki tomonlama koʻp-koʻpga (bitta ota-ona → N bola; bitta bola → N oʻqituvchi qatori), bitta FK buni ifodalay olmaydi.
- `student_invites(code, teacher_id, student_id, relation, expires_at, used_at, used_by)` — **oʻqituvchi** kod beradi, maktab emas. Sabab: `docs/MANTIQ.md` — *"Bu yuqoridan boshqariladigan maktab tizimi EMAS."*
- `user_telegram(telegram_id, user_id, username)`.

**Bitta bola = N qator masalasi.** MVP'da qabul qilamiz, chiqish yoʻlini hozir qoʻyamiz. Shogird oʻqituvchi/fan boʻyicha guruhlaydi ("Matematika — Nodira opa", "Ingliz tili — Aziza opa") — ota-ona buni **xato emas, toʻgʻri** deb oʻqiydi. Chiqish yoʻli: `students.person_id` ustunini zaxiraga qoʻyish va **hech qachon "mening farzandim" birlik marshrutini qurmaslik** — doim `/shogird/students/[studentId]`, bitta bola boʻlsa ham. Shunda keyinchalik birlashtirish arzon migratsiya boʻladi.

**Maktab qamrovi** — `teachers.schoolId` orqali JOIN, denormalizatsiya QILINMAYDI. Sabab: `neong-http` da tranzaksiya yoʻq, sync qatlami last-write-wins — denormallashtirilgan `schoolId` drift beradi, bu risk emas, aniqlik. Muhim ogohlantirish spec'ga yozilishi shart: **Boshqaruv v1 oʻquvchi boʻyicha emas, OʻQITUVCHI boʻyicha hisobot beradi** (nechta sinf, nechta baholash oʻtkazilgan, oxirgi faollik) — chunki "maktabda N oʻquvchi" yuqoridagi sabab bilan haddan ziyod sanaydi.

**DAL tuzilmasi** — har papkaga bitta darvoza:
```
src/server/session.ts          (mavjud)  requireTeacher / requireAdmin / requireSchoolAdmin
src/server/shogird/session.ts  YANGI     verifyInitData / requireStudentViewer
src/server/play/session.ts     YANGI     requireParticipant / requireHostSession
src/server/dal/assess/         YANGI     requireTeacher()   banks questions quizzes sessions results mastery cj omr publish
src/server/dal/play/           YANGI     requireParticipant()   join answer state
src/server/dal/student/        YANGI     requireStudentViewer()   overview grades attendance behavior links
src/server/dal/school/         YANGI     requireSchoolAdmin()   overview teachers usage
```

**Sizib chiqishning oldini olish (test freymvorki yoʻq, shuning uchun mexanik):**
- `eslint.config.mjs` da `no-restricted-imports` zonalari: `dal/play/**` va `dal/student/**` `@/server/session` ni import qila olmaydi; `dal/student/**` oʻqituvchi DAL'ini qayta ishlata olmaydi (**read model qayta yoziladi, filtr almashtirilmaydi** — koʻp-ijarali sizishlarning manbai aynan shu).
- Har darvoza brendlangan obyekt qaytaradi (`__scope: "teacher" | "student" | "participant" | "school"`), DAL funksiyalari faqat oʻz brendini qabul qiladi → xato **kompilyatsiya xatosi** boʻladi, koʻzdan qochgan review emas.
- `requireTeacher()` tuzatiladi: `teachers` qatorini faqat `rolesOf(user).includes("teacher")` boʻlsa yaratadi. `src/lib/auth-roles.ts` ga `student` va `guardian` rollari qoʻshiladi.

**`src/proxy.ts` ikkiga ajratiladi:** (i) har soʻrovga `x-ustozona-surface` va `x-ustozona-product` sarlavhalarini qoʻyish (bu ham dizayn tizimi, ham i18n uchun ishlatiladi); (ii) cookie redirect'ni faqat himoyalangan roʻyxatga qoʻllash. `/play/*` va `/shogird/*` — **faqat teglanadi, hech qachon redirect qilinmaydi**.

---

## B. Baholash yadrosi — sxema

`src/server/db/schema/assess.ts`. Reponing qoidasi qoʻllanadi: **oʻquvchi/vaqt boʻyicha yigʻiladigan narsa — relatsion; UI butunligicha oʻqib-yozadigan narsa — JSONB.**

```
activity_banks(id, teacher_id, name, subject, grade, visibility)

activities(id, teacher_id, bank_id, standard_id, shape, title, version,
           source, approved, config jsonb)
  → shape: mcq | pairs | categories | sequence | cloze | wordlist
         | number | imagezone | hottext | text | draw  ← 11 SHAKL (B2/B3/B4 ga qarang)
  → source: teacher | ai | bank | student              ← `student` = Flashcard Factory
  → approved: student/ai manbali kontent oʻqituvchi tasdigʻisiz oʻyinga chiqmaydi
  → grading: exact | numeric | mathEquiv | keyword | aiDraft | cj | manual | none
             ← SHAKLDAN ALOHIDA OʻQ (B4.2); `none` = soʻrovnoma/soʻz buluti (B5.2)
  → config: shakl darajasidagi sozlama (toifalar roʻyxati, cloze matni, rasm, ...)

activity_items(id, activity_id, teacher_id, ordinal, content jsonb)
  -- AVTO-TEKSHIRILADIGAN (8)
  mcq:        { stem, media?, options:[{id,text,isCorrect,misconceptionId?}] }
  pairs:      { left, leftMedia?, right, rightMedia? }
  categories: { item, categoryId }
  sequence:   { item }                    -- ordinal = javobning oʻzi
  cloze:      { textBefore, answer, textAfter }
  wordlist:   { word, clue? }
  number:     { stem, answer, tolerance, unit? }       -- mathEquiv bilan: 1.5 = 1½ = 3/2
  imagezone:  { stem, image, zones:[{id,x,y,r,label?}], mode }
              -- mode: click (Hotspot) | drag (belgi qoʻyish) | label (Labeling)
  hottext:    { text, tokens:[{id,text,isCorrect}] }   -- matnni marker bilan belgilash
  -- OCHIQ JAVOB (2) — avto-tekshirilmaydi, CJ ga oqadi
  text:       { prompt, expected? }       -- expected boʻlsa kalit-soʻz yoki AI qoralama
  draw:       { prompt, background? }     -- javob = vektor shtrixlar
  → JAVOB BIRLIGI: oʻquvchi yechadigan har element = bitta `responses` qatori

misconceptions(id, teacher_id, standard_id, label, remediation_ref)

activity_sets(id, teacher_id, class_id, title, purpose, activity_ids jsonb,
              container_kind, container_ref, config jsonb)
  → purpose: formative | summative   ← YADRO AJRATUVCHI
  → container_kind: none   = oddiy kviz
                    lesson = interaktiv taqdimot (ref = lessons.id, promptlar Tiptap ichida)
                    video  = interaktiv video (ref = YouTube id, config.cues = [{timeMs, activityId}])
  → yaʼni kviz, taqdimot va video — BITTA tushunchaning uch koʻrinishi (B4.3)

quiz_sessions(id, teacher_id, set_id, class_id, mode, state, join_code,
              current_index, render_config jsonb, runtime_ref, opened_at, closed_at)
  → mode: live | selfpaced | paper | qrcards | lecture
  → render_config: { templateId, theme }  ← SHABLON SHU YERDA, jadval yoʻq

session_participants(id, session_id, student_id?, member_student_ids jsonb,
                     display_name, token_hash, device_label,
                     game_state jsonb, progress jsonb, joined_at, last_seen_at)
  → device_label = Plickers karta raqami
  → member_student_ids: JAMOA rejimi — bitta qurilma, N oʻquvchi (B5.1)
       jamoa boʻlsa student_id = null, aʼzolar shu yerda
  → game_state: oʻyin iqtisodi (tanga, minora, kolleksiya) — SESSIYAGA XOS,
       oʻlchov daftariga TEGMAYDI (B5.5)
  → progress: video koʻrish telemetriyasi (B4.3)

responses(id, teacher_id, session_id, participant_id, student_id?,
          activity_id, item_id, item_version, answer jsonb, is_correct,
          misconception_id, standard_id, source, confidence,
          elapsed_ms, client_seq, answered_at)
  UNIQUE (participant_id, item_id, item_version)             ← idempotent qayta yuborish
  INDEX  (student_id, standard_id)                           ← oʻzlashtirish
  INDEX  (misconception_id) WHERE NOT NULL                   ← xato-tashxis
  → `answer` jsonb: mcq da {optionId}, pairs da {matchedId}, sequence da {position}...
  → `misconception_id` FAQAT mcq da toʻladi; boshqa shakllarda null (pastga qarang)

omr_scans(id, teacher_id, session_id, image_url, sheet_layout jsonb, detected jsonb,
          status, reviewed_by, committed_at)
  → status: pending | needs_review | committed | rejected    ← KOʻRIB CHIQISH DARVOZASI

cj_tasks / cj_scripts / cj_judgements / cj_ranks
```

**Uchta ataylab qilingan qaror:**

1. **`misconception_id` va `standard_id` javobga koʻchiriladi (denormalizatsiya).** Yigʻish kaliti — aynan shular; yozish paytida koʻchirilsa, tahlil oddiy `GROUP BY` boʻladi, JSONB kavlash kerak emas.
2. **`item_version` javobda saqlanadi.** Element tahrirlansa, oʻtmishdagi javoblar qayta yozilmaydi — oʻquvchi oʻtmishdagi savolga javob bergan. Bu bir yildan keyin tushuntirib beriladigan yagona mexanizm.
3. **`elapsed_ms` ballash funksiyasining kirish tipiga UMUMAN kiritilmaydi.** Faqat "ishlatmaymiz" emas — `src/lib/assess/score.ts` dagi sof funksiya uni oʻz ichiga olmaydigan tipni qabul qiladi. Poyga va arqon tortish qobiqlari tezlik ballini qaytarishga doimiy bosim qiladi; tip tizimi — bu chiziqni ushlab turishning eng arzon joyi.

**OMR alohida jadvaldan oʻtadi (`omr_scans`), toʻgʻridan-toʻgʻri `responses` ga emas.** Sabab: 0.4 ishonchli oʻqilgan doira "B varianti" boʻlib tushsa, u soxta xato-tashxis boʻlib qoladi va butun tahlil dvigatelini zaharlaydi. Past ishonchli skanerlar oʻqituvchi koʻrigiga tushadi.

**Qiyosiy baholash (CJ) `responses` ga TUSHMAYDI.** U `student × savol × variant` emas, `juftlikda gʻolib` ishlab chiqaradi — `option_id` ham, `is_correct` ham yoʻq. U natija darajasida qoʻshiladi: `cj_judgements` → mavjud [`src/lib/cj-ranking.ts`](../src/lib/cj-ranking.ts) (`nextPair`, `rankScripts` — oʻchirilishdan omon qolgan) → `cj_ranks` → (ixtiyoriy) `grades`.

**Jurnalga koʻchirish** — `src/server/dal/assess/publish.ts`, hech qachon avtomatik emas:
1. `quizzes.purpose` bazadan **qayta oʻqiladi**; `formative` boʻlsa — xato.
2. Maqsad `topics.purpose` (ustun mavjud) `formative` boʻlsa — xato.
3. Bitta `assignments` qatori (+ yangi `source_session_id` ustuni izlanuvchanlik uchun).
4. Har ishtirokchiga bitta `grades` qatori. PK `(studentId, assignmentId)` boʻlgani uchun qayta nashr tabiiy idempotent.
5. `student_id = null` (anonim) ishtirokchilar **jimgina oʻtkazib yuboriladi** — anonim javob hech qachon bahoga aylanmaydi. Bu xavfsizlik xususiyati shaxsiyat modelidan oʻz-oʻzidan kelib chiqadi.

**Formativ yoʻl hech qachon baho yaratmaydi.** U quyidagilarni oziqlantiradi:
```
src/lib/assess/mastery.ts         masteryOf() → mastered | not | unverified   (≥0.75, ≥10 element)
src/lib/assess/decay.ts           decayBand() → 0-14 | 15-35 | 35+ kun; dueForRetrieval()
src/lib/assess/misconceptions.ts  classMisconceptions() → ≥30% sinf chegarasi
```
v1 da bular **jonli SQL `GROUP BY`** — `mastery_snapshots` keshi qurilmaydi. Tranzaksiyasiz kesh invalidatsiyasi indekslangan agregatdan qimmatroq. Materializatsiya bitta oʻqituvchi ~50k javobdan oshganda.

---

## B2. Shablonlar (34 interaktiv + 22 bosma)

**Asosiy topilma: 56 ta shablon 56 ta mahsulot emas.** Ular bir necha maʼlumot shakli ustidagi renderer'lar. Wordwall'ning butun mahsuloti aynan shu ustiga qurilgan — va uning eng kuchli imkoniyati "shablonni almashtirish": maʼlumot bir marta kiritiladi, keyin istalgan mos shablonda oʻynaladi yoki bosib chiqariladi.

| Shakl | Interaktiv shablonlar | Bosma |
|---|---|---|
| **`mcq`** | Quiz, Gameshow Quiz, Image Quiz, Maze chase, Airplane, Balloon pop, Whack-a-mole, Open the box, Random cards | Test blankasi (A4, doirachali) |
| **`pairs`** | Match up, Find the match, Flashcards, Crossword (soʻz+taʼrif) | Chiziq tortish, Flashcards (qirqiladigan), Crossword |
| **`categories`** | Group sort, Categorize, Conveyor belt, True or False (2 toifa) | Qirqish va yopishtirish |
| **`sequence`** | Rank order, Unjumble | Tartibga keltirish varagʻi |
| **`cloze`** | Missing word | Matndagi boʻshliqlar + soʻz banki |
| **`wordlist`** | Anagram, Wordsearch, Hangman, Random wheel | Wordsearch, Bingo kartalari |
| **`number`, `text`, `draw`** | Pear Deck uslubidagi interaktiv slayd promptlari | Ish varagʻi |
| **`imagezone`, `hottext`** | Wayground: Hotspot, Labeling, Hot text | Rasmli/belgilanadigan varaq |

**Bu nima uchun muhim (oddiy tilda):** oʻqituvchi 10 ta atama va taʼrifni bir marta kiritadi. Shundan keyin bir bosishda — Match up boʻlib oʻynaladi, Flashcards boʻlib takrorlanadi, Crossword boʻladi, qirqiladigan kartochka boʻlib chop etiladi. Qayta yozish yoʻq. Aynan shu narsa mahsulotni "yana bitta kviz ilovasi"dan ajratadi.

### Ikki daraja — diagnostika va takrorlash

Bu joyda pedagogik halollik talab qilinadi. `docs/ustozona-v1.md` aytadi: diagnostika uchun faqat MCQ ishonchli, chunki har distraktor bitta xato-tasavvurga bogʻlanadi. Anagramma noto'g'ri yechilsa — bu hech qanday xato-tasavvurni oshkor qilmaydi.

Shuning uchun:

| Daraja | Shakl | `responses` ga yozadi | Nimani oziqlantiradi |
|---|---|---|---|
| **1 — Diagnostika** | `mcq` (distraktorlar teglangan) | `misconception_id` **bilan** | Oʻzlashtirish (≥10 element, ≥75%), xato-tashxis, jurnalga koʻchirish |
| **2 — Takrorlash** | avto-tekshiriladigan qolgan 8 shakl | `misconception_id = null` | **Unutilish/takrorlash signali** (`decay.ts`), qatnashish |
| **3 — Ochiq javob** | `text`, `draw` | `is_correct = null` | **Qiyosiy baholash (CJ)**, sinf muhokamasi |

Ikkinchi daraja qiymatsiz emas — aksincha. `docs/ustozona-v1.md` §5 dagi `decay` funksiyasi "shu standart oxirgi marta qachon ishlangan" degan maʼlumotga muhtoj, va Wordsearch ham, Flashcards ham **haqiqiy retrieval practice** hodisasi. Yaʼni oʻyinlarning pedagogik asosi allaqachon qulflangan hujjatda bor — biz uni kengaytirmaymiz, faqat toʻldiramiz.

Amaliy natija: Anagramma oʻzlashtirish foizini **oʻzgartirmaydi**, lekin "DT.02 unutilish arafasida" signalini yangilaydi. Bu halol va tushuntirsa boʻladigan chiziq.

**Uchinchi daraja rejadagi haqiqiy boʻshliqni yopadi.** Hozirgacha `cj_scripts` ga ish qanday tushishi noaniq edi — insho qoʻlda yuklanardi. Endi javob bor: **`text` va `draw` javoblari toʻgʻridan-toʻgʻri CJ skriptidir.** Oʻquvchi darsda slaydga javob yozadi → oʻsha javob avtomatik `cj_scripts` ga tushadi → oʻqituvchi 15–20 marta "Qaysi biri yaxshiroq?" bosadi → [`cj-ranking.ts`](../src/lib/cj-ranking.ts) shkalali ball beradi. `docs/ustozona-v1.md` "yozma baholash ~90% tejaydi" deydi — bu tejash aynan shu yerda amalga oshadi.

### Muhandislik strategiyasi

**1. Bitta drag dvigateli — toʻrtta shablon.** Match up, Group sort, Rank order va Missing word — bu bir xil mexanika (elementni nishonga sudrash), faqat nishon geometriyasi har xil. Bitta `src/components/play/DragBoard.tsx` primitivi (`@dnd-kit` — loyiha standarti) toʻrtala shablonni beradi. Birinchi navbatda aynan shular qilinadi.

**2. Arkada shablonlari uchun oʻyin dvigateli OLINMAYDI.** Phaser va shu kabilar 1MB+ — Toshkentdagi 2GB'lik Android va sekin tarmoq uchun bu boshlanmaydigan ish. Balloon pop, Whack-a-mole, Conveyor belt, Open the box, Random wheel — hammasi DOM + CSS transform + `motion` (mavjud paket) bilan qilinadi. Faqat **Maze chase** (Pac-Man toʻqnashuv + dushman yoʻl topishi) va **Airplane** (uzluksiz skroll) haqiqiy canvas siklini talab qiladi — ular **oxirgi partiyaga** qoldiriladi, va qilinsa ham kichik qoʻlda yozilgan canvas sikli bilan.

**3. Shablon reyestri + lazy load.** `src/lib/play/templates/registry.ts`:
```ts
type Template = {
  id: string;
  shape: ActivityShape;
  surfaces: ("handheld" | "stage" | "print")[];
  minItems: number; maxItems: number;
  load: () => Promise<ComponentType<TemplateProps>>;   // dynamic import
};
```
Har shablon `React.lazy` bilan yuklanadi — `/play` faqat oʻsha safar ishlatilayotgan shablonni yuboradi, 34 tasini emas. Bu bundle uchun majburiy.

**4. Bosma shablonlar deyarli bepul keladi.** Foydalanuvchi toʻgʻri aytdi — Printables mustaqil mantiqqa ega emas. Ikkita mavjud qaror birlashadi:
- `docs/roadmap-texnik.md` §3.6: **bitta umumiy PDF qatlami** `@react-pdf/renderer` bilan (Sertifikatlash va PDF tabelga ham xizmat qiladi).
- 1-bosqichdagi **OMR blanka generatori** (burchak markerlari + oʻquvchi ID zonasi + doirachalar) — bu aynan Wordwall'ning "Quiz printable" shabloni.

Yaʼni `mcq` shakli uchun bosma versiya 1-bosqichda **allaqachon quriladi**. Qolganlari (Flashcards, Missing word, Chiziq tortish, Qirqish-yopishtirish) — shu qatlam ustidagi tartib (layout), yangi mantiq emas.
- ⚠️ **Bingo** yagona istisno: u har oʻquvchi uchun **boshqacha** karta generatsiya qiladi. PDF qatlami "N nusxa, har biri boshqa" rejimini qoʻllab-quvvatlashi shart — buni qatlam dizaynida hisobga olish kerak.

**5. Doska bilan umumiy primitivlar.** Sizning "Frontal boshqaruv vositalari" guruhingiz (Random wheel, Open the box, Random cards, Flashcards) — bu `data-surface="stage"`, yaʼni Doska bilan bir xil sirt. `Random wheel` = Doska'ning `Random Name` vidjeti, faqat maʼlumot manbai boshqa (oʻquvchilar oʻrniga atamalar). Bitta gʻildirak primitivi ikkala mahsulotga xizmat qiladi — bu sirt oʻqi boʻyicha boʻlish qarorining birinchi amaliy dividendi.

### Miqyos haqida halol gap

56 ta shablon — bu bosqich emas, **uzun quyruq**. Toʻgʻri ramka:

- **Haqiqiy muhandislik ishi** = 6 shakl + reyestr + `DragBoard` + PDF qatlami + har shaklga bitta namunaviy shablon.
- Shundan keyin **har qoʻshimcha shablon = mustaqil, chegaralangan ~0.5–2 kunlik komponent, sxema oʻzgarishisiz.**
- Yaʼni bu "loyiha" emas, **kontent quvuri** — har relizda 3–5 ta shablon chiqariladi, cheksiz.

**Boshlangʻich toʻplam** (har shakldan kamida bitta, dvigatel qayta ishlatilishi boʻyicha tartiblangan):

| # | Shablon | Shakl | Nega shu |
|---|---|---|---|
| 1 | Quiz | `mcq` | Diagnostik yadro — majburiy |
| 2 | Match up | `pairs` | `DragBoard` #1 |
| 3 | Group sort | `categories` | `DragBoard` #2 — bepul |
| 4 | Rank order | `sequence` | `DragBoard` #3 — bepul |
| 5 | Missing word | `cloze` | `DragBoard` #4 — bepul |
| 6 | Flashcards | `pairs` | Juda arzon, retrieval uchun juda qimmatli |
| 7 | Random wheel | `wordlist` | Doska bilan umumiy |
| 8 | Open the box | `mcq` | `mcq` ustidagi eng arzon qobiq |
| + | Test blankasi, Flashcards, Missing word (bosma) | — | PDF qatlamidan bepul |

**Kelgusi (v2) imkoniyat:** shakllararo avtomatik konvertatsiya. `pairs` → `mcq` avtomatik hosil qilinadi (bir juftlikning oʻng tomoni = toʻgʻri javob, boshqalarniki = distraktorlar). Shunda Match up uchun kiritilgan maʼlumot Maze chase boʻlib ham oʻynaladi. Wordwall'ni Wordwall qiladigan narsa aynan shu — lekin sxema oʻzgarishi talab qilmaydi, shuning uchun keyinga surish xavfsiz.

---

## B3. Interaktiv taqdimot (Pear Deck modeli)

Pear Deck arxitekturaning **tuzilishini oʻzgartirmaydi** — bu uning toʻgʻriligining belgisi. Toʻrtta yangilik qoʻshadi, biri esa mavjud boʻshliqni yopadi.

### 1. Slayd muharriri QURILMAYDI — mavjud dars hujjati taqdimot boʻladi

Pear Deck'ning yadro qiymati "statik slaydni interaktiv qilish". Ustozona'da esa **allaqachon dars hujjati bor** — [`/lessons/[id]`](../src/app/lessons/[id]), Tiptap 3.26, A4 sahifa chegarasi, `lesson.standards` bogʻlanishi (aynan `d92fb79` da ulangan).

Shuning uchun **ikkinchi kontent tizimi qurilmaydi**. Oʻrniga:
- Tiptap'ga **`interactivePrompt` tugun turi** qoʻshiladi (mavjud emoji-callout bloki bilan bir xil naqsh) — u `activity_id` ga havola qiladi.
- Darsning mavjud **A4 sahifa chegarasi** taqdimotda slayd chegarasi boʻladi. Yangi model kerak emas.
- `stage` sirtida dars **taqdimot rejimida** chiziladi; prompt tuguniga kelganda sinf javob beradi.

Yaʼni oʻqituvchi dars ishlanmasini yozadi — u avtomatik ravishda **ham bosma A4, ham interaktiv taqdimot** boʻladi. Bu Pear Deck qila olmaydigan narsa (u Google Slides importiga bogʻliq), va bizda deyarli bepul.

### 2. Ikki xil sur'at — allaqachon sxemada

`quiz_sessions.mode`: `live` = *instructor-paced*, `selfpaced` = *student-paced*. Yangi narsa yoʻq. Bitta muhim nuqta: `selfpaced` rejimda butun material ulanishda oldindan yuklanadi (F boʻlimi) — sekin tarmoqda bu eng katta yutuq.

### 3. Anonim proyeksiya — ikkita sirt, ikki xil maxfiylik

Pear Deck'ning eng qimmatli pedagogik imkoniyati: **oʻqituvchi ismlarni koʻradi, proyektor koʻrmaydi.** Qiziqarli (yoki xato) javob anonim tarzda ekranga chiqariladi va sinf muhokama qiladi.

Bu sirt oʻqi boʻyicha boʻlish qarorining ikkinchi dividendi — bitta sessiyaning ikki koʻrinishi:

| Koʻrinish | Sirt | Koʻrsatadi |
|---|---|---|
| Oʻqituvchi paneli | `desk` (noutbuk) | Ism + javob + jonli holat |
| Proyektor | `stage` | **Faqat javob** — ism yoʻq, avatar yoʻq |

**Xavfsizlik qoidasi:** anonimlik UI'da `display: none` bilan qilinmaydi. `stage` koʻrinishiga xizmat qiladigan DAL funksiyasi (`src/server/dal/assess/spotlight.ts`) **ism maydonini umuman qaytarmaydi** — DevTools ochgan oʻquvchi ham koʻra olmaydi. Bu A boʻlimidagi "read model qayta yoziladi, filtr almashtirilmaydi" qoidasining aynan oʻzi.

Va bu `docs/ustozona-v1.md` §6 dagi "Dars xulosa HERO" oqimiga toʻgʻri tushadi: sinf xato-tasavvuri aniqlanadi → anonim javob ekranga chiqadi → muhokama.

### 4. Immersive Reader — arzon qismi darhol, qimmat qismi keyin

| Imkoniyat | Texnika | Xarajat |
|---|---|---|
| Shrift kattalashtirish, qator oraligʻi, harf oraligʻi, disleksiya shrifti, qatorga fokus | **Sof CSS** — `data-reading="support"` token qatlami | **Deyarli bepul** — C boʻlimidagi token mexanizmining oʻzi |
| Ovozli oʻqish | Web Speech API (`speechSynthesis`) | Bepul, lekin ⚠️ pastga qarang |
| Rasmli lugʻat | Rasm bazasi kerak | Keyinga |

⚠️ **Halol cheklov:** brauzerlarda `uz-UZ` ovozi amalda **yoʻq**. Ruscha va inglizcha ishlaydi. Shuning uchun: Web Speech API ishlatiladi, `uz` uchun ovoz topilmasa tugma **koʻrinmaydi** (buzilgan funksiya koʻrsatilmaydi). Oʻzbekcha TTS uchun keyinchalik server tomonidagi xizmat (masalan Yandex SpeechKit) baholanadi — bu alohida qaror va alohida xarajat.

Diqqat: ovozli oʻqish `docs/ustozona-v1.md` §1.5 "AI oʻquvchiga tegmaydi" qoidasini **buzmaydi** — TTS sunʼiy idrok emas, u fikrlamaydi va javob bermaydi, faqat mavjud matnni oʻqiydi. Chegara: oʻquvchiga hech qachon **generativ** AI berilmaydi.

### 5. Flashcard Factory — oʻquvchi yaratgan kontent + tasdiq darvozasi

Oʻquvchilar guruhlarda atamaga taʼrif va chizma taklif qiladi → oʻqituvchi tasdiqlaydi → tayyor `pairs` toʻplami paydo boʻladi.

Sxemada allaqachon oʻrni bor: `activities.source = "student"` + `approved = false`. Kerak boʻladigan yagona yangi narsa — **tasdiq navbati** (`/dashboard/baholash/tasdiq`). Tasdiqlanmagan kontent hech qachon oʻyinga ham, tahlilga ham chiqmaydi.

Chiqadigan natija `pairs` shaklida boʻlgani uchun u **darhol** Match up, Flashcards, Crossword va qirqiladigan bosma kartochka boʻlib ishlatiladi (B2). Yaʼni bitta jamoaviy oʻyin toʻrtta shablonni oziqlantiradi.

### 6. `draw` javoblarini saqlash — blob'siz

Chizma **vektor shtrixlar** sifatida `responses.answer` jsonb ichida saqlanadi, rasm sifatida emas. Sabablari: hajmi kichik, istalgan sirt oʻlchamida qayta chiziladi, va **obyekt-saqlash (Vercel Blob) yoqilmaydi** — u ataylab yoqilmagan holicha qoladi. Agar bir kun shtrixlar hajmi muammo boʻlsa, oʻshanda blob qarori alohida koʻriladi.

### 7. Pear Deck ekotizimi ↔ Ustozona ost-loyihalari

| Pear Deck | Ustozona | Holat |
|---|---|---|
| Pear Deck (asosiy) | Baholash `lecture` rejimi + dars taqdimoti | Shu rejada |
| Pear Assessment (Edulastic) | **Ustozona Baholash** | Shu rejada |
| Pear Practice (Giant Steps) | Shablon/oʻyin qatlami + differensiatsiya | Shu rejada (differensiatsiya = v2) |
| Pear Start | **Ustozona AI** — mavjud + roadmap §4.1 | Qisman bor |
| Pear Deck Tutor (TutorMe) | — | ❌ **Qamrovdan tashqari** |

**Nega Tutor qilinmaydi:** u dasturiy mahsulot emas — jonli repetitorlar **marketplace'i**. U odam yollash, smena jadvali, toʻlov taqsimoti, sifat nazorati va moderatsiya talab qiladi. Bu butunlay boshqa biznes; bir kishilik jamoa uchun uni yon mahsulot sifatida qilish — asosiy mahsulotni oʻldirish. Agar bir kun kerak boʻlsa — alohida kompaniya sifatida.

---

## B4. Wayground qoʻshgan narsalar

Wayground'ning 15+ savol formatining koʻpi allaqachon qamrab olingan (Multiple Choice = `mcq`, Match = `pairs`, Reorder = `sequence`, Categorize = `categories`, Fill-in-the-Blank = `cloze`, Drag-and-Drop = `DragBoard`). Beshta haqiqiy yangilik bor.

### 1. Uchta yangi/kengaytirilgan shakl

| Wayground | Ustozona shakli | Izoh |
|---|---|---|
| Hotspot (rasm nuqtasini bosish) | `imagezone` `mode: click` | — |
| Labeling (rasmga yorliq sudrash) | `imagezone` `mode: label` | Bitta shakl, uch rejim |
| Hot text (matnni marker bilan belgilash) | **`hottext`** (yangi) | Sodda: matn tokenlarga boʻlinadi, baʼzilari toʻgʻri |
| Fill-in-the-Blank harfma-harf katakcha | `cloze` render varianti | Yangi shakl emas, faqat koʻrinish |

### 2. Baholash strategiyasi — SHAKLDAN ALOHIDA OʻQ

Bu Wayground ochib bergan haqiqiy noaniqlik. Ilgari rejada "shakl" ham maʼlumot tuzilishini, ham tekshirish usulini anglatardi. Ular **alohida**:

| `grading` | Nima qiladi | Kimga |
|---|---|---|
| `exact` | Aynan moslik | mcq, pairs, categories, sequence |
| `numeric` | Son + dopusk (`tolerance`) | number |
| **`mathEquiv`** | **1.5 = 1½ = 3/2 = 150%** — turli yozuv, bir qiymat | number |
| `keyword` | Kalit soʻzlar bor-yoʻqligi | text |
| `aiDraft` | AI qoralama baho → **oʻqituvchi tasdiqlaydi** | text |
| `cj` | Qiyosiy baholash | text, draw |
| `manual` | Faqat oʻqituvchi | hammasi |

**Matematik ekvivalentlik — bosqichma-bosqich.** v1 da **sonli normalizatsiya** yetarli: kasr/oʻnlik/foizni bitta songa keltirib, dopusk bilan solishtirish. Bu `1.5 / 1½ / 3/2 / 150%` holatini toʻliq yopadi va kichik sof funksiya (`src/lib/assess/math-equiv.ts`). **Simvolik ekvivalentlik** (`x+1` vs `1+x`) — v2, `mathjs.simplify()` bilan.

**Formulalar kiritish deyarli bepul:** loyihada **KaTeX allaqachon bor** (`katex 0.16` + Tiptap `extension-mathematics 3.26`). Wayground'ning "f(x) klaviaturasi" — mavjud infratuzilma ustidagi kiritish UI'si, yangi bogʻliqlik emas.

### 3. Interaktiv video — konteyner, yangi tushuncha emas

Muhim topilma: **interaktiv video va interaktiv taqdimot bir xil narsa, faqat oʻqi boshqa.**

- Taqdimot = **hujjatdagi joylarda** promptlar (B3.1, Tiptap tugunlari)
- Video = **vaqt oʻqidagi nuqtalarda** promptlar (`config.cues = [{timeMs, activityId}]`)

Shuning uchun yangi jadval kerak emas — `activity_sets.container_kind` uchta qiymat oladi: `none` (kviz), `lesson` (taqdimot), `video`. Bitta oqim, uchta koʻrinish.

⚠️ **Ikkita jiddiy cheklov:**

1. **v1 da FAQAT YouTube** (IFrame API orqali embed). Video **yuklash qilinmaydi** — u obyekt-saqlash (Vercel Blob) talab qiladi, u ataylab yoqilmagan, va video saqlash eng qimmat xarajat turi. Yuklash — alohida qaror, alohida budjet.
2. **Trafik**. Toshkentdagi oʻquvchi telefonida uy vazifasi sifatida 10 daqiqalik video = real pul. Uy vazifasi qilib berishdan oldin oʻqituvchiga video davomiyligi koʻrsatilsin.

Koʻrish telemetriyasi (kim toʻliq koʻrdi, kim tashlab ketdi) `session_participants` ga `progress jsonb` ustuni bilan yoziladi — javob emas, shuning uchun `responses` ga tegmaydi.

### 4. AI — mavjud infratuzilmaning kengaytmasi, yangi tizim emas

Loyihada **Ustozona AI allaqachon bor**: `/api/ustozona-ai`, Gemini→Groq→Anthropic zanjiri, `ai_usage` kvotasi, **`ai_docs` jadvali PDF yuklash uchun**. Yaʼni Wayground'ning "PDF/havola/mavzudan kontent yaratish" imkoniyati — mavjud quvurga yangi prompt shabloni, yangi tizim emas.

| Wayground AI | Ustozona holati |
|---|---|
| PDF/URL/mavzudan kviz-taqdimot generatsiya | Infratuzilma bor; prompt shabloni + `activities` ga yozish kerak |
| "Bite-sized": oʻqish darajasini oʻzgartirish, tarjima, hayotiy stsenariyga bogʻlash | Mavjud quvurga qisqa promptlar — arzon |
| Ochiq javoblarni avtomatik baholash | ⚠️ pastga qarang |

⚠️ **Avtomatik baholash va qulflangan falsafa.** `docs/ustozona-v1.md` §1.4: *"AI tavsiya qiladi, oʻqituvchi qaror qiladi."* Shuning uchun AI bahosi **hech qachon toʻgʻridan-toʻgʻri yozilmaydi** — u `grading: aiDraft`, yaʼni qoralama; oʻqituvchi tasdiqlagandan keyingina hisobga oʻtadi. Bu allaqachon `activities.approved` naqshining oʻzi.

**Muhim sintez:** AI-baholash va qiyosiy baholash (CJ) — bir muammoning ikki yechimi. Daisy tasdiqlagani — CJ. Tavsiya: **CJ asosiy, AI esa CJ ni tezlashtiruvchi** — AI ishlarni dastlabki tartibga soladi, shundan keyin oʻqituvchining qiyoslashlari **kamroq** kerak boʻladi (tartibsiz boshlanishdan koʻra oldindan saralangan roʻyxatni aniqlashtirish tez). Ikki yechim raqobatlashmaydi, biri ikkinchisini arzonlashtiradi.

### 5. Fleshkarta avtomatik generatsiyasi — konvertatsiyani oldinga suradi

Wayground "har qanday taqdimot yoki kvizni avtomatik fleshkartaga oʻgiradi" deydi. Bu B2 oxiridagi **shakllararo konvertatsiya** gʻoyasining aynan oʻzi — va bu uning ahamiyatini koʻtaradi: `mcq` → `pairs` (savol↔javob) avtomatik, `pairs` → Flashcards esa allaqachon boshlangʻich toʻplamda.

**Oraliqli takrorlash (spaced repetition) bilan bogʻlanish:** loyihada pedagogik model **allaqachon qulflangan** — `docs/ustozona-v1.md` §5 dagi `decay` (0–14 / 15–35 / 35+ kun, `retrievalThreshold` 14–21 kun). Farq shuki, bizniki **standart darajasida** ("qaysi mavzuni takrorlash kerak"), Anki/SM-2 esa **element darajasida**. v1 uchun standart darajasi toʻgʻri va u tayyor; element darajasidagi SR — v2 aniqlashtiruvi.

### 6. Akademik halollik — halol qamrov

| Imkoniyat | Texnik holat |
|---|---|
| Boshqa tabga oʻtishni aniqlash | ✅ `visibilitychange` + `blur`, ~20 qator, ishlaydi |
| Toʻliq ekran rejimi va undan chiqishni aniqlash | ✅ Fullscreen API |
| "Brauzerni qulflash" (Lockdown) | ❌ **Vebda amalda qoʻlga kiritib boʻlmaydi** |

⚠️ **Ortiqcha vaʼda bermang.** Haqiqiy lockdown brauzerlar (Respondus va sh.k.) — bu **native ilova**. Vebda istalgan oʻquvchi ikkinchi telefon bilan chetlab oʻtadi. Shuning uchun bu imkoniyat **"diqqat monitoringi"** deb ataladi, "qulflash" deb emas. `docs/marketing-brief.md` ning oltin qoidasi shu yerga toʻgʻridan-toʻgʻri tegishli.

Pedagogik joylashuv: Ustozona falsafasi formativ-birinchi; anti-cheating esa summativ imtihon tashvishi. Shuning uchun **ixtiyoriy va faqat `purpose: summative` sessiyalarda** — standart holat emas.

### 7. Longitudinal tahlil — bu allaqachon rejaning yadrosi

Wayground'ning *"barcha maʼlumot bitta bazada, uzoq muddatli oʻsish dinamikasi"* — bu aynan **bitta `responses` jadvali** qarorining maqsadi. Qoʻshimcha ish talab qilmaydi; u arxitekturaning natijasi.

### 8. Uy vazifasi sifatida yuborish — Shogird'ga bogʻliq

Wayground "taqdimotni darsdan keyin uy vazifasi qilib yuborish" deydi. Sxemada bu `mode: selfpaced` sessiya + muddat. Lekin **yuborish uchun oʻquvchi kanali kerak** — yaʼni bu **3-bosqichga (Shogird) bogʻliq**. Undan oldin uy vazifasi faqat havola/PIN orqali tarqatiladi (oʻqituvchi Telegram guruhiga tashlaydi) — bu ham ishlaydi va hech narsani bloklamaydi.

---

## B5. Kahoot va Blooket qoʻshgan narsalar

Savol turlari va oʻyin syujetlari allaqachon qamrab olingan (Quiz = `mcq`, True/False = `mcq` 2 variant, Type Answer = `text`+`exact`, Puzzle = `sequence`; Tower Defense/Gold Quest/Cafe/Battle Royale/Racing = `render_config`, jadval qoʻshilmaydi). Oltita haqiqiy yangilik.

### 1. Jamoaviy rejim — bu partiyadagi ENG MUHIM topilma

Kahoot'ning Team Mode'i: oʻquvchilar guruhga boʻlinadi, **bitta qurilmadan** birgalikda javob beradi.

**Nega bu Oʻzbekiston uchun eng muhim:** koʻpchilik sinfda har bolaga telefon yoʻq. `docs/roadmap-muhokama.md` OCR ni birinchi qoʻyish sababini shunday izohlaydi — *"hamma joyda elektron doska yoʻq"*. Jamoaviy rejim aynan shu muammoni jonli kviz tomonida yechadi: **5 ta telefon bilan 30 kishilik sinf oʻynaydi.** Bu "yoqimli qoʻshimcha" emas, bu jonli kvizni umuman ishlatib boʻladigan qiladigan narsa.

Sxemada: `session_participants.member_student_ids jsonb` — ishtirokchi endi bitta oʻquvchi ham, jamoa ham boʻla oladi.

⚠️ **Pedagogik chegara — buni yashirib boʻlmaydi.** 4 kishi birga bergan javob **bitta oʻquvchining bilimini isbotlamaydi**. Kim bosgani, kim bilgani, kim shunchaki qarab turgani nomaʼlum. Shuning uchun:

| Jamoa javobi | Yozadi | Oziqlantiradi |
|---|---|---|
| `participant_id` = jamoa, `student_id` = **null** | `responses` ga bitta qator | ✅ **Sinf darajasidagi** xato-tashxis, qatnashish |
| — | — | ❌ **Individual oʻzlashtirish** (`mastery`), ❌ jurnal bahosi |

Bu qoida allaqachon mavjud xavfsizlik xususiyatidan bepul kelib chiqadi: **`student_id = null` boʻlgan javob hech qachon bahoga aylanmaydi** (B boʻlim, publish qadam 5). Jamoa rejimi shu qoidaga tabiiy tushadi.

Amaliy natija: jamoaviy kviz *"sinfning 60% i email'ni ogʻzaki deb belgiladi"* degan xulosani beradi (bu `ustozona-v1.md` §6 dagi Dars Xulosa HERO ekranining aynan ozigʻi), lekin Alisherning oʻzlashtirish foizini oʻzgartirmaydi. Halol va foydali.

### 2. Soʻrovnoma va Soʻz buluti — Doska bilan birlashadi

Poll va Word Cloud'da **toʻgʻri javob yoʻq** — bu oʻlchov emas, fikr yigʻish. Sxemada: `grading: "none"` → `is_correct = null`, `misconception_id = null`. Ular oʻzlashtirishga ham, unutilish signaliga ham **tegmaydi** (bu ataylab — refleksiya savoli bilim dalili emas).

**Birlashuv:** Doska'ning `Poll` vidjeti va Baholash'ning soʻrovnomasi — bitta narsa. Bir marta yoziladi:
- `mcq` + `grading: none` → ustunli diagramma `stage` sirtida
- `text` + `grading: none` → **soʻz buluti** (javoblar chastotasi boʻyicha oʻlchamlanadi)

Soʻz buluti — sof `stage` renderer, yangi maʼlumot yoʻq. Va u anonim proyeksiya qoidasiga boʻysunadi (B3.3): ism qaytarilmaydi.

### 3. Excel/CSV import — arzon va juda foydali

Kahoot ham, Blooket ham buni asosiy imkoniyat deb koʻrsatadi, va sabab bor: oʻqituvchi 40 ta savolni bittalab kiritmaydi.

**Loyihada `xlsx` 0.18.5 allaqachon bogʻliqlik sifatida bor** (Sozlamalar → Maʼlumotlar eksporti uchun). Yaʼni import deyarli bepul: ustun xaritasi + zod validatsiya + `activities`/`activity_items` ga yozish. Har shakl uchun bitta namunaviy shablon fayli beriladi (yuklab olinadigan `.xlsx`).

**PowerPoint importi qilinmaydi** — u alohida parser (`pptx` = ZIP+XML), tartib-tuzilishini savolga aylantirish esa ishonchsiz evristika. Foyda/xarajat nisbati yomon. Agar kerak boʻlsa — AI orqali (mavjud quvur, B4.4), parser bilan emas.

### 4. Umumiy savollar bazasi — strategik aktiv

Blooket'ning "millionlab tayyor toʻplam" imkoniyati sxemada allaqachon bor: `activity_banks.visibility: private | school | public`.

Lekin bu texnik emas, **strategik** nuqta: **oʻzbek tilida, DTS/DTM ga bogʻlangan umumiy savollar bazasi hozir mavjud emas.** Buni birinchi boʻlib qurish — nusxa koʻchirish qiyin boʻlgan ustunlik (tarmoq effekti: har qoʻshilgan oʻqituvchi bazani boyitadi). Texnik ish kichik, qiymat katta.

⚠️ Kerak boʻladi: moderatsiya (sifatsiz/xato savol), muallif atributsiyasi, va `approved` darvozasi — bu allaqachon sxemada.

### 5. Oʻyin iqtisodi — daftardan tashqarida

Blooket'ning Gold Quest/Cafe/Tower Defense rejimlari **davomli iqtisodga** ega (tanga → sotib olish → rivojlantirish). Bu holat qayerda yashaydi?

**`session_participants.game_state jsonb` — va `responses` ga hech qachon tegmaydi.** Sabab: oʻyin iqtisodi sessiyaga xos, tasodifga bogʻliq (Gold Quest'da sandiq tanlash — sof omad) va oʻlchov emas. Uni oʻlchov daftariga aralashtirish — butun arxitekturaning maʼnosini yoʻqotish.

Bu B boʻlimdagi `elapsed_ms` qoidasining oʻzi: oʻyin qatlami maʼlumot **oladi**, lekin unga **yozmaydi**.

### 6. Kolleksiya (Blooks) — falsafa chegarasida, lekin yechim bor

Blooket'ning "Blook" personajlari — tanga yigʻib, kolleksiya sotib olish. Bu `docs/ustozona-v1.md` §2 da **ataylab v1 dan chiqarilgan** ClassDojo tanga tizimining aynan turi (behaviorist).

Lekin loyihada `behavior_rewards` va `behavior_redemptions` jadvallari **allaqachon bor** — yaʼni "biroz tashqi motivatsiya maqbul" degan qaror xulq domenida allaqachon qabul qilingan.

**Tavsiya — sizning "oʻyin faqat qobiq" qaroringizning toʻgʻridan-toʻgʻri davomi:**

| Ruxsat | Taqiq |
|---|---|
| Kolleksiya **faqat kosmetik** (avatar, personaj) | Kolleksiya oʻzlashtirish yoki bahoga taʼsir qilishi |
| **Qatnashgani** uchun beriladi | **Tezligi** yoki **eng koʻp toʻgʻri javobi** uchun berilishi |
| Takrorlash mashqlarida (2-daraja) | Diagnostik baholashda (1-daraja) |

Oxirgi qator eng nozigi va u dalilga tayanadi: tashqi mukofot allaqachon qiziqarli boʻlgan ishda ichki motivatsiyani **pasaytirishi** mumkin (overjustification), lekin zerikarli takrorlash mashqida **yordam beradi**. Shuning uchun kolleksiya `wordlist`/`pairs` mashqlarida oʻrinli, `mcq` diagnostikasida esa yoʻq.

Bu Daisy koʻrigidan oʻtkazilishi kerak boʻlgan qoʻshimcha — ochiq masalalar roʻyxatiga qoʻshildi.

---

## C. Dizayn tizimi — fayllar

```
src/app/globals.css               @theme / :root / .dark / @layer base + quyidagilarni @import qiladi
src/styles/surface.handheld.css   YANGI   html[data-surface="handheld"] { --spacing, --text-*, --radius }
src/styles/surface.stage.css      YANGI   html[data-surface="stage"]    { ... }
src/styles/product.baholash.css   YANGI   html[data-product="baholash"] { --primary, --accent }
src/styles/product.doska.css      YANGI
src/styles/product.shogird.css    YANGI   Telegram themeParams → tokenlar
src/styles/product.boshqaruv.css  YANGI
src/styles/reading-support.css    YANGI   html[data-reading="support"] { ... }  (B3.4)
docs/design-system-federation.md  YANGI   design-system.md va landing-design.md yonida
```

**Teglar `<html>` da, `proxy.ts` sarlavhasi orqali** — `src/app/layout.tsx` `headers()` ni oʻqib `<html data-surface=... data-product=...>` chiqaradi.

Bu **muhim texnik sabab**: Radix `Dialog`, `Popover`, `Select`, `Tooltip` `document.body` ga portal qiladi. Agar qamrov ichkaridagi `<div>` da boʻlsa, **har bir modal va dropdown qamrovdan qochib chiqib dashboard oʻlchamida chiziladi**. `<html>` da boʻlsa — portallar avtomatik meros oladi, flash yoʻq, SSR toʻgʻri. Ildiz layout allaqachon dinamik (`getLocale()` cookie oʻqiydi), shuning uchun `headers()` bepul.

**Bitta kichik tuzatish shart:** [`globals.css:374`](../src/app/globals.css:374) da `body { font-size: 14px }` — qatʼiy qiymat. `var(--text-body, 14px)` ga oʻzgartiriladi, aks holda har bir sirt bloki `@layer base` ni yengish uchun specificity hack talab qiladi.

**Nima umumiy, nima alohida:**

| Qatlam | Umumiy | Sirtga xos |
|---|---|---|
| Tailwind utility qatlami | ✅ aynan bitta | — |
| Semantik rang NOMLARI (`--primary`, `--card`) | ✅ qatʼiy lugʻat | qiymatlar (mahsulot oʻqi) |
| Motion tokenlar | ✅ | — |
| Shriftlar (DM Sans + JetBrains Mono) | ✅ | — |
| `src/components/ui/*` (~90 fayl) | ✅ **yopiq toʻplam — fork qilinmaydi, qoʻshilmaydi** | — |
| Shrift shkalasi / zichlik / radius | — | ✅ |
| Kompozitlar | `Panel`, `DialogHeaderBar` | `src/components/play/*`, `src/components/doska/*` |

**Toʻrtta kod bazasiga aylanishdan saqlaydigan qoida:** `src/components/ui/` yopiq. Mahsulot kompozitlari `src/components/{play,doska,shogird,boshqaruv}/` da yashaydi va `ui/` **dan** quriladi. Bitta mahsulot uchun `ui/` ga fayl qoʻshadigan oʻzgarish rad etiladi.

**Bilish shart boʻlgan cheklov:** v4 da `@theme` selektor ichiga joylashtirib boʻlmaydi. Yaʼni sirt bloklari — oddiy CSS custom-property override. Mahsulot **yangi utility ixtiro qila olmaydi** (`text-display` kabi); yangi utility umumiy `@theme` ga nomlangan holda qoʻshiladi (`--text-stage-2xl`). Bu birinchi boʻlib tishlaydigan qoida.

`.theme-landing-mono` **oʻz holicha qoldiriladi** — ishlayapti, tegish foyda bermaydi.

---

## D. Kod tashkiloti — bitta Next.js ilova

Turborepo emas, alohida repo emas.

Sabablar: bitta dev + bitta AI yordamchi; monorepo'da har bir kesib oʻtuvchi oʻzgarish (sxema ustuni, token, tarjima kaliti) koʻp-paket tahririga aylanadi; bitta auth/DB/deploy allaqachon integratsiya sirti; va reposda **ikkita isbotlangan presedent** bor — [`src/app/lessons/layout.tsx`](../src/app/lessons/layout.tsx) (dashboard'dan tashqaridagi toʻliq ekran, faqat kerakli sync koʻpriklari) va [`src/app/admin/layout.tsx`](../src/app/admin/layout.tsx) (oʻz qobigʻi, rol darvozasi).

```
src/app/play/                 Baholash pleyer + projektor (PIN bilan kirish, auth yoʻq)
src/app/dashboard/baholash/   Savol yozish, banklar, natijalar   ← dashboard dizayn tizimi
src/app/doska/                Sinf ekrani (PWA)
src/app/shogird/              Telegram mini-ilova
src/app/boshqaruv/            Maktab paneli
src/app/api/{play,shogird}/   Route handler'lar
```

**Baholash — ikkita sirt.** Savol yozish va tahlil `/dashboard/baholash` ichida (oʻqituvchi shkalasi, mavjud dizayn tizimi, mavjud storelar). Faqat pleyer/projektor `/play` da. Shu bois Baholash ekranlarining ~80% iga yangi qobiq, sidebar yoki auth kerak emas.

**Mavjud marshrutlar qayta guruhlanmaydi** (`src/app/(teacher)/…` ga koʻchirilmaydi) — har bir import va URL oʻzgaradi, foyda nol.

**Ikkita mahsulot naqshni bukadi:**

- **Doska (PWA/oflayn).** Deyarli butunlay client-side. Yagona server ehtiyoji — sinf roʻyxati (Random Name, Group Maker) va saqlangan presetlar. `next-pwa` ishlatilmaydi (Next 16 qoʻllab-quvvatlashi yomon), ~60 qatorlik qoʻlda service worker. **Qamrov gotcha:** SW faqat oʻz yoʻl prefiksini boshqaradi, Next esa `public/` ni `/` da beradi → SW `src/app/doska/sw.js/route.ts` dan beriladi, shunda qamrov avtomatik `/doska/`.
- **Shogird (Telegram WebView).** WebView'da uchinchi tomon cookie bloklanishi haqiqiy → Shogird **cookie'siz** boʻlishi shart. Amaliy oqibat: **Shogird server action ishlatmaydi, route handler + `Authorization: tma <initData>` ishlatadi.** DAL qatlami toʻliq qayta ishlatiladi, faqat action qatlami almashadi.

**Chiqish yoʻli (kelajakda ajratish kerak boʻlsa):** har mahsulot kodi aynan toʻrt joyda — `src/app/<m>/`, `src/components/<m>/`, `src/server/dal/<m>/`, `src/lib/<m>/`. ESLint chegara xaritasi buni haqiqiy ushlab turadi. Eng arzon ajraladiganlar — Doska va Shogird.

---

## E. i18n — yagona haqiqiy masshtablanmaydigan joy

Bugun [`src/app/layout.tsx`](../src/app/layout.tsx) **ildiz** layout'da butun fayl bilan `<NextIntlClientProvider messages={messages}>` qiladi. Bu har sahifada 157–230KB JSON — jumladan Toshkentdagi 2GB'lik Android'dagi kviz pleyerida. Yana toʻrtta mahsulot buni 400KB dan oshiradi.

1. **Namespace boʻyicha ichma-ich provayderlar** (avval shu). `src/i18n/namespaces.ts` + `src/i18n/pick.ts`. Ildiz faqat `CORE` (~5–10KB); `dashboard/layout.tsx` dashboard toʻplamini qoʻshadi; `play/layout.tsx` faqat `Play*`. next-intl 4 ichma-ich provayderlarni qoʻshimcha ravishda birlashtiradi.
2. **Xabar fayllarini mahsulot boʻyicha boʻlish** — `messages/uz/{core,dashboard,play,doska,shogird,boshqaruv}.json`. `src/i18n/request.ts` faqat kerakligini dinamik import qiladi. `getRequestConfig` da marshrut konteksti yoʻq — lekin sarlavhalar bor, va `proxy.ts` allaqachon `x-ustozona-product` ni qoʻyadi (C boʻlimi). Bitta sarlavha ikkala masalani hal qiladi.
   - ⚠️ Bu buzadigan aniq joy: [`src/app/api/ustozona-ai/route.ts`](../src/app/api/ustozona-ai/route.ts) bitta kalit uchun butun `messages/uz.json` ni statik import qiladi — qayta yoʻnaltirilishi shart.
3. **Tarjima xarajati:** yangi mahsulotlar avval `uz` + `ru` bilan chiqadi, namespace boʻyicha `uz` ga fallback. Aks holda har bir imkoniyat oltita tarjimaga bogʻlanib qoladi.

---

## F. Realtime — qaror keyinga surildi (siz shunday tanladingiz)

Shunga qaramay, **bugun qabul qilinishi kerak boʻlgan prinsip** bor, chunki u sxemani belgilaydi:

> **Realtime — bu kechikishni optimallashtirish. U hech qachon saqlash mexanizmi emas.**

Har bir javob **oʻquvchi → Next.js → Postgres** yoʻlidan oddiy HTTP bilan boradi. Realtime kanal faqat *"oʻqituvchi 4-savolga oʻtdi"* faktini tashiydi — bu fakt tarqatilishidan OLDIN `quiz_sessions.current_index` ga yozilgan, demak 2 soniyalik so'rov bilan tiklanadi.

Shu prinsip qabul qilinsa, runtime tanlovi hayot-mamot boʻlishdan toʻxtaydi: realtime qatlam kviz oʻrtasida oʻlsa, kviz polling'ga tushadi va **bitta ham javob yoʻqolmaydi**.

**Uzilish rejasi (Oʻzbekiston tarmoq sharoiti uchun):**
- `src/lib/play/outbox.ts` — javob har qanday tarmoq chaqiruvidan OLDIN localStorage'ga yoziladi. [`create-server-sync.ts`](../src/lib/sync/create-server-sync.ts) qayta ishlatilmaydi — uning snapshot-diff semantikasi qoʻshiluvchi jurnal uchun notoʻgʻri; faqat backoff shakli olinadi.
- `responses` dagi UNIQUE indeks → outbox'ni istalgancha qayta yuborish xavfsiz.
- Qayta ulanish: token → `POST /api/play/rejoin` → `{ state, currentIndex, answeredQuestionIds }`.
- Transport zinapoyasi: WebSocket → 2s polling → faqat lokal (bufer).
- **Oʻz tezligidagi kviz ulanishda butun kvizni oldindan yuklaydi** → 20 soniyalik uzilish umuman koʻrinmaydi. Bepul, va sekin tarmoq uchun eng katta yutuq.
- Vahima UI yoʻq. Javob darhol qabul qilingan deb koʻrsatiladi, chunki outbox yetkazishni kafolatlaydi.

**Eʼtiborga loyiq uygʻunlik:** tezlik ballari yoʻqligi sababli kech kelgan javob oʻquvchiga hech narsa turmaydi. Daisy'ning pedagogik qoidasi va Oʻzbekiston tarmoq realligi **bir xil arxitekturani** talab qiladi. Tezlik qoidasi buzilsa — oflayn bardoshlilik ham buziladi.

**Qaror nuqtasi:** 5-bosqichda, quyidagi maʼlumot yigʻilgach — nechta sinfda bir vaqtda jonli kviz kerak boʻldi; QR-karta rejimi jonli kvizga boʻlgan ehtiyojni qopladimi; oʻqituvchilar oʻz tezligidagi rejimni afzal koʻrdimi. Yetakchi nomzod — Cloudflare Durable Objects (xona = aktor, hibernation, alarm/taymer — **Vercel Hobby'da cron yoʻq**).

⚠️ **Texnik boʻlmagan bayroq:** Vercel Hobby tijorat foydalanishni taqiqlaydi. `teachers.plan` standarti `"free"` — demak monetizatsiya rejalashtirilgan. Pul olina boshlangan kunda Hobby — bu ToS buzilishi, tezlik masalasi emas. Pro daromaddan **oldin** budjetlanishi kerak.

---

## Bosqichlar

| # | Nima chiqadi | Yangi infratuzilma |
|---|---|---|
| **0** | i18n namespace boʻlinishi; `data-surface`/`data-product` proxy orqali; `requireTeacher()` rol darvozasi; `proxy.ts` qayta tuzilishi; ESLint chegaralari | yoʻq |
| **1** | Baholash sxemasi (6 shakl) + muharrir (`/dashboard/baholash`) + **QR-kartalar, oʻz tezligida, OMR** + tashxis/oʻzlashtirish dvigateli + PDF qatlami (`@react-pdf/renderer`) | yoʻq |
| **1b** | Shablon reyestri + `DragBoard` + boshlangʻich 8 shablon + 3 bosma shablon | yoʻq |
| **1c** | **Interaktiv taqdimot** — Tiptap `interactivePrompt` tuguni, dars `stage` rejimi, ochiq javob (`text`/`draw`) → CJ, anonim proyeksiya, oʻqish yordami | yoʻq (polling — pastga qarang) |
| **1d** | **Interaktiv video** (YouTube embed + cues) + `mathEquiv` + `imagezone`/`hottext` + **Excel/CSV import** (`xlsx` mavjud) + soʻrovnoma/soʻz buluti + AI kontent generatsiyasi | yoʻq |
| **2** | Doska (PWA) — sof client, faqat roʻyxat oʻqiladi; gʻildirak/quti primitivlari 1b bilan umumiy | yoʻq |
| **3** | Shogird — `student_links`, `user_telegram`, Telegram route handler'lar | Telegram bot |
| **4** | Boshqaruv — `requireSchoolAdmin()` JOIN qamrovi, faqat oʻqituvchi metrikalari | yoʻq |
| **5** | Jonli PIN-kviz + **jamoaviy rejim** + arkada/musobaqa qobiqlari (arqon tortish, poyga, Tower Defense, Gold Quest) | realtime (keyin qaror) |
| **∞** | Qolgan ~26 interaktiv + ~19 bosma shablon — har relizda 3–5 ta, sxema oʻzgarishisiz | yoʻq |

**Realtime ataylab oxirida.** 5-bosqichgacha hech narsaga socket kerak emas, va oʻsha paytga qadar haqiqiy sinflardan u umuman kerakmi degan maʼlumot yigʻiladi.

**1-bosqichdagi asosiy topilma:** QR-karta (Plickers) rejimida **aynan bitta yozuvchi bor — oʻqituvchining telefon kamerasi.** 30 oʻquvchi, bitta qurilma. Unga na realtime, na ishtirokchi shaxsiyati, na PIN kerak — u mavjud `action → DAL` naqshiga aynan tushadi, va har bir oʻquvchi `student_id` bilan aniqlanadi (karta oʻzi roʻyxat bogʻlovchisi), demak oʻzlashtirishni oziqlantiradi va jurnalga koʻchiriladi.

**1c-bosqichdagi topilma (nega taqdimotga realtime kerak emas):** *Instructor-paced* rejimda hammada bir xil slayd oʻzgarishi kerak — bu jonli sinxronizatsiyaga oʻxshaydi. Lekin **taqdimotda 2 soniyalik kechikishni hech kim sezmaydi.** Kahoot kvizida kechikish muhim (musobaqa), Pear Deck darsida esa yoʻq. F boʻlimidagi prinsip (`current_index` avval Postgres'ga yoziladi, keyin tarqatiladi) shuni anglatadiki, **2 soniyalik polling yetarli** — interaktiv taqdimot socket'siz toʻliq ishlaydi. Bu 1c ni 5-bosqichdan oldin chiqarish imkonini beradi.

---

## Ost-loyihalar boʻyicha qisqacha

**Doska.** Vidjet reyestri: har vidjet = `{id, type, x, y, w, h, state}`. Kanvas + `@dnd-kit` (loyiha standarti). **Farqlovchi ustunlik:** classroomscreen.com sizning oʻquvchilaringizni bilmaydi — Ustozona Doska biladi. Random Name va Group Maker haqiqiy roʻyxatdan oʻqiydi; Group Maker xulq ballari va davomatni hisobga olishi mumkin. **Poll vidjeti alohida qurilmaydi** — u Baholash'ning `grading: none` soʻrovnomasi, `stage` sirtida chizilgani (B5.2); QR Code vidjeti ham xuddi shu PIN tizimiga ulanadi. Draw = tldraw yoki Excalidraw (MIT) embed — `docs/roadmap-texnik.md` allaqachon shunday deydi. **Taymer gotcha:** brauzer fon tabini sekinlatadi → `setInterval` sanamaydi, `Date.now()` farqi ishlatiladi.

**Shogird.** Read-only MVP: davomat, baholar, xulq, streak. `initData` HMAC har soʻrovda serverda tekshiriladi (`auth_date` muddati bilan) — sessiya jadvali yoʻq, cookie yoʻq. **Pedagogik himoya:** v1 da sinf reytingi va tengdoshlar bilan taqqoslash **koʻrsatilmaydi** — faqat oʻquvchining oʻz traektoriyasi. Bu `docs/ustozona-v1.md` dagi "termometr → termostat" prinsipining oʻquvchi tomonidagi ifodasi.

**Boshqaruv.** Mavjud `/admin` qobigʻi naqshini kengaytiradi, `requireSchoolAdmin()` allaqachon `SchoolScope` qaytaradi. **Muhim chegara:** maktab admini oʻqituvchining shaxsiy pedagogik yozuvlarini (`student_notes`, `class_notes`, `feedback`) **koʻrmaydi**. Sabab `docs/MANTIQ.md` da yozilgan. Kerak boʻladi: oʻqituvchi maktabga qanday bogʻlanadi degan soʻrov/tasdiq oqimi (hozir `teachers.schoolId` ni kim qoʻyishi aniq emas).

**Interaktiv taqdimot.** Alohida slayd mahsuloti emas — mavjud dars hujjatining `stage` sirtidagi koʻrinishi. Yagona kod oʻzgarishi dars muharririda: Tiptap'ga `interactivePrompt` tugun turi. B3 boʻlimiga qarang. ⚠️ Maʼlum gotcha (KaTeX tugunidan): Tiptap'ga yangi tugun qoʻshgandan keyin dev-server qayta ishga tushirilishi shart, aks holda tugun roʻyxatdan oʻtmaydi.

**Shablonlar (34+22)** — mustaqil mahsulot emas, 11 shakl ustidagi renderer'lar. B2 boʻlimiga qarang. Sxema oʻzgarmaydi.

**Interaktiv video** — alohida mahsulot emas, `activity_sets.container_kind = "video"`. v1 da faqat YouTube embed, yuklash yoʻq. B4.3 ga qarang.

---

## Ochiq masalalar (hozir hal qilinmaydi, lekin yozib qoʻyiladi)

1. Bitta bola = N qator — MVP'da qabul qilindi; `students.person_id` zaxirada.
2. Realtime runtime — 5-bosqich qaror nuqtasi.
3. Vercel Hobby → Pro (tijorat foydalanish).
4. Oʻqituvchi ↔ maktab bogʻlanish oqimi (Boshqaruv uchun).
5. `docs/ustozona-implementation-plan.md` va `docs/standards-page-spec.md` §10.1 eskirgan — ular `d92fb79` da oʻchirilgan kodni tasvirlaydi; yangilanishi kerak.
6. **Shablonlar va intellektual mulk.** Oʻyin mexanikasining oʻzi (labirint, shar yorish, moslashtirish) himoyalanmaydi — ular gʻoya, ifoda emas. Himoyalanadigan narsalar: aniq nomlar, personajlar, rasm/grafika va umumiy koʻrinish (trade dress). Amaliy qoida: **mexanikani oling, nomni va vizualni oʻzimizniki qiling** — shablonlarga oʻzbekcha nom va `docs/illustrations.md` dagi mavjud illyustratsiya oilasiga mos oʻz grafikamiz. Bu huquqiy maslahat emas; sotuvdan oldin bir marta yurist koʻrigi tavsiya etiladi.
7. **Bosma shablonlar va OMR birlashuvi** — "Test blankasi" ham Wordwall printable, ham OCR skanerlash blankasi. Ular **bitta generator** boʻlishi kerak (ikkita emas), aks holda bir yildan keyin ikki xil A4 formati paydo boʻladi. 1-bosqichda shu qaror yozib qoʻyilsin.
8. **Oʻzbekcha TTS** — brauzerda `uz-UZ` ovozi yoʻq (B3.4). Server tomonidagi xizmat (Yandex SpeechKit va sh.k.) alohida baholanadi: narx, sifat, maxfiylik (matn tashqi xizmatga ketadi).
9. **Qamrovdan tashqari deb belgilangan:** Pear Deck Tutor uslubidagi jonli repetitor marketplace'i (B3.7).
10. **Video yuklash** — v1 da faqat YouTube. Oʻz videosini yuklash obyekt-saqlash + trafik budjeti talab qiladi; alohida qaror (B4.3).
11. **AI-baholash vs CJ** — tavsiya: CJ asosiy, AI uni tezlashtiruvchi (B4.4). Bu `docs/ustozona-v1.md` ga qoʻshimcha yozuv talab qilishi mumkin — Daisy koʻrigidan oʻtkazish tavsiya etiladi.
12. **"Lockdown" atamasi ishlatilmaydi** — vebda qoʻlga kiritib boʻlmaydi; "diqqat monitoringi" deb ataladi (B4.6).
13. **Kolleksiya/Blook tizimi** — tavsiya: faqat kosmetik, qatnashgani uchun, takrorlash mashqlarida (B5.6). `docs/ustozona-v1.md` §2 dan chetlanish boʻlgani uchun Daisy koʻrigidan oʻtkazilsin.
14. **Umumiy savollar bazasi** — texnik jihatdan tayyor (`visibility: public`), lekin moderatsiya siyosati va muallif atributsiyasi hal qilinmagan (B5.4).

---

## Miqyos haqida ochiq gap

Bu hujjat **toʻrtta ost-loyiha + 56 shablon + interaktiv taqdimot + interaktiv video + jamoaviy/oʻyin rejimlari** ni qamrab oladi. Bu bir necha oylik ish, bir necha haftalik emas — va reja shuni yashirmaydi.

Rejaning qiymati aynan shundaki, u **navbatni belgilaydi**: 0-bosqich (tayanch) bir haftalik, 1-bosqich (Baholash yadrosi + qogʻoz yoʻli) esa roadmap'dagi 15-avgust majburiyatini bajaradi. Qolgani mustaqil bosqichlar — har biri alohida yetkazib beriladi va oʻzidan keyingisini bloklamaydi.

**Toʻrt marta sinovdan oʻtdi:**

| Qoʻshildi | Sxemaga taʼsiri |
|---|---|
| Wordwall (56 shablon) | 0 jadval — hammasi `render_config` qiymati |
| Pear Deck | 4 shakl + bitta Tiptap tuguni |
| Wayground | 2 shakl + `grading` ustuni + `container_kind` uchinchi qiymati |
| Kahoot + Blooket | 3 ustun (`member_student_ids`, `game_state`, `grading: none`) |

Har safar tuzilma emas, **qiymatlar va ustunlar** oʻzgardi — bitta ham yangi jadval kerak boʻlmadi. Yangi mahsulot qoʻshish narxi vaqt oʻtgani sari **oshmayapti**, kamayyapti.

Ikkita solishtiruv haqiqiy tuzatish keltirdi:
- **Wayground** — "shakl" ilgari ham maʼlumot tuzilishini, ham tekshirish usulini anglatardi. Ajratildi (`shape` + `grading`).
- **Kahoot** — jamoaviy rejim `session_participants` ni "bitta oʻquvchi" deb faraz qilishni buzdi. Bu faraz baribir buzilishi kerak edi (Oʻzbekiston sinfxonasi uchun), shuning uchun erta topilgani yaxshi.

---

## Birinchi qadamda oʻzgaradigan fayllar (0-bosqich)

| Fayl | Oʻzgarish |
|---|---|
| [`src/server/session.ts`](../src/server/session.ts) | `requireTeacher()` ga rol darvozasi |
| [`src/lib/auth-roles.ts`](../src/lib/auth-roles.ts) | `student`, `guardian` rollari |
| [`src/proxy.ts`](../src/proxy.ts) | sarlavha teglash + redirect ajratilishi; matcher yangilanishi |
| [`src/app/layout.tsx`](../src/app/layout.tsx) | `<html data-surface data-product>`; `CORE` namespace provayderi |
| [`src/app/globals.css`](../src/app/globals.css) | `body font-size` → `var(--text-body, 14px)`; sirt/mahsulot fayllarini `@import` |
| `src/styles/surface.*.css`, `src/styles/product.*.css` | yangi |
| `src/i18n/namespaces.ts`, `src/i18n/pick.ts` | yangi |
| `eslint.config.mjs` | `no-restricted-imports` chegara zonalari |
| `docs/ost-loyihalar-arxitektura.md` | bu hujjatning doimiy uyi (reposda) |

---

## Tekshirish

`AGENTS.md` qoidasiga rioya: **brauzerda tekshirish foydalanuvchiga qoldiriladi**, ruxsatsiz preview ochilmaydi.

**Har oʻzgarishdan keyin:**
```bash
npx tsc --noEmit
```

**0-bosqich yakunida (push oldidan):**
```bash
npm run build
```
Sabab: `useSearchParams()` Suspense'siz kabi xatolar faqat prerender bosqichida chiqadi.

**Sxema oʻzgarishi (1-bosqich):**
```bash
npm run db:generate
```
soʻng migratsiya faylini koʻzdan kechirib, keyin `npm run db:migrate`.

**Qoʻlda tekshiriladigan nuqtalar (foydalanuvchi brauzerda):**
1. Dashboard (`/dashboard`) — matn 14px, tugmalar 36px boʻlib qolganini tasdiqlash (regressiya yoʻq).
2. Modal ochish — `data-surface` portal orqali meros olganini tasdiqlash (dropdown/dialog toʻgʻri oʻlchamda).
3. Dark mode toggle — sirt teglari bilan birga toʻgʻri ishlashi.
4. Til almashtirish — namespace boʻlinishidan keyin hech bir sahifada tarjima yoʻqolmaganini tekshirish (bu eng katta regressiya riski, chunki test freymvorki yoʻq).
5. `/lessons/[id]` va `/admin` — ular ham ildiz layout'dan meros oladi, buzilmaganini tasdiqlash.

**i18n regressiyasi uchun mexanik tekshiruv** (test yoʻqligi sababli): namespace koʻchirilishidan oldin `useTranslations("X")` chaqiruvlarini grep bilan roʻyxatlab, har biri oʻz subtree'sida taʼminlanganini tasdiqlash.
