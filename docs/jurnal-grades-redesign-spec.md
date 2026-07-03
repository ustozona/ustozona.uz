# Jurnal (Grades) — qayta loyihalash spec'i (v1)

> Holat: dizayn kelishildi, kod boshlanmagan. Daisy Christodoulou prinsiplari + o‘qituvchi (foydalanuvchi) amaliyoti asosida.
> Ikkita ochiq qaror "🔶 QAROR KERAK" bilan belgilangan — kod boshlashdan oldin tasdiqlanadi.

## Fundamental prinsip (yadro)

**Tizim har bir bahoni ichkarida `0..1` (normallashgan foiz) sifatida saqlaydi. O‘qituvchi tanlagan hamma narsa — faqat "ko‘rinish qatlami" (display layer).**

- `internalScore = score / maxScore` → har doim `0..1`. Wayground 5 yoki 15 savol — farqi yo‘q, %ga keladi.
- Bu "yagona haqiqat manbai"ni kafolatlaydi: panel, jadval, o‘rtacha — hammasi shu bitta sondan kelib chiqadi.
- Display: o‘qituvchi `0.8125` ni 100-ballik ("81%"), 5-ballik ("4+"), 10-ballik, AQSH/Britaniya harf, yoki bajardi/bajarmadi sifatida ko‘rishni tanlaydi. Ichki hisob o‘zgarmaydi.

## Kelishilgan qarorlar

1. **Ballik ko‘rinish — o‘qituvchi tanlaydi, default 100-ballik (uzluksiz).** 5/10/AQSH/Britaniya/pass-fail — faqat mapping. Diskret shkalalar "distorting thresholds" (59 vs 60) muammosini keltirgani uchun default uzluksiz.
2. **Vazn — "ko‘paytirilgan hissa": `topic.weightPercent × assignment.weight`.** Double-count yo‘q. Default: barcha topic teng + barcha assignment "normal" → o‘qituvchi hech narsa sozlamasa, to‘g‘ri oddiy o‘rtacha chiqadi. Topic = o‘qituvchi nomlaydigan kategoriya (Uy ishi, Quiz, Imtihon, Loyiha...).
3. **Q / T — o‘rtachadan chiqariladi (Christodoulou: "dalil yo‘qligi ≠ bilim yo‘qligi").**
   - **Q (Qatnashmadi)** — darsga kelmagan.
   - **T (Topshirmadi)** — kelgan, ish bermagan.
   - Ikkalasi ham o‘rtachani pasaytirmaydi, lekin "Jami" ustunida vizual flag beradi (keyingi harakat: davomat vs ishni quvish).
4. **Bo‘sh / 0 / Q / T farqlanadi:** bo‘sh = hali dalil yo‘q; 0 = bajarib, natija past; Q/T = yuqoridagi.
5. **Draft → nashr — topshiriq darajasida.** ("Hammasini qaytarish" hozir butun sinfni nashr qiladi → bu yarim kiritilgan ishlarni oshkor qiladi. Nashr har topshiriq uchun alohida bo‘ladi.)
6. **Yagona statistika manbai:** panel/jadval/o‘rtacha bitta `compute*` funksiyasidan. (Hozir panel 0% — `maxPoints` vs `maxScore` xatosi.)
7. **Real sana:** har topshiriqqa sana kiritiladi (`fakeDueDate` o‘rniga); topic ichida sana bo‘yicha tartib.

## Topshiriqning ikki mustaqil o‘lchami

Topshiriq yaratishda ikki alohida narsa belgilanadi:

1. **`purpose`: formativ | summativ** (yangi maydon) — "Jami"ga kiradimi yo‘qmi.
   - **summativ** → "Jami"ga vazni bilan kiradi.
   - **formativ** → "Jami"ga KIRMAYDI; gridda alohida/susroq ko‘rinadi, faqat termostat (dars rejasi) signali. (Bu D1 = A ni o‘qituvchining aniq tanlovi orqali hal qiladi — evristika emas.)
2. **`Topic`: tur/kategoriya** (Quiz, Ochiq savol, Uy ishi, Sinf ishi, Amaliyot, Loyiha...) — o‘qituvchi nomlaydi, vaznni (`weightPercent`) shu olib yuradi. ⚠️ "tur" alohida maydon EMAS — bu Topic'ning o‘zi (takrorlamaslik uchun).

**Kuchli default (UX narxi uchun):** yangi topshiriq = summativ + "normal" vazn + bugungi sana. Shoshgan o‘qituvchi faqat nom yozib o‘tadi.

## Grid layout (v1)

Ustunlar tartibi:

`Ism | Formativ (o‘rtacha) | <topshiriq ustunlari, sana bo‘yicha> | Summativ (o‘rtacha)`

- **Ikki o‘rtacha ustun:** "Formativ" = faqat formativ topshiriqlar o‘rtachasi (tushunish signali); "Summativ" = faqat summativ o‘rtachasi (rasmiy attainment). Hech qachon aralashmaydi.
- **Topshiriq ustunlari sana bo‘yicha** (chapdan o‘ngga) → trend ko‘z bilan o‘qiladi.
- **Har ustun `·F` / `·S` belgisi bilan**, qaysi o‘rtachaga kirishi aniq.
- **Formativ katak ko‘rinadi** (ball + heatmap saqlanadi, susaytirilmaydi); ajratish ustun sarlavhasidagi belgi/rang orqali (masalan dashed vs solid aksent). Per-katak progress-bar EMAS (zich gridda shovqin).
- **Bonus signal:** Formativ vs Summativ farqi = "tushunadi-yu nazoratda ko‘rsata olmaydi" (transfer) holatini ochib beradi.
- **Trend ustuni (↗/↘)** — TASDIQLANGAN (B). "Summativ"dan keyin alohida ustun. Hisobi normallashgan ballga tayangani uchun qurilishi 1-bosqichdan keyin (3-bosqich), lekin layout'da o‘rni band.

## 🔶 QAROR KERAK (kod boshlashdan oldin)

- **D2. Grade Probability (chorak bahosi ehtimoli) — v2 (tasdiqlash).** v1 da "Jami" faqat joriy holat.

## Bosqichlar

- **1-bosqich (poydevor) ✅ BAJARILDI:** `0..1` ichki model + `maxScore` to‘g‘rilash + yagona statistika manbai (`grades-stats.ts`) + Q/T o‘rtachadan chiqarish + panel 0% tuzatildi.
- **2-bosqich ✅ BAJARILDI:** vazn (`topic% × assignment`, `WEIGHT_MULTIPLIER`) + ikki o‘rtacha ustun (Summativ sticky / Formativ o‘ngda) + F/S belgilari + sozlanadigan ballik ko‘rinish (`grade-scale.ts`: 100/5/10/harf/bajardi-bajarmadi, store'da persist) + real sana (`seedDate`, `formatDueDate`).
- **3-bosqich (qisman ✅):** Bajarildi — klaviatura navigatsiyasi (Enter→past, Tab/Shift+Tab→o‘ng/chap), o‘chirishda undo (toast action), **Trend ustuni** (↗/↘), **topshiriq darajasida nashr** (popoverʼda "N qoralamani nashr qilish" + F/S belgisi), **trendga bosilganda learning-curve popup** (mavjud `TrendChart` + `aggregateTrend` qayta ishlatilgan, oylik), **ustunni to‘ldirish**. ✅ **TO‘LIQ:** yangi topshiriqda formativ/summativ + sana tanlash, topshiriqni tahrirlash (modal qayta ishlatilgan), bitta katakni Q/T qilish (`q`/`t` yozish), Qidirish (ism bo‘yicha qator filtri), Filter (ustunlarni maqsad bo‘yicha), Topic bo‘yicha guruhlangan ustunlar, clipboard paste (ustunga vertikal), o‘zbekcha vazn yorliqlari.
  - **Trend ustuni (↗/↘):** oxirgi N (sana bo‘yicha) normallashgan balldan; formativ+summativ teng vazn (trend ≠ baho). Sodda: so‘nggi yarmi vs oldingi yarmi farqi yoki regressiya qiyaligi. Talqin: past o‘rtacha + ↗ = o‘zlashtira boshlagan; baland o‘rtacha + ↘ = sustlashyapti.
  - **Trendga bosilganda learning-curve popup** — o‘quvchi profilidagi mavjud "Baho dinamikasi" grafigini QAYTA ISHLATAMIZ (noldan qurmaymiz). ⚠️ Trend normallashgan `0..1` ballga tayanadi → 1-bosqichdan keyin.

## Scope'dan tashqari (keyin)

- Grade Probability (v2).
- Savol darajasidagi misconception diagnostikasi (hozirgi ranglar faqat "past/yuqori"ni ko‘rsatadi, "nega"ni emas).
- AI "shaxsiy savollar" (Personalized MCQ) generatsiyasi (v3+).
