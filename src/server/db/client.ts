import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

/* ════════════════════════════════════════════════════════════════════
   DB CLIENT — Supabase Postgres (postgres-js, pooler orqali)

   Faqat server kodda ishlatiladi (`server-only` client bundle'ga
   tushishdan himoya qiladi). Seed skriptlar bu faylni EMAS, oʻz
   klientini yaratadi (server-only tsx ostida ishlamaydi).

   NEGA NEON EMAS
   --------------
   Ilgari `@neondatabase/serverless` ishlatilardi. U — Neon'ning OʻZ
   HTTP protokoli va faqat `*.neon.tech` bilan gaplashadi; Supabase
   bilan umuman ishlamaydi. Shuning uchun ikkala loyihani bitta bazaga
   yigʻishda drayver ham almashdi.

   ⚠️ POOLER — 6543-PORT, 5432 EMAS
   --------------------------------
   Vercel serverless har soʻrovga yangi jarayon ochadi. Toʻgʻridan-
   toʻgʻri ulanish (5432) bunda Postgres ulanish limitini tez tugatadi
   va bitta bazani LessonLab boti bilan BAHAM koʻrayotganimiz uchun bu
   ikkala mahsulotga ham tegadi. Supabase transaction pooler'i
   (Supavisor, 6543) aynan shu holat uchun.

   Buning NARXI bor: transaction rejimida `PREPARE` ishlamaydi, chunki
   har soʻrov boshqa backendga tushishi mumkin. Shuning uchun
   `prepare: false` — MAJBURIY. Uni olib tashlasangiz soʻrovlar
   «prepared statement ... does not exist» xatosini bera boshlaydi:
   doim emas, faqat ulanish almashganda, yaʼni testda koʻrinmay
   prodda chiqadi.
   ════════════════════════════════════════════════════════════════════ */

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL topilmadi — .env.local faylida Supabase connection string boʻlishi kerak."
  );
}

/* `max: 1` — serverless funksiya bir vaqtda bitta soʻrov bajaradi;
   koʻproq ulanish ochish umumiy hovuzni bekorga band qiladi.
   `idle_timeout` qisqa: funksiya toʻxtagach ulanish osilib qolmasin. */
const sql = postgres(url, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });
