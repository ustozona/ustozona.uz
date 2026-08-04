import postgres from "postgres";

/* ════════════════════════════════════════════════════════════════════
   NEON → SUPABASE MAʼLUMOT KOʻCHIRISH

   Ishga tushirish (PowerShell):

     $env:SOURCE_DATABASE_URL = "<Neon satri>"
     $env:TARGET_DATABASE_URL = "<Supabase satri>"
     npx tsx scripts/kochir-supabase.ts

   Sinov uchun (hech narsa yozmaydi, faqat sanaydi):

     npx tsx scripts/kochir-supabase.ts --quruq

   NEGA `pg_dump` EMAS
   -------------------
   `pg_dump` alohida oʻrnatishni talab qiladi va versiyasi server
   versiyasidan past boʻlsa umuman ishlamaydi (PG 17 serverdan PG 16
   `pg_dump` dump ololmaydi). Node va `tsx` esa loyihada allaqachon bor.

   XAVFSIZLIK QOIDALARI
   --------------------
   1. Nishon jadval BOʻSH boʻlishi shart. Toʻla jadval koʻrsa skript
      TOʻXTAYDI — `--majburiy` bermaguningizcha. Bu ikki marta
      yugurtirib maʼlumotni ikkilantirib qoʻyishdan saqlaydi.
   2. Hammasi BITTA tranzaksiyada. Xato chiqsa hech narsa saqlanmaydi —
      yarim koʻchgan baza qolmaydi.
   3. Manbaga (Neon) FAQAT OʻQISH uchun tegiladi. U tegilmasdan qoladi,
      shuning uchun orqaga qaytish yoʻli ochiq.
   ════════════════════════════════════════════════════════════════════ */

/* Jadval tartibi MUHIM EMAS — nishonda `session_replication_role`
   `replica` ga qoʻyiladi va FK triggerlari umuman ishlamaydi. Lekin
   roʻyxatning OʻZI muhim: u qoʻlda yozilgan, chunki `information_schema`
   dan olsak Supabase'dagi LessonLab jadvallari ham tushib ketardi. */
const TABLES = [
  // Auth (better-auth)
  "user", "account", "session", "verification", "user_telegram",
  // Asosiy
  "schools", "teachers", "classes", "students",
  "topics", "assignments", "grades",
  "attendance_records", "attendance_statuses", "student_relations",
  "academic_years", "calendars", "units", "lessons", "timetable_versions",
  "standard_sets", "class_notes", "notifications", "feedback", "tasks",
  // Xulq
  "behavior_auto_settings", "behavior_skills", "behavior_rewards",
  "behavior_events", "behavior_redemptions", "behavior_deletions",
  // Oʻquvchi
  "student_notes", "student_invites", "student_links",
  "student_accommodations",
  // Baholash
  "activity_banks", "activities", "activity_items", "activity_sets",
  "quiz_sessions", "session_teams", "session_participants",
  "responses", "misconceptions", "omr_scans",
  // Qiyosiy baholash
  "cj_tasks", "cj_scripts", "cj_judgements", "cj_ranks",
  // AI, admin, blog
  "ai_chats", "ai_docs", "ai_usage", "admin_audit_logs",
  "blog_posts", "blog_comments",
];

/** `GENERATED ALWAYS AS IDENTITY` ustunlar.

    Postgres bunday ustunga qiymat yozishga YOʻL QOʻYMAYDI — oʻzi raqam
    beradi, yaʼni eski raqamlar yoʻqolardi. Yechim: koʻchirish vaqtida
    identity ni vaqtincha olib turish (DDL tranzaksiya ichida, xato
    boʻlsa u ham qaytadi), keyin qaytarib qoʻyish va hisoblagichni
    surish.

    `OVERRIDING SYSTEM VALUE` ham yechim boʻlardi, lekin u SQL da
    ustunlar roʻyxati bilan VALUES ORASIDA turishi shart — postgres-js
    ning toʻplamli INSERT yordamchisi esa u yerga hech narsa
    qoʻshtirmaydi. */
const IDENTITY_COLUMNS: Record<string, string> = { students: "student_number" };

const BATCH = 200;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} berilmagan.`);
  return v;
}

async function main() {
  const dryRun = process.argv.includes("--quruq");
  const force = process.argv.includes("--majburiy");

  const source = postgres(need("SOURCE_DATABASE_URL"), {
    prepare: false, max: 1, idle_timeout: 20,
  });
  const target = postgres(need("TARGET_DATABASE_URL"), {
    prepare: false, max: 1, idle_timeout: 20,
  });

  console.log(dryRun ? "QURUQ YURISH — hech narsa yozilmaydi.\n" : "Koʻchirish boshlandi.\n");

  // ── 1. Sanash va nishon boʻshligini tekshirish ──────────────────
  const plan: { table: string; rows: number }[] = [];
  let blocked = 0;

  for (const t of TABLES) {
    const [{ n: srcN }] = await source`SELECT count(*)::int AS n FROM ${source(t)}`;
    const [{ n: dstN }] = await target`SELECT count(*)::int AS n FROM ${target(t)}`;

    if (dstN > 0 && !force) {
      console.log(`  ⛔ ${t.padEnd(26)} nishonda ${dstN} qator BOR — oʻtkazib yuborildi`);
      blocked++;
      continue;
    }
    if (srcN > 0) plan.push({ table: t, rows: srcN });
  }

  const total = plan.reduce((s, p) => s + p.rows, 0);
  console.log(`\nKoʻchiriladi: ${plan.length} jadval, ${total} qator.`);
  if (blocked > 0) {
    console.log(`Toʻla jadvallar: ${blocked} ta. Ustiga yozish uchun --majburiy bering.`);
  }
  for (const p of plan) console.log(`  ${p.table.padEnd(26)} ${p.rows}`);

  if (dryRun) {
    console.log("\nQuruq yurish tugadi. Haqiqiy koʻchirish uchun --quruq siz ishga tushiring.");
    return;
  }
  if (plan.length === 0) {
    console.log("\nKoʻchiradigan narsa yoʻq.");
    return;
  }

  // ── 2. Bitta tranzaksiyada koʻchirish ───────────────────────────
  await target.begin(async (tx) => {
    /* FK triggerlarini oʻchiramiz — shunda jadval tartibi ahamiyatsiz
       boʻladi. `replica` rejimi tranzaksiya ichida amal qiladi va
       oxirida oʻz-oʻzidan qaytadi. */
    await tx`SET session_replication_role = replica`;

    // Identity ni vaqtincha olib turamiz — eski raqamlar saqlansin.
    for (const [t, col] of Object.entries(IDENTITY_COLUMNS)) {
      await tx.unsafe(`ALTER TABLE "${t}" ALTER COLUMN "${col}" DROP IDENTITY IF EXISTS`);
    }

    for (const { table, rows } of plan) {
      let moved = 0;
      for (let offset = 0; offset < rows; offset += BATCH) {
        /* Barqaror tartib: `ctid` — har qatorning jismoniy manzili.
           `ORDER BY` siz LIMIT/OFFSET qatorlarni takrorlashi yoki
           tushirib qoldirishi mumkin. */
        const batch = await source`
          SELECT * FROM ${source(table)} ORDER BY ctid LIMIT ${BATCH} OFFSET ${offset}
        `;
        if (batch.length === 0) break;

        /* postgres-js toʻplamli INSERT: `sql(qatorlar, ...ustunlar)`.
           Tur eʼloni bu shaklni tanimaydi (u shablon massivini kutadi),
           shuning uchun `as never` — bu FAQAT tur darajasidagi hiyla,
           ish vaqtida toʻgʻri yoʻl. */
        const cols = Object.keys(batch[0]);
        const rowsToInsert = batch.map((r) => ({ ...r }));
        await tx`INSERT INTO ${tx(table)} ${tx(rowsToInsert as never, ...cols)}`;
        moved += batch.length;
      }
      console.log(`  ✓ ${table.padEnd(26)} ${moved}`);
    }

    // Identity ni qaytarib qoʻyamiz.
    for (const [t, col] of Object.entries(IDENTITY_COLUMNS)) {
      await tx.unsafe(
        `ALTER TABLE "${t}" ALTER COLUMN "${col}" ADD GENERATED ALWAYS AS IDENTITY`
      );
    }
  });

  // ── 3. Identity ketma-ketligini surish ──────────────────────────
  /* `students.student_number` qiymatlari koʻchdi, lekin hisoblagich
     hali 1 da turibdi. Surmasak keyingi yangi oʻquvchi «duplicate
     key» beradi — va bu faqat OʻQITUVCHI yangi bola qoʻshganda,
     yaʼni koʻchirishdan ancha keyin chiqadi. */
  for (const [t, col] of Object.entries(IDENTITY_COLUMNS)) {
    const [row] = await target.unsafe(
      `SELECT setval(pg_get_serial_sequence('${t}', '${col}'),
                     COALESCE((SELECT max("${col}") FROM "${t}"), 0) + 1,
                     false) AS v`
    );
    console.log(`\n  ketma-ketlik ${t}.${col} → ${row.v}`);
  }

  // ── 4. Tekshirish: manba va nishon soni bir xilmi ───────────────
  console.log("\nTekshiruv:");
  let mismatch = 0;
  for (const { table } of plan) {
    const [{ n: a }] = await source`SELECT count(*)::int AS n FROM ${source(table)}`;
    const [{ n: b }] = await target`SELECT count(*)::int AS n FROM ${target(table)}`;
    if (a !== b) {
      console.log(`  ✗ ${table.padEnd(26)} manba ${a} ≠ nishon ${b}`);
      mismatch++;
    }
  }
  console.log(mismatch === 0
    ? "  ✓ hamma jadval mos keldi."
    : `  ✗ ${mismatch} ta jadvalda farq bor — TEKSHIRING.`);
}

/* `process.exit` — postgres-js hovuzi ochiq qolsa Node tugamaydi. */
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nXATO:", err instanceof Error ? err.message : err);
    console.error("Tranzaksiya qaytarildi — nishon bazada hech narsa oʻzgarmadi.");
    process.exit(1);
  });
