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

   ⛔ QOʻLLASH UCHUN `--yes` SHART. Avval har doim:
     npm run db:migrate:dry
   Sabab (2026-09-04): prod jurnalidagi hash'lar repodagi fayllarga mos
   emas, chunki ayrim migratsiyalar QOʻLLANILGANDAN KEYIN tahrirlangan.
   Shu sababli 11 ta migratsiya "qoʻllanmagan" boʻlib koʻrinardi, lekin
   10 tasining obyektlari bazada allaqachon bor edi. Koʻr-koʻrona
   qoʻllash `CREATE TABLE "workspaces"` da yiqilar va `0035`
   maʼlumot koʻchirish migratsiyasini QAYTA bajarishga urinardi.

   Yaʼni "qoʻllanmagan" roʻyxatiga ISHONMANG — `--dry-run` uni
   koʻrsatadi, siz esa har birini `information_schema` dan tekshiring.
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

/** Ulanish manzilini parolsiz koʻrsatadi — qaysi bazaga tegayotganimiz. */
function nishon(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? ":" + u.port : ""}${u.pathname}`;
  } catch {
    return "(manzil oʻqilmadi)";
  }
}

/** Qoʻllanmagan koʻrinayotgan migratsiyalarni sanaydi — HECH NIMA yozmaydi. */
async function dryRun(url: string) {
  const { readMigrationFiles } = await import("drizzle-orm/migrator");
  const migrations = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  const sql = postgres(url, { prepare: false, max: 1 });
  const rows = await sql`SELECT hash FROM "drizzle"."__drizzle_migrations"`.catch(() => null);
  if (!rows) {
    console.log("__drizzle_migrations jadvali yoʻq — baza hali migratsiya koʻrmagan.");
    await sql.end();
    return;
  }
  const known = new Set(rows.map((r) => r.hash as string));
  const pending = migrations.filter((m) => !known.has(m.hash));
  console.log(`Jurnalda: ${rows.length} yozuv · repoda: ${migrations.length} migratsiya`);
  console.log(`Qoʻllanmagan koʻrinadi: ${pending.length}`);
  for (const m of pending) {
    console.log("   → " + (m.sql[0] ?? "").slice(0, 100).replace(/\s+/g, " "));
  }
  if (pending.length > 0) {
    console.log("");
    console.log(
      "⚠️ Bu roʻyxat YOLGʻON boʻlishi mumkin: qoʻllanilgandan keyin " +
        "tahrirlangan fayl hash'i oʻzgaradi va qayta 'qoʻllanmagan' " +
        "boʻlib koʻrinadi. Har birini information_schema dan tekshiring."
    );
  }
  await sql.end();
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL topilmadi. Ishga tushirish: npx tsx --env-file=.env.local scripts/migrate.ts"
    );
  }

  console.log(`Nishon baza: ${nishon(url)}`);

  if (process.argv.includes("--dry-run")) {
    await dryRun(url);
    return;
  }

  if (process.argv.includes("--baseline")) {
    if (!process.argv.includes("--yes")) {
      throw new Error("--baseline sxemani BAJARMASDAN belgilaydi. Rozi boʻlsangiz --yes qoʻshing.");
    }
    await baseline(url);
    return;
  }

  /* ⛔ Bugungi darsning darvozasi: qoʻllash ATAYLAB boʻlsin. */
  if (!process.argv.includes("--yes")) {
    throw new Error(
      "Migratsiya qoʻllanmadi — `--yes` yoʻq. Avval `npm run db:migrate:dry` " +
        "bilan nima qoʻllanishini koʻring, yuqoridagi nishon baza toʻgʻri " +
        "ekaniga ishonch hosil qiling, soʻng `npm run db:migrate -- --yes` yozing."
    );
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
