import * as XLSX from "xlsx";

import { displayClassName, parseClassName } from "@/lib/class-naming";

/** Bitta tahrirlanadigan oʻquvchi qatori.
 *
 *  `className` — faylda «Sinf» ustuni boʻlsa toʻldiriladi. Boʻsh boʻlsa
 *  qator chaqiruvchi tanlagan sinfga tushadi (oddiy oʻquvchi importi). */
export type ParsedStudent = {
  id: string;
  firstName: string;
  lastName: string;
  className?: string;
};

let uid = 0;
const nextId = () => `imp-${Date.now()}-${uid++}`;

/* ⚠️ TARTIB: FAMILIYA BIRINCHI — ikkala shaklda ham.

   Maktab jurnali va roʻyxatlari «F.I.Sh.» tartibida yuritiladi, yaʼni
   oʻqituvchi joylashtiradigan matn deyarli har doim familiyadan
   boshlanadi. `IMPORT_PLACEHOLDER` dagi namunalar ham shunday.

   ⛔ 2026-08-10 GACHA BU FUNKSIYA OʻZIGA OʻZI ZID EDI:

       "Toshmatov, Bobur"  → familiya = Toshmatov   ✅ vergulli tarmoq
       "Toshmatov Bobur"   → familiya = Bobur       ❌ boʻsh joyli tarmoq

   Bitta vergul farqi teskari natija berardi. Koʻrinishda bilinmasdi —
   `name` = `firstName + " " + lastName`, yaʼni ekranda oʻsha soʻzlar
   oʻsha tartibda turardi. Buzilgani ichkarida edi: bosh harflar
   (`makeInitials`) va familiya boʻyicha saralash. */
function parseLine(raw: string): { firstName: string; lastName: string } | null {
  const line = raw.trim();
  if (!line) return null;

  if (line.includes(",")) {
    const [a, b] = line.split(",", 2).map((s) => s.trim());
    // "Familiya, Ism" → verguldan keyingisi ism
    return { firstName: b || a, lastName: b ? a : "" };
  }

  const parts = line.split(/[\s\t]+/).filter(Boolean);
  if (parts.length === 0) return null;
  // Bitta soʻz — familiya deb taxmin qilishdan koʻra ism deb olgan
  // maʼqul: yolgʻiz yozilgan soʻz odatda ism ("Alisher").
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  // Birinchi soʻz — familiya, qolgani ism (+ sharif boʻlsa u ham).
  return { firstName: parts.slice(1).join(" "), lastName: parts[0] };
}

export function parseText(text: string): ParsedStudent[] {
  const out: ParsedStudent[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const p = parseLine(line);
    if (!p) continue;
    const key = `${p.firstName} ${p.lastName}`.trim().toLowerCase();
    if (seen.has(key)) continue; // dublikatlarni tozalaymiz
    seen.add(key);
    out.push({ id: nextId(), ...p });
  }
  return out;
}

/* Sarlavha nomlari — oʻzbekcha, inglizcha va ruscha.
   `ʻ`/`'`/`’` farqi boʻlmasligi uchun apostrof umuman tekshirilmaydi. */
const H_FIRST = /^(ism|first ?name|name|имя)$/i;
const H_LAST = /^(familiya|last ?name|surname|фамилия)$/i;
/** Bitta ustunda toʻliq ism — maktab eksportlarida eng keng tarqalgani. */
const H_FULL = /^(f\s*\.?\s*i\s*\.?\s*sh?\s*\.?|to.?liq ism|full ?name|фио)$/i;
/** Sinf ustuni — faqat sinf importida ishlatiladi (ixtiyoriy). */
const H_CLASS = /^(sinf|guruh|class|grade|group|класс|группа)$/i;

/** Fayl ustunlarining maʼnosi. `full` boʻlsa ikkinchisi ishlatilmaydi.
 *  `cls` — «Sinf» ustuni indeksi; boʻlmasa `undefined`. */
type NameColumns = { full: number } | { first: number; last: number };
type ColumnMap = NameColumns & { cls?: number };

/** Birinchi qator sarlavhami — sarlavha boʻlsa ustun xaritasini beradi.
 *
 *  ⚠️ NEGA KERAK: ilgari ustunlar QATʼIY edi (0-ustun ism, 1-ustun
 *  familiya) va faqat 0-ustunda «Ism» soʻzi turgan-turmagani
 *  tekshirilardi. Oʻqituvchining fayli «Familiya,Ism» tartibida boʻlsa
 *  hamma ism-familiya JIMGINA almashib ketardi — matn yoʻlidagi
 *  `parseLine` xatosining aynan juftligi. */
function readHeader(row: unknown[]): ColumnMap | null {
  const cells = row.map((c) => String(c ?? "").trim());
  const clsIdx = cells.findIndex((c) => H_CLASS.test(c));
  const cls = clsIdx === -1 ? undefined : { cls: clsIdx };

  const full = cells.findIndex((c) => H_FULL.test(c));
  if (full !== -1) return { full, ...cls };

  const first = cells.findIndex((c) => H_FIRST.test(c));
  const last = cells.findIndex((c) => H_LAST.test(c));
  if (first === -1 && last === -1) return null;
  // Bittasi topilsa ikkinchisi qoʻshnisi deb olinadi — lekin «Sinf»
  // ustuni ustiga tushib qolmasin. Boʻsh joy qolmasa −1: ustun umuman
  // yoʻq degani, boʻsh qiymat oʻqiladi («Sinf,Familiya» faylida ism
  // yoʻq — uni sinf nomi bilan toʻldirib qoʻyish xato boʻlardi).
  const neighbour = (known: number) => {
    for (let i = 0; i < Math.max(cells.length, 2); i++) {
      if (i !== known && i !== clsIdx) return i;
    }
    return -1;
  };
  if (first === -1) return { first: neighbour(last), last, ...cls };
  if (last === -1) return { first, last: neighbour(first), ...cls };
  return { first, last, ...cls };
}

/** CSV/XLS/XLSX fayldan oʻquvchilarni oʻqiydi.
 *
 *  Sarlavha qatori boʻlsa ustunlar OʻSHANDAN olinadi (tartib erkin,
 *  bitta «F.I.Sh.» ustuni ham boʻladi). Sarlavha boʻlmasa standart —
 *  0-ustun ism, 1-ustun familiya: `downloadSampleCsv()` aynan shu
 *  faylni beradi, yaʼni standart hujjatlashtirilgan. */
export async function parseSpreadsheetFile(file: File): Promise<ParsedStudent[]> {
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  const header = raw.length > 0 ? readHeader(raw[0]) : null;
  const cols: ColumnMap = header ?? { first: 0, last: 1 };
  const body = header ? raw.slice(1) : raw;

  const out: ParsedStudent[] = [];
  const seen = new Set<string>();
  for (const row of body) {
    const cell = (i: number) => (i < 0 ? "" : String(row[i] ?? "").trim());

    let firstName: string;
    let lastName: string;
    if ("full" in cols) {
      // Toʻliq ism — matn yoʻli bilan BIR XIL qoida (familiya birinchi).
      const parsed = parseLine(cell(cols.full));
      if (!parsed) continue;
      ({ firstName, lastName } = parsed);
    } else {
      firstName = cell(cols.first);
      lastName = cell(cols.last);
    }

    // Sinf ustuni boʻlsa — nomni kanonik shaklga keltiramiz («5 а» → «5-A»),
    // aks holda bir xil sinf ikki xil yozilib ikkita sinf yaratib yuboradi.
    const rawClass = cols.cls === undefined ? "" : cell(cols.cls);
    const className = rawClass ? displayClassName(parseClassName(rawClass)) : undefined;

    // Nomsiz qator faqat SINFI BOʻLSA saqlanadi: eksportda oʻquvchisiz
    // sinf aynan shunday — «5-A,,» — yoziladi, va u qayta importda
    // yoʻqolib ketmasligi kerak. Sinfi ham, ismi ham yoʻq qator — boʻsh
    // satr, tashlab yuboriladi.
    if (!firstName && !lastName && !className) continue;

    // Dublikat kaliti sinfni ham oʻz ichiga oladi: turli sinfdagi bir xil
    // ism-familiya (kam boʻlsa-da) uchraydi va ikkalasi ham kerak.
    const key = `${className ?? ""}|${firstName} ${lastName}`.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: nextId(), firstName, lastName, ...(className ? { className } : {}) });
  }
  return out;
}

/* ════════════════════════════════════════════════════════════════════
   SINF IMPORTI

   Ikki kirish shakli:
     1. Matn  — har qatorda bitta sinf nomi («5-A»). Oʻquvchisiz.
     2. Fayl  — «Sinf» ustuni bor jadval; sinflar HAM, oʻquvchilar HAM
                bir yoʻla yaratiladi.

   Ikkalasi ham nomni `parseClassName` → `displayClassName` orqali
   oʻtkazadi, yaʼni «5 а», «5-А» (kirill) va «5-A» BITTA sinf boʻladi.
   ════════════════════════════════════════════════════════════════════ */

/** Bitta yaratiladigan sinf va unga tegishli oʻquvchilar. */
export type ParsedClass = {
  name: string;
  students: ParsedStudent[];
};

/** Joylashtirilgan matndan sinf nomlari (har qatorda bitta). */
export function parseClassList(text: string): ParsedClass[] {
  const out: ParsedClass[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw) continue;
    const name = displayClassName(parseClassName(raw));
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, students: [] });
  }
  return out;
}

/** Oʻquvchilarni `className` boʻyicha sinflarga guruhlaydi.
 *  Sinfi koʻrsatilmagan qatorlar TUSHIB QOLADI — sinf importida ular
 *  qayerga borishini bilib boʻlmaydi, shuning uchun chaqiruvchi ularni
 *  alohida sanab koʻrsatadi (`countUnassigned`). */
export function groupByClass(students: ParsedStudent[]): ParsedClass[] {
  const byName = new Map<string, ParsedClass>();
  for (const s of students) {
    if (!s.className) continue;
    const key = s.className.toLowerCase();
    let entry = byName.get(key);
    if (!entry) {
      entry = { name: s.className, students: [] };
      byName.set(key, entry);
    }
    // Nomsiz qator sinfni YARATADI, lekin oʻquvchi boʻlib qoʻshilmaydi.
    if (s.firstName.trim() || s.lastName.trim()) entry.students.push(s);
  }
  return [...byName.values()];
}

/** Ism + familiyadan bosh harflar ("Abdulloh Xasanov" → "AX"). */
export function rosterInitials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? "") + (lastName[0] ?? firstName[1] ?? "")).toUpperCase() || "?";
}

/** Sinfi koʻrsatilmagan qatorlar soni. */
export function countUnassigned(students: ParsedStudent[]): number {
  return students.filter((s) => !s.className).length;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSampleCsv() {
  downloadCsv("Ism,Familiya\nAlisher,Aliyev\nDilnoza,Karimova\n", "oquvchilar-namuna.csv");
}

export function downloadSampleClassCsv() {
  downloadCsv(
    "Sinf,Familiya,Ism\n5-A,Aliyev,Alisher\n5-A,Karimova,Dilnoza\n5-B,Toshmatov,Bobur\n",
    "sinflar-namuna.csv"
  );
}

/* ── Eksport ─────────────────────────────────────────────────────────
   ⚠️ USTUNLAR ATAYLAB AJRATILGAN («Sinf,Ism,Familiya»), bitta «F.I.Sh.»
   emas. Sabab — aylanma yoʻl (eksport → import) buzilmasin:

     · saqlangan `name` = «Ism Familiya» tartibida yigʻilgan;
     · `parseLine` esa birinchi soʻzni FAMILIYA deb oʻqiydi.

   Yagona ustunga yozilsa import ism bilan familiyani almashtirib
   yuborardi. Alohida ustunlarda sarlavha maʼnoni oʻzi aytadi va
   taxminga oʻrin qolmaydi. */

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

/** Sinflar va ularning oʻquvchilarini CSV faylga yozadi. */
export function downloadClassesCsv(
  classes: { name: string; students: { name: string }[] }[],
  filename = "sinflar.csv"
) {
  const lines = [["Sinf", "Ism", "Familiya"].map(csvCell).join(",")];
  for (const cls of classes) {
    if (cls.students.length === 0) {
      // Oʻquvchisiz sinf ham qatorga tushadi — aks holda eksportda
      // umuman yoʻqolib, qayta importda tiklanmasdi.
      lines.push([cls.name, "", ""].map(csvCell).join(","));
      continue;
    }
    for (const s of cls.students) {
      const parts = s.name.trim().split(/\s+/);
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ");
      lines.push([cls.name, firstName, lastName].map(csvCell).join(","));
    }
  }
  downloadCsv(lines.join("\r\n") + "\r\n", filename);
}

/** Sinf importi uchun matn maydonining namunasi. */
export const CLASS_IMPORT_PLACEHOLDER = `Har qatorda bitta sinf. Masalan:

5-A
5-B
11-D`;

/* ⚠️ Tartib ATAYLAB yozilgan. Namunalar ham, `parseLine` ham familiyani
   birinchi deb oladi — bu ikkisi bir-biriga zid boʻlmasligi shart. */
export const IMPORT_PLACEHOLDER = `Har qatorda bitta oʻquvchi — familiya, keyin ism. Masalan:

Aliyev Alisher
Karimova Dilnoza
Toshmatov, Bobur`;
