# LessonLab → Ustozona birlashtirish (2026-09-26)

LessonLab toʻliq **Ustozona** brendiga oʻtdi:

| LessonLab'da edi | Endi |
|---|---|
| `lessonlab.uz/edugames/` — oʻyinlar | **Ustozona-Games** — `ustozona.uz/games` |
| `lessonlab.uz/lessonplanner/` — Lesson Planner | qulflangan; imkoniyatlari Ustozona dars muharririda (**Reja ustasi**) |
| `lessonlab.uz/ieltslesson/`, bosh sahifa | qulflangan (LessonLab yaratuvchisi qarori) |
| Kirish | Ustozona hisobi + `@uzlessonlabbot` Telegram boti |

LessonLab tomonidagi qulf va uning ochilish tartibi:
`lessonlab-scanner/docs/LOCKED_PAGES.md`.

## 1. `/games` — qanday ishlaydi

- `src/app/games/[[...game]]/page.tsx` — ochiq sahifa (kirish shart emas:
  oʻquvchi PIN bilan qoʻshiladi).
- Oʻyinlar LessonLab serverida qoladi, sahifa ularni **iframe** orqali
  koʻrsatadi. Proksi EMAS — jonli oʻyin WebSocket'i, QR kamera va savollar
  bazasi oʻz domenida ishlashi shart; Vercel tashqi WebSocket'ni proksi
  qila olmaydi.
- Manzil: `LESSONLAB_GAMES_BASE` (yoʻq boʻlsa `https://lessonlab.uz/edugames`)
  — Baholash qobiqlari ishlatadigan oʻsha oʻzgaruvchi.
- `/games/<oʻyin>` faqat `src/lib/games.ts` dagi `GAME_FILES` roʻyxatidan —
  boshqasi 404. Manzil orqali iframe'ga ixtiyoriy yoʻl yuborib boʻlmaydi.
- Oʻyin ichida sahifa almashsa LessonLab `edugames/eg-embed.js` ota sahifaga
  faqat oʻyin NOMINI yuboradi (query/token emas). `GamesFrame` uni origin +
  source + roʻyxat bilan tekshirib, manzilni `replaceState` bilan yangilaydi.
- `/games/live-play?pin=123456` — faqat 6 raqamli PIN iframe'ga oʻtadi.
- Oʻyin ichidagi Telegram kirishi (`@uzlessonlabbot`) iframe ichida
  alohida saqlanadi: brauzerlar begona domen iframe'ining `localStorage`
  ini ajratadi, shuning uchun `lessonlab.uz` ga toʻgʻridan-toʻgʻri kirgan
  sessiya bu yerda koʻrinmasligi mumkin — bir marta qayta kirish kifoya.
  Kamera (QR) yoki toʻliq ekran brauzerda ishlamasa, sarlavhadagi
  «Yangi oynada ochish» tugmasi oʻyinni toʻliq sahifada ochadi.

Navigatsiya: header'da «Baholash» oʻrnida **Games**; «Mahsulotlar»
boʻlimi, footer, sitemap va dashboard yon paneli (Blog yonida).
**`/baholash` ish maydoni oʻzgarishsiz** — test, OMR skaner, QR-kartalar
oʻsha yerda, Games sarlavhasida unga havola bor.

## 2. Lesson Planner'dan koʻchirilgan imkoniyatlar

Planner'dagi har imkoniyat Ustozonada bor-yoʻqligi tekshirildi. Borlari
takrorlanmadi, yoʻqlari **Reja ustasi** paneliga (`PlanWizardPanel`)
qoʻshildi.

| Planner imkoniyati | Ustozonada |
|---|---|
| Sinf, oʻquvchilar, taklif havolasi | allaqachon bor |
| eMaktab ish reja importi | allaqachon bor (`IshRejaImportModal`) |
| Haftalik jadval, keyingi dars | allaqachon bor (planner, bosh sahifa) |
| AI-metodist suhbati, materialga aylantirish | allaqachon bor (Ustozona AI) |
| Chop etish (PDF) | allaqachon bor |
| **13 ta jahon dars modeli** + fan/mavzu boʻyicha tavsiya | **yangi** — `src/lib/lesson-models.ts` |
| **3 yoʻl**: tez (AI) · maqsaddan boshlab (AI) · oʻzim yozaman (shablon) | **yangi** — Reja ustasi |
| **Sinf holati** (smartdoska, proyektor, harakat, telefon, soni, daraja) | **yangi** — AI soʻroviga qoʻshiladi |
| **Oldingi dars** mulohazasi + **Dars oʻtgach** refleksiyasi | **yangi** — `Lesson.reflection` (JSONB, migratsiyasiz) |
| **Dars rejimi** (slaydlar, toʻliq ekran, ← →) | **yangi** — `LessonPresenter` («…» menyu va Reja ustasi) |
| Mavzuga oʻyinlar | **yangi** — Reja ustasidan Ustozona-Games |

AI chaqiruvi Reja ustasida EMAS: tayyor soʻrov mavjud AI yordamchisiga
uzatiladi (`pendingPrompt`). Kvota, provayder zanjiri, chat tarixi va
«Darsga qoʻshish» oʻsha yerda — ikkinchi AI yoʻli ochilmadi. Soʻrov chat
tarixi yuklangandan KEYIN yuboriladi, aks holda serverdagi eski suhbat
qisqa roʻyxat bilan almashtirilib ketardi.

## 3. Hali koʻchirilmagan (keyingi bosqich)

- **Ustozlar bazasi** (rejani ommaga ulashish va boshqalarnikidan
  foydalanish) — yangi jadval, moderatsiya va ruxsat qoidalari kerak;
  alohida kelishilgan ish.
- **Sinf holati** hozircha brauzerda (`localStorage`, sinf boʻyicha).
  Qurilmalar orasida sinxron boʻlishi uchun `teachers.prefs.classPrefs`
  ga maydon qoʻshish kerak — bu markaziy store (`useClassStore`), jamoa
  bilan kelishib qilinadi.
- **Darsdan oldin eslatma** — LessonLab botida ishlayveradi, tugmasi endi
  Ustozona darslariga olib boradi. Ustozona botiga koʻchirish —
  `@uzlessonlabbot` → Ustozona boti almashtirilganda.
