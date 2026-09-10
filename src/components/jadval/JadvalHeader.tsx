"use client";

import {
  AlertTriangle,
  BarChart3,
  Check,
  FileText,
  LayoutGrid,
  PackageOpen,
  Printer,
  RotateCcw,
  Redo2,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { staffShort, type SchoolStaff } from "@/lib/school-timetable";
import type { SheetDensity } from "./SheetGrid";
import type { JadvalLayout } from "./use-jadval-layout";

/* ════════════════════════════════════════════════════════════════════
   JADVAL SARLAVHASI.

   ⚠️ Ilgari bu 130 satr inline JSX boʻlib `JadvalWorkspace` ichida
   turardi — sakkizta qoʻshni blok, har biri oʻz qoʻlda yozilgan sharti
   bilan. Shartlar takrorlanardi (`!isMobile` toʻrt marta,
   `mode !== "tekshiruv"` besh marta) va ular asta-sekin bir-biridan
   ajralib ketgandi: «Qoldiq» tugmasida bitta shart, yonidagi
   «Yuklama»da boshqasi.

   Ikkita muammo bir vaqtda hal qilinadi:

   1. TUZILISH — shart bir marta, nomlangan holda hisoblanadi
      (`showTools`), keyin hamma joyda oʻsha ishlatiladi.

   2. SIGʻIM — sarlavha «hamma narsa tashlanadigan tokcha» edi: nom,
      undo/redo, 4 rejim, 3 zichlik, oʻqituvchi filtri, yuklama,
      ziddiyat va asosiy tugma — sakkiztasi bitta qatorda.

      Endi UCH ZONA:
        · doimiy   — undo/redo + rejim (Ish / Varaq)
        · rejimga oid — smena (ish) YOKI zichlik+chop etish (varaq)
        · asboblar — «Koʻrish» ichida: oʻqituvchi filtri, yuklama, qoldiq

   ⭐ Ziddiyat tugmasi «Koʻrish» ichiga KIRMAYDI. U signal, filtr emas —
   signalni menyu ostiga yashirib boʻlmaydi. Buning oʻrniga u faqat
   ziddiyat BOR boʻlganda koʻrinadi: muammo yoʻq boʻlsa tugma ham yoʻq.

   ── Nega ikki rejim ──────────────────────────────────────────────────
   Ilgari toʻrtta edi: Ish, Skan, Tekshiruv, Varaq. «Skan» varaqning
   sarlavhasi oʻzgartirilgan nusxasi edi, «Tekshiruv» esa toʻrda va yon
   panelda allaqachon koʻrinadigan ziddiyatlarni uchinchi marta
   koʻrsatardi. Ikkalasi ham oʻchirildi: mahsulotda ikkita holat bor —
   jadvalni TUZASAN yoki uni CHIQARASAN.
   ════════════════════════════════════════════════════════════════════ */

export type Mode = "ish" | "varaq";
export type SidePanel = "none" | "clashes" | "load";

export type JadvalHeaderProps = {
  schoolName: string;
  periodLabel: string;
  layout: JadvalLayout;

  mode: Mode;
  onModeChange: (mode: Mode) => void;

  /** Ikki smenali qoʻngʻiroq jadvali — smena almashtirgich shunda chiqadi. */
  twoShift: boolean;
  shift: 1 | 2;
  onShiftChange: (shift: 1 | 2) => void;

  density: SheetDensity;
  onDensityChange: (density: SheetDensity) => void;

  staff: SchoolStaff[];
  litStaffId: string | null;
  onLitStaffChange: (staffId: string | null) => void;

  conflictCount: number;
  remaining: number;
  hasLedgerWork: boolean;

  side: SidePanel;
  onSideChange: (side: SidePanel) => void;
  onOpenRail: () => void;

  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;

  /** Hujjatni tashlab, boshlash ekraniga qaytish. */
  onReset: () => void;
};

export default function JadvalHeader({
  schoolName,
  periodLabel,
  layout,
  mode,
  onModeChange,
  twoShift,
  shift,
  onShiftChange,
  density,
  onDensityChange,
  staff,
  litStaffId,
  onLitStaffChange,
  conflictCount,
  remaining,
  hasLedgerWork,
  side,
  onSideChange,
  onOpenRail,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
}: JadvalHeaderProps) {
  const isMobile = layout === "mobile";
  const isWide = layout === "wide";

  /* Shartlar — BIR MARTA, nomlangan holda. Ilgari bular har tugmada
     qaytadan yozilardi va shu sababli bir-biriga mos kelmay qolgandi. */
  const showTools = !isMobile;
  /* Ziddiyat panel ochiq turgan payt tugma yoʻqolmasin — aks holda
     oxirgi ziddiyat tuzatilganda panelni yopadigan narsa qolmaydi. */
  const showClashes = showTools && (conflictCount > 0 || side === "clashes");

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-card px-3 py-3 md:gap-x-4 md:px-6">
      {/* ── Kimligi ──────────────────────────────────────────────── */}
      <div className="mr-auto min-w-0">
        <h1 className="heading-page truncate text-lg md:text-2xl">
          {schoolName || "Dars jadvali"}
        </h1>
        {/* Saqlanish holati bu yerda EMAS — inspektor qatorining oʻng
            chetida, oʻzgarmas oʻrinda turadi. */}
        <p className="text-caption truncate">{periodLabel || "Qoralama"}</p>
      </div>

      {/* ── Doimiy: tarix + rejim ────────────────────────────────── */}
      {!isMobile && (
        <>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Bekor qilish"
              title="Bekor qilish (Ctrl+Z)"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <Undo2 />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Qaytarish"
              title="Qaytarish (Ctrl+Shift+Z)"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <Redo2 />
            </Button>
          </div>

          <SegmentedToggle<Mode>
            variant="pill"
            value={mode}
            onValueChange={onModeChange}
            options={[
              { value: "ish", label: "Ish rejimi", icon: <LayoutGrid /> },
              { value: "varaq", label: "Varaq", icon: <FileText /> },
            ]}
          />
        </>
      )}

      {/* ── Rejimga oid: ikkisidan FAQAT BITTASI ─────────────────── */}
      {mode === "ish" && twoShift && (
        <SegmentedToggle<"1" | "2">
          variant="pill"
          value={String(shift) as "1" | "2"}
          onValueChange={(v) => onShiftChange(Number(v) as 1 | 2)}
          options={[
            { value: "1", label: "1-smena" },
            { value: "2", label: "2-smena" },
          ]}
        />
      )}

      {mode === "varaq" && (
        <SegmentedToggle<SheetDensity>
          variant="pill"
          value={density}
          onValueChange={onDensityChange}
          options={
            isMobile
              ? [
                  { value: "butun", label: "Butun" },
                  { value: "fan", label: "Fan" },
                ]
              : [
                  { value: "butun", label: "Butun" },
                  { value: "fan", label: "Fan" },
                  { value: "toliq", label: "Fan + oʻqituvchi" },
                ]
          }
        />
      )}

      {/* ── Asboblar: bitta tugma ostida ─────────────────────────── */}
      {showTools && (
        <ViewMenu
          staff={staff}
          litStaffId={litStaffId}
          onLitStaffChange={onLitStaffChange}
          loadOpen={side === "load"}
          onToggleLoad={() => onSideChange(side === "load" ? "none" : "load")}
          showRail={!isWide && hasLedgerWork}
          remaining={remaining}
          onOpenRail={onOpenRail}
          onReset={onReset}
        />
      )}

      {/* ── Signal: faqat muammo BOR boʻlganda ───────────────────── */}
      {showClashes && (
        <Button
          variant="outline"
          size={isWide ? "default" : "icon"}
          aria-label={`${conflictCount} ziddiyat`}
          aria-pressed={side === "clashes"}
          onClick={() => onSideChange(side === "clashes" ? "none" : "clashes")}
          className={cn(conflictCount > 0 && "border-destructive text-destructive")}
        >
          <AlertTriangle />
          {isWide ? `${conflictCount} ziddiyat` : conflictCount}
        </Button>
      )}

      {/* ── Asosiy amal — varaq tayyor boʻlganda ─────────────────
          `window.print()` yetarli: chop etish qoidasi globals.css da,
          `.timetable-print-sheet` klassini tanlaydi va faqat varaqni
          landscape A4 da chiqaradi. */}
      {mode === "varaq" && (
        <Button onClick={() => window.print()}>
          <Printer />
          Chop etish
        </Button>
      )}
    </header>
  );
}

/* ─── «Koʻrish» — filtr va panellar bitta qidiriladigan roʻyxatda ────
   Ilgari bular uchta alohida boshqaruv edi va eng kengi (oʻqituvchi
   tanlagich) yolgʻiz oʻzi 208px joy olardi. Uchalasi ham bir xil ishni
   qiladi: «menga nimani koʻrsat». Shuning uchun bitta tugma ostida.

   `Command` tanlangani ataylab: 25–60 oʻqituvchili maktabda qidiruvsiz
   roʻyxat foydasiz — qidiruv shart. */
function ViewMenu({
  staff,
  litStaffId,
  onLitStaffChange,
  loadOpen,
  onToggleLoad,
  showRail,
  remaining,
  onOpenRail,
  onReset,
}: {
  staff: SchoolStaff[];
  litStaffId: string | null;
  onLitStaffChange: (staffId: string | null) => void;
  loadOpen: boolean;
  onToggleLoad: () => void;
  showRail: boolean;
  remaining: number;
  onOpenRail: () => void;
  onReset: () => void;
}) {
  const current = staff.find((s) => s.id === litStaffId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="font-normal">
          <SlidersHorizontal />
          {/* Faol filtr tugmaning oʻzida koʻrinadi — menyuni ochmasdan
              «hozir kimga qarayapman» degan savolga javob boʻlsin. */}
          {current ? staffShort(current.name) : "Koʻrish"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Oʻqituvchi yoki panel…" className="h-9" />
          <CommandList>
            <CommandEmpty>Topilmadi</CommandEmpty>

            <CommandGroup heading="Panellar">
              <CommandItem value="yuklama" onSelect={onToggleLoad}>
                <BarChart3 />
                Yuklama
                {loadOpen && <Check className="ml-auto size-4" />}
              </CommandItem>
              {showRail && (
                <CommandItem value="qoldiq" onSelect={onOpenRail}>
                  <PackageOpen />
                  Qoldiq
                  <span className="text-caption ml-auto tabular-nums">{remaining}</span>
                </CommandItem>
              )}
            </CommandGroup>

            <CommandGroup heading="Oʻqituvchi">
              <CommandItem value="__hammasi" onSelect={() => onLitStaffChange(null)}>
                Barcha oʻqituvchilar
                {litStaffId == null && <Check className="ml-auto size-4" />}
              </CommandItem>
              {staff.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={() => onLitStaffChange(s.id === litStaffId ? null : s.id)}
                >
                  <span className="truncate">{s.name}</span>
                  {litStaffId === s.id && <Check className="ml-auto size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>

            {/* ⚠️ Hujjat amali «Koʻrish» ichida turgani gʻalati koʻrinishi
                mumkin, lekin muqobili yomonroq: sarlavhaga yana bitta
                tugma qoʻshish. Bu amal kamdan-kam kerak boʻladi —
                oʻrni emas, TOPILISHI muhim. Jadval yaratilgach boshlash
                ekraniga qaytadigan boshqa yoʻl umuman yoʻq edi. */}
            <CommandGroup heading="Hujjat">
              <CommandItem value="boshidan boshlash yangi" onSelect={onReset}>
                <RotateCcw />
                Boshidan boshlash
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
