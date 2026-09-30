/* ════════════════════════════════════════════════════════════════════
   OK1 — Oʻqituvchilar kuni tabrigi (1-oktyabr, bir martalik kampaniya)

   Kimga (scripts/campaign-oqituvchilar-kuni.ts) — ustozning holatiga
   qarab, har birida BITTA tugma:
     sinf   — sinfi yoʻq: birinchi sinfni qoʻshish
     jadval — sinfi bor, jadvali boʻsh: jadvalni kiritish
     faol   — jadvali bor, Telegram ulanmagan: Telegramni ulash

   Tabrik — hammada bir xil, foyda va tugma — holatga qarab.

   Uslub — A1 qoidalari (templates/a1.ts): bitta tugma, 100 soʻzdan
   kam, rasm yoʻq, salomlashuvda faqat ism, imzo jamoa nomidan.

   Faqat ISHLAYOTGAN imkoniyatlar yoziladi. Sovgʻa, bonus, aksiya —
   yoʻq: ularni beradigan mexanizm qurilmagan, vaʼda yolgʻon boʻlardi.
   ════════════════════════════════════════════════════════════════════ */

import { YORDAM_TELEGRAM, YORDAM_TELEGRAM_URL, brendSarlavha, qalqon } from "./_brand";

export type Ok1Variant = "sinf" | "jadval" | "faol";

/* Matnlar tashqaridan (tayyor kopirayt) keltirilgan; oʻzgartirilgan joyi:
   «faol» 3-band — bot faqat darslar va muddatli vazifalarni eslatadi. */
export const OK1_SUBJECT: Record<Ok1Variant, string> = {
  sinf: "1-oktyabr — kasb bayramingiz muborak!",
  jadval: "Bayramingiz qutlugʻ boʻlsin, aziz ustoz!",
  faol: "1-oktyabr — Oʻqituvchilar kuni muborak!",
};

const MATN: Record<Ok1Variant, { foyda: string; punktlar: string[]; tugma: string }> = {
  sinf: {
    foyda: "«Ustozona» tizimi quyidagi imkoniyatlar orqali ishingizni osonlashtirishga yordam beradi:",
    punktlar: ["Elektron jurnal va baholash", "Davomatni tezkor belgilash", "Dars rejalarini yuritish"],
    tugma: "Birinchi sinfni qoʻshish",
  },
  jadval: {
    foyda: "Dars jadvalingizni kiritish orqali siz quyidagi qulayliklarga ega boʻlasiz:",
    punktlar: [
      "Har bir dars boʻyicha aniq tartib",
      "Jurnal va davomatni oson toʻldirish",
      "Botdan ertangi darslar eslatmasi",
    ],
    tugma: "Jadvalni kiritish",
  },
  faol: {
    foyda: "Telegram botimizni ulab, tizimdan yanada samarali foydalanishingiz mumkin:",
    punktlar: [
      "Kechqurun ertangi darslar roʻyxati",
      "Ertalab bugungi jadval eslatmasi",
      "Vaqtini oʻzingiz tanlaysiz, taʼtil kunlari bot jim turadi",
    ],
    tugma: "Telegramni ulash",
  },
};

/** Skrinshot — ixtiyoriy. Fayl `public/email/` ga qoʻyiladi, bu yerga yoʻli yoziladi.
    ⚠️ Rasmda haqiqiy ustoz/oʻquvchi maʼlumoti boʻlmasin (demo hisob, ismsiz).
    ⚠️ Gmail rasmni bloklashi mumkin: xat rasmsiz ham tushunarli boʻlsin. */
const RASM: Record<Ok1Variant, { src: string; alt: string } | null> = {
  sinf: null,
  jadval: null,
  faol: null,
};

export function ok1Html({
  variant,
  name,
  ctaUrl,
  siteUrl,
  unsubscribeUrl,
}: {
  variant: Ok1Variant;
  name: string | null;
  /** sinf: sinflar sahifasi; jadval: jadval sahifasi; faol: Telegram ulash oynasi. */
  ctaUrl: string;
  /** Rasm yoʻli shu domenga qoʻshiladi. */
  siteUrl: string;
  unsubscribeUrl: string;
}): string {
  const ism = name?.trim().split(/\s+/)[0] ?? null;
  const salom = ism ? `Hurmatli ${qalqon(ism)}!` : "Hurmatli ustoz!";

  const { foyda, punktlar, tugma } = MATN[variant];
  const rasm = RASM[variant];
  const rasmHtml = rasm
    ? `<p style="margin:0 0 24px"><img src="${qalqon(siteUrl + rasm.src)}" alt="${qalqon(rasm.alt)}" width="464" style="display:block;width:100%;max-width:464px;height:auto;border:1px solid #e5e7eb;border-radius:8px"></p>\n\n  `
    : "";
  const royxat = punktlar
    .map((p, i) => `<li style="margin:0${i < punktlar.length - 1 ? " 0 4px" : ""}">${p}</li>`)
    .join("\n    ");

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:480px;margin:0 auto;padding:8px">
  ${brendSarlavha()}

  <p style="margin:0 0 16px">${salom}</p>

  <p style="margin:0 0 16px">
    Mashaqqatli va sharafli kasbingizda sizga kuch-quvvat, mustahkam sogʻlik tilaymiz.
    Kasb bayramingiz — <b>Oʻqituvchi va murabbiylar kuni</b> muborak boʻlsin!
  </p>

  <p style="margin:0 0 12px">${foyda}</p>

  <ul style="margin:0 0 24px;padding-left:20px">
    ${royxat}
  </ul>

  ${rasmHtml}<p style="margin:0 0 28px">
    <a href="${qalqon(ctaUrl)}"
       style="background:#111827;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600">
      ${tugma}
    </a>
  </p>

  <p style="margin:0 0 24px">
    Savol boʻlsa — shu xatga javob yozing yoki Telegramda
    <a href="${qalqon(YORDAM_TELEGRAM_URL)}" style="color:#111827;font-weight:600;text-decoration:underline">${qalqon(YORDAM_TELEGRAM)}</a>
    ga yozing.
  </p>

  <p style="margin:0 0 28px">Ustozona jamoasi</p>

  <p style="margin:0;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:16px">
    Bu xat Oʻqituvchilar kuni munosabati bilan bir marta yuborildi.
    <a href="${qalqon(unsubscribeUrl)}" style="color:#6b7280">Bunday xatlarni oʻchirish</a>.
  </p>
</div>`;
}
