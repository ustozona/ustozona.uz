import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/* ════════════════════════════════════════════════════════════════════
   DB CLIENT — Neon Postgres (HTTP driver, stateless: serverless'ga mos).

   Faqat server kodda ishlatiladi (`server-only` client bundle'ga
   tushishdan himoya qiladi). Seed skriptlar bu faylni EMAS, oʻz
   klientini yaratadi (server-only tsx ostida ishlamaydi).
   ════════════════════════════════════════════════════════════════════ */

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL topilmadi — .env.local faylida Neon connection string boʻlishi kerak."
  );
}

const sql = neon(url);

export const db = drizzle({ client: sql, schema });
