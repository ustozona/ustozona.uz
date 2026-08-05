import "server-only";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
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

/* ⚠️ KLIENT DANGASA (lazy) — IMPORT PAYTIDA YARATILMAYDI

   Ilgari `DATABASE_URL` tekshiruvi va `postgres(...)` chaqiruvi shu
   yerda, modul sathida turardi. Natijada faylni IMPORT qilishning oʻzi
   baza sirini talab qilardi va `next build` sirsiz muhitda yiqilardi:

       Error: Failed to collect page data for /api/health

   Next.js build paytida route modullarini import qiladi (config
   eksportlarini oʻqish uchun) — ulanmaydi, lekin modul sathidagi kod
   baribir ishlaydi. Yaʼni sir CI/build uchun ham majburiy boʻlib qolardi.

   Endi klient BIRINCHI ISHLATILGANDA quriladi. Xato xabari yoʻqolmadi —
   u endi build vaqtida emas, haqiqiy soʻrov paytida chiqadi, yaʼni
   aynan tegishli joyda. */

let _db: PostgresJsDatabase<typeof schema> | null = null;

function realDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;

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

  _db = drizzle(sql, { schema });
  return _db;
}

/* Proxy — chaqiruvchi kod uchun hech narsa oʻzgarmaydi: `db.select(...)`,
   `db.query.users`, `db.execute(...)` avvalgidek ishlaydi. Faqat birinchi
   murojaatda haqiqiy klient quriladi.

   Metodlar `bind` qilinadi: drizzle metodlari `this` ga tayanadi, proxy
   orqali olinganda esa `this` yoʻqolib qolardi.

   ⚠️ `Reflect.get` ga `receiver` UZATILMAYDI (yaʼni target = haqiqiy
   klient). Agar proxy receiver sifatida berilsa, `this` ga tayanadigan
   getter'lar ichida `this` yana proxy boʻlib qolardi va har murojaat
   oʻzini qayta chaqirib, cheksiz rekursiyaga tushardi. */
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const haqiqiy = realDb();
    const qiymat = Reflect.get(haqiqiy, prop);
    return typeof qiymat === "function" ? qiymat.bind(haqiqiy) : qiymat;
  },
});
