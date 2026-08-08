#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   DARVOZA: `"use server"` faylda tip-reeksport BO'LMASIN

   ⛔ NEGA BU SKRIPT BOR — 2026-08-08, PRODNI BUZGAN XATO
   ------------------------------------------------------
   `"use server"` faylda shunday yozilgan edi:

       export type { LinkState, RedeemResult, UnlinkImpactRow };

   Ko'rinishidan zararsiz: `export type` TypeScript'da o'chirilishi
   kerak. Lekin Turbopack `"use server"` modulini qayta yozadi va bu
   qatorni RUNTIME eksportga aylantiradi. Prodda natija:

       ReferenceError: LinkState is not defined
           at module evaluation (.../src_server_actions_feedback_ts_….js)

   Va bu bitta amalni emas, HAMMASINI o'ldirdi — Next barcha Server
   Action'ni bitta chunkka yig'adi, chunk esa yuklanishda qulaydi.

   Eng yomoni: `tsc --noEmit` ham, `next build` ham BU XATONI
   KO'RSATMAYDI (xato faqat runtime'da, modul yuklanganda chiqadi).
   Alomatlar esa butunlay boshqa joyni ko'rsatardi — sozlamalar
   yuklanmasligi, «Foydalanuvchi» degan ism, onboarding sehrgarining
   qayta-qayta ochilishi. Sabab butun kun auth, baza va CSRF'da
   izlandi.

   Shuning uchun tekshiruv build'dan OLDIN avtomatik ishlaydi
   (`prebuild`). O'chirmang.

   TO'G'RI YO'L: tiplarni neytral modulga qo'ying (`src/lib/link-types.ts`
   kabi — `"use server"` ham, `server-only` ham yo'q) va ikkala tomon
   ham SHU YERDAN import qilsin.
   ════════════════════════════════════════════════════════════════════ */

import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

const files = globSync("src/**/*.{ts,tsx}");
const bad = [];

/** Izohlarni olib tashlaydi — tekshiruv FAQAT haqiqiy kodga qarasin.

    ⚠️ Busiz skript o'zini o'zi yolg'ondan ushlaydi: bu qoidani
    TUSHUNTIRUVCHI fayllarning izohida `"use server"` va
    `export type { … }` misol sifatida yozilgan bo'ladi. Birinchi
    urinishda aynan shunday bo'ldi — `lib/link-types.ts` "buzuq" deb
    belgilandi, holbuki u yechimning o'zi. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")   // /* blok */
    .replace(/^\s*\/\/.*$/gm, "");      // // qator
}

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const code = stripComments(raw);

  // Direktiva faylning ENG BOSHIDA turishi shart (bo'sh qatorlardan
  // keyin). `.test(src)` bilan qidirish izoh yoki satr ichidagi
  // «use server» ni ham ushlab olardi.
  if (!/^\s*["']use server["']\s*;?/.test(code)) continue;

  // Qatorlar RAW faylda sanaladi (xato xabari to'g'ri qatorni
  // ko'rsatishi uchun), lekin izoh ichidagi qatorlar o'tkazib
  // yuboriladi — shuning uchun tozalangan nusxa bo'yicha yuramiz.
  const codeLines = code.split("\n");
  raw.split("\n").forEach((line, i) => {
    if (!codeLines.includes(line)) return;  // izoh ichida — e'tiborsiz
    // `export type { … }` va `export { type X, … }` — ikkala shakl ham
    // xuddi shu natijani beradi.
    if (/^\s*export\s+type\s*\{/.test(line) ||
        (/^\s*export\s*\{/.test(line) && /\btype\s+\w/.test(line))) {
      bad.push(`${file}:${i + 1}  ${line.trim()}`);
    }
  });
}

if (bad.length > 0) {
  console.error(
    "\n⛔ `\"use server\"` faylda tip-reeksport topildi — bu PRODNI BUZADI\n"
  );
  for (const b of bad) console.error("   " + b);
  console.error(
    "\n   Turbopack bu qatorni runtime eksportga aylantiradi va modul\n" +
    "   yuklanishida `ReferenceError` beradi. U BITTA amalni emas,\n" +
    "   BARCHA Server Action'larni o'ldiradi (hammasi bitta chunkda).\n" +
    "\n   YECHIM: tipni neytral modulga ko'chiring (masalan\n" +
    "   `src/lib/link-types.ts`) va ikkala tomon ham shu yerdan import\n" +
    "   qilsin. Batafsil: scripts/check-server-actions.mjs boshidagi izoh.\n"
  );
  process.exit(1);
}

console.log(`✅ Server Action'lar toza (${files.length} fayl tekshirildi)`);
