import postgres from "postgres";

/* ════════════════════════════════════════════════════════════════════
   MAHSULOT METRIKASI — faollashuv voronkasi va qaytish.

   Ishga tushirish:
     npm run metrics

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
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL topilmadi (.env.local).");

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
      (SELECT COUNT(*)::int FROM classes c
         WHERE c.teacher_id = t.id AND c.archived_at IS NULL) AS class_count,
      (SELECT COUNT(*)::int FROM students s
         JOIN classes c2 ON c2.id = s.class_id
        WHERE c2.teacher_id = t.id)                  AS student_count,
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
  step("Sinf yaratgan", withClass.length);
  step("Oʻquvchi kiritgan", withStudents.length);
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
