// Standartlarni Excel/CSV fayldan import qilish (v3 §10).
// Ustun sarlavhalari moslashuvchan (turli nomlar qabul qilinadi, registr farqsiz).
//
//   kod        → DT.01 / A2.L1 ...        (majburiy)
//   tavsif     → "Oʻquvchi ... qila oladi" (majburiy)
//   bloom      → BLOOM_LEVELS label yoki id (ixtiyoriy)
//   bazaviy    → ha/true/1                 (ixtiyoriy → foundational)
//   baholash   → subʼektiv/subjective      (ixtiyoriy → assessType)

import type { StandardItem } from "@/lib/standards-data";
import { BLOOM_LEVELS } from "@/lib/standards-data";

export interface ImportResult {
  items: StandardItem[];
  /** Qatorma-qator ogohlantirishlar (oʻtkazib yuborilgan/tuzatilgan). */
  warnings: string[];
}

const CODE_KEYS = ["kod", "code", "id", "standart", "standard"];
const DESC_KEYS = ["tavsif", "taʼrif", "tarif", "desc", "description", "izoh", "matn"];
const BLOOM_KEYS = ["bloom", "daraja", "level"];
const FOUND_KEYS = ["bazaviy", "foundational", "poydevor", "asosiy"];
const ASSESS_KEYS = ["baholash", "assess", "assesstype", "tur", "type"];

const BLOOM_BY_LABEL = new Map(BLOOM_LEVELS.map((b) => [b.label.toLowerCase(), b.id]));
const BLOOM_IDS = new Set(BLOOM_LEVELS.map((b) => b.id));

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    if (keys.includes(k.trim().toLowerCase())) return (row[k] ?? "").trim();
  }
  return "";
}

function truthy(v: string): boolean {
  const t = v.trim().toLowerCase();
  return ["ha", "true", "1", "yes", "+", "✓"].includes(t);
}

function normBloom(v: string): string {
  const t = v.trim().toLowerCase();
  if (!t) return "bilish";
  if (BLOOM_IDS.has(t)) return t;
  if (BLOOM_BY_LABEL.has(t)) return BLOOM_BY_LABEL.get(t)!;
  return "bilish";
}

/** Sarlavhali qatorlar massivini StandardItem[]ga aylantiradi. */
export function rowsToStandards(rows: Record<string, string>[]): ImportResult {
  const items: StandardItem[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  rows.forEach((row, i) => {
    const line = i + 2; // sarlavha = 1-qator
    const code = pick(row, CODE_KEYS);
    const desc = pick(row, DESC_KEYS);
    if (!code && !desc) return; // boʻsh qator — jim oʻtkazamiz
    if (!code) {
      warnings.push(`${line}-qator: kod yoʻq — oʻtkazib yuborildi`);
      return;
    }
    if (!desc) {
      warnings.push(`${line}-qator (${code}): tavsif yoʻq — oʻtkazib yuborildi`);
      return;
    }
    const key = code.toLowerCase();
    if (seen.has(key)) {
      warnings.push(`${line}-qator (${code}): takror kod — oʻtkazib yuborildi`);
      return;
    }
    seen.add(key);

    const item: StandardItem = { id: code, covered: false, bloom: normBloom(pick(row, BLOOM_KEYS)), desc };
    if (truthy(pick(row, FOUND_KEYS))) item.foundational = true;
    const assess = pick(row, ASSESS_KEYS).toLowerCase();
    if (assess.includes("sub")) item.assessType = "subjective";
    items.push(item);
  });

  return { items, warnings };
}

/** Oddiy CSV parser — qoʻshtirnoqli maydonlar, vergul yoki nuqtali vergul ajratgich. */
function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, ""); // BOM
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  // Ajratgichni aniqlash: birinchi qatorda nuqtali vergul vergulдан koʻp boʻlsa ";"
  const firstLine = clean.split(/\r?\n/)[0] ?? "";
  const delim = (firstLine.split(";").length > firstLine.split(",").length) ? ";" : ",";

  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (inQuotes) {
      if (c === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      record.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      record.push(field); field = "";
      if (record.some((x) => x !== "")) rows.push(record);
      record = [];
    } else field += c;
  }
  if (field !== "" || record.length) {
    record.push(field);
    if (record.some((x) => x !== "")) rows.push(record);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? ""; });
    return obj;
  });
}

/** Faylni (CSV yoki XLSX) oʻqib, StandartItem[]ga aylantiradi. */
export async function parseStandardsFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    const text = await file.text();
    return rowsToStandards(parseCSV(text));
  }
  // XLSX/XLS — SheetJS bilan (dinamik import: faqat kerak boʻlganda yuklanadi).
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
  return rowsToStandards(rows);
}
