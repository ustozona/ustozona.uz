# Standartlar sahifasi — aniqlashtiruvchi savollar (Round 2) — ✅ HAL QILINDI

> **Holat (2026-06-22):** Daisy & Komil Jalilov barcha 7 savolga javob berdi — **hamma tavsiya qabul qilindi**. Markaziy qaror: **Standart = oʻlchanadigan psixometrik konstrukt.** Yakuniy qarorlar va yoʻl xaritasi `standards-page-spec.md` §9–§10 da.
>
> Qisqa: Q1=(b)+(c) · Q2=savol-daraja teglash · Q3=Coverage+Mastery yonma-yon · Q4=Lessons'dan avtomatik · Q5=decay faqat ozlashtirishda · Q6=CJ+rubrika · Q7=Ustozona curated baza.

---

> Daisy & Komil Jalilov uchun. v2 da asosiy falsafiy qarorlar olindi (avtomatik-dalil, DTS+DTM, ogʻirlikli, Qamrov≠Oʻzlashtirish, Bloom majburiy, integratsiya, prediktivlik=gipoteza). Quyida ana shu qarorlarni **amalga oshirish** uchun hali aniqlanmagan, lekin dizaynni belgilab beradigan 7 ta nuqta. Har biri: kontekst → tanglik → variantlar → tavsiyam.

---

## Q1. "Oʻzlashtirildi" deyish qoidasi (decision rule) qanday?

**Kontekst:** v2 da holat quizdan avtomatik. Lekin "quizdan oʻtdi" — bu aniq nima?

**Misol:** DT.01 ga bogʻlangan 10 talik quiz. Oʻquvchi 7 ta toʻgʻri qildi. "Oʻzlashtirildi"mi?

**Tanglik:** Chegara qayerda? Bir urinish yetarlimi? Holat ikki qiymatlimi (oʻtdi/oʻtmadi) yoki darajalimi?

**Variantlar:**
- (a) Oddiy chegara: ≥80% → oʻzlashtirildi (binary).
- (b) Uch daraja: <50% boshlangʻich · 50–80% shakllanmoqda · ≥80% mustahkam.
- (c) Takroriy: bir marta emas, **vaqt oʻtib 2 marta** (retrieval) muvaffaqiyatli boʻlsa — Daisy'ning "retrieval" tamoyili.

**Tavsiyam:** (b) + (c) birgalikda — daraja koʻrsatadi, lekin "mustahkam" faqat takroriy retrievaldan keyin beriladi. "Bir test = oʻzlashtirildi" — eng zaif variant.

---

## Q2. Quiz ↔ standart bogʻlanishi qaysi darajada?

**Kontekst:** "Har standart 10 talik quizga ega" deyildi. Lekin amalda baholash aralash boʻladi.

**Misol:** Choraklik nazorat — 20 savol, ular 6 xil standartga tegishli. Bu "bitta standart quizi" emas.

**Tanglik:** Bogʻlanish **quiz-daraja**da (butun quiz → bitta standart) yoki **savol-daraja**da (har savol → oʻz standartiga teg)?

**Variantlar:**
- (a) Quiz-daraja: sodda, lekin aralash testlarni qoʻllab-quvvatlamaydi.
- (b) Savol-daraja teglash: har savol standartga teglanadi; istalgan test standart dalilini taʼminlaydi. Moslashuvchan, prediktiv hisob uchun ham kuchli.

**Tavsiyam:** (b) savol-daraja. Bu yagona toʻgʻri yoʻl — aks holda oʻqituvchi har standart uchun alohida test tuzishga majbur, real darsга mos kelmaydi.

---

## Q3. Sahifadagi standart badge'i nimani bildiradi (sinf darajasida)?

**Kontekst:** Oʻzlashtirish — har **oʻquvchi** uchun alohida. Lekin bu sahifa **sinf** koʻrinishi. Bitta standart yonida bitta belgi turadi.

**Misol:** 28 oʻquvchidan 19 tasi DT.01 ni mustahkam oʻzlashtirgan. Standart yonida nima yozilsin?

**Tanglik:** Standart-daraja belgi sinf agregati boʻlishi kerak — qaysi koʻrinishda?

**Variantlar:**
- (a) Foiz: "DT.01 — 68% oʻzlashtirgan".
- (b) Svetofor: 🟢 ≥80% sinf · 🟡 50–80% · 🔴 <50%.
- (c) Ikkita raqam: "oʻqitildi ✓ · oʻzlashtirish 68%" — Coverage va Mastery yonma-yon.

**Tavsiyam:** (c). Aynan v2 dagi Qamrov≠Oʻzlashtirish ajratimini bitta satrda koʻrsatadi: oʻqituvchi "men oʻtdim, lekin 32% hali oʻzlashtirmagan" ziddiyatini darhol koʻradi.

---

## Q4. "Oʻqitildi" (Coverage) holatini kim/nima belgilaydi?

**Kontekst:** Oʻzlashtirish avtomatik. Ammo Coverage (oʻqitildi) — bu boshqa narsa: "men bu mavzuni darsda yetkazdim".

**Misol:** Oʻqituvchi DT.05 ni darsda tushuntirdi, lekin hali quiz oʻtkazmadi. Coverage = oʻqitildi, Mastery = nomaʼlum.

**Tanglik:** Coverage qoʻlda belgilanadimi yoki **darslar (lessons) modulidan avtomatik** keladimi (darsga standart biriktirilgan → dars "Completed" → Coverage avtomatik)?

**Variantlar:**
- (a) Qoʻlda checkbox (oddiy).
- (b) Lessons'dan avtomatik: standart darsga bogʻlangan va dars tugagan boʻlsa → oʻqitildi.

**Tavsiyam:** (b) — integratsiya tamoyiliga mos, qoʻlda ish kamayadi. (a) faqat zaxira variant.

---

## Q5. Oʻzlashtirish vaqt oʻtib kuchsizlanadimi (decay)? Bu sahifada koʻrinadimi?

**Kontekst:** `diagnostics.ts` da decay modeli bor. Daisy retrieval/unutishni taʼkidlaydi.

**Misol:** DT.01 sentyabrda mustahkam edi. Yanvarda retrieval boʻlmagani uchun model uni "kuchsizlanmoqda"ga tushiradi.

**Tanglik:** Decay'ni shu (Standartlar) sahifasiga olib chiqamizmi yoki faqat `ozlashtirish`da qoldiramizmi?

**Variantlar:**
- (a) Faqat `ozlashtirish`da — Standartlar sahifasi "static" tartib vositasi boʻlib qoladi.
- (b) Standartlarда ham — mustahkam standart yonida "↓ takrorlash kerak" belgisi chiqadi.

**Tavsiyam:** (a) — bu sahifa rejalashtirish uchun, decay/retrieval esa `ozlashtirish` (mastery) sahifasining ishi. Sahifalarni roli boʻyicha toza saqlash kerak.

---

## Q6. Quizlab boʻlmaydigan standartlar (insho, ogʻzaki, loyiha) qanday baholanadi?

**Kontekst:** "Murakkab gap tuzish", "fikrini asoslab yozish" — 10 talik MCQ bilan oʻlchanmaydi.

**Misol:** Ona tili standarti "matn yarata oladi" — bu obyektiv quiz emas, sub'ektiv baho.

**Tanglik:** Bunday standartlar uchun avtomatik-mastery qoidasi boshqacha boʻladimi?

**Variantlar:**
- (a) Comparative Judgement (CJ) — Daisy tavsiya qiladigan usul; ishonchli reyting beradi.
- (b) Rubrika + qoʻlda baho.
- (c) Bunday standartlar "oʻzlashtirish" hisobiga kirmaydi, faqat "oʻqitildi"да qoladi.

**Tavsiyam:** (a) CJ asosiy, (b) rubrika zaxira. Standart turini ("obyektiv/sub'ektiv") belgilab, mos baholash usulini biriktirish kerak.

---

## Q7. DTS/DTM standart kontenti amalda qayerdan keladi?

**Kontekst:** Import gʻoyasi tasdiqlandi, lekin **maʼlumotning oʻzi** qayerdan?

**Tanglik:** Tayyor toʻplamlarni kim va qanday kiritadi?

**Variantlar:**
- (a) Ustozona jamoasi rasmiy DTS hujjatlaridan **qoʻlda** kontent bazasi tuzadi (bir martalik, ishonchli).
- (b) Rasmiy API/ochiq maʼlumot bor boʻlsa — import.
- (c) Crowdsourcing: oʻqituvchilar ulashadi (lekin "word salad" xavfi → moderatsiya kerak).

**Tavsiyam:** (a) MVP uchun — bir nechta fan/sinf boʻyicha sifatli, tahrirlangan baza. (c) faqat moderatsiya bilan, keyinroq.

---

## Yakuniy uygʻunlashtiruvchi savol

Bu ysettita qaror **bitta markaziy tanlovga** bogʻlanadi:

> **Standart — bu "oʻqitish rejasidagi band"mi yoki "oʻlchanadigan psixometrik konstrukt"mi?**

- Agar **reja bandi** boʻlsa → Coverage yetarli, soddaroq tizim.
- Agar **oʻlchanadigan konstrukt** boʻlsa (Daisy yoʻnalishi) → savol-daraja teglash, decay, CJ, empirik ogʻirlik — hammasi zarur.

v2 javobi ikkinchisiga ogʻgan. Shuni **rasman tasdiqlasak**, R2 dagi tavsiyalar (Q1–Q7) izchil bir butun boʻladi.
