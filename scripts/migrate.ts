import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

/* ════════════════════════════════════════════════════════════════════
   MIGRATSIYALARNI QOʻLLASH (9-bosqich: push → generated migrations).

   Ishga tushirish:
     npm run db:migrate
     (= npx tsx --env-file=.env.local scripts/migrate.ts)

   drizzle/ papkasidagi hali qoʻllanmagan migratsiyalarni tartib bilan
   bajaradi va drizzle.__drizzle_migrations jadvaliga yozadi. Sxema
   oʻzgarish oqimi endi:
     1) src/server/db/schema/* tahrirlanadi
     2) npm run db:generate  (yangi 000N_*.sql yaratadi)
     3) npm run db:migrate   (bazaga qoʻllaydi)
   `drizzle-kit push` endi ishlatilmaydi — tarix migratsiya fayllarida.

   MAVJUD baza (push bilan qurilgan) uchun bir martalik:
     npx tsx --env-file=.env.local scripts/migrate.ts --baseline
   — 0000_init sxemani BAJARMASDAN "qoʻllangan" deb belgilaydi.
   ════════════════════════════════════════════════════════════════════ */

const MIGRATIONS_FOLDER = "./drizzle";

async function baseline(url: string) {
  const { readMigrationFiles } = await import("drizzle-orm/migrator");
  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  const sql = postgres(url, { prepare: false, max: 1 });
  await sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await sql`CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
    id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint
  )`;
  const existing = await sql`SELECT hash FROM "drizzle"."__drizzle_migrations"`;
  const known = new Set(existing.map((r) => r.hash as string));
  let marked = 0;
  for (const m of migrations) {
    if (known.has(m.hash)) continue;
    await sql`INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES (${m.hash}, ${m.folderMillis})`;
    marked++;
  }
  console.log(`Baseline: ${marked} migratsiya bajarilmasdan "qoʻllangan" deb belgilandi (jami ${migrations.length}).`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL topilmadi. Ishga tushirish: npx tsx --env-file=.env.local scripts/migrate.ts"
    );
  }

  if (process.argv.includes("--baseline")) {
    await baseline(url);
    return;
  }

  const db = drizzle(postgres(url, { prepare: false, max: 1 }));
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  console.log("Migratsiyalar qoʻllandi.");
}

/* `process.exit(0)` — postgres-js hovuzi ochiq qolsa Node hodisa
   sikli tugamaydi va skript qotib qoladi. neon-http stateless edi. */
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
