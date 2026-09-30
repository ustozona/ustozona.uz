import postgres from "postgres";

/* ════════════════════════════════════════════════════════════════════
   OʻQITUVCHILAR KUNI TABRIGI (1-oktyabr) — bir martalik, ikki kanal.

   Ishga tushirish (kanal: email | telegram):
     npm run campaign:oqituvchilar-kuni -- --kanal=email                       — QURUQ YURISH (dev)
     npm run campaign:oqituvchilar-kuni -- --kanal=email --prod                — QURUQ YURISH (jonli)
     npm run campaign:oqituvchilar-kuni -- --kanal=email --prod --only=siz@gmail.com --sinov --variant=sinf --yes   — SINOV
     npm run campaign:oqituvchilar-kuni -- --kanal=email --prod --yes          — HAQIQATAN

   ⛔ `--yes` boʻlmasa hech narsa yuborilmaydi va bazaga yozilmaydi.

   EMAIL — kim oladi: tasdiqlangan email, obunadan chiqmagan, OK1 hali
   yuborilmagan, Telegram'da botni ochib qoʻygan EMAS (ular bot orqali
   oladi — ikki marta xabar bormasin). Variant (templates/ok1.ts):
     sinf — sinfi yoʻq · jadval — sinfi bor, jadvali boʻsh · faol — qolgan
   Ommaviy yuborish 1 soatga rejalashtiriladi (Resend panelidan bekor
   qilish mumkin). `--only` bilan — darhol.

   TELEGRAM — kim oladi: Ustozona botini ochgan va bloklamagan, marketing
   xabaridan chiqmagan (`marketing_opt_out_at`), OK1TG hali yuborilmagan.
   Xabarda sotuv yoʻq — faqat tabrik (jadvali boʻsh boʻlsa — bir gap taklif).
   ════════════════════════════════════════════════════════════════════ */

const PROD = process.argv.includes("--prod");
const YES = process.argv.includes("--yes");
const KANAL = process.argv.find((a) => a.startsWith("--kanal="))?.slice("--kanal=".length);
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? null;
const KECHIKISH_SOAT = ONLY ? 0 : 1;
/** Sinov: faqat `--only` bilan. Telegram sharti va «allaqachon yuborilgan» oʻtkaziladi,
    jurnalga yozilmaydi. `--variant=sinf|jadval|faol` — xat variantini tanlash. */
const SINOV = process.argv.includes("--sinov");
const VARIANT = process.argv.find((a) => a.startsWith("--variant="))?.slice("--variant=".length) ?? null;

type EmailNomzod = { id: string; email: string; name: string | null; variant: "sinf" | "jadval" | "faol" };
type TgNomzod = { id: string; email: string; name: string | null; chat_id: string; jadvalli: boolean };

const BOSH_SAHIFA = (process.env.BETTER_AUTH_URL || "https://www.ustozona.uz").replace(/\/$/, "");

async function main() {
  if (KANAL !== "email" && KANAL !== "telegram") {
    throw new Error("--kanal=email yoki --kanal=telegram kerak.");
  }
  if (SINOV && !ONLY) throw new Error("--sinov faqat --only=email bilan ishlaydi.");
  if (VARIANT && !["sinf", "jadval", "faol"].includes(VARIANT)) {
    throw new Error("--variant=sinf | jadval | faol");
  }
  const url = PROD ? process.env.PROD_DATABASE_URL : process.env.DATABASE_URL;
  if (!url) throw new Error(`${PROD ? "PROD_DATABASE_URL" : "DATABASE_URL"} topilmadi (.env.local).`);

  const host = new URL(url).hostname;
  const label = host.includes("supabase") ? "SUPABASE — JONLI BAZA" : "NEON — dev bazasi";
  console.log(`\n  Baza: ${label}  (${host})`);
  console.log(`  Kanal: ${KANAL}`);
  if (SINOV) console.log("  ⚙️  SINOV rejimi: jurnalga yozilmaydi, Telegram sharti oʻtkaziladi");
  console.log(`  Rejim: ${YES ? "⚠️  HAQIQATAN YUBORILADI" : "quruq yurish (hech narsa yuborilmaydi)"}\n`);

  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const jadvalBor = sql`EXISTS (SELECT 1 FROM timetable_versions tv
                                 WHERE tv.teacher_id = u.id AND jsonb_array_length(tv.events) > 0)`;

  if (KANAL === "email") {
    const nomzodlar = (await sql`
      SELECT u.id, u.email, u.name,
             CASE
               WHEN NOT EXISTS (SELECT 1 FROM class_teachers ct WHERE ct.teacher_id = u.id) THEN 'sinf'
               WHEN NOT ${jadvalBor} THEN 'jadval'
               ELSE 'faol'
             END AS variant
        FROM "user" u
        JOIN teachers t ON t.id = u.id AND t.exclude_from_metrics = false
        LEFT JOIN email_activation ea ON ea.user_id = u.id
       WHERE u.email_verified = true
         AND COALESCE(u.banned, false) = false
         AND split_part(lower(u.email), '@', 2) NOT IN ('telegram.invalid', 'example.com', 'test.invalid')
         AND COALESCE(ea.opted_out, false) = false
         AND (${SINOV}::boolean OR (t.prefs -> 'campaigns' -> 'ok1') IS NULL)
         AND (${SINOV}::boolean OR NOT EXISTS (SELECT 1 FROM user_telegram ut
                           JOIN tg_chats c ON c.telegram_id = ut.telegram_id AND c.blocked_at IS NULL
                          WHERE ut.user_id = u.id))
         AND (${ONLY}::text IS NULL OR lower(u.email) = lower(${ONLY}))
       ORDER BY variant, u.created_at
    `) as EmailNomzod[];

    if (VARIANT) for (const n of nomzodlar) n.variant = VARIANT as EmailNomzod["variant"];
    const soni = (v: EmailNomzod["variant"]) => nomzodlar.filter((n) => n.variant === v).length;
    console.log(
      `  Nomzod: ${nomzodlar.length} ta  (sinf: ${soni("sinf")}, jadval: ${soni("jadval")}, faol: ${soni("faol")})\n`,
    );
    for (const n of nomzodlar) {
      console.log(`    ${n.variant.padEnd(8)}${(n.name ?? "—").slice(0, 22).padEnd(24)}${n.email}`);
    }
    if (ONLY && nomzodlar.length === 0) {
      console.log(
        "\n  Bu manzil roʻyxatga tushmadi. Sabablari: email tasdiqlanmagan, botni ochgan\n" +
          "  (u bot orqali oladi), obunadan chiqqan, yoki OK1 yuborilib boʻlgan.\n",
      );
    }
    await tugat(sql, PROD, YES);
    if (!YES) return;

    process.env.DATABASE_URL = url;
    const { sendTeachersDay } = await import("../src/server/email/campaign");
    const hisob = new Map<string, number>();
    for (const n of nomzodlar) {
      const natija = await sendTeachersDay(n.id, n.variant, KECHIKISH_SOAT, SINOV);
      hisob.set(natija, (hisob.get(natija) ?? 0) + 1);
      if (natija !== "yuborildi" && natija !== "rejalashtirildi") {
        console.log(`    ⚠️  ${n.email} → ${natija}`);
      }
    }
    natijaniChiqar(hisob, "xat", "Bekor qilish — Resend panelidan.");
  } else {
    const nomzodlar = (await sql`
      SELECT u.id, u.email, u.name, c.chat_id, ${jadvalBor} AS jadvalli
        FROM "user" u
        JOIN teachers t ON t.id = u.id AND t.exclude_from_metrics = false
        JOIN user_telegram ut ON ut.user_id = u.id
        JOIN tg_chats c ON c.telegram_id = ut.telegram_id
       WHERE c.blocked_at IS NULL
         AND c.marketing_opt_out_at IS NULL
         AND COALESCE(u.banned, false) = false
         AND (${SINOV}::boolean OR (t.prefs -> 'campaigns' -> 'ok1tg') IS NULL)
         AND (${ONLY}::text IS NULL OR lower(u.email) = lower(${ONLY}))
       ORDER BY u.created_at
    `) as TgNomzod[];

    console.log(
      `  Nomzod: ${nomzodlar.length} ta  (jadvalli: ${nomzodlar.filter((n) => n.jadvalli).length}, jadvalsiz: ${nomzodlar.filter((n) => !n.jadvalli).length})\n`,
    );
    for (const n of nomzodlar) {
      console.log(`    ${n.jadvalli ? "jadvalli" : "jadvalsiz"}  ${(n.name ?? "—").slice(0, 22).padEnd(24)}${n.email}`);
    }
    await tugat(sql, PROD, YES);
    if (!YES) return;

    process.env.DATABASE_URL = url;
    const { sendMessage, esc } = await import("../src/server/telegram/api");
    const { markCampaignSent } = await import("../src/server/dal/email-campaign");
    const hisob = new Map<string, number>();
    for (const n of nomzodlar) {
      const ism = n.name?.trim().split(/\s+/)[0] ?? null;
      const salom = ism ? `Hurmatli ${esc(ism)}` : "Hurmatli ustoz";
      let matn: string;
      let tugma: { text: string; url: string } | null = null;
      if (VARIANT ? VARIANT !== "jadval" : n.jadvalli) {
        matn =
          `${salom}, sizni 1-oktyabr — Oʻqituvchi va murabbiylar kuni bilan samimiy tabriklaymiz! 🌷 ` +
          `Kelajak avlodni tarbiyalashdek masʼuliyatli ishingizda doimo zafarlar yor boʻlsin. ` +
          `Doimo sogʻ-salomat boʻling, mehnatingiz rohatini koʻring. Bayramingiz muborak boʻlsin!`;
      } else {
        matn =
          `${salom}, sizni 1-oktyabr — kasb bayramingiz bilan samimiy muborakbod etamiz! 🌷 ` +
          `Mashaqqatli va sharafli yoʻlingizda doim omad yor boʻlsin. ` +
          `Tizimga dars jadvalingizni kiritsangiz, botimiz har kech ertangi darslaringizni eslatib turadi.`;
        tugma = { text: "Jadvalni kiritish", url: `${BOSH_SAHIFA}/dashboard/timetable` };
      }
      const res = await sendMessage(
        n.chat_id,
        matn,
        tugma ? { inline_keyboard: [[tugma]] } : undefined,
      );
      if (res.ok) {
        if (!SINOV) await markCampaignSent(n.id, "ok1tg");
        hisob.set("yuborildi", (hisob.get("yuborildi") ?? 0) + 1);
      } else {
        const sabab = `xato-${res.status}`;
        hisob.set(sabab, (hisob.get(sabab) ?? 0) + 1);
        console.log(`    ⚠️  ${n.email} → ${res.status} ${res.description}`);
        if (res.status === 403) {
          await sql`UPDATE tg_chats SET blocked_at = now(), updated_at = now() WHERE chat_id = ${n.chat_id}`;
        }
      }
      await new Promise((r) => setTimeout(r, 100)); // Telegram limiti: sekundiga ~30 ta
    }
    natijaniChiqar(hisob, "xabar", "Qaytarib boʻlmaydi — Telegram xabari darhol yetadi.");
  }

  await sql.end();
}

/** Sir va darvoza tekshiruvi — quruq yurishda ham (sabab: scripts/activation-a1.ts). */
async function tugat(sql: postgres.Sql, prod: boolean, yes: boolean) {
  if (KANAL === "email" && prod && !process.env.UNSUBSCRIBE_SECRET) {
    console.log(
      "\n  ⛔ UNSUBSCRIBE_SECRET yoʻq — obunani bekor qilish havolasi prodda\n" +
        "     rad etiladi. Vercel (Production) va .env.local da bir xil boʻlsin.\n",
    );
    if (yes) {
      await sql.end();
      process.exit(1);
    }
  }
  if (!yes) {
    console.log("\n  Quruq yurish tugadi. Haqiqatan yuborish uchun: --yes\n");
    await sql.end();
    return;
  }
  if (KANAL === "email" && process.env.ACTIVATION_EMAILS !== "on") {
    console.log("\n  ⛔ ACTIVATION_EMAILS=on emas — yuborish darvozasi yopiq.\n");
    await sql.end();
    process.exit(0);
  }
}

function natijaniChiqar(hisob: Map<string, number>, nima: string, izoh: string) {
  console.log("\n  Natija:");
  for (const [natija, son] of [...hisob].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${natija.padEnd(24)} ${son}`);
  }
  const ketdi = (hisob.get("yuborildi") ?? 0) + (hisob.get("rejalashtirildi") ?? 0);
  console.log(
    ketdi === 0
      ? `\n  ⛔ HECH QANDAY ${nima.toUpperCase()} KETMADI. Yuqoridagi sababga qarang.\n`
      : `\n  ${ketdi} ta ${nima} ketdi. ${izoh}\n`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
