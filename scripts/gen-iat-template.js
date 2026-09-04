/* docs/dts-iat.md → src/lib/standard-templates-iat.ts
   Har sinf uchun bitta SetTemplate; mazmun sohalari domains[] boʻlib chiqadi. */
const fs = require("fs");

const md = fs.readFileSync("docs/dts-iat.md", "utf8");
const lines = md.split(/\r?\n/);

const DOMAIN_NAMES = {
  AD: "Algoritm va dasturlash",
  MB: "Maʼlumotlarni boshqarish",
  TX: "Tarmoqlar va xavfsizlik",
  KT: "Kompyuter tizimlari",
  KY: "Kontent yaratish",
  SI: "Sunʼiy intellekt",
};
// Hujjatdagi tartib — muallif bergan tartib, alfavit emas.
const DOMAIN_ORDER = ["AD", "MB", "TX", "KT", "KY", "SI"];

/** grade → [{code, desc, domain}] */
const byGrade = new Map();

for (const line of lines) {
  const m = /^\|\s*(IAT(\d+)\.([A-Z]{2})\.(\d+))\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
  if (!m) continue;
  const [, code, grade, domain, , desc] = m;
  if (!DOMAIN_NAMES[domain]) continue;
  if (!byGrade.has(grade)) byGrade.set(grade, []);
  const list = byGrade.get(grade);
  if (list.some((x) => x.code === code)) continue; // ogohlantirish matnidagi takror
  list.push({ code, domain, desc });
}

/* Bloom taxmini — maqsad FEʼLIDAN. ⚠️ DTS Bloom bermaydi, bu TAXMIN.
   Tekshirilmagan taxminni jim qoʻllamaslik uchun izohda aytiladi. */
const BLOOM_RULES = [
  [/\b(yaratish|tuzish|ishlab chiqish|loyihalash|yozish|bajarish)\b/i, "yaratish"],
  [/\b(baholash|asoslash|tanlash|tahlil qilish|solishtirish|taqqoslash)\b/i, "baholash"],
  [/\b(aniqlash|ajratish|izohlash)\b/i, "tahlil"],
  [/\b(qoʻllash|foydalanish|amalga oshirish)\b/i, "qollash"],
  [/\b(tushuntirish|tavsiflash|taʼriflash|izohlash|tushunish)\b/i, "tushunish"],
];
function guessBloom(desc) {
  for (const [re, b] of BLOOM_RULES) if (re.test(desc)) return b;
  return "bilish";
}

/* Subʼektiv (CJ/rubrika) belgisi — obyektiv test bilan oʻlchab boʻlmaydigan
   maqsadlar: axloq, masʼuliyat, madaniyat, odat, farovonlik, ijodiy loyiha. */
const SUBJECTIVE = /\b(axloqiy|masʼuliyat|masʼuliyatli|madaniyat|hurmat|odat|farovonlik|etik|huquqiy|ijtimoiy oqibat|portfolio|loyiha yaratish|rioya qilish)\b/i;

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const stages = [
  { key: "tayanch", label: "Tayanch oʻrta taʼlim", grades: ["5", "6", "7", "8", "9"] },
  { key: "orta", label: "Oʻrta taʼlim", grades: ["10", "11"] },
];

let out = `// AVTOMATIK YARATILGAN — qoʻlda tahrirlamang.
// Manba: docs/dts-iat.md  ·  Generator: scripts/gen-iat-template.js
//
// OʻzDTS — Informatika va axborot texnologiyalari (IAT), 5–11 sinf.
// Kod: IAT<sinf>.<mazmun sohasi>.<tartib>  (docs/standards-page-spec.md §14.9)
//
// ⚠️ \`bloom\` DTS hujjatida BERILMAGAN — maqsad feʼlidan TAXMIN qilingan.
// ⚠️ \`assessType: "subjective"\` ham taxmin (axloq/masʼuliyat/ijodiy loyiha).
// Ikkalasi ham oʻqituvchi tomonidan tuzatilishi kutiladi.

import type { StandardDomain, StandardItem } from "@/lib/standards-data";

/** IAT mazmun sohalari — 5–11 boʻylab OʻZGARMAYDI (spec §14.9). */
export const IAT_DOMAINS: StandardDomain[] = [
${DOMAIN_ORDER.map((id, i) => `  { id: "${id}", name: "${DOMAIN_NAMES[id]}", order: ${i} },`).join("\n")}
];

const s = (id: string, bloom: string, desc: string, domainId: string, extra: Partial<StandardItem> = {}): StandardItem =>
  ({ id, covered: false, bloom, desc, domainId, ...extra });

export interface IatGradeTemplate {
  grade: string;
  stage: string;
  standards: StandardItem[];
}

export const IAT_TEMPLATES: IatGradeTemplate[] = [
`;

let total = 0;
for (const stage of stages) {
  for (const g of stage.grades) {
    const items = byGrade.get(g);
    if (!items) continue;
    // Sohalar boʻyicha hujjatdagi tartibda
    items.sort((a, b) => DOMAIN_ORDER.indexOf(a.domain) - DOMAIN_ORDER.indexOf(b.domain));
    total += items.length;
    out += `  {\n    grade: "${g}", stage: "${stage.label}",\n    standards: [\n`;
    let cur = null;
    for (const it of items) {
      if (it.domain !== cur) {
        cur = it.domain;
        out += `      // ── ${DOMAIN_NAMES[cur]} (${cur}) ──\n`;
      }
      const extra = SUBJECTIVE.test(it.desc) ? `, { assessType: "subjective" }` : "";
      out += `      s("${it.code}", "${guessBloom(it.desc)}", "${esc(it.desc)}", "${it.domain}"${extra}),\n`;
    }
    out += `    ],\n  },\n`;
  }
}
out += `];\n`;

fs.writeFileSync("src/lib/standard-templates-iat.ts", out);
console.log("Sinflar:", [...byGrade.keys()].sort((a, b) => a - b).join(", "));
for (const [g, v] of [...byGrade.entries()].sort((a, b) => a[0] - b[0])) {
  const per = {};
  v.forEach((x) => (per[x.domain] = (per[x.domain] || 0) + 1));
  console.log(`  ${g}-sinf: ${v.length}  ${JSON.stringify(per)}`);
}
console.log("JAMI:", total);
