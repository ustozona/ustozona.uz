/* ════════════════════════════════════════════════════════════════════
   ISH REJA / ROʻYXAT IMPORTI — sof funksiyalar + brauzerda fayl oʻqish.

   Bosqichlar (oʻquv reja importlarida umumiy naqsh):
   1) Kitob → varaqlar (yashirin varaq/qatorlar tashlanadi).
   2) Moslash taxmini: sarlavha qatori, nom ustuni, soat ustuni. Taxmin
      oʻqituvchiga koʻrsatiladi va qoʻlda tuzatiladi (varaq, ustunlar).
   3) Ajratish: har qator — mavzu yoki oʻtkazib yuborilgan (sababi bilan:
      boʻsh, ajratkich «1-chorak», jami qatori, faqat raqam). Soat ≥ 2
      boʻlsa mavzu takrorlanadi — bu ham xulosada koʻrsatiladi.
   Hech narsa jimgina tashlanmaydi: oʻtkazilgan qatorlar qaytarib qoʻshiladi.
   «Uyga vazifa» va «Taqvimiy vaqt» ataylab oʻqilmaydi.
   ════════════════════════════════════════════════════════════════════ */

export type Table = string[][];
export type Sheet = { name: string; table: Table };

/** `headerRow` — sarlavha qatori indeksi (-1: sarlavhasiz, maʼlumot 0-qatordan). */
export type Mapping = { headerRow: number; nameCol: number; hoursCol: number };

export type SkipReason = "separator" | "total" | "number";
export type ParsedItem = { title: string; source: number; copy: number };
export type SkippedItem = { title: string; source: number; reason: SkipReason };
export type Extracted = { items: ParsedItem[]; skipped: SkippedItem[]; expanded: number };

export type ImportKind = "topics" | "units";

const HEADER_SCAN_ROWS = 30;
const MAX_HOURS = 10;

/** Katak ichidagi qator uzilishi va ortiqcha boʻshliqlar bitta boʻshliqqa. */
export const clean = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const norm = (v: string) => v.toLowerCase().replace(/[ʻʼ'`‘’]/g, "");

/** Sarlavha katagi qisqa: «Mavzu», «Mavzu nomi», «Boʻlim va mavzu nomi», «Тема урока». */
const TOPIC_HEADER = /^(bo\S{0,2}lim\s+va\s+)?mavzu\S*(\s+nomi)?$|^тема(\s+урока)?$|^topic(s)?$|^мавзу\S*$/i;
const UNIT_HEADER = /^bo\S{0,2}lim\S*(\s+nomi)?$|^раздел\S*$|^unit(s)?$|^бўлим\S*$/i;
const HOURS_HEADER = /^soat|^часы?|^кол.*час|^hours?$|^соат/i;

/** Ajratkich: «1-chorak», «I CHORAK», «2-yarim yillik», «II четверть», «1-semestr». */
const SEPARATOR = /^([ivx\d]+\s*[-.]?\s*)?(chorak|yarim\s*yil\S*|semestr|trimestr|четверть|полугодие|семестр|quarter|term|чорак)(\s*[ivx\d]+)?\s*[:.]?$/i;
// `\b` kirill harfini tanimaydi — soʻz chegarasi Unicode boʻyicha tekshiriladi.
const TOTAL = /^(jami|жами|итого|всего|total)(?![\p{L}\p{N}])/iu;
/** «12-dars», «12.», «12)» kabi boshlangʻich tartib raqami. */
const LEADING_NUMBER = /^\d+\s*(?:-?\s*dars\s*[.:)\-–]?|[.):]|[-–](?=\s))\s*/i;

export function detectMapping(table: Table, kind: ImportKind): Mapping | null {
  const isHeader = kind === "topics" ? TOPIC_HEADER : UNIT_HEADER;
  const rows = table.slice(0, HEADER_SCAN_ROWS);
  const headerRow = rows.findIndex((r) => r.some((c) => isHeader.test(clean(c))));
  if (headerRow < 0) return null;
  const header = table[headerRow].map(clean);
  return {
    headerRow,
    nameCol: header.findIndex((c) => isHeader.test(c)),
    hoursCol: kind === "topics" ? header.findIndex((c) => HOURS_HEADER.test(c)) : -1,
  };
}

/** Sarlavhasiz jadval uchun taxmin: eng uzun matnli ustun. */
export function guessNameCol(table: Table): number {
  const width = Math.max(0, ...table.map((r) => r.length));
  let best = 0;
  let bestLen = -1;
  for (let c = 0; c < width; c++) {
    const len = table.reduce((sum, r) => sum + (/^\d+([.,]\d+)?$/.test(clean(r[c])) ? 0 : clean(r[c]).length), 0);
    if (len > bestLen) { best = c; bestLen = len; }
  }
  return best;
}

export function autoMapping(table: Table, kind: ImportKind): Mapping {
  return detectMapping(table, kind) ?? { headerRow: -1, nameCol: guessNameCol(table), hoursCol: -1 };
}

/** Birinchi mos varaq (sarlavha topilgan); boʻlmasa — birinchi boʻsh boʻlmagani. */
export function pickSheet(sheets: Sheet[], kind: ImportKind): number {
  const withHeader = sheets.findIndex((s) => detectMapping(s.table, kind));
  if (withHeader >= 0) return withHeader;
  return Math.max(0, sheets.findIndex((s) => s.table.some((r) => r.some((c) => clean(c)))));
}

/** `dedupe` — boʻlim nomlari uchun (takror nom birlashadi); mavzularda «Nazorat ishi» kabi takror normal. */
export function extract(table: Table, m: Mapping, opts: { expandHours: boolean; dedupe: boolean }): Extracted {
  const items: ParsedItem[] = [];
  const skipped: SkippedItem[] = [];
  let expanded = 0;
  const seen = new Set<string>();
  for (let i = m.headerRow + 1; i < table.length; i++) {
    const row = table[i] ?? [];
    const raw = clean(row[m.nameCol]);
    if (!raw) continue;
    const title = raw.replace(LEADING_NUMBER, "").trim();
    if (!title || /^\d+([.,]\d+)?$/.test(title)) { skipped.push({ title: raw, source: i, reason: "number" }); continue; }
    if (SEPARATOR.test(norm(title)) || SEPARATOR.test(title)) { skipped.push({ title, source: i, reason: "separator" }); continue; }
    if (TOTAL.test(title)) { skipped.push({ title, source: i, reason: "total" }); continue; }

    if (opts.dedupe) {
      if (seen.has(title)) continue;
      seen.add(title);
    }
    const hours = m.hoursCol >= 0 ? Math.round(Number(clean(row[m.hoursCol]).replace(",", "."))) : 1;
    const count = opts.expandHours && Number.isFinite(hours) && hours > 1 ? Math.min(hours, MAX_HOURS) : 1;
    if (count > 1) expanded++;
    for (let k = 0; k < count; k++) items.push({ title, source: i, copy: k });
  }
  return { items, skipped, expanded };
}

/** Nusxa koʻchirilgan matn → jadval (tab bilan boʻlingan ustunlar). */
export const textToTable = (text: string): Table =>
  text.split(/\r?\n/).map((line) => line.split("\t"));

export const tableWidth = (table: Table) => Math.max(0, ...table.slice(0, 200).map((r) => r.length));

/* ── Brauzer: fayl oʻqish va namuna ── */

export async function readWorkbook(file: File): Promise<Sheet[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const meta = wb.Workbook?.Sheets ?? [];
  return wb.SheetNames.flatMap((name, idx) => {
    if (meta[idx]?.Hidden) return [];
    const ws = wb.Sheets[name];
    const hiddenRows = new Set((ws["!rows"] ?? []).flatMap((r, i) => (r?.hidden ? [i] : [])));
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "", raw: false, blankrows: true });
    // `!rows` varaqning mutlaq qator raqami boʻyicha; jadval esa `!ref` boshidan boshlanadi.
    const firstRow = ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]).s.r : 0;
    // Yashirin qatorlar boʻsh qatorga aylantiriladi — qator raqamlari (source) buzilmasin.
    const table = rows.map((r, i) => (hiddenRows.has(firstRow + i) ? [] : r.map(clean)));
    return [{ name, table }];
  });
}

export async function downloadTemplate(kind: ImportKind, labels: { file: string; number: string; name: string; hours: string }, example: string[]) {
  const XLSX = await import("xlsx");
  const aoa = kind === "topics"
    ? [[labels.number, labels.name, labels.hours], ...example.map((e, i) => [i + 1, e, 1])]
    : [[labels.number, labels.name], ...example.map((e, i) => [i + 1, e])];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = kind === "topics" ? [{ wch: 6 }, { wch: 60 }, { wch: 8 }] : [{ wch: 6 }, { wch: 50 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "1");
  XLSX.writeFile(wb, labels.file);
}
