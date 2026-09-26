-- «Taʼtilda» (away) holati olib tashlandi.
--
-- Sabab: vaqtinchalik yoʻqlik yozilish (enrollment) holati emas, davomatning
-- ishi — bola taʼtilda ham roʻyxatda, maxrajda va oʻqituvchi javobgarligida
-- qoladi. Xalqaro maʼlumot modellarida ham yozilish holati faqat "kirdi /
-- chiqdi" oʻqi boʻyicha yuritiladi.
--
-- Qolgan holatlar: active | archived. Mavjud `away` qatorlari `active` ga
-- qaytariladi — ular hech qachon roʻyxatdan chiqmagan edi.
UPDATE "students" SET "status" = 'active' WHERE "status" = 'away';
