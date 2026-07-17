"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Plus, Check, Library, PenLine } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { STANDARDS_DATA, BLOOM_LEVELS, type StandardItem } from "@/lib/standards-data";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Joriy sinfdagi standart kodlari — takror/avto-kod uchun. */
  existingCodes: string[];
  /** Tanlangan/yaratilgan standartlarni sinfga qoʻshish. */
  onAdd: (items: StandardItem[]) => void;
};

/** Mavjud kodlardan keyingi DT.NN ni taklif qiladi (DT.20 kabi). */
function nextCode(codes: string[]): string {
  const nums = codes
    .map((c) => /^DT\.(\d+)$/i.exec(c.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  const max = nums.length ? Math.max(...nums) : 0;
  return `DT.${String(max + 1).padStart(2, "0")}`;
}

export default function AddStandardModal({ open, onOpenChange, existingCodes, onAdd }: Props) {
  const t = useTranslations("AddStandardModal");
  const [tab, setTab] = useState<"library" | "create">("library");

  // Avto-kod uchun: kutubxona + sinf kodlari birga.
  const allCodes = useMemo(
    () => [...STANDARDS_DATA.map((s) => s.id), ...existingCodes],
    [existingCodes],
  );
  const existingSet = useMemo(
    () => new Set(existingCodes.map((c) => c.toLowerCase())),
    [existingCodes],
  );

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="mt-1">
            {t("description")}
          </DialogDescription>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="gap-0">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="library" className="flex-1">
                <Library className="size-4" aria-hidden />
                {t("tabCatalog")}
              </TabsTrigger>
              <TabsTrigger value="create" className="flex-1">
                <PenLine className="size-4" aria-hidden />
                {t("tabCreate")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="library" className="mt-0">
            <LibraryTab existingSet={existingSet} onAdd={onAdd} onDone={close} />
          </TabsContent>

          <TabsContent value="create" className="mt-0">
            <CreateTab
              suggestedCode={nextCode(allCodes)}
              existingSet={existingSet}
              onAdd={onAdd}
              onDone={close}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ── Katalog tab ─────────────────────────────────────────────── */

function LibraryTab({
  existingSet,
  onAdd,
  onDone,
}: {
  existingSet: Set<string>;
  onAdd: (items: StandardItem[]) => void;
  onDone: () => void;
}) {
  const t = useTranslations("AddStandardModal");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STANDARDS_DATA;
    return STANDARDS_DATA.filter(
      (s) => s.id.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q),
    );
  }, [query]);

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function handleAdd() {
    const items = STANDARDS_DATA.filter((s) => selected.has(s.id)).map((s) => ({
      ...s,
      covered: false, // sinfga yangi qoʻshilganda oʻtilmagan deb belgilanadi
    }));
    if (items.length) onAdd(items);
    setSelected(new Set());
    onDone();
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
      </div>

      <div className="max-h-[46vh] overflow-y-auto px-6 pb-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <TypographyMuted>{t("noMatchInLibrary")}</TypographyMuted>
          </div>
        ) : (
          filtered.map((std) => {
            const already = existingSet.has(std.id.toLowerCase());
            const checked = selected.has(std.id);
            const bloom = BLOOM_LEVELS.find((b) => b.id === std.bloom);
            return (
              <label
                key={std.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                  already ? "opacity-55 cursor-not-allowed" : "cursor-pointer hover:bg-muted/50",
                  checked && "border-primary/40 bg-primary/5",
                )}
              >
                <Checkbox
                  checked={already || checked}
                  disabled={already}
                  onCheckedChange={() => !already && toggle(std.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-foreground">{std.id}</span>
                    {bloom && (
                      <Badge variant="secondary" className={cn("shadow-none", bloom.color)}>
                        {bloom.label}
                      </Badge>
                    )}
                    {already && (
                      <Badge variant="outline" className="shadow-none text-muted-foreground gap-1">
                        <Check className="size-3" aria-hidden />
                        {t("added")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-body text-foreground/90 leading-relaxed">{std.desc}</p>
                </div>
              </label>
            );
          })
        )}
      </div>

      <DialogFooter className="px-6 py-4 border-t border-border">
        <DialogClose asChild>
          <Button variant="outline" className="shadow-none">{t("cancel")}</Button>
        </DialogClose>
        <Button onClick={handleAdd} disabled={selected.size === 0} className="gap-1.5">
          <Plus className="size-4" aria-hidden />
          {selected.size > 0 ? t("addWithCount", { count: selected.size }) : t("add")}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ── Yangi yaratish tab ──────────────────────────────────────── */

function CreateTab({
  suggestedCode,
  existingSet,
  onAdd,
  onDone,
}: {
  suggestedCode: string;
  existingSet: Set<string>;
  onAdd: (items: StandardItem[]) => void;
  onDone: () => void;
}) {
  const t = useTranslations("AddStandardModal");
  const [code, setCode] = useState(suggestedCode);
  const [desc, setDesc] = useState("");
  const [bloom, setBloom] = useState("");
  const [file, setFile] = useState("");
  const [touched, setTouched] = useState(false);

  const codeTrim = code.trim();
  const descTrim = desc.trim();
  const duplicate = codeTrim.length > 0 && existingSet.has(codeTrim.toLowerCase());
  const codeError = codeTrim.length === 0 ? t("codeRequired") : duplicate ? t("codeDuplicate") : "";
  const descError = descTrim.length === 0 ? t("descRequired") : "";
  const bloomError = bloom ? "" : t("bloomRequired");
  const valid = !codeError && !descError && !bloomError;

  function handleSubmit() {
    setTouched(true);
    if (!valid) return;
    onAdd([{ id: codeTrim, desc: descTrim, bloom, covered: false, file: file.trim() || undefined }]);
    onDone();
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 py-4 space-y-4 max-h-[46vh] overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
          <Field label={t("fieldCode")} error={touched ? codeError : ""}>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="DT.20"
              aria-invalid={touched && !!codeError}
              className="font-mono"
            />
          </Field>
          <Field label={t("fieldBloom")} error={touched ? bloomError : ""}>
            <Select value={bloom} onValueChange={setBloom}>
              <SelectTrigger aria-invalid={touched && !!bloomError} className="w-full">
                <SelectValue placeholder={t("selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {BLOOM_LEVELS.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label={t("fieldDesc")} error={touched ? descError : ""}>
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={t("fieldDescPlaceholder")}
            rows={3}
            aria-invalid={touched && !!descError}
          />
        </Field>

        <Field label={t("fieldLinkedLesson")} hint={t("optional")}>
          <Input
            value={file}
            onChange={(e) => setFile(e.target.value)}
            placeholder={t("fieldLinkedLessonPlaceholder")}
          />
        </Field>
      </div>

      <DialogFooter className="px-6 py-4 border-t border-border">
        <DialogClose asChild>
          <Button variant="outline" className="shadow-none">{t("cancel")}</Button>
        </DialogClose>
        <Button onClick={handleSubmit} className="gap-1.5">
          <Plus className="size-4" aria-hidden />
          {t("add")}
        </Button>
      </DialogFooter>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {hint && <span className="text-caption text-muted-foreground">({hint})</span>}
      </div>
      {children}
      {error && <p className="text-caption text-destructive">{error}</p>}
    </div>
  );
}
