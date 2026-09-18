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

## Keyingi qavatlar (hali qilinmagan)

- Slayd ichidagi yangi savol turlari (soʻrovnoma, soʻz buluti, ochiq
  javob) — alohida bosqich.
- Erkin kanvas — Doska dvigateli ustida, maketlar yetmay qolsa.
