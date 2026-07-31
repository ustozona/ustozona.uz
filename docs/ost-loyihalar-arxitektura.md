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
| **Oʻyin qoidasi** | Oʻyin faqat qobiq. Tezlik va omad faqat oʻyin reytingiga taʼsir qiladi; jurnalga faqat toʻgʻri/notoʻgʻri kiradi. |
| **Realtime** | **2 soniyalik polling YETARLI** (2026-07-29 qarori). WebSocket v1 da qilinmaydi — pastdagi izohga qarang. |
| **Dizayn tizimi** | **Mahsulot boʻyicha emas, KONTEKST boʻyicha boʻlinadi** — pastdagi izohga qarang. |
| **Ish tartibi** | **Har bosqich kodlashdan OLDIN — referens tekshiruvi.** Pastdagi qoidaga qarang. |

### ⚠️ v1 QAMROVI QISQARTIRILDI (2026-07-29)

Foydalanuvchi qarori: **real foydalanuvchi kelmaguncha** eng murakkab tahlil qatlami qurilmaydi. Bu hujjatning katta qismi shu qatlam ustiga yozilgan edi — quyidagi jadval nima **qoladi** va nima **kutadi**ni belgilaydi. Ziddiyat chiqsa, **shu jadval ustun**.

| Funksiya | v1 | Izoh |
|---|---|---|
| **Xato-tasavvur diagnostikasi** (har distraktorga `misconceptionId`, "sinfning 40% i X bilan Y ni chalkashtiryapti") | ❌ **CHIQDI** | Oʻqituvchi har savolning har varianti uchun sabab yozishi kerak edi — real ishlatilishi isbotlanmagan. Oʻrniga **oddiy test**: toʻgʻri/notoʻgʻri |
| **Oʻzlashtirish** (`mastery.ts`, ≥75% / ≥10 element) | ❌ **CHIQDI** | Hozir kerak emas |
| **Unutilish / takrorlash** (`decay.ts`, 0–14 / 15–35 / 35+ kun) | ❌ **CHIQDI** | Hozir kerak emas |
| **Qiyosiy baholash (CJ)** | ✅ **QOLADI** | Foydalanuvchi oʻzi loyihalashtiradi |
| Sessiya tahlili (aniqlik, element boʻyicha foiz, variant tanlovlari, natijalar matritsasi) | ✅ qoladi | Bular oddiy sanoq — diagnostikaga bogʻliq emas |
| Jurnalga koʻchirish | ✅ qoladi | — |

**Sxemaga taʼsiri:** `misconceptions` jadvali va `responses.misconception_id` ustuni **qoladi, lekin boʻsh** — keyin qaytish arzon boʻlsin. `mastery.ts` / `decay.ts` fayllari **yozilmaydi**.

`docs/ustozona-v1.md` (Daisy tasdiqlagan) **oʻchirilmaydi** — u v2 uchun tayanch.

### Jonli test shakllari (foydalanuvchi belgilagan, 2026-07-29)

Jonli testda ikki shakl: **ABCD (4 variant)** va **toʻgʻri/notoʻgʻri**. Taqdimot ichidagi topshiriqlarda qolgan shakllar ham boʻladi (guruhlash, juftlik va h.k.) — B2 ga qarang.

Yetkazish beshta yoʻl bilan (oʻzgarmadi): qogʻoz OMR · jonli (PIN/havola/QR) · QR-kartalar · taqdimot · oʻz tezligida.

### Ish tartibi — kodlashdan oldin referens tekshiruvi

Har bir ost-loyiha bosqichi (Baholash, Doska, Shogird, Boshqaruv — va ularning har bir yirik boʻlagi: jonli kviz, OMR, jamoaviy rejim va h.k.) kodlashdan **oldin** shu tartibda oʻtadi:

1. **Skrinshot va kod koʻrib chiqiladi** — shu bosqich asoslanayotgan barcha dastur/ilovalarning (Kahoot, Blooket, Wayground, Wordwall, Pear Deck, Plickers, classroomscreen.com va h.k.) haqiqiy ekran koʻrinishlari va, ochiq manba boʻlsa, kodi oʻrganiladi. Faqat matnli tavsifga tayanib UI qaror qilinmaydi.
2. **Topilma darhol shu hujjatga yoziladi** — partiyalab toʻplanmaydi. Har koʻrikdan keyin natija pastdagi "Referens tekshiruvi natijalari" boʻlimiga qoʻshiladi va rejani tuzatadigan joylar (sxema, ochiq masalalar, bosqichlar) oʻsha zahoti yangilanadi. Sabab: koʻrik chatda qolsa yoʻqoladi; hujjat esa kodlash paytida ochiladigan yagona manba.
3. **Shundan keyingina kodlashga oʻtiladi.**

Sabab: bu hujjatdagi B2–B5 boʻlimlari foydalanuvchi bergan matnli taʼriflar asosida yozilgan — ular arxitektura (sxema, oʻq, chegara) uchun yetarli boʻldi, lekin **aniq UI qarorlari** (tugma joylashuvi, animatsiya, kartochka geometriyasi, rang balandligi) uchun haqiqiy referensga qarash shart. Matnli tavsif "Random wheel — gʻildirakni aylantirish" deydi; gʻildirakning qanday aylanishi, qaysi tezlikda toʻxtashi, qanday teginish holati borligi — bularni faqat skrinshot/video koʻrsatadi.

**Amaliy qoida:** bu — yangi UI qurishdan oldin konsept muhokamasi kerakligi haqidagi mavjud ish tartibining davomi; bu yerda "konsept" mavjud mahsulotlarning haqiqiy skrinshot/koʻrinishini ham oʻz ichiga oladi, faqat matnli tavsif emas.

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

### Komponent tokenlari — 3-qatlam (qoʻshildi 2026-07-31)

Yuqoridagi ikki oʻq faqat **rang** va **oʻlcham**ni oʻzgartiradi. Ost-loyiha esa baʼzan boshqa **shakl tili** talab qiladi: oʻyin javob kartasi qalin chegarali va koʻtarilgan (Kahoot/Blooket), oʻqituvchi paneli esa tekis va ingichka chegarali. Buni token bilan bermasak, yagona chora — komponentni fork qilish.

Jahon tajribasidagi standart yechim — **uch pogʻonali token** (Salesforce Lightning, Adobe Spectrum, IBM Carbon):

| Qatlam | Misol | Kim oʻzgartiradi |
|---|---|---|
| 1. Global | `oklch(0.52 0.19 264)` | hech kim (xom qiymat) |
| 2. Alias/semantik | `--primary`, `--radius`, `--spacing` | sirt va mahsulot oʻqlari |
| 3. **Komponent** | `--surface-card-border`, `--choice-shadow` | ost-loyiha shakl tili |

Fayl: [src/styles/components.css](../src/styles/components.css). Tailwind bogʻlanishi `globals.css` dagi `@theme inline` (`--radius-card`, `--shadow-choice`, …) va `@utility border-card/border-control/border-choice` (border-width uchun Tailwind v4 da theme namespace yoʻq).

Lugʻat **ataylab kichik va yopiq**: `surface-card-*` (panel/karta), `surface-overlay-*` (modal/dropdown), `control-*` (tugma/input), `choice-*` (oʻyin/javob plitkasi). Yangi token faqat shu faylda eʼlon qilinadi, sahifada emas; nom semantik boʻladi (`--choice-shadow`, `--shadow-thick` EMAS) — aks holda 1-qatlamga qaytamiz.

Standart qiymatlar bugungi koʻrinishga aynan teng, shuning uchun qatlamning qoʻshilishi hech nimani oʻzgartirmaydi. Hozircha ishlatilgan joylar: `ui/panel.tsx`, `ui/card.tsx`, test muharriridagi javob plitkasi.

**Fork chegarasi (qatʼiy qoida):** primitivlar (`Button`, `Input`, `Panel`, `Card`) HECH QACHON fork qilinmaydi — ular token bilan sozlanadi. Domen komponentlari (javob plitkasi, podium, lobbi, taymer halqasi) esa har ost-loyihaning oʻz papkasida yashaydi va erkin yoziladi — ularni umumiylashtirish sof zarar (GitHub Primer / Atlassian ADS naqshi).

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
- `student_invites(code, teacher_id, class_id?, student_id?, relation, expires_at, used_at, used_by)` — **oʻqituvchi** kod beradi, maktab emas. Sabab: `docs/MANTIQ.md` — *"Bu yuqoridan boshqariladigan maktab tizimi EMAS."*
  - **Ikki yoʻl, ikkalasi ham** (R2): (a) **havola** — muddatli (~14 kun), tugagach qayta generatsiya qilinadi; (b) **sinf kodi** — qisqa (7–8 belgi), oʻquvchi `…/join/class` sahifasida qoʻlda kiritadi. Havola qulay, kod esa doskaga yozib qoʻyish uchun — Oʻzbekiston sinfida ikkinchisi koʻproq ishlatiladi.
  - `class_id` toʻldirilsa — sinfga qoʻshiluvchi umumiy kod; `student_id` toʻldirilsa — aniq bolaga bogʻlangan shaxsiy taklif (ota-ona uchun).
- `user_telegram(telegram_id, user_id, username)`.

**Ota-ona bogʻlanishi sinf darajasida yoqiladi** (R3). Sinf yaratishda bitta belgilash: *"Oʻquvchi ota-onasining aloqasini kiritishi talab qilinsin"*. Shunda har bir bolaga alohida taklif yuborish shart emas — oʻquvchi qoʻshilayotganda oʻzi kiritadi va `student_links` qatori paydo boʻladi. Bu Shogird onboarding'ini eng koʻp soddalashtiradigan qaror. `classes` jadvaliga bitta ustun: `require_guardian_contact boolean default false`.

⚠️ Bizda **email emas, telefon** boʻlishi kerak — Shogird Telegram mini-ilova, oʻzbek ota-onasida email koʻpincha yoʻq yoki ishlatilmaydi. Yaʼni maydon `guardian_phone`, va tasdiqlash Telegram orqali.

**Bitta bola = N qator masalasi.** MVP'da qabul qilamiz, chiqish yoʻlini hozir qoʻyamiz. Shogird oʻqituvchi/fan boʻyicha guruhlaydi ("Matematika — Nodira opa", "Ingliz tili — Aziza opa") — ota-ona buni **xato emas, toʻgʻri** deb oʻqiydi. Chiqish yoʻli: `students.person_id` ustunini zaxiraga qoʻyish va **hech qachon "mening farzandim" birlik marshrutini qurmaslik** — doim `/shogird/students/[studentId]`, bitta bola boʻlsa ham. Shunda keyinchalik birlashtirish arzon migratsiya boʻladi.

**Maktab qamrovi** — `teachers.schoolId` orqali JOIN, denormalizatsiya QILINMAYDI. Sabab: `neong-http` da tranzaksiya yoʻq, sync qatlami last-write-wins — denormallashtirilgan `schoolId` drift beradi, bu risk emas, aniqlik. Muhim ogohlantirish spec'ga yozilishi shart: **Boshqaruv v1 oʻquvchi boʻyicha emas, OʻQITUVCHI boʻyicha hisobot beradi** (nechta sinf, nechta baholash oʻtkazilgan, oxirgi faollik) — chunki "maktabda N oʻquvchi" yuqoridagi sabab bilan haddan ziyod sanaydi.

**DAL tuzilmasi** — har papkaga bitta darvoza:
```
src/server/session.ts          (mavjud)  requireTeacher / requireAdmin / requireSchoolAdmin
src/server/shogird/session.ts  YANGI     verifyInitData / requireStudentViewer
src/server/play/session.ts     YANGI     requireParticipant / requireHostSession
src/server/dal/assess/         YANGI     requireTeacher()   banks questions quizzes sessions results mastery cj omr publish
     results.ts: sessionReport(sessionId) — bitta oʻtkazish (R55/R56)
                 contentReport(setId)     — HAMMA oʻtkazish boʻyicha jamlanma (R58)
                      → "shu savol besh sinfda ham qiyin" = savol yomon, sinf emas
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
activity_banks(id, teacher_id, name, subject, grade, visibility, copied_from,
               verified, tags jsonb)
  → visibility standarti `private` — 4 ta mahsulotda 4 marta tasdiqlandi (R57/R67/R71)
  → copied_from: umumiy bankdan nusxa olinganda MANBA saqlanadi (R75)
       ⚠️ 1-bosqichda darhol qoʻyiladi — keyin qoʻshib boʻlmaydi (oʻtmish yoʻqoladi)
  → verified: moderator sifat tekshiruvidan oʻtkazgan (Ochiq masalalar №14)

activities(id, teacher_id, bank_id, standard_id, shape, title, version,
           source, approved, config jsonb)
  → shape: mcq | pairs | categories | sequence | cloze | wordlist
         | number | imagezone | hottext | text | draw  ← 11 SHAKL (B2/B3/B4 ga qarang)
  → source: teacher | ai | bank | student              ← `student` = Flashcard Factory
  → approved: student/ai manbali kontent oʻqituvchi tasdigʻisiz oʻyinga chiqmaydi
  → grading: exact | partial | numeric | mathEquiv | keyword | aiDraft | cj | manual | none
             ← SHAKLDAN ALOHIDA OʻQ (B4.2); `none` = soʻrovnoma/soʻz buluti (B5.2)
             `partial` = koʻp kichik javobli element, ulush bilan (R26)
  → config: shakl darajasidagi sozlama (toifalar roʻyxati, cloze matni, rasm, ...)

activity_items(id, activity_id, teacher_id, ordinal, content jsonb)
  -- AVTO-TEKSHIRILADIGAN (8)
  mcq:        { stem, media?, shuffleOptions?, options:[{id,text,isCorrect,misconceptionId?}] }
              → shuffleOptions HAR SAVOLGA alohida (R62) — joylashuv siljishi va
                   yondagi bolaning ekranidan koʻchirishga qarshi; global QILINMAYDI,
                   chunki "yuqoridagilarning hammasi" kabi variantlarni buzadi
                   ✅ tashxisga taʼsiri yoʻq: javob {optionId} yoziladi, tartib emas
              → `text` KaTeX render qiladi — formula savolda ham, VARIANTDA ham (R64)
              → bir nechta `isCorrect` ruxsat etiladi; alohida "multi-select" bayrogʻi
                   kerak emas (R63)
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

activity_sets(id, teacher_id, class_id, title, purpose, items jsonb,
              container_kind, container_ref, config jsonb)
  → purpose: formative | summative   ← YADRO AJRATUVCHI
  → items: [{ activityId, role }]    ← ROLLI roʻyxat, yalangʻoch id massivi emas (R46)
       role: entry | check | vocabulary | practice | exit
       `exit` = dars yakuni signali — Dars Xulosa HERO (ustozona-v1.md §6) shunga qaraydi
       `responses` ga koʻchirilmaydi; v1 da jonli JOIN yetarli
  → container_kind: none    = oddiy kviz/test
                    deck    = taqdimot (slayd+savol+doska, R145) — Baholash RESURSI,
                              `/dashboard/lessons` (dars rejasi) dan MUSTAQIL
                    video   = interaktiv video (ref = YouTube id, config.cues = [{timeMs, activityId}])
                    passage = matn boʻlagi + unga bogʻlangan bir nechta savol (R146)
  → yaʼni kviz, taqdimot, video va matn-savol — BITTA tushunchaning toʻrt koʻrinishi (B4.3)
  → ⚠️ TUZATILDI (R145): ilgari bu yerda `lesson` va "STANDART kirish nuqtasi — dars
       hujjati" deb yozilgan edi. Foydalanuvchi qarori bilan bekor qilindi — taqdimot
       endi mustaqil Baholash resursi (`deck`), dars rejasidan (`/dashboard/lessons`)
       ajralgan. Yaratish oqimida (R144) besh resurs turi teng tanlanadi, birortasi
       standart emas
  → config.defaultTimeLimit — toʻplam darajasidagi vaqt chegarasi, har savolda
       ustidan yozish mumkin (R68)

quiz_sessions(id, teacher_id, set_id, class_id, title, mode, mode_boundary, state,
              join_code, current_index, render_config jsonb, completion jsonb,
              runtime_ref, scheduled_at, opened_at, paused_at, closed_at, due_at)
  → title: sessiyaning OʻZ nomi (R73) — boʻsh boʻlsa toʻplam nomi koʻrsatiladi
  → completion: { kind: "allItems" } | { kind: "correctCount", n }        ← R73
       `correctCount` = oʻzlashtirishga asoslangan uy vazifasi (N tasi toʻgʻri boʻlguncha)
       ⚠️ takroriy urinishni talab qiladi (attempt_no), LEKIN oʻzlashtirish
          baribir FAQAT birinchi urinishga qaraydi (R11)
  → mode: live | selfpaced | paper | qrcards | lecture
       ⚠️ OʻZGARUVCHAN — sessiya oʻrtasida almashadi (R106). Haqiqiy dars oqimi:
          1–12-slayd birga (live) → 13–31 mustaqil (selfpaced) → oxirida yana birga
  → mode_boundary: int? — `selfpaced` qaysi indeksgacha amal qiladi (R106)
       rejim almashganda qolgan material oldindan yuklanadi (F boʻlim)
  → state: draft | scheduled | running | paused | completed     ← R1
       `scheduled` = kelajakka rejalashtirilgan (hali ochilmagan)
       `paused`    = oʻqituvchi vaqtincha toʻxtatgan, javob qabul qilinmaydi
       `completed` QAYTARILADI — "sessiyani qayta ochish" haqiqiy ehtiyoj (R49)
  → class_id MAJBURIY — sessiya sinfsiz boshlanmaydi (R43). Bu sxema emas, OQIM qarori:
       roʻyxatga bogʻlanmagan javob tahlil dvigatelini oziqlantirmaydi
  → join_code sessiya yopilgandan keyin ham SAQLANADI — oʻqituvchi shu bilan tanib oladi (R49)
  → render_config: { templateId, memeSetId?, theme, pointsMultiplier? }
       ← SHABLON SHU YERDA, jadval yoʻq
       theme: { seed, mode } — rang urugʻi + ochiq/toʻq, 20 ta mavzu fayli EMAS (R38)
       pointsMultiplier: { [itemId]: 0 | 1 | 2 } — FAQAT oʻyin reytingi (R33);
            jurnalga koʻchirishga taʼsiri yoʻq, u yerda foizga normalizatsiya ishlaydi
       shuffleAnswers: boolean — sessiya standarti YOQILGAN (R93); har savolda
            `mcq.shuffleOptions` bilan bekor qilinadi (R62)
       showQuestionOnDevice: boolean — standart OʻCHIRILGAN (R91): savol matni
            faqat projektorda, telefonda faqat rangli tugmalar. Sabab: trafik,
            kichik ekran, diqqat. `stage` + `handheld` sirtlarining amaliy ishlatilishi
       gameShell: boolean — ⭐ BITTA TUMBLER butun oʻyin qobigʻini oʻchiradi (R99):
            avatar, streak, reyting, konfetti, podium, tanga — hammasi yoʻqoladi,
            savol/javob/tahlil BIR BIT ham oʻzgarmaydi. `summative` uchun standart OFF.
            Bu "oʻyin = qobiq" qarorining kodda tekshiriladigan isboti
       feedback: "immediate" | "afterQuestion" | "afterSession" | "none"  ← R116
            formativ → `immediate` (xatoni darhol tuzatish)
            summativ → `afterSession` (qolgan savollarga taʼsir qilmasin)
       timer: { mode: "off" | "soft" | "lock", seconds } — R102
            `lock` = vaqt tugagach javob qulflanadi; host jonli boshqaradi (+15s, pauza)
            ⚠️ `score.ts` kirish tipiga KIRMAYDI — vaqt oqimni boshqaradi, ballni emas
       focusMode: boolean — "diqqat bu yoqqa": oʻquvchi ekrani xiralashadi (R108)
       accommodationOverrides?: { [studentId]: Partial<Accommodations> }  ← R101
            sessiyaga xos bekor qilish; doimiy moslashuv `student_accommodations` da

session_teams(id, session_id, teacher_id, name, color)        ← GURUH rejimi (B5.1)
  → guruh sessiya BOSHIDA bir marta tuziladi (tasodifiy/avtomatik yoki qoʻlda)
  → guruh bali = aʼzolar bali yigʻindisi — FAQAT reyting qatlami

session_participants(id, session_id, student_id?, team_id?,
                     display_name, token_hash, device_label, device_kind,
                     game_state jsonb, progress jsonb, integrity jsonb,
                     joined_at, last_seen_at)
  → device_label = Plickers karta raqami
  → team_id: har OʻQUVCHI oʻz qurilmasida, oʻz qatori bilan; guruh faqat birlashtiradi.
       ⚠️ Shu bois guruh rejimida ham `student_id` TOʻLADI → individual natija
          saqlanadi va jurnalga koʻchirish ISHLAYDI (eski "bitta qurilma, N bola"
          modeli buni yoʻqotardi — 2026-07-29 da rad etildi)
  → device_kind: mobile | tablet | desktop — FAQAT qoʻpol toifa (R125);
       toʻliq user-agent SAQLANMAYDI ("menda ishlamadi" shikoyatini tekshirish uchun)
  → integrity: { tabSwitch: { total, byItem: {[itemId]: n}, lastAt } }  ← R124
       ⚠️ urinilmagan savolda ham bayroq boʻladi, demak `responses` ga yozib boʻlmaydi
       ⚠️ bahoga, oʻzlashtirishga, xato-tashxisga, xulq ballariga HECH QACHON tegmaydi
       sessiya bilan birga oʻladi — doimiy kuzatuv izi yaratilmaydi
  → student_id STANDART HOLDA TOʻLADI (R43): ishtirokchi qoʻshilganda sinf roʻyxatidan
       oʻz ismini TANLAYDI, ism yozmaydi. Anonim (null) — istisno, standart emas.
  → game_state: oʻyin iqtisodi (tanga, minora, kolleksiya) — SESSIYAGA XOS,
       oʻlchov daftariga TEGMAYDI (B5.5)
  → progress: video koʻrish telemetriyasi (B4.3)

responses(id, teacher_id, session_id, participant_id, student_id?,
          activity_id, item_id, item_version, attempt_no, answer jsonb,
          is_correct, score, misconception_id, standard_id, source, confidence,
          accommodations jsonb, elapsed_ms, client_seq, answered_at)
  UNIQUE (participant_id, item_id, item_version, attempt_no)  ← idempotent qayta yuborish
  INDEX  (student_id, standard_id)                           ← oʻzlashtirish
  INDEX  (misconception_id) WHERE NOT NULL                   ← xato-tashxis
  → `answer` jsonb: mcq da {optionId}, pairs da {matchedId}, sequence da {position}...
  → `misconception_id` FAQAT mcq da toʻladi; boshqa shakllarda null (pastga qarang)
  → `confidence` — oʻquvchi javob berishda qanchalik ishonchli ekani (R90).
       FAQAT "ishonch rejimi" yoqilgan sessiyalarda toʻladi, aks holda null.
       ⚠️ Eng qimmatli kombinatsiya: NOTOʻGʻRI + YUQORI ishonch = tasdiqlangan
          xato-tasavvur (tasodifiy xato emas, ildiz otgan notoʻgʻri model).
          TOʻGʻRI + PAST ishonch = taxmin, oʻzlashtirish deb hisoblanmaydi.
  → `score` numeric(4,3) 0..1 — QISMAN BAHOLASH uchun (R26). Bir elementda bir nechta
       kichik javob boʻlsa (hottext tokenlari, labeling yorliqlari, matchgrid katakchalari,
       koʻp boʻshliqli cloze) ulush yoziladi. `is_correct = (score = 1)` — hosila maydon,
       lekin saqlanadi, chunki oʻzlashtirish/tashxis faqat shunga qaraydi.
       Bitta javobli shakllarda score 0 yoki 1.
  → `attempt_no`: 1 dan boshlanadi. Koʻp urinish ruxsat etilsa har urinish ALOHIDA
       qator (R11) — eskisi ustiga yozilmaydi. Oʻzlashtirish/tashxisga qaysi urinish
       kirishi `activity_sets.config.attemptPolicy` bilan hal qilinadi (v1: birinchi).
  → `accommodations`: shu javob paytida oʻquvchida yoqilgan ELEMENTGA TAʼSIR QILUVCHI
       moslashuvlar roʻyxati, masalan `["reduceChoices"]` (R13). Boʻsh boʻlsa null.
       Bu roʻyxat boʻsh boʻlmagan javob **xato-tashxisga kirmaydi** — sabab R13 da.

student_accommodations(id, teacher_id, student_id, kind, config jsonb,
                       scope, scope_ref, created_at, updated_at)     ← R10
  UNIQUE (student_id, kind, scope, scope_ref)
  → scope: student (doimiy) | class | set | session   ← eng tor qamrov ustun turadi
  → kind uch sinfga boʻlinadi — R10 dagi jadvalga qarang (koʻrinish / sharoit / element)

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

⚠️ **v1 da FAQAT `session-stats.ts`.** Quyidagi uchtasi qamrovdan chiqdi (yuqoridagi "v1 qamrovi" jadvali) va **yozilmaydi** — ular v2 rejasi sifatida shu yerda qoldirildi:

```
❌ src/lib/assess/mastery.ts       masteryOf() → mastered | not | unverified  (≥0.75, ≥10 element)
❌ src/lib/assess/decay.ts         decayBand() → 0-14 | 15-35 | 35+ kun; dueForRetrieval()
❌ src/lib/assess/misconceptions.ts  classMisconceptions() → ≥30% sinf chegarasi
```

```
src/lib/assess/session-stats.ts   accuracy() · completionRate() · itemAccuracy()
                                  optionCounts() · unanswered() · duration()
                                  outcomeCounts() · accuracyByIndex() · avgTime()
                                  presence()
     completionRate = avg(ishtirokchi yechgan element / jami element)      ← R50
          `selfpaced` va uy vazifasida BIRINCHI koʻrsatiladigan raqam
     itemAccuracy   = element boʻyicha sinf foizi → matritsa ustun sarlavhasi  ← R45
     optionCounts   = MCQ variantlari boʻyicha tanlov soni ← R56
          ⚠️ v1 da FAQAT SANOQ ("B ni 9 kishi tanladi"). Sabab yorligʻi
             (misconception) v1 dan chiqdi — yuqoridagi qamrov jadvaliga qarang
     outcomeCounts  = { correct, partial, incorrect, unattempted } — TOʻRT holat,  ← R122
          `correct/total` EMAS. `unattempted` javob yoʻqligi, demak toʻplam
          elementlari roʻyxatidan hisoblanadi, `responses` jadvalidan emas
     accuracyByIndex= [{ index, accuracy, itemId }] — grafik oʻqi UMUMIY indeks,  ← R121
          savol raqami emas; slaydlar boʻshliq qoldiradi, indeks siljimaydi
     avgTime        = oʻrtacha vaqt — KOʻRSATILADI, ballanmaydi (R123).           ← R123
          ⚠️ qisqa vaqt + past aniqlik = taxmin qilish signali (xulq, bilim emas)
     presence       = { submitted, attempting, absent } — jonli panel uchun      ← R114
          `attempting` javob emas, hozirlik: last_seen_at + joriy indeksdan hosila
     ⚠️ HAMMASI faqat baholanadigan elementlarni oladi (R120) — va bu qoida
        ekranda YOZILADI: "faqat baholanadigan savollar hisobga olingan"
     unanswered     = kutilgan ishtirokchi − javob bergan (xato EMAS, alohida) ← R56
     duration       = opened_at → closed_at (past foizni talqin qilish uchun)  ← R55
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

### Ikki daraja — avto-tekshiriladigan va ochiq javob

⚠️ **QAYTA YOZILDI (2026-07-29).** Avval bu yerda uch daraja bor edi: diagnostika (`mcq` + xato-tasavvur teglash) · takrorlash (`decay` signali) · ochiq javob. Birinchi ikkitasi **v1 qamrovidan chiqdi** (yuqoridagi jadval). Qolgani:

| Daraja | Shakl | `responses` ga yozadi | Nimani oziqlantiradi |
|---|---|---|---|
| **1 — Avto-tekshiriladigan** | `mcq` (ABCD va toʻgʻri/notoʻgʻri) + qolgan 8 shakl | `is_correct` (yoki `score`) | Sessiya tahlili, natijalar matritsasi, **jurnalga koʻchirish** |
| **2 — Ochiq javob** | `text`, `draw` | `is_correct = null` | **Qiyosiy baholash (CJ)**, sinf muhokamasi |

Yaʼni v1 da natija **oddiy va tushunarli**: nechta toʻgʻri, qaysi savol qiyin kelgan, kim tugatmagan. Xato **sababini** nomlash — v2.

`misconceptions` jadvali va `responses.misconception_id` ustuni sxemada **qoladi** (boʻsh) — v2 da qaytish arzon boʻlsin.

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
  plan: "free" | "pro";                                // R28/R29 — monetizatsiyaga qoldirildi
  preview?: ComponentType;                             // R27 — tanlagichdagi namuna
  // ── rejim metadatasi (R77): oʻqituvchi tanlashdan OLDIN biladi
  category: "assessment" | "repetition" | "team" | "collaboration";   // R89 — MAQSAD
       // oʻqituvchi tanlash ekranida shu boʻyicha filtrlaydi; "collaboration"
       // (raqobatsiz, birgalikda yechish) bizda hozircha yoʻq — kelgusi
  rewards: ("accuracy" | "participation" | "collaboration")[];
       // ⚠️ tipda "speed" YOʻQ — qoida hujjatda emas, TIP TIZIMIDA turadi
       //    (`elapsed_ms` ni ballash tipiga kiritmaslik hiylasining ikkinchi qoʻllanishi)
  prompting: "synced" | "async";                       // hammaga bir vaqtda / oʻz tezligida
  players: { min: number; ideal: number; max: number };
       // ⚠️ ularda ideal = 8, bizning sinf 25–35 → arkada rejimlari oʻlchov boʻyicha
       //    toʻgʻri kelmaydi; jamoaviy rejim (B5.1) shuni yechadi
  idealMinutes: number;
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

**Referens tekshiruvidan keyingi tasdiq (R20–R21, R25):** Wayground'ning taqdimot muharriri koʻrib chiqildi — u **erkin kanvas** (mutlaq `left/top/width/height/rotate/z-index`), yaʼni bizning oqim hujjatimizdan tubdan boshqa model. Nima yoʻqotayotganimiz R20 dagi jadvalda halol yozilgan. Qaror oʻzgarmadi, sababi kuchaydi: **ularning muharriri kichik ekranni rad etadi** (R21), bizning oqim hujjati esa telefonda ham ochiladi — Oʻzbekiston sharoitida bu hal qiluvchi. Qoʻshimcha ravishda R22 (taqdimotchi qaydlari) va R23 (yon panel) shu boʻlimga kiritildi; sahnaga sigʻdirish `transform: scale()` bilan (R25).

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

**Tuzatish (R10):** bu qatlam **global toggle emas, oʻquvchi boʻyicha** saqlanadi — `student_accommodations` jadvalida, `kind` = koʻrinish sinfidan. Sessiya boshlanganda oʻsha oʻquvchining tokenlari yoqiladi. Yaʼni `data-reading="support"` — bu bitta oʻquvchining doimiy sozlamasi, oʻqituvchi bir marta beradi va u barcha faoliyatlarda ishlaydi.

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

Shuning uchun yangi jadval kerak emas — `activity_sets.container_kind` toʻrtta qiymat oladi: `none` (kviz), `deck` (taqdimot), `video`, `passage` (matn+savollar). Bitta oqim, toʻrtta koʻrinish. ⚠️ **Tuzatildi (R145):** taqdimot ilgari `lesson` deb nomlangan va dars hujjatiga tenglashtirilgan edi — bu notoʻgʻri edi, pastdagi R144–R148 blokiga qarang.

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

**Aniqlashtirildi (R115, Wayground jonli koʻrigi):** hisobot **agregat** boʻlsin — standart holat bitta yashil qator (*"hamma oʻz oynasida"*), har bir oʻquvchini kuzatib turgan panel emas. Ogohlantirish oʻquvchiga koʻrsatilishi ham **sozlama**. "Oʻng tugmani oʻchirish" va "nusxalashni bloklash" — bular *ishqalanish*, *toʻsiq* emas; ayniqsa "AI ilovalarini toʻsadi" degan vaʼda **berilmaydi**.

**Saqlash qarori (R124):** belgi **savol darajasida** ham qiziqarli ("qaysi savolda chiqib ketdi" = qiyinlik signali), lekin u `session_participants.integrity jsonb` da yashaydi — **yangi jadval yoʻq**. Sabab uchta: bizga faqat agregat kerak; *urinilmagan* savolda ham bayroq boʻladi, demak `responses` ga sigʻmaydi; va u sessiya bilan birga **oʻlishi kerak** — bola haqidagi kuzatuv izi doimiy yozuvga aylanmaydi. Bahoga, oʻzlashtirishga, xulq ballariga hech qachon tegmaydi.

### 7. Longitudinal tahlil — bu allaqachon rejaning yadrosi

Wayground'ning *"barcha maʼlumot bitta bazada, uzoq muddatli oʻsish dinamikasi"* — bu aynan **bitta `responses` jadvali** qarorining maqsadi. Qoʻshimcha ish talab qilmaydi; u arxitekturaning natijasi.

### 8. Uy vazifasi sifatida yuborish — Shogird'ga bogʻliq

Wayground "taqdimotni darsdan keyin uy vazifasi qilib yuborish" deydi. Sxemada bu `mode: selfpaced` sessiya + muddat. Lekin **yuborish uchun oʻquvchi kanali kerak** — yaʼni bu **3-bosqichga (Shogird) bogʻliq**. Undan oldin uy vazifasi faqat havola/PIN orqali tarqatiladi (oʻqituvchi Telegram guruhiga tashlaydi) — bu ham ishlaydi va hech narsani bloklamaydi.

---

## B5. Kahoot va Blooket qoʻshgan narsalar

Savol turlari va oʻyin syujetlari allaqachon qamrab olingan (Quiz = `mcq`, True/False = `mcq` 2 variant, Type Answer = `text`+`exact`, Puzzle = `sequence`; Tower Defense/Gold Quest/Cafe/Battle Royale/Racing = `render_config`, jadval qoʻshilmaydi). Oltita haqiqiy yangilik.

### 1. Guruh rejimi — ⚠️ MODEL QAYTA YOZILDI (2026-07-29)

**Eski (notoʻgʻri) model:** Kahoot uslubi — bitta qurilma, 3–4 bola birga bosadi. Bunda `student_id = null` boʻlar edi va **individual maʼlumot yoʻqolardi**.

**Foydalanuvchi belgilagan TOʻGʻRI model:** har oʻquvchi **oʻz qurilmasida**, lekin guruhlarga birlashtirilgan.

> Misol: sinfda 10 ta kompyuter. Nodira opa havola yoki PIN beradi → oʻquvchilar kirishadi → opa tanlaydi: **hamma yakka** oʻynaydimi yoki **guruhlarga** boʻlinadimi. Guruh **tasodifiy/avtomatik yoki qoʻlda** tuziladi.

Uchta qulflangan qoida:

1. **Guruh sessiya boshida bir marta belgilanadi** — dars oʻrtasida oʻzgarmaydi.
2. **Har oʻquvchi oʻz savoliga oʻzi javob beradi.** Guruh bali = aʼzolar bali yigʻindisi.
3. Guruh **faqat reyting/ball qatlami** — javob egaligiga tegmaydi.

⭐ **Nega bu eskisidan yaxshi:** har javob **aniq oʻquvchiga** tegishli boʻlib qoladi. Demak:

| | Eski model | **Yangi model** |
|---|---|---|
| Sinf darajasidagi tahlil | ✅ | ✅ |
| **Individual natija** | ❌ yoʻqoladi | ✅ **saqlanadi** |
| **Jurnalga koʻchirish** | ❌ mumkin emas | ✅ **mumkin** |

Yaʼni guruh rejimi endi **hech narsa qurbon qilmaydi** — bola jamoa uchun oʻynaydi, lekin uning oʻz javobi baribir yoziladi.

**Sxemaga taʼsiri:** `session_participants.member_student_ids` semantikasi oʻzgaradi — u endi "bitta qurilmadagi N bola" emas. Har oʻquvchining **oʻz** `session_participants` qatori bor; guruh alohida obyekt:

```
session_teams(id, session_id, teacher_id, name, color)
session_participants.team_id → session_teams.id (nullable)
```

`member_student_ids` ustuni **olib tashlanadi** — kerak emas.

⚠️ Bitta qurilmani bir necha bola bilan boʻlishish (eski model) v1 da **qilinmaydi**. Agar keyin kerak boʻlsa — anonim ishtirokchi sifatida qoʻshiladi va oʻsha eski chegaralar qaytadi.

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

## Referens tekshiruvi natijalari

Bu boʻlim "Ish tartibi" qoidasi boʻyicha toʻldiriladi: har referens koʻrikdan keyin topilma **oʻsha zahoti** shu yerga yoziladi. Har topilmaning `R…` raqami bor — hujjatning boshqa joylarida shu raqamga havola qilinadi.

### Koʻrik holati (2026-07-29 holatiga)

| Referens | Nima koʻrildi | Topilmalar | Holat |
|---|---|---|---|
| **Wayground** — oʻqituvchi tomoni | savol muharriri, moslashuvlar, mem toʻplamlari, taqdimot muharriri, tur tanlagichi | R1–R31 | ✅ |
| **Wayground** — haqiqiy hisob | 18 resurs, 78 sessiya, hisobotlar, sinflar | R42–R51 | ✅ |
| **Wayground** — jonli dars/oʻyin | sozlamalar, lobbi, taqdimot rejimi, 5 jonli vosita, javob paneli, anti-cheating, podium, 2 DOM | R99–R118 | ✅ |
| **Wayground** — sessiya yakuni va hisobot | Session Summary, sinf grafigi, ishtirokchi KPI'lari, savol-darajali diqqat bayrogʻi | R119–R129 | ✅ |
| **Kahoot** — muharrir va bosh sahifa | landing, roʻyxatdan oʻtish, creator, mavzular | R32–R41 | ✅ |
| **Kahoot** — haqiqiy hisob va analitika | 90 hisobot, kutubxona, papkalar, savol tahlili | R52–R61 | ✅ |
| **Kahoot** — jonli oʻyin | rejim tanlash, lobbi, host, pleyer, sozlamalar, yakun | R89–R98 | ✅ |
| **Blooket** — muharrir | toʻplam yaratish, savol muharriri, formula, mavzular | R62–R70 | ✅ |
| **Blooket** — haqiqiy hisob va JSON model | 4 toʻplam (155 play), uy vazifasi, bosma, **sxema JSON'i** | R71–R76 | ✅ |
| **Blooket** — jonli oʻyin | rejimlar, lobbi, host, pleyer, Colyseus steki, market | R77–R88 | ✅ |
| **Pear Deck** | faqat matnli taʼrif (B3) | — | ⏳ skrinshot koʻrilmagan |
| **Wordwall** | faqat matnli taʼrif (B2) | — | ⏳ skrinshot koʻrilmagan |
| **classroomscreen.com** (Doska) | bosh sahifa, anonim ilova, 25 vidjet, chizish, "Edit widget bar", toʻliq DOM | R130–R143 | ✅ |
| **Wayground** — yaratish oqimi | Create menyusi, 5 resurs turi, taqdimot/test sahifalari, savol turlari galereyasi | R144–R148, R160–R174 | ✅ |
| **EMStudio** — haqiqiy hisob | Classwork, topshiriq muharriri, natija paneli, landing | R149–R159 | ✅ |
| **EMStudio** — toʻliq DOM | i18n yuklamasi, narx/sinov zinapoyasi, onboarding, toast inventari, jurnal jadvali | R175–R192 | ✅ |
| **EMStudio** — Classwork Topics | toifa modali, yakuniy baho shkalasi, jurnal jadvali | R193–R199 | ✅ |

**Rejalashtirilgan koʻriklar TUGADI.** Beshtadan toʻqqizta referensga koʻtarildi (Wayground · Kahoot · Blooket · classroomscreen · EMStudio) — 199 topilma. Pear Deck va Wordwall matnli taʼrifda qoladi: birinchisi B3 da toʻliq modellashtirilgan, ikkinchisi B2 da (shablonlar sxemani oʻzgartirmaydi, shuning uchun skrinshot qiymati past).

**Keyingi qadam — kodlash**, "Ish tartibi" qoidasi shart bajarilgan hisoblanadi. Kelgusi referens koʻrilsa `R203` dan davom etadi.

### Wayground (2026-07-29) — oʻqituvchi tomoni

Koʻrilgani: bosh sahifa va onboarding, kutubxona, savol muharriri (13+ tur), kviz sozlamalari, koʻrib chiqish (preview), sessiyalar/hisobotlar, oʻquvchilar va sinflar. Manba: skrinshotlar + `wayground.com/activity/admin/**` DOM/CSS.

**R1 — Sessiya holatlari 5 ta, 2 tasi bizda yoʻq edi.** Ularda: Running / Scheduled / Completed / Paused / All. `scheduled` (kelajakka rejalashtirilgan) va `paused` (vaqtincha toʻxtatilgan) bizning sxemada yoʻq edi. → B boʻlimidagi `quiz_sessions.state` toʻldirildi.

**R2 — Taklif ikki yoʻl bilan boradi:** muddatli havola (~14 kun, qayta generatsiya qilinadi) **va** qisqa sinf kodi. Bittasi ikkinchisining oʻrnini bosmaydi. → A boʻlimida `student_invites` aniqlashtirildi.

**R3 — Ota-ona aloqasi SINF darajasida yoqiladi**, har bolaga alohida emas: sinf yaratish modalida bitta belgilash — *"Require students to enter a guardian's email address / Share progress reports instantly"*. Bu bizning Shogird onboarding'i uchun eng qimmatli topilma. → A boʻlimiga `classes.require_guardian_contact` qoʻshildi (bizda **telefon**, email emas).

**R4 — "Classic Mode / Test Mode" toggle — sirt oʻqining amaliy isboti.** Bitta savol ikki xil chiziladi: Classic = katta rangli plitkalar (oʻyin/projektor), Test = oq fonda A/B/C/D roʻyxati + ovoz tugmasi (imtihon). Bu **alohida mahsulot emas, bir tugma**. C boʻlimdagi `data-surface` qarori shu bilan tashqi mahsulotda tasdiqlandi — komponent fork qilinmaydi, faqat sirt almashadi. Bizga tarjimasi: `stage` (projektor/oʻyin) ↔ `desk`/`handheld` (imtihon/oʻqish) bitta `activity` ustida.

**R5 — ⚠️ Hamkor-oʻqituvchi (co-teacher) bizning ijara modelini buzadi.** Ularda sinf menyusida "Add a co-teacher" bor (premium ortida). Bizda `teachers.id` — **yagona ijara kaliti**, sinf bitta oʻqituvchiga tegishli. Hamkor-oʻqituvchi koʻp-koʻpga jadval va **har bir DAL soʻrovida qamrov oʻzgarishini** talab qiladi. v1 dan aniq chiqariladi. → Ochiq masalalar №15.

**R6 — ⚠️ Audio/Video Response obyekt-saqlash talab qiladi → v1 dan tashqarida.** Ularda javob uzunligi tanlanadi (5s/10s/30s/1m/2m) + AI baholash. Bizda Vercel Blob **ataylab oʻchirilgan**, demak bu ikki tur `draw` kabi vektor hiylasi bilan ham qutulmaydi — haqiqiy fayl. → Ochiq masalalar №16. (`draw` esa shtrix sifatida saqlanadi, B3.6 — u qoladi.)

**R7 — `grading: none` boʻlsa ball UI'si umuman koʻrsatilmaydi.** Poll va Word Cloud'da ball selektori **kulrang, "0 point"** — oʻchirilgan, nol qilib qoʻyilgan emas. Bizda ham shunday: soʻrovnoma/soʻz buluti muharririda ball boshqaruvi render qilinmaydi (B5.2).

**R8 — Koʻrinuvchanlik 3 pogʻona** — Publicly visible / Restricted / Everyone in my organization. Bizning `activity_banks.visibility: private | school | public` bilan aynan mos, oʻzgarish kerak emas (B5.4).

**R9 — Ularning "Teaching goal" (Teach/Review/Practice/Other) bizning `purpose` EMAS.** Ularniki — ixtiyoriy metadata, filtr uchun. Bizniki — **majburiy va jurnal darvozasi** (`formative` hech qachon bahoga aylanmaydi, B boʻlim publish qadam 1–2). Ikkisini chalkashtirmaslik kerak: UI'da bizning maydon "Maqsad" deb ataladi va boʻsh qoldirilmaydi.

**Tasdiqlangan, oʻzgarish talab qilmaydi:** MCQ variantlari indeks boʻyicha qatʼiy rangda (kontentga bogʻliq emas); har variant alohida mini-muharrir (bizning `activity_items` bilan mos); "koʻp toʻgʻri javob" — alohida shakl emas, toggle (`mcq` bitta qoladi); formulalar uchun Σ va f(x) toolbar'da (bizda KaTeX allaqachon bor, B4.2); FIB boʻshligʻi matn ichida inline tugun (bizning KaTeX tugunimiz bilan bir xil naqsh); Draft → Publish darvozasi (`activities.approved`); savol turlari modali murakkablik boʻyicha guruhlangan (Basic / Interactive & higher order / Mathematics / Visual learning), alifbo boʻyicha emas — B2 dagi "Boshlangʻich toʻplam" shu guruhlashga moslanadi.

**Ataylab olinmaydi:** LMS integratsiyalari (Canvas, Schoology, Clever, Classlink, Moodle, Blackboard, D2L) — Oʻzbekistonda bu tizimlar amalda yoʻq; Google Classroom importi ham hozircha yoʻq (roadmap'da koʻrilsa boshqa masala). Standartlar bazasi (AP, shtat standartlari) — bizda DTS/DTM, oʻz manbamiz.

### Wayground (2026-07-29) — Moslashuvlar (Accommodations)

Bu bizda **umuman yoʻq boʻlgan quyi tizim** va rejadagi eng katta boʻshliq boʻlib chiqdi. Mohiyati: har bir sozlama **oʻquvchi boʻyicha alohida** beriladi (ekranda Sarah/Karan/Jackson roʻyxati, har biriga oʻz qiymati) — sinf boʻyicha yagona toggle emas.

Ularda 5 guruh: **Basic** (Extra Time, Participant Attempts, Read Aloud, Extended Deadline) · **Question Settings** (Hints, Redemption Question, Reduce Answer Choices, Speech To Text) · **Reading Support** (Dyslexia Font, Translate, Font Size, Bi-lingual Dictionary, Font Spacing, Reading Mode, Notes To Refer) · **Learning Environment** (Enhanced Display Mode, Don't Show Leaderboard, Turn Off Sound Effects) · **Math Tools** (Desmos Scientific/Graphing, Four Function Calculator).

**R10 — Moslashuvlar UCH sinfga boʻlinadi, va bu chegara sxemaga kiritilishi shart.** Ularda hammasi bitta roʻyxatda — bizda boʻlmaydi, chunki uchtasining **oʻlchovga taʼsiri butunlay boshqacha**:

| Sinf | Nima qiladi | Misollar | Oʻlchovga taʼsiri |
|---|---|---|---|
| **Koʻrinish** | Faqat chizish usuli oʻzgaradi | disleksiya shrifti, shrift oʻlchami/oraligʻi, oʻqish rejimi, ovoz bilan oʻqish, reyting koʻrsatilmasin, tovush oʻchirilsin | **Yoʻq.** Javob ham, tashxis ham oʻzgarmaydi |
| **Sharoit** | Vaqt/urinish oʻzgaradi, element oʻzgarmaydi | qoʻshimcha vaqt, urinishlar soni, muddat uzaytirish | **Yoʻq**, lekin halollik uchun javobda qayd etiladi |
| **Element** | Oʻquvchi koʻrgan narsa oʻzgaradi | variantlarni kamaytirish, ishora (hint), qutqaruv savoli | **BOR.** Javob `responses.accommodations` bilan belgilanadi va tashxisga kirmaydi |

Birinchi sinf bizda **deyarli bepul** — C boʻlimdagi `data-reading="support"` token qatlami aynan shu (B3.4). Yangilik faqat shundaki: u global sozlama emas, **oʻquvchi boʻyicha** saqlanadi va sessiya boshlanganda uning tokenlari yoqiladi.

**R11 — ⚠️ "Koʻp urinish" bizning UNIQUE cheklovimizni buzardi.** `responses` da `UNIQUE (participant_id, item_id, item_version)` bor edi — yaʼni bitta elementga bitta javob. Urinishlar soni sozlanadigan boʻlsa bu yiqiladi. → Sxemaga `attempt_no` qoʻshildi, UNIQUE kengaytirildi. Muhim savol qoldi: oʻzlashtirishga qaysi urinish kiradi? v1 da **birinchi urinish** (aks holda "ikkinchi martadan topdi" ham 100% boʻlib koʻrinadi va oʻzlashtirish maʼnosini yoʻqotadi).

**R12 — ⚠️ AI ishoralar (Hints) qulflangan falsafaga tegadi.** Ularda "AI Generated Hints on questions **during an activity**" — yaʼni AI oʻquvchi bilan bevosita muloqotda. `docs/ustozona-v1.md` §1.5: **AI oʻquvchiga tegmaydi**. Toʻqnashuv haqiqiy. Taklif: ishora **oldindan oʻqituvchi yozadi/tasdiqlaydi** (`activity_items.content.hint`), AI faqat oʻqituvchiga qoralama taklif qiladi — yaʼni mavjud `approved` darvozasi. Jonli generatsiya yoʻq. → Ochiq masalalar №17, Daisy koʻrigiga.

**R13 — ⚠️ "Variantlarni kamaytirish" tashxis signalini yoʻq qiladi.** 4 variantli MCQ 2 variantga tushsa, olib tashlangan distraktorlar aynan xato-tasavvurga bogʻlangan variantlar boʻlishi mumkin. Unda javob "toʻgʻri" chiqadi, lekin **nimani bilgani nomaʼlum**. Shuning uchun: bu moslashuv ruxsat etiladi (inklyuzivlik uchun kerak), lekin javob `responses.accommodations = ["reduceChoices"]` bilan belgilanadi va `misconceptions.ts` agregatidan **chiqarib tashlanadi**. Oʻzlashtirish hisobiga kiradi, tashxisga kirmaydi.

**R14 — Muddat uzaytirish ikki xil kiritiladi, natija bitta.** Kiritish: foiz bilan (25/50/75/100% koʻproq vaqt) **yoki** qatʼiy muddat (+1/+2/+3 kun). Chiqish: har oʻquvchi uchun **aniq sana** (Jan 2 / Jan 4 / Jan 5). Yaʼni bazada foiz saqlanmaydi — hisoblab, sanaga aylantirib saqlanadi. Bizda ham shunday: `student_accommodations.config = { dueAt: "..." }`, kiritish usuli faqat UI qulayligi.

**R15 — "Reyting koʻrsatilmasin" va "Tovush oʻchirilsin" — oʻyin qobigʻining ajratilganini isbotlaydi.** Oʻquvchi oʻyin elementlarisiz aynan shu baholashda qatnasha oladi va natija bir xil hisoblanadi. Bu bizning *"diagnostika = qiymat, oʻyin = qobiq"* qoidasining amaldagi koʻrinishi — qobiqni oʻquvchi boʻyicha oʻchirib qoʻyish mumkin boʻlishi kerak.

**Kalkulyator (Desmos)** — v1 da yoʻq. Uchinchi tomon embed, litsenziya va oflayn masalasi bor; bizning `number`/`mathEquiv` yoʻli buni talab qilmaydi. Keyingi bosqichda koʻriladi.

### Wayground (2026-07-29) — Mem toʻplamlari

⚠️ Bu birinchi koʻrikda "sof oʻyin qobigʻi, past ustuvorlik" deb notoʻgʻri baholangan edi. Aslida **fikr-mulohaza kanali** va qulflangan pedagogikaga tegadi.

**R16 — Mem = javobdan keyingi fikr-mulohaza, bezak emas.** Toʻplam **ikkita majburiy chelakdan** iborat: `Correct answer memes` va `Incorrect answer memes`, har biriga **kamida bitta** (UI'da `At least 1` belgisi bilan tekshiriladi). Yaʼni bu tasodifiy rasm emas — **javob toʻgʻri/notoʻgʻriligiga qarab tanlanadigan reaksiya**. Bu esa `docs/ustozona-v1.md` hududi: notoʻgʻri javobdan keyin nima koʻrsatilishi tuzatuvchi fikr-mulohaza bilan raqobatlashadi.

Bizning qaror: **notoʻgʻri javob memi masxara qilmaydi va tuzatishning oʻrnini bosmaydi.** Ketma-ketlik qatʼiy: (1) toʻgʻri javob va sabab → (2) undan keyin, ixtiyoriy ravishda, yumshoq mem. Aksi emas. Diagnostik (1-daraja) baholashda mem umuman koʻrsatilmaydi — u yerda ekran vaqti distraktor tahliliga tegishli. Takrorlash (2-daraja) mashqlarida ruxsat. Bu B5.6 dagi kolleksiya qoidasining aynan oʻzi. → Ochiq masalalar №20, Daisy koʻrigiga.

**R17 — Mem toʻplami saqlanadigan aktiv, `render_config` qiymati emas.** Uning oʻz nomi, egasi, koʻrinuvchanligi (Public/Private, standart — Private) va qayta ishlatilishi bor; sessiya faqat **unga havola qiladi**. → Sxemaga:
```
meme_sets(id, teacher_id, name, visibility, created_at, updated_at)
meme_items(id, set_id, teacher_id, bucket, url, source, created_at)
  → bucket: correct | incorrect        ← har ikkalasida ≥1 boʻlishi tekshiriladi
  → source: link | upload | search      ← R18 ga qarang
```
`quiz_sessions.render_config.memeSetId` — faqat havola.

**R18 — Koʻrinuvchanlik (`visibility`) bitta jadvalning xususiyati emas, kesib oʻtuvchi oʻq.** U ham savol banklarida (R8), ham mem toʻplamlarida bor — yaʼni **foydalanuvchi yaratgan har qanday aktiv** uchun. Bizda ham shunday boʻlsin: bitta umumiy zod sxemasi va bitta qoida (`private` standart), har jadvalda alohida ixtiro qilinmasin.

**R19 — ⚠️ Rasm manbai uch yoʻl, va uchalasi ham bizga masala tugʻdiradi.** Ularda: Google SafeSearch orqali qidirish · qurilmadan yuklash · **havola joylash** (+ Canva hamkorligi). Ustiga **kunlik kvota**: *"10 free images remaining today"*.

| Yoʻl | Bizdagi holat |
|---|---|
| Qidirish | Pullik tashqi API + **kunlik kvota** kerak. Bizda naqsh bor — `ai_usage` jadvali aynan shu maqsadda ishlaydi, kengaytiriladi. Lekin bu **yangi xarajat qatori**. |
| Yuklash | Obyekt-saqlash → **v1 da YOʻQ** (R6, №10, №16 bilan bitta qaror). |
| **Havola** | **v1 da yagona yoʻl.** Arzon, saqlashsiz — YouTube-only qaroridagi (B4.3) bir xil chiqish yoʻli. |

⚠️ **Moderatsiya majburiyati.** "SafeSearch" tasodifiy emas: bolalarga koʻrsatiladigan rasm ustidan javobgarlik bor. Mem toʻplami **public** boʻla olishi buni kuchaytiradi — matnli savolni moderatsiya qilish oson, rasmni esa yoʻq. Bu Ochiq masalalar №14 (umumiy baza moderatsiyasi) ni **kengaytiradi**: rasm boʻlgan har qanday umumiy kontent qoʻlda tasdiqdan oʻtmaguncha ommaga chiqmaydi. v1 da eng xavfsiz yoʻl — **mem toʻplamlari faqat `private`**, umumiy ulashish keyingi bosqichda.

**Kesish (crop) vositasi** — ular rasmni joylashdan oldin kesish imkonini beradi (`ImageCropper` komponenti). Bu bizga memdan koʻra `imagezone` (Hotspot/Labeling) uchun kerakroq: oʻqituvchi rasmni kesib, keyin zonalarni belgilaydi. 1d bosqichiga qoʻshiladi.

**Bizdagi ekvivalent:** `docs/illustrations.md` dagi mavjud illyustratsiya oilasi va Fluent 3D toʻplami (xulq domenida allaqachon ishlatilgan) — **tayyor, moderatsiyadan oʻtgan, saqlash talab qilmaydigan** manba. Yaʼni v1 da mem oʻrniga shu toʻplamdan reaksiya rasmi tanlanadi; oʻqituvchi oʻzinikini qoʻshishi — havola orqali.

### Wayground (2026-07-29) — Taqdimot (Lesson) muharriri

Bu B3.1 dagi *"slayd muharriri QURILMAYDI"* qaroriga bevosita tegadi. DOM oʻqilgandan keyin qaror **oʻz kuchida qoladi**, lekin nima yutib nima yoʻqotayotganimiz endi aniq yozilishi kerak.

**R20 — Ularning taqdimot muharriri erkin kanvas, hujjat emas.** DOM'da har element: `left / top / width / height / transform: rotate(…) / z-index` — mutlaq joylashuv. Ustiga: shakllar (`rectangle`, `ellipse`, `triangle`, `star`, `line_2d`, `arrow_2d`, `rounded_rectangle` — SVG `<use>`), jadval (qator×ustun), har elementga alohida Tiptap, `Order` menyusi (oldinga/orqaga surish), ~17 Google shrifti va 8–32px oʻlcham tanlagichi.

Bizning dars hujjati esa **oqim hujjati** (flow) — Tiptap, A4 sahifa. Bu ikki maʼlumot modeli tubdan boshqacha. Demak halol taqqoslash:

| Yoʻqotamiz | Yutamiz |
|---|---|
| Erkin joylashuv, aylantirish, qatlam tartibi | **Bitta kontent manbai** — dars bir marta yoziladi, ham A4 chop etiladi, ham projektorga chiqadi |
| Shakl/jadval/erkin shrift | Ikkinchi muharrir qurilmaydi va **saqlanmaydi** |
| Shablon maketlar (sarlavha slaydi, matn+media) | 1280×720 kanvas dvigateli, sudrash/oʻlcham/burchak tutqichlari, z-tartib boshqaruvi — hech biri kerak emas |
| Mavzuni "hammasiga qoʻllash" | Kichik ekranda ishlaydi — R21 ga qarang |

**R21 — ⚠️ Ularning muharriri kichik ekranni RAD ETADI.** Modal: *"The lessons editor is not designed to work on smaller screens"* → "Use anyway / Go back". Bu tasodifiy emas: erkin kanvas katta ekran talab qiladi. Oʻzbekistonda oʻqituvchi koʻpincha telefon yoki kichik noutbukda ishlaydi — bizning oqim hujjati u yerda ham ochiladi. **Bu B3.1 qarorining eng kuchli dalili** va u faqat haqiqiy referensga qarab topildi.

**R22 — Taqdimotchi qaydlari (slide notes) — arzon, qimmatli, olinadi.** Har slayd ostida: *"Add presenter notes for this slide (optional). Only you can see them."* Bizda bu **ikki sirt ajratilishining ikkinchi ishlatilishi** (B3.3): `desk` da oʻqituvchi qaydni koʻradi, `stage` da projektor koʻrmaydi. Xuddi anonim proyeksiyadagi kabi — `stage` DAL funksiyasi qayd maydonini **umuman qaytarmaydi**. Amalda: dars hujjatidagi sahifa darajasida `notes` maydoni.

**R23 — "Find questions" — yon panel, modal emas.** Oʻng ustunda doimiy panel: mavzu boʻyicha qidiruv + tavsiya qilingan savollarni joriy joyga qoʻshish. Bizning `interactivePrompt` tugunini darsga qoʻshish UI'si aynan shu naqshda boʻladi — modal ochilib yopilmaydi, chunki oʻqituvchi ketma-ket bir nechta prompt qoʻshadi.

**R24 — Slaydning oʻzi faoliyat boʻla oladi.** "Add" menyusi: Slide · **Question** · **Interactive Video** · **Passage** · **Website Link**. Birinchi uchtasi bizda allaqachon bor (`activity_sets.container_kind = deck` + `interactivePrompt`; `Passage` esa R146 bilan `container_kind = passage` boʻlib alohida qiymat oldi). Toʻrtinchisi — **veb-embed** (ikonkada PhET va Desmos) — bizda yoʻq. PhET simulyatsiyalari fizika/kimyo uchun juda qimmatli va bepul. → Ochiq masalalar №22.

**R25 — Sahna oʻlchamini moslash usuli: qatʼiy 1280×720 + `transform: scale()`.** Kanvas doim 1280×720 chiziladi, keyin konteynerga sigʻdirish uchun butunicha masshtablanadi (`scale(0.617)`). Bizga ham kerak: A4 dars sahifasi `stage` rejimida shu tarzda moslanadi — ichki oʻlchamlarni qayta hisoblash emas, butun sahifani masshtablash. Bu C boʻlimdagi `data-surface="stage"` bilan ziddiyatsiz: sirt tokenlari **oʻqish** uchun, `scale()` esa **sigʻdirish** uchun.

**Olinmaydi:** shrift tanlagichi (bizda DM Sans + JetBrains Mono, dizayn tizimi qoidasi — B3 boʻlimidagi "yopiq toʻplam"ni buzadi); erkin shakl/jadval qoʻyish; slayd shablon galereyasi (ular stok fotolar bilan keladi — R19 dagi rasm manbai masalasi yana chiqadi). **PPT/PDF import → AI savol generatsiyasi** — bizda `ai_docs` allaqachon bor, quvur tayyor; PPTX parseri esa B5.3 da rad etilgan (AI orqali, parser bilan emas).

### Wayground (2026-07-29) — Savol turi tanlagichi va baholash belgilari

"Add Question" galereyasi har turga **hover-koʻrinish** va **belgilar** koʻrsatadi. Bu B4.2 dagi `grading` oʻqi qarorining eng toʻliq tasdigʻi — ular baholash usulini foydalanuvchiga **koʻrinadigan yorliq** qilib chiqargan.

**R26 — ⚠️ "Qisman baholash" (partial grading) bizda yoʻq edi — sxema boʻshligʻi.** Ularning belgilari toʻrt sinf:

| Belgi | Qaysi turlarda | Bizdagi holat |
|---|---|---|
| `AUTO GRADED` | MCQ, Fill-in-blanks, Graphing, Math response, Hotspot | `exact` / `numeric` / `mathEquiv` — bor |
| **`PARTIAL GRADING`** | Drag&drop, Dropdown, **Categorize, Reorder, Match, Hot text, Match Table Grid, Labelling** | **YOʻQ edi** |
| `EVALUATION WITH AI` | Open ended, Audio response | `aiDraft` — bor |
| `FLEXIBLE GRADING` | Draw, Video response | `manual` / `cj` — bor |
| `UNGRADED` | Poll, Word cloud | `none` — bor (R29) |

Nega bu muhim: bizning "har element = bitta `responses` qatori" qoidasi `pairs`/`categories`/`sequence` uchun ishlaydi (har juftlik/element alohida qator → 4 tadan 3 tasi toʻgʻri = 75% tabiiy chiqadi). Lekin **bir elementning ichida bir nechta kichik javob** boʻladigan shakllar bor: `hottext` (matndagi N token), `imagezone` label rejimi (N yorliq), matchgrid (N×M katakcha), koʻp boʻshliqli `cloze`. Bularda `is_correct` boolean **maʼlumotni yoʻqotadi** — 4 tokendan 3 tasi toʻgʻri boʻlsa ham "notoʻgʻri" boʻlib yozilardi.

→ Sxemaga `responses.score` (0..1) qoʻshildi, `grading` ga `partial` qiymati qoʻshildi. **Muhim chegara:** `is_correct = (score = 1)` boʻlib qoladi va **oʻzlashtirish/tashxis faqat `is_correct` ga qaraydi** — chunki `docs/ustozona-v1.md` dagi ≥75% mezoni "bilaman/bilmayman" ustiga qurilgan, qisman ball ustiga emas. `score` esa jurnalga koʻchirishda ishlatiladi. Ikkalasi ham saqlanadi, chalkashmasin.

**R27 — Tanlagichda "Student preview" — arzon va juda tushunarli.** Har turning ustiga borilganda kichik animatsiyali namuna chiqadi: oʻquvchi buni qanday koʻradi va nima qiladi (masalan Hotspot — sonlar oʻqidagi nuqtalar; Match Table Grid — qator×ustun katakchalari; Categorize — rangli chelaklarga sudrash). Bizda 11 shakl + shablonlar boʻlgani uchun bu **ayniqsa kerak** — oʻqituvchi "Hot text" nima ekanini nomidan tushunmaydi. B2 dagi shablon reyestriga `previewComponent` maydoni qoʻshiladi (kichik, statik, sof CSS/`motion`).

**R28 — Bepul/pullik chizigʻi — biznes uchun maʼlumot.** 20 turdan 12 tasi `PREMIUM`. Bepul qolganlari: MCQ, Fill-in-the-blanks, Open ended, Draw, Poll, Word cloud — yaʼni **asosiylari**. Pullik: barcha sudrash-asosli va yuqori-tartibli turlar (Match, Categorize, Reorder, Hot text, Match Table Grid, Labelling, Hotspot, Graphing, Math response, Video response, Drag&drop, Dropdown).

Bu bizga toʻgʻridan-toʻgʻri koʻchmaydi — bizning falsafamiz diagnostikani markazga qoʻyadi va MCQ aynan diagnostik yadro (bepul boʻlishi shart). Lekin `teachers.plan` mavjud boʻlgani uchun yozib qoʻyiladi: **sudrash-asosli shakllar (`DragBoard` oilasi) tabiiy pullik chegara** — ular eng koʻp muhandislik talab qiladi va diagnostikaga eng kam hissa qoʻshadi (B2 dagi 2-daraja). Qaror monetizatsiya bosqichiga qoldiriladi.

**R29 — Belgilar bir-birini istisno qilmaydi: uchta MUSTAQIL oʻq.** Audio response'da bir vaqtda uchtasi turadi — `PREMIUM` + `EVALUATION WITH AI` + `STUDENT PREVIEW`; Poll'da esa `UNGRADED` + `STUDENT PREVIEW`. Yaʼni bu bitta enum emas:

| Oʻq | Qiymatlar | Bizda qayerda yashaydi |
|---|---|---|
| **Baholash usuli** | AutoGraded / PartialGrading / EvaluationWithAI / FlexibleGrading / **Ungraded** | `activities.grading` (B4.2) — `none` ayni `UNGRADED` |
| **Tarif** | Bepul / `PREMIUM` | shablon reyestrida `plan: "free" \| "pro"` (R28, monetizatsiyaga qoldirildi) |
| **Namuna bormi** | `STUDENT PREVIEW` bor/yoʻq | shablon reyestrida `previewComponent?` (R27) — ixtiyoriy maydon |

Amaliy natija: R26 jadvalini "har turga bitta belgi" deb oʻqimaslik kerak. Reyestrda uchala maydon alohida boʻladi va tanlagich UI'si ularni birga chiqaradi. Beshinchi qiymat `UNGRADED` bizda allaqachon bor (`grading: none`, B5.2) — yangi ish emas, lekin **tanlagichda koʻrinishi shart**, aks holda oʻqituvchi soʻrovnomani baholanadigan savol deb oʻylaydi.

**R30 — ⚠️ Audio response'ni AI baholaydi — bu R6 dagidan tashqari IKKINCHI toʻsiq.** R6 da faqat saqlash masalasi yozilgan edi (Vercel Blob yoʻq). Lekin `EVALUATION WITH AI` belgisi shuni koʻrsatadiki, ovozli javob zanjiri **nutqni matnga oʻgirish (STT)** ni ham talab qiladi. Uchta alohida muammo:

1. **Oʻzbekcha STT sifati** — bu TTS masalasining (Ochiq masalalar №8) teskari tomoni va u ham hal qilinmagan.
2. **Maxfiylik** — oʻquvchi **ovozi** tashqi xizmatga ketadi. Bu matn yuborishdan jiddiyroq: ovoz biometrik maʼlumot. `docs/ustozona-v1.md` §1.5 ("AI oʻquvchiga tegmaydi") bevosita buni taqiqlamaydi (AI oʻquvchiga javob qaytarmaydi, faqat oʻqituvchiga qoralama beradi), lekin ruxsat masalasi baribir qoladi.
3. **Xarajat** — audio saqlash + STT + AI baholash, uchalasi ham element boshiga pul.

→ Ochiq masalalar №16 shu uch nuqta bilan kengaytirildi. Xulosa oʻzgarmaydi: **v1 dan tashqarida**, lekin sabab endi bitta emas, uchta.

**R31 — Poll va Word cloud namunalari `stage` sirtida chizilgan.** Ikkalasining hover-namunasi ham toʻq fon + juda katta harflar — yaʼni ular **oʻqituvchi ekranida emas, sinf ekranida** yashaydigan turlar. Bu B5.2 dagi "Doska Poll vidjeti = Baholash soʻrovnomasi" birlashuvini tasdiqlaydi. Ikkita aniq render qoidasi olinadi:

- **Soʻrovnoma** — variantlar katta rangli kartalar sifatida, har biriga bitta rang (bizda `makeColorTints` dvigateli bor, C boʻlim).
- **Soʻz buluti** — chastota **ikki kanal bilan** koʻrsatiladi: shrift oʻlchami **va** xiralik (namunada eng kam uchragan soʻz xira kulrang). Faqat oʻlcham bilan qilingan bulut proyektorda oʻqilmaydi — bu 5 metrdan koʻriladigan ekran uchun aniq foyda.

### Kahoot (2026-07-29) — kirish, bosh sahifa va savol muharriri

Koʻrilgani: kahoot.com landing · kahoot.it qoʻshilish sahifasi · roʻyxatdan oʻtish (rol tanlash) · oʻqituvchi bosh sahifasi · `create.kahoot.it/creator` muharriri toʻliq DOM bilan · savol turi roʻyxati · Time limit / Points / Answer options dropdownlari · Add paneli · Themes paneli.

**R32 — ⚠️⚠️ "Accuracy mode" bizning eng qatʼiy qoidamizni SOTUVCHI TASDIQLAYDI.** Oʻqituvchi bosh sahifasidagi "Teacher Toolbar"da birinchi karta: *"Accuracy mode — Encourage correct answers over speed"*. Yaʼni bozor yetakchisi tezlikni ballashdan chiqaradigan rejimni alohida imkoniyat qilib chiqargan.

Bu B boʻlimdagi `elapsed_ms` qarorining (ballash funksiyasining **tipiga** kirmaydi) eng kuchli tashqi dalili — bizniki gʻalati emas, pedagogik jihatdan yetuk tanlov. Bitta muhim farq bor va u yozib qoʻyilishi kerak:

| | Kahoot | Ustozona |
|---|---|---|
| Tezliksiz ballash | **Rejim** — yoqiladi/oʻchiriladi | **Yagona xulq** — boshqa varianti yoʻq |
| Standart holat | tezlik ballga kiradi | tezlik hech qachon kirmaydi |

Yaʼni ular uchun bu sozlama, biz uchun invariant. Sozlamaga aylantirish taklifi kelsa — rad etiladi: bir marta yoqilsa, oʻsha sessiyaning javoblari boshqa sessiyalar bilan taqqoslanmaydigan boʻlib qoladi va uzunlamasiga tahlil (B4.7) buziladi.

**R33 — ⚠️ Har savolga ball koeffitsiyenti bor (Standard / Double points / No points) — bu bizning qulflangan baho modelimizga tegadi.** `docs/grades-v1-spec.md` da qaror qulflangan: **foizga normalizatsiya, faqat toifa vazni, har topshiriqqa koeffitsiyent YOʻQ**. Kahoot esa har savolga koeffitsiyent beradi.

Yechim — qarama-qarshilik emas, ikki daftar ajratilishi:

```
render_config.pointsMultiplier: { [itemId]: 0 | 1 | 2 }   ← OʻYIN reytingi uchun
responses.score / is_correct                              ← OʻLCHOV daftari uchun
```

Yaʼni "Ikki barobar ball" oʻyin reytingini oʻzgartiradi (qobiq), lekin jurnalga koʻchirishda **hech qanday taʼsiri yoʻq** — u yerda baribir foizga normalizatsiya ishlaydi. Bu `elapsed_ms` va `game_state` (B5.5) bilan bitta qoidaning uchinchi qoʻllanishi: **oʻyin qatlami maʼlumot oladi, lekin unga yozmaydi**. "No points" esa alohida tur emas — `pointsMultiplier: 0`.

**R34 — Savol turi tanlagichi MAQSAD boʻyicha guruhlangan, shakl boʻyicha emas.** Uch guruh: **Test knowledge** (Quiz, True or false, Type answer, Slider, Pin answer, Puzzle) · **Collect opinions** (Poll, Scale, NPS scale, Drop pin, Word cloud, Open-ended, Brainstorm) · **Present info** (Slide + 6 ta media-slayd tartibi).

Bu Wayground'ning belgili roʻyxatidan (R26) **yaxshiroq** va bizga toʻgʻri keladi, chunki birinchi ikki guruh aynan bizning `grading` oʻqimizning ikki tomoni: baholanadigan va `none`. Bizning tanlagichimiz shu tarzda guruhlanadi — 11 shakl nomi boʻyicha emas (oʻqituvchi "hottext" nima ekanini bilmaydi, R27).

Qoʻshimcha: qoʻshish paneli **toʻrt tabli** — `Add · Find · Generate · Import`. Toʻrttasi ham bizda rejalashtirilgan (yangi element · bankdan qidirish R23 · AI B4.4 · Excel/CSV B5.3), lekin **bitta panelda birlashtirilishi** yangi maʼlumot: oʻqituvchi "savol qoʻshaman" deb bitta joyga boradi, toʻrt xil tugma qidirmaydi.

**R35 — Ularning "yangi" turlari bizda render varianti, yangi shakl emas.** Sxema oʻzgarmaydi:

| Kahoot | Ustozona | Izoh |
|---|---|---|
| Slider | `number` | surgichli kiritish varianti |
| Pin answer | `imagezone` `mode: click` | bor |
| **Drop pin** | `imagezone` + `grading: none` | rasmda fikr yigʻish — shakl⊥baholash oʻqining yana bir isboti |
| Scale (1–5) | `mcq` tartiblangan + `grading: none` | Likert; refleksiya uchun juda foydali |
| NPS scale (0–10) | `mcq` tartiblangan + `grading: none` | biznesga xos, bizga kerak emas |
| Type answer | `text` + `exact` | bor |
| Puzzle | `sequence` | bor |

**Drop pin eng qimmatli qator:** bir xil shakl (`imagezone`) baholanadigan (Pin answer) ham, baholanmaydigan (Drop pin) ham boʻla oladi. Ular buni ikkita alohida tur qilib chiqargan — biz bitta shakl + bitta bayroq bilan qilamiz.

**R36 — ⚠️ "Brainstorm" bizda yoʻq va u haqiqatan yangi: IKKI FAZALI faoliyat.** Boshqa hamma turlar bir fazali (savol → javob). Brainstorm: (1) hamma gʻoya yozadi → (2) gʻoyalar guruhlanadi/ovoz beriladi/saralanadi. Ikkinchi faza bizning `responses` modeliga tushmaydi, chunki u **javob emas, javoblar ustidagi amal**.

Qiziq tomoni: bizda buning uchun **dvigatel allaqachon bor** — `cj_judgements` + [`cj-ranking.ts`](src/lib/cj-ranking.ts) aynan "javoblar toʻplamini juftlab taqqoslab tartiblash" ishini qiladi. Yaʼni Brainstorm = `text` + `grading: none` (1-faza) + CJ-lite (2-faza). Lekin CJ hozir **oʻqituvchi qiyoslaydi** deb qurilgan, bu yerda esa **oʻquvchilar** ovoz beradi — bu boshqa ruxsat modeli. → Ochiq masalalar №23. v1: faqat 1-faza (soʻz buluti/gʻoyalar roʻyxati).

**R37 — Media-slaydlar (6 tartib) — bizning konteyner qaroriga oyna.** Ularda `Slide` savol turi va uning 6 tartibi bor: Classic · Big title · Title and text · Bullet points · Quote · Big media. Yaʼni **kviz konteyner, slayd uning ichida**. Bizda esa teskari (B3.1): **dars hujjati konteyner, savol uning ichida**.

Ikkalasi ham `activity_sets.container_kind` bilan ifodalanadi (`none` vs `deck`) — sxema oʻzgarmaydi. ⭐ **R163 bilan yakuniy tasdiq:** rollar (entry/check/exit) faqat `deck`da maʼnoga ega — `none` (test) da barcha element teng, "bu darsning yoʻli" degan tushuncha yoʻq. Va ularning 6 tartibi bizga **kerak emas**: "Big title", "Bullet points", "Quote" — bular Tiptap dars hujjatida allaqachon oddiy sarlavha, roʻyxat va iqtibos bloklari. Yaʼni biz bu 6 komponentni yozmaymiz, chunki matn muharririmiz ularni tabiiy beradi. Bu B3.1 qarorining ikkinchi dividendi (birinchisi R21 edi).

**R38 — Mavzular (Themes): 20 ta rangli mavzu — bu 20 ta aktiv emas, bitta RANG URUGʻI.** Roʻyxat: Dark · Dark blue · Dark green · Dark purple · Dark burgundy · Dark red · Yellow · Orange · Red · Green · Purple · Blue · Light · Light brown · Light orange · Light yellow · Light green · Light blue · Light purple. Yaʼni **{rang, ochiq/toʻq}** koʻpaytmasi, qoʻlda chizilgan 20 dizayn emas.

Bizda buning dvigateli tayyor — `makeColorTints` OKLCH funksiyasi (C boʻlim, sinf/mavzu ranglari uchun ishlatiladi). Shuning uchun:

```
render_config.theme: { seed: "<oklch hue>", mode: "light" | "dark" }
```

20 ta CSS fayl emas, ikkita maydon. Faqat fon-rasmli mavsumiy mavzular (Spring/Summer/…) rasm talab qiladi — ular `data-product` palitrasi ustidagi ixtiyoriy qatlam, v1 da shart emas. "Your themes" (oʻz mavzusini yuklash) esa obyekt-saqlash talab qiladi → oʻsha bitta Blob qarori (Ochiq masalalar №10/16/19).

**R39 — Qoʻshilish sahifasi minimal, lekin URL'da `deviceId` bor.** `kahoot.it/?deviceId=…&sessionId=…` — sahifada faqat logo, `Game PIN` va `Enter`. Bu bizning `/play` qarorimizni tasdiqlaydi (auth yoʻq, redirect yoʻq, minimal bundle — F boʻlimidagi sekin tarmoq talabi).

⚠️ Bitta farqni ataylab qilamiz: **qurilma identifikatorini URL'ga qoʻymaymiz.** URL nusxalanadi, tarixda qoladi, Telegram guruhiga tashlanadi. Bizning ishtirokchi tokeni `localStorage`da qoladi (A boʻlim), URL'da faqat PIN boʻladi.

**R40 — Roʻyxatdan oʻtishda rol BIR MARTA soʻraladi, kelib chiqarilmaydi.** Ikki qadam: `Teacher / Professional / Student / Family and friends` → soʻng `School / Higher education / School administration / Business / Other`. Diqqat: **Student — birinchi darajali akkaunt turi**, keyin qoʻshilgan narsa emas.

Bizda hozir hamma `requireTeacher()` orqali oʻtadi (0-bosqichda rol darvozasi qoʻyildi). 3-bosqichda (Shogird) oʻquvchi/ota-ona akkaunti paydo boʻlganda **shu tanlov roʻyxatdan oʻtish oqimiga qoʻshilishi shart** — aks holda oʻquvchi kirib oʻqituvchi paneliga tushadi. Ikkinchi qadam (muassasa turi) bizga hozir kerak emas, lekin Boshqaruv bosqichida oʻqituvchi↔maktab bogʻlanishining tabiiy boshlanishi (Ochiq masalalar №4).

**R41 — Muharrirning maketi va uchta arzon koʻchma detal.** Uch panel: chapda bloklar roʻyxati (sudrab tartiblash, har blokda nusxalash/oʻchirish), oʻrtada savol kanvasi, oʻngda "Question properties" + doimiy vertikal ikonka reyki (Themes / Properties / Help). Bu bizning `DashboardColumns` primitivimizga toʻgʻri tushadi. DOM'dan olingan uchta aniq detal:

1. **Panel kengliklari CSS oʻzgaruvchisi** — `<body style="--creator-right-sidebar-width: 289px">`. Bizda ham panel kengligi tokendan olinsa, sirt oʻqi (C boʻlim) uni avtomatik moslaydi.
2. **Toʻgʻri javob tugmasi `role="switch"` + `aria-checked`**, yoniga koʻrinmas matn: *"This is marked as a wrong answer"*. Bizning javob muharririmizda ham shunday boʻladi — rang bilan belgilangan holat ekran oʻqigichga koʻrinmaydi, bu arzon va aniq tuzatish.
3. **"Jump to main content" oʻtkazib yuborish tugmasi** — uch panelli muharrirda klaviatura bilan ishlash uchun. Bizda dars muharriri va Baholash muharriri ikkalasiga ham tegishli.

**Olinmaydi:** oʻyin ichidagi kolleksiya/Kahootopia ekotizimi (B5.6 dagi qaror allaqachon chegaralagan); NPS scale; PPT importi (B5.3 da rad etilgan); ularning `Groups` boʻlimi (bizda sinf allaqachon shu).

### Wayground (2026-07-29) — HAQIQIY hisob, haqiqiy maʼlumot bilan

Bu partiya boshqalaridan farq qiladi: bu marketing demosi emas, **bir yil ishlatilgan oʻzbek informatika oʻqituvchisining hisobi** — 18 ta yaratilgan resurs, 78 ta sessiya, 8 sahifa hisobot, haqiqiy oʻquvchi ismlari va ballari. Shuning uchun bu yerdan chiqadigan xulosalar "ular shunday qilgan" emas, **"amalda shunday boʻlgan"**.

**R42 — Ish birligi KVIZ EMAS, DARS.** 18 resursning hammasi `Presentation` turida, har biri **19–29 slayd**. Nomlash naqshi izchil: `02. Raqamli xavfsizlik va himoya (9-sinf)` · `01. Tarmoq asoslari va turlari (8-sinf)` · `1-dars. Informatika (7-sinf)` — yaʼni **tartib raqami + mavzu + sinf**. Bitta ham mustaqil "kviz" yoʻq.

⚠️ **Bu xulosa R144/R145 bilan qayta koʻrib chiqildi.** Avval bu yerda "`container_kind = lesson` standart kirish nuqtasi boʻlishi kerak, menyu 'Yangi dars' deb boshlanadi" deb yozilgan edi. Wayground'ning haqiqiy yaratish oqimi (R144) buni **rad etdi**: "Create" bosilganda besh resurs turi (Assessment/Presentation/Video/Passage/Flashcards) **teng darajada** tanlanadi, birortasi ustuvor emas. Va R145: taqdimot (`Presentation`) — **Baholash ichidagi resurs turi**, dars rejasi emas. Toʻgʻri xulosa qoladi: haqiqiy oʻqituvchi kviz emas, **rolli toʻplam** (taqdimot yoki test) quradi — lekin bu dars hujjatiga bogʻlanish orqali emas, mustaqil `deck` konteyneri orqali.

**R43 — ⚠️⚠️⚠️ ENG MUHIM TOPILMA: 78 sessiyaning HAMMASIDA "Class" ustuni BOʻSH.** Va `Students → My classes` sahifasida 13 ta sinf yaratilgan — **har birida 0 oʻquvchi**. Har kartada ularning oʻz eʼtirofi turibdi: *"Add students to get class level insights"*.

Yaʼni bir yil davomida 78 marta baholash oʻtkazilgan, lekin **bironta ham javob aniq oʻquvchiga bogʻlanmagan**. Natija:

| Nimaga ega boʻlingan | Nima yoʻqolgan |
|---|---|
| Har sessiya uchun aniqlik foizi | Oʻquvchi boʻyicha oʻzlashtirish (`mastery`) |
| Sinf darajasidagi savol tahlili | Unutilish/takrorlash signali (`decay`) |
| Bir martalik hisobot | Uzunlamasiga oʻsish, jurnalga koʻchirish |

Bu bizning butun tahlil dvigatelimiz uchun ekzistensial ogohlantirish: `mastery.ts`, `decay.ts`, `misconceptions.ts` — uchalasi ham `responses.student_id` **null emasligiga** tayanadi. Agar qoʻshilish standart holda anonim boʻlsa, dvigatel ishga tushmaydi va mahsulot "chiroyli hisobot" darajasiga tushadi.

**Nega bizda boshqacha boʻladi (va bu bizning tarkibiy ustunligimiz):**

Wayground uchun roʻyxatni toʻldirish — **qoʻshimcha ish**, shuning uchun hech kim qilmagan. Ustozona uchun roʻyxat **allaqachon bor** — oʻquvchilar, davomat, baholar, xulq bir yildan beri kiritilgan. Yaʼni bizda ishtirokchi↔oʻquvchi bogʻlanishi **bepul**, ularda esa imkonsiz.

Shundan uch qatʼiy qaror:

1. **Sessiya sinfsiz boshlanmaydi.** `quiz_sessions.class_id` sxemada allaqachon bor — endi u UI oqimida **majburiy birinchi qadam** boʻladi, ixtiyoriy filtr emas.
2. **Anonim qoʻshilish — istisno, standart emas.** Ishtirokchi qoʻshilganda roʻyxatdan oʻz ismini tanlaydi (PIN + ism yozish emas). Ism yozish faqat sinfdan tashqari holatlar uchun qoladi.
3. **QR-karta va OMR yoʻlining ustunligi endi ancha kuchliroq asoslangan** (1-bosqich): u yerda `student_id` **tuzilma boʻyicha** toʻladi — karta roʻyxat bogʻlovchisi, blanka esa oʻquvchi ID zonasiga ega. Yaʼni "qogʻoz birinchi" qarori tezlik masalasi emas edi — u aslida **tahlil dvigatelini oziqlantiradigan yagona kafolatlangan yoʻl**.

**R44 — "Points" va "Score" ularning oʻz UI'sida IKKI ALOHIDA USTUN — va zarari haqiqiy maʼlumotda koʻrinib turibdi.** Ishtirokchilar jadvalida: `Points 17/19` (toʻgʻri javoblar) va `Score 15060` (oʻyin bali) yonma-yon. Haqiqiy raqamlar:

| Oʻquvchi | Points | Score | Xulosa |
|---|---|---|---|
| marjona | 12/12 (100%) | 9 960 | **Uchalasi ham hamma savolga toʻgʻri javob bergan.** |
| safarovahulkaroy | 12/12 (100%) | **10 930** | Yagona farq — tezlik. |
| shahnoza | 12/12 (100%) | 10 400 | Reytingda esa uchta har xil oʻrin. |
| Ogiloy | 9/12 (75%) | 6 790 | Bir xil bilim, |
| aslbek | 9/12 (75%) | **8 120** | 1330 ball farq. |

Diqqat: bu **uy vazifasi** (`Assigned quiz`), jonli musobaqa emas. Yaʼni tezlik bali uyda, yolgʻiz ishlaganda ham reytingni oʻzgartirgan.

Bu R33 dagi ikki daftar qoidasining amaliy isboti. Bizda `Score` ustuni **umuman boʻlmaydi** — `elapsed_ms` ballash funksiyasining tipiga kirmaydi (B boʻlim). Agar bir kun oʻyin reytingi koʻrsatilsa, u **alohida va aniq belgilangan** boʻladi: "oʻyin reytingi", "natija" emas.

Yana bitta maʼlumot: `Questions 11`, lekin `Points Out of 12` — yaʼni savol soni ≠ ball soni, demak ularda ham koeffitsiyent haqiqatda ishlatilgan (R33).

**R45 — Hisobotning asosiy ekrani — ishtirokchi × savol MATRITSASI, va ustun sarlavhasidagi foiz aynan bizning tashxis ekranimiz.** Jadval: qatorda oʻquvchi, ustunda `Q2 … Q19`, katakda ✓/✗ (yashil/qizil fon). Ustun sarlavhasida **shu savolning sinf boʻyicha foizi rangli belgi bilan**: `Q2 25%` qizil · `Q4 0%` qizil · `Q6 75%` sariq · `Q3 100%` yashil.

`Q4 0%` — butun sinf xato qilgan savol, bir qarashda koʻrinadi. Bu bizning `classMisconceptions()` funksiyasining (≥30% chegara) tabiiy vizual shakli. Yaʼni tahlil ekranini ixtiro qilish shart emas:

- **Qator** = oʻquvchi (Points + foiz)
- **Ustun** = element, sarlavhada sinf foizi + rang tasmasi (bizda `score-colors` allaqachon bor)
- **Katak** = ✓/✗ (bizda `score` boʻlgani uchun qisman ham koʻrsatiladi, R26)
- Saralash: aniqlik boʻyicha

Ishtirokchilar tabida esa har oʻquvchi uchun **tartib boʻyicha yashil/qizil kvadratchalar tasmasi** (`✓15 ✗4`) — bu "qayerda qoqildi" ni ketma-ketlikda koʻrsatadi va juda arzon komponent.

**R46 — Dars PEDAGOGIK TUZILMAGA ega, u shunchaki slaydlar toʻplami emas.** Resurs sahifasida: *"This lesson contains: **Entry Ticket** · 15 Slides · **Checks for understanding** · **1 Vocabulary question** · **Exit Ticket**"*.

Bu bizda yoʻq va u **tahlil uchun muhim**: hozirgi modelda dars ichidagi har bir prompt bir xil vaznda. Holbuki "chiqish chiptasi" (exit ticket) — darsning **yakuniy signali**, "tushunish tekshiruvi" esa oraliq. Ularsiz *"bugungi darsni tushunishdimi?"* degan savolga javob bermaydi.

→ `activity_sets.activity_ids` roʻyxati oddiy id massivi emas, **rolli roʻyxat** boʻladi:

```
activity_sets.items jsonb: [{ activityId, role }]
  → role: entry | check | vocabulary | practice | exit
  → `exit` = dars yakuni signali; dars xulosasi HERO ekrani (ustozona-v1.md §6) shunga qaraydi
```

Denormalizatsiya hozir qilinmaydi (`responses` ga `role` koʻchirilmaydi) — v1 da jonli `GROUP BY` yetarli; agar chiqish-chiptasi tahlili markaziy boʻlib qolsa, oʻshanda koʻchiriladi.

**R47 — "Worksheet" tugmasi asosiy amallar qatorida turadi.** Taqdimot sahifasida: `Edit · Save · Share · **Worksheet** · ⋮`. Yaʼni darsning bosma nusxasi — bir bosish, yashirin menyuda emas.

Bu B2.4 dagi *"bosma shablonlar deyarli bepul keladi"* daʼvosini va Ochiq masalalar №7 dagi **bitta generator** qoidasini tasdiqlaydi: dars → PDF ish varagʻi va dars → OMR blankasi bitta qatlamdan chiqadi. Amaliy qaror: bizda ham "Ish varagʻi" tugmasi dars sahifasining asosiy qatorida boʻladi.

**R48 — Toʻplamlar FAN boʻyicha emas, SINF boʻyicha tashkil qilingan.** `Collections`: `5-sinf (0)` · `6-sinf (2)` · `7-sinf (2)` · `8-sinf (4)` · `9-sinf (5)` · **`Saved for later (2)`**.

Bizning `activity_banks(name, subject, grade)` toʻgʻri, lekin UI'dagi **standart taklif** fan emas, sinf boʻlishi kerak — oʻqituvchi fanni bitta oʻzi oʻqitadi, sinflar esa koʻp. Va `Saved for later` — birovning kontentini saqlab qoʻyish uchun alohida chelak; bu `visibility: public` bankdan **isteʼmol qilish** tomoni (B5.4), biz uni ham koʻzda tutamiz.

**R49 — Sessiyalar roʻyxati — asosiy ish ekrani, va u besh holatni haqiqiy maʼlumotda tasdiqlaydi.** `All (78) · Running · Scheduled · Completed · Paused` — R1 aynan tasdiqlandi. Ustunlar: `Activity name` (+ tur + **`Teacher Paced`**) · `Date` · `Participants` · `Accuracy` (donut) · `Code` · `Class` · `Actions`. Filtrlar: resurs turi · hisobot turi · sinf · sana. 8 sahifa.

Ikki aniq detal:

1. **`Code` (PIN) sessiya tugagandan keyin ham saqlanadi va koʻrsatiladi** — oʻqituvchi sessiyani shu bilan tanib oladi. Bizda `join_code` sxemada bor; uni sessiya yopilganda oʻchirmaslik kerak.
2. **Olti oy oldin tugagan sessiyada "Reopen session" tugmasi bor.** Yaʼni `completed` — **qaytariladigan holat**, bir tomonlama emas. Kech qolgan oʻquvchi uchun uy vazifasini qayta ochish real ehtiyoj. Bizning `state` oʻtishlari shuni hisobga oladi.

**R50 — "Completion Rate" — bizda yoʻq, lekin kerak.** Ularning KPI qatori: `Accuracy 78%` · **`Completion Rate 100%`** · `Total Students 13` · `Questions 11`.

Aniqlik va tugatish **butunlay boshqa ikki narsa**: oʻz tezligidagi kviz yoki uy vazifasida birinchi savol *"nechta bola oxirigacha yetdi?"* boʻladi — 40% tugatgan 90% aniqlik yolgʻon xotirjamlik beradi. Bu hosila metrika, sxema oʻzgarishi kerak emas:

```
completionRate = avg( count(distinct item_id) per participant / total_items )
```

→ `src/lib/assess/session-stats.ts` ga qoʻshiladi va `selfpaced` rejimda **birinchi koʻrsatiladigan** raqam boʻladi.

**R51 — Hisobot ota-onaga bir bosishda ketadi ("Email all parents").** Bizda kanal boshqacha (Telegram, R3 — bizda email emas telefon), lekin **tahlil birligi bir xil**: bitta sessiyadan hosil boʻlgan **oʻquvchi boʻyicha** hisobot. Bu 3-bosqich (Shogird) uchun aniq talab: sessiya hisoboti allaqachon oʻquvchiga boʻlingan koʻrinishga ega boʻlishi kerak, keyin uni yuborish qoʻshimcha ish emas.

⚠️ Va bu R43 ga qaytadi: **`student_id` boʻlmasa, ota-onaga yuboradigan narsa ham yoʻq.** Roʻyxat bogʻlanishi Shogird'ning ham shartidir.

**Olinmaydi:** `Anti-cheating` tabi (B4.6 — bizda "diqqat monitoringi", faqat summativ va ixtiyoriy); `Evaluate ⚡` tugmasi (AI baholash — bizda `aiDraft`, oʻqituvchi tasdiqlaydi, B4.4); `Share report` premium darvozasi.

### Kahoot (2026-07-29) — HAQIQIY hisob va analitika

**Ayni oʻsha oʻqituvchining** Kahoot hisobi: 90 ta hisobot, 17 tagacha ishtirokchi, haqiqiy ismlar va ballar. Ikkinchi mahsulotdagi bir xil xulq — bu topilmalarni tasodif emas, **naqsh** qiladi.

**R52 — ⚠️⚠️⚠️ Reyting bilim tartibini BUZADI. Bu isbot, taxmin emas.** `Home row (Asosiy qator)`, 17 ishtirokchi, `Rank` va `Correct answers` ustunlari yonma-yon:

| Rank | Ism | Toʻgʻri | Final score |
|---|---|---|---|
| **1** | durdona | **88%** | 13 589 |
| **2** | J/Nargiza | **94%** | 13 339 |
| 3 | nodira | 88% | 13 188 |

**Birinchi oʻrindagi oʻquvchi ikkinchidan KAM bilgan.** Ikkinchi hisobotda (`01. Texnika xavfsizligi`) yana takrorlanadi: 4-oʻrin charos **90%** (8 132), 6-oʻrin farruh **100%** (7 751) — yaʼni hamma savolga toʻgʻri javob bergan oʻquvchi, bittasini xato qilgandan pastda turibdi.

Bu R44 dagi dalilning kuchliroq shakli: u yerda **bir xil bilim har xil oʻrin** edi, bu yerda **kamroq bilim yuqoriroq oʻrin**. Sinf ekranida chiqadigan podium shu tartibda koʻrsatiladi va oʻquvchilar buni "kim yaxshiroq bilishi" deb oʻqiydi.

Shu bilan `elapsed_ms` masalasi yopiladi. Bizda:
- `responses` da tezlik **yoʻq** (ballash funksiyasining tipiga kirmaydi, B boʻlim);
- reyting koʻrsatilsa — **`Toʻgʻri javob %` boʻyicha** tartiblanadi;
- oʻyin bali (agar boʻlsa) alohida, "oʻyin reytingi" deb belgilangan holda chiqadi va **hech qachon standart tartiblash boʻlmaydi**.

**R53 — Ishtirokchi ismlari — R43 ning amaliy koʻrinishi.** Ustun `Nickname` deb ataladi va haqiqiy qiymatlar shunday: `durdona` · `J/Nargiza` · `Nargiza` · `SHAHZODA` · `NOMOZ` · `safarovahulkaroy` · `mustafoqulovakomila` · `sabiy`.

Bir xil kishi turli sessiyalarda turlicha yozadi; `Nargiza` va `J/Nargiza` bir odammi yoki ikkitami — **bilib boʻlmaydi**. Familiya-ism qoʻshib yozilgan variantlar bor, katta-kichik harf izchil emas. Yaʼni bu maʼlumotni **sessiyalar orasida ulab boʻlmaydi**, demak uzunlamasiga tahlil tuzilma darajasida imkonsiz — hisobot faqat oʻsha kunning suratini beradi.

Bizning yechim R43 da yozilgan: ishtirokchi **roʻyxatdan tanlaydi**, yozmaydi. Bu bitta UI qarori, lekin butun tahlil dvigatelining sharti.

**R54 — ⚠️ `Live Classic mode (87)` va `Self-study (3)`. Nisbat 29:1.** Wayground'da ham 78 sessiyaning hammasi `Teacher Paced` edi. Yaʼni ikki mahsulotda, bir yil davomida, ~165 marta **oʻqituvchi boshqaradigan, sinfda, birgalikda** oʻtkazilgan; oʻz tezligidagi/uy vazifasi rejimi deyarli ishlatilmagan.

Bu rejaning urgʻusini tuzatadi (sxemani emas):

| Ilgari faraz | Haqiqat |
|---|---|
| `selfpaced` — 1-bosqichning asosiy yoʻli | 90 dan 3 tasi |
| Jonli rejim — 5-bosqich, realtime kerak | Asosiy ish rejimi, **lekin "jonli" ≠ socket** |

Muhim aniqlik: ularning "Live" degani — **oʻqituvchi sur'atni boshqaradi, hamma bir xonada**. Bu bizning `lecture`/`live` rejimimiz va u B3/1c da isbotlanganidek **2 soniyalik polling bilan toʻliq ishlaydi**. Yaʼni topilma realtime'ni oldinga surmaydi — aksincha, **1c-bosqichni** (interaktiv taqdimot, socketsiz) eng qimmatli yetkazma qiladi va `selfpaced` ni ikkinchi darajaga tushiradi.

**R55 — Xulosa ekrani = UCHTA TRIAJ KARTASI. Bu bizning Dars Xulosa HERO'mizning tayyor shakli.** `Summary` tabida katta donut (`81% correct`) va uchta karta:

| Ularniki | Bizdagi dvigatel |
|---|---|
| **Difficult questions (0)** | `classMisconceptions()` — ≥30% xato chegarasi |
| **Need help (0)** | `masteryOf()` = `not` boʻlgan oʻquvchilar |
| **Didn't finish (0)** | `completionRate()` (R50) |

Yaʼni uchta boʻsh ekran emas, **uchta savol**: qaysi savol qiyin boʻldi · kimga yordam kerak · kim tugatmadi. `docs/ustozona-v1.md` §6 dagi HERO ekranining tuzilishi aynan shu — endi u isbotlangan shaklga ega.

Yon karta: `Participants 17 · Questions 17 · **Time 11 min**`. Davomiylik bepul keladi (`opened_at → closed_at`) va past foizni talqin qilishda kerak.

⚠️ **Olinmaydi — sarlavha matni.** Ularda 81% da *"Well played!"*, 87% da *"Go for gold!"* — ball darajasiga qarab oʻzgaradigan tabriklash. `docs/marketing-brief.md` ning oltin qoidasi boʻyicha bizda sarlavha **neytral va pedagogik** boʻladi: "12 oʻquvchidan 5 tasi 3-savolda qoqildi", "Ajoyib!" emas.

**R56 — ⚠️⚠️ Kengaytirilgan savol koʻrinishi = DISTRAKTOR TAHLILI, va bizning eng aniq farqimiz aynan shu yerda.** Har savol uchun: matn, rasm, **har variant yonida ✓/✗ + gorizontal chiziq + NECHTA oʻquvchi tanlagani**, `No answer` qatori, `20s time limit` chipi va umumiy foiz.

Haqiqiy misol — `1. Internetda zararli dasturlar nima deb ataladi?` (67%):

| Variant | | Tanlagan |
|---|---|---|
| Foydali dasturlar | ✗ | 1 |
| **Viruslar** | ✓ | 10 |
| **Antiviruslar** | ✗ | **4** |
| Brauzerlar | ✗ | 0 |
| No answer | | 0 |

Toʻrt oʻquvchi "Antiviruslar" ni tanlagan. Bu tasodifiy xato emas — bu **aniq xato-tasavvur** (virus ↔ antivirus chalkashligi). Kahoot buni **koʻrsata oladi, lekin ayta olmaydi** — uning variantida faqat matn bor.

Bizda `activity_items.content.options[] = {id, text, isCorrect, **misconceptionId**}` (B boʻlim). Shuning uchun bizning hisobotimiz "4 kishi C variantini tanladi" emas, **"4 oʻquvchi virus va antivirusni chalkashtirdi → tavsiya: DTS.X.Y ni qayta koʻring"** deydi. Xom maʼlumot ikkalasida ham bir xil; farq — **teglash**. Bu skrinshot shuni isbotlaydiki, farqimiz nazariy emas: raqamlar allaqachon shu yerda turibdi, faqat maʼnosi yoʻq.

Ikkita qoʻshimcha:

1. **`No answer` alohida chelak.** Q5 da `No answer 1`, Q6 da `1`. Javob bermaslik xato emas — u boshqa hodisa (ulgurmadi/tushunmadi). Bizda javob berilmagan element uchun qator umuman yozilmaydi, shuning uchun hisobotda `kutilgan ishtirokchi − javob berganlar` alohida hisoblanadi.
2. **Bir elementning takrori bir sessiya ichida oʻlchanadi.** `Home row` da klavishlar ikki marta soʻralgan: `D` 76%→94% (yaxshilandi), lekin `A` 94%→76%, `J` 88%→76%, `L` 100%→88% (yomonlashdi). Yaʼni sessiya ichidagi takror **oʻrganishni emas, charchashni** koʻrsatishi mumkin. Bu `decay.ts` uchun ogohlantirish: takrorning foydasi **kunlar** miqyosida oʻlchanadi, daqiqalar miqyosida emas.

**R57 — Kutubxonadagi HAMMA resurs `Public`. Standart qiymat shunga olib kelgan.** Roʻyxat koʻrinishida `Visibility` ustuni bor va 18 resursning hammasida `Public`. Oʻqituvchi buni ataylab qilmagan — shunchaki standart qiymatga tegmagan.

Bu R18 dagi qoidamizning (`visibility` standart holda `private`) haqiqiy sabab-dalili: **oʻqituvchi standart qiymatni hech qachon oʻzgartirmaydi**, shuning uchun standart qiymat qarorning oʻzi. Bizda oʻquvchi ismlari va sinf maʼlumotlari bor — tasodifan ommaviy boʻlish qabul qilib boʻlmaydigan xato.

Yana bitta olinadigan narsa: kutubxona kartasida **`N plays`** koʻrsatilgan (2, 3, 4, 5, **10 plays**). Bu "qaysi resurs haqiqatan ishlatilyapti" degan savolga bir qarashda javob beradi va bizda arzon (`count(quiz_sessions) by set_id`).

**R58 — Bitta kontent koʻp marta oʻynaladi → kerak boʻlgan koʻrinish SESSIYA emas, KONTENT boʻyicha.** Hisobotlar roʻyxatida sarlavhalar takrorlanadi: `Misunderstood animals` ×2, `Home row (Asosiy qator)` ×2, `01. Fayllar iyerarxiyasi va formatlar` ×2 — har biri boshqa sana, boshqa sinf. Kutubxonada esa `10 plays`.

Yaʼni oʻqituvchi bitta darsni beshta sinfda oʻtkazadi. Sessiya hisoboti bunga javob bermaydi; kerak boʻlgan savol — **"shu dars hamma oʻtkazishlar boʻyicha qanday ketdi va qaysi savol doim qiyin?"**

Bizda bu **bepul**, chunki hamma javob bitta `responses` jadvalida va `session_id → set_id` bogʻlanishi bor:

```
src/server/dal/assess/results.ts
  sessionReport(sessionId)   — bitta oʻtkazish (R55/R56)
  contentReport(setId)       — HAMMA oʻtkazish boʻyicha jamlanma   ← YANGI
       → oʻtkazishlar soni, oʻrtacha aniqlik, sinflar kesimi,
         DOIM qiyin element (barcha sessiyalarda ≥30% xato) ← eng qimmatlisi
```

`contentReport` — savol sifatini oʻlchaydigan yagona yoʻl: bitta sinfda 40% chiqsa sinf sababmi yoki savol yomonmi noaniq; besh sinfda 40% chiqsa **savol yomon**.

**R59 — Papkalar yana SINF boʻyicha: `5-sinf · 6-sinf · 7-sinf · 8-sinf · 9-sinf · Typing.com`.** Bu R48 ning ikkinchi mustaqil tasdigʻi — **ayni oʻsha oʻqituvchi, boshqa mahsulot, bir xil tuzilma**. Yaʼni "sinf boʻyicha papka" tasodifiy odat emas.

Qoʻshimcha: papka ichida `New folder` (ichma-ich) va **`Share`** (butun papkani ulashish) bor. Bizning `activity_banks` da ichma-ichlik v1 da shart emas, lekin **papkani ulashish** — hamkasbga butun sinf materialini berish — B5.4 dagi umumiy bank gʻoyasining tabiiy kirish nuqtasi.

**R60 — "No end date" — sessiyalar tashlab ketiladi.** Hisobotlar roʻyxatida bir necha yozuvda `Finished` badge'i bor, lekin sana oʻrnida `No end date`. Yaʼni sessiya haqiqatda yopilmagan, tizim uni keyin "tugagan" deb belgilagan.

Bizda ham shunday boʻladi (dars tugadi, oʻqituvchi tabni yopdi). Demak: `closed_at` **null boʻlishi mumkin** `completed` holatida ham, va sessiya oxirgi javobdan keyin maʼlum vaqt oʻtgach avtomatik yopilishi kerak. ⚠️ Vercel Hobby'da cron yoʻq (F boʻlim) — shuning uchun avto-yopish **oʻqiganda hisoblanadi** (lazy), fon vazifasi bilan emas.

**R61 — Eksport va chop etish pullik darvoza ortida:** `Download basic report` bepul, `Download standard report ★` va `Print ★` pullik. Bizda `xlsx` allaqachon bogʻliqlik (B5.3) va PDF qatlami baribir quriladi (B2.4) — yaʼni **toʻliq eksport bizga deyarli bepul**. Buni pullik qilish uchun sabab yoʻq; aksincha, oʻz maʼlumotini olib chiqa olish ishonch masalasi.

**Olinmaydi:** podium/tabriklash mexanikasi (R52 dagi sabab); `Play again` chaqirigʻi bosh oʻrinda; `Feedback` tabi (oʻyin qanchalik qiziqarli boʻlgani haqida soʻrov — bu `grading: none` soʻrovnomasi bilan qilinadi, alohida tizim emas).

### Blooket (2026-07-29) — toʻplam yaratish va savol muharriri

**R62 — ⚠️ Variantlarni aralashtirish (`Random Order`) bizda YOʻQ edi, va u har SAVOLGA alohida.** Muharrir sarlavhasida uchta boshqaruv: `Time Limit [20]` · `Random Order ☑` · `Multiple Choice ▾`. Tooltip aniq: *"When checked, answers will be given in a random order."*

Nega kerak:

1. **Joylashuv siljishi (position bias).** Oʻqituvchi toʻgʻri javobni koʻpincha bir xil oʻringa yozadi; oʻquvchi buni sezadi va savolni oʻqimay tanlaydi. Bu **oʻlchov xatosi** — javob toʻgʻri, lekin bilim dalili emas.
2. **Sinfda koʻchirish.** Yonidagi bola ekranida "ikkinchi tugma" boshqacha boʻladi.

⚠️ Nega **global emas, har savolga**: "Yuqoridagilarning hammasi" yoki "Toʻgʻri javob yoʻq" kabi variantlar aralashtirilsa buziladi. Ularniki toʻgʻri qilingan.

✅ Muhim tekshiruv: aralashtirish bizning **xato-tashxisimizni buzmaydi**, chunki `responses.answer = {optionId}` yoziladi, koʻrsatilgan tartib emas. Yaʼni R56 dagi distraktor tahlili aralashtirilgan savolda ham ishlaydi. → Sxemaga `mcq.shuffleOptions` qoʻshildi.

**R63 — Blooket butun mahsuloti IKKI savol turi ustida ishlaydi.** `Question Type` modalida faqat: **Multiple Choice** va **Typing Answer**. Boshqa hech narsa yoʻq — 16+ oʻyin rejimi, millionlab toʻplam, ulkan foydalanuvchi bazasi, hammasi shu ikkitasi ustida.

Bu bizning 11 shaklga qarshi dalil emas, lekin **navbat haqida aniq eslatma**: qiymat turlar sonida emas, **boshlangʻich toʻplamda** (B2). `mcq` + `text` ikkisi allaqachon 1-bosqichda; qolgan 9 shakl — uzun quyruq, va ular hech qachon kritik yoʻlda boʻlmasligi kerak.

Yana bitta soddalik: **toʻgʻri javob belgisi — checkbox**, radio emas. Yaʼni bir nechta variantni belgilash uchun alohida rejim kerak emas (Kahoot'da bu `Multi-select ★premium` edi, R29). Bizda `options[].isCorrect` allaqachon har variantga boolean — yaʼni biz Blooket modelidamiz, qoʻshimcha bayroq shart emas.

**R64 — Formula muharriri: MathQuill + guruhlangan palitra, va math HAR JAVOBGA ham qoʻyiladi.** DOM tasdiqlaydi: `react-mathquill` (MathQuill 0.11). Palitra guruhlangan — amallar (`+ − · × ÷ = ± ≠ π ∞`), tuzilmalar (`a²`, `aᵇ`, `a/b`, `√a`, `ⁿ√a`, `ā`, `→ab`, `lim`, `Σ`, `Π`, `⌈a⌉`, `⌊a⌋`, `ln`, `log_b`, `∫`), munosabatlar (`< > ≤ ≥ ⊥ ∥ ~ ≈ ≅`), toʻplamlar (`ℕ ℤ ℚ ℝ ℂ ∀ ∃ ∈ ∉ ⊂ ⊄ ∩ ∪ ⊆ ⊈ ∅ ∧ ∨`), strelkalar, yunon harflari. Ustiga: kiritish maydoni + **jonli koʻrinish** + `Insert`.

Bizda KaTeX va Tiptap `extension-mathematics` allaqachon bor (B4.2) — yaʼni **render tayyor, kiritish UI'si yoʻq**. Bu ekran uning spetsifikatsiyasi.

⚠️ **Muhim tafsilot:** `X¹` tugmasi savol matnida ham, **har bir javob kartasida ham** bor. Yaʼni formula faqat savolda emas, **variantda** ham boʻladi (matematikada aynan shunday: "qaysi biri toʻgʻri: `x²`, `2x`, `x/2`?"). Demak `options[].text` KaTeX render qilishi shart — bu render qatlamiga taʼsir qiladi, sxemaga emas.

**R65 — ⭐ "Show Symbol Keyboard" — bu bizda OʻZBEK APOSTROFI masalasini yechadi.** Har bir matn maydoni yonida klaviatura ikonkasi bor (`data-tip="Show Symbol Keyboard"`) — maxsus belgilarni bosib kiritish uchun, matematikadan alohida.

Bizda bu **mahalliy jihatdan hal qiluvchi**: loyiha konvensiyasi `ʻ` (U+02BB) va `ʼ` (U+02BC) talab qiladi, lekin bu belgilar oʻzbek klaviatura maketida **yoʻq**. Natijada oʻqituvchi ASCII `'` yozadi va kontent nomuvofiq boʻladi. Kichik belgi-klaviaturasi (`ʻ ʼ ʼ` + tez-tez kerak boʻladigan `– — « » №`) matn maydonlarida — arzon va bevosita foydali. Bu faqat Baholash muharririga emas, **dars muharriri va vazifa nomlariga ham** tegishli.

**R66 — Yaratish usuli BIRINCHI qadam, sarlavhadan oldin.** `Question Set Creator` sahifasi *"Choose a Creation Method — This decides how you will start adding questions to your set"* deb boshlanadi: `Manual (Default)` · `Quizlet Import` · `CSV Upload` · `Khanmigo Generator`.

Kahoot'da bu savol darajasida edi (R34), bu yerda **toʻplam darajasida va birinchi**. Bizga ikkinchisi toʻgʻri: oʻqituvchida material allaqachon bor (Word, Excel, eski test), u "birinchi savolni yozish" dan emas, **"borimni qanday olib kiraman"** dan boshlaydi.

⭐ **Bundan chiqadigan aniq imkoniyat — migratsiya yoʻli.** `Quizlet Import` ularning raqobatchidan kontent tortib olish yoʻli. Bizda ekvivalenti bor va u deyarli bepul: **Kahoot va Wayground eksport fayllari `.xlsx`**, bizda `xlsx` allaqachon bogʻliqlik (B5.3). Yaʼni:

```
Import ustun shablonlari: Ustozona (oddiy) · Kahoot eksporti · Wayground eksporti
  → oʻqituvchi bir yillik kutubxonasini bir qadamda koʻchiradi
```

Bu texnik jihatdan kichik ish, lekin **qabul qilish uchun eng kuchli richag**: mavjud 18 ta darsini qayta yozishi kerak boʻlgan oʻqituvchi koʻchmaydi.

**R67 — Uchinchi marta: `Public` standart holda YOQILGAN.** `Privacy Setting` — bitta toggle, *"Public (Playable by everyone)"*, va u **yoqilgan holda keladi**. Wayground'da ham, Kahoot'da ham (R57) natija bir xil edi: oʻqituvchining butun kutubxonasi ommaviy.

Uch mahsulotda uch marta bir xil natija — bu tasodif emas, **standart qiymatning kuchidir**. Bizda `visibility` standarti `private` (R18) va bu qaror endi uch mustaqil dalilga tayanadi.

**R68 — Muharrirning uchta kichik, lekin oʻylangan qulayligi:**

1. **Toʻplam darajasidagi `Time Limit`** — bir marta belgilanadi, hamma savolga qoʻllanadi (Kahoot'da bu "Apply to all questions" edi). → `activity_sets.config.defaultTimeLimit`.
2. **`Hide Answers` / `Show Answers` tugmasi** — muharrirda toʻgʻri javoblarni yashiradi. Sabab aniq: oʻqituvchi darsda, projektor yoqilgan holda savol tahrirlaydi. Arzon va sinfxonani biladigan detal.
3. **Savol roʻyxatida `20 sec` va aralashtirish ikonkasi** — har qatorning sozlamalari roʻyxatning oʻzida koʻrinadi, ochib koʻrish shart emas.

**R69 — `Assign` va `Host` — rejim tanlovi KARTADA, yaratishda emas.** Toʻplam kartasida ikkita asosiy tugma yonma-yon. Yaʼni bitta kontent, ikki xil ishga tushirish — bu bizning `quiz_sessions.mode` qarorining aynan oʻzi (kontent va sessiya ajratilgan).

⚠️ Lekin ularning yon menyusida `Homework` **alohida boʻlim** sifatida turibdi. Biz buni olmaymiz: R54 ga koʻra uy vazifasi rejimi 90 dan 3 marta ishlatiladi — unga alohida yuqori darajali navigatsiya berish ekranni chalgʻitadi. Bizda uy vazifasi — sessiyalar roʻyxatidagi filtr.

**R70 — Boʻsh holat matni sabab-shartni aytadi, "maʼlumot yoʻq" demaydi.** *"You'll Need a Question Set to Host!"* + `[Create a Set]` `[Discover Sets]` + `Getting Started Tutorial`. Yaʼni foydalanuvchi nima uchun toʻxtaganini va keyingi ikki yoʻlni bir vaqtda koʻradi. Bizning `Empty` primitivimizda ham shu qolip qoʻllanadi (2-bosqich standartlashtiruvida u allaqachon bor).

**Olinmaydi:** `Blooks` / `Market` (kolleksiya iqtisodi — B5.6 da qaror qilingan: faqat kosmetik, takrorlash mashqlarida); uchinchi tomon AI (`Khanmigo`) — bizda oʻz quvurimiz bor; `Audio` savolga biriktirish — obyekt-saqlash talab qiladi, oʻsha bitta Blob qarori (Ochiq masalalar №10/16/19).

### Blooket (2026-07-29) — HAQIQIY hisob va MAʼLUMOT MODELI

Ayni oʻsha oʻqituvchining Blooket hisobi, ustiga **bosma sahifaning toʻliq JSON yuki** — yaʼni birinchi marta raqobatchining **haqiqiy sxemasi** koʻrindi, taxmin emas.

**R71 — ⚠️⚠️⚠️ Ularning `correctAnswers` maydoni ID emas, MATN saqlaydi. R56 dagi kamchilikning sababi shu.** JSON'dan aynan:

```json
{
  "question": "Elektron pochta nima uchun ishlatiladi?",
  "answers": ["Xat va hujjatlarni onlayn almashish uchun", "Faqat rasm chizish uchun",
              "Kompyuterni format qilish uchun", "Musiqa tinglash uchun"],
  "correctAnswers": ["Xat va hujjatlarni onlayn almashish uchun"],
  "random": true, "qType": "mc", "timeLimit": 20, "number": 9
}
```

Variantlar — **oddiy satrlar massivi**. Toʻgʻri javob esa oʻsha satrning **nusxasi** bilan belgilangan. Variantda `id` yoʻq.

Bundan kelib chiqadigan toʻrtta oqibat:

| Muammo | Nima boʻladi |
|---|---|
| Variant matni tahrirlansa | Toʻgʻri javob bogʻlanishi **uziladi** (satr endi mos kelmaydi) |
| Ikki variant matni bir xil boʻlsa | Ajratib boʻlmaydi |
| Javob tahlili | Faqat **satr boʻyicha guruhlash** — tarjima/imlo tuzatilsa tarix boʻlinadi |
| **Xato-tasavvur teglash** | **Umuman imkonsiz** — teg biriktiriladigan barqaror obyekt yoʻq |

Yaʼni R56 da koʻrgan narsamiz ("4 kishi Antiviruslarni tanladi" deb koʻrsata oladi, lekin **nega** ekanini ayta olmaydi) — UI qarori emas, **maʼlumot modeli cheklovi**. Ularda sababni yozib qoʻyadigan joy yoʻq.

Bizning modelimiz (B boʻlim, boshidan shunday):

```
options: [{ id, text, isCorrect, misconceptionId? }]
responses.answer = { optionId }
```

`id` barqaror — matn tahrirlansa ham, tarjima qilinsa ham, aralashtirilsa ham (R62) javoblar tarixi butun qoladi va **`misconceptionId` biriktiriladigan joy bor**. Bu seriyaning eng chuqur topilmasi: bizning asosiy farqimiz (nomlangan xato-tasavvur) **arxitektura darajasida qulflangan**, va uni nusxa koʻchirish ular uchun migratsiya talab qiladi.

**R72 — Bitta toʻplam 155 marta oʻynalgan.** `My Sets`: `6.0. (DT)` — **155 Plays** · `9.0. (DT)` — 143 · `8.4. Animatsiya…` — 106 · `6.4. Algoritmik fikrlash…` — 101. JSON'da ham `"playCount": 155`.

Kahoot'da eng koʻpi 10 marta edi (R57). Bu yerda 155. Demak R58 dagi **kontent boʻyicha jamlanma** (`contentReport(setId)`) qulaylik emas — **yagona maʼnoli birlik**. 155 ta alohida sessiya hisobotini hech kim oʻqimaydi; kerak boʻlgan javob esa *"shu 20 savoldan qaysilari 155 oʻtkazishda ham qiyin boʻlgan?"*

Amaliy detal: `playCount` toʻplam qatoriga **denormalizatsiya qilingan**. Bizda ham shunday boʻladi (kutubxona kartasida har safar `COUNT(*)` qilinmaydi).

**R73 — Uy vazifasi sahifasi: uchta olinadigan narsa.** *"Assigning Homework allows students to complete a game on their own time. You'll be given a **link and QR code**…"*

1. **Havola VA QR-kod.** Uy vazifasi uchun QR — oʻqituvchi projektorga chiqaradi, bolalar skanerlaydi. Bizda QR infratuzilmasi 1-bosqichda baribir quriladi (Plickers kartalari), yaʼni bu bepul qoʻshimcha.
2. **Sessiyaning OʻZ sarlavhasi bor** — `Homework Title`, standart qiymati `6.0. (DT) HW`. Wayground'da ham hisobot sarlavhasi tahrirlanardi (R49). Ikki mahsulotda ham bor, bizda **yoʻq** → `quiz_sessions.title` qoʻshildi (boʻsh boʻlsa toʻplam nomi koʻrsatiladi).
3. ⚠️ **Tugatish mezoni "hammasiga javob ber" EMAS, "N tasini TOʻGʻRI yech".** `Homework Goal`: `Correct Answers | Questions` + son (20). Izoh: *"Students must correctly answer this number of questions to complete the assignment"*.

Uchinchisi jiddiy: bu **oʻzlashtirishga asoslangan tugatish** va u **takroriy urinishlarni talab qiladi** — oʻquvchi 20 tasini toʻgʻri yechmaguncha davom etadi. Yaʼni R11 dagi `attempt_no` bu yerda ixtiyoriy emas, **model sharti**.

Bizda ikkala mezon ham boʻlishi kerak, chunki ular har xil savolga javob beradi:

```
quiz_sessions.completion jsonb
  { kind: "allItems" }              — hamma elementga javob berilsin (standart)
  { kind: "correctCount", n: 20 }   — N tasi toʻgʻri boʻlguncha (oʻzlashtirish rejimi)
```

⚠️ **Muhim chegara:** `correctCount` rejimida ham **oʻzlashtirish faqat BIRINCHI urinishga qaraydi** (R11). Aks holda "yigirmanchi urinishda topdi" ham 100% boʻlib koʻrinadi va `mastery` maʼnosini yoʻqotadi. `completionRate` (R50) esa rejimga qarab hisoblanadi.

**R74 — ⭐ Bosma varaq brauzerning oʻz chop etish oynasi bilan qilingan, server PDF'i bilan emas.** Sahifada ochiq yozilgan: *"Choose **'Save as PDF' from print menu** to download."* Yaʼni `@react-pdf/renderer` yoʻq — sof HTML + `@media print` CSS.

Bu B2.4 dagi rejamizni **soddalashtiradi**, chunki bizda bu naqsh allaqachon ishlaydi: dars muharriri A4 PDF'ni aynan brauzer chop etishi orqali beradi. Demak:

| Yoʻl | Qanday qilinadi |
|---|---|
| **Ish varagʻi / test blankasi (oddiy)** | HTML + print CSS — **mavjud naqsh, yangi bogʻliqlik YOʻQ** |
| **OMR blankasi** (burchak markerlari, aniq koordinatalar, "N nusxa har biri boshqa") | ⚠️ hali ochiq — bu yerda `@react-pdf/renderer` oqlanishi mumkin |

Yaʼni PDF kutubxonasi qarori **1-bosqichdan OMR qismiga koʻchadi** va oddiy bosma yoʻl undan oldin, bepul chiqadi.

Sahifaning boshqa detallari, hammasi olinadi:

- Uchta almashtirgich: `Show description` · `Show images` · **`Shuffle answers`** — yaʼni **bosma nusxada ham aralashtirish** (R62 ning qogʻoz tomoni; sinfda yonma-yon oʻtirganlarga har xil varaq).
- Ikkita tugma: `Print Worksheet` va **`Print Answer Key`** — javob kaliti alohida chop etiladi.
- Sahifa boshida: `Name ____  Date ____  Class ____` chiziqlari. ⚠️ Bu **qoʻlda yoziladi**; bizning OMR yoʻlimizda oʻquvchi kimligi **mashina oʻqiydigan** boʻlishi shart (R43 — aks holda javob roʻyxatga bogʻlanmaydi).
- Sarlavha va tavsif `contenteditable` — chop etishdan oldin joyida tahrirlanadi.
- ⚠️ Yana kichik ekran rad etilishi: *"Sorry, print preview unavailable on small screens."* — R21 dan keyin **ikkinchi marta**. Bizda dars hujjati kichik ekranda ham ochiladi; bu farqni saqlaymiz.

**R75 — Umumiy bank uchun kerak boʻlgan maydonlar toʻplami JSON'da tayyor turibdi.** Toʻplam obyektida: `"copiedFrom": ""` · `"verified": false` · `"featured": false` · `"isOnDiscover": false` · `"tags": []` · `"plusOnly": false` · `"favoriteCount": 0`.

Bu Ochiq masalalar №14 (umumiy bank moderatsiyasi) ni aniq maydonlarga aylantiradi:

| Maydon | Vazifasi |
|---|---|
| **`copied_from`** | **Muallif izlanuvchanligi** — birovning toʻplamidan nusxa olinsa manba saqlanadi (B5.4 dagi atributsiya masalasi) |
| `verified` | Moderator tekshirgan/sifatli deb belgilagan |
| `featured` / `is_on_discover` | Tanlangan roʻyxatga chiqarish — moderatsiyadan alohida |
| `tags` | Qidiruv va filtr |
| `favorite_count` | Ijtimoiy signal (bizda "saqlanganlar", R48) |

`copied_from` eng qimmatlisi va eng arzoni — nusxa olish paytida bitta ustun yoziladi. Uni keyin qoʻshish esa **imkonsiz** (oʻtmishdagi nusxalarning manbasi yoʻqoladi), shuning uchun **1-bosqichda darhol** qoʻyiladi.

**R76 — Kutubxona kartasidagi ikkita amal bizda yoʻq: `Merge` va `Solo`.** ⋮ menyusi: `Solo · Print · Move · Copy · **Merge** · Link`.

- **`Merge`** — ikki toʻplamni bittaga qoʻshish. Oʻqituvchi vaqt oʻtib mayda toʻplamlar yigʻadi (bu hisobda 4 ta toʻplam bor, ikkitasi 10 savoldan); ularni birlashtirish real ehtiyoj. Bizda `activity_sets.items` roʻyxat boʻlgani uchun arzon.
- **`Solo`** — oʻqituvchi oʻzi yakka oʻynab koʻradi. Bu bizda "Koʻrib chiqish" (preview) bilan bir xil, alohida rejim emas.

**Yana bir tasdiq (toʻrtinchi marta):** JSON'da `"private": false` — kutubxonaning ommaviyligi endi xom maʼlumotda ham koʻrinib turibdi (R57/R67). Toʻrt mahsulot, toʻrt bir xil natija; `private` standarti muhokamadan chiqdi.

**Olinmaydi:** `plusOnly` kontent darvozasi (bizda kontent tarifga bogʻlanmaydi); `dashboardLayout: "Teacher"` — ular rolni **maket sozlamasi** sifatida saqlaydi, bizda esa haqiqiy rol darvozasi (0-bosqichda qilingan).

### Blooket (2026-07-29) — JONLI OʻYIN: host, lobbi, pleyer

Bu koʻrik seriyada ochiq qolgan edi. Ustiga host sahifasining DOM'i **realtime stekini** oshkor qildi — F boʻlim uchun toʻgʻridan-toʻgʻri maʼlumot.

**R77 — ⚠️⚠️ Har oʻyin rejimi oʻzi haqida TUZILGAN metadata eʼlon qiladi.** Rejim tanlagichida oʻngdagi karta:

| Maydon | Classic uchun qiymat |
|---|---|
| Tagline | *"Good Ol' Fashioned Blooket!"* |
| **Difficulty** | Simple |
| **Skills** | **Speed & Accuracy** |
| **Ideal Time** | 7 min |
| **Questions** | `Synced` Prompting · `High` Frequency |
| **Players** | 1 Min · **8 Ideal** · 60 Free Max · 300 Plus Max |

Uchta narsa olinadi va bittasi ataylab **olinmaydi**:

1. ⚠️ **`Skills` maydoni — rejim nimani mukofotlashini eʼlon qiladi.** Yaʼni ularda tezlikni hisobga oladigan va olmaydigan rejimlar bor, va bu **maʼlumot sifatida yozilgan**. Bizga bu shakl kerak, lekin qiymat emas: shablon reyestriga `rewards` maydoni qoʻshiladi va uning tipida **`"speed"` qiymati umuman boʻlmaydi**:

   ```ts
   rewards: ("accuracy" | "participation" | "collaboration")[]   // "speed" YOʻQ
   ```

   Bu `elapsed_ms` ni ballash funksiyasining tipiga kiritmaslik hiylasining (B boʻlim) ikkinchi qoʻllanishi — qoida hujjatda emas, **tip tizimida** turadi.

2. **`Questions: Synced Prompting, High Frequency`** — savol yetkazishning ikki oʻlchovi: hammaga bir vaqtda (`synced`) yoki har kim oʻz tezligida (`async`), va savol oʻyinni qanchalik tez-tez toʻxtatishi. Bu bizning `mode` (live/selfpaced) va shablon xususiyatining aniq ajratmasi.

3. **`Players: Min/Ideal/Max` va `Ideal Time`** — oʻqituvchiga rejim **necha kishiga moʻljallanganini** oldindan aytadi. ⚠️ Bu bizda alohida ogohlantirish: `Ideal 8` — Oʻzbekiston sinfi esa 25–35. Yaʼni arkada rejimlarining koʻpi bizning sinfimizga **oʻlchov boʻyicha toʻgʻri kelmaydi**, va bu B5.1 dagi **jamoaviy rejimning** yana bir asosi (5 telefon × 6 bola = ideal 8 ga tushadi).

4. ⚠️ **`60 Free Max / 300 Plus Max`** — realtime sigʻimi ularda **pullik oʻq**. Bu F boʻlim uchun xarajat signali: bir vaqtda ulangan ishtirokchi soni bepul emas.

**R78 — Host sozlamalari: toʻrtta oʻrinli detal.** `Host Now` tugmasi ustida:

- **`Number of Questions` surgichi (20 dan)** — toʻplamning **qismi** oʻynaladi. Yaʼni 20 savolli toʻplamdan 10 tasini olib oʻtkazish mumkin. Bizda `quiz_sessions` toʻplamga havola qiladi; qism tanlash `config.itemLimit` bilan qoʻshiladi.
- **`Match Type: Solo | Teams`** — jamoaviy rejim **ishga tushirish paytida** tanlanadi, kontentga bogʻlanmaydi. B5.1 dagi qarorimiz aynan shunday (`session_participants.member_student_ids`).
- ⚠️ **`Question Ordering: Random | Ordered`**, va izohi muhim: *"Questions will be presented in a random order, **but only repeating questions after all have been answered equally**"*. Yaʼni bu sodda tasodifiy emas, **muvozanatli aralashtirish** (qaytarishsiz, teng taqsimlangan).

  Bu bizning element-darajasidagi tahlilimiz uchun **majburiy**: sodda `random()` baʼzi elementlarni koʻp, baʼzilarini kam koʻrsatadi va `itemAccuracy` (R45) turli n larga asoslanib solishtirib boʻlmaydigan boʻlib qoladi. → `src/lib/play/ordering.ts`, muvozanatli aralashtirish.
- **`Allow Late Joining`** (yoqilgan) — kech kelgan oʻquvchi oʻyin oʻrtasida qoʻshila oladi. Sinfda haqiqiy ehtiyoj; bizda F boʻlimdagi qayta-ulanish (`/api/play/rejoin`) bilan bir mexanizm.

**R79 — Lobbi ekrani — `stage` sirtining eng toza namunasi.** Yuqori chiziqda: **QR-kod** + *"Go to play.blooket.com and enter Game ID:"* + **320385** (juda katta) + `Copy Join Link`. Pastda ishtirokchilar soni, sarlavha va `Start`; ishtirokchi qoʻshilganda kartasi paydo boʻladi.

Ikkita amaliy detal:

- Ism kartasi **kengligiga moslashadi** — DOM'da `font-size: 33.5312px` hisoblab qoʻyilgan, yaʼni "matnni sigʻdirish" komponenti. Uzun ism kartani buzmaydi.
- ⚠️ URL **`classic.blooket.com`** — har oʻyin rejimi **alohida subdomen/deploy**. Yaʼni ogʻir realtime runtime dashboard'dan ajratilgan. Bizning D boʻlimdagi `/play` marshruti hozircha bitta ilova ichida; agar realtime kelsa, bu ajratish naqshi eslatma sifatida yozib qoʻyiladi.

**R80 — ⭐ Jonli savol ekranida ikkita hal qiluvchi element, ikkalasi ham arzon.** Host koʻrinishi: `Question 1/20` · katta savol matni · taymer doirasi `25` · va:

1. **`0 / 1` — javob bergan / jami ishtirokchi.** Oʻqituvchi jonli koʻradi: hamma javob berdimi yoki kutish kerakmi. Busiz oʻqituvchi **koʻr** — taymer tugashini kutadi yoki erta oʻtib ketadi. Bizda arzon: joriy element uchun `COUNT(responses)`.
2. **`Skip ⏭`** — taymerni kutmay keyingi savolga oʻtish. Sinfda majburiy: hamma javob berib boʻlgach 15 soniya kutib turish darsni oʻldiradi.

Ikkalasi ham 1c-bosqichdagi *instructor-paced* taqdimotga ham tegishli (F boʻlim: `current_index` avval Postgres'ga yoziladi, keyin tarqatiladi — `Skip` shunchaki indeksni oshirish).

Savol oldidan **`Get Ready!` 2 soniyalik sanoq** bor — bu ham kichik, lekin sinfni bir vaqtda tayyorlaydi.

**R81 — ⚠️⚠️ Pleyer tomonida ALOHIDA "Accessibility" paneli, va uni OʻQUVCHI tanlaydi.** Sozlamalar tortmasida: `Volume` (Mute, 70%) va **`Accessibility`: `Big Font Size` · `Read Aloud` · `High Contrast`**.

Bu bizning C boʻlimdagi `data-reading="support"` qatlamining va B3.4 dagi Immersive Reader qarorining tasdigʻi — lekin bitta muhim farq bilan:

| | Wayground (R10) | Blooket (R81) | Bizda |
|---|---|---|---|
| Kim yoqadi | **Oʻqituvchi** oʻquvchiga tayinlaydi | **Oʻquvchi** oʻzi tanlaydi | **Ikkalasi ham** |
| Qayerda saqlanadi | `student_accommodations` (doimiy) | Sessiyaga xos, saqlanmaydi | doimiy + sessiya-lokal |

Ikkalasi ham kerak: doimiy moslashuv oʻqituvchi qarori (masalan koʻrish qiyinchiligi), lekin **shu daqiqada projektor yorugʻ va shrift kichik** — buni oʻquvchi oʻzi hal qiladi.

✅ **Muhim tekshiruv:** shrift kattaligi, kontrast va ovozli oʻqish — R10 dagi **"koʻrinish" sinfiga** kiradi, yaʼni **nima oʻlchanayotganini oʻzgartirmaydi**. Shuning uchun bu uchtasi `responses.accommodations` ga **yozilmaydi** va xato-tashxisdan chiqarilmaydi. (Taqqoslang: `reduceChoices` — R13 — yoziladi va chiqariladi.)

⚠️ `Read Aloud` bizda Ochiq masalalar №8 ga bogʻlanadi: brauzerda `uz-UZ` ovozi yoʻq, shuning uchun tugma oʻzbekcha kontentda **koʻrinmaydi** (buzilgan funksiya koʻrsatilmaydi, B3.4).

**R82 — ⚠️⚠️ Realtime steki oshkor boʻldi: Colyseus.** Host sahifasining DOM'ida:

```
/assets/colyseus-BqRmS-7H.js
/assets/blooketColyseusClient-BgRp49no.js
/assets/blooketColyseusShared-ByaTFkSl.js     ← klient va server BOʻLISHADIGAN xona sxemasi
/assets/sentry-C1ykrCFm.js
```

Colyseus — xona-asosli, **avtoritar** koʻp oʻyinchili server freymvorki (Node, WebSocket, sxema-asosli binar sinxronizatsiya). Bundan F boʻlim uchun uchta xulosa:

1. ✅ **"Xona = aktor" shakli toʻgʻri.** Biz Cloudflare Durable Objects ni yetakchi nomzod deb yozgandik aynan shu sabab bilan; Colyseus — oʻsha shaklning kutubxona koʻrinishi. Yaʼni tanlov tasdiqlandi, faqat ijro boshqa.
2. ⚠️ **Colyseus bizga toʻgʻridan-toʻgʻri toʻgʻri kelmaydi.** U **doim yoniq Node jarayonini** talab qiladi; bizning deploy Vercel serverless va biz *"doim yoniq backend yoʻq"* qarorini allaqachon qabul qilganmiz. Yaʼni Colyseus'ni olish = alohida server ijaraga olish = yangi xarajat va yangi operatsion yuk.
3. **Ular buni alohida deploy qilgan** (`classic.blooket.com`, Cloudflare orqasida, Sentry bilan) — yaʼni realtime runtime **asosiy ilovadan ajratilgan**. Bu bizning "5-bosqichda qaror" pozitsiyamizni oqlaydi: realtime — alohida tizim, mahsulotning ichiga oʻralgan qism emas.

→ Ochiq masalalar №2 shu maʼlumot bilan toʻldirildi.

**R83 — ⚠️ Oʻquvchiga har savoldan keyin OʻTGAN VAQT koʻrsatiladi.** Javobdan keyingi ekran: `1st 🐻 Falonchi **+4** — **15.448s**`. Yaʼni oʻrin, olingan ball **va sarflangan vaqt**.

Bizda vaqt ballga kirmaydi (R52 bilan yopilgan masala), lekin **koʻrsatish alohida qaror**: agar oʻquvchiga har savoldan keyin "15.4 soniya" deb yozilsa, u tezlikni maqsad deb tushunadi va shoshiladi — natijada oʻlchov buziladi, ball formulasi tegilmagan boʻlsa ham.

**Qaror: koʻrsatilmaydi.** Javobdan keyingi ekranda faqat toʻgʻri/notoʻgʻri va (agar kerak boʻlsa) tushuntirish boʻladi. Bu `docs/ustozona-v1.md` dagi fikr-mulohaza qoidalariga mos.

**Olinmaydi:** avatar (`Blook`) tanlash ekrani va qulflangan kolleksiya — B5.6 dagi qaror kuchda (faqat kosmetik, takrorlash mashqlarida, diagnostikada yoʻq); `Banned Blooks` moderatsiyasi ham shu bilan tushib qoladi; `Use Random Names` (bizda ishtirokchi roʻyxatdan ismini tanlaydi, R43).

**R84 — Javobdan keyin BARCHA variantlar darhol oshkor qilinadi.** Pleyer DOM'ida: sarlavha qizil `INCORRECT`, toʻgʻri variant yashil ✓ bilan, qolgan uchtasi **xira kulrang** ✗ bilan. Yaʼni oʻquvchi nafaqat xato qilganini, balki **toʻgʻri javob qaysi ekanini** darhol koʻradi.

Bu fikr-mulohaza vaqti masalasi va u `docs/ustozona-v1.md` hududi. Bizning holat:

| Rejim | Toʻgʻri javob qachon koʻrsatiladi |
|---|---|
| `formative` (takrorlash, oʻz tezligida) | **Darhol** — retrieval practice aynan shuni talab qiladi |
| `formative` (sinf muhokamasi, `lecture`) | **Oʻqituvchi ochganda** — avval anonim proyeksiya va muhokama (B3.3) |
| `summative` | **Sessiya yopilgandan keyin** — aks holda keyingi savolga taʼsir qiladi |

Yaʼni bu `activity_sets.purpose` va `quiz_sessions.mode` dan **hosila**, alohida sozlama emas.

**R85 — `Read Aloud` — sozlama emas, savol yonidagi ALOHIDA TUGMA.** DOM'da savol sarlavhasida `<svg data-icon="volume-up" role="button" tabindex="0">` — yaʼni bola har savolda bosib eshitadi. Sozlamalardagi almashtirgich (`read-aloud-toggle`) esa tugmani **koʻrsatadi/yashiradi**.

Bizga bu naqsh toʻgʻri keladi (B3.4): oʻzbekcha ovoz boʻlmasa tugma umuman render qilinmaydi, shuning uchun "tugma bor, lekin ishlamaydi" holati boʻlmaydi.

⭐ Yana bir tasdiq: pleyer runtime'ida **`react-mathquill` ham yuklangan**. Yaʼni formula faqat muharrirda emas, **oʻyinda ham render qilinadi** — R64 dagi "variantlar KaTeX render qilishi shart" xulosasi jonli ekranda ham amal qiladi.

**R86 — Oʻquvchining yakuniy ekranida `Score` va `Accuracy` ALOHIDA turadi.** *"1st Place · Score: 4 · **Accuracy: 1/1 100%** · View Question Details"*.

Ikki daftar ajratmasi (R44/R52) endi **oʻquvchiga koʻrinadigan** ekranda ham koʻrindi — yaʼni ular ham bu ikkisi bir narsa emasligini biladi. Bizda oddiyroq: **`Score` umuman yoʻq**, faqat aniqlik.

⭐ **`View Question Details`** — oʻquvchi **oʻz javoblarini qayta koʻra oladi**. Bu retrieval halqasining yopilishi va bizda **Shogird uchun aniq talab** (3-bosqich): oʻquvchi oʻz sessiya natijasini, qaysi savolda qoqilganini koʻrishi kerak. Sessiya hisoboti allaqachon oʻquvchi boʻyicha boʻlingan (R51), demak bu qoʻshimcha ish emas.

**R87 — Projektor yakuniy ekranidan hisobotga toʻgʻridan-toʻgʻri oʻtish.** `Final Standings` ekranining oʻng yuqorisida **`View Report`**. Yaʼni oʻyin tugagach oʻqituvchi bir bosishda tahlilga oʻtadi.

Bizda bu joyga **Dars Xulosa HERO** (R55: qiyin savol / yordam kerak / tugatmadi) ulanadi — yaʼni sessiya oxiri reyting bilan emas, **xulosa bilan** tugaydi. Bu bizning va ularning oxirgi ekrani orasidagi eng koʻrinadigan farq boʻladi.

**R88 — Market butunlay kosmetik, va bu bizning B5.6 chegaramizni tasdiqlaydi.** Doʻkonda: `Hat · Clothing · Glasses · Mouth · Hair · Item` — **bittasi ham oʻyin mexanikasiga yoki ballga taʼsir qilmaydi**. Karta paketlari 20–25 tanga, buyumlar 50 tanga.

Bu B5.6 dagi qoidamiz (*"kolleksiya faqat kosmetik"*) aynan shu joyda chegara ekanini koʻrsatadi — ular ham shu chiziqni saqlagan.

⚠️ Lekin yakuniy ekranda **`Class Pass — 2/5 XP`** bor: bosqichma-bosqich mukofot yoʻli (battle pass). Bu boshqa mexanika — u **muddatli** va **yigʻish bosimi** yaratadi (oʻtkazib yuborsang yoʻqotasan). Kosmetik boʻlsa ham, u *"koʻproq oʻyna"* deb turadi va bu formativ baholash bilan mos kelmaydi. → **olinmaydi**; bizda mukofot (agar boʻlsa) qatnashganlik uchun beriladi, muddatli poygada emas.

### Kahoot (2026-07-29) — JONLI OʻYIN: rejim tanlash, host, pleyer

Ikkinchi jonli referens. Blooket bilan solishtirganda uchta joyda **ancha kuchli**, va DOM ikkita ochiq masalaga aniq javob berdi.

**R89 — ⚠️⚠️ Rejim filtri PEDAGOGIK taksonomiya, "koʻnikma" emas.** Tanlash ekranida filtr tablari: `All · **Assessment** · **Repetition** · **Team competition** · **Collaboration**`.

Bu Blooket'ning `Skills: Speed & Accuracy` maydonidan (R77) yaxshiroq, chunki u rejimni **maqsad** boʻyicha tasniflaydi — va toʻrttasi ham bizning lugʻatimizda allaqachon bor:

| Ularning toifasi | Bizdagi mos tushuncha |
|---|---|
| **Assessment** | `activity_sets.purpose` (formativ/summativ) |
| **Repetition** | `decay.ts` — unutilish/takrorlash signali (B2, 2-daraja) |
| **Team competition** | jamoaviy rejim, `member_student_ids` (B5.1) |
| **Collaboration** | ⚠️ bizda **yoʻq** — birgalikda yechish (raqobatsiz) |

→ Shablon reyestriga `category` maydoni qoʻshildi. `rewards` (R77) qoladi, lekin `category` — oʻqituvchi **tanlash paytida** koʻradigan narsa.

**R90 — ⚠️⚠️⚠️ "Confidence" rejimi — bizning `responses.confidence` ustuni uchun tayyor asos.** Rejimlar orasida ikkitasi diqqatga sazovor: **`Accuracy`** (R32 dagi tezliksiz rejim) va **`Confidence`**.

`Confidence` — oʻquvchi javob berishda **qanchalik ishonchli ekanini** ham belgilaydi (certainty-based marking). Bizda `responses.confidence` ustuni sxemada **boshidan bor edi, lekin ishlatilmagan**. Bu koʻrik unga maʼno berdi:

| Javob | Ishonch | Nimani anglatadi |
|---|---|---|
| Toʻgʻri | Yuqori | **Biladi** — mustahkam bilim |
| Toʻgʻri | Past | **Taxmin qildi** — oʻzlashtirish deb hisoblash xato |
| Notoʻgʻri | Past | Bilmaydi va biladi buni — oddiy boʻshliq |
| **Notoʻgʻri** | **Yuqori** | ⚠️ **XATO-TASAVVUR** — eng qimmatli diagnostik signal |

Oxirgi qator hal qiluvchi: **ishonch bilan qilingan xato** tasodifiy xato emas, u mustahkam ildiz otgan notoʻgʻri modelni koʻrsatadi. Bu bizning `misconceptionId` teglashimizni (R56/R71) **kuchaytiradi**: distraktor tanlovi + yuqori ishonch = tasdiqlangan xato-tasavvur.

⚠️ Cheklov: ishonch soʻrash har savolga qoʻshimcha bosish demak. Shuning uchun u **rejim** boʻladi (ularda ham shunday), har sessiyada emas — diagnostik sessiyalarda yoqiladi.

**R91 — ⚠️ "Show questions on devices" — bu Oʻzbekiston uchun eng amaliy sozlama.** Host sozlamalarida: *"Questions and answers show on participants' devices."* Oʻchirilsa oʻquvchi telefonida **faqat rangli tugmalar** qoladi, savolni esa **projektordan** oʻqiydi.

Nega bu bizga muhim:

- **Trafik** — savol matni va rasmi har telefonga yuborilmaydi (F boʻlimdagi sekin tarmoq masalasi).
- **Kichik ekran** — 4 dyuymli telefonda uzun savol matni oʻqilmaydi; projektorda oʻqiladi.
- **Diqqat** — bolalar ekranga emas, doskaga qaraydi.

Bu bizning ikki sirt qarorimizning (C boʻlim) toʻgʻridan-toʻgʻri qoʻllanishi: `stage` savolni koʻrsatadi, `handheld` faqat javob tugmalarini. → `quiz_sessions.render_config.showQuestionOnDevice` (standart: **oʻchirilgan**, chunki bizning sharoitda projektor bor va trafik qimmat).

**R92 — Host sozlamalari toʻrt guruhga boʻlingan, va roʻyxat oʻzi foydali.** Guruhlar: **Accessibility · Hosting · Learning · Security & privacy**.

| Sozlama | Bizda |
|---|---|
| `Unlimited time` (Accessibility) | ⚠️ **R10 ning "sharoit" sinfi** — vaqt chegarasini olib tashlash; oʻlchovga taʼsir qilmaydi, `accommodations` ga yozilmaydi |
| `Increase contrast` | R81 — "koʻrinish" sinfi |
| `Lock game` | Yangi qoʻshilishni toʻxtatish — kerak, arzon |
| **`2-step join`** | Ommaviy PIN uchun troll himoyasi. Bizda PIN sinfga bogʻlangan (R43), shuning uchun **kerak emas** |
| `Nickname generator` | Xavfsiz tasodifiy ismlar — bizda roʻyxat bor, **kerak emas** |
| **`Q&A` + `Q&A Moderation`** | ⭐ Oʻquvchi oʻyin davomida savol beradi, oʻqituvchi moderatsiya qiladi. Sinfda qimmatli; ularda **pullik**. Bizda B3.3 dagi anonim proyeksiya bilan bir oilada |
| **`Team talk`** | ⭐ Jamoa javobdan oldin **muhokama qiladi**. B5.1 dagi jamoaviy rejim aynan shu fazasiz maʼnosiz — qoʻshiladi |
| `Autoplay` | Savollar avtomatik oʻtadi — `Skip` (R80) bilan juft |
| `Reactions` | Emoji reaksiyalar (👍👏❤️😂🤔😮) |
| *"Your settings will be saved for next time"* | Sessiya sozlamalari eslab qolinadi — kichik, lekin har safar qayta sozlashdan qutqaradi |

**R93 — `Randomize order of answers` YOQILGAN holda keladi, va u SESSIYA darajasida.** Blooket'da bu har savolga edi (R62), bu yerda esa butun sessiyaga. Ikkalasi ham kerak:

```
quiz_sessions.render_config.shuffleAnswers   — sessiya standarti (YOQILGAN)
activity_items.content.mcq.shuffleOptions    — har savolda BEKOR QILISH (R62)
     ("yuqoridagilarning hammasi" kabi variantlar uchun)
```

Uchinchi mahsulotda uchinchi marta — aralashtirish standart xulq ekani tasdiqlandi.

**R94 — ⚠️ "Do not use your real name" — bu ularning cheklovi, biz uchun aksincha.** Qoʻshilish ekranining ostida shu yozuv turibdi. Sabab aniq: roʻyxat yoʻq, ismlar projektorga chiqadi, demak haqiqiy ism xavfsizlik masalasi.

Bizda R43 ga koʻra teskari: oʻquvchi **roʻyxatdan oʻz ismini tanlaydi**. Bu ziddiyat emas, chunki:

- ism **oʻqituvchining roʻyxatidan** keladi, bola yozmaydi;
- projektor koʻrinishi baribir **ism qaytarmaydi** (B3.3 — `stage` DAL funksiyasi ism maydonini umuman bermaydi).

Yaʼni bizda "haqiqiy ism" xavfsiz, chunki u sinf ichida qoladi va sahnaga chiqmaydi.

**R95 — Oʻyin qatlami: `Answer Streak` va tezlikka qarab kamayadigan ball.** Javobdan keyin: `Correct` + `Answer Streak 1` + `+886`, keyingisida `Answer Streak 2` + `+883`. Yaʼni ketma-ket toʻgʻri javob hisoblagichi va tezlikka bogʻliq ball.

Ikkalasi ham `session_participants.game_state` hududi (B5.5) va **`responses` ga tegmaydi**. Streak — qiziqarli qobiq, lekin bilim dalili emas: 5 ta oson savolni ketma-ket topish 1 ta qiyin savolni topishdan koʻra kam maʼno beradi.

**R96 — ⚠️ Uzilish toasti DOM'da tayyor turibdi: *"Connection lost — Reconnecting…"***. Spinner bilan, `aria-live="assertive"`.

Bu F boʻlimdagi uzilish rejamizni tasdiqlaydi va bitta aniqlik kiritadi: uzilish **koʻrinadigan** boʻlishi kerak (biz "vahima UI yoʻq" deb yozgandik). Toʻgʻri chegara:

- **Javob yuborish** — jim, outbox kafolatlaydi (F boʻlim, oʻzgarmaydi).
- **Ulanish uzilishi** — koʻrsatiladi, chunki oʻquvchi "tugma ishlamayapti" deb oʻylab qolmasligi kerak.

**R97 — ⭐⭐ Savol rasmi manbai DOM'da koʻrindi: UNSPLASH.** Rasm URL'i: `images.unsplash.com/photo-...?ixid=...&ixlib=rb-4.1.0&dpr=1.25&width=1200`.

Bu **Ochiq masalalar №21 ga aniq javob** (rasm qidirish API'si). Unsplash:

- **bepul API** va rasmiy qidiruv endpointi bor;
- litsenziya ochiq (tijoriy foydalanishga ruxsat), shart — **muallif atributsiyasi**;
- `ixlib`/`dpr`/`width` parametrlari bilan **serverda oʻlchamlash** beradi — yaʼni bizga rasm saqlash kerak emas (obyekt-saqlash masalasi chetlab oʻtiladi!).

⚠️ Cheklovlar: soʻrov limiti bor (demo 50/soat, prod 5000/soat) — `ai_usage` naqshi bilan kvota qoʻyiladi; kontent Gʻarbiy fotobank, oʻzbek/mahalliy kontekst kam; moderatsiya Unsplash tomonida, lekin sinf uchun qoʻshimcha filtr kerak. → №21 shu variant bilan yangilandi.

**R98 — Pleyer runtime'ining texnikasi: bittasini olamiz, bittasini olmaymiz.**

| Texnika | Qaror |
|---|---|
| **PixiJS + pixi-spine + Lottie** avatar uchun (skeletal animatsiya, har rang CSS oʻzgaruvchisi: `--left-eye-pupil-color`, `--teeth-buck-visibility`…) | ❌ **Olinmaydi.** B2.2 da oʻyin dvigateli rad etilgan; ustiga bu 2GB'lik Android uchun ogʻir |
| **Konteyner soʻrovlari (`cqmin`/`cqh`/`cqw`)** javob tugmalarida — `font-size: calc(0.5rem + 2.2cqmin)`, `width: max(20cqh, min(10cqw, 32px, 35cqh))` | ✅ **Olinadi.** Bu "bir xil komponent telefonda ham, projektorda ham" masalasining toʻgʻri yechimi va bizda konteyner-soʻrov naqshi allaqachon ishlatiladi |
| `aria-live` bilan taymer eʼloni (*"19 seconds left to answer. Quiz, 2 of 10"*) | ✅ Arzon, R41 dagi kirish qulayligi qatoriga qoʻshiladi |
| Savol va javob matnida `<b>` — qalin matn | ✅ Savol/variant matni oddiy satr emas, **cheklangan rich text** boʻlishi kerak |

**Yakuniy ekran (qisqa):** `Game summary` — ikkita karta: `Correct answers 20%` va `Difficult questions 0`, ustiga `Share podium` / `View full report` / `Get feedback`. Wayground'ning **uchta** triaj kartasidan (R55) zaifroq — bizda uchtasi qoladi. `Get feedback` (oʻquvchidan soʻrovnoma) esa `grading: none` bilan qilinadi, alohida tizim emas.

**Olinmaydi:** avatar konstruktori va `Achievements`; `Kahootopia` / `Class island` (kolleksiya-dunyo); `Autoplay` bilan keyingi kvizga oʻtish (dars oxiri hisobot bilan tugaydi, yangi oʻyin bilan emas).

---

### Wayground — jonli dars/oʻyin (R99–R118)

Koʻrilgani: sessiya sozlamalari → host kutish ekrani → pleyer qoʻshilishi → lobbi → taqdimot rejimi → beshta jonli vosita (annotatsiya, doska, sur'at almashtirish, gʻildirak, "eyes up front") → savol ekrani va javob paneli → anti-cheating modali → reyting va podium. Ikkita toʻliq DOM (host `waitingScreen` va host `running`).

**R99 — ⭐⭐⭐ "Serious theme" — BITTA tumbler butun oʻyin qobigʻini oʻchiradi.** Sessiya sozlamalarida yangi bayroq: *"Serious theme (NEW) — Focused environment without gamifications."*

Bu bizning eng asosiy qaroriimizning mahsulot darajasidagi tasdigʻi: **oʻyin — qobiq, oʻlchov — yadro** (Qabul qilingan qarorlar). Agar oʻyin qatlami maʼlumotga aralashib ketgan boʻlsa, uni bitta tumbler bilan yechib olib boʻlmasdi. Wayground buni qila oladi — demak ularda ham ajratilgan.

Bizga aniq oqibat: `render_config.gameShell: boolean`. Oʻchirilganda **avatar, streak, reyting, konfetti, podium, tanga — hammasi yoʻqoladi**, savol/javob/tahlil esa **bitta bit ham oʻzgarmaydi**. Bu sinov-imtihon (`purpose: summative`) sessiyalarining tabiiy standarti va katta sinf uchun "jiddiy rejim". Bir qatorlik sozlama, chunki arxitektura toʻgʻri.

**R100 — Sinf tanlash UCHINCHI marta ixtiyoriy chiqdi.** Sozlamalar sahifasida: *"Not assigned to a class — You have 13 classes"* + `Select a class`. Yaʼni **13 ta sinfi bor** foydalanuvchida ham standart holat "sinfsiz".

R43 (78 sessiya, hammasi sinfsiz) → R71 (Blooket) → R100 (jonli yoʻl ham). Uch xil mahsulotda, uch xil oqimda bir xil natija. Bizning `class_id MAJBURIY` qarorimiz shu bilan yakuniy: bu cheklov emas, **butun tahlil dvigatelining sharti**.

**R101 — ⚠️ Moslashuvlar SESSIYA darajasida biriktiriladi, oʻquvchi profilida emas.** Sozlamalarda alohida blok: *"Accommodations — Provide Dyslexia Font, Translation, Extra Time, and more support for specific students"* + `Add`.

Bizda `student_accommodations` (R22) **oʻquvchi darajasida** — bu toʻgʻri, chunki disleksiya sessiyadan sessiyaga oʻzgarmaydi. Lekin bitta qoʻshimcha kerak: **sessiya darajasidagi bekor qilish**. Sabab amaliy — imtihonda qoʻshimcha vaqt beriladi, oddiy takrorlash mashqida esa keraksiz.

```
quiz_sessions.render_config.accommodationOverrides?: { [studentId]: Partial<Accommodations> }
```

Yangi jadval emas — sessiyaga xos, sessiya bilan birga oʻladi. `responses.accommodations` (R23) baribir **haqiqatda qoʻllangan** holatni yozadi, demak izlanuvchanlik saqlanadi.

**R102 — Taymer sessiya sozlamasi, host esa uni JONLI boshqaradi.** Sozlamada: `Question timer: On – lock answering…`. Savol ketayotganda esa host panelida `00:27` + **pauza**, **`+15s`**, **qayta boshlash**, **`End Timer`**.

Bu bizda yoʻq edi. Qoʻshiladi:

```
render_config.timer: { mode: "off" | "soft" | "lock", seconds: number }
   soft = vaqt tugaydi, lekin javob qabul qilinaveradi (koʻrsatkich)
   lock = vaqt tugaydi, javob QULFLANADI
```

⚠️ Muhim chegara: taymer **`render_config` ichida**, `score.ts` kirish tipida emas. Vaqt oqimni boshqaradi, **ballni emas** — `elabsed_ms` qoidasi (B boʻlim) buzilmaydi. `+15s` esa oddiy sinf haqiqati: bola savolni oʻqib ulgurmaydi, oʻqituvchi vaqt qoʻshadi.

**R103 — Qoʻshilish uchun ALOHIDA QISQA DOMEN: `joinmyquiz.com`.** Uchinchi marta: Kahoot → `kahoot.it`, Blooket → `play.blooket.com`, Wayground → `joinmyquiz.com` (asosiy domen `wayground.com` boʻlsa ham!).

Sabab aniq: oʻquvchi domenni **quloqdan** yozadi. `wayground.com/gameplay/admin/dashboards/...` ni ovoz bilan aytib boʻlmaydi.

Bizga: `/play` yoʻli texnik jihatdan yetarli, lekin **`ustozona.uz/q` yoki alohida qisqa domen** — ergonomika masalasi, keyinga surilmasin. Bu 5 daqiqalik ish (rewrite), lekin sinfda 30 marta takrorlanadi. → Ochiq masalalarga qoʻshildi.

**R104 — Ishtirokchi ismi AVTO-GENERATSIYA qilinadi + qayta tashlash tugmasi.** Qoʻshilish ekrani: *"Your Wayground name is…"* + tayyor taxallus + 🎲 tugmasi. Kahoot'da *"Do not use your real name"* (R94), bu yerda esa **avtomatik tasodifiy ism**.

Uchta yondashuv bor, bizning tanlovimiz toʻrtinchi:

| Yondashuv | Kim | Oqibat |
|---|---|---|
| Erkin yozish | Blooket | Nomunosib ismlar, moderatsiya kerak |
| "Haqiqiy ism yozmang" | Kahoot | Tahlil imkonsiz |
| Avto-taxallus + qayta tashlash | Wayground | Xavfsiz, lekin baribir roʻyxatga bogʻlanmaydi |
| **Roʻyxatdan TANLASH** | **Ustozona (R43)** | **Oʻquvchi darajasidagi tahlil ishlaydi** |

Avto-generator baribir kerak — **anonim rejim uchun zaxira** (`student_id = null` istisno holati, B5.1). `src/lib/play/nickname.ts` — sof funksiya, oʻzbekcha soʻz juftliklari.

**R105 — Slaydlar va savollar BITTA raqamli ketma-ketlik.** Sarlavhada `15 questions • 16 slides`, jonli ekranda esa **`Slide 1 / 31`**. Yaʼni 15 + 16 = 31, va oʻquvchi ham, oʻqituvchi ham **yagona raqamni** koʻradi.

Bu `activity_sets.items` (rolli tartiblangan roʻyxat, R46) + `container_kind: "deck"` (B4.3) qarorining aynan oʻzi. Qoʻshimcha ish yoʻq — faqat UI'da **umumiy indeks** koʻrsatiladi, "savol 3" emas.

**R106 — ⚠️⚠️ Sessiya oʻrtasida REJIM ALMASHADI, va chegarasi bor.** Modal: *"Let students work at their own pace — Assign student paced mode till `Slide 31 ▾`"* + slayd eskizlari + `START NOW`.

Bu bizning farazimizni buzadi: `quiz_sessions.mode` **yaratishda qotib qolmaydi**. Haqiqiy dars oqimi shunday:

> Oʻqituvchi 1–12-slaydni birga oʻtadi → "endi 13–31 ni oʻzingiz bajaring" → sinf mustaqil ishlaydi → oxirida yana birga yigʻiladi.

Sxemaga qoʻshiladi:

```
quiz_sessions.mode           ← OʻZGARUVCHAN (live ⇄ selfpaced), yaratishda qotmaydi
quiz_sessions.mode_boundary  int?  — selfpaced qaysi indeksgacha amal qiladi
```

⚠️ Nega bu muhim: `selfpaced` da butun material oldindan yuklanadi (F boʻlim). Rejim oʻrtada yoqilsa, **qolgan qismini oʻsha paytda oldindan yuklash** kerak. Bu 1c-bosqichning polling naqshiga toʻgʻri tushadi (`current_index` bilan bir qatorda `mode` ham tarqatiladi), socket talab qilmaydi.

**R107 — ⭐ Annotatsiya va Doska — BITTA kanvas dvigateli, ikki rejim.** Vositalar qatori ikkalasida **bir xil**: `Clear · Eraser · Undo · Redo · Select · qalam/marker · Color · Text · Stroke · Shapes · Equation · Eyes up front`.

Farqi faqat ikkita tumblerda:

| Rejim | Fon | Tumblerlar |
|---|---|---|
| **Annotatsiya** | joriy slayd | — |
| **Doska** | boʻsh nuqtali kanvas | `Upload Image` · **`Allow Students to Draw`** · **`Show current slide`** |

`Show current slide` yoqilsa doska annotatsiyaga aylanadi. Yaʼni bu **bitta komponent**.

Bizga uch tomonlama dividend — bu sirt oʻqi boʻyicha boʻlish qarorining eng katta amaliy foydasi:

1. **Ustozona Doska**ning `Draw` vidjeti (tldraw/Excalidraw),
2. **Baholash**ning `draw` shakli (B2, oʻquvchi javobi = vektor shtrixlar),
3. **Interaktiv taqdimot**ning annotatsiya qatlami (B3)

— **bitta primitiv**, uchta joyda. `src/components/play/DrawBoard.tsx`.

⚠️ Va yana `Equation` — KaTeX uchinchi marta chiqdi (B4.2, R64, endi doskada ham). Formula kiritish **umumiy primitiv**, har joyda qayta yozilmaydi.

**R108 — "Eyes up front" — oʻquvchi ekranini XIRALASHTIRADI.** Host tugmani bosadi → har bir telefonda slayd blur boʻladi + illyustratsiya + *"Please focus on the teacher's screen!"*.

Bu juda arzon (bitta CSS `filter: blur()` + tarqatiladigan bayroq) va juda kuchli. Diqqat vositasi, jazo emas: oʻquvchi hech narsa yoʻqotmaydi, faqat vaqtincha ekran oʻchadi.

Bizda: `stage` sirtidan `handheld` sirtiga tarqatiladigan `focusMode: boolean`. **1c-bosqichga kiradi** — bu interaktiv taqdimotni sinfda ishlatib boʻladigan qiladigan narsa. Socket kerak emas, 2 soniyalik polling yetadi (kechikish sezilmaydi).

**R109 — Qoʻl koʻtarish (✋) — pleyer panelida doimiy tugma.** Pleyer pastki qatorida avatar + ism + ✋. Jonli sinfda raqamli qoʻl: bola ovoz chiqarmasdan savol borligini bildiradi.

Arzon, foydali, `responses` ga tegmaydi. Host panelida ishtirokchi yonida belgi paydo boʻladi.

**R110 — Stikerlar/reaksiyalar — pleyer oʻng chetida vertikal lenta.** *"Feelin GOOD!"*, *"HELLO I'M NERVOUS"*, *"Let's go!"*, 🤞, *"We got this!"*… Host tomonida DOM'da `LiveReactionBubbles` va `header-reaction-counters` komponentlari.

Efemer: ekranda suzib chiqadi va yoʻqoladi, hech qayerga yozilmaydi. `game_state` ham emas — oddiy broadcast.

⚠️ Bitta kuzatuv: *"HELLO I'M NERVOUS"* — bu **hissiy holat**, oʻyin emas. Jonli sinfda bolaning "men hayajondaman" deyishi qimmatli signal. Lekin biz uni **oʻlchamaymiz** — bu ijtimoiy qatlam, `student_notes` emas.

**R111 — "Spin the wheel" — ishtirokchilar roʻyxatidan tasodifiy tanlash.** Ismlar slot-mashina kabi aylanadi → toʻxtaydi → `Spin again`.

B2.5 da yozgan edik: *"Random wheel = Doska'ning Random Name vidjeti, faqat maʼlumot manbai boshqa"*. Bu tasdiqlandi va **uchinchi manba** qoʻshildi:

| Manba | Qayerda |
|---|---|
| Sinf roʻyxati | Doska — Random Name |
| Atamalar roʻyxati (`wordlist`) | Baholash — Random wheel shabloni |
| **Sessiya ishtirokchilari** | **Jonli dars — kim javob beradi** |

Bitta gʻildirak primitivi, uchta maʼlumot manbai.

**R112 — Anonimlik host tomonida TUMBLER: `Show names` va `Show answers`.** Javoblar panelida ikkita alohida tugma.

Bizda bu **ikki sirt** bilan hal qilingan (B3.3): `desk` = ism koʻrinadi, `stage` = DAL ism maydonini **umuman qaytarmaydi**. Bizning yechim kuchliroq (DevTools ochgan oʻquvchi ham koʻra olmaydi), lekin Wayground bitta narsani toʻgʻri qilgan: **oʻqituvchiga tumbler kerak**.

Sintez: sirt qoidasi oʻzgarmaydi (`stage` hech qachon ism olmaydi), lekin `desk` panelida `showNames` tumbleri boʻladi — chunki oʻqituvchi noutbukini ham baʼzan sinfga koʻrsatadi.

**R113 — "Discuss" — muhokama rejimi ALOHIDA tugma.** Javoblar panelida: `Show answers` · `View correct answer` · **`Discuss`**.

Bu `docs/ustozona-v1.md` §6 dagi "Dars Xulosa HERO" oqimining jonli versiyasi: xato-tasavvur aniqlandi → anonim javob ekranga → sinf muhokama qiladi. Wayground uni **tugma** qilgan, biz esa **ekran** qilamiz. Toʻgʻri joylashuv: `stage` sirtidagi "Muhokama" koʻrinishi — savol + javob taqsimoti + ismsiz namunaviy javoblar.

**R114 — Javob holati uch darajali: `Submitted` / `Attempting` / `Unattempted`.** Panelda: `0/1 Responses`, `Attempted by 0/1`, `Unattempted 1/1` + `Submitted`/`Attempting` filtr chiplari.

`Attempting` — bu javob emas, **hozirlik**: oʻquvchi savolda turibdi, lekin yubormagan. Bu `responses` ga yozilmaydi (yozilsa ham nima yozardik — boʻsh javobmi?), u `session_participants.last_seen_at` + joriy indeksdan **hosila**.

`src/lib/assess/session-stats.ts` ga qoʻshiladi:

```
presence(participants, currentIndex) → { submitted, attempting, absent }
```

**R115 — Anti-cheating monitori: uchta bayroq, agregat hisobot, va PULLIK.** Modal `Anti-cheating Monitor`:

| Bayroq | Matni |
|---|---|
| `Send warning to students` | *"Warn students for leaving fullscreen and off-task activities"* |
| ↳ `Disable right click actions` | *"Prevent use of AI apps or other tools via right click"* |
| ↳ `Disable copy and paste` | *"Prevent copying and pasting of text and image content"* |

Va hisobot ikki darajali: yigʻma — *"All students are currently on the Wayground tab"* (yashil ✓); muammo boʻlsa — *"1 learner with alerts"* → `Pistonchi — 1 alert detected`.

B4.6 aniqlashtiriladi:

1. **Standart holat — YASHIL agregat.** "Hammasi joyida" degan bitta qator. Har bir oʻquvchini kuzatib turgan panel emas — bu sinfda ishonchni buzadi.
2. `Disable right click` / `copy-paste` — ⚠️ **vebda chetlab oʻtiladi** (DevTools, ikkinchi qurilma). Ular *toʻsiq* emas, *ishqalanish*. Nomlanishi shunga mos boʻlsin.
3. *"Prevent use of AI apps"* — yangi tashvish turi, lekin **notoʻgʻri yechim**: oʻng tugmani oʻchirish AI'dan himoya qilmaydi. Biz bunday vaʼda bermaymiz (`docs/marketing-brief.md` oltin qoidasi).
4. Wayground buni **School Plan** ga qamagan — demak bu **pulli xususiyat sifatida qabul qilingan** bozorda. Bizda `teachers.plan` bor; qaror keyinroq.

**R116 — ⚠️ Pleyer holat bannerlari: `CORRECT` / `INCORRECT` / `QUESTION DONE`.** Toʻliq ekran rangli banner (yashil/qizil/kulrang) + *"You have answered Question 4"*, ostida toʻgʻri javob yashil, oʻz javobi qizil bilan.

Pedagogik jihatdan bu **ikki qirrali**:

| Holat | Darhol qaytarma |
|---|---|
| **Formativ** (takrorlash, mashq) | ✅ Foydali — xatoni darhol tuzatish retrieval practice'ning asosi |
| **Summativ** (imtihon, nazorat) | ❌ Zararli — qolgan savollarga taʼsir qiladi, koʻchirishni ragʻbatlantiradi |

Shuning uchun bu **sozlama**, doimiy xatti-harakat emas:

```
render_config.feedback: "immediate" | "afterQuestion" | "afterSession" | "none"
```

Standart: `purpose: formative` → `immediate`; `purpose: summative` → `afterSession`. Yaʼni **maqsad standartni belgilaydi**, oʻqituvchi bekor qila oladi.

**R117 — Yakun ikki qadam: Leaderboard → Podium.** Reyting jadvali (`Click anywhere to skip`), keyin uch ustunli podium + projektor nuri + konfetti (DOM'da `Podium`, `AuraRenderer`, `auraPresets`, `Confetti`).

`Click anywhere to skip` — kichik, lekin muhim detal: **oʻqituvchi taqdirlash marosimini oʻtkazib yuborishi mumkin**. Dars 45 daqiqa, animatsiya esa vaqt yeydi.

Bizda: podium — `render_config.gameShell` ostida (R99). Oʻchirilgan boʻlsa **toʻgʻridan-toʻgʻri xulosa ekraniga** oʻtiladi.

**R118 — ⚠️⚠️ Xavfsizlik saboqi: butun feature-flag jadvali DOM'da OCHIQ turibdi.** Sahifada `<div id="feature-flags">` — **~600 bayroq**, qiymatlari bilan, hech qanday filtrsiz.

Ikki xulosa:

**(a) Raqobatchi yoʻl xaritasi oʻqiladi.** Nomlaridan koʻrinadi: `paper-mode-enable-us`, `bubblesheet-app`, `lockdown-browser: ENABLED`, `student-whiteboard-2`, `hot-text-question-type: true`, `state-rubric-ai-eval`, `open-ended-eval`, `differentiation`, va oʻchirilgan oʻyinlar: `tug-of-war: OFF`, `coin-heist: OFF`, `shoe-forge: false`. Yaʼni **qogʻoz rejimi va OMR blanka ular uchun ham prioritet** — bizning 1-bosqich navbatimiz tasodifiy emas.

**(b) Bizga qoida.** Bayroqlar mijozga **faqat kerakli qismi** yuboriladi. Server komponentda hal qilinadi, `<html>` ga JSON tashlanmaydi. Bu bizda hozircha muammo emas (bayroq tizimi yoʻq), lekin qoʻshilganda shu qoida bilan qoʻshilsin.

⚠️ **Uchinchi kuzatuv — maxfiylik.** Jonli sinf sahifasida uchta uchinchi tomon skripti ishlayapti: **Survicate** (soʻrovnoma), **Braze** (marketing), **Hotjar** (sessiya yozuvi), ustiga GTM va Bing piksellari. Yaʼni **oʻquvchi ekrani marketing quvuriga ulangan**. Biz buni ataylab qilmaymiz: `/play` va `/shogird` sirtlarida **hech qanday tashqi kuzatuv skripti yoʻq**. Bu texnik qaror emas, prinsipial qaror — va uni hujjatga yozib qoʻyish kerak edi.

### Wayground — sessiya yakuni va hisobot (R119–R129)

**R119 — Yakuniy ekran uchta amal beradi: `Home` · `Restart` · `View Reports`.** Sarlavha `Session Summary`, ustida kubok.

`Restart` bizda yoʻq edi va u **`completed` ni qaytarish (R49) bilan bir narsa emas**. Ikkita alohida amal:

| Amal | Nima boʻladi |
|---|---|
| **Davom ettirish** (R49) | Oʻsha `quiz_sessions` qatori, oʻsha `join_code`, `state: completed → running` |
| **Qaytadan oʻtkazish** (R119) | **Yangi** sessiya qatori, oʻsha `set_id`, yangi kod — eski hisobot tegilmaydi |

Chalkashish qimmatga tushadi: birinchisi maʼlumotni **davom ettiradi**, ikkinchisi **yangi oʻlchov** yaratadi. UI'da ikki xil nomlansin.

**R120 — ⭐ Grafik ostidagi bitta jumla: *"Only includes graded questions part of the lesson."*** Yaʼni tahlil **faqat baholanadigan** elementlarni oladi — slaydlar, soʻrovnomalar, soʻz bulutlari chiqmaydi.

Bizda bu arxitekturadan **avtomatik** kelib chiqadi: `grading: none` (B5.2) va kontent slaydlari `responses` ga baholanadigan qator bermaydi. Lekin topilma **UI haqida**: shu jumla yozilmasa, oʻqituvchi "31 slayd oʻtdim, nega grafikda 11 ta?" deb soʻraydi. **Hisoblash qoidasi koʻrinadigan boʻlsin** — bir qator matn, katta ishonch.

**R121 — Grafik oʻqi SLAYD indeksi, savol raqami emas: `#2 #3 #4 … #11`.** Y — `Average Accuracy`, X — umumiy ketma-ketlikdagi oʻrin, ostida `Slides ‹ ›` sahifalash.

R105 ning ikkinchi tasdigʻi: raqamlash **butun toʻplam boʻyicha yagona**, "savol 3" emas. `src/lib/assess/session-stats.ts` ga:

```
accuracyByIndex(session) → [{ index, accuracy, itemId }]   ← boʻshliqlar bilan
```

Boʻshliqlar muhim: #5 slayd boʻlsa grafikda nuqta yoʻq, lekin **indeks oʻtkazib yuborilmaydi** — aks holda oʻqituvchi grafikni darsga solishtira olmaydi.

**R122 — Natija TOʻRT holatli, uchtasi emas: ✅ toʻgʻri · 🟡 **qisman** · ❌ notoʻgʻri · ⬜ urinilmagan.** Ishtirokchi qatorida uch rangli hisoblagich, KPI kartalarida esa toʻrtinchisi ham (`Unattempted 13`).

Bu R26 (`responses.score` — qisman baholash) ning UI darajasidagi tasdigʻi: qisman javob **alohida toifa**, yaxlitlanmaydi. `session-stats.ts` shu toʻrtlikni qaytarsin, `correct/total` emas:

```
outcomeCounts(session, participantId) → { correct, partial, incorrect, unattempted }
```

⚠️ `unattempted` — **javob yoʻqligi**, yaʼni `responses` da qator yoʻq. Uni hisoblash uchun toʻplam elementlari roʻyxati kerak, faqat javoblar jadvali emas.

**R123 — ⭐ `Avg. time 3s` — vaqt KOʻRSATILADI, lekin ballanmaydi.** KPI kartalari: `Accuracy 7% (1/15 pts)` · `Avg. time 3s` · `Correct 1` · `Partially correct 0` · `Incorrect 1` · `Unattempted 13`.

Bu bizning `elapsed_ms` chizigʻimizni **aniqlashtiradi**. Ilgari "umuman ishlatilmaydi" degandik; toʻgʻri formulirovka:

> `elapsed_ms` **yoziladi va koʻrsatiladi**, lekin `score.ts` kirish tipiga **kirmaydi**.

Va u qimmatli — chunki **xulq signali**, bilim oʻlchovi emas. 15 savolga oʻrtacha **3 soniya** va 7% aniqlik = oʻquvchi oʻqimasdan bosgan. Bu oʻqituvchiga *"Alisher tez bosgan, savolni oʻqimagan"* deydi — bahoga tegmasdan. `session-stats.ts` ga `avgTime()` + ⚠️ chegara: **oʻrtacha vaqt qisqa + aniqlik past = taxmin qilish**, alohida signal sifatida.

**R124 — ⚠️⚠️ Diqqat monitoringi SAVOL darajasiga tushirilgan.** Sarlavha: *"8 alerts in 3 questions"*; har savol kartasi ostida qizil banner: *"Tab switch usage detected during this question."*

Bu B4.6 ni kengaytiradi (bizda faqat sessiya darajasi koʻzda tutilgandi). Ikki jihat:

**Foydali tomoni:** "qaysi savolda chiqib ketdi" — bu qiyinlik signali ham. Bola qiynalgan savolda javob qidirgan.

**⚠️ Xavfli tomoni:** bu **bola haqidagi ayblov**, va u **noaniq** — telefon jiringlagan, oʻqituvchi chaqirgan, brauzer bildirishnoma chiqargan. Shuning uchun qaror:

```
session_participants.integrity jsonb?
   { tabSwitch: { total: 8, byItem: { [itemId]: n }, lastAt } }
```

**Yangi jadval QOʻSHILMAYDI.** Sabablari:

1. Bizga faqat **agregat** kerak (R115), voqealar tarixi emas.
2. ⚠️ Skrinshotda **urinilmagan** savolda ham bayroq bor — demak u `responses` ga yozilmaydi (u yerda qator yoʻq!). `session_participants` esa har doim bor.
3. Sessiya bilan birga **oʻladi** — bu maxfiylik jihatidan afzal: bola haqidagi kuzatuv izi doimiy yozuvga aylanmaydi.

**Qatʼiy chegara:** `integrity` → bahoga, oʻzlashtirishga, xato-tashxisga, xulq ballariga **hech qachon tegmaydi**. U faqat oʻqituvchi koʻzi uchun, oʻsha darsda.

**R125 — Qurilma va brauzer yozib olingan: `Windows | Chrome`, + `Joined` va `Last played` vaqtlari.**

Foydasi haqiqiy: *"menda ishlamadi"* degan shikoyatni tekshirish. Lekin toʻliq user-agent saqlash — keraksiz maxfiylik yuki. Qaror: **faqat qoʻpol toifa** — `session_participants.device_label` yonida `device_kind: "mobile" | "tablet" | "desktop"`. Toʻliq UA satri saqlanmaydi.

**R126 — Har savol kartasining aniq qolipi.** Bu bizning ishtirokchi hisoboti ekranining tayyor spetsifikatsiyasi:

```
[holat chipi]  [☑ savol turi belgisi]              [2s time] [1 point]
[rasm eskizi]  N. Savol matni
Response                        │  Correct answer
 ✓ oʻquvchi javobi              │  toʻgʻri javob
[⚠ diqqat bayrogʻi, agar bor boʻlsa]
```

Ikki yangi detal: (a) **`Response` va `Correct answer` yonma-yon ustunda** — toʻgʻri javobda ikkalasi bir xil boʻlib turadi, bu ortiqcha koʻrinsa ham skanerlashni osonlashtiradi; (b) har savolda **vaqt va ball** — R123 dagi qoida bilan (koʻrsatiladi, ballanmaydi... bu yerda `point` — oʻyin bali, R33).

**R127 — Chuqur havola URL parametri bilan: `?showInfractions=true`.** Yoʻl: `/session/admin/reports/<sessionId>/players/<name>?showInfractions=true`.

Bizda bu naqsh allaqachon standart (`?tab=`, `?b=`, `?classId=`). Sessiya hisoboti ham shunday boʻlsin — modal holati URL'da, chunki oʻqituvchi havolani oʻziga saqlaydi yoki qayta yuklaydi.

**R128 — Pleyer modalida `Print` va `Delete`.** `Delete` = ishtirokchini **hisobotdan chiqarish** (oʻqituvchining oʻz test urinishi, mehmon, tasodifiy qoʻshilgan).

Bizga kerak, lekin darvoza bilan: `session_participants` oʻchirilsa `responses` ham ketadi (cascade). ⚠️ **Jurnalga koʻchirilgandan keyin oʻchirib boʻlmaydi** — `grades` qatori qolib ketadi. Qoida: oʻchirish faqat `publish` dan **oldin**, keyin esa avval bahoni bekor qilish kerak.

`Print` — brauzer chop etishi (R74 naqshi), yangi qatlam emas.

**R129 — Texnik jurnal ustida ODAM TILIDAGI jumla: *"Spent a minute outside the Wayground tab."***

Jadvalda `Tab Switch | Left Wayground tab | 8 | 2 minutes ago` turibdi — lekin yonida **bitta oʻqiladigan jumla**. Bu R55/R56 dagi "nomlangan xulosa" prinsipining aynan oʻzi, faqat boshqa domenda: **raqamni koʻrsatma — maʼnosini ayt**.

Bizda hamma joyda shu qoida: `8 alerts` emas, *"Dars davomida ~1 daqiqa boshqa oynada boʻlgan"*. Xuddi shunday `avgTime` uchun: `3s` emas, *"Savollarni oʻqimasdan bosgan koʻrinadi"*.

---

### classroomscreen.com — Ustozona Doska uchun (R130–R143)

Koʻrilgani: bosh sahifa (pozitsiya, auditoriya, shablonlar, raqamlar) → ilovaning oʻzi (anonim seans, salom modali, vidjet paneli) → chizish asboblari → "Edit widget bar" → **toʻliq DOM**.

**R130 — Pozitsiya: "online *whiteboard* that keeps your students *on task*".** Vidjet paneli emas, **doska**. Foyda vaʼdasi esa: *"Improve classroom management without raising your voice."*

Auditoriya boʻlimlari: Pre-K va boshlangʻich · oʻrta · yuqori · **maxsus taʼlim**. Raqamlar: 2 mln oʻqituvchi, 450k kunlik, 180+ mamlakat.

⚠️ Butun bosh sahifada *"your students"* bor, lekin **ismlar yoʻq**. Bu bizning asosiy farqimizni tasdiqlaydi va u B boʻlimda allaqachon yozilgan: **classroomscreen sizning oʻquvchilaringizni bilmaydi, Ustozona Doska biladi.** Random Name va Group Maker haqiqiy roʻyxatdan oʻqiydi.

**R131 — ⭐ 25 vidjet, hammasi VERSIYALANGAN: `_V1`.** DOM'da tur nomlari `WIDGET_BACKGROUND_V1`, `WIDGET_POLL_V1`, `WIDGET_TIMER_V1`…, modul nomlari `ClockV1Widget`, `TimetableV1Widget`…

Sabab aniq: saqlangan ekran vidjet konfiguratsiyasini oʻz ichida saqlaydi. Vidjet qayta yozilsa `V2` chiqadi, `V1` esa **oʻqilishda davom etadi** — eski ekranlar buzilmaydi.

Bu bizning `activity_items.item_version` qaroriimizning (B boʻlim) aynan bir xil mantiqi, boshqa domenda. Doska sxemasiga oʻsha zahoti kiritiladi:

```
doska_widgets.kind: "timer.v1" | "traffic-light.v1" | ...
```

Yaʼni tur nomi **satr va versiyali**, enum emas. Enum boʻlsa migratsiya kerak boʻladi; satr boʻlsa eski qiymat shunchaki eski renderer bilan chiziladi.

**R132 — ⭐⭐ "Edit widget bar" — oʻqituvchi panelni OʻZI tuzadi.** Panelda 11 ta koʻrinadi (`background · poll · randomizer · sound level · image · text · work symbols · traffic light · timetable · timer · clock`), qolgan 13 tasi `more` ichida (`group maker · video · dice · webcam · visual timer · calendar · event countdown · stopwatch · pdf · draw · embed · qr code · hyperlink · stickers · scoreboard`).

Bu **56 shablon masalasining Doska tomonidagi yechimi** (B2 "Miqyos haqida halol gap"). Hammasi bir vaqtda koʻrinmaydi — oʻqituvchi 8–12 tasini tanlaydi, qolgani menyuda qoladi. Yaʼni vidjetlar sonini oshirish **UI'ni buzmaydi**, chunki koʻrinish foydalanuvchi tanlovi.

```
doska_prefs(teacher_id, bar_widget_kinds jsonb, ...)
```

**R133 — Doska ham "toʻplam": `screen deck` → `screen`.** URL: `/app/t/<teamId>/sd/<screenDeckId>/s/<screenId>`; pastki oʻng burchakda `‹ [1] +` — ekran qoʻshish va aylanish.

Yaʼni Doska **bitta ekran emas**, tartiblangan ekranlar toʻplami — xuddi `activity_sets` kabi. Dars: 1-ekran kirish, 2-ekran topshiriq, 3-ekran uy vazifasi.

```
doska_decks(id, teacher_id, class_id?, title, created_at, updated_at)
doska_screens(id, deck_id, teacher_id, ordinal, background jsonb)
doska_widgets(id, screen_id, teacher_id, kind, x, y, w, h, z, state jsonb)
```

`class_id?` — ixtiyoriy, chunki Doska sinfga bogʻlanmasdan ham ochilishi kerak (R134). Lekin bogʻlansa Random Name/Group Maker roʻyxatni **avtomatik** oladi.

**R134 — ⚠️ Bepul rejimda ekran SAQLANMAYDI.** Modalda: *"Your screens are not saved. Upgrade to Pro to save your work."* Va URL'da `local-only-team-id` — yaʼni anonim seans, hech qayerga yozilmaydi.

**Biznes qarori bizga toʻgʻri kelmaydi:** Oʻzbekistondagi oʻqituvchi har dars ekranni qayta yasay olmaydi; saqlash bizda **bepul**, chunki qiymatimiz boshqa joyda (roʻyxat, oʻlchov, jurnal).

**Lekin texnik naqsh juda foydali.** `/doska` **kirmasdan ochilishi kerak** — oʻqituvchi darsga kirdi, projektorni yoqdi, 3 soniyada taymer kerak. Naqsh:

| Holat | Xatti-harakat |
|---|---|
| Kirmagan | Ekran localStorage'da ishlaydi, hamma vidjet ochiq |
| Kirgan | Server bilan sinxron, sinf roʻyxati ulanadi |
| Kirmagan → kirdi | Lokal ekran **serverga koʻchiriladi**, yoʻqolmaydi |

Uchinchi qator muhim: koʻchirish boʻlmasa, oʻqituvchi ishini yoʻqotadi va qaytib kelmaydi.

**R135 — ⭐ Interaktsiya tizimi `data-*` atributlar orqali MARKAZLASHGAN.** DOM'da: `data-interaction-object-type` · `data-interaction-object-id` · `data-interaction-target-type` · `data-interaction-has-drag` · `data-interaction-has-click` · `data-interaction-is-target-base` · `data-interaction-stop-interactions`.

Yaʼni **bitta global dispatcher** hujjat darajasida sudrash/tanlash/bosishni boshqaradi; har vidjet oʻz listenerini qoʻymaydi. 25 vidjet × 4 hodisa = 100 listener oʻrniga **bitta**.

Bizda `@dnd-kit` bor va u shu gʻoyaga yaqin, lekin **tanlash, koʻp-tanlash, oʻlchash va aylantirish** uchun aynan shu naqsh olinadi: vidjet komponentlari **soqov** boʻladi (faqat chizadi), harakat esa `src/components/doska/InteractionLayer.tsx` da.

**R136 — Z-indeks qatlamlari raqamlangan va ajratilgan.** DOM'dan oʻqiladi:

| Qatlam | z-index |
|---|---|
| Ekran mazmuni (fon, vidjetlar) | `1` |
| Obyekt chegaralari va tanlov | `2` |
| Blur niqobi (ekran chekkalari) | `1000010` |
| Oʻlcham tutqichlari (8 ta) | `1000095` |
| Vidjet paneli | `1000100` |
| Kontekst asboblar paneli | `1000105` |
| Yuqori tugmalar | `1000110` |
| Tooltip va toast | `1001000` |

Bizda `z-1…z-50` shkalasi bor, lekin Doska uchun **aniq qatlam xaritasi** shart — vidjetlar bir-birining ustiga chiqadi va tartib chalkashsa tuzatish qiyin. `globals.css` ga nomlangan tokenlar sifatida yoziladi.

**R137 — Yagona tooltip instansiyasi.** Har elementda `data-tooltip-text="..."`, sahifada esa **bitta** `<span id="tooltip">` va uni joylashtiruvchi mantiq.

Bizning shadcn `Tooltip` har element uchun portal yaratadi — bu dashboard'da toʻgʻri, lekin **25 vidjet + 12 tugmali panel** uchun qimmat. `stage` sirti uchun bitta global tooltip komponenti yoziladi (`data-tooltip-text` naqshi bilan).

**R138 — Vidjet paneli uchun MAXSUS breakpointlar: `bar-sm: bar-md: bar-lg: bar-xl:`.** Ekran kengligiga emas, **panelning oʻz konteyneriga** qarab moslashadi (vertikal ↔ gorizontal, yorliqli ↔ yorliqsiz).

Bu R98 dagi konteyner-soʻrov qarorining ikkinchi koʻrinishi. Bizda `@container` bor — Doska paneli aynan shunday qilinadi, `md:`/`lg:` bilan emas.

**R139 — Fon rasmlari juft fayl va ikki qavat bilan.** Manba: `backgrounds/theme/summer/11.jpg` + `11btn.jpg` (tanlash tugmasi uchun eskiz). DOM'da esa fon **ikki qavat**: koʻrinadigan (`z-index: 2`) va ostidagi (`z-index: -1`) — fon almashganda **titrash boʻlmaydi**, yangisi ostida yuklanib boʻlib, keyin almashadi.

Arzon naqsh, projektorda sezilarli. Bizning fon kutubxonamiz shu qolipda: `<name>.jpg` + `<name>btn.jpg`.

**R140 — Realtime steki uchinchi marta boshqacha: FIREBASE RTDB** (`firebase-database` moduli bundle'da).

| Mahsulot | Realtime |
|---|---|
| Blooket | Colyseus (R80) |
| Kahoot / Wayground | oʻz socket qatlami |
| classroomscreen | **Firebase RTDB** |

Uchtasi uch xil — yaʼni **sanoat standarti yoʻq**, va bu F boʻlimdagi "qarorni keyinga surish" tanlovimizni yana bir bor oqlaydi.

⭐ Muhimrogʻi: Doska'ga realtime **nima uchun** kerak boʻlgani — `Poll` vidjeti (oʻquvchi telefonidan ovoz beradi) va jamoa bilan boʻlishish. Bizda `Poll` allaqachon **Baholash sessiyasi** (`grading: none`, B5.2), demak **Doska uchun alohida realtime qatlami umuman kerak emas** — u Baholash oqimini qayta ishlatadi. Bu ost-loyihalarni birlashtirish qarorining toʻgʻridan-toʻgʻri dividendi.

**R141 — 25 vidjetning bizdagi qamrovi.** Koʻrik natijasi: **koʻpchiligi bizda allaqachon bor yoki bepul keladi.**

| classroomscreen | Ustozona Doska |
|---|---|
| background · image · text | ✅ oddiy |
| **poll** | ✅ **alohida qurilmaydi** — Baholash `grading: none` (B5.2) |
| **randomizer** (random name) | ✅ gʻildirak primitivi (R111) — **sinf roʻyxatidan** |
| **group maker** | ✅ roʻyxat + **xulq ballari va davomat bilan** — bizning ustunligimiz |
| **timetable** · calendar · clock | ✅ **jonli** — `useTimetableStore` + qoʻngʻiroq jadvali + oʻquv yili |
| timer · visual timer · stopwatch · event countdown | 🆕 **toʻrttasi bitta taymer primitividan** (`mode` bilan) |
| **draw** | ✅ `DrawBoard` — Baholash va taqdimot bilan umumiy (R107) |
| **qr code** | ✅ Baholash PIN'iga ulanadi |
| pdf · video | ✅ dars hujjati + YouTube (B4.3) |
| traffic light · work symbols · dice · hyperlink · sound level | 🆕 arzon, sof client (`sound level` — Web Audio API) |
| **stickers** | 🆕 `docs/illustrations.md` dagi mavjud oiladan — bepul |
| **embed** | ⚠️ oq roʻyxat shart (Ochiq masala №22) |
| **scoreboard** | ⚠️ **ehtiyot boʻlinsin** — bu `behavior_points` bilan chalkashmasligi kerak. Doska'dagi hisoblagich **efemer** (dars oxirida oʻchadi), xulq balli esa **doimiy yozuv**. Ikkitasi bir tugma boʻlib qolmasin |
| webcam | ⚠️ kamera ruxsati + maxfiylik — v1 dan tashqarida |

**Xulosa:** 2-bosqich (Doska) taxmin qilganimizdan **arzonroq** — vidjetlarning yarmi mavjud domenlardan (timetable, roʻyxat, xulq, illyustratsiya, Baholash) bepul keladi. Haqiqiy yangi ish: kanvas + interaktsiya qatlami (R135) + taymer primitivi + 5 ta mayda vidjet.

**R142 — Shablonlar SEL va XULQ ustiga qurilgan.** Toifalar: `Daily screens · Brain breaks · Language arts · SEL · Games`. Shablon nomlari: *Zones of regulations*, **Positive behavior jar**, *Would you rather*, *Question of the day*, *Daily agenda*, *Dismissal routine*. 150+ shablon.

Bizda `behavior_points`, `behavior_rewards`, `behavior_redemptions` **allaqachon bor** va xulq domeni ishlaydi. Yaʼni *"Positive behavior jar"* bizda **haqiqiy maʼlumot bilan** ishlaydi — ularda esa shunchaki rasm. Bu Doska ↔ xulq bogʻlanishi 2-bosqichda ochiladi.

⚠️ Lekin `ustozona-v1.md` §2 chegarasi eslansin: xulq ballari **koʻrsatiladi**, oʻzlashtirishga aralashtirilmaydi.

**R143 — Ikkita mayda, lekin qimmatli detal.**

1. **`<html class="notranslate" translate="no">` + `<meta name="google" content="notranslate">`.** Sabab: brauzer avtomatik tarjimasi sinf ekranidagi matnni buzadi — oʻqituvchi oʻzbekcha yozgan topshiriq inglizchaga oʻgirilib ketmasin. Bizga ham kerak, ayniqsa `stage` sirtida.
2. **Til fayllari orasida `bre` (breton), `cor` (korn), `haw` (gavayi), `ast` (asturiy).** Bunday tillarni kompaniya tarjima qilmaydi — bu **jamoaviy tarjima**. E boʻlimga qoʻshimcha: biz `uz/ru/en` ni oʻzimiz qilamiz, `kaa/ky/kk` esa **jamoa** yoʻli bilan ochiladi (hozir "tez orada" holatida).

---

### Wayground — yaratish oqimi (R144–R148)

Manba: `wayground.com/explore/admin?tab=create` skrinshoti (2026-07-30).

**R144 — Yaratish uch amaldan boshlanadi, keyin RESURS TURI tanlanadi.** Yuqorida: `Create a resource` · `Search for resources` · `Upload & enhance your content`. `Create` bosilganda **besh tur** chiqadi. Yaʼni "yangi kviz" degan yagona kirish nuqtasi yoʻq — oʻqituvchi avval nima quryotganini aytadi.

Bu naqsh uchinchi marta chiqdi va har safar boshqa darajada: R34 (Kahoot) — **savol** darajasida (`Add · Find · Generate · Import`); R66 (Blooket) — **usul** darajasida (`Manual · Import · CSV · AI`); R144 (Wayground) — **resurs** darajasida. Uchinchisi bizga toʻgʻri keladi, chunki R42 haqiqiy oʻqituvchi kviz emas, **dars** quradi deb koʻrsatgan edi (bu xulosa R145 bilan qisman qayta koʻrib chiqildi — pastga qarang).

**R145 — ⚠️⚠️ Taqdimot — BAHOLASH ICHIDAGI RESURS TURI.** Tavsifi aynan: *"Presentation — Slides with questions and whiteboard"*. Yaʼni slayd + savol + **doska** bitta resursda.

Bu B3.1 farazini (*"slayd muharriri qurilmaydi, mavjud dars hujjati taqdimot boʻladi"*) buzadi va foydalanuvchi qarori bilan mos keladi: `/dashboard/lessons` — faqat **dars rejalashtirish**; taqdimot esa Baholash resursi. `container_kind: "lesson"` qiymati shu bois notoʻgʻri nomlangan edi — u `deck` boʻladi.

⭐ Va "and whiteboard" qismi R107 ni tasdiqlaydi: annotatsiya/doska — taqdimotning ichidagi qatlam, alohida mahsulot emas. Yaʼni Doska ↔ Taqdimot ↔ `draw` shakli — bitta `DrawBoard` primitivi (R107 da yozilgan).

**R146 — `Passage` — bizda yoʻq boʻlgan toʻrtinchi konteyner.** *"Questions based on a passage"* — matn boʻlagi va unga bogʻlangan bir nechta savol.

Bu bizga kutilganidan qimmatroq: ona tili, adabiyot va ingliz tilida oʻqib-tushunish topshirigʻi aynan shu shaklda. Hozir bizda matn savolning ichiga yoziladi, yaʼni bir matnga 5 savol bogʻlansa matn 5 marta takrorlanadi. → `container_kind: "passage"`, matn `config` da. Yangi jadval kerak emas.

**R147 — `Flashcards` resurs turi sifatida chiqarilgan, lekin bizda konteyner emas.** *"Questions on front, answers on back"* — bu bizning `pairs` shaklimiz ustidagi shablon (B2 da allaqachon boshlangʻich toʻplamda). Yaʼni sxemaga qoʻshimcha kerak emas, faqat yaratish menyusida alohida yozuv boʻlsin — oʻqituvchi "pairs" degan soʻzni bilmaydi (R27 bilan bir oilada).

**R148 — Ikki mayda detal.** (a) Oʻng yuqorida `Enter code` — oʻqituvchi ham sessiyaga qoʻshila oladi (hamkasbnikini sinab koʻrish). Arzon, bizda ham boʻlsin. (b) `Create activities from anywhere` — Chrome kengaytmasi: olinmaydi, alohida mahsulot va katta ish.

Yon kuzatuv: ularning sidebari toʻrt yozuv — `Home · My library · Sessions · Students`. Kutubxona va sessiyalar alohida yuqori darajali boʻlim; bu bizning `/dashboard/baholash` (kutubxona) + sessiyalar roʻyxati ajratmamizni tasdiqlaydi.

**Buning natijasi — `container_kind` qiymatlari aniqlashtirildi:** Assessment→`none`, **Presentation→`deck`** (ilgari `lesson` — nomi ham, maʼnosi ham notoʻgʻri edi), Video→`video` (allaqachon bor), **Passage→`passage`** (yangi), Flashcards→konteyner emas (`pairs`+shablon). Dars rejasi (`/dashboard/lessons`) `container_kind` emas — alohida artefakt, kerak boʻlsa activity set'ga havola qiladi, oʻz ichiga olmaydi. Sxemaga taʼsiri: 0 jadval, 0 ustun — faqat enum qiymatlari.

### EMStudio — haqiqiy hisob (R149–R159)

Manba: `emstudio.pro` — skrinshotlar + toʻliq DOM (2026-07-30). ⚠️ Bu marketing demosi emas: aynan oʻsha oʻzbek informatika oʻqituvchisining oʻz hisobi (5-A…9-A, Toʻgarak guruhlari) — R42–R61 kabi "haqiqiy maʼlumot" darajasi. Toʻrtinchi mahsulot, bir xil oʻqituvchi.

**R149 — ⭐⭐⭐ ENG MUHIM: kviz bir mahsulotda, baho boshqasida. Qoʻlda koʻchiriladi.** Topshiriq nomlari vositani oʻzida yozib qoʻygan: `1. 1. Wayground` · `2. 2. Kahoot!` · `4. 1. Elektron tijorat (W)` + `4. 2. Elektron tijorat (K)` (bir mavzu, ikki platforma → ikki jurnal ustuni) · `5. 1. Raster va Vektor (W)` + `5. 2. Raster va Vektor (B)` (Blooket). Natija panelida: `Turned in 0` · `Graded 7` — jurnalga hech narsa topshirilmagan, ballar (92·83·92·92…) qoʻlda kiritilgan.

Yaʼni oqim: Wayground'da test → EMStudio'da qoʻlda topshiriq → nomiga `(W)` → ballarni bittalab koʻchirish. **Ustozona Baholash aynan shu uch qadamni bittaga aylantiradi** — bu endi daʼvo emas, foydalanuvchining oʻz maʼlumotidagi dalil.

**R150 — "Classwork" va "Grades" alohida sahifa.** Sidebar guruhlari: *Planning* (Lessons · Students · Classwork) va *Assessment* (Grades · Attendance · Standards). Google Classroom va Canvas'dan keyin uchinchi mustaqil tasdiq: topshiriqlar roʻyxati ≠ jurnal matritsasi.

**R151 — Topshiriqlar TOIFA boʻyicha guruhlanadi; "Other" avtomatik chelak.** Haqiqiy toifalar: `Formativ 8` · `Loyiha ishi 1` · `Summativ 0` · `Other 2` (nomsizlarida `Draft` yorligʻi). Ularda `topicId` nullable; bizda ham xuddi shunday tuzatildi (C6 — "Toifasiz" virtual chelagi).

⚠️ Diqqat: oʻqituvchi toifalarni *"Formativ"/"Summativ"* deb nomlagan — yaʼni toifani **maqsad sifatida** ishlatgan. Bizda `topics.purpose` alohida maydon; UI buni ikki marta soʻramaydi.

**R152 — ⭐ Kviz uchun aniq UI joyi: topshiriqning BIRIKTIRMA qatori.** Beshta doira tugma: `Drive` (oʻchiq) · `YouTube` · `Create` (oʻchiq) · `Upload` · `Link`. `Create` — Google Classroom naqshi (yangi resurs yasash). Bizda aynan shu joyga Test · Taqdimot · Video · Matn tushadi (R144/R145 bilan bir oila).

**R153 — Muharrir maketi va kichraytirish.** Chapda mazmun (Title · Instructions · Attachments), oʻngda Details (Class · Topic · Due date · Score `100` · Assign to), chetda ikonkali reyk: `Details` ↔ `Student Work`. Dialog **yopilmasdan kichraytiriladi** — oʻqituvchi topshiriqni parkovka qilib boshqa narsaga qaraydi.

**R154 — `Assign to`: topshiriq sinfning bir QISMIGA beriladi.** *"All 16 students"* tanlanadigan. Bizda `assignments` faqat `classId` ga bogʻlangan. Differensiatsiya — real ehtiyoj → Ochiq masalalar №29.

**R155 — Natija paneli: `Assigned 9 / Turned in 0 / Graded 7` + "Missing".** Ball jadvalida yoʻqlar qizil `M`, borlar yashil `92/100`. Ularning tablari oʻquvchi topshirishini faraz qiladi — bizda v1 da oʻquvchi akkaunti yoʻq, tablar koʻchmaydi. Lekin `Missing` koʻchadi: u R122 dagi `unattempted` holatining aynan oʻzi.

**R156 — ⚠️ `Return` tugmasi: baho oʻquvchiga QAYTARILADI.** Baholash ikki qadam: ball kiritish → qaytarish; qaytarilmaguncha oʻquvchi koʻrmaydi. Bizda bu qaror yoʻq va Shogird (3-bosqich) uchun jiddiy: chala kiritilgan ball ota-onaga darhol ketmasligi kerak → Ochiq masalalar №30.

**R157 — Landing: xususiyat + persona + taqqoslash sahifalari.** Footer ustunlari: *Features* (6 xususiyat sahifasi) · *Built for* (4 persona) · *Free Tools* · Resources · Company · Legal. Nav'da `Compare` — 5 raqobatchi bilan taqqoslash sahifasi. Bizga tuzatish: ularniki bitta mahsulot, shuning uchun xususiyat sahifalari; bizda ost-loyihalar haqiqatan alohida → **mahsulot** sahifasi toʻgʻri (A ish). Persona/taqqoslash — arzon qoʻshimcha SEO yoʻli, keyinroq.

**R158 — ⭐ "Free Tools" — akkauntsiz, bitta vazifali vosita.** *"Seating Chart Maker — free in your browser, no account needed."* Bu `/doska` uchun tanlangan mehmon strategiyasining mustaqil tasdigʻi (classroomscreen R134 dan keyin ikkinchi marta).

**R159 — Biznes va texnik faktlar.** Narx: Free (sinovdan keyin faqat oʻqish) · Pro $9/oy yillik yoki $12/oy · School $7/oʻrin (min 5). 30 kunlik sinov, karta soʻralmaydi. Stek: Supabase + Cloudflare R2 + Stripe + PostHog + GA. Huquqiy: FERPA/COPPA/GDPR + sub-processors + DPA.

⚠️ 19 tilda, roʻyxatda **oʻzbek tili bor**. Raqobatchi allaqachon oʻzbekcha gapiradi — bizning ustunligimiz til emas: DTS/DTM, Telegram, emailsiz ota-ona, qogʻoz/OCR, va R149 dagi jurnal↔kviz birlashuvi.

**Natija:** Sxemaga taʼsiri 0 jadval — `assignments` ga `kind`/`instructions` allaqachon qoʻshildi (C6). Eng qimmatlisi sxema emas: R149 — bir mavzu ikki platformada ikki jurnal ustuni yaratgan, ballar qoʻlda koʻchirilgan. Butun Baholash loyihasining asosi shu dalilda. Ochiq masalalarga ikkitasi qoʻshildi: №29 differensiatsiya, №30 bahoni qaytarish.

### Wayground — jonli dars/oʻyin (R160–R174)

**R160 — Haqiqiy darsda savollar slaydlardan 2–4 BAROBAR koʻp.** "04. Elektron tijorat (9-sinf)": 6 slayd → 12 savol (2×). "1-dars. Informatika (7-sinf)": 4 slayd → 15 savol (~4×). Taqdimot "slaydlar toʻplami" emas — **savollar toʻplami**, orasida slayd. R145 ning qatʼiy tasdigʻi: taqdimot = Baholash resursi, dars rejasi emas.

**R161 — Uchta ishga tushirish tugmasi.** `Preview · Assign · Start now` — koʻrib chiqish · uy vazifasi (`selfpaced`) · jonli (`live`). Yon paneldagi eskizlar savol turi bilan yorliqlangan (`Open Ended`, `Multiple Choice`) — arzon, olinadi.

**R162 — Sinf bitta emas, ORALIQ boʻlishi mumkin.** `6th – 8th Grade`. Bizda `activity_banks.grade` bitta qiymat. Kichik, lekin yozib qoʻyilsin: `grade` → oraliq yoki koʻp qiymat (kelgusi).

**R163 — ⭐⭐ Assessment va Presentation sahifalari TUBDAN boshqacha.** `container_kind: none` (test) → rollar YOʻQ, hamma element teng, chap ustunda "Improve your activity" (AI). `container_kind: deck` (taqdimot) → rollar bor, chap ustunda slayd eskizlari. Sabab pedagogik — taqdimotda darsning yoʻli bor (eslash→tekshirish→chiqish), testda esa savollar teng. Va "jurnalga nima tushadi" resurs turidan hal boʻladi: Test → butun test, Taqdimot → chiqish chiptasi (standart).

**R164 — ⭐ "Improve your activity" — yaratgandan keyingi AI paneli.** `Add similar questions` (uslubni davom ettirish) · `Translate quiz` (⭐⭐ uz↔ru↔qoraqalpoq — ikki tilli maktabda katta qiymat) · `Generate flashcards` (test→fleshkarta, R147 bilan bir oila). Bu B4.4 ga qoʻshiladi — yaratishdan keyingi AI, oldingi emas.

**R165 — Uchta tasdiq.** `10 questions • 10 Points` → `assignments.maxScore` = ballar yigʻindisi · `Show answers` tumbleri (projektor yoniq holda tahrirlash) · `30 sec` roʻyxatning oʻzida (R68 ✅) · matematika KaTeX bilan (R64 ✅).

**R166 — ⭐⭐⭐ HAR SAVOLDA IKKITA TEG: standart VA BLUM DARAJASI.** `Passage` turidagi savollarda har birida `Standard` (masalan RL.6.3) **va** `Bloom's Taxonomy` (Analyze/Apply/Understand/Create) belgisi bor.

⭐⭐⭐ **Bu loyihadagi ochiq masalani yechadi.** Oʻquvchi profilida Blum radar diagrammasi bor, lekin maʼlumoti soxta edi — manba yoʻq edi. Manba mana bu: javoblar → Blum darajasi boʻyicha guruhlash → haqiqiy radar. Narxi: bitta ustun — `activities.bloom_level`. Oʻqituvchidan soʻralmaydi: AI qoʻyadi + oʻqituvchi tasdiqlaydi (R46 naqshi); savol turi ham signal beradi (`Open Ended` ≈ Create). ⚠️ **Navbat qarori:** tahlilning oʻzi v2, lekin ustun 1-bosqichda qoʻyiladi — keyin qoʻshilsa oʻtmishdagi savollar tegsiz qoladi.

**R167 — `Passage` maketi tasdiqlandi: ikki ustun.** Chapda matn (aylanadigan quti), oʻngda savollar. Matn bir marta yoziladi, N savol unga havola qiladi — `container_kind: passage` (R146) aynan shu.

**R168 — Savol turlari: yangi shakl YOʻQ, hammasi qamrab olingan.** Multiple Select→`mcq`+koʻp `isCorrect` · Categorize (nomlangan guruhlar)→`categories` · Drop Down→`cloze` render varianti · Drag & Drop (ikkita boʻshliq)→`cloze`+`DragBoard` · Open Ended→`text`. ⭐ Vaqt chegarasi savol turidan kelib chiqadi: MC 30s · Drop Down/Drag&Drop 1.5daq · Categorize/Open Ended 3daq — yassi standart emas, `config.defaultTimeLimit` ustiga tur boʻyicha taklif.

**R169 — `Evaluate responses using AI: OFF` — HAR SAVOLGA alohida tumbler.** Bizning qulflangan pozitsiyamizni tasdiqlaydi: AI baholash majburiy emas, faqat qoralama (`grading: aiDraft`), oʻqituvchi tasdiqlaydi.

**R170 — `Draft → Publish` + resurs darajasidagi `Undo`; `Premium` yorligʻi.** Yangisi — muharrirdagi `Undo` (oxirgi tahrirni qaytarish); bizda undo rejalashtiruvchida bor, muharrirda yoʻq (keyingi).

**R171 — ⭐⭐ `Slide` — SAVOL TURI. Bu bizning sxemadagi boʻshliq.** Boʻsh muharrirning `Question types` galereyasida oxirgi guruh `Other`da yagona yozuv: `Slide`. Taqdimot — bitta tartiblangan roʻyxat, ichida slayd ham, savol ham. Bizda 11 shakl bor, `slide` yoʻq — qoʻshiladi: `shape: slide` (faqat mazmun, javob yoʻq), `grading: none` (allaqachon bor — soʻrovnoma/soʻz buluti bilan bir mexanizm).

**R172 — Entry/Exit Ticket bu galereyada YOʻQ → R46 xulosasi yakuniy.** 24 turning hech biri rol emas. Uchta mustaqil oʻq: **Shakl** (oʻquvchi nima qiladi: mcq/cloze/draw/slide…) · **Baholash** (ball qanday: exact/partial/none…) · **Rol** (darsda nima uchun: entry/check/exit, faqat `deck`). Rol — tur ham emas, baholash ham emas; AI dars yaratganda qoʻygan (R46).

**R173 — Yetishmayotgan shakllar: 3 ta, lekin faqat bittasi muhim.** `Slide` ✅ qoʻshiladi (R171). `Table Fill In`+`Match Table Grid` ⏳ ikkalasi jadval katakchalari → bitta shakl (`grid`) ikki rejim, keyinga. `Graphing` ❌ olinmaydi (Desmos v1dan chiqarilgan). ⭐ ⚡ (pullik) belgisi yoʻq boʻlgan 10 tur: Multiple choice, Multi-select, True/false, Fill in blanks, Open ended, Table Fill In, Draw, Poll, Word cloud, **Slide** — bepul turlar asosiylari, pullik esa sudrash/yuqori-tartibli.

**R174 — Tanlagich UI'sining toʻrtta detali.** (1) "Hover to preview" sarlavha yonida ochiq yozilgan — bizda 12 shakl boʻladi → majburiy. (2) Guruh boʻyicha rang: Basic pushti · Interactive yashil · Visual toʻq sariq · Math sariq · Open ended koʻk · Slide qora — arzon, olinadi. (3) Boʻsh holatda birinchi turgan narsa QIDIRUV, yaratish emas; boʻsh test ishga tushmaydi (`Add at least one question` oʻchirilgan). (4) Import: `Spreadsheet` (bizda `xlsx` bor) · `Google Forms` (olinmaydi).

### EMStudio — toʻliq DOM (R175–R192)

Manba: `emstudio.pro/dashboard` sahifasining toʻliq HTML'i (2026-07-30). Ikki sahifa bitta HTMLda: `<title>`/RSC yuklamasi — landing, `<body>` render — jurnal (client-navigatsiya izi).

**R176 — ⭐⭐ Butun tarjima lugʻati HAR sahifada HTMLga solinadi.** `landing·legal·blog·auth·onboarding·pricing·common·nav·validation·toasts` — hammasi har yuklamada (~100KB+). ⚠️ **Koʻchirilmaydi** — jurnalni ochgan oʻqituvchi blog/maxfiylik siyosati matnini ham yuklamasin.

**R177 — ⭐⭐⭐ Narx modeli toʻliq ochiq.** Free (0, sinovdan keyin faqat OʻQISH, 3 sinf/50 oʻquvchi/100 dars, AI/fayl yuklash yoʻq) · Pro ($9/oy yillik yoki $12/oy, cheksiz, 100k AI kredit, 100GB) · School ($7/oʻrin/oy yillik, min 5 oʻrin, admin panel+SSO+umumiy kutubxona). 30 kunlik Pro sinovi, karta soʻralmaydi. ⭐ Kalit qaror: bepul tarif — funksiya kesimi emas, **rejim kesimi** (yozish oʻchadi, maʼlumot qoladi).

**R178 — ⭐⭐⭐ Sinov tugashi — oltita bosqichli konversiya zinapoyasi.** 14/7/3/2/1/0-kun sarlavhalari (*"halfway through"* → *"has ended, read-only"*), `At risk` ramkasi 3-kundan, oʻz maʼlumoti sanogʻi (yoʻqotish qoʻrquvi), ikki xil kechiktirish, `continueReadOnly` chiqish yoʻli, asoschi iqtibosi. ⭐ Bu funksiya emas, **mahsulot** — yozilishi kerak boʻlgan matn hajmi bir sahifadan katta (keyingi bosqich, monetizatsiya rejalashtirilganda).

**R179 — ⭐⭐ Onboarding: profil savollari roʻyxatdan OLDIN.** Rol→qiymat ekrani→fanlar→qiymat ekrani×2→sinf hajmi→dars soni→**roʻyxatdan oʻtish**→planner intro→semestr→jadval turi→timetable→sinov taymeri→tarif taqqoslash. Ikki naqsh: profil savollari emaildan oldin (sarflangan mehnat taʼsiri) + savollar orasiga uchta marketing ekrani qistirilgan.

**R180 — ⭐⭐ `toasts` lugʻati = funksiya inventari.** 250+ xabardan: hisobot varaqasi generatsiyasi, **semestrni koʻchirish** (sinf/oʻquvchi/dars/blok/toifa/standartlarni yangi yilga birdan olib oʻtish), darsni jadval katagiga "ulash"/uzish, fikr doskasi "tashabbus" qatlami, chat rate limit, fon vazifalar navbati, **10 soniyalik undo** hamma oʻchirishda, jadval istisnolari (kunni bekor/standartga qaytarish/koʻchirish), aniq chegara raqamlari (masalan "maximum 50 custom standard sets"). Foydali funksiya inventari — kelgusi bosqichlarga ilhom.

**R181 — `validation` lugʻati = maydonlar roʻyxati.** Ota-ona emaili maydoni, toifa vazni 0–100, sana formati, fayl 10MB chegarasi.

**R182 — Landing 13 blokdan.** Hero→StatsBar→SpotlightSlideshow→Testimonial→EaseOfUseAccordion→LessonPlanningSection→CTA→BuiltForSection→LocalesCallout→**GetDoneSection**→ComplianceSection→Faq→FinalCta. ⭐ `GetDoneSection` — "30 kunda nima qila olasiz" (Today/Day5/Day30), natija tilida: *"End-of-quarter grading takes an afternoon, not a week"*.

**R183 — Xususiyat matni: 5 domen × 5 yozuv.** Dars: kaskad surish (band katakka tashlansa hafta oldinga suriladi) + shablon bilan topshiriqlar koʻchishi. Sinf: 31 mamlakat bayram kalendari, 8 haftagacha rotatsiya. Jurnal: shkala presetlari, har toifa oʻz baholash rejimida, `excused` oʻrtachadan chiqadi. Davomat: har statusning foizga taʼsiri sozlanadi + heatmap. Kurrikulum: Common Core/NGSS/TEKS/50 shtat/IB/Cambridge.

**R184 — Uch marketing yoʻli.** `Compare` (5 raqobatchi bilan taqqoslash) · `Built for` (4 persona) · ⭐ `Free Tools` (*"Seating Chart Maker … no account needed"* — R158 tasdigʻi).

**R185 — ⭐ Oʻsish dvigateli auditoriya koʻchirish.** *"From the creators of Notion4Teachers"*, `50 000+ teachers · 140+ countries · 4.9`.

**R186 — Jurnal jadvalining muhandisligi (toʻliq DOM).** Sticky thead + sinf oʻrtachasi qatori + ism/Total ustunlari; ustun sarlavhalari vertikal; toifa rangi fon+pastki chiziq; oxirida `+ Add` ustuni; ⭐ har katakda `data-student-index`/`data-assignment-index` → **klaviatura navigatsiyasi** (Excel kabi, arzon olinadigan); ContextMenu ikki joyda; avatar hover profilga `?classId=` bilan oʻtadi.

**R187 — Ikki panel CSS Grid animatsiyasi bilan.** `grid-template-columns` transition (350ms) — panel `width` bilan emas, grid ustuni bilan yigʻiladi.

**R188 — ⚠️ Boʻsh holat xatosi: `Class Average 0%` — KOʻCHIRILMAYDI.** Hech kimga baho qoʻyilmagan holatda sinf oʻrtachasi "0%" deb yozilgan (toʻgʻrisi `—` boʻlishi kerak edi). Bizda `formatByScaleKind`/`—` mantigʻi bu xatoni allaqachon oldini oladi — tekshirilsin, saqlab qolinsin.

**R189 — Dizayn tizimi detallari.** Olti shrift oilasi (ortiqcha — koʻchirilmaydi), `data-bg-pattern` fon naqshi + inline FOUC-oldini oluvchi skript, `data-compact` sidebar, balandliklar CSS var'da.

**R190 — Onboarding tur DOM'da koʻrinadi.** `data-tour="..."` atributlari + `sr-only` live region (*"Step 3 of 3"*) — skrinreader uchun ham qadam oʻqiladi. Bizning mavjud tur tizimimizga (`product-tour-system`) qoʻshimcha eslatma.

**R191 — Stek.** Supabase auth alohida subdomen · Stripe · PostHog · GA `DeferredGA` (rozilikdan keyin) · Cloudflare R2 · FullCalendar · sonner · Lottie · ⭐ oʻz avatar proksisi (`/api/avatar/...` — Google 403 muammosini shu bilan yopgan, [[google-avatar-referrer-gotcha]] bilan bir oilada) · `/blog/rss.xml`.

**R192 — ⚠️ Yuk ortiqchaligi — KOʻCHIRILMAYDI.** ~130 alohida JS chunk, ikki otf shrift preload, Lottie CSS ikki marta kiritilgan, hero rasm 8 oʻlchamda, va R176 dagi eng qimmati: dashboard'da marketing lugʻati.

**Natija:** Sxemaga taʼsiri 0 — bu blok koʻproq mahsulot/monetizatsiya sabogʻi (R177–R180) va ikkita "koʻchirilmaydigan xato" (R188, R192) beradi.

### EMStudio — Classwork Topics (R193–R202)

Manba: 9 skrinshot (2026-07-30) — `Create` menyusi, `Classwork Topics` modali, `Overall Grade Scale` modali, jurnal jadvali (11 topshiriq, 64 qoralama).

**R193 — ⭐⭐⭐ `purpose` maydoni ularda YOʻQ; vazn uni yutgan.** Toifa maydonlari: sinflar · nom+rang · `INPUT MODE: Select|Score` · `WEIGHT: Weighted N%|No Weight` · `GRADING SCALE`. Summativ/Formativ soʻralmaydi — ular *"yakuniy bahoga kiradimi"* (natija tili) deb soʻraydi, biz *"summativmi/formativmi"* (pedagogika atamasi) deb soʻraymiz. Bizniki qulflangan qoladi, chunki `purpose` bizda Holat ustuni, ishonchlilik signali va transfer diagnostikasini boqadi — vazn buni ajratolmaydi.

**R194 — ⭐⭐ `WEIGHT — Score only`: vazn faqat Score rejimida koʻrinadi.** `Select` tanlansa `Weighted` dropdown butunlay yoʻqoladi — **strukturaviy taqiq**, bizdagi kabi maslahat-alert emas.

**R195 — ⭐⭐ `Select` rejimi = shkaladan YORLIQ tanlash, ikkilik emas.** MIN%/MAX% ustunlari yoʻqoladi, faqat LABEL qoladi — A+, A, A−… hammasi tanlanadigan. ⚠️⚠️ **Bizda nuqson topildi:** spec §4 sifat yorliqlarini (Aʼlo/Yaxshi/...) sanaydi, lekin `select` rejimi qatʼiy ikkilik edi (`passLabel`/`failLabel`, 100/0). Tuzatish: tanlangan tierning **oʻrta foizi** saqlanadi — `tierMidpoint()` funksiyasi `grade-scale.ts`ga yozildi (C2, hali select-rejim UI'siga ulanmagan).

**R196 — ⭐⭐⭐ `Overall Grade` — toifalar roʻyxatining boshida qadalgan qator.** `🎓 Overall Grade` + `Total column` yorligʻi + shkala chipi + qalam → modal: CLASS tanlovi · preset · tierlar · PREVIEW · `Apply to all my classes`. ⚠️ Bizda yakuniy shkala bitta oʻqituvchiga bitta edi — **C3 bilan tuzatildi** (`journalScaleByClass[classId]`, jonli).

**R197 — ❌ Tahrirlanadigan MIN%/MAX% jadvali + `Custom` preset — OLINMAYDI.** Spec §4 buni ataylab qulflagan (standartlar izchilligi, cut-score tahriri v1da yoʻq) — bu qaror **qoladi**, EMStudio buni qilsa ham. 📌 Ularning presetlari oʻzbek shkalasini bilmaydi (5-ballik yoʻq) — bizning 10 presetimiz kuchliroq.

**R198 — ⚠️ TUZATILDI: `Create → Assignment` va `Create → Quiz` BITTA oynani ochadi.** Ikki oyna tuzilishi aynan bir xil (TITLE·INSTRUCTIONS·ATTACHMENTS·CLASS·TOPIC·SCORE·ASSIGN TO), farq faqat badge/sana yorligʻi/`Assign` tugmasi. `Quiz` — asbob emas, **yorliq** (R149 bilan mos: tashqarida oʻtgan testga jurnalda joy). ⭐⭐ Toʻgʻri xulosa: **bitta eshik** — `Yaratish → Topshiriq`, shakl (Qoʻlda/Test/Taqdimot) topshiriqning ichida tanlanadi (bu chatda kelishilgan "Topshiriqlar" sahifasi shu naqshga mos).

**R199 — Jurnal jadvalidan uch detal.** (a) `Assignments (11)` + `64 drafts` badge + qadalgan panel (*"64 draft grades not yet returned"* + `Return all`) — bizda `isDraft` bor, C5 bilan draft panel qoʻshildi. (b) Ustun sarlavhasida sinf oʻrtachasi harf+foiz birga (`B 85.7%`). (c) `Untitled assignment` ustunlari punktir ramkali, oʻrtachasi `—`.

**R200 — Topshiriq muharriri: toʻliq ekran + avtosaqlash + kichraytirish.** `Draft`/`Saqlandi` holati sarlavhada, oʻng yuqorida `Assign·⋯·—·×`, `SCORE` dropdown (erkin matn emas), `ATTACHMENTS` besh doira. — chatda kelishilgan "Topshiriqlar" sahifasi uchun **toʻgʻridan-toʻgʻri referens maket**.

**R201 — ⚠️ Ularning ikki nuqsoni — KOʻCHIRILMAYDI.** (a) Quiz oynasida yorliq `QUIZ DATE`ga oʻzgargan, ichidagi placeholder yangilanmagan. (b) Yangi topshiriq `0 of 13 students`da yaratiladi, Quiz esa `All 13`da — bir oynada ikki xil boshlangʻich qiymat. Bizda standart — barcha oʻquvchilar, izchil.

**R202 — `TOPIC: No topic` — toifa boʻsh boʻlishi mumkin.** Bizda `assignments.topic_id` NOT NULL edi — C6 bilan nullable qilindi ("Toifasiz" virtual chelagi).

**Natija:** Sxemaga taʼsiri 0 jadval, 0 ustun — `purpose`/`weightPercent`/`scaleKind` oʻz joyida qoladi. Eng qimmatlisi — ikki nuqson topilishi: `select` shkalani bilmasligi (R195/C2) va yakuniy shkalaning sinfga bogʻlanmaganligi (R196/C3, allaqachon tuzatilgan). ❌ Cut-score tahriri va `Custom` olinmadi (R197).

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

**Tashqi tasdiq (R82):** Blooket aynan shu shaklni ishlatadi — **Colyseus** (xona-asosli avtoritar server, klient/server boʻlishadigan sxema), alohida subdomenda deploy qilingan (`classic.blooket.com`), Cloudflare va Sentry bilan. Yaʼni "xona = aktor" tanlovi toʻgʻri; farq faqat ijroda. ⚠️ Colyseus bizga toʻgʻridan-toʻgʻri tushmaydi — u **doim yoniq Node jarayoni** talab qiladi, bizda esa Vercel serverless va *"doim yoniq backend yoʻq"* qarori bor. Yana bir maʼlumot: ularda bir vaqtda ulangan ishtirokchi soni **tarif oʻqi** (60 bepul / 300 pullik) — realtime sigʻimi bepul emas.

⚠️ **Texnik boʻlmagan bayroq:** Vercel Hobby tijorat foydalanishni taqiqlaydi. `teachers.plan` standarti `"free"` — demak monetizatsiya rejalashtirilgan. Pul olina boshlangan kunda Hobby — bu ToS buzilishi, tezlik masalasi emas. Pro daromaddan **oldin** budjetlanishi kerak.

---

## Bosqichlar

| # | Nima chiqadi | Yangi infratuzilma |
|---|---|---|
| **0** | i18n namespace boʻlinishi; `data-surface`/`data-product` proxy orqali; `requireTeacher()` rol darvozasi; `proxy.ts` qayta tuzilishi; ESLint chegaralari | yoʻq |
| **1** | Baholash sxemasi (6 shakl) + muharrir (`/dashboard/baholash`, uch panel + maqsad boʻyicha guruhlangan tur tanlagichi va yagona `Qoʻshish/Topish/Yaratish/Import` paneli R34, `role="switch"` javob belgilash R41) + **QR-kartalar, oʻz tezligida, OMR** + tashxis/oʻzlashtirish dvigateli + **natijalar matritsasi** (ishtirokchi × element, R45) + **uchta triaj kartasi** (qiyin savol / yordam kerak / tugatmadi, R55) + **distraktor tahlili xato-tasavvur yorligʻi bilan** (R56) + sessiyalar roʻyxati (5 holat, R49) + **bosma varaq brauzer chop etishi bilan** (R74 — dars muharriridagi mavjud naqsh; `@react-pdf/renderer` qarori OMR blankasiga koʻchdi) | yoʻq |
| **1b** | Shablon reyestri + `DragBoard` + boshlangʻich 8 shablon + 3 bosma shablon | yoʻq |
| **1c** | **Interaktiv taqdimot** — Tiptap `interactivePrompt` tuguni + qoʻshish yon paneli (R23), dars `stage` rejimi (`scale()` bilan sigʻdirish, R25), **taqdimotchi qaydlari** (R22), ochiq javob (`text`/`draw`) → CJ, anonim proyeksiya, oʻqish yordami · **jonli vositalar (R107–R114):** `DrawBoard` (annotatsiya + doska bitta primitiv), "diqqat bu yoqqa" (`focusMode`), qoʻl koʻtarish, reaksiyalar, gʻildirak, taymer boshqaruvi (`+15s`/pauza), sur'at almashtirish (`mode_boundary`, R106) | yoʻq (polling — pastga qarang) |
| **1d** | **Interaktiv video** (YouTube embed + cues) + `mathEquiv` + `imagezone`/`hottext` (+ **rasm kesish**, R19) + **Excel/CSV import** (`xlsx` mavjud) + **Kahoot/Wayground eksportidan migratsiya shablonlari** (R66) + soʻrovnoma/soʻz buluti + AI kontent generatsiyasi | yoʻq |
| **1e** | **Moslashuvlar** (R10) — `student_accommodations` jadvali + oʻquvchi boʻyicha berish UI'si. Koʻrinish sinfi 1c dagi token qatlamidan bepul keladi; qoʻshiladigani: sharoit (vaqt/urinish/muddat) va element (variant kamaytirish, ishora) + ularning javobda qayd etilishi | yoʻq |
| **2** | Doska (PWA) — `doska_decks/screens/widgets` (R133), kirishsiz ochiladi + lokal→server koʻchirish (R134), markazlashgan interaktsiya qatlami (R135), oʻqituvchi tuzadigan panel (R132); gʻildirak/quti primitivlari 1b bilan, `DrawBoard` 1c bilan umumiy. **Vidjetlarning yarmi mavjud domenlardan bepul keladi** (R141) | yoʻq (Poll = Baholash sessiyasi, R140) |
| **3** | Shogird — `student_links`, `user_telegram`, Telegram route handler'lar | Telegram bot |
| **4** | Boshqaruv — `requireSchoolAdmin()` JOIN qamrovi, faqat oʻqituvchi metrikalari | yoʻq |
| **5** | Jonli PIN-kviz + **jamoaviy rejim** + arkada/musobaqa qobiqlari (arqon tortish, poyga, Tower Defense, Gold Quest) + `meme_sets` (R16–R17; v1 da havola + mavjud illyustratsiya oilasi, yuklashsiz) | realtime (keyin qaror) |
| **∞** | Qolgan ~26 interaktiv + ~19 bosma shablon — har relizda 3–5 ta, sxema oʻzgarishisiz | yoʻq |

**Realtime ataylab oxirida.** 5-bosqichgacha hech narsaga socket kerak emas, va oʻsha paytga qadar haqiqiy sinflardan u umuman kerakmi degan maʼlumot yigʻiladi.

**1-bosqichdagi asosiy topilma:** QR-karta (Plickers) rejimida **aynan bitta yozuvchi bor — oʻqituvchining telefon kamerasi.** 30 oʻquvchi, bitta qurilma. Unga na realtime, na ishtirokchi shaxsiyati, na PIN kerak — u mavjud `action → DAL` naqshiga aynan tushadi, va har bir oʻquvchi `student_id` bilan aniqlanadi (karta oʻzi roʻyxat bogʻlovchisi), demak oʻzlashtirishni oziqlantiradi va jurnalga koʻchiriladi.

**1c-bosqichdagi topilma (nega taqdimotga realtime kerak emas):** *Instructor-paced* rejimda hammada bir xil slayd oʻzgarishi kerak — bu jonli sinxronizatsiyaga oʻxshaydi. Lekin **taqdimotda 2 soniyalik kechikishni hech kim sezmaydi.** Kahoot kvizida kechikish muhim (musobaqa), Pear Deck darsida esa yoʻq. F boʻlimidagi prinsip (`current_index` avval Postgres'ga yoziladi, keyin tarqatiladi) shuni anglatadiki, **2 soniyalik polling yetarli** — interaktiv taqdimot socket'siz toʻliq ishlaydi. Bu 1c ni 5-bosqichdan oldin chiqarish imkonini beradi.

**Haqiqiy maʼlumot bu tartibni tasdiqladi (R54):** bir oʻqituvchining ikki mahsulotdagi bir yillik ishida ~165 sessiya **oʻqituvchi boshqaradigan, sinfda** oʻtkazilgan, oʻz tezligidagi rejim esa 90 dan 3 marta ishlatilgan. Yaʼni 1c (socketsiz, polling bilan) — eng koʻp ishlatiladigan yoʻl; `selfpaced` va realtime'li oʻyin rejimi ikkinchi darajali. Bosqichlar tartibi oʻzgarmaydi, lekin **1c ga qoʻyiladigan sifat talabi oshadi** — u koʻrgazma emas, kundalik asbob.

---

## Ost-loyihalar boʻyicha qisqacha

**Doska.** Uch jadval: `doska_decks` → `doska_screens` → `doska_widgets` (R133) — Doska ham **tartiblangan ekranlar toʻplami**, bitta ekran emas. Vidjet turi **versiyalangan satr** (`"timer.v1"`, R131), enum emas: yangi versiya chiqsa eski ekranlar eski renderer bilan chizilaveradi. Kanvas + markazlashgan interaktsiya qatlami (R135) — vidjetlar **soqov**, sudrash/tanlash/oʻlchash bitta dispatcher'da; `@dnd-kit` shu qatlam ostida qoladi.

**Farqlovchi ustunlik:** classroomscreen.com sizning oʻquvchilaringizni bilmaydi — Ustozona Doska biladi. Random Name va Group Maker haqiqiy roʻyxatdan oʻqiydi; Group Maker xulq ballari va davomatni hisobga olishi mumkin. **Poll vidjeti alohida qurilmaydi** — u Baholash'ning `grading: none` soʻrovnomasi, `stage` sirtida chizilgani (B5.2); QR Code vidjeti ham xuddi shu PIN tizimiga ulanadi, va shu bois **Doska'ga alohida realtime qatlami kerak emas** (R140). Draw = `DrawBoard` primitivi (R107), Baholash va taqdimot bilan umumiy.

**Kirishsiz ochiladi (R134):** oʻqituvchi darsga kirdi, projektorni yoqdi — 3 soniyada taymer kerak. `/doska` login talab qilmaydi, ekran localStorage'da ishlaydi; kirgandan keyin lokal ekran **serverga koʻchiriladi** (yoʻqolmaydi). Saqlash bizda **bepul** — classroomscreen uni pullik qilgan, bu bizga toʻgʻri kelmaydi.

**Panel oʻqituvchi tomonidan tuziladi (R132):** 11 ta koʻrinadi, qolgani menyuda — `doska_prefs.bar_widget_kinds`. Shu bois vidjet qoʻshish UI'ni buzmaydi.

**Uchta gotcha:** (a) **taymer** — brauzer fon tabini sekinlatadi, `setInterval` sanamaydi → `Date.now()` farqi; (b) **z-indeks xaritasi** oldindan yozilsin (R136), aks holda vidjetlar tartibi chalkashadi; (c) **`scoreboard` ≠ xulq balli** (R141) — Doska hisoblagichi efemer, `behavior_points` esa doimiy yozuv; ikkisi bir tugma boʻlib qolmasin.

**Shogird.** Read-only MVP: davomat, baholar, xulq, streak. `initData` HMAC har soʻrovda serverda tekshiriladi (`auth_date` muddati bilan) — sessiya jadvali yoʻq, cookie yoʻq. **Pedagogik himoya:** v1 da sinf reytingi va tengdoshlar bilan taqqoslash **koʻrsatilmaydi** — faqat oʻquvchining oʻz traektoriyasi. Bu `docs/ustozona-v1.md` dagi "termometr → termostat" prinsipining oʻquvchi tomonidagi ifodasi.

**Boshqaruv.** Mavjud `/admin` qobigʻi naqshini kengaytiradi, `requireSchoolAdmin()` allaqachon `SchoolScope` qaytaradi. **Muhim chegara:** maktab admini oʻqituvchining shaxsiy pedagogik yozuvlarini (`student_notes`, `class_notes`, `feedback`) **koʻrmaydi**. Sabab `docs/MANTIQ.md` da yozilgan. Kerak boʻladi: oʻqituvchi maktabga qanday bogʻlanadi degan soʻrov/tasdiq oqimi (hozir `teachers.schoolId` ni kim qoʻyishi aniq emas).

**Interaktiv taqdimot.** Alohida slayd mahsuloti emas — mavjud dars hujjatining `stage` sirtidagi koʻrinishi. Yagona kod oʻzgarishi dars muharririda: Tiptap'ga `interactivePrompt` tugun turi. B3 boʻlimiga qarang. ⚠️ Maʼlum gotcha (KaTeX tugunidan): Tiptap'ga yangi tugun qoʻshgandan keyin dev-server qayta ishga tushirilishi shart, aks holda tugun roʻyxatdan oʻtmaydi.

**Shablonlar (34+22)** — mustaqil mahsulot emas, 11 shakl ustidagi renderer'lar. B2 boʻlimiga qarang. Sxema oʻzgarmaydi.

**Interaktiv video** — alohida mahsulot emas, `activity_sets.container_kind = "video"`. v1 da faqat YouTube embed, yuklash yoʻq. B4.3 ga qarang.

**Matn+savol (Passage)** — alohida mahsulot emas, `activity_sets.container_kind = "passage"` (R146/R167). Matn bir marta yoziladi, ustiga bir necha savol bogʻlanadi — ona tili/adabiyot/ingliz tili oʻqib-tushunish topshirigʻi uchun. Yangi jadval kerak emas, matn `config` ichida saqlanadi.

---

## Ochiq masalalar (hozir hal qilinmaydi, lekin yozib qoʻyiladi)

1. Bitta bola = N qator — MVP'da qabul qilindi; `students.person_id` zaxirada.
2. Realtime runtime — 5-bosqich qaror nuqtasi. **Maʼlumot (R82):** Blooket **Colyseus** ishlatadi (xona-asosli avtoritar server + klient/server boʻlishadigan sxema), alohida subdomenda deploy qilingan. Bu bizning "xona = aktor" tanlovimizni tasdiqlaydi, lekin Colyseus **doim yoniq Node** talab qiladi — bizning Vercel serverless deployiga tushmaydi. Yaʼni tanlov: (a) Cloudflare Durable Objects, (b) alohida doim-yoniq host + Colyseus (yangi xarajat va operatsion yuk). Yana: ularda bir vaqtdagi ishtirokchi soni **pullik oʻq** (60 bepul / 300 pullik) — sigʻim bepul emas.
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
14. **Umumiy savollar bazasi** — texnik jihatdan tayyor (`visibility: public`), lekin moderatsiya siyosati va muallif atributsiyasi hal qilinmagan (B5.4). **Kengaytma (R19):** rasm boʻlgan umumiy kontent alohida masala — matnni moderatsiya qilish oson, rasmni yoʻq. Qoida: rasmli umumiy aktiv qoʻlda tasdiqdan oʻtmaguncha ommaga chiqmaydi; v1 da mem toʻplamlari umuman `private`.
15. **Hamkor-oʻqituvchi (co-teacher)** — v1 da YOʻQ (R5). Sabab texnik: `teachers.id` yagona ijara kaliti, sinf bitta egaga tegishli. Qoʻshilsa `class_teachers(class_id, teacher_id, role)` va **har bir DAL soʻrovida** qamrov qayta yoziladi — bu kech qilinsa qimmat refaktor. Agar bir kun kerak boʻlsa, A boʻlimdagi brendlangan qamrov obyekti (`__scope`) shu joyni ushlab turadi.
16. **Audio/Video Response savol turlari** — v1 da YOʻQ (R6). Obyekt-saqlash (Vercel Blob ataylab oʻchirilgan) + trafik budjeti talab qiladi. Video yuklash (№10) bilan bitta qarorga bogʻlanadi: obyekt-saqlash yoqilsa uchalasi birga keladi, yoqilmasa uchalasi ham yoʻq. **Kengaytma (R30):** obyekt-saqlash yoqilsa ham ovozli javob **yakka oʻzi ochilmaydi** — u nutqni matnga oʻgirish (STT) talab qiladi, oʻzbekcha STT sifati №8 kabi hal qilinmagan, va oʻquvchi **ovozi** tashqi xizmatga ketishi maxfiylik jihatidan matn yuborishdan jiddiyroq. Yaʼni bu uchta mustaqil qaror, bittasi emas.
17. **AI ishoralar (hints) vs `ustozona-v1.md` §1.5** — taklif: ishorani oʻqituvchi tasdiqlaydi, AI faqat qoralama beradi; oʻquvchiga jonli AI chiqmaydi (R12). Daisy koʻrigidan oʻtkazilsin.
18. **Koʻp urinishda qaysi urinish oʻzlashtirishga kiradi** — v1 taklifi: birinchi (R11). Ikkinchi variant "eng yaxshisi" — u ChatGPT davrida oʻzlashtirishni ishonchsiz qiladi. `activity_sets.config.attemptPolicy` maydoni qoʻyildi, qiymat Daisy bilan qulflansin.
19. **Qutqaruv savoli (Redemption Question)** — Wayground'da bor, bizda semantikasi aniqlanmagan: notoʻgʻri javobdan keyin beriladigan ikkinchi, oson savolmi yoki oʻsha standartning boshqa elementimi? Ikkinchisi pedagogik jihatdan qiziq (retrieval), birinchisi esa faqat ballni koʻtaradi. Qaror keyinga.
20. **Notoʻgʻri javobdan keyingi mem/reaksiya** (R16) — taklif: avval tuzatuvchi fikr-mulohaza, keyin ixtiyoriy yumshoq reaksiya; diagnostik darajada umuman yoʻq. Daisy koʻrigidan oʻtkazilsin — bu `ustozona-v1.md` dagi fikr-mulohaza qoidalariga bevosita tegadi.
21. **Rasm qidirish API'si va kunlik kvota** (R19) — pullik tashqi xizmat (Google/Bing tasvir qidiruvi). `ai_usage` naqshi qayta ishlatiladi, lekin bu yangi xarajat qatori. v1 da qidirish YOʻQ, faqat havola. ⭐ **Aniq nomzod topildi (R97): Unsplash** — Kahoot aynan shuni ishlatadi (DOM'dagi rasm URL'i). Bepul API + qidiruv endpointi, ochiq litsenziya (tijoriy ruxsat, shart — muallif atributsiyasi), va `width`/`dpr` parametrlari bilan **serverda oʻlchamlash** beradi, yaʼni rasm saqlash kerak emas — obyekt-saqlash masalasi chetlab oʻtiladi. ⚠️ Qoladigan savollar: soʻrov limiti (prod 5000/soat), oʻzbek/mahalliy kontent kamligi, sinf uchun qoʻshimcha filtr.
22. **Veb-embed (PhET, Desmos, GeoGebra) darsga qoʻyish** (R24) — Wayground'da "Website Link" slaydi bor. PhET simulyatsiyalari fizika/kimyo uchun bepul va juda qimmatli, oʻzbekchasi ham qisman bor. Texnik jihatdan arzon (Tiptap'ga `webEmbed` tuguni, iframe), lekin **oq roʻyxat shart** — ixtiyoriy sayt iframe qilinmaydi (xavfsizlik + bolalarga koʻrsatiladigan kontent). Qaror: qaysi domenlar ruxsat etiladi.
23. **Ikki fazali "Brainstorm"** (R36) — 1-faza (gʻoyalarni yigʻish) bizda bor: `text` + `grading: none`. 2-faza (guruhlash/ovoz berish/saralash) yoʻq. Dvigatel mavjud — [`cj-ranking.ts`](src/lib/cj-ranking.ts) — lekin CJ **oʻqituvchi qiyoslaydi** deb qurilgan, bu yerda esa **oʻquvchilar** ovoz beradi. Qaror kerak: (a) oʻquvchi ovozi CJ dvigateliga kiritiladimi, (b) kiritilsa `cj_judgements` ga `judge_kind: teacher | student` qoʻshiladimi, (c) natija baholashga taʼsir qilmasligi kafolatlanadimi. v1: faqat 1-faza.
24. **Qoʻshilish uchun qisqa manzil** (R103) — uchala referens ham alohida qisqa domen ishlatadi: `kahoot.it`, `play.blooket.com`, `joinmyquiz.com`. Sabab ergonomik: oʻquvchi manzilni **quloqdan** yozadi. Bizda `ustozona.uz/play` texnik jihatdan yetarli, lekin sinfda 30 marta takrorlanadi. Variantlar: (a) `ustozona.uz/q` rewrite — bepul, bugun qilinadi; (b) alohida qisqa domen (`uz1.uz` kabi) — yillik toʻlov + DNS + sertifikat. Tavsiya: (a) hozir, (b) prod trafik koʻrsatgach.
25. **Uchinchi tomon skriptlari va oʻquvchi sirtlari** (R118) — Wayground'ning **jonli sinf sahifasida** Survicate, Braze, Hotjar (sessiya yozuvi), GTM va Bing pikseli ishlaydi. Bizda qoida qatʼiy boʻlsin: **`/play` va `/shogird` sirtlarida hech qanday tashqi kuzatuv/marketing skripti yoʻq** — na analitika, na sessiya yozuvi. Vercel Analytics faqat oʻqituvchi panelida qoladi. Bu texnik emas, prinsipial qaror; `docs/MANTIQ.md` ga koʻchirilsin. Bogʻliq: bayroq/konfiguratsiya bloblari mijozga **toʻliq** yuborilmaydi (R118b).
26. **Differensiatsiya (`Assign to`)** (R154, EMStudio) — topshiriq sinfning bir qismiga beriladi (*"All 16 students"* tanlanadigan). Bizda `assignments` faqat `classId`ga bogʻlangan, alohida oʻquvchiga emas. Real ehtiyoj, lekin qamrov kengaytmasi — v1 dan tashqarida, qaror keyinga.
27. **Bahoni qaytarish (`Return`)** (R156, EMStudio) — ularda baholash ikki qadam: ball kiritish → qaytarish; qaytarilmaguncha oʻquvchi/ota-ona koʻrmaydi. Bizda bu qaror yoʻq. Shogird (3-bosqich) qurilganda jiddiy boʻladi: chala kiritilgan ball ota-onaga darhol ketmasligi kerak. v1 da oʻquvchi akkaunti yoʻqligi sababli hozircha bloklamaydi, lekin Shogird sxemasi loyihalanganda hal qilinishi shart.

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
| **Wayground — haqiqiy skrinshot koʻrigi** (R1–R31) | 2 jadval (`student_accommodations`, `meme_sets`) + 3 maydon (`attempt_no`, `score`, `grading: partial`) |
| **Kahoot — haqiqiy skrinshot koʻrigi** (R32–R41) | **0 jadval, 0 ustun** — faqat `render_config` ichida ikkita maydon |
| **Wayground — HAQIQIY hisob, 78 sessiya** (R42–R51) | 0 jadval; `activity_ids` → rolli `items`; qolgani **oqim va standart holat** qarorlari |
| **Kahoot — HAQIQIY hisob, 90 hisobot** (R52–R61) | **0 jadval, 0 ustun** — hammasi tahlil funksiyalari va standart qiymatlar |
| **Blooket — muharrir** (R62–R70) | 0 jadval; `mcq.shuffleOptions` + `config.defaultTimeLimit` — ikkita maydon |
| **Blooket — HAQIQIY hisob + JSON model** (R71–R76) | 0 jadval; `sessions.title/completion` + `banks.copied_from/verified/tags` |
| **Blooket — JONLI OʻYIN** (R77–R88) | **0 jadval, 0 ustun** — shablon reyestri metadatasi + F boʻlim uchun stek maʼlumoti |
| **Kahoot — JONLI OʻYIN** (R89–R98) | **0 jadval, 0 ustun** — `confidence` ustuniga MAʼNO berildi + 2 ta `render_config` bayrogʻi |
| **Wayground — JONLI DARS** (R99–R118) | **0 jadval**, 1 ustun (`mode_boundary`) + `mode` OʻZGARUVCHAN boʻldi + 5 ta `render_config` maydoni. Eng qimmatlisi sxema emas: `gameShell` tumbleri (R99) butun falsafamizni bitta bayroqqa siqdi |
| **Wayground — YAKUN va HISOBOT** (R119–R129) | **0 jadval** — `session_participants` ga 2 maydon (`integrity`, `device_kind`) + `session-stats.ts` ga 4 funksiya. Yangi jadval **ataylab qilinmadi**: diqqat izi sessiya bilan oʻlishi kerak |
| **classroomscreen — DOSKA** (R130–R143) | **3 jadval — lekin yangi domen** (`doska_decks/screens/widgets`, +`doska_prefs`). Baholash yadrosiga **0 taʼsir**. Aksincha, 2-bosqich **arzonlashdi**: vidjetlarning yarmi mavjud domenlardan bepul keladi |
| **Wayground — yaratish oqimi** (R144–R148, R160–R174) | **0 jadval, 0 ustun** — `container_kind` qiymatlari aniqlashtirildi (`lesson`→`deck`, +`passage`). Eng qimmatlisi sxema emas: taqdimotning **qayerda yashashi** tuzatildi (dars rejasidan ajratildi) |
| **EMStudio — HAQIQIY hisob** (R149–R159) | **0 jadval** — `assignments.kind`/`instructions` allaqachon qoʻshilgan edi. Eng qimmatlisi sxema emas: **R149** — bir mavzu ikki platformada ikki jurnal ustuni yaratgan, ballar qoʻlda koʻchirilgan. Butun Baholash loyihasining asosi shu dalilda |
| **EMStudio — Classwork Topics** (R193–R202) | **0 jadval, 0 ustun** — `purpose`/`weightPercent`/`scaleKind` oʻz joyida qoladi. ⭐ Eng qimmatlisi — bizda ikki nuqson topilishi: `select` shkalani bilmaydi (R195), yakuniy shkala sinfga bogʻlanmagan edi (R196, tuzatildi). ❌ Cut-score tahriri va `Custom` olinmadi (R197) |
| **EMStudio — toʻliq DOM** (R175–R192) | **0 jadval, 0 ustun** — sxemaga taʼsiri yoʻq. Qiymati boshqa joyda: monetizatsiya zinapoyasi (R178), onboarding tartibi (R179), `toasts`dan funksiya inventari (R180). Arzon olinadigan: jadval klaviatura navigatsiyasi (R186). ⚠️ Koʻchirilmaydi: boʻsh jurnalda `0%` (R188), dashboard'da marketing lugʻati (R176) |

Har safar tuzilma emas, **qiymatlar va ustunlar** oʻzgardi — bitta ham yangi jadval kerak boʻlmadi. Yangi mahsulot qoʻshish narxi vaqt oʻtgani sari **oshmayapti**, kamayyapti.

Uchta solishtiruv haqiqiy tuzatish keltirdi:
- **Wayground (matn)** — "shakl" ilgari ham maʼlumot tuzilishini, ham tekshirish usulini anglatardi. Ajratildi (`shape` + `grading`).
- **Kahoot (matn)** — jamoaviy rejim `session_participants` ni "bitta oʻquvchi" deb faraz qilishni buzdi. Bu faraz baribir buzilishi kerak edi (Oʻzbekiston sinfxonasi uchun), shuning uchun erta topilgani yaxshi.
- **Wayground (skrinshot)** — koʻp urinish `UNIQUE` cheklovini, qisman baholash esa `is_correct` booleanini buzdi (R11, R26). Ikkalasi ham faqat haqiqiy UI'ga qarab topildi — matnli taʼrifda koʻrinmasdi. Bu "Ish tartibi" qoidasining oʻzini oqladi.

**Kahoot koʻrigidan chiqqan asosiy xulosa boshqacha:** u sxemani tuzatmadi, balki **eng qatʼiy qarorimizni tashqaridan tasdiqladi** — tezlikni ballashdan chiqarish (R32). Bozor yetakchisi buni alohida rejim qilib chiqargan; bizda esa u invariant.

**Haqiqiy hisob koʻriklari esa (R42–R61) hammasidan boshqacha xulosa berdi.** Ikkala mahsulotda **ayni bir oʻqituvchining** bir yillik ishi koʻrildi — 78 + 90 sessiya. Sxema deyarli oʻzgarmadi, lekin uchta narsa aniqlandi:

1. **Eng katta xavf ichkarida.** Roʻyxat toʻldirilmagani uchun 168 sessiyadan bironta ham oʻquvchi darajasidagi tahlil hosil boʻlmagan (R43, R53). Bizning haqiqiy raqobatchimiz ularning imkoniyatlari emas, **oʻz dvigatelimizning boʻsh qolishi**. Ustunligimiz ham shu yerda: bizda roʻyxat allaqachon toʻla.
2. **Eng aniq farqimiz topildi — va uning sababi ham.** Distraktor tanlovlari ikkala mahsulotda ham koʻrsatiladi, lekin **nomlanmaydi** (R56). Blooket'ning JSON'i buning sababini oshkor qildi (R71): ularning variantlari **id'siz satrlar**, `correctAnswers` esa oʻsha satrning nusxasi. Yaʼni teg biriktiriladigan barqaror obyekt yoʻq. Bizda `options:[{id, text, isCorrect, misconceptionId}]` boshidan shunday — farqimiz UI'da emas, **maʼlumot modelida** qulflangan.
3. **Eng qatʼiy qoidamiz isbotlandi.** Reyting bilim tartibini buzadi: 88% birinchi, 94% ikkinchi (R52). Bu endi pedagogik afzallik emas, **oʻlchov xatosi**.

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
