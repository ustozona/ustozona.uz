# Backend bilan hal qilinadigan muammolar (sinf-detali code-review)

> Reja: **backend keyingi oyda** (2026-07). Quyidagilar — frontend yamogʻi emas,
> *yagona haqiqat manbai* (single source of truth) va *saqlanish* muammolari.
> Backend (DB + API + data-fetching qatlami) qoʻyilganda bularni **bir marta**,
> toʻgʻri yopamiz. Hozircha frontend tomondagi sof UI/logika buglari alohida
> tuzatildi (pastdagi "Frontendda tuzatildi" boʻlimiga qarang).

Manba: 2026-06-27 dagi `/dashboard/classes/[id]` code-review. Bogʻliq xotira:
`[[class-detail-architecture]]`.

---

## 1. Boʻlim almashtirilganda tahrirlar yoʻqoladi (KRITIK)

`ClassDetail.tsx` faol boʻlimni **shartli render** qiladi → boshqa boʻlimga
oʻtilganda avvalgisi `unmount` boʻladi. Lekin:

- `GradesView` baholarni komponent `useState(classDataMap)` da saqlaydi
  (`grades/_components/GradesView.tsx`), store EMAS.
- `AttendanceView` `records` ni `useState` da saqlaydi
  (`attendance/_components/AttendanceView.tsx:445`).

**Natija:** oʻqituvchi baho/davomat qoʻyadi → boshqa boʻlimga oʻtadi → qaytadi →
hammasi seed holatiga qaytgan. Sahifa yangilanganda ham yoʻqoladi.

**Backend yechimi:** baho va davomat yozuvlari serverga (DB) yoziladi; client
React Query/SWR yoki RSC orqali serverdan oʻqiydi. Manba komponent state'idan
chiqib ketgani uchun unmount/refresh maʼlumotni yoʻqotmaydi. Tahrir → optimistik
update → `PATCH`/`POST`.

> Oraliq variant (agar backend kechiksa): baho/davomatni `useLessonStore` kabi
> Zustand `persist` store'ga koʻchirish — yoʻqolishni hoziroq toʻxtatadi. Hozir
> ataylab qilinmadi (backend yaqin), lekin imkoniyat bor.

## 2. Baholar/oʻquvchilar maʼlumoti turli joyda turlicha (KRITIK)

`StudentsSection.tsx`:
- `computeGrade` (42-48) = xom ballarning **oddiy oʻrtachasi**. Baholar jurnali
  esa kategoriya-vaznli, foiz-normallashtirilgan (`[[grades-v1-model]]`,
  `[[grades-scale-model]]`). Bir oʻquvchining oʻrtachasi Oʻquvchilar roʻyxatida va
  Baholar jurnalida **har xil** chiqadi.
- `seededAttendance` (50-53) = ID hash'idan **soxta** 84–100% son; haqiqiy Davomat
  boʻlimi maʼlumotidan butunlay uzilgan.

**Backend yechimi:** baho oʻrtachasi va davomat foizi **serverda bir marta**
hisoblanadi (yoki bitta umumiy domeyn funksiyasi orqali) va Oʻquvchilar / Baholar /
Davomat — uchchalasi shu qiymatni oʻqiydi. `seededAttendance` umuman olib
tashlanadi (haqiqiy yozuvlar boʻladi).

> Eslatma: baho formulasi izchilligi backend bilan **avtomatik** kelmaydi — uni
> bitta joyda (ideal: server) yozish kerak. Bu domeyn-logika qarori.

## 3. Stats/Overview qisman statik seed'dan (deep qismi)

`OverviewSection` va chap-nav stats endi `useLessonStore`'dan (jonli) oʻqiydi —
darslar boʻyicha izchillik **frontendda tuzatildi**. Ammo:

- **Oʻquvchilar soni** hamon `CLASS_DATA` (grades-data, statik) dan — roster
  store'da emas.
- **Baho/oʻzlashtirish** metrikalari statik seed'ga bogʻliq.

**Backend yechimi:** roster va baholar DB'da → barcha sanoq/progress bitta
manbadan. Statik `CLASS_DATA`/`STUDENTS_BY_CLASS` seed'lari olib tashlanadi.

## 4. Umumiy oʻng panel — eslatma/vazifa saqlanmaydi

`OverviewSidebar.tsx`: Eslatma `Textarea` state'siz/saqlanmaydi; Vazifalar tabi
statik; Kalendar tanlovi hech narsaga ulanmagan.

**Backend yechimi:** eslatma `classId` boʻyicha DB'ga saqlanadi; vazifalar real
task modeliga ulanadi (`[[task-composer-architecture]]`); kalendar tanlovi shu
sinf hodisalarini filtrlaydi.

> Frontend tomonda hozircha: panel "tez orada" sifatida qoldirildi (saqlash backendsiz
> yarim-yechim boʻlardi). Kerak boʻlsa, eslatmani localStorage'ga vaqtincha
> saqlash mumkin — lekin band-aid.

## 5. Mount-gate hack'lari — backend SSR bilan yoʻqoladi

`GradesSection`/`AttendanceSection`/`StandardsSection`/`PlannerSection` va
`LessonsSection`'dagi `mounted` gate'lari — **client-only `persist` store** SSR
seed bilan mos kelmasligi (hydration mismatch) sababli qoʻyilgan vaqtinchalik
yechim.

**Backend yechimi:** Next.js server components + serverdan data-fetching bilan
boʻlimlar ilk render'da haqiqiy maʼlumot oladi → SSR va client mos → mount-gate
**kerak boʻlmaydi**. Refactor paytida `useMounted()` hook'iga ham yigʻish mumkin
(agar gate qisman qolsa).

---

## Frontendda tuzatildi (backend kutmadi)

Bu buglar sof UI/logika — backend hech qachon yordam bermasdi, shuning uchun
hozir tuzatildi:

- Reja "↗ sinfni ochish" havolasi notoʻgʻri sinfga ketishi (hardcoded
  `/dashboard/classes`) — aniq sinfga yoʻnaltirildi; sinf-detali ichida yashirildi.
- "Yaqin darslar" sanaga koʻra filtrlanmagani/saralanmagani — bugundan keyingilar,
  sanaga koʻra tartiblangan; jonli store'dan.
- <lg ekranda boʻlim navigatsiyasi yoʻqligi — mobil boʻlim almashtirgich qoʻshildi.
- Boʻlimlar orasida brauzer "Orqaga" ishlamasligi (`router.replace` → `push`).
- Section wrapper nomuvofiqligi (PlannerSection).
