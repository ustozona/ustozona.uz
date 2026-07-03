# Ustozona: Backend qurish rejasi (v1)

> **Holat (2026-07-03):** 1–9-bosqichlarning KOD qismi ✅ BITDI; qoldi: faqat haqiqiy Vercel deploy
> (foydalanuvchi akkauntida) va telefon-tekshiruv. 9-bosqichda: barcha store'lar boʻsh boshlanadi
> (statik seed fallback'lar olib tashlandi — yangi hisob boʻsh holat koʻradi, browserda tekshirildi);
> stale localStorage helperlar oʻchirildi (readCalendarFromStorage→getCurrentCalendar,
> readVersionsFromStorage/getTimetableForDate→useTimetableStore, bell-schedule load/save oʻlik kod);
> `LegacyStorageCleanup` (dashboard layout) eski kalitlarni bir marta oʻchiradi; demo davomat/jadval
> endi BITTA manbadan (scripts/demo-attendance.ts DEMO_TIMETABLE: 16 event, 14762 yozuv, oʻquv yili
> boʻyicha); push → generated migrations (drizzle/0000_init.sql, `npm run db:generate|db:migrate`,
> mavjud baza `--baseline` bilan belgilangan); backup — docs/backup.md; deploy — docs/deploy.md;
> `next build` OʻTADI (`ignoreBuildErrors` vaqtincha, 31 baseline tsc xato tozalangach olib tashlansin).
> Demo: demo@ustozona.uz / demo12345. **tsc baseline: 31 xato** (darvoza — oshmasin).

## Kontekst — nima uchun va nima qilamiz

Hozir Ustozona — faqat frontend: barcha maʼlumot (sinflar, oʻquvchilar, baholar, davomat, darslar, jadval...) brauzerning localStorage'ida. Oqibatlari: boshqa qurilmadan kirib boʻlmaydi, brauzer tozalansa maʼlumot yoʻqoladi, oʻquvchilar hech qachon ulana olmaydi, va `docs/backend-todo.md` dagi KRITIK muammolar (boʻlim almashganda tahrirlar yoʻqolishi, bir oʻquvchi bahosi turli sahifada turlicha chiqishi) tub yechimsiz qoladi.

Maqsad: maʼlumotlarni serverdagi bazaga koʻchirish, oʻqituvchi login bilan kiradigan qilish, poydevorni **Ustozona Baholash** (Kahoot/Blooket-uslub jonli viktorina) va sentyabrdagi oʻquvchilar kirishi uchun tayyorlash.

**Foydalanuvchi qarorlari (2026-07-03):**
1. Real oʻqituvchilar uchun; sentyabrgacha oʻquvchilar ham kira olishi kerak → boshidan multi-tenant (har jadvalda `teacher_id`), v1 login = oʻqituvchi.
2. Hosting: internetda bepul. Oʻzbekistonda saqlash istagi bor → huquqiy holat: 2026-03-27 dan qonun yumshagan — oddiy shaxsiy maʼlumotni xorijda saqlash mumkin (faqat biometrik/genetik/telekom maʼlumotlari majburiy mahalliy). Strategiya: **standart PostgreSQL** — hozir bepul Neon, keyin xohlasa UzCloud'dagi Postgres'ga `pg_dump` bilan koʻchiriladi (vendor lock-in yoʻq).
3. Hozirgi localStorage maʼlumotlari — sinov; migratsiya vositasi kerak emas, seed skript bilan toʻldiriladi.
4. Tartib: **avval backend, keyin Ustozona Baholash** — jonli viktorina serversiz boʻlmaydi; sxema viktorinani hisobga olib loyihalanadi.

## Stack (bittadan tavsiya, sabablari bilan)

| Nima | Tanlov | Nega |
|---|---|---|
| Baza | **Neon** (bepul Postgres, `@neondatabase/serverless`) | Sof Postgres — UzCloud'ga koʻchish oson. Supabase bepul loyihasi 7 kun ishlatilmasa pauza boʻladi (taʼtildan qaytgan oʻqituvchi uchun yomon); Neon faqat ~1s "uygʻonish" kechikishi bilan qutuladi. |
| ORM | **Drizzle** (`drizzle-orm` + `drizzle-kit`) | Sof TypeScript, native binding yoʻq → Windows + Turbopack'da muammosiz (Prisma'ning Rust engine'i shu yerda klassik ogʻriq). `drizzle-zod` mavjud Zod v4 bilan ishlaydi. `drizzle-kit studio` — vizual baza koʻruvchi. |
| Auth | **Better Auth** (Drizzle adapter) | Email/parol birinchi darajali, Google OAuth bitta konfiguratsiya. Hammasi oʻz Postgres jadvallarimizda — portativ. `anonymous` plugin = kelajakdagi "oʻquvchi PIN bilan akkauntsiz kiradi" oqimi; sentyabrda oʻquvchi akkauntlari — shu `user` jadvaliga `role` bilan qoʻshiladi. Native bcrypt yoʻq (node:crypto scrypt) → Windows build muammosi yoʻq. `nextCookies` plugini Next 16 async `cookies()` ni hal qiladi. |
| Validatsiya | Mavjud **Zod v4** + `drizzle-zod` | Allaqachon deps'da. |
| Realtime (kelajak viktorina) | **SSE** (route handler + DB polling) | Har qanday hostga portativ; 30 oʻquvchilik sinf uchun yetarli. |
| Skript runner | **tsx** (dev dep) | `scripts/seed.ts` ni Windows'da `@/*` path'lar bilan ishlatadi. |

Oʻrnatish: `npm i drizzle-orm @neondatabase/serverless better-auth` + `npm i -D drizzle-kit tsx drizzle-zod`.

## Arxitektura

Barcha server kodi `src/server/` ostida, har faylda `import "server-only"`:

```
src/server/db/client.ts            # drizzle(neon(DATABASE_URL))
src/server/db/schema/*.ts          # auth.ts (CLI generatsiya), teachers, grades, ...
src/server/auth.ts                 # betterAuth({...})
src/server/session.ts              # requireTeacher() — sessiyadan teacherId
src/server/dal/<domen>.ts          # barcha so'rovlar; har funksiya requireTeacher() chaqiradi
src/server/actions/<domen>.ts      # 'use server'; zod-parse → DAL
src/proxy.ts                       # Next 16 proxy (middleware emas!): /dashboard redirect
src/app/api/auth/[...all]/route.ts # Better Auth catch-all
src/lib/sync/create-server-sync.ts # store→server sync helper
src/hooks/useHydrateStore.ts       # server→store hydration hook
```

- **Mutatsiyalar** = server actions; **route handlers** faqat: auth catch-all, mavjud AI stream (`src/app/api/murabbiyona-ai/route.ts` — sessiya talab qilinadigan boʻladi), `/api/health`, kelajak viktorina SSE.
- **Multi-tenant**: `teacherId` HECH QACHON clientdan olinmaydi — DAL ichida sessiyadan (`requireTeacher()`). Proxy faqat UX redirect; haqiqiy himoya DAL'da (Next 16 docs tavsiyasi).
- **Sentyabr tayyorgarligi**: `students.user_id` nullable FK → auth `user` jadvali — hozirdan qoʻyiladi.

### Zustand migratsiya patterni (13 store, bitta pattern)

**Zustand client kesh boʻlib qoladi; server — haqiqat manbai.** Store API'lari oʻzgarmaydi → ~50 isteʼmolchi komponent tegilmaydi. Har store uchun 3 tahrir:
1. `persist(localStorage)` olib tashlanadi, `_hasHydrated` qoladi (mavjud mount-gate'lar ishlayveradi).
2. **Hydration**: `useHydrateStore(useXStore, getXPayload)` — mount'da read action → `setState`.
3. **Sync**: `createServerSync` store'ga subscribe boʻladi; immutable update'lar tufayli reference-diff arzon; oʻzgargan entitylar ~1.5s debounce bilan granular action'larga (`upsertGrades(batch)`...) yuboriladi; optimistik, xatoda retry + sonner toast. Oddiy store'lar (settings, calendar, notes) diff'siz — butun snapshot saqlanadi.

Namuna: `useGradesStore` (eng murakkabi) — `getGradesPayload()` 5 jadvaldan `Record<classId, ClassData>` yigʻadi; diff sinf→massiv→element darajasida; `(studentId, assignmentId)` kaliti bilan idempotent batch upsert.

## Baza sxemasi (asosiylari)

ID'lar: text PK, ilova generatsiya qiladi (seed'lar `"7a"` kabi string id ishlatadi). Har domen jadvalida `teacher_id text NOT NULL REFERENCES teachers(id) ON DELETE CASCADE` + index.

- Better Auth: `user` (+`role` default 'teacher'), `session`, `account`, `verification` — CLI generatsiya.
- `teachers` (id = user.id, name, email, school, subject, prefs JSONB...), `classes`, `students` (+ `user_id` nullable), `topics` (purpose formative|summative, weight_percent), `assignments` (max_score, topic_id, date), `grades` (**PK (student_id, assignment_id)**, score NULL, is_draft, missing) — qatʼiy relatsion.
- `attendance_statuses`, `attendance_records` (unique (student_id, date, class_id)).
- `standard_sets`/`standard_items`, `units`/`lessons` (content JSONB)/`lesson_schedules`, `timetable_versions` (bell_config **JSONB**)/`timetable_events`, `calendars`/`quarters`/`holidays`.
- `tasks` (subtasks/comments/recurrence/pomodoro **JSONB** — bir-foydalanuvchi hujjatlari), `class_notes`, `student_relations`, `feedback` (JSONB, oxirida), `notifications`.
- **Kelajakka (jadvallar Baholash loyihasida yaratiladi, v1 sxema toʻsqinlik qilmaydi)**: misconceptions, questions/question_options, assessments, responses; quiz_sessions (pin unique), quiz_participants (student_id NULL — PIN-anonim), quiz_responses.

JSONB qoidasi: oʻquvchilar/vaqt boʻyicha agregatsiya qilinadigani — relatsion (grades, attendance, responses); butunligicha oʻqib-yoziladigan hujjat — JSONB (bellConfig, tiptap content, subtasks, prefs).

## Bosqichlar (har biri alohida topshiriladigan va tekshiriladigan)

Har bosqich darvozasi: `npx tsc --noEmit` xato soni baseline'dan (**35**, 2026-07-03 da yozib olindi) oshmasin; `npm run dev` ishlasin. `next build` darvoza EMAS.

1. **Poydevor.** `node_modules/next/dist/docs` (route handlers, server actions, proxy, authentication, data-security) OʻQILADI. neon.tech'da `ustozona` loyihasi. Paketlar oʻrnatiladi. `.env.local` (DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL), `.env.local.example`, `.gitignore` tekshiruvi. `db/client.ts`, `schema/teachers.ts`, `drizzle.config.ts`, `npx drizzle-kit push`, `/api/health`.
   *Tekshirish*: `curl localhost:3000/api/health` JSON qaytaradi; `drizzle-kit studio` jadvalni koʻrsatadi.
2. **Auth.** `npx @better-auth/cli generate` → auth sxema; `src/server/auth.ts` (email+parol; Google env-gated — keyin qoʻshiladi); login/register sahifalari (oʻzbekcha); `src/proxy.ts`; `requireTeacher()` (birinchi kirishda teachers qatori yaratiladi); `useSettingsStore.profile` → DB (pattern'ning birinchi qoʻllanishi); AI route'ga sessiya talabi.
   *Tekshirish*: roʻyxatdan oʻtish → dashboard → profil ismi; chiqish → redirect; ikkinchi akkaunt faqat oʻz maʼlumotini koʻradi.
3. **Yadro sxema + seed.** classes/students/topics/assignments/grades (+attendance, relations) jadvallari; `scripts/seed.ts` (pastda).
   *Tekshirish*: seed 2 marta ishlaydi (idempotent); studio'da qator sonlari CLASS_DATA'ga mos.
4. **Baholar migratsiyasi** (namuna-domen): DAL + actions + sync + hydration; `useGradesStore`'dan persist olib tashlanadi.
   *Tekshirish*: baho qoʻy → hard reload → turibdi; Network'da debounced action; localStorage yozilmayapti; boshqa akkaunt koʻrmaydi.
5. **Davomat.** Xuddi shu pattern.
   *Tekshirish*: davomat belgila → reload → turibdi (backend-todo #1 yopildi).
6. **Darslar + jadval + kalendar.** useLessonStore, useTimetableStore, useCalendarStore.
7. **Vazifalar + standartlar.** useTaskStore (JSONB-og'ir), useStandardsStore.
8. **Qolganlari.** class notes, relations-store, useClassStore prefs (teachers.prefs'ga), notifications, feedback (v5 migratsiyali — eng oxiri).
9. **Mustahkamlash + deploy.** Store'lardan statik seed fallback'lar olib tashlanadi, eski localStorage kalitlari tozalanadi, Vercel Hobby'ga deploy (env'lar, prod URL), backup yoʻli (`pg_dump` hujjatlanadi yoki JSON eksport tugma). `drizzle-kit push` → generated migrations'ga oʻtiladi.
   *Tekshirish*: telefondan prod URL'ga kirib baho qoʻyish → reload → turibdi.

Keyin (alohida loyiha): **Ustozona Baholash** — PIN bilan kirish (`POST /api/quiz/join`), SSE jonli dashboard, misconception breakdown (`src/lib/diagnostics.ts` modeli asosida).

## Seed

`scripts/seed.ts` (`npx tsx --env-file=.env.local scripts/seed.ts`): (1) demo oʻqituvchi Better Auth API orqali yaratiladi (parol hash toʻgʻri boʻlishi uchun); (2) tranzaksiyada shu teacher_id qatorlari oʻchirilib, mavjud seed modullardan (`CLASS_DATA`, attendance-data, lessons-data, tasks-data, standards-data, academic-calendar, timetable, feedback-seed) string id'lar saqlangan holda qayta yoziladi. Har bosqichda oʻz boʻlimi qoʻshib boriladi.

## Xavflar / gotchalar

- **Next 16**: `await cookies()/headers()/params`; `proxy.ts` (middleware EMAS); auth tekshiruvi DAL ichida; Next 14/15 xotiradan kod yozilmaydi — bundled docs oʻqiladi.
- **Windows/Turbopack**: tanlangan stack sof JS — node-gyp/engine muammosi yoʻq.
- **Hydration**: mavjud `_hasHydrated`/mount-gate pattern migratsiya davomida AYNAN saqlanadi; gate'larni olib tashlash — v1'dan keyin.
- **tsc qarzi**: baseline 35 (2026-07-03), har bosqich oshirmasligi shart.
- **Neon cold start** ~0.5–1s birinchi soʻrovda — maqbul; `neon-http` stateless driver.
- **Sync qatlami** — asosiy texnik xavf: grades'da idempotent batch upsert (ikki marta yuborilsa zarar yoʻq), qolganlarda butun-snapshot.
- **Maktab Wi-Fi uzilishi**: optimistik store + retry; sahifa yopilishida oxirgi ~1.5s yoʻqolishi mumkin — v1 uchun maqbul (`sendBeacon` — keyingi yaxshilanish).

## Muhim fayllar

`src/store/useGradesStore.ts`, `src/lib/grades-data.ts`, `src/store/useSettingsStore.ts`, `docs/backend-todo.md`, `package.json`, `node_modules/next/dist/docs/` (oʻqish uchun).
