#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   DARVOZA: MIGRATSIYA JURNALI BUTUNLIGI

   2026-09-04 da ikkita branch bir vaqtda `0042` raqamini oldi
   (`0042_topshiriq_standartlari` va `0042_maktab_dars_jadvali`).
   Ular birlashganda `_journal.json` da bitta `idx` ikki marta paydo
   boʻlardi — drizzle jurnalni tartib bilan oʻqiydi, demak keyingi
   migratsiya JIMGINA tashlab ketilishi mumkin edi.

   Bu skript uch narsani tekshiradi (bazaga ULANMAYDI, oflayn):
     1. `_journal.json` da takror `idx` yoki takror `tag` yoʻqligini
     2. Har jurnal yozuviga mos `.sql` fayl borligini
     3. Har `.sql` faylga mos jurnal yozuvi borligini — yaʼni
        `drizzle-kit generate` siz qoʻlda tashlangan fayl qolmasin

   ⚠️ Nima TEKSHIRILMAYDI: fayl mazmuni bazadagi hash bilan mos
   kelishi. Prod jurnalida hash drift bor (migratsiya fayllari
   qoʻllanilgandan keyin tahrirlangan), uni bu yerdan koʻrib
   boʻlmaydi — `npm run db:migrate -- --dry-run` bilan koʻriladi.
   ════════════════════════════════════════════════════════════════════ */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "drizzle";
const journal = JSON.parse(readFileSync(join(DIR, "meta", "_journal.json"), "utf8"));
const xatolar = [];

const koringanIdx = new Map();
const koringanTag = new Map();
for (const e of journal.entries) {
  if (koringanIdx.has(e.idx)) {
    xatolar.push(`idx ${e.idx} takrorlangan: "${koringanIdx.get(e.idx)}" va "${e.tag}"`);
  }
  koringanIdx.set(e.idx, e.tag);
  if (koringanTag.has(e.tag)) xatolar.push(`tag "${e.tag}" jurnalda ikki marta`);
  koringanTag.set(e.tag, true);
}

/* Jurnalda bor, faylda yoʻq. */
const fayllar = new Set(
  readdirSync(DIR).filter((f) => f.endsWith(".sql")).map((f) => f.replace(/\.sql$/, ""))
);
for (const e of journal.entries) {
  if (!fayllar.has(e.tag)) xatolar.push(`jurnalda "${e.tag}" bor, lekin ${e.tag}.sql yoʻq`);
}

/* Faylda bor, jurnalda yoʻq. Qoʻlda yozilgan tuzatish fayllari
   (raqam bilan boshlanmaydi) atayin chetlab oʻtiladi. */
for (const f of fayllar) {
  if (!/^\d{4}_/.test(f)) continue;
  if (!koringanTag.has(f)) {
    xatolar.push(`${f}.sql fayli bor, lekin jurnalda yoʻq — "drizzle-kit generate" ishlatilmagan?`);
  }
}

if (xatolar.length > 0) {
  console.error("\n⛔ Migratsiya jurnali buzuq:\n");
  for (const x of xatolar) console.error("   • " + x);
  console.error(
    "\nIkki branch bir raqamni olgan boʻlsa: kechroq qoʻshilganining\n" +
      "migratsiyasini oʻchirib, `npx drizzle-kit generate` bilan\n" +
      "keyingi raqam ostida qaytadan hosil qiling.\n"
  );
  process.exit(1);
}

console.log(`✓ Migratsiya jurnali butun (${journal.entries.length} ta yozuv).`);
