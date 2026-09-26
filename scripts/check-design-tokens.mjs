#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   DARVOZA: dizayn tokenlari — tipografika va boʻshliq shkalasi

   Qoida DESIGN.md §3 da yozilgan edi, lekin hujjat build'ni
   toʻxtatmaydi: 2026-09-04 → 09-18 oraligʻida ixtiyoriy `text-[Npx]`
   181 dan 191 ga oʻsdi. Reja: docs/dizayn-token-standartlashtirish.md.

   Bu faqat estetika emas. `[data-surface="stage"|"handheld"]`
   (globals.css) projektor va telefonda `--text-*` va `--spacing` ni
   kattalashtiradi — ixtiyoriy qiymat esa bunga boʻysunmaydi va sinf
   ekranida mayda qoladi.

   ⭐ RATCHET. Eski buzilishlar `design-tokens-baseline.json` da fayl ×
   qoida boʻyicha sanab qoʻyilgan. Build faqat son OSHGANDA yiqiladi.
   Tozalanganda bazani tushiring:

       npm run check:tokens -- --update

   `--update` son oshgan boʻlsa rad etadi — bazani koʻtarib yangi
   buzilishni «qonuniylashtirib» boʻlmaydi.

   Istisno — sabab bilan, shu qatorda yoki bir qator yuqorida:
       // design-tokens-ignore: chop etish varagʻi, pt birligi
   Butun fayl uchun (birinchi 20 qatorda):
       // design-tokens-ignore-file: <sabab>
   ════════════════════════════════════════════════════════════════════ */

import { globSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const BASELINE = "scripts/design-tokens-baseline.json";

/* Boʻshliq xossalari (Tailwind). Taqiqlangan qadamlar 4px toʻridan
   tashqarida: 2.5=10px, 3.5=14px, 4.5=18px. 7/9/11 (28/36/44px) toʻrda —
   masalan `pl-9` inputdagi ikona oʻrni, geometriyadan chiqqan qiymat. */
const SPACE = "(?:p[xytrblse]?|m[xytrblse]?|gap(?:-[xy])?|space-[xy])";
const OFF_GRID = "(?:2\\.5|3\\.5|4\\.5)";
const B = "(?<![\\w-])"; // oldida harf yoki «-» boʻlmasin (top-7, -mt-… ichidagi mt)
const E = "(?![\\w.])";

const RULES = {
  "text-px": {
    re: new RegExp(`${B}text-\\[\\d[\\d.]*(?:px|rem|em)\\]`, "g"),
    why: "ixtiyoriy matn oʻlchami — rol ishlating (text-caption, text-body…)",
  },
  "text-under-10": {
    re: new RegExp(`${B}text-\\[(?:[0-8](?:\\.\\d+)?|9(?:\\.\\d+)?)px\\]`, "g"),
    why: "10px dan kichik matn — pastki chegara 10px (text-micro)",
  },
  "space-off-grid": {
    re: new RegExp(`${B}-?${SPACE}-${OFF_GRID}${E}`, "g"),
    why: "4px toʻridan tashqari qadam — 2 · 3 · 4 · 5 · 6 · 8 dan tanlang",
  },
  "space-arbitrary": {
    re: new RegExp(`${B}-?${SPACE}-\\[\\d[\\d.]*(?:px|rem)\\]`, "g"),
    why: "ixtiyoriy boʻshliq — shkala qadamini ishlating",
  },
  "font-bold": {
    re: new RegExp(`${B}font-(?:bold|extrabold|black)${E}`, "g"),
    why: "700+ vazn faqat sarlavha roli ichida keladi",
  },
};

function scan() {
  const counts = {}; // file -> rule -> {n, hits[]}
  for (const file of globSync("src/**/*.{ts,tsx}").sort()) {
    const norm = file.replaceAll("\\", "/");
    const lines = readFileSync(file, "utf8").split("\n");
    if (lines.slice(0, 20).some((l) => l.includes("design-tokens-ignore-file"))) continue;
    lines.forEach((line, i) => {
      if (line.includes("design-tokens-ignore") || lines[i - 1]?.includes("design-tokens-ignore")) return;
      for (const [rule, { re }] of Object.entries(RULES)) {
        const m = line.match(re);
        if (!m) continue;
        const slot = ((counts[norm] ??= {})[rule] ??= { n: 0, hits: [] });
        slot.n += m.length;
        slot.hits.push(`${norm}:${i + 1}  ${m.join(" ")}`);
      }
    });
  }
  return counts;
}

const counts = scan();
const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const update = process.argv.includes("--update");

const worse = [];
let improved = 0;
const totals = Object.fromEntries(Object.keys(RULES).map((r) => [r, 0]));

for (const file of new Set([...Object.keys(counts), ...Object.keys(baseline)])) {
  for (const rule of Object.keys(RULES)) {
    const now = counts[file]?.[rule]?.n ?? 0;
    const was = baseline[file]?.[rule] ?? 0;
    totals[rule] += now;
    if (now > was) worse.push({ file, rule, now, was, hits: counts[file][rule].hits });
    if (now < was) improved += was - now;
  }
}

// Birinchi yaratish: baza yoʻq boʻlsa `--update` hozirgi holatni yozadi.
if (worse.length > 0 && !(update && !existsSync(BASELINE))) {
  console.error("\n⛔ Dizayn tokenlari: yangi buzilish qoʻshildi\n");
  for (const w of worse) {
    console.error(`   ${w.file}  [${w.rule}] ${w.was} → ${w.now}`);
    console.error(`      ${RULES[w.rule].why}`);
    for (const h of w.hits) console.error(`      ${h}`);
  }
  console.error(
    "\n   Shkala: DESIGN.md §3, reja: docs/dizayn-token-standartlashtirish.md\n" +
    "   Ongli istisno boʻlsa: // design-tokens-ignore: <sabab>\n"
  );
  process.exit(1);
}

if (update) {
  const out = {};
  for (const file of Object.keys(counts).sort()) {
    const row = {};
    for (const rule of Object.keys(RULES)) if (counts[file][rule]) row[rule] = counts[file][rule].n;
    if (Object.keys(row).length) out[file] = row;
  }
  writeFileSync(BASELINE, JSON.stringify(out, null, 2) + "\n");
  console.log(`✅ Baza yangilandi (${improved} ta buzilish kamaydi)`);
}

const summary = Object.entries(totals).map(([r, n]) => `${r} ${n}`).join(" · ");
console.log(`✅ Dizayn tokenlari: yangi buzilish yoʻq — ${summary}`);
if (improved > 0 && !update) {
  console.log(`   ${improved} ta buzilish tozalangan — bazani tushiring: npm run check:tokens -- --update`);
}
