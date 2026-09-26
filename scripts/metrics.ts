import postgres from "postgres";

/* ════════════════════════════════════════════════════════════════════
   MAHSULOT METRIKASI — faollashuv voronkasi va qaytish.

   Ishga tushirish:
     npm run metrics        — DATABASE_URL (Neon, dev)
     npm run metrics:prod   — PROD_DATABASE_URL (Supabase, jonli)

   Skript ishga tushganda QAYSI bazaga ulanganini birinchi qatorda
   yozadi. 2026-08-17 da dev raqamlari prod deb keltirilib, feature
   prioriteti shu asosda muhokama qilingan — shuning uchun bu satr
   oʻchirilmaydi.

   NEGA BU BOR: feature soni oʻsishni koʻrsatmaydi. Bu skript bitta
   savolga javob beradi — "nechta oʻqituvchi ilovani HAQIQATDAN
   ishlatyapti?". Yangi feature yozishdan oldin shu raqamga qarang.

   Faollik = davomat yozuvi YOKI baho YOKI dars rejasi tegilgan.
   Sahifa ochish faollik emas — real ish qilingani muhim.
   ════════════════════════════════════════════════════════════════════ */

const DAY = 24 * 60 * 60 * 1000;

function pct(part: number, whole: number): string {
  if (whole === 0) return "  — ";
  return `${Math.round((part / whole) * 100)}%`.padStart(4);
}

function daysAgo(d: Date | string | null): string {
  if (!d) return "hech qachon";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / DAY);
  if (diff === 0) return "bugun";
  if (diff === 1) return "kecha";
  return `${diff} kun oldin`;
}

async function main() {
  /* ── Qaysi baza? ── `--prod` bayrogʻi PROD_DATABASE_URL ni tanlaydi.
     Izohni almashtirish marosimi YOʻQ: ikkala manzil bir vaqtda turadi. */
  const wantProd = process.argv.includes("--prod");
  const envName = wantProd ? "PROD_DATABASE_URL" : "DATABASE_URL";
  const url = process.env[envName];
  if (!url) {
    throw new Error(
      `${envName} topilmadi (.env.local).` +
        (wantProd ? " Supabase ulanish satrini shu nom bilan qoʻshing." : ""),
    );
  }

  const host = new URL(url).hostname;
  const label = host.includes("supabase")
    ? "SUPABASE — JONLI BAZA"
    : host.includes("neon")
      ? "NEON — dev bazasi"
      : "nomaʼlum baza";
  console.log(`\n  Baza: ${label}  (${host})`);

  const sql = postgres(url, { prepare: false, max: 1 });

  /* ── Har bir oʻqituvchi boʻyicha yagona qator: roʻyxat + faollik ──
     Faollik vaqtlari uch manbadan yigʻiladi, eng kechkisi olinadi. */
  const rows = (await sql`
    WITH activity AS (
      SELECT teacher_id, MAX(updated_at) AS last_at, COUNT(*)::int AS n
        FROM attendance_records GROUP BY teacher_id
      UNION ALL
      SELECT teacher_id, MAX(updated_at), COUNT(*)::int FROM grades GROUP BY teacher_id
      UNION ALL
      SELECT teacher_id, MAX(updated_at), COUNT(*)::int FROM lessons GROUP BY teacher_id
    )
    SELECT
      t.id,
      u.email,
      u.name,
      u.created_at                                   AS signed_up_at,
      /* Sinf oʻqituvchiga class_teachers orqali bogʻlanadi (ish maydoni
         arxitekturasidan keyin classes.teacher_id yoʻq). */
      (SELECT COUNT(*)::int FROM classes c
         JOIN class_teachers ct ON ct.class_id = c.id
        WHERE ct.teacher_id = t.id AND c.archived_at IS NULL) AS class_count,
      /* Oʻquvchi sinfga enrollments orqali bogʻlanadi. Bir oʻquvchi
         bir necha sinfda boʻlishi mumkin — DISTINCT shart. */
      (SELECT COUNT(DISTINCT e.student_id)::int FROM enrollments e
         JOIN class_teachers ct2 ON ct2.class_id = e.class_id
        WHERE ct2.teacher_id = t.id)                 AS student_count,
      /* Dars jadvali TOʻLDIRILGANmi. academic_years va boʻsh
         timetable_versions qatori onboardingda hammaga avtomatik
         yaratiladi — ular ajratmaydi, shuning uchun events'i bor
         versiya sanaladi. (Bu izohda backtick ishlatilmaydi: butun
         soʻrov JS template literal ichida.) */
      (SELECT COUNT(*)::int FROM timetable_versions tv
        WHERE tv.teacher_id = t.id
          AND jsonb_typeof(tv.events) = 'array'
          AND jsonb_array_length(tv.events) > 0)     AS timetable_count,
      (SELECT COUNT(*)::int FROM attendance_records a
         WHERE a.teacher_id = t.id)                  AS attendance_count,
      (SELECT COUNT(*)::int FROM grades g
         WHERE g.teacher_id = t.id)                  AS grade_count,
      (SELECT MAX(last_at) FROM activity WHERE activity.teacher_id = t.id) AS last_active_at,
      (SELECT MAX(s2.created_at) FROM session s2 WHERE s2.user_id = t.id)  AS last_login_at
      FROM teachers t
      JOIN "user" u ON u.id = t.id
     WHERE t.exclude_from_metrics = false
     ORDER BY u.created_at
  `) as Array<{
    id: string;
    email: string;
    name: string | null;
    signed_up_at: Date;
    class_count: number;
    student_count: number;
    timetable_count: number;
    attendance_count: number;
    grade_count: number;
    last_active_at: Date | null;
    last_login_at: Date | null;
  }>;

  const total = rows.length;
  if (total === 0) {
    console.log("\nHali bitta ham oʻqituvchi yoʻq.\n");
    return;
  }

  /* ── Voronka: har bosqich oldingisining ichki toʻplami ── */
  const withClass = rows.filter((r) => r.class_count > 0);
  const withStudents = rows.filter((r) => r.student_count > 0);
  const withTimetable = rows.filter((r) => r.timetable_count > 0);
  const activated = rows.filter((r) => r.attendance_count > 0 || r.grade_count > 0);
  /* Qaytgan = faollashgan va roʻyxatdan oʻtgandan 7+ kun keyin ham ishlagan. */
  const returned = activated.filter(
    (r) =>
      r.last_active_at !== null &&
      new Date(r.last_active_at).getTime() - new Date(r.signed_up_at).getTime() > 7 * DAY,
  );

  const weekAgo = Date.now() - 7 * DAY;
  const wau = rows.filter(
    (r) => r.last_active_at !== null && new Date(r.last_active_at).getTime() > weekAgo,
  );

  console.log("\n══════════════════════════════════════════════════");
  console.log("  FAOLLASHUV VORONKASI");
  console.log("══════════════════════════════════════════════════");
  const step = (label: string, n: number) =>
    console.log(`  ${label.padEnd(28)} ${String(n).padStart(4)}   ${pct(n, total)}`);
  step("Roʻyxatdan oʻtgan", total);
  console.log("  ── tayyorgarlik ──");
  step("Sinf yaratgan", withClass.length);
  step("Oʻquvchi kiritgan", withStudents.length);
  step("Dars jadvali toʻldirgan", withTimetable.length);
  console.log("  ── dars ishi ──");
  step("FAOLLASHGAN (davomat/baho)", activated.length);
  step("QAYTGAN (7 kundan keyin)", returned.length);
  console.log("──────────────────────────────────────────────────");
  console.log(`  Shu hafta faol (WAU)         ${String(wau.length).padStart(4)}   ${pct(wau.length, total)}`);

  /* ── Kim tashlab ketdi: qoʻngʻiroq qilish roʻyxati ──
     Faollashmagan yoki 14+ kun jim — har biridan sabab soʻralsin. */
  const twoWeeksAgo = Date.now() - 14 * DAY;
  const atRisk = rows.filter(
    (r) =>
      r.attendance_count === 0 ||
      r.last_active_at === null ||
      new Date(r.last_active_at).getTime() < twoWeeksAgo,
  );

  console.log("\n══════════════════════════════════════════════════");
  console.log(`  SABAB SOʻRASH KERAK — ${atRisk.length} ta`);
  console.log("══════════════════════════════════════════════════");
  if (atRisk.length === 0) {
    console.log("  Hech kim tashlab ketmagan.");
  } else {
    for (const r of atRisk) {
      const where =
        r.class_count === 0
          ? "sinf yaratmagan"
          : r.student_count === 0
            ? "oʻquvchi kiritmagan"
            : r.timetable_count === 0
              ? "jadval toʻldirmagan"
              : r.attendance_count === 0
                ? "davomat belgilamagan"
                : "boshlagan, keyin toʻxtagan";
      console.log(
        `  ${(r.name ?? r.email).slice(0, 22).padEnd(24)}` +
          `${where.padEnd(22)}` +
          `oxirgi ish: ${daysAgo(r.last_active_at)}`,
      );
    }
  }

  /* ── Faol oʻqituvchilar: nima ishlayotganini koʻrish uchun ── */
  const healthy = rows.filter((r) => !atRisk.includes(r));
  console.log("\n══════════════════════════════════════════════════");
  console.log(`  FAOL — ${healthy.length} ta`);
  console.log("══════════════════════════════════════════════════");
  for (const r of healthy) {
    console.log(
      `  ${(r.name ?? r.email).slice(0, 22).padEnd(24)}` +
        `${r.class_count} sinf, ${r.student_count} oʻquvchi`.padEnd(22) +
        `${r.attendance_count} davomat, ${r.grade_count} baho`,
    );
  }
  console.log("");
}

/* `process.exit(0)` — postgres-js hovuzi ochiq qolsa Node hodisa
   sikli tugamaydi va skript qotib qoladi. neon-http stateless edi,
   shuning uchun ilgari bu kerak emasdi. */
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
