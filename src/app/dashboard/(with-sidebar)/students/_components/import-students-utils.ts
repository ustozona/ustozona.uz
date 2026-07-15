import * as XLSX from "xlsx";

// Bitta tahrirlanadigan oʻquvchi qatori
export type ParsedStudent = { id: string; firstName: string; lastName: string };

let uid = 0;
const nextId = () => `imp-${Date.now()}-${uid++}`;

/** Bir qatorni ism/familiyaga ajratish.
 *  "Familiya, Ism" (vergulli) yoki "Ism Familiya ..." (boʻsh joy/tab). */
function parseLine(raw: string): { firstName: string; lastName: string } | null {
  const line = raw.trim();
  if (!line) return null;

  if (line.includes(",")) {
    const [a, b] = line.split(",", 2).map((s) => s.trim());
    // "Familiya, Ism" → birinchi ism, qolgani familiya
    return { firstName: b || a, lastName: b ? a : "" };
  }

  const parts = line.split(/[\s\t]+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
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

/** CSV/XLS/XLSX fayldan (birinchi ustun=ism, ikkinchi=familiya) qatorlarni oʻqiydi. */
export async function parseSpreadsheetFile(file: File): Promise<ParsedStudent[]> {
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  const out: ParsedStudent[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const firstName = String(row[0] ?? "").trim();
    const lastName = String(row[1] ?? "").trim();
    if (!firstName && !lastName) continue;
    // birinchi qator sarlavha boʻlishi mumkin ("Ism", "First Name" va h.k.)
    if (out.length === 0 && /^(ism|first ?name|name)$/i.test(firstName)) continue;
    const key = `${firstName} ${lastName}`.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: nextId(), firstName, lastName });
  }
  return out;
}

export function downloadSampleCsv() {
  const csv = "Ism,Familiya\nAlisher,Aliyev\nDilnoza,Karimova\n";
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "oquvchilar-namuna.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export const IMPORT_PLACEHOLDER = `Har qatorda bitta oʻquvchi yozing. Masalan:

Aliyev Alisher
Karimova Dilnoza
Toshmatov, Bobur`;
