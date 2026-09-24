import postgres from "postgres";

/* ════════════════════════════════════════════════════════════════════
   TG1 XATI — «Ertangi darslaringiz endi Telegramda» (bir martalik).

   Ishga tushirish:
     npm run campaign:telegram                              — QURUQ YURISH (dev bazasi)
     npm run campaign:telegram -- --prod                    — QURUQ YURISH (jonli baza)
     npm run campaign:telegram -- --prod --only=siz@gmail.com --yes   — SINOV (oʻzingizga)
     npm run campaign:telegram -- --prod --yes              — HAQIQATAN yuborish

   ⛔ `--yes` boʻlmasa hech narsa yuborilmaydi va bazaga yozilmaydi.

   Kim oladi:
     - oʻqituvchi, sinov/admin hisobi emas (`exclude_from_metrics`), bloklanmagan
     - email TASDIQLANGAN va yuborsa boʻladigan manzil
     - obunadan chiqmagan, TG1 hali yuborilmagan
     - botdan FOYDA bor: jadvalda dars yoki muddatli ochiq vazifa
       (aks holda bot hech narsa yubormaydi — xat yolgʻon vaʼda boʻlardi)
     - Ustozona boti orqali xabar OLMAYDI:
         link  — Telegram umuman ulanmagan
         start — ulangan, lekin botni ochmagan
       Botni BLOKLAGANLAR olmaydi — bu ularning tanlovi.

   Kuniga bitta xat qoidasi dvigatelda (`campaign.ts`): bugun
   aktivatsiya xati olgan ustoz roʻyxatda koʻrinadi, lekin «bugun-xat-bor»
   bilan oʻtkazib yuboriladi — skriptni ertaga qayta yurgizish kifoya,
   yuborilganlarga takror ketmaydi.

   Ommaviy yuborish 1 soatga rejalashtiriladi — roʻyxat notoʻgʻri chiqsa
   Resend panelidan bekor qilishga vaqt qoladi. `--only` bilan — darhol.
   ════════════════════════════════════════════════════════════════════ */

const PROD = process.argv.includes("--prod");
const YES = process.argv.includes("--yes");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? null;
const KECHIKISH_SOAT = ONLY ? 0 : 1;

type Nomzod = { id: string; email: string; name: string | null; variant: "link" | "start" };

async function main() {
  const url = PROD ? process.env.PROD_DATABASE_URL : process.env.DATABASE_URL;
  if (!url) throw new Error(`${PROD ? "PROD_DATABASE_URL" : "DATABASE_URL"} topilmadi (.env.local).`);

  const host = new URL(url).hostname;
  const label = host.includes("supabase") ? "SUPABASE — JONLI BAZA" : "NEON — dev bazasi";
  console.log(`\n  Baza: ${label}  (${host})`);
  console.log(`  Rejim: ${YES ? "⚠️  HAQIQATAN YUBORILADI" : "quruq yurish (hech narsa yuborilmaydi)"}\n`);

  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

  /* Segment shartlari `getTgPrompt` (foyda bor) va admin «Telegram bot»
     kartasi (ulangan / botni ochmagan) bilan bir xil maʼnoda. */
  const nomzodlar = (await sql`
    WITH tg AS (
      SELECT ut.user_id,
             bool_or(c.telegram_id IS NOT NULL AND c.blocked_at IS NULL) AS active,
             bool_or(c.blocked_at IS NOT NULL)                           AS blocked
        FROM user_telegram ut
        LEFT JOIN tg_chats c ON c.telegram_id = ut.telegram_id
       GROUP BY ut.user_id
    )
    SELECT u.id, u.email, u.name,
           CASE WHEN tg.user_id IS NULL THEN 'link' ELSE 'start' END AS variant
      FROM "user" u
      JOIN teachers t ON t.id = u.id AND t.exclude_from_metrics = false
      LEFT JOIN tg ON tg.user_id = u.id
      LEFT JOIN email_activation ea ON ea.user_id = u.id
     WHERE u.email_verified = true
       AND COALESCE(u.banned, false) = false
       AND split_part(lower(u.email), '@', 2) NOT IN ('telegram.invalid', 'example.com', 'test.invalid')
       AND COALESCE(ea.opted_out, false) = false
       AND (t.prefs -> 'campaigns' -> 'tg1') IS NULL
       AND COALESCE(tg.active, false) = false
       AND COALESCE(tg.blocked, false) = false
       AND (
             EXISTS (SELECT 1 FROM timetable_versions tv
                      WHERE tv.teacher_id = u.id AND jsonb_array_length(tv.events) > 0)
          OR EXISTS (SELECT 1 FROM tasks k
                      WHERE k.teacher_id = u.id
                        AND k.status NOT IN ('done', 'canceled')
                        AND k.due_date IS NOT NULL)
           )
       AND (${ONLY}::text IS NULL OR lower(u.email) = lower(${ONLY}))
     ORDER BY variant, u.created_at
  `) as Nomzod[];

  if (ONLY) console.log(`  Filtr: faqat ${ONLY}\n`);
  const soni = (v: Nomzod["variant"]) => nomzodlar.filter((n) => n.variant === v).length;
  console.log(`  Nomzod: ${nomzodlar.length} ta  (ulash: ${soni("link")}, botni ochish: ${soni("start")})\n`);
  for (const n of nomzodlar) {
    console.log(`    ${n.variant.padEnd(7)}${(n.name ?? "—").slice(0, 22).padEnd(24)}${n.email}`);
  }

  if (ONLY && nomzodlar.length === 0) {
    console.log(
      "\n  Bu manzil roʻyxatga tushmadi. Sabablari: email tasdiqlanmagan, bot\n" +
        "  allaqachon ishlayapti yoki bloklangan, jadval ham vazifa ham yoʻq,\n" +
        "  obunadan chiqqan, yoki TG1 yuborilib boʻlgan.\n",
    );
  }

  // Sir tekshiruvi quruq yurishda ham — sabab: scripts/activation-a1.ts.
  if (PROD && !process.env.UNSUBSCRIBE_SECRET) {
    console.log(
      "\n  ⛔ UNSUBSCRIBE_SECRET yoʻq — obunani bekor qilish havolasi prodda\n" +
        "     rad etiladi. Vercel (Production) va .env.local da bir xil boʻlsin.\n",
    );
    if (YES) {
      await sql.end();
      process.exit(1);
    }
  }

  if (!YES) {
    console.log("\n  Quruq yurish tugadi. Haqiqatan yuborish uchun: --yes\n");
    await sql.end();
    return;
  }

  if (process.env.ACTIVATION_EMAILS !== "on") {
    console.log("\n  ⛔ ACTIVATION_EMAILS=on emas — yuborish darvozasi yopiq.\n");
    await sql.end();
    return;
  }

  /* Dvigatel `DATABASE_URL` ni oʻqiydi — import qilishdan OLDIN
     almashtiriladi (toʻliq sabab: scripts/activation-a1.ts). */
  process.env.DATABASE_URL = url;
  const { sendTelegramInvite } = await import("../src/server/email/campaign");

  const hisob = new Map<string, number>();
  for (const n of nomzodlar) {
    const natija = await sendTelegramInvite(n.id, n.variant, KECHIKISH_SOAT);
    hisob.set(natija, (hisob.get(natija) ?? 0) + 1);
    if (natija !== "yuborildi" && natija !== "rejalashtirildi") {
      console.log(`    ⚠️  ${n.email} → ${natija}`);
    }
  }

  console.log("\n  Natija:");
  for (const [natija, son] of [...hisob].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${natija.padEnd(24)} ${son}`);
  }
  const ketdi = (hisob.get("yuborildi") ?? 0) + (hisob.get("rejalashtirildi") ?? 0);
  console.log(
    ketdi === 0
      ? "\n  ⛔ HECH QANDAY XAT KETMADI. Yuqoridagi sababga qarang.\n"
      : `\n  ${ketdi} ta xat ketdi. Bekor qilish — Resend panelidan.\n`,
  );

  await sql.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
