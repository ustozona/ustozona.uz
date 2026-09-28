/* ════════════════════════════════════════════════════════════════════
   TELEGRAM ORQALI OCHILGAN AKKAUNT — «email yoʻq» holatini ifodalash

   Telegram orqali roʻyxatdan oʻtganda email IXTIYORIY: koʻp oʻqituvchi
   uni yozmaydi va majburlash aynan shu oqimning maʼnosini yoʻqotardi
   (butun gap — bir tugma bilan ochilishi).

   Lekin `user.email` bazada NOT NULL va Better Auth uni kimlik
   sifatida ishlatadi. Shuning uchun email boʻlmasa OʻRINBOSAR yoziladi.

   ⚠️ DOMEN `.invalid` — ATAYLAB (RFC 2606).
   Bu domen standart boʻyicha HECH QACHON haqiqiy boʻlmaydi:
     · unga xat ketmaydi (jimgina yoʻqolib qolmaydi — darhol yiqiladi)
     · uni hech kim sotib olib, oʻsha manzillarni egallab olmaydi

   `telegram.ustozona.uz` kabi oʻz subdomenimizni ishlatish xavfli
   boʻlardi: keyinroq unga pochta yoqilsa, oʻrinbosar manzillar
   HAQIQIY boʻlib qolardi va parol tiklash xatlari begona joyga ketardi.

   ⛔ ORINBOSARNI FOYDALANUVCHIGA KOʻRSATMANG.
   `tg123@telegram.invalid` — texnik qiymat. Profilda uni koʻrsatish
   «tizim menga qandaydir email oʻylab topgan» degan taassurot berardi.
   `isPlaceholderEmail()` bilan tekshirib, boʻsh joy koʻrsatiladi.
   ════════════════════════════════════════════════════════════════════ */

export const PLACEHOLDER_EMAIL_DOMAIN = "telegram.invalid";

/** Telegram id'dan oʻrinbosar manzil — barqaror va takrorlanmas.

    Barqarorligi muhim: bir telegram uchun har doim ayni manzil chiqadi,
    yaʼni tasodifan ikkinchi akkaunt yaratilib qolmaydi (`user.email`
    UNIQUE — ikkinchi urinish `unique_violation` bilan yiqiladi). */
export function telegramPlaceholderEmail(telegramId: string): string {
  return `tg${telegramId}@${PLACEHOLDER_EMAIL_DOMAIN}`;
}

/** Bu manzil haqiqiymi yoki «email kiritilmagan» degan belgimi. */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
}

/** Koʻrsatish uchun email — oʻrinbosar boʻlsa boʻsh satr. */
export function displayEmail(email: string | null | undefined): string {
  return isPlaceholderEmail(email) ? "" : (email ?? "");
}

/** Admin koʻrinishi uchun: oʻrinbosar oʻrniga hisob qaysi Telegram'ga
    tegishli ekani — `@username` maʼlum boʻlsa u, aks holda ID.

    Admin uchun «boʻsh» yetarli emas: qatorni boshqasidan ajratib, kerak
    boʻlsa botda topish kerak. Lekin xom `tg123@telegram.invalid` ham
    notoʻgʻri — u haqiqiy manzildek oʻqiladi va nusxalanib xat
    yuborishga urinish boʻladi. */
export function adminEmailLabel(
  email: string | null | undefined,
  telegramUsername?: string | null
): string {
  if (!isPlaceholderEmail(email)) return email ?? "";
  if (telegramUsername) return `Telegram · @${telegramUsername}`;
  const id = /^tg(\d+)@/i.exec(email ?? "")?.[1];
  return id ? `Telegram · ID ${id}` : "Telegram";
}

/** Xat yetib bormaydigan domenlar — foydalanuvchi oʻzi kiritgan manzilni
    tekshirish uchun. RFC 2606 zaxira TLD'lari + `example.*`. */
export function isUndeliverableEmail(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  return (
    /\.(invalid|test|example|localhost)$/.test(domain) ||
    /^example\.(com|net|org)$/.test(domain)
  );
}
