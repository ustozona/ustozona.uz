-- Jurnal yil qamrovi (koʻp oʻquv yili 3-bosqich): sanasiz topshiriqlarni
-- yaratilgan kuni bilan toʻldirish. Ustun sxemasi OʻZGARMAYDI ("date" allaqachon
-- mavjud, nullable qoladi) — bu faqat maʼlumot koʻchirish: sanasi yoʻq eski
-- topshiriqlar oʻquv yili oynasi (assignment.date ∈ yil.range) filtriga
-- tushishi uchun created_at kunidan sana oladi. created_at::date bir necha
-- kunga adashishi mumkin (mintaqa), lekin bu faqat qaysi yil chelagiga
-- tushishga taʼsir qiladi — hozirgi foydalanuvchilarda hammasi joriy yilga tushadi.
UPDATE "assignments" SET "date" = "created_at"::date WHERE "date" IS NULL;
