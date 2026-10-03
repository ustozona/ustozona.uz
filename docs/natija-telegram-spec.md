# Test natijasi → Telegram (ota-ona va oʻqituvchi)

> Holat: 1-versiya (2026-10-03).
>
> Kod:
> - Ustozona: `src/server/dal/assess/result-share.ts`,
>   `src/server/actions/result-share.ts`, `src/server/telegram/test-results.ts`,
>   `src/components/launch/ShareResults.tsx`.
> - LessonLab: `services/parent_results.py`, `POST /api/v1/parents/test-results`,
>   `handlers/parent_results_handler.py`.

## 1. Nima

Test jurnalga saqlangach, oʻqituvchi bitta tugma bilan natijani yuboradi.

- **Ota-onalarga.** Har biri faqat oʻz farzandining natijasini oladi:
  - ball va foiz;
  - sinf oʻrtachasiga nisbatan;
  - «takrorlash kerak» savollar;
  - ragʻbatlantiruvchi xulosa.

  Boshqa bolalarning ismi va oʻrni aytilmaydi.
- **Oʻqituvchiga** sinf xulosasi boradi:
  - qatnashganlar soni va sinf foizi;
  - eng yaxshi 3 oʻquvchi;
  - yordam kerak boʻlganlar (50% dan past);
  - eng qiyin 3 savol, keyingi darsda takrorlash tavsiyasi bilan.

Tugma ikki joyda:

1. **Sinf testi** (Doska) — yakuniy ekranda, «Jurnalga saqlash» dan keyin.
2. **Topshiriqlar → natija oynasi** (`RunMonitor`) — har qanday oʻtkazish
   uchun: jonli, oʻyin, mustaqil, qogʻoz, karta, pult.

## 2. Nega ota-onaga LessonLab yuboradi

Ota-onalar roʻyxati LessonLab botida turadi (`bot_parents`, oʻqituvchi
taklifi bilan bogʻlangan), bot ham shu dvigatelniki. Roʻyxat egasi
xabarni oʻzi yuboradi, Ustozona esa faqat natijani imzolangan hamkor
soʻrovi bilan uzatadi. Shunda:

- obunadan chiqish bitta joyda boshqariladi;
- ota-ona qaysi botga yozganidan qatʼi nazar xabar oʻsha botdan keladi;
- Ustozona ota-onalarning Telegram chat'ini saqlamaydi.

Oʻquvchilarni bogʻlash — `roster_links` (Ustozona `students` ↔ bot
`bot_students`).

## 3. Xavfsizlik

**Natija bazadan olinadi** (`responses`), brauzerdan emas. Proyektordagi
raqamni oʻzgartirib ota-onaga boshqa natija yuborib boʻlmaydi.

**LessonLab endpointi quyidagilarni tekshiradi:**

- hamkor imzosi va ruxsat etilgan hamkor (`GAMES_SSO_PARTNERS`);
- `uz_user_id ↔ telegram_id` AYNAN bogʻlanganligi — oʻqituvchi buni botda
  tasdiqlagan;
- har oʻquvchi sinfining **egasi** shu oʻqituvchi ekani
  (`parent_targets_for_uz_students`). Begona sinf bolasining ota-onasiga
  xabar ketmaydi.

**Obunadan chiqish:**

- `unsubscribed` ota-ona xabar olmaydi.
- Har xabar ostida «🔕 Bu xabarlarni oʻchirish» tugmasi bor (`pres_stop:<id>`).
- Tugma telefon, rol va Ustozona darvozalaridan oʻtadi: chiqish hech qachon
  toʻsilmaydi.
- Chat id Telegramning oʻzidan olinadi, shuning uchun boshqa odamning
  obunasini oʻchirib boʻlmaydi.
- `id = 0` rad etiladi: aks holda barcha obunalar oʻchib ketardi.

**Takror yuborilmaydi:**

- Ustozona tomonida `tg_notify_log` (oʻqituvchi, tur, sessiya) UNIQUE.
- LessonLab tomonida `Idempotency-Key: parents:<sessiya>`.
- Tarmoq uzilib soʻrov qayta yuborilsa ham xabar ikki marta ketmaydi.

**Impersonatsiya:** administrator oʻqituvchi nomidan kirgan boʻlsa,
ota-onalarga xabar yuborilmaydi.

## 4. Cheklovlar

- Ota-ona botga ulanmagan boʻlsa xabar bormaydi. Oʻqituvchiga «N
  oʻquvchining ota-onasi ulanmagan» deb aytiladi. Ota-onani ulash — botdagi
  ota-ona taklifi orqali (keyingi bosqichda Ustozona'ning oʻzidan).
- Natija bir marta yuboriladi. Javoblar keyin tuzatilsa, qayta yuborish yoʻq
  (ota-onaga ikki xil raqam bormasin).
