# Maxsus illyustratsiyalar — buyurtma texnik topshirigʻi

Maqsad: mavjud `1`–`50` skribl oilasiga texnik jihatdan bir xil, lekin
**aynan shu ilova kontekstiga** (sinf, oʻquvchi, baho, davomat) mos 10 ta
yangi sahna. Bular umumiy "sehr/kubok/globus" mavzusidagi qarz olingan
illyustratsiyalarni almashtiradi.

## Texnik format (majburiy)

Mavjud `public/illustrations/*.svg` (masalan `23.svg`) bilan bit-bit mos boʻlishi kerak:

- `viewBox="0 0 128 128"`, `width="128" height="128"`
- Bitta rang qatlami: barcha shakllar `fill="currentColor"` (yoki `class="cls-1"` + `fill:currentColor`) — accent rang, gradient, ikkinchi qatlam YOʻQ
- Fon yoʻq (shaffof; oq `<rect>` boʻlmasin)
- Chiziq uslubi: qoʻlda chizilgan, bir xil ingichka toʻldirilgan "brush stroke" konturlar (haqiqiy `stroke` emas — Notion scribble'lardagi kabi toʻldirilgan yupqa poligonlar), ozgina "professional bo'lmagan"/organik notekislik — mukammal geometrik emas
- Kompozitsiya kvadrat kadrga sigʻishi, chekka boʻshligʻi (padding) taxminan 8–12px
- Fayl nomi: pastdagi jadvaldagi "Fayl nomi" ustuni

## 10 ta sahna

| # | Fayl nomi | Sahna tavsifi | Almashtiradi | Ishlatiladigan joy |
|---|-----------|----------------|--------------|----------------------|
| 1 | `class-empty-desks` | Boʻsh sinf xonasi: 2–3 ta parta va stul qatorlari, doska orqa fonda (jinsi/figurasi yoʻq — faqat mebel) | `23` (kitoblar dastasi) | ClassListPanel — "Hozircha sinflar yoʻq" |
| 2 | `select-from-list` | Roʻyxat/sidebar tomonga koʻrsatayotgan qoʻl yoki kursor + chiziqli roʻyxat belgilari | `71` (klik kursori) | Students — "Sinf tanlanmagan" |
| 3 | `gradebook-page` | Ochiq daftar/varaq, ustida ustunli jadval chiziqlari va bitta yulduzcha/belgi burchakda | `9` (oʻsish diagrammasi) | Grades — hali baho yoʻq |
| 4 | `checklist-in-progress` | Vertikal checklist, 3 qatordan 1 tasi belgilangan (✓), yonida qalam | `30` (ikki belgilangan katak) | Attendance / Standards — hali belgilanmagan |
| 5 | `teacher-desk-notes` | Ochiq daftar + qalam, yonida olma (jinsi yoʻq, faqat ashyolar) | `oc-taking-note` | Dashboard WelcomeCard |
| 6 | `calendar-with-pin` | Devor taqvimi varagʻi, bitta kunga pin/belgi qadalgan | `22` (katakli qogʻoz) | Timetable / Planner — jadval yoʻq |
| 7 | `student-folders-stack` | Bir-biriga suyangan 3–4 ta papka, biriga ism-yorligʻi | `21`/`5` (fayllar/hujjatlar) | Class detail — oʻquvchi yoʻq |
| 8 | `search-no-name` | Lupa, ichida boʻsh ism-yorligʻi konturi | `14` (lupa+qoʻl) | Qidiruv / "topilmadi" |
| 9 | `quiet-notification-bell` | Qoʻngʻiroq, ustida bitta kichik ✓, tinch holat (chayqalish chizigʻi yoʻq) | `27`/`ec-notification` | Notifications — boʻsh |
| 10 | `feedback-bulb-bubble` | Nutq pufakchasi ichida lampochka | `4`/`45` | Feedback — boʻsh doska |

## Neytrallik

`23`ning namunasidagi kabi — bu 10 tasi **ashyo-asosli** (mebel, daftar, papka, qoʻngʻiroq), inson figurasi yoʻq. Bu allaqachon qabul qilingan "neytrallik qoidasi"ga (`docs/illustrations.md`) mos: standart empty-state uchun predmet-asosli tanlov afzal.

## Keyingi qadam

Har biri tayyor boʻlgach: `public/illustrations/<fayl-nomi>.svg`ga qoʻyiladi, `docs/illustrations.md`dagi jadvalga qoʻshiladi, va yuqoridagi "Almashtiradi" ustunidagi joyларда `<Illustration name="..." />` bilan almashtiriladi.
