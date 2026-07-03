# Jurnal (Grades) sahifasi — Daisy uchun ko‘rib chiqish brifi

> Maqsad: Daisy bu sahifaning **mantiqi, ishlashi va funksionalligi** bo‘yicha tavsiya bersin.
> Quyida sahifa hozir aslida nima qilishini (kod asosida) tasvirladik, so‘ng ochiq savollar.

Manba fayllar:
- `src/app/dashboard/(with-sidebar)/grades/page.tsx` — holat (state) va modal boshqaruvi
- `src/app/dashboard/(with-sidebar)/grades/_components/GradesTable.tsx` — jadval UI
- `src/app/dashboard/(with-sidebar)/grades/_components/helpers.ts` — hisob mantig‘i
- `src/lib/grades-data.ts` — ma'lumot modeli + harf-baho shkalasi
- `src/hooks/useClassPanelStats.ts` — chap paneldagi sinf o‘rtachasi

---

## 1. Sahifa nima qiladi (joriy holat)

**Tuzilma.** Chapda sinflar paneli (`ClassListPanel`), o‘ngda tanlangan sinfning baholar jadvali. Tanlangan sinf `useClassStore` (global) orqali boshqa sahifalar bilan sinxron.

**Jadval tuzilishi (`GradesTable`):**
- Qatorlar = o‘quvchilar; ustunlar = topshiriqlar (assignments).
- Birinchi (sticky) ustun — o‘quvchi (avatar + ism). Keyingi sticky ustun — "Jami" (umumiy foiz + harf-baho).
- Sarlavha qatori vertikal yozilgan topshiriq nomlari; ustun ostida topic rangi chizig‘i.
- Yuqorida sticky "o‘rtachalar" qatori: sinf o‘rtachasi + har topshiriq o‘rtachasi (`LetterAvg`).

**Baho kiritish.** Katakka bosilganda inline `CellEditor` ochiladi (`Input`). `Enter` saqlaydi, `Escape` bekor qiladi, `blur` ham saqlaydi. Qiymat `0..maxScore` oralig‘iga qisiladi. Bo‘sh kiritish = `null` (baho yo‘q).

**Qoralama (draft) tizimi.** Yangi kiritilgan baho `isDraft: true` bo‘ladi — katakda kichik nuqta bilan belgilanadi. Pastdagi footer "{N} qoralama baho hali qaytarilmagan / Talabalar siz qaytargunga qadar bahoni koʻra olmaydi" deydi va "Hammasini qaytarish" tugmasi barcha qoralamalarni `isDraft: false` qiladi. Bu — sinfdan tashqari ko‘rinmaydigan "nashr qilish" oqimi.

**Yaratish menyusi (Yaratish ▾):** uchta variant — Topshiriq (`NewAssignmentModal`), Qayta ishlatish (`ReuseModal` — boshqa sinfdan topshiriqni nusxalaydi), Mavzu/Topic (`NewTopicModal`).

**Topshiriq popover'i.** Sarlavhaga bosilganda `AssignmentTooltip` — tafsilot, tahrirlash va o‘chirish. O‘chirish topshiriqni va unga bog‘liq barcha baholarni o‘chiradi (toast bilan).

**Ma'lumot modeli (asosiy tushunchalar):**
- `Topic` (baholash turi: Tests/Homework...) — `weightPercent` (yig‘indisi 100 bo‘lishi kerak), `inputMode` (`score`/`select`), `passLabel`/`failLabel`.
- `Assignment` — `maxScore`, `topicId`, `weight` (`light/normal/heavy/exam`).
- `Grade` — `studentId`, `assignmentId`, `score|null`, `isDraft`, `isMissing`.

---

## 2. Hozir to‘g‘ri ishlamayotgan / ziddiyatli mantiq

Bu qism Daisyga "nimani tuzatish/qayta o‘ylash kerak" degan kontekst beradi.

**A. Vazn (weight) hisobda ishlatilmaydi.** `Topic.weightPercent` va `Assignment.weight` model'da bor, lekin `calcStudentTotals` oddiy o‘rtacha hisoblaydi (imtihon = kichik vazifa). Tizim vaznni ko‘rsatadi, ammo unga amal qilmaydi.

**B. Foiz `maxScore` ni hisobga olmaydi.** `helpers.ts` da `max = count * 100` — ya'ni har topshiriq 100 ballik deb faraz qilinadi. 20 ballik test bo‘lsa, foiz va harf-baho noto‘g‘ri. Topshiriq o‘rtachasi esa xom ballarning o‘rtachasini foiz sifatida ko‘rsatadi.

**C. Sinf o‘rtachasi 3 joyda 3 xil.** Jadval (`/100` farazi), `LetterAvg`, va chap panel (`useClassPanelStats`) — har biri boshqacha hisoblaydi. Panel hozir **0%** ko‘rsatyapti, chunki u mavjud bo‘lmagan `a.maxPoints` maydonini o‘qiydi (model'da `maxScore`). Yagona "haqiqat manbai" yo‘q.

**D. Ishlamaydigan boshqaruvlar.** "Qidirish" va "Filter" tugmalarida `onClick` yo‘q (dekorativ). Topshiriqni "tahrirlash" — `onEdit={() => {}}` (no-op).

**E. Tezkor kiritish cheklangan.** Faqat `Enter`/`Escape`. Strelka/`Tab` bilan kataklar orasida yurish, ustunni paste bilan to‘ldirish yo‘q — jurnal to‘ldirish sekin.

**F. O‘chirishda undo yo‘q.** Topshiriq + barcha baholari bir bosishda yo‘qoladi, faqat toast.

**G. Lokalizatsiya/pedagogika.** Harf-baho A–F (Amerikacha) — O‘zbekiston 5/100 ballik tizimiga mos emas. Vazn yorliqlari inglizcha (Light/Normal/Heavy/Exam). Muddat sanalari `fakeDueDate` bilan soxta generatsiya qilinadi.

---

## 3. Daisy uchun ochiq savollar (asosiy so‘rov)

Sahifa mantiqi/funksionalligi bo‘yicha tavsiya kutamiz, ayniqsa:

1. **Baholash modeli.** Yakuniy bahoni qanday hisoblash kerak — topic `weightPercent` bo‘yicha o‘lchovli, assignment vazni bo‘yicha, yoki ikkalasi? Yoki vazn umuman bo‘lmasin (oddiy o‘rtacha + shaffof)?
2. **Ballik tizim.** Standart O‘zbekiston uchun nima bo‘lsin — 5-ballik, 100-ballik, yoki sozlanadigan? A–F ni saqlash kerakmi?
3. **"Jami" ustuni nimani anglatishi kerak** — joriy yig‘ma o‘rtacha, chorak prognozi, yoki ikkala ko‘rinish?
4. **Qoralama → qaytarish oqimi** to‘g‘ri model'mi (o‘qituvchi avval qoralama qo‘yib, keyin "nashr" qiladi)? Yoki har baho darhol ko‘rinishi kerakmi?
5. **Bo‘sh katak vs 0 vs "M" (missing)** — bularning pedagogik farqi va vizual ifodasi qanday bo‘lsin?
6. **Tezkor kiritish UX** — klaviatura navigatsiyasi, bulk/paste, ustunni bir qiymat bilan to‘ldirish kerakmi (kундalik foydalanish uchun)?
7. **Vertikal sarlavhalar** ko‘p topshiriqda o‘qishga qiyin — muqobil ko‘rinish (qiya matn, gorizontal + scroll, guruhlash) bo‘yicha tavsiya?

> Eslatma: bu sahifa "Ustozona" assessment ekotizimining bir qismi (qarang `docs/ustozona-v1.md`). Tavsiyalar formativ/summativ ajratish, og‘irlik va pedagogik prinsiplarga mos kelishi maqsadga muvofiq.
