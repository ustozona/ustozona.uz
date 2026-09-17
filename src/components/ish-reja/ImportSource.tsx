"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, CircleCheck, RefreshCw, Download, FileSpreadsheet, Info, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { newRowKey, type NameRow } from "@/components/ish-reja/NameReviewList";
import {
  autoMapping, clean, downloadTemplate, extract, pickSheet, readWorkbook, tableWidth, textToTable,
  type Extracted, type ImportKind, type Mapping, type Sheet, type SkippedItem,
} from "@/lib/ish-reja/parse";

/* ════════════════════════════════════════════════════════════════════
   IMPORT MANBAI — boʻlim va dars oynalari uchun umumiy:
   · useImportSource — matn/fayl → varaq → moslash → ajratilgan roʻyxat;
   · SourcePane — chap tomon (matn maydoni yoki fayl + moslash paneli);
   · ImportSummary — roʻyxat ustidagi xulosa: oʻtkazilgan qatorlar
     (qaytarib qoʻshish), soat boʻyicha takrorlanganlar, bor nomlar.
   Roʻyxat manba oʻzgarganda qayta quriladi; roʻyxatdagi qoʻlda tuzatishlar
   manbani qayta ajratmaydi (matn faqat moslashtiriladi).
   ════════════════════════════════════════════════════════════════════ */

type SrcRow = NameRow & { src?: number };

function buildRows(ex: Extracted, restored: Set<number>, prev: SrcRow[]): SrcRow[] {
  const back = ex.skipped.filter((s) => restored.has(s.source)).map((s) => ({ title: s.title, source: s.source, copy: 0 }));
  const all = [...ex.items, ...back].sort((a, b) => a.source - b.source || a.copy - b.copy);
  return all.map((it, i) => ({ key: prev[i]?.key ?? newRowKey(), title: it.title, src: it.source }));
}

export function useImportSource(kind: ImportKind, mode: "paste" | "upload") {
  const t = useTranslations("ImportSource");
  const [text, setText] = useState("");
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [sheetIdx, setSheetIdx] = useState(0);
  const [fileMapping, setFileMapping] = useState<Mapping | null>(null);
  const [expandHours, setExpandHours] = useState(true);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState<Set<number>>(new Set());
  const [rows, setRowsState] = useState<SrcRow[]>([]);

  const table = useMemo(
    () => (mode === "paste" ? textToTable(text) : sheets[sheetIdx]?.table ?? []),
    [mode, text, sheets, sheetIdx],
  );
  const mapping = useMemo(
    () => (mode === "paste" ? autoMapping(table, kind) : fileMapping ?? autoMapping(table, kind)),
    [mode, table, fileMapping, kind],
  );
  const extracted = useMemo(
    () => extract(table, mapping, { expandHours, dedupe: kind === "units" }),
    [table, mapping, expandHours, kind],
  );
  const skipped = extracted.skipped.filter((s) => !restored.has(s.source));

  /** Manba oʻzgardi → roʻyxat qayta quriladi. */
  const rebuild = (ex: Extracted, keep: Set<number>) => setRowsState((prev) => buildRows(ex, keep, prev));
  const extractFor = (tb: typeof table, m: Mapping, exp = expandHours) => extract(tb, m, { expandHours: exp, dedupe: kind === "units" });

  function onText(value: string) {
    setText(value);
    const tb = textToTable(value);
    const empty = new Set<number>();
    setRestored(empty);
    rebuild(extractFor(tb, autoMapping(tb, kind)), empty);
  }

  function selectSheet(idx: number, list = sheets) {
    const tb = list[idx]?.table ?? [];
    const m = autoMapping(tb, kind);
    const empty = new Set<number>();
    setSheetIdx(idx);
    setFileMapping(m);
    setRestored(empty);
    rebuild(extractFor(tb, m), empty);
  }

  function updateMapping(patch: Partial<Mapping>) {
    const m = { ...mapping, ...patch };
    const empty = new Set<number>();
    setFileMapping(m);
    setRestored(empty);
    rebuild(extractFor(table, m), empty);
  }

  function toggleExpand(on: boolean) {
    setExpandHours(on);
    rebuild(extractFor(table, mapping, on), restored);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const list = await readWorkbook(file);
      if (!list.length) { toast.error(t("errorEmpty")); return; }
      setSheets(list);
      setFileName(file.name);
      selectSheet(pickSheet(list, kind), list);
    } catch {
      toast.error(t("errorRead"));
    } finally {
      setBusy(false);
    }
  }

  function restore(item: SkippedItem) {
    const next = new Set(restored).add(item.source);
    setRestored(next);
    // Qoʻlda tuzatishlar saqlansin: qator manba tartibi boʻyicha joyiga qoʻyiladi.
    setRowsState((prev) => {
      const at = prev.findIndex((r) => (r.src ?? Infinity) > item.source);
      const row = { key: newRowKey(), title: item.title, src: item.source };
      return at < 0 ? [...prev, row] : [...prev.slice(0, at), row, ...prev.slice(at)];
    });
  }

  /** Roʻyxatda qoʻlda oʻzgartirish: matn maydoni ham moslashadi (qayta ajratilmaydi). */
  function setRows(next: NameRow[]) {
    setRowsState(next as SrcRow[]);
    if (mode === "paste") setText(next.map((r) => r.title).join("\n"));
  }

  return {
    kind, mode, text, onText, sheets, sheetIdx, selectSheet, table, mapping, updateMapping,
    expandHours, toggleExpand, fileName, busy, onFile, extracted, skipped, restore, rows, setRows,
  };
}

export type ImportSourceState = ReturnType<typeof useImportSource>;

/* ── Chap tomon ── */

/** Namuna fayl — oyna footerida (faqat fayl manbasida). */
export function TemplateButton({ kind, example }: { kind: ImportKind; example: string[] }) {
  const t = useTranslations("ImportSource");
  return (
    <Button
      variant="ghost"
      className="gap-1.5 text-muted-foreground sm:mr-auto"
      onClick={() => downloadTemplate(kind, {
        file: t(`templateFile.${kind}`), number: "№", name: t(`templateName.${kind}`), hours: t("templateHours"),
      }, example)}
    >
      <Download className="size-4" />
      {t("template")}
    </Button>
  );
}

export function SourcePane({ src, placeholder }: {
  src: ImportSourceState;
  placeholder: string;
}) {
  const t = useTranslations("ImportSource");
  const fileRef = useRef<HTMLInputElement>(null);
  const [showTable, setShowTable] = useState(false);

  if (src.mode === "paste") {
    return (
      <Textarea
        autoFocus
        value={src.text}
        onChange={(e) => src.onText(e.target.value)}
        placeholder={placeholder}
        aria-label={t(`pasteLabel.${src.kind}`)}
        className="min-h-0 flex-1 resize-none leading-relaxed"
      />
    );
  }

  const loaded = src.sheets.length > 0;
  // Sarlavha topilmagan boʻlsa taxmin ishonchsiz — jadval darhol ochiq turadi.
  const confident = src.mapping.headerRow >= 0 && src.extracted.items.length > 0;
  const colName = (c: number) => clean(src.table[src.mapping.headerRow]?.[c]) || columnLetter(c);

  return (
    <div className="scrollbar-hover flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { src.onFile(e.target.files?.[0]); e.target.value = ""; }} />
      {loaded ? (
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-2 pl-3 pr-2">
          <FileSpreadsheet className="size-5 shrink-0 text-success" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{src.fileName}</span>
          <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1.5 px-2 text-muted-foreground" disabled={src.busy} onClick={() => fileRef.current?.click()}>
            <RefreshCw className="size-3.5" />
            {t("replaceFile")}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={src.busy}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); src.onFile(e.dataTransfer.files?.[0]); }}
          className="flex min-h-[240px] w-full flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-8 text-center transition-colors duration-fast ease-standard hover:bg-muted/60"
        >
          <Upload className="size-6 text-muted-foreground" />
          <span className="text-body font-medium">{t("dropTitle")}</span>
          <span className="text-caption">{t(`dropHint.${src.kind}`)}</span>
        </button>
      )}
      {loaded && src.sheets.length > 1 && (
        <div className="-mt-2 flex items-center gap-2 text-caption">
          {t("sheet")}
          <Select value={String(src.sheetIdx)} onValueChange={(v) => src.selectSheet(Number(v))}>
            <SelectTrigger size="sm" className="h-7"><SelectValue /></SelectTrigger>
            <SelectContent>
              {src.sheets.map((sh, i) => <SelectItem key={i} value={String(i)}>{sh.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {loaded && (
        showTable || !confident ? (
          <MappingTable src={src} onClose={confident ? () => setShowTable(false) : undefined} />
        ) : (
          <div className="flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-sm text-success">
            <CircleCheck className="mt-0.5 size-4 shrink-0" />
            <p className="leading-relaxed">
              {src.kind === "topics" && src.mapping.hoursCol >= 0
                ? t("mappedWithHours", { name: colName(src.mapping.nameCol), hours: colName(src.mapping.hoursCol) })
                : t(`mapped.${src.kind}`, { name: colName(src.mapping.nameCol) })}
              {" "}
              <button type="button" onClick={() => setShowTable(true)} className="font-medium underline underline-offset-4">
                {t("showTable")}
              </button>
            </p>
          </div>
        )
      )}

    </div>
  );
}

/* ── Moslash jadvali: faylning boshi, rangli belgilar bilan ──
   Ustun nomini bosish — «Mavzu»/«Soat»/«—» menyusi; qator raqamini bosish —
   shu qator sarlavha. Oʻtkaziladigan qatorlar chizib koʻrsatiladi. */

const PREVIEW_ROWS = 10;
const PREVIEW_COLS = 6;

function MappingTable({ src, onClose }: { src: ImportSourceState; onClose?: () => void }) {
  const t = useTranslations("ImportSource");
  const { table, mapping, kind } = src;
  const start = Math.max(0, mapping.headerRow - 2);
  const rows = table.slice(start, start + PREVIEW_ROWS).map((r, i) => ({ r, i: start + i }));
  // Faqat maʼlumoti bor ustunlar (boʻsh E, F, G… koʻrsatilmaydi); tanlangan ustunlar har doim koʻrinadi.
  const cols = Array.from({ length: tableWidth(table) }, (_, c) => c)
    .filter((c) => c === mapping.nameCol || c === mapping.hoursCol || table.some((r) => clean(r[c])))
    .slice(0, PREVIEW_COLS);
  // Jadval panel eniga sigʻadi (yon aylantirish yoʻq): mavzu ustuni qolgan joyni oladi.
  const colWidth = (c: number) => (c === mapping.nameCol ? undefined : c === mapping.hoursCol ? 72 : 96);
  const skipped = new Set(src.skipped.map((x) => x.source));

  const role = (c: number) => (c === mapping.nameCol ? "name" : c === mapping.hoursCol ? "hours" : null);
  const setRole = (c: number, r: "name" | "hours" | null) => {
    if (r === "name") src.updateMapping({ nameCol: c, hoursCol: mapping.hoursCol === c ? -1 : mapping.hoursCol });
    else if (r === "hours") src.updateMapping({ hoursCol: c });
    else if (mapping.hoursCol === c) src.updateMapping({ hoursCol: -1 });
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-7 items-center gap-2">
        <span className="text-sm font-medium">{t("tableTitle")}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground transition-colors duration-fast ease-standard hover:text-foreground" aria-label={t("tableHelp")}>
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{t("tableHelp")}</TooltipContent>
        </Tooltip>
        <div className="ml-auto flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-muted-foreground" onClick={onClose}>
              <ChevronUp className="size-3.5" />
              {t("closeTable")}
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full table-fixed border-collapse text-xs">
          <colgroup>
            <col style={{ width: 36 }} />
            {cols.map((c) => <col key={c} style={{ width: colWidth(c) }} />)}
          </colgroup>
          <thead>
            <tr className="bg-muted/50">
              <th className="border-b border-border" />
              {cols.map((c) => {
                const r = role(c);
                return (
                  <th key={c} className="border-b border-l border-border p-1 text-left font-normal">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 transition-colors duration-fast ease-standard hover:bg-muted",
                            r === "name" && "bg-success/15 text-success hover:bg-success/20",
                            r === "hours" && "bg-warning/20 text-warning-foreground hover:bg-warning/25",
                            !r && "text-muted-foreground",
                          )}
                        >
                          <span className="shrink-0 tabular-nums opacity-60">{columnLetter(c)}</span>
                          {r && <Check className="size-3 shrink-0" />}
                          {r && <span className="truncate font-medium">{t(r === "name" ? `role.${kind}` : "role.hours")}</span>}
                          <ChevronDown className="ml-auto size-3 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-44 p-1">
                        {/* Mavzu ustuni majburiy — uni boshqa ustunni «Mavzu» qilib almashtiriladi */}
                        {(kind === "topics" ? (["name", "hours", null] as const) : (["name", null] as const)).filter((opt) => !(opt === null && role(c) === "name")).map((opt) => (
                          <button
                            key={String(opt)}
                            type="button"
                            onClick={() => setRole(c, opt)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard hover:bg-muted"
                          >
                            <Check className={cn("size-3.5", role(c) === opt ? "opacity-100" : "opacity-0")} />
                            {opt === "name" ? t(`role.${kind}`) : opt === "hours" ? t("role.hours") : t("role.none")}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, i }) => {
              const isHeader = i === mapping.headerRow;
              const isSkipped = skipped.has(i);
              const before = i < mapping.headerRow;
              return (
                <tr key={i} className={cn(isHeader && "bg-muted font-medium", before && "text-muted-foreground")}>
                  <td className="border-t border-border p-0 text-center">
                    <button
                      type="button"
                      title={t("setHeader")}
                      onClick={() => src.updateMapping({ headerRow: isHeader ? -1 : i })}
                      className={cn("w-full py-1 tabular-nums transition-colors duration-fast ease-standard hover:bg-muted", isHeader ? "font-medium text-primary" : "text-muted-foreground")}
                    >
                      {i + 1}
                    </button>
                  </td>
                  {cols.map((c) => {
                    const ro = role(c);
                    const active = !isHeader && !before && !isSkipped;
                    return (
                      <td
                        key={c}
                        className={cn(
                          "truncate border-l border-t border-border px-2 py-1",
                          active && ro === "name" && "bg-success/10",
                          active && ro === "hours" && "bg-warning/15",
                          isSkipped && ro === "name" && "text-muted-foreground line-through",
                        )}
                      >
                        {clean(r[c])}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {kind === "topics" && mapping.hoursCol >= 0 && (
        <label className="flex w-fit cursor-pointer items-center gap-2 pt-1 text-sm">
          <Switch size="sm" checked={src.expandHours} onCheckedChange={src.toggleExpand} />
          {t("expandHoursShort")}
        </label>
      )}
    </div>
  );
}

function columnLetter(col: number) {
  let letters = "";
  for (let n = col + 1; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  return letters;
}

/* ── Roʻyxat ustidagi xulosa ── */

export function ImportSummary({ src, duplicates, skipDuplicates, onSkipDuplicates }: {
  src: ImportSourceState;
  duplicates: number;
  /** `undefined` — tanlov yoʻq (bor nomlar har doim oʻtkaziladi). */
  skipDuplicates?: boolean;
  onSkipDuplicates?: (on: boolean) => void;
}) {
  const t = useTranslations("ImportSource");
  const expanded = src.kind === "topics" && src.mapping.hoursCol >= 0 && src.expandHours ? src.extracted.expanded : 0;
  if (!src.skipped.length && !expanded && !duplicates) return null;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-muted/50 px-3 py-2 text-caption">
      <Info className="size-3.5 shrink-0" />
      {src.skipped.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="underline decoration-dotted underline-offset-4 transition-colors duration-fast ease-standard hover:text-foreground">
              {t("skipped", { count: src.skipped.length })}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-1">
            <div className="max-h-[260px] overflow-y-auto" onWheel={(e) => { e.currentTarget.scrollTop += e.deltaY; }}>
              {src.skipped.map((s) => (
                <div key={s.source} className="flex items-center gap-2 rounded-md px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{s.title}</p>
                    <p className="text-caption">{t("rowReason", { row: s.source + 1, reason: t(`reason.${s.reason}`) })}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 px-2" onClick={() => src.restore(s)}>
                    <Plus className="size-3.5" />
                    {t("restore")}
                  </Button>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
      {expanded > 0 && <span>{t("expanded", { count: expanded })}</span>}
      {duplicates > 0 && (
        onSkipDuplicates ? (
          <label className="flex cursor-pointer items-center gap-1.5">
            <Checkbox checked={!!skipDuplicates} onCheckedChange={(v) => onSkipDuplicates(v === true)} className="size-3.5" />
            {t(`duplicatesSkip.${src.kind}`, { count: duplicates })}
          </label>
        ) : (
          <span>{t(`duplicates.${src.kind}`, { count: duplicates })}</span>
        )
      )}
    </div>
  );
}
