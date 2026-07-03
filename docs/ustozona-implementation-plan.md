# Ustozona — joriy etish rejasi (resumable)

> Bu fayl ish uzilib qolsa davom ettirish uchun. Har bosqich tugaganda `[x]` belgilanadi.
> Toʻliq dizayn: `docs/ustozona-v1.md`. Falsafa/tarix: memory `assessment-philosophy-direction.md`.

## Holat: P0 ✅ · P1 ✅ · P2 ✅ — v1 yadro tugadi
Qolgan ixtiyoriy: Jurnal (A–F) ni mastery bilan almashtirish; quiz/hisobotga haqiqiy Ustozona AI ulash
(`/api/...`); CJ ballarini saqlash; prerequisite graf vizualizatsiyasi.

---

## P0 — Diagnostik yadro (data modeli + mantiq, UI YOʻQ)
Maqsad: mavjud sahifalarni buzmasdan yangi diagnostik qatlamni qoʻshish.

- [x] `src/lib/diagnostics.ts` yaratish — turlar:
      `AssessmentPurpose`, `Misconception`, `Option`, `Question`, `Assessment`, `Response`,
      `Standard` (prerequisites bilan), CJ turlari (`OpenTask`/`Script`/`Anchor`/`Judgement`).
- [x] Konstantalar: `MASTERY_THRESHOLD = 0.75`, `MIN_ITEMS = 10`,
      `RETRIEVAL_THRESHOLD_DAYS = 14` (14–21 oraligʻi).
- [x] Sof funksiyalar: `mastery()`, `decay()`, `classMisconceptions()`.
- [x] Seed maʼlumot: 9-B Informatika — DT.01/DT.02/DT.04, har biriga 10 MCQ,
      distraktor→misconception, oʻquvchi javoblari (CLASS_DATA dan).
- [x] `tsc --noEmit` — diagnostics.ts xatosiz (boshqa fayllardagi xatolar avvaldan mavjud).

## P1 — Ekranlar (toʻliq shadcn + design-system.md)
- [x] **Dars xulosa (hero)** — `dashboard/(with-sidebar)/xulosa/page.tsx`: misconception kartalari +
      retrieval signallari + alohida eʼtibor. Nav'ga qoʻshildi (Sidebar BAHOLASH). Preview'da tasdiqlandi.
- [x] Brend: "Murabbiyona" → "Ustozona" (Header, layout metadata, lesson-editor "Ustozona AI",
      api/route display strings). API yoʻli `/api/murabbiyona-ai` ichki — oʻzgartirilmadi.
- [x] **Standart-mastery jadvali** — `dashboard/(with-sidebar)/ozlashtirish/page.tsx`: oʻquvchi×standart
      jadval, decay-rang (yangi/soʻnmoqda/takrorlash/oʻzlashtirmadi/tekshirilmagan), A–F yoʻq, legend.
      Nav'ga qoʻshildi. Preview'da tasdiqlandi. (Eslatma: hozir Jurnal yonida; keyin uni almashtirishi mumkin.)
- [x] **Standartlar + retrieval** — `standards/page.tsx` toʻliq qayta yozildi: dalilga asoslangan
      status (sinf mastery), retrieval signali, prerequisite chiplari, progress bar. Bloom + qoʻl-toggle
      olib tashlandi. Preview'da tasdiqlandi. (Eski inline STANDARDS_DATA/BLOOM/modal kodi olib tashlandi;
      lib `standards-data.ts` alohida — sidebar stats uchun saqlandi.)
- [x] **Quiz yaratish** — `dashboard/(with-sidebar)/quiz/page.tsx`: standart tanlash → AI qoralama (mock) →
      har distraktorga misconception Select → tasdiqlash (approve toggle). Nav'ga qoʻshildi. Preview'da tasdiqlandi.
      (Haqiqiy AI generatsiya keyin — `/api/...` orqali; hozir mock draft.)
- [ ] Eski A–F headline / ogʻirlikli oʻrtacha olib tashlash (grades) — kelajakda Jurnal'ni mastery bilan almashtirish.

## P2 — Kengaytirish
- [x] **CJ oqimi** — `dashboard/(with-sidebar)/cj/page.tsx`: "qaysi yaxshi?" juftlik taqqoslash, Elo,
      shkalalangan ball reytingi. Seed: OPEN_TASK + SCRIPTS (diagnostics.ts). Preview'da tasdiqlandi.
- [x] **Hisobot generatori** — `dashboard/(with-sidebar)/hisobot/page.tsx`: oʻquvchi tanlash → dalildan
      avtomatik hisobot (oʻzlashtirgan + mustahkamlash kerak + aniq misconception tashxisi, mavhum soʻzsiz)
      → tasdiqlash → `window.print()` PDF (`print:hidden` bilan toza chop). Preview'da tasdiqlandi.
- [ ] Prerequisite graf vizualizatsiyasi (ixtiyoriy, keyin).

## Keyingi ost-loyihalar (alohida)
- Ustozona Baholash (interaktiv taqdimot / hinge questions / real-vaqt).
- Ustozona Boshqaruv (maʼmuriy).
- Qogʻoz quiz + OCR. ClassDojo-uslub coin (faqat effort).

## Qoidalar (har bosqichda)
- UI: faqat shadcn `@/components/ui/*` + dizayn tokenlari; xom rang/ad-hoc Tailwind yoʻq.
- Oʻzbek apostrof: ʻ (U+02BB), ʼ (U+02BC); ASCII `'` yoʻq.
- AI faqat oʻqituvchi tomonida; oʻquvchiga tegmaydi.
- Formativ natija jurnalga kirmaydi.
