# Taqdimot — spetsifikatsiya (2026-09-18)

Bogʻliq: `docs/ost-loyihalar-arxitektura.md` R273–R280 (mazmun ↔ oʻtkazish
usuli, taqdimot toʻplam ichida, Doska kirish nuqtasi). Bu hujjat R281 dan
davom etadi.

## Asosiy qoida

Taqdimot alohida obyekt emas: **toʻplam + `slide` elementlari** (R276).
Slayd `activities.shape = "slide"`, baholanmaydi, `activity_items` qatori
yoʻq — ball, natija va skaner uni oʻz-oʻzidan chetlab oʻtadi. Toʻplamda
bitta slayd boʻlsa `container_kind = "deck"` (hisoblanadi, tanlanmaydi).

## Referens koʻrigi (internet, 2026-09-18)

**R281 — Maket birinchi, erkin kanvas keyin.** Bir platforma slaydni oltita
qatʼiy maketda beradi: klassik, katta sarlavha, sarlavha + matn, roʻyxat,
iqtibos, katta media. Rasm yoki YouTube qoʻshiladi, slayd foni tanlanadi.
Tez va proyektorda doim toza, lekin elementni erkin surib boʻlmaydi.
Boshqasi boʻsh va sarlavhali slayd + pastki panel (matn, rasm, audio,
video, formula, shakl, jadval) beradi va tashqi taqdimot fayllarini import
qiladi. Erkin kanvas (umumiy ofis ilovalari) istalgan dizaynga yoʻl beradi,
lekin oʻqituvchi bezash bilan ovora boʻladi va sifat notekis chiqadi.
→ Bizda **maket birinchi**.

**R282 — Tayyor muharrirlar litsenziya tufayli yaramaydi.** Toʻliq veb
slayd muharriri (Vue 3) AGPL-3.0 ostida — yopiq xizmatni ham kodini
ochishga majbur qiladi. Cheksiz kanvas SDK prodda litsenziya kalitini
talab qiladi (bepul variantda suv belgisi). → Erkin kanvas kerak boʻlsa,
**Doska dvigateli** ustida quriladi (deck → ekran → vidjet, surish,
oʻlcham, z-tartib allaqachon bor).

**R283 — Import — oʻqituvchining eng katta boyligi.** PPTX→JSON brauzer
kutubxonasi maket va uslubni ~80% aniqlikda oʻqiydi. → Import ikki
bosqichda: avval PDF → rasmli slaydlar, keyin PPTX → tahrirlanadigan
slaydlar. Litsenziya qoʻshishdan oldin tekshiriladi.

## Qarorlar

1. **Uch qavat, shu tartibda:** maketlar → import → erkin kanvas.
2. **Maketlar (1-qavat):**

   | Kalit | Nomi | Maydonlar |
   |---|---|---|
   | `title` | Sarlavha | sarlavha (katta), izoh |
   | `text` | Sarlavha + matn | sarlavha, matn |
   | `list` | Roʻyxat | sarlavha, har qator bir band, ixtiyoriy rasm |
   | `classic` | Rasm + matn | sarlavha, rasm, matn |
   | `media` | Katta media | rasm yoki video, izoh |
   | `quote` | Iqtibos | iqtibos matni, muallif |

   Maydon nomlari bazada bir xil: `title`, `body` (roʻyxatda har qator —
   band), `imageUrl`, `videoUrl`. Maket almashtirilsa mazmun yoʻqolmaydi.
3. **Bitta renderer** (`components/slides/SlideView.tsx`) — muharrir
   (tahrirlanadigan), oʻquvchi ekrani (`/play`) va Doska vidjeti bir xil
   chizadi. Aks holda uch joyda uch xil slayd koʻrinadi.
4. **Rasm** — mavjud `uploadEditorImageAction` (Supabase Storage,
   saqlagichsiz muhitda base64 zaxira). **Video** — faqat havola
   (YouTube), mavjud `VideoEmbedFacade` bilan; fayl yuklanmaydi.
5. **Fon** — toʻplam darajasidagi sahna mavzusi (`stageTheme`); slayd
   xohlasa oʻz fonini oladi (`config.bg`, oʻsha mavzular roʻyxatidan).
   Boʻsh — umumiy fon.

## Jonli sessiya (R284, 2026-09-18)

**Stsenariy:** oʻqituvchi oʻz kompyuteridan Doskada taqdimotni ochadi,
ekran HDMI bilan e-doskaga chiqadi; 20 ta kompyuterdan oʻquvchilar PIN/QR
bilan kiradi. Qadamni oʻqituvchi boshqaradi — hamma ekran birga oʻtadi.

**R284 — Aralash model (foydalanuvchi tasdiqlagan).** Hamma qurilma
realtime'ga ulansa har sinf 21 ulanish egallaydi va bepul rejadagi 200
ulanishga bir vaqtda ~9 sinf sigʻadi. Shuning uchun:

- **Oʻquvchi qurilmasi** joriy qadamni har 1,5 s da soʻraydi
  (`getLiveStateAction` — faqat token va sessiya qatori).
- **Oʻqituvchi ekrani** Supabase Realtime **broadcast** kanalini tinglaydi.
  Javob yoki qoʻshilish boʻlganda server kanalga **maʼlumotsiz turtki**
  yuboradi (`server/realtime/broadcast.ts`, REST); ekran natijani egalik
  tekshiruvi bor `liveResultsAction` bilan oʻzi soʻraydi. Kanal nomi
  tasodifiy va faqat oʻqituvchiga beriladi.
- Realtime sozlanmagan yoki uzilgan boʻlsa oʻqituvchi ekrani ham 2,5 s
  soʻrovga oʻtadi — hech narsa buzilmaydi.

Natija: har sinf **1 ulanish** → bepul rejada ~200 sinf bir vaqtda.
Keyin oʻquvchilarni ham realtime'ga oʻtkazish bitta joyni oʻzgartiradi.

**Qoidalar:** jonli sessiyada har savolga bitta javob; javob ochilgach
javob qabul qilinmaydi (aks holda doskadagi ustunlar maʼnosiz). Doska
natijasi ismlarsiz (proyektorga chiqadi). Sessiya ketayotganda toʻplamni
almashtirib boʻlmaydi.

**Sozlama — faqat serverda:** `SUPABASE_URL` (mavjud) va
`SUPABASE_ANON_KEY`, `NEXT_PUBLIC_` prefiksiz (`server/realtime/config.ts`).
Kalit ommaviy JS paketiga qotirilmaydi: uni tizimga kirgan oʻqituvchiga
jonli sessiya ekrani ochilganda `liveRealtimeConfigAction` beradi va u
Doska holatiga (localStorage) yozilmaydi. ⚠️ WebSocket brauzerdan
ulangani uchun kalit oʻqituvchi brauzeriga baribir yetadi — bu anon
kalit (RLS'ni chetlab oʻtmaydi), kanalda esa maʼlumot yoʻq. Protokol
2026-09-18 da prod loyihada sinaldi: join `ok`, REST broadcast `202`,
xabar WebSocket orqali yetdi.

## Holat

- ✅ 1-qavat — maketlar (`SlideView`, `SlideLayoutPicker`).
- ✅ 2-qavat, PDF: muharrirdagi «+» → «PDF dan slaydlar». Brauzerda
  `pdfjs-dist` (Apache-2.0) bilan har sahifa 1600px JPEG ga aylanadi,
  `uploadEditorImageAction` orqali saqlagichga chiqadi va «Katta media»
  slaydi boʻladi. Chegara — 60 sahifa (`MAX_PDF_PAGES`, `lib/pdf-to-images.ts`).
  pdf.js faqat import bosilganda dinamik yuklanadi.
- ✅ 2-qavat, PPTX: oʻsha tugma («Taqdimotni import qilish», PDF/PPTX).
  `pptxtojson` (MIT) brauzerda; har slayddan sarlavha (joy egasi nomi
  yoki eng tepadagi matn), qolgan matn qatorlari va ENG KATTA rasm
  olinib maketga joylanadi (`lib/pptx-to-slides.ts`, `pickLayout`).
  Erkin joylashuv, shrift, animatsiya ataylab tashlanadi. Jadval,
  diagramma, formula va qoʻshimcha rasmlar koʻchmaydi — oʻqituvchiga
  aytiladi va PDF yoʻli tavsiya qilinadi. Eski `.ppt` qabul qilinmaydi.

- ✅ Fikr yigʻish turlari: **soʻrovnoma** (`poll`) va **soʻz buluti**
  (`wordcloud`). Ikkalasi `grading = "none"`: javob `activity_items`
  qatoriga bogʻlanadi, lekin maks. ball, aniqlik va yakunlash foizidan
  chiqariladi (`dal/assess/graded-items.ts` — yagona manba; aks holda
  10 savol + 2 soʻrovnomali testda hammasini topgan bola 83% olardi).
  Doskada natija faqat «Natijani koʻrsatish» dan keyin chiqadi (erta
  koʻrinsa sinf koʻpchilikka ergashadi); ochilgandan keyin ham javob
  qabul qilinadi (toʻgʻri javob yoʻq). Soʻz: 1–40 belgi, kichik harfga
  keltirib sanaladi. Tashqi oʻyin qobigʻiga faqat mcq/pairs boradi.

- ✅ **Ochiq javob** (`text`, `grading = "manual"`): oʻquvchi erkin matn
  yozadi (1–2000 belgi). U **maks. ballga kiradi** — `graded-items.ts`
  faqat `"none"` ni chiqaradi. Oʻqituvchi yopilgan sessiya panelida har
  javobga 0 / ½ / 1 qoʻyadi (`responses.score`, `isCorrect` faqat 1 da;
  `dal/assess/open-answers.ts`, egalik + `manual` tekshiruvi — avtomatik
  test javobini bu yoʻl bilan oʻzgartirib boʻlmaydi). Baholanmagani
  jurnalga 0 boʻlib tushadi — soni «Jurnalga» tugmasidan oldin koʻrinadi.
  Namuna javob (`config.sample`) faqat baholashda. Doskada «Natijani
  koʻrsatish» da javoblar ismsiz (oxirgi 60 ta).

## Keyingi qavatlar (hali qilinmagan)

- Erkin kanvas — Doska dvigateli ustida, maketlar yetmay qolsa.
