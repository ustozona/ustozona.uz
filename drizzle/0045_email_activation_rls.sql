-- QOʻLDA yozilgan migratsiya (drizzle-kit RLS chiqarmaydi).
--
-- Loyiha naqshi: prod bazadagi 177 jadvalning 151 tasida RLS yoqilgan,
-- lekin BITTA HAM siyosat yoʻq. Yaʼni RLS bu yerda ommaviy API'ni
-- (anon / authenticated rollar) butunlay yopish vositasi; ilova esa
-- toʻgʻridan-toʻgʻri Postgres ulanishi orqali kiradi va RLS'ni
-- chetlab oʻtadi.
--
-- 0044 da yaratilgan jadval shu qoidadan chetda qolgan edi.
ALTER TABLE "email_activation" ENABLE ROW LEVEL SECURITY;
