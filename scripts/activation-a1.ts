import postgres from "postgres";

/* ════════════════════════════════════════════════════════════════════
   A1 XATI — MAVJUD KOGORTGA (bir martalik).

   Yangi roʻyxatdan oʻtganlarga A1 avtomatik ketadi (auth hook). Bu
   skript ULARDAN OLDIN kelganlar uchun: hook oʻsha paytda yoʻq edi.

   Ishga tushirish:
     npm run activation:a1            — QURUQ YURISH (dev bazasi)
     npm run activation:a1 -- --prod  — QURUQ YURISH (jonli baza)
     npm run activation:a1 -- --prod --yes   — HAQIQATAN yuborish

   ⛔ `--yes` boʻlmasa hech narsa yuborilmaydi va bazaga yozilmaydi.

   Kim oladi (docs/email-aktivatsiya-spec.md §5, §9 2-bosqich):
     - email TASDIQLANGAN (aks holda bounce → domen obroʻsi tushadi)
     - manzil yuborsa boʻladigan (telegram.invalid emas)
     - hali sinf ochmagan
     - obunadan chiqmagan va A1 hali yuborilmagan

   Yuborish DARHOL emas, 1 soatga rejalashtiriladi — roʻyxat notoʻgʻri
   chiqsa Resend panelidan bekor qilishga vaqt qoladi.
   ════════════════════════════════════════════════════════════════════ */

const PROD = process.argv.includes("--prod");
const YES = process.argv.includes("--yes");
const KECHIKISH_SOAT = 1;

type Nomzod = { id: string; email: string; name: string | null };

async function main() {
  const url = PROD ? process.env.PROD_DATABASE_URL : process.env.DATABASE_URL;
  if (!url) throw new Error(`${PROD ? "PROD_DATABASE_URL" : "DATABASE_URL"} topilmadi (.env.local).`);

  const host = new URL(url).hostname;
  const label = host.includes("supabase") ? "SUPABASE — JONLI BAZA" : "NEON — dev bazasi";
  console.log(`\n  Baza: ${label}  (${host})`);
  console.log(`  Rejim: ${YES ? "⚠️  HAQIQATAN YUBORILADI" : "quruq yurish (hech narsa yuborilmaydi)"}\n`);

  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

  const nomzodlar = (await sql`
    SELECT u.id, u.email, u.name
      FROM "user" u
      LEFT JOIN email_activation ea ON ea.user_id = u.id
     WHERE u.email_verified = true
       AND split_part(lower(u.email), '@', 2) NOT IN ('telegram.invalid', 'example.com', 'test.invalid')
       AND COALESCE(ea.opted_out, false) = false
       AND NOT COALESCE(ea.sent_log @> '[{"stage":"a1"}]'::jsonb, false)
       AND NOT EXISTS (
             SELECT 1
               FROM classes c
               JOIN class_teachers ct ON ct.class_id = c.id
              WHERE ct.teacher_id = u.id AND c.archived_at IS NULL
           )
     ORDER BY u.created_at
  `) as Nomzod[];

  console.log(`  Nomzod: ${nomzodlar.length} ta\n`);
  for (const n of nomzodlar) {
    console.log(`    ${(n.name ?? "—").slice(0, 22).padEnd(24)}${n.email}`);
  }

  if (!YES) {
    console.log("\n  Quruq yurish tugadi. Haqiqatan yuborish uchun: --yes\n");
    await sql.end();
    return;
  }

  if (process.env.ACTIVATION_EMAILS !== "on") {
    console.log("\n  ⛔ ACTIVATION_EMAILS=on emas — yuborish darvozasi yopiq.");
    console.log("     .env.local da yoqing, keyin qayta yurgizing.\n");
    await sql.end();
    return;
  }

  /* Dvigatel shu yerda import qilinadi: quruq yurishda Resend
     mijozini umuman yaratmaslik uchun.

     ⚠️ Bu zanjir `import "server-only"` ga olib boradi. Oʻsha paket
     `react-server` sharti YOʻQ boʻlsa import paytida XATO OTADI —
     shuning uchun package.json dagi buyruqda `--conditions=react-server`
     turibdi. Uni olib tashlamang, aks holda faqat `--yes` yoʻli
     yiqiladi (quruq yurish bu satrga yetmaydi va sogʻlom koʻrinadi). */
  const { scheduleStage } = await import("../src/server/email/activation");

  let n = 0;
  for (const nomzod of nomzodlar) {
    await scheduleStage(nomzod.id, "a1", KECHIKISH_SOAT);
    n++;
  }
  console.log(`\n  ${n} ta xat ${KECHIKISH_SOAT} soatga rejalashtirildi.`);
  console.log("  Bekor qilish kerak boʻlsa — Resend panelidan.\n");

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
