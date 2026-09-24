# Ustozona boti — ishga tushirish va ishlash tartibi

Bot uchta ishni bajaradi:

1. **Telegram orqali kirish va roʻyxatdan oʻtish.** Tanish telegram kiradi. Yangi odam botda telefon raqamini yuboradi va parolsiz akkaunt ochiladi.
2. **Mavjud akkauntga ulash.** Sozlamalar → Telegram yoki bosh sahifadagi taklif orqali. Telefon raqami Telegram kontakti bilan olinadi.
3. **Kunlik xabarlar.** Kechqurun «Ertaga», ertalab «Bugun». Qoʻshimcha ravishda botda `/bugun` va `/ertaga` buyruqlari ishlaydi.

Token qoʻyilmaguncha hamma narsa eski holatda ishlaydi: kirish sahifasidagi tugma LessonLab botining roʻyxat havolasiga olib boradi, webhook 404 qaytaradi, Telegram boʻlimida «hali ishga tushirilmagan» yozuvi chiqadi. Yaʼni kodni tokendan oldin ham deploy qilish xavfsiz.

---

## 1. Bot va muhit oʻzgaruvchilari

1. BotFather'da bot yarating va tokenni oling.
2. Quyidagi oʻzgaruvchilarni Vercel'ga (Production) va lokal `.env.local` ga qoʻying:

| Oʻzgaruvchi | Qiymat |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather bergan token (**sir**) |
| `TELEGRAM_BOT_USERNAME` | `@` belgisiz, masalan `ustozona_bot` |
| `TELEGRAM_WEBHOOK_SECRET` | tasodifiy satr, faqat `A-Z a-z 0-9 _ -` (**sir**) |
| `CRON_SECRET` | tasodifiy satr (**sir**) |

Tasodifiy satrni shu buyruq bilan yasash mumkin:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## 2. Prod bazasi — migratsiya 0048

⚠️ Prodda `npm run db:migrate` **ishga tushirilmaydi** — jurnalda hash drift bor.

Supabase → SQL Editor → `drizzle/PROD-0048-telegram-bot.sql` faylini toʻliq qoʻying → Run.

- Fayl faqat **yangi** jadvallar yaratadi: `tg_chats`, `tg_auth_requests`, `tg_notify_prefs`, `tg_notify_log`. Hammasida RLS yoqilgan.
- Mavjud jadvallarga, jumladan LessonLab bilan umumiy `user_telegram` ga, tegmaydi.
- Hammasi bitta tranzaksiyada va hash'ni jurnalga yozadi.

## 3. Webhook

Deploy tugagach, bir marta ishga tushiriladi (qayta ishga tushirsa ham zarari yoʻq):

```bash
npm run telegram:setup -- https://www.ustozona.uz
```

Skript webhook'ni `secret_token` bilan oʻrnatadi, buyruqlar menyusini (`/bugun`, `/ertaga`, `/start`) va bot tavsifini yozadi. Oxirida `getWebhookInfo` natijasi chop etiladi: `last_error_message` boʻsh boʻlishi kerak.

## 4. Kunlik xabarlar — `pg_cron`

Supabase → Database → Extensions boʻlimida `pg_cron` va `pg_net` ni yoqing. Keyin SQL Editor'da quyidagini bajaring.

Sir cron matnida ochiq turmasligi uchun Vault'ga qoʻyiladi:

```sql
select vault.create_secret('<CRON_SECRET qiymati>', 'ustozona_cron_secret');

select cron.schedule(
  'ustozona-telegram-digest',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://www.ustozona.uz/api/cron/telegram',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'ustozona_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
```

**Kuzatish:**

```sql
-- Cron ishlayaptimi
select status, return_message, start_time
from cron.job_run_details order by start_time desc limit 10;

-- Endpoint nima qaytardi (sent / skipped / failed / deferred soni)
select status_code, content, created
from net._http_response order by created desc limit 10;

-- Kim qachon xabar oldi
select kind, date_key, status, error, created_at
from tg_notify_log order by created_at desc limit 50;
```

**Toʻxtatish:** `select cron.unschedule('ustozona-telegram-digest');`

### Yuborish qoidalari

- Cron har 15 daqiqada ishlaydi. Xabar belgilangan vaqtdan keyingi birinchi chaqiruvda ketadi.
- Ertalabki xabar belgilangan vaqtdan 3 soat oʻtgach endi yuborilmaydi. Kechki xabar 23:45 gacha yuboriladi.
- Bir kunga bitta xabar: `tg_notify_log` da `(user, kind, date_key)` UNIQUE.
- Aytadigan narsa boʻlmasa (taʼtil, dam olish, vazifa yoʻq) xabar yuborilmaydi va jurnalga `skipped` yoziladi.
- Bot bloklansa (403), `tg_chats.blocked_at` belgilanadi va shu foydalanuvchiga boshqa urinilmaydi. Foydalanuvchi botga qayta yozsa, belgi oʻzi yechiladi.
- Vaqtinchalik xatoda (429, 5xx, tarmoq) qator oʻchiriladi va keyingi chaqiruvda qayta urinib koʻriladi.
- Ustozlar ketma-ket ishlanadi (Supavisor pool cheklovi sababli). Bitta chaqiruv 45 soniyadan oshsa, qolganlar keyingi chaqiruvga qoladi.

Xabar mazmuni: `src/lib/telegram-digest.ts`. Bu sof funksiya, darslarni bosh sahifa bilan bir xil `calendar-core` manbasidan oladi.

## 5. Kirish oqimi — xavfsizlik qarorlari

Tafsilot kodda: `src/server/db/schema/telegram.ts` (`tgAuthRequests`), `src/server/telegram/bot.ts`, `src/server/auth-telegram.ts`.

- **Sessiya soʻrovni boshlagan brauzerda ochiladi.** Havoladagi `id` ni koʻrgan odam soʻrovni tasdiqlay oladi, lekin undan foydalana olmaydi. Sessiya faqat httpOnly cookie'dagi sir bilan beriladi.
- **Botda saytdagi kod uchta variantdan tanlanadi.** Firibgar yuborgan havolani ochgan odam saytni koʻrmaydi va toʻgʻri kodni bilmaydi. Notoʻgʻri tanlov soʻrovni yopadi.
- **Telefon faqat Telegram kontakti orqali olinadi**, `contact.user_id === from.id` tekshiruvi bilan. Qoʻlda yozilgan raqam qabul qilinmaydi.
- **Yangi akkaunt Better Auth'ning ichki adapteri orqali ochiladi.** Standart rol va aktivatsiya hook'lari email roʻyxatidagi bilan bir xil ishlaydi. Email oʻrniga oʻrinbosar (`tg<id>@telegram.invalid`) yoziladi.
- **Bot yangi odamdan «Menda email akkaunt bor»mi deb soʻraydi.** Bu ikkinchi akkaunt ochilib qolishining oldini oladi.

## 6. Mahalliy sinov

Webhook `localhost` ga yetib bormaydi. Mahalliy sinov uchun tunnel kerak: tunnel URL'i bilan `npm run telegram:setup -- https://<tunnel>` ishga tushiriladi. Sinovdan keyin prod URL bilan qayta ishga tushirishni unutmang.

Buning oʻrniga alohida sinov boti ochib, uning tokenini faqat `.env.local` ga qoʻyish ham mumkin.

## 7. Ustozlarni botga olib kelish

Kanal uchta, hammasi bir xil segment maʼnosida ishlaydi. «Ulangan» hali «xabar oladi» degani emas: `user_telegram` boshqa bot bilan umumiy jadval, u orqali ulangan ustoz bizning botni ochmagan boʻlishi mumkin.

| Kanal | Qayerda | Kimga |
|---|---|---|
| Admin kartasi | `/admin` → «Telegram bot» | — (oʻlchov) |
| Bosh sahifa taklifi | `TelegramConnectPrompt` | foyda bor (jadvalda dars yoki muddatli vazifa), tanaffus tugagan |
| TG1 xati | `npm run campaign:telegram` | tasdiqlangan email, xabar olmaydi |

**Qisqa havola `/tg`.** `ustozona.uz/tg` prod env'dagi botga yoʻnaltiradi. Xat, post va QR kodlarda bot nomi toʻgʻridan-toʻgʻri yozilmaydi: kampaniya skripti lokal `.env.local` bilan ishlaydi, unda sinov boti boʻlishi mumkin.

**`?ulash=1`.** `/dashboard/settings?section=telegram&ulash=1` ulash oynasini oʻzi ochadi — xatdagi «Telegramni ulash» tugmasi shu yerga olib boradi. Kirmagan ustoz avval `/login` ga, keyin `/dashboard` ga tushadi (u yerda taklif banneri bor).

### TG1 xatini yuborish

```bash
npm run campaign:telegram -- --prod                                 # quruq yurish, roʻyxat
npm run campaign:telegram -- --prod --only=<oʻz manzilingiz> --yes  # sinov, darhol
npm run campaign:telegram -- --prod --yes                           # hammaga, 1 soatdan keyin
```

Kerak: `PROD_DATABASE_URL`, `UNSUBSCRIBE_SECRET` (prod bilan bir xil), `ACTIVATION_EMAILS=on`, `RESEND_API_KEY` — hammasi `.env.local` da.

- Uch variant: **link** (ulanmagan), **start** (ulangan, botni ochmagan) va **jadval** (jadval ham, muddatli vazifa ham yoʻq — bot hech narsa yubormaydi, shuning uchun avval jadval soʻraladi; jadval toʻlgach bosh sahifada ulash taklifi oʻzi chiqadi).
- Tasdiqlanmagan manzillarga **yuborilmaydi** — domen obroʻsi (docs/email-aktivatsiya-spec.md §2.1). Ular V1 tasdiqlash xatidan keyin qoʻshiladi.
- Aktivatsiya xatlari bilan bir xil qoidalar: faqat tasdiqlangan manzil, obunadan chiqqanga yoʻq, `List-Unsubscribe`.
- Kuniga bitta xat: oxirgi 24 soatda aktivatsiya xati ketgan boʻlsa `bugun-xat-bor` bilan oʻtkaziladi — skriptni ertaga qayta yurgizish kifoya.
- Jurnal `teachers.prefs.campaigns.tg1` da, `email_activation` ga yozilmaydi (u zanjir holati — sabab `src/server/email/campaign.ts` da).
