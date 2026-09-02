# Maktab dars jadvali — yoʻnalish hujjati (v1 — MUHOKAMA)

> **Kim uchun:** jamoa ichida. Ish boshlashdan oldin kelishib olish uchun.
> **Sana:** 2026-yil 2-sentabr.
> **Holat:** arxitektura va UX/UI **kelishildi** (§12) · dizayn tokenlarga
> koʻchirilishi kutilmoqda (§14).
> **Bogʻliq:** [ish-maydoni-arxitektura.md](./ish-maydoni-arxitektura.md) ·
> [roadmap-muhokama.md](./roadmap-muhokama.md) ·
> [lessonlab-bot-sinxron-muammolari.md](./lessonlab-bot-sinxron-muammolari.md)

---

## 1. Muammo

Maktabda dars jadvalini **oʻquv ishlari boʻyicha direktor oʻrinbosari
(OʻIBDOʻ)** tuzadi, direktor tasdiqlaydi, A1 formatda chop etilib devorga
osiladi. Bu bizdagi jadvaldan butunlay boshqa hujjat.

Haqiqiy varaqdan olingan talablar:

| Talab | Izoh |
|---|---|
| ~33 sinf × 6 kun × 6 soat ≈ **1200 katak** | Oʻlcham shundan kelib chiqadi |
| Katakda **fan + oʻqituvchi** | Oʻqituvchi — konfliktning birinchi darajali oʻlchovi |
| **Ikki smena** | Oʻzbekiston maktablarining koʻpchiligi |
| **Guruhga boʻlinish** | Chet tili, informatika — bitta sinf ikki guruh, bir vaqtda |
| **«Jami soat»** ustuni | Har sinf oʻquv rejasi soatiga **aniq** mos boʻlishi shart |
| **«Sinf rahbar»** qatori | Jadval varagʻining bir qismi |
| Direktor tasdigʻi + OʻIBDOʻ (1,0 va 0,5 stavka), MMIBDOʻ, psixolog imzolari | Chop etiladigan varaq rasmiy hujjat |

### 1.1. Bugungi holat va yoʻqotish

Ustozonadagi jadval **shaxsiy**:

```ts
// src/lib/timetable.ts
type TimetableEvent = { classId, day, startMin, endMin }
```

Oʻqituvchi ham, fan ham, xona ham yoʻq — bu bitta oʻqituvchining «men
qachon qayerda» jadvali. Maktab jadvali esa
`(sinf, kun, soat) → (fan, oʻqituvchi, xona)` va oʻqituvchi boʻyicha
global konflikt tekshiruvi. Bu **kengaytirish emas, yangi domen**.

Natijada bugun shunday boʻlyapti:

> OʻIBDOʻ jadvalni boshqa dasturda tuzadi → chop etadi → devorga osadi →
> **har bir oʻqituvchi oʻz jadvalini Ustozonaga qoʻlda qayta kiritadi.**

---

## 2. Markaziy qaror

Jadval **mahsulot emas, kanal**. Uni yolgʻiz sotish maʼnosiz — jahon
narxlari buni koʻrsatadi (bir martalik $99–700 oraligʻi). Qiymat jadval
**kundalik ishga ulangan**da paydo boʻladi.

📌 Jahon amaliyotidan olingan naqsh: bitta mamlakat oʻrta taʼlim
bozorining 90% dan ortigʻini egallagan yechim aynan **ikki mahsulot
juftligi** — maʼmuriyat tuzadigan jadval va oʻqituvchi/ota-ona kundalik
ilovasi. Jadval — maktabga **kirish eshigi**, kundalik ilova — **ushlab
qoluvchi**. Bizda ikkinchisi allaqachon bor; yetishmayotgani — birinchisi.

Shundan uch qaror:

1. **Mustaqil ost-loyiha** — `/jadval`. Dashboardga bogʻlanmaydi.
2. **Bepul tarif toʻliq ishlaydigan jadval tuzuvchi** boʻladi. Cheklov
   funksiya boʻyicha, hajm boʻyicha emas.
3. **Pul tarqatish va avtomatlashtirish uchun** toʻlanadi — maktab
   byudjetidan, zavuchning choʻntagidan emas.

---

## 3. Sirt va marshrut

`/doska` naqshi takrorlanadi. [proxy.ts](../src/proxy.ts) da yozilgan
siyosat aynan shu holat uchun: mahsulot tayyor va mehmon rejimi bor
boʻlsa, root'da **ilovaning oʻzi** turadi, marketing sahifasi emas.

- `src/app/jadval/` — oʻz `layout.tsx`, oʻz `page.tsx`
- `PROTECTED_PREFIXES` ga **qoʻshilmaydi** — login talab qilinmaydi
- himoya **DAL darajasida**, marshrut bilan emas (bir sahifa ham mehmon,
  ham kirgan holatda ishlaydi)
- `proxy.ts` yoʻl boʻyicha `stage` + `tone` sarlavhalarini qoʻyadi
  ([product-scope.ts](../src/lib/product-scope.ts) `toneFor`)
- `src/store/useSchoolTimetableStore.ts` — dashboard store'lariga tegmaydi
- ⛔ dashboard yon menyusida havola **yoʻq**

### 3.1. Mehmon rejimi va saqlash

Zavuch koʻpincha Ustozona haqida eshitmagan odam. Shuning uchun kirish
soʻralmaydi: sahifa ochiladi va ish boshlanadi.

⚠️ Lekin 1200 katakli jadvalni `localStorage` da qoldirish xavfli.
Qaror: **birinchi seans localStorage'da, «Saqlash» bosilganda roʻyxatdan
oʻtish soʻraladi.** Zavuch bu paytda ikki soat ish qilgan boʻladi — bu
eng halol konversiya nuqtasi, toʻsiq emas.

---

## 4. Maʼlumot modeli

Ikki hujjat, ular orasida **bir yoʻnalishli** nashr:

```
school_timetables          →  nashr  →   timetable_versions
(zavuch hujjati,               (bir       (oʻqituvchi jadvali —
 workspace_id)               yoʻnalish)    MAVJUD, teacher_id)
```

Yangi jadvallar:

| Jadval | Mazmuni |
|---|---|
| `school_timetables` | `workspace_id`, `effective_from`, `status`, `data` (JSONB) |
| `school_timetable_staff` | jadvaldagi «familiya» ↔ `teachers.id` bogʻlami |

`data` ichki shakli — **XHSTT** (oʻrta maktab jadvali uchun xalqaro
akademik format) modeliga yaqin: `Times / Resources (teacher, class,
room) / Events / Constraints`. Sabab §10.2 da.

⛔ **Mavjud `timetable_versions` ga tegilmaydi**
([planning.ts](../src/server/db/schema/planning.ts)). U oʻqituvchining
shaxsiy jadvali boʻlib qoladi — endi u ikki manbadan toʻlishi mumkin:
oʻzi tuzgan yoki maktabdan kelgan (`source: "school"`).

---

## 5. Nashr — tarqatish mexanizmi

⭐ Mexanizm **allaqachon qurilgan**. `timetable_versions` da
`effectiveFrom` va versiyalar tarixi bor
([useTimetableStore.ts](../src/store/useTimetableStore.ts)):

> Zavuch 15-yanvardan jadvalni oʻzgartirdi → har oʻqituvchida
> `effectiveFrom: "2026-01-15"` bilan **yangi versiya** paydo boʻladi.
> Eski versiya joyida qoladi, dekabr davomati buzilmaydi.

Yaʼni «oʻquv yili oʻrtasida jadval oʻzgardi» — eng ogʻriqli holat —
hech qanday yangi mexanizmsiz hal boʻladi. Versiyaga `source` maydoni
qoʻshiladi, xolos.

**Konflikt qoidasi:** oʻqituvchi maktabdan kelgan versiyani tahrir
qilsa, u shu oʻqituvchi uchun mahalliy versiyaga aylanadi va keyingi
nashr uni **bosib oʻtmaydi** — ogohlantirish koʻrsatiladi. Zavuch
majburan tenglashtira oladi.

---

## 6. Moslashtirish — eng qiyin joy

⚠️ Solver emas, **oʻqituvchini tanish** — asosiy mahsulot masalasi.
Zavuch katakka «Nurmatova M.» deb yozadi; tizim buni qaysi hisob ekanini
bilishi kerak. Bu yechilmasa tarqatish umuman ishlamaydi.

Nashrdan oldin **bir marta** koʻrsatiladigan ekran:

| Jadvaldagi | Ustozonada | Holat |
|---|---|---|
| Nurmatova M. | Nurmatova Malika | ✅ topildi |
| Xaydarov N. | — | 📨 taklif havolasi |

📌 **Bu ayni paytda oʻsish dvigateli.** Topilmagan oʻqituvchiga havola
yuboriladi; u roʻyxatdan oʻtadi va **jadvali toʻlgan holda** kiradi —
boʻsh ilova emas, oʻzining haqiqiy haftasi. Bittada oʻnlab faol hisob.

---

## 7. Tariflar

Chegara **funksiya boʻyicha**, hajm boʻyicha emas.

⛔ Sinf sonini cheklash — oʻlik yoʻl: 33 sinfli maktabga 10 sinf bersak,
zavuch eski dasturiga qaytadi va boshqa kelmaydi. Bepul tarif **toʻliq
ishlaydigan jadval tuzuvchi** boʻlishi shart, aks holda odat
shakllanmaydi.

| Bepul | Premium (maktab litsenziyasi) |
|---|---|
| Cheksiz sinf, oʻqituvchi, xona | **Barcha oʻqituvchilarga avto-tarqatish** |
| Qoʻlda tuzish, sudrash | **Avtomatik tuzish** (solver) |
| Jonli konflikt tekshiruvi | Almashtirish: kim kasal → kim boʻsh |
| «Jami soat» / oʻquv rejasiga moslik | Yuklama va tarif hisoboti |
| Import (jadval fayllaridan) | Versiya tarixi + direktor tasdigʻi |
| A1/A4 chop etish, PDF | Ustozona jurnaliga toʻliq ulanish |
| 1 faol versiya | Koʻp versiya, oʻzgarishlar qiyosi |
| Tarqatish — **3 oʻqituvchigacha** (tatib koʻrish) | Cheksiz |

**Narx oʻqituvchi soniga bogʻlanmaydi** — bogʻlansa zavuch sonini
kamaytirib koʻrsatadi. Yagona yillik maktab tarifi.

**Chop etishda suvli belgi qoʻyilmaydi.** Sabab: devorga osiladigan A1
varaq — maktabning har bir oʻqituvchisi har kuni qaraydigan joy. Kichik
«ustozona.uz/jadval» yozuvi yetarli; suvli belgi dushmanona koʻrinadi.

---

## 8. Ruxsatlar — yangi rol ixtiro qilinmaydi

Repoda hammasi bor:

- `workspaces.kind = "school"` —
  [workspaces.ts](../src/server/db/schema/workspaces.ts)
- `workspace_members.role = "admin"` —
  [workspace-members.ts](../src/server/db/schema/workspace-members.ts)

**Zavuch = `kind: "school"` maydonida `role: "admin"`.** Nashr huquqi
`owner | admin` ga bogʻlanadi.

⛔ Qamrov tekshiruvi **faqat**
[workspace.ts](../src/server/workspace.ts) orqali. Fayl boshidagi qatʼiy
qoida (`eq(X.workspaceId, …)` qoʻlda yozilmaydi) bu domenda ham amal
qiladi.

---

## 9. Izolyatsiya qoidasi

> Jadval mahsuloti bilan dashboard oʻrtasidagi **yagona koʻprik —
> `src/server/actions/timetable-publish.ts`**.
>
> Boshqa hech bir `jadval` fayli `useTimetableStore`, `useGradesStore`
> yoki dashboard komponentlarini import qilmaydi.

Bu tekshiriladigan qoida — keyinchalik `scripts/` darvozasi qoʻyish
mumkin, [check-server-actions.mjs](../scripts/check-server-actions.mjs)
kabi.

---

## 10. Solver — keyingi bosqich

### 10.1. Nega oxirida

Toʻliq avtomatik jadval amalda **rad etiladi**: foydalanuvchi algoritm
nima uchun shunday qilganini tushunmaydi va ishonmaydi. Jadvalda
yozilmagan, lekin qatʼiy cheklovlar boʻladi («u oʻqituvchi tumandan
qatnaydi, 1-soatga qoʻyma»). Jadval — qisman **siyosiy** hujjat.

Shuning uchun texnik topshiriq:

1. Solver **taklif qiladi**, hukm chiqarmaydi
2. Har katakni **qulflash** mumkin — «bunga tegma, qolganini joyla»
3. Solver **oʻzini tushuntiradi**: nega aynan shu joy
4. Buzilgan cheklov **koʻrinadi va sanaladi**, jimgina yutilmaydi
5. Qoʻlda sudrash — birinchi darajali funksiya

### 10.2. Nega XHSTT

- **Tekin sinov korpusi:** arxivda 8 mamlakatdan 21 ta real maktab
  masalasi va rasmiy baholovchi bor. Solverni birorta maktabni kutmasdan
  oʻlchash mumkin.
- **Tayyor cheklovlar tili** — oʻzimiz oʻylab topmaymiz.

### 10.3. Algoritm

Xalqaro musobaqa natijasi aniq: **gʻolib algoritmlarning hammasi
evristik** edi, aniq (exact) usullar emas. Gʻolib yondashuv:
boshlangʻich yechim → **Simulated Annealing** → **Iterated Local
Search**, 7 xil qoʻshnilik strukturasi bilan.

⚠️ Amaliy sir: **inkremental narx qayta hisobi** — har oʻzgarishda butun
jadval emas, faqat farq baholanadi. Havaskor implementatsiyalar aynan shu
yerda oʻladi.

### 10.4. Kutubxona tanlovi

| Yoʻl | Xulosa |
|---|---|
| Ochiq kodli tayyor jadval tuzuvchilar | ⛔ Aksariyati **AGPL v3** — kodiga qaramaymiz, butun Ustozona AGPL ga tushadi |
| Timefold | Java/Python — Vercel'da ishlamaydi, alohida servis kerak; 2.0 litsenziyani qattiqlashtirdi |
| OR-Tools CP-SAT (WASM) | ✅ Apache 2.0. ⚠️ brauzerda `Cross-Origin-Opener-Policy` + `Cross-Origin-Embedder-Policy` shart, aks holda qulaydi |
| **Oʻzimiz: SA + ILS (TypeScript)** | ✅ **Tavsiya** — Web Worker'da, infratuzilmasiz, XHSTT'da oʻlchanadi |

---

## 11. Bosqichlar

| # | Ish | Natija |
|---|---|---|
| 1 | `/jadval` sirti + `school_timetables` + qoʻlda grid | Zavuch jadval tuza oladi |
| 2 | Konflikt validatori + «Jami soat» + chop etish varagʻi | Devorga osiladigan hujjat |
| 3 | Import | Boshqa dasturdagi jadval bizga koʻchadi |
| 4 | **Moslashtirish + nashr** | ⭐ Qiymat shu yerda tugʻiladi |
| 5 | Taklif havolalari | Oʻsish dvigateli ishga tushadi |
| 6 | Solver | Premium sabab kuchayadi |

1-bosqichda [PeriodGrid.tsx](../src/components/timetable/PeriodGrid.tsx),
2-bosqichda
[TimetablePrintSheet.tsx](../src/components/timetable/TimetablePrintSheet.tsx)
asos sifatida qaraladi — lekin ular shaxsiy jadval uchun yozilgan,
koʻchirilishi shart emas.

---

## 12. UX/UI — kelishilgan qarorlar

Maket: **«Zavuch varagʻi»**
(https://claude.ai/code/artifact/0de98312-bd1e-4dfa-add1-65af6508e7a3)

### 12.1. Yoʻnalish

**Muharrir — chop etiladigan varaqning oʻzi.** Ekranda alohida «ilova
oynasi» va alohida «eksport» yoʻq: sarlavha, «Jami soat» qatori, sinf
rahbarlari va imzo bloklari ekranda ham, chop etishda ham bir joyda
turadi. Chop etish — masshtabni «Butun varaq»ga qoʻyish.

Yuza tili: **siyoh va qogʻoz**. Stol quyuq, varaq yorugʻ. Rang bezak
uchun ishlatilmaydi — faqat maʼno tashiydi (§12.4).

### 12.2. Joylashuv — varaq, dastur emas

| Oʻlchov | Qaror |
|---|---|
| Ustun | **Sinflar** |
| Qator | **Kunlar**, ichida soatlar |
| Chap rels | «Qoldiq» — qoʻyilmagan soatlar daftari va karta manbai |
| Yuqori | Maktab, versiya, masshtab, oʻqituvchi filtri, ziddiyat sanogʻi, tasdiq |

⚠️ **Bu jahon dasturlaridagidan teskari** — ularda sinflar qatorda,
kunlar ustunda. Biz devordagi varaqning joylashuvini tanladik: zavuch
uni yillar davomida shunday oʻqiydi, va faqat shunda ekran bilan chop
etilgan varaq **bir xil obyekt** boʻla oladi.

### 12.3. Masshtab maʼno oʻzgartiradi (semantik zum)

1200 katakni bitta ekranga sigʻdirishning yagona halol yoʻli:

| Daraja | Katakda | Nima uchun |
|---|---|---|
| Butun varaq | faqat fan rangi | Haftaning naqshi: fan qayerda toʻplangan, kimning kuni boʻsh |
| Fan | fan nomi | Kundalik tahrir |
| Fan + oʻqituvchi | fan va oʻqituvchi | Aniq tekshiruv |

«Butun varaq» ayni paytda chop etish koʻrinishi.

### 12.4. Rang — faqat hodisada

- **Fan rangi katakni toʻldirmaydi** — chap qirrasida 3px chiziq. Sabab
  funksional: 1200 toʻyingan katak varaqni oʻqib boʻlmas holga keltiradi.
- Qolgan rang faqat hodisada paydo boʻladi: qoʻyish holati va ziddiyat.
- Aksent — **tasdiq muhri rangi**; xato — **qizil qalam** rangi.

### 12.5. Karta olinganda — toʻrt holat

Jahon amaliyotidan olingan naqsh (nomi emas, mohiyati): karta
sudralayotganda maqsad ustuni yonadi, qolgani soʻnadi.

| Holat | Maʼnosi |
|---|---|
| Boʻsh | Qoʻyish mumkin |
| Ehtiyot | Mumkin, lekin ogohlantirish bor (masalan 6-soat) |
| Band | Oʻqituvchi shu vaqtda boshqa sinfda |
| Mumkin emas | Smena tashqarisi yoki oʻqituvchi kunini yopgan |

### 12.6. Ikki kiritish yoʻli — majburiy

**Sudrash yolgʻiz yetarli emas.** Jadval tizimlari boʻyicha tadqiqotlar
«koʻrsatma» yondashuvi toʻgʻridan-toʻgʻri manipulyatsiyadan yuqori
baholanganini koʻrsatadi. Shuning uchun:

1. Sudrash — relsdan katakka va katakdan katakka
2. **Klaviatura** — katakni tanlab fan kodini terish

Ikkinchisi ayni paytda klaviatura kirish imkoniyatini (a11y) taʼminlaydi.

### 12.7. Qolgan qarorlar

| Savol | Qaror |
|---|---|
| Oʻqituvchi / xona koʻrinishi | **Alohida rejim emas — yoritish.** Oʻqituvchi tanlanadi, uning kataklari yonadi, qolgani soʻnadi. Joylashuv oʻzgarmaydi |
| Ziddiyat koʻrsatilishi | Sudrash paytida — katak holati. Qoʻyilgandan keyin — doimiy qizil ramka **emas**, yuqorida sanoq va ochiladigan roʻyxat |
| «Jami soat» | Chap relsning **oʻzi**: «7-A da fizikadan 2 soat qoldi» — ham hisobot, ham sudraladigan karta. Nol boʻlsa jadval toʻliq. Varaq pastida chop etiladigan `bor / kerak` qatori, kamomad qizil |
| Ikki smena | **Bitta varaqda**, smena ajratgichi bilan (mavjud `PeriodGrid` naqshi). Toggle emas — varaqda ikkalasi ham boʻladi |
| Guruhga boʻlingan katak | **Yarim karta** — katak vertikal boʻlinadi, punktir chiziq bilan. Uch guruh boʻlsa uchga |
| Chop etish | Bir xil DOM, alohida maket yoʻq |
| Mehmon → hisob | Modal **emas**. Pastda tinch qator: «Ish brauzerda saqlanmoqda» → «Hisob ochib saqlash». Toʻsmaydi, lekin xavfni oldindan aytadi |
| Mobil | 1200 katakli muharrir telefon ishi emas. Telefonda faqat oʻqish va «mening jadvalim». Tahrirlash — desktop. Buni yashirmaymiz |

### 12.8. Motion budjeti

Butun mahsulotda **bitta** esda qoladigan harakat: tasdiqlanganda varaqqa
muhr tushishi. Qolgani — rang oʻzgarishi (150ms). 1200 katakka stagger
animatsiya **qoʻyilmaydi**.

---

## 13. Ogohlantirishlar

- ⛔ Yangi `"use server"` fayllarda **`export type { … }` yozilmaydi** —
  prodni butunlay oʻldiradi (AGENTS.md). Tiplar neytral modulga.
- ⚠️ `src/proxy.ts`, `src/server/workspace.ts` — markaziy fayllar,
  yolgʻiz tahrir qilinmaydi.
- ⚠️ Migratsiya LessonLab bilan **bitta bazada** ketadi — sinxron
  trigger'lari oldindan tekshiriladi
  ([lessonlab-bot-sinxron-muammolari.md](./lessonlab-bot-sinxron-muammolari.md)).

---

## 14. Dizaynni tokenlarga koʻchirish (sayqallash bosqichi)

Maket ataylab `DESIGN.md` kontraktidan **tashqarida** ishlangan — avval
erkin yoʻnalish, keyin tizimga koʻchirish. Koʻchirishda hal qilinadigan
nuqtalar:

| Maketda | Kontraktda | Qaror kerak |
|---|---|---|
| Xom hex ranglar | OKLCH tokenlar, `class-colors.ts` engine | Fan ranglari shu engine'ga koʻchiriladi |
| Oʻzgaruvchan kenglikli shrift (siqilgan ustun sarlavhalari) | DM Sans + JetBrains Mono | 33 ta ustun uchun siqilgan kenglik **funksional** — yangi oʻq ongli qaror sifatida qoʻshiladi yoki mavjud shrift bilan yechim izlanadi |
| Radius 3px | Shkalada eng kichigi 6px | Hujjat yumaloq boʻlmaydi — **deviatsiya** sifatida hujjatlashtiriladi |
| 10px katak matni | `.text-caption` 12px eng kichigi | Yangi `.text-micro` tokeni kerak |
| Varaqning zich toʻri | «Panel = border, soyasiz» | Zid emas, lekin alohida yozib qoʻyiladi |

⚠️ `DESIGN.md` va `globals.css` — markaziy fayllar. Har oʻzgarish
`DESIGN.md` ning «yashovchi kontrakt» tartibi boʻyicha: sabab yoziladi,
eski qoidaga tayangan joylar yangilanadi, `docs/design-system.md` sinxron
turadi.
