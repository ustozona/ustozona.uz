# Ustozona — Yoʻl xaritasi: texnik ilova

> [roadmap-muhokama.md](./roadmap-muhokama.md) hujjatining developer-qatlami.
> Bu yerda: audit izlari, har kandidatning texnik asosi, ish hajmi baholarining sabablari.
> Yangilangan: 2026-07-14 (asoschi qarorlari kiritildi).

## 1. Audit izlari (2026-07-14 tekshiruvi)

| Nima tekshirildi | Topilma |
|---|---|
| `Student` tipi — `src/lib/grades-data.ts:20` | `gender`, `birthDate`, `parentName`, `parentPhone`, `studentPhone` bor; rasm/avatar yoʻq (initials). Teglar, subgruppa yoʻq. |
| Davomat modeli — `src/lib/attendance-data.ts` | 4 built-in status (QULFLANGAN toʻplam), vazn siyosati full/half/none/excluded, `AttendanceRecord.note` bor; `minutesLate` yoʻq. |
| **Ommaviy belgilash** — `AttendanceView.tsx:204` (`ColHeader` + `handleBulk`) | ✅ **BOR**: sana ustuni sarlavhasi popover orqali butun sinfga status qoʻyadi. Birinchi audit buni oʻtkazib yuborgan edi ("Hammasi keldi" feedback-seed'dagi demo taklif deb notoʻgʻri xulosa qilingan). |
| Davomat store — `src/store/useAttendanceStore.ts` | Server-backed, diff + ~1.5s debounce, optimistik. |
| Jurnal modeli — `src/lib/grades-data.ts` | `Topic.weightPercent` (avto-100%), `purpose: summative/formative`, 10+ `GradingScale`. Drop-lowest, rubrika, formula yoʻq. |
| Planner — `src/store/useLessonStore.ts:94` | `moveSession` bittalab bor; ommaviy shift/bump yoʻq. |
| Sync qatlami — `src/lib/sync/*` | 10 ta server-backed store juftligi (grades, attendance, behavior, lessons, timetable, tasks, standards, notifications, feedback + calendar/settings DAL orqali). Pattern: `create-server-sync.ts`. |
| Bildirishnomalar — `useNotificationsStore` + `NotificationsBell` | Jonli popover tayyor. |
| Backend reja — `docs/backend-plan.md` | 1–9-bosqich BITDI, sayt jonli. Hujjat allaqachon "keyin: **Ustozona Baholash** — PIN join, SSE jonli dashboard" deb yozgan — sxema shuni hisobga olib loyihalangan. |
| Ichki backlog — `docs/grades-v2-backlog.md` | Topshiriq→hujjat, zavuch governance, custom shkala, reliability, CJ interfeysi (§5 — endi tanlangan yoʻl). |

## 2. Kandidatlar — texnik asos va hajm sababi

Hajm shkalasi: **S** (≤2 kun) · **M** (3–7 kun) · **L** (1–3 hafta) · **XL** (oy+).

### 2.1. 15-avgust roʻyxati (muhokama-hujjat §4.1)

| Ish | Tayanadigan mavjud infra | Yangi ish / xavf | Hajm |
|---|---|---|---|
| Prod-tayyorlik | Kod tayyor: Google OAuth env-gated, `npm run db:seed` mavjud | ustozona.uz DNS + Vercel domain; telefon auth prod tekshiruvi (backend-progress qoldigʻi); env qoʻyish | **S** |
| **Sertifikatlash** | Barcha agregatlar tayyor: davomat foizi (`statusWeights`/weightedRate), jurnal darajasi (`getScaleBoundaries`), xulq ballari (useBehaviorStore). Print: lesson-editor A4 browser-print patterni. Brend: `BrandWordmark` | Sertifikat shablon(lar)i (print-route, design-system print varianti), mezon-avtomatika (thresholdlar: aʼlo oʻzlashtirish / eng yaxshi davomat / faol ishtirokchi / eng katta oʻsish), chorak tanlash, ism-fallback. Mezon sozlanadimi — §8 savol (muhokama-hujjat) | **M** |
| Ommaviy siljitish | `scheduleByClass` yagona manba, `moveSession`, `isSchoolDay`, undo-snapshot — `planner-scheduling-unified` | "Shu darsdan boshlab hammasini surish" bulk-op + bayram/taʼtilni sakrash + band-slot konflikt siyosati + undo | **M** |
| **OCR blanka MVP** | Quiz modeli (savol/variant); print-route patterni (blanka PDF) | 3 faza: (1) blanka generatori — savol soni/variantga qarab PDF, burchak-marker + oʻquvchi-ID zonasi bilan; (2) skaner — telefon kamera → perspektiva korreksiyasi → doira toʻldirilganini aniqlash (OpenCV.js brauzerda yoki server-side sharp+algoritm — MVPda server-side barqarorroq); (3) natija→jurnal koʻprigi. **Asosiy risk:** yorugʻlik/qiyshiq surat robustligi — MVP qatʼiy ramkali blanka + "qayta suratga oling" UX bilan cheklanadi. Stol-testdan sinf-pilotgacha | **XL** (MVP: ~2–3 hafta, parallel yuritiladi) |
| AI narx/yoʻl tahlili | `claude-api` maʼlumotlari, backend AI route skeleti | Hujjat: token-narx smetasi (dars rejasi ≈ N token × oyiga M oʻqituvchi), 3 model taqqosi (oʻz kaliti / server-proksi tarifda / limitli bepul), kesh/shablon optimizatsiyalari | **S** |

### 2.2. Avgust oxiri – sentabr (muhokama-hujjat §4.2)

| Ish | Texnik yoʻl | Hajm |
|---|---|---|
| Mobil moslashuv (maqsadli) | Skoup: OCR skaner oqimi (kamera UX) + davomat + jurnalga tez baho kiritish. `DashboardColumns` primitivining mobil Sheet bosqichi shu yerda ishga tushadi. Toʻliq sahifama-sahifa audit EMAS | **M–L** |
| **Maktab admin-lite** | Yangi entity: `schools` + `school_members(teacherId, role: admin/member)` + taklif-kod oqimi. Better-auth sessiyasiga tegmaydi — app-qatlam roli. ⚠️ Skoupni qatʼiy tor tutish: admin = aʼzolarni koʻrish/taklif/chiqarish + umumiy sinflar roʻyxati. Sozlamalar qulfi, umumiy shkala majburlash = KEYIN (toʻliq governance) | **L** |
| Kichik guruhlar | Minimal model: boʻlinma = sinf ichidagi student-id toʻplami (`class_subgroups` jsonb yoki jadval); davomat/jurnal UIda filtr sifatida. ⚠️ Hozir sinf bitta oʻqituvchiga tegishli — bir sinfni ikki oʻqituvchi boʻlishishi admin-lite'dagi maktab modeliga bogʻlanadi, shuning uchun juftlikda qilinadi | **M** |
| **Ota-ona/oʻquvchi mini-ilova (MVP)** | Tavsiya: **Telegram mini-app** (oʻrnatishsiz, auth `initData` orqali — parol yoʻq). Backend: read-only API (davomat, baholar, xulq) + bogʻlash-oqimi (oʻqituvchi oʻquvchiga bir martalik kod beradi, ota-ona botda kiritadi). Streak: davomat+faollikdan sof derive. Alohida yengil frontend (bitta sahifali) | **L** |
| OCR sayqallash | Yorugʻlik robustligi, ommaviy skan (ketma-ket 30 blanka), xato-korreksiya UX, marketing-material | **L** |

### 2.3. v2 va keyin

| Ish | Texnik yoʻl | Hajm |
|---|---|---|
| Jonli viktorina | Backend-plan tayyor reja: PIN join (`POST /api/quiz/join`), SSE (Vercelda ishlaydi), anonim sessiya, doska-view + kompyuter-view (informatika xonasi), natija→jurnal. OCR'dan keyin qilinsa quiz-kontent modeli umumiy | **XL** |
| QR-karta (Plickers modeli) | Oddiy QR emas: kartaning burilishidan javob oʻqiladi — ArUco-marker (js-aruco2) yoʻli; bitta kadrda koʻp karta. Karta PDF generatori OCR blanka generatori bilan umumiy poydevor | **XL** |
| Qiyosiy baholash chuqurlashtirish | Mavjud CJ sahifasi ustiga: juftlik-navbat algoritmi yaxshilash, ishonchlilik koʻrsatkichi, natijani jurnalga bogʻlash (grades-v2-backlog §5) | **M–L** |
| PDF tabel | Print-route `/students/[id]/report?term=...`; agregatlar tayyor; server-PDF kerak emas | **M** |
| AI dars rejasi (qurish) | Narx-tahlil qaroriga bogʻliq; prompt + oʻzbekcha sifat nazorati + kvota monitoring | **L** |
| Multimedia | Fayl storage yoʻq: Vercel Blob + kvota/xarajat + private URL. Faqat real talab boʻlsa | **L** |
| Toʻliq offline | Hozir: optimistik store + debounce (qisqa uzilishga chidaydi; sahifa yopilsa ~1.5s yoʻqolishi mumkin — backend-plan §xavflar). Toʻliq: outbox-queue + IndexedDB + konflikt siyosati (LWW dan boshlab). Bosqichlab: avval `sendBeacon` + retry-queue (M), keyin toʻliq offline (XL) | **XL** |
| Virtual doska | tldraw (watermark/pullik) yoki Excalidraw (MIT) embed + Jurnal vidjet qatlami; alohida surface | **XL** |
| Sinf ekrani vositalari | `/dashboard/screen` fullscreen route: taymer, navbat, kun tartibi; shovqin — Web Audio API | **M** |
| Blog/Forum | Alohida surface: profil + post (markdown), moderatsiya. Dizayn keyin | **XL** |
| Boshqaruv paneli | Toʻliq multi-tenancy ierarxiyasi — admin-lite tajribasidan keyin | **XL** |
| Audit jurnali | Drizzle wrapper yoki DB trigger → append-only jadval | **L** |
| Email xabarnoma | Resend/SES + shablon; PDF tabel bilan juftlik | **M** |

## 3. Cheklovlar va qoidalar (roadmapga taʼsir qiluvchi)

| Cheklov | Manba | Taʼsir |
|---|---|---|
| Grades v1 spec **LOCKED** | `docs/grades-v1-spec.md` | Drop-lowest/formula/custom-shkala — spec amendment + Daisy roziligisiz kiritilmaydi |
| **Ota-ona qarori OʻZGARDI (2026-07-14)** | asoschi | Eski qaror (2026-07-11: hammasi alohida ilovaga keyin) bekor: read-only mini-ilova (Telegram) yaqin bosqichda; toʻliq interaktiv portal baribir keyin |
| Zavuch toʻliq qatlami → admin-lite | asoschi 2026-07-14 | Sozlama qulflash/governance keyin; hozir faqat maktab-aʼzolik + admin roli |
| Davomat statuslari qulflangan toʻplam | `src/lib/attendance-data.ts` | Sabab turlari (agar qaytsa) statuslar soni oshirmasdan qilinadi; hozircha umuman keyinga surildi |
| Backend sxemasi Baholashni kutgan | `docs/backend-plan.md` | PIN/SSE reja tayyor — jonli viktorina poydevori bor |
| localStorage oʻqiydigan renderlar mount-gate talab qiladi | memory (academic-calendar) | Yangi client-side funksiyalarda hydration gotcha |
| Turbopack CSS / JSONB key-order / router.replace remount | memory gotchalar | Seating plan (agar qaytsa), deep-link ishlarida esda tutish |

## 4. 15-avgust sigʻimi (tekshiruv hisobi)

§4.1 roʻyxati: S (prod) + M (sertifikat) + M (siljitish) + S (AI tahlil) ≈ **9–12 ish kuni** + **OCR MVP parallel ~2–3 hafta** (eng katta noaniqlik). Xulosa: 4 haftaga sigʻadi, lekin OCR MVP oxirgi haftaga "ishlaydigan demo" holatida yetib kelishi realistik; sinf-pilot darajasidagi barqarorlik sentabrga oʻtadi. §4.2 (mobil, admin-lite+guruhlar, mini-app) ketma-ket boshlanadi — uchalasi birga yana ~4–5 hafta.

Har ish alohida sessiya/branch boʻlib, implementatsiya rejasi bilan boshlanadi.
