/* ════════════════════════════════════════════════════════════════════
   USTOZONA BOTI — Telegram tomonini sozlash (bir martalik, qayta
   ishga tushirsa ham zarari yoʻq)

     npm run telegram:setup -- https://www.ustozona.uz

   Nima qiladi:
     1. setWebhook — `<sayt>/api/telegram/webhook`, `secret_token` bilan
     2. setMyCommands — /bugun, /ertaga, /start
     3. setMyDescription / setMyShortDescription — bot profilidagi matn

   Kerakli muhit: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET
   (`.env.local` dan). Saytda ham AYNI `TELEGRAM_WEBHOOK_SECRET`
   turishi shart — aks holda webhook har soʻrovga 401 qaytaradi.

   ⛔ BOT BIRLASHUVI (2026-09-26): @UstozonaBot webhook'i endi LessonLab
   jarayonida (VM, `https://lessonlab.uz/webhook`), Ustozona'ga oʻz
   update'lari u yerdan uzatiladi (docs/telegram-bot.md). Bu skript
   webhook'ni Vercel'ga qaytarib, butun botni (testlar, AI, oʻyinlar)
   OʻCHIRIB QOʻYARDI. Shuning uchun webhook boshqa joyda boʻlsa skript
   hech narsa qilmaydi; ataylab qaytarish (orqaga qaytarish) uchun:
     npm run telegram:setup -- https://www.ustozona.uz --force

   ⚠️ Webhook URL — prod domen. Lokal devda webhook ishlamaydi
   (Telegram localhost'ga yetib bormaydi); lokal sinov uchun tunnel
   kerak va bu skript tunnel URL bilan chaqiriladi.
   ════════════════════════════════════════════════════════════════════ */

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const args = process.argv.slice(2);
const force = args.includes("--force");
const site = (args.find((a) => !a.startsWith("--")) || process.env.BETTER_AUTH_URL || "").replace(/\/$/, "");

if (!token || !secret) {
  console.error("⛔ TELEGRAM_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET kerak (.env.local).");
  process.exit(1);
}
if (!/^https:\/\//.test(site)) {
  console.error("⛔ Sayt manzili https:// bilan boshlanishi kerak: npm run telegram:setup -- https://www.ustozona.uz");
  process.exit(1);
}
if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error("⛔ TELEGRAM_WEBHOOK_SECRET faqat A-Z a-z 0-9 _ - belgilaridan iborat boʻlishi kerak (Telegram talabi).");
  process.exit(1);
}

async function call(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  console.log(`${json.ok ? "✓" : "✗"} ${method}${json.ok ? "" : ` — ${json.description}`}`);
  if (!json.ok) process.exitCode = 1;
}

// tsx skriptlari CJS'ga oʻgiriladi — top-level await ishlamaydi.
async function main() {
  // Webhook kimda? Boshqa manzilda boʻlsa — bu bot birlashuvi, tegmaymiz.
  const current = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
    .then((r) => r.json() as Promise<{ result?: { url?: string } }>)
    .then((j) => j.result?.url ?? "")
    .catch(() => "");
  const ours = `${site}/api/telegram/webhook`;
  if (current && current !== ours && !force) {
    console.error(
      `⛔ Webhook hozir boshqa joyda: ${current}\n` +
        "   Bu bot birlashuvi — webhook LessonLab jarayonida, Ustozona update'lari u yerdan\n" +
        "   uzatiladi (docs/telegram-bot.md). Hech narsa oʻzgartirilmadi.\n" +
        "   Ataylab qaytarish kerak boʻlsa: npm run telegram:setup -- <sayt> --force"
    );
    process.exit(1);
  }

  await call("setWebhook", {
    url: `${site}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query", "my_chat_member"],
    max_connections: 20,
  });

  await call("setMyCommands", {
    commands: [
      { command: "bugun", description: "Bugungi darslar va vazifalar" },
      { command: "ertaga", description: "Ertangi darslar" },
      { command: "start", description: "Boshlash" },
    ],
  });

  await call("setMyShortDescription", {
    short_description: "Ustozlar uchun yordamchi: har kuni ertangi va bugungi darslar haqida eslatma.",
  });

  await call("setMyDescription", {
    description:
      "Darslar va rejalar doim yodingizda boʻladi.\n\n" +
      "• 🌙 Kechqurun — ertangi darslar va rejasi yozilmagan darslar\n" +
      "• ☀️ Ertalab — bugungi darslar va vazifalar\n\n" +
      "Boshlash uchun pastdagi tugmani bosing.",
  });

  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json());
  console.log("\nWebhook holati:", JSON.stringify(info.result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
