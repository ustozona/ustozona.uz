#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   DARVOZA: `teachers.school` bilan GURUHLANMASIN

   `teachers.school` — ERKIN MATN, profil uchun ko'rsatiladi. Uni har
   kim istalgancha yozadi. Prod bazasida hozir shunday qiymatlar bor:

       "30"   ·   "23-MAKTAB"   ·   "Termiz tuman 23-maktab"   ·   ""

   Ya'ni bir maktabning o'zi to'rt xil yozilgan. Bunday ustun bo'yicha
   guruhlash yoki ruxsat berish — jimgina noto'g'ri javob beradi:
   hisobotda bitta maktab bir nechta bo'lib ko'rinadi, eng yomoni esa
   ikki begona o'qituvchi "bir maktabda" deb topilib, bir-birining
   o'quvchilarini ko'rib qolishi mumkin.

   ⭐ YAGONA HOKIMIYAT — `workspace_members`. Kim kim bilan bir joyda
   ishlashini FAQAT o'sha jadval hal qiladi
   (docs/ish-maydoni-arxitektura.md §6).

   Bu skript `teachers.school` ni SELECT qilishni to'smaydi — profilda
   ko'rsatish to'g'ri ish. U faqat ustunni SHART yoki GURUHLASH
   ifodasiga qo'yishni to'sadi.

   ⚠️ Nega qoida izoh bilan cheklanmadi: sxemada allaqachon "⛔
   guruhlash uchun HECH QACHON ishlatilmaydi" deb yozilgan. Izoh esa
   build'ni to'xtatmaydi — yangi kod yozayotgan odam uni o'qimasligi
   mumkin. Qoida buzilganda zarari jimgina bo'lgani uchun (xato
   chiqmaydi, shunchaki noto'g'ri javob) uni MASHINA ushlashi kerak.
   ════════════════════════════════════════════════════════════════════ */

import { globSync, readFileSync } from "node:fs";

/** Drizzle'ning shart/guruhlash yordamchilari. */
const PREDICATES = [
  "eq", "ne", "gt", "gte", "lt", "lte",
  "like", "ilike", "notLike", "notIlike",
  "inArray", "notInArray",
  "isNull", "isNotNull",
  "groupBy", "partitionBy",
];

const PATTERN = new RegExp(
  `\\b(${PREDICATES.join("|")})\\s*\\(\\s*teachers\\.school\\b`
);

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const files = globSync("src/**/*.{ts,tsx}");
const bad = [];

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const codeLines = stripComments(raw).split("\n");
  raw.split("\n").forEach((line, i) => {
    if (!codeLines.includes(line)) return; // izoh ichida — e'tiborsiz
    if (PATTERN.test(line)) bad.push(`${file}:${i + 1}  ${line.trim()}`);
  });
}

if (bad.length > 0) {
  console.error("\n⛔ `teachers.school` guruhlash/shart ifodasida ishlatilgan\n");
  for (const b of bad) console.error("   " + b);
  console.error(
    "\n   Bu ustun ERKIN MATN: bir maktab \"30\", \"23-MAKTAB\" va\n" +
    "   \"Termiz tuman 23-maktab\" bo'lib yozilgan. U bo'yicha guruhlash\n" +
    "   jimgina noto'g'ri javob beradi va begona o'qituvchilarni bir\n" +
    "   maktabda deb topishi mumkin.\n" +
    "\n   YECHIM: `workspace_members` dan foydalaning — kim kim bilan\n" +
    "   ishlashining yagona hokimiyati o'sha.\n"
  );
  process.exit(1);
}

console.log(`✅ Maktab guruhlashi toza (${files.length} fayl tekshirildi)`);
