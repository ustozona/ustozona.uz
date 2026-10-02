# Doska — qilinadigan ishlar

Bitta roʻyxat: Doska boʻyicha nima qilinishi kerak, nima qilinmoqda va
nima tugagan. Har ish uchun toʻrt sana va ijrochi yoziladi:

- **Gʻoya** — gʻoya qachon tugʻilgan (qaysi hujjat yoki muhokamada);
- **Boshlandi** — kod yozish qachon boshlangan;
- **Tugadi** — `main` ga qachon qoʻshilgan (PR);
- **Kim** — branch egasi (bitta GitHub akkaunt boʻlgani uchun branch
  nomidagi ism). Claude bilan qilingan boʻlsa — «+ Claude».

Yangi ish roʻyxat oxiriga emas, tegishli boʻlimga yoziladi. Ish tugaganda
«Tugadi» boʻlimiga koʻchiriladi, oʻchirilmaydi. Gʻoyalarning batafsil
tavsifi — `docs/doska-referens-koriklari.md` (R-raqamlar).

---

## 1. Qaror kutayotgan ishlar

| Ish | Gʻoya | Nima hal qilinishi kerak | Kim |
|---|---|---|---|
| R411 guruhlarda cheklovlar: «birga qoʻyilmasin / albatta birga» | 2026-10-01, referens koʻrigi | Qayerda saqlanadi: A — vidjet holatida (bazasiz, tavsiya), B — bazada (`student_constraints`) | — |
| R384 + R420 rasm qoʻyish va oʻz rasmini fon qilish | 2026-10-01, referens koʻrigi | Rasm saqlash joyi | — |
| R397 vidjet joylashuvi uchun bitta 16:9 maydon | 2026-10-01, referens koʻrigi | Tasdiq kerak; ekranlarni serverga saqlashdan OLDIN | — |
## 2. Server bilan (keyin)

| Ish | Gʻoya | Kim |
|---|---|---|
| Ekranlarni hisobga saqlash (Pro) | 2026-10-01, referens koʻrigi | — |
| R423 oʻqituvchining oʻz shablonlari | 2026-10-01, referens koʻrigi | — |
| R424 doskani ulashish | 2026-10-01, referens koʻrigi | — |
| R425 doskalar roʻyxati va jildlar | 2026-10-01, referens koʻrigi | — |
| R399 «Yaqinda oʻchirilganlar» | 2026-10-01, referens koʻrigi | — |

## 3. Tekshiruv va oʻlchov

| Ish | Gʻoya | Holat | Kim |
|---|---|---|---|
| PR #283, #284 ni brauzerda Pro hisob, haqiqiy davomat va dars rejasi bilan sinash | 2026-10-01 | kutmoqda | foydalanuvchi |
| Android paneldagi sekinlik — avval paneldan oʻlchov (`docs/doska-tezlik-tadqiqot.md`) | tezlik tadqiqoti, R372–R379 | kod yoʻq | — |

## 4. Qilinmoqda

| Ish | Gʻoya | Boshlandi | Kim |
|---|---|---|---|
| — | | | |

## 5. Tugadi

| Ish | Gʻoya | Boshlandi | Tugadi | Kim |
|---|---|---|---|---|
| R455–R467 Doska UI referens koʻrinishida: oq panel va oq varaq, burchak tugmalari, uch ustunli panel, ikonali kontekst panel, oʻngdan sozlama oynasi, «Karta» tasmasi, «Matn» varaqda, taymer halqasi | 2026-10-01, 2-referens vizual koʻrigi; qaror 2026-10-02 | 2026-10-02 | 2026-10-02, PR #291 | maxdum + Claude |
| R443–R454 kundalik ekran: «Karta» va «Sana» vidjetlari, shablonda joy ulushi, «Kun rejasi» shabloni, «Bugun»da vaqt chizigʻi, yumshoq fonlar | 2026-10-01, 3-referens | 2026-10-01 | 2026-10-01, PR #286 | maxdum + Claude |
| R433 kichik taymerda ikkilamchi tugmalar yashiriladi | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #285 | maxdum + Claude |
| R435 rasmli kartalar zar rejimi va gʻildirak koʻrinishida | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #285 | maxdum + Claude |
| docs/doska-ishlar.md — ishlar roʻyxati | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #285 | maxdum + Claude |
| R420 bayram fonlari va «Bugunga mos» qatori | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #284 | maxdum + Claude |
| R433 taymerda «Avto» koʻrinish | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #284 | maxdum + Claude |
| R435 rasmli kartalar (soʻrovnoma, taymer), umumiy boʻsh holat, guruh natija matni | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #284 | maxdum + Claude |
| R423 statik «Tayyor ekranlar» | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #284 | maxdum + Claude |
| R418 «Video», «Havola», «Sayt» vidjetlari | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #284 | maxdum + Claude |
| R429 yangi vidjet boʻsh joyga qoʻyiladi | 2026-10-01 | avvalroq | avvalroq (`placement.ts`) | — |
| R409 «Bugun»: dars rejasidan bosqichlar, taʼtil kuni | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #283 | maxdum + Claude |
| R411 «Guruhlar»ga sinf roʻyxati va bugun yoʻqlar | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #283 | maxdum + Claude |
| Gʻildirakda davomatdan yoʻqlar | 2026-10-01 | 2026-10-01 | 2026-10-01, PR #283 | maxdum + Claude |

## 6. Ataylab qilinmaydi

| Ish | Qaror | Sabab |
|---|---|---|
| Boʻsh gʻildirak va guruhlarda «roʻyxat kiriting» holati | 2026-10-01 | Namuna ismlar bilan vidjet darhol ishlaydi — boʻsh holat bir qadam qoʻshadi |
| R406 taymer diskini sudrash | 2026-10-01 | Disk qolgan ulushni koʻrsatadi, 60 daqiqalik siferblat emas |
| R415 ish belgilari | 2026-10-01 | Svetofor deyarli toʻliq qoplaydi |
| R421 vidjetga oʻz rang mavzusi, fon karuseli | 2026-10-01 | Uslub qarori; sinfga taʼsiri kichik |
| R448 fotosurat fonlar katalogi, yarim shaffof kartalar | 2026-10-01, foydalanuvchi | Proyektorda matn yuviladi, deploy yuki; oʻrniga CSS «yumshoq sahna» |
| R451 shablon palitrasi vidjetlarga | 2026-10-01 | Vidjet tusi — turining belgisi, koʻrinish — oʻqituvchi tanlagan uslub (Q1) |
