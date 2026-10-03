# Natijadan keyingi darsga — maʼlumotga asoslangan rejalash

> Holat: 1-versiya (2026-10-03). Kod:
> - `src/lib/class-insight.ts` — tur, AI uchun tozalash, prompt qatorlari;
> - `latestClassInsight` (`dal/assess/result-share.ts`);
> - `classInsightAction`;
> - `LessonStudio` va `StudioPlanColumn`;
> - `ai-studio.ts` (`insight`).

## 1. Nima

«Reja → dars → tekshiruv → keyingi reja» halqasi yopiladi:

1. **Tekshiruv.** Test oʻtadi (sinf testi, jonli, qogʻoz, karta, pult —
   istalgani).
2. **Natija oynasi.** Sinf testi yakuniy ekranida va Topshiriqlardagi
   natija oynasida **«Keyingi darsni shu natija bilan rejalash»** tugmasi
   bor. U Dars studiyasini shu sinf bilan ochadi.
3. **Studiya.** Reja tuzilmagan darsda **«Oxirgi test natijasi»** kartasi
   chiqadi:
   - test nomi, sinf foizi, nechta oʻquvchi 50% dan past;
   - eng qiyin 3 savol, aniqlik foizi bilan;
   - **«AI rejani shu natijaga moslasin»** belgisi (standart — yoqilgan).
4. **AI reja** shu natijaga moslanadi:
   - dars boshida (warmup) 5–7 daqiqa — aynan qiyin boʻlgan tushunchadagi
     xatoni tuzatuvchi takrorlash;
   - tekshiruv blokida shu tushunchaga oʻxshash yangi savol;
   - orqada qolganlar boʻlsa, faoliyatda yordamchi guruh yoki
     soddalashtirilgan topshiriq (tabaqalashtirish).

## 2. Qaysi test hisobga olinadi

Shu oʻqituvchining shu sinfdagi **oxirgi natijali** sessiyasi olinadi
(`updated_at` boʻyicha):

- 21 kundan eski boʻlmasligi kerak — eskisi endi sinf holatini aks
  ettirmaydi;
- javobsiz (boshlanib qolgan) sessiyalar oʻtkazib yuboriladi;
- koʻpi bilan oxirgi 6 tasi koʻriladi.

Natija bazadan hisoblanadi (`sessionShareData` — Telegram xulosasi bilan
bitta manba).

## 3. Maxfiylik

- AI ga **ismlar yuborilmaydi**, faqat sanoq (nechta oʻquvchi, nechtasi
  50% dan past) va qiyin savollar matni. Savollar oʻqituvchining oʻz
  testidan olinadi.
- Server soʻrovni qayta tozalaydi (`normalizeInsight`):
  - foizlar 0..100;
  - eng koʻpi 3 savol;
  - matn uzunligi cheklangan.
- `classInsightAction` faqat shu oʻqituvchining sessiyalarini koʻradi.
