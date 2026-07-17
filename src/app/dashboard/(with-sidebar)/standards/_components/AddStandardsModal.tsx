"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Search, Plus, Check, ChevronRight, Globe, PencilLine,
  Trash2, Upload, X, Loader2, Target,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { SectionIcon } from "@/components/ui/section-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BLOOM_LEVELS, type StandardItem } from "@/lib/standards-data";
import { parseStandardsFile } from "@/lib/standard-import";
import {
  filterTemplates, ALL_COUNTRIES, ALL_SUBJECTS, ALL_GRADES,
  NONEMPTY_COUNTRIES, NONEMPTY_SUBJECTS, NONEMPTY_GRADES,
  SUBJECT_GROUPS, GRADE_GROUPS,
  type SetTemplate,
} from "@/lib/standard-templates";
import { useStandardsStore, type CustomSet } from "@/store/useStandardsStore";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Joriy sinf — toʻplam shu sinfga biriktiriladi. */
  classId: string;
};

const ALL = "__all__";

export default function AddStandardsModal({ open, onOpenChange, classId }: Props) {
  const t = useTranslations("AddStandardsModal");
  const [tab, setTab] = useState<"browse" | "my">("browse");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[64rem] p-0 gap-0 overflow-hidden flex flex-col h-[720px] max-h-[90vh]">
        {/* Header — ikon + titul (chap), line-tab (markaz), ghost X (oʻng) */}
        <div className="relative flex items-center gap-3 px-6 py-5 border-b border-border min-h-[4.5rem]">
          <SectionIcon>
            <Target className="size-[18px]" aria-hidden />
          </SectionIcon>
          <DialogTitle className="text-lg">{t("title")}</DialogTitle>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "browse" | "my")}
            className="absolute left-1/2 -translate-x-1/2"
          >
            <TabsList variant="line">
              <TabsTrigger value="browse">{t("tabAll")}</TabsTrigger>
              <TabsTrigger value="my">{t("tabMine")}</TabsTrigger>
            </TabsList>
          </Tabs>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" className="-mr-1.5 ml-auto shrink-0 text-muted-foreground hover:text-foreground">
              <X className="size-4" aria-hidden />
              <span className="sr-only">{t("close")}</span>
            </Button>
          </DialogClose>
        </div>

        {tab === "browse" ? (
          <BrowseTab classId={classId} />
        ) : (
          <MyStandardsTab classId={classId} />
        )}

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 shrink-0">
          <Button variant="outline" className="shadow-none" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={() => onOpenChange(false)}>{t("done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ════════════ Browse All ════════════ */

function BrowseTab({ classId }: { classId: string }) {
  const t = useTranslations("AddStandardsModal");
  const sets = useStandardsStore((s) => s.sets);
  const createSet = useStandardsStore((s) => s.createSet);

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(ALL);
  const [subject, setSubject] = useState(ALL);
  const [grade, setGrade] = useState(ALL);

  const dirty = query !== "" || country !== ALL || subject !== ALL || grade !== ALL;

  const results = useMemo(
    () => filterTemplates({
      query,
      country: country === ALL ? undefined : country,
      subject: subject === ALL ? undefined : subject,
      grade: grade === ALL ? undefined : grade,
    }),
    [query, country, subject, grade],
  );

  // Joriy sinfga biriktirilgan shablon id'lari → "Added" holati.
  const addedIds = useMemo(
    () => new Set(sets.filter((s) => s.classIds.includes(classId)).map((s) => s.templateId).filter(Boolean) as string[]),
    [sets, classId],
  );

  function clearFilters() {
    setQuery(""); setCountry(ALL); setSubject(ALL); setGrade(ALL);
  }

  function addTemplate(tpl: SetTemplate) {
    createSet({
      name: tpl.name, subject: tpl.subject, classIds: [classId], standards: tpl.standards,
      source: tpl.source, grade: tpl.grade, frameworkCode: tpl.frameworkCode, templateId: tpl.id,
    });
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-6 py-4">
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-label">{t("search")}</span>
              {dirty && (
                <button type="button" onClick={clearFilters} className="text-caption text-primary hover:underline cursor-pointer">
                  {t("clear")}
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("browseSearchPlaceholder")} className="pl-9 bg-background" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <FilterSelect label={t("country")} value={country} onChange={setCountry} options={ALL_COUNTRIES} nonEmpty={NONEMPTY_COUNTRIES} allLabel={t("allCountries")} />
            <FilterSelect label={t("subject")} value={subject} onChange={setSubject} options={ALL_SUBJECTS} nonEmpty={NONEMPTY_SUBJECTS} allLabel={t("allSubjects")} />
            <FilterSelect label={t("grade")} value={grade} onChange={setGrade} options={ALL_GRADES} nonEmpty={NONEMPTY_GRADES} allLabel={t("allGrades")} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <span className="heading-small">{t("standardsHeading")}</span>
        <span className="text-caption text-muted-foreground">{t("resultsCount", { count: results.length })}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-2.5">
        {results.length === 0 ? (
          <p className="text-center text-caption text-muted-foreground py-10">{t("noMatchingSets")}</p>
        ) : (
          results.map((tpl) => {
            const added = addedIds.has(tpl.id);
            return (
              <Collapsible key={tpl.id} className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-2 p-3 hover:bg-muted/40 transition-colors">
                  <CollapsibleTrigger className="group/t flex flex-1 items-center gap-2.5 text-left min-w-0 cursor-pointer">
                    <ChevronRight className="size-4 text-muted-foreground shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/t:rotate-90" aria-hidden />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate">{tpl.name}</span>
                        <Badge variant="outline" className="shadow-none gap-1 text-muted-foreground shrink-0">
                          <Globe className="size-3" aria-hidden />{tpl.source}
                        </Badge>
                      </div>
                      <span className="text-caption text-muted-foreground">
                        {tpl.frameworkCode} · {tpl.subject} · {tpl.grade}
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <span className="text-caption text-muted-foreground shrink-0 tabular-nums">{t("countUnit", { count: tpl.standards.length })}</span>
                  <AddBtn added={added} onClick={() => addTemplate(tpl)} />
                </div>
                <CollapsibleContent>
                  <ul className="divide-y divide-border border-t border-border">
                    {tpl.standards.map((std) => (
                      <li key={std.id} className="flex items-start gap-3 px-4 py-2.5">
                        <span className="font-mono text-xs font-semibold text-foreground/70 shrink-0 w-24">{std.id}</span>
                        <span className="text-body text-foreground/90 leading-relaxed">{std.desc}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, nonEmpty, allLabel }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; nonEmpty: Set<string>; allLabel: string;
}) {
  return (
    <div className="space-y-1">
      <span className="text-label">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => {
            const empty = !nonEmpty.has(o);
            return (
              <SelectItem key={o} value={o} className={cn(empty && "text-muted-foreground")}>
                <span className="flex items-center gap-1.5">
                  {o}
                  {empty && <span className="text-caption text-muted-foreground/70">· boʻsh</span>}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

function AddBtn({ added, onClick }: { added: boolean; onClick: () => void }) {
  const t = useTranslations("AddStandardsModal");
  if (added) {
    return (
      <Button size="sm" disabled className="h-8 shrink-0 gap-1 bg-success text-success-foreground opacity-100 disabled:opacity-100">
        <Check className="size-4" aria-hidden /> {t("addedShort")}
      </Button>
    );
  }
  return (
    <Button size="sm" className="h-8 shrink-0 gap-1" onClick={onClick}>
      <Plus className="size-4" aria-hidden /> {t("add")}
    </Button>
  );
}

/* ════════════ My Standards ════════════ */

function MyStandardsTab({ classId }: { classId: string }) {
  const t = useTranslations("AddStandardsModal");
  const sets = useStandardsStore((s) => s.sets);
  const customSets = useStandardsStore((s) => s.customSets);
  const createSet = useStandardsStore((s) => s.createSet);
  const addCustomSet = useStandardsStore((s) => s.addCustomSet);
  const updateCustomSet = useStandardsStore((s) => s.updateCustomSet);
  const removeCustomSet = useStandardsStore((s) => s.removeCustomSet);
  const addStandardToCustom = useStandardsStore((s) => s.addStandardToCustom);
  const removeStandardFromCustom = useStandardsStore((s) => s.removeStandardFromCustom);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addedIds = useMemo(
    () => new Set(sets.filter((s) => s.classIds.includes(classId)).map((s) => s.templateId).filter(Boolean) as string[]),
    [sets, classId],
  );

  const canSubmit = name.trim().length > 0;

  function resetForm() { setName(""); setSubject(""); setGrade(""); setEditingId(null); }

  function handleSubmit() {
    if (!canSubmit) return;
    if (editingId) {
      updateCustomSet(editingId, { name: name.trim(), subject: subject.trim(), grade: grade.trim() || undefined });
    } else {
      addCustomSet({ name: name.trim(), subject: subject.trim() || "—", grade: grade.trim() || undefined });
    }
    resetForm();
  }

  function startEdit(cs: CustomSet) {
    setEditingId(cs.id); setName(cs.name); setSubject(cs.subject === "—" ? "" : cs.subject); setGrade(cs.grade ?? "");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const { items } = await parseStandardsFile(file);
      if (items.length) {
        const setName = name.trim() || file.name.replace(/\.[^.]+$/, "");
        addCustomSet({ name: setName, subject: subject.trim() || "—", grade: grade.trim() || undefined, standards: items });
        resetForm();
        toast.success(t("importSuccess", { count: items.length }));
      } else {
        toast.warning(t("importNoStandards"));
      }
    } catch {
      toast.error(t("importReadError"));
    }
    finally { setImporting(false); }
  }

  function attachToClass(cs: CustomSet) {
    createSet({
      name: cs.name, subject: cs.subject, classIds: [classId], standards: cs.standards,
      source: "custom", grade: cs.grade, templateId: cs.id,
    });
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Create / edit form — kulrang card, oq inputlar */}
      <div className="px-6 py-4">
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="space-y-1">
            <span className="text-label">{t("name")}</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className="bg-background" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <span className="text-label">{t("subject")}</span>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full bg-background"><SelectValue placeholder={t("selectPlaceholder")} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {SUBJECT_GROUPS.map((g) => (
                    <SelectGroup key={g.label}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.items.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-label">{t("gradeLevel")}</span>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="w-full bg-background"><SelectValue placeholder={t("selectPlaceholder")} /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {GRADE_GROUPS.map((g) => (
                    <SelectGroup key={g.label}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.items.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={!canSubmit} className="gap-1.5">
              {editingId ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              {editingId ? t("save") : t("create")}
            </Button>
            {editingId && (
              <Button variant="ghost" className="shadow-none" onClick={resetForm}>{t("cancelShort")}</Button>
            )}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
            <Button variant="outline" className="shadow-none gap-1.5 ml-auto" disabled={importing} onClick={() => fileRef.current?.click()}>
              {importing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              {t("importButton")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pt-3 pb-2">
        <span className="heading-small">{t("standardsHeading")}</span>
        <span className="text-caption text-muted-foreground">{t("customSetsCount", { count: customSets.length })}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-2.5">
        {customSets.length === 0 ? (
          <p className="text-center text-caption text-muted-foreground py-10">
            {t("noCustomSetsYet")}
          </p>
        ) : (
          customSets.map((cs) => (
            <CustomSetRow
              key={cs.id}
              cs={cs}
              added={addedIds.has(cs.id)}
              onAttach={() => attachToClass(cs)}
              onEdit={() => startEdit(cs)}
              onDelete={() => removeCustomSet(cs.id)}
              onAddStandard={(item) => addStandardToCustom(cs.id, item)}
              onRemoveStandard={(code) => removeStandardFromCustom(cs.id, code)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CustomSetRow({ cs, added, onAttach, onEdit, onDelete, onAddStandard, onRemoveStandard }: {
  cs: CustomSet;
  added: boolean;
  onAttach: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddStandard: (item: StandardItem) => void;
  onRemoveStandard: (code: string) => void;
}) {
  const t = useTranslations("AddStandardsModal");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [bloom, setBloom] = useState("bilish");

  function suggestCode(): string {
    const n = cs.standards.length + 1;
    const prefix = (cs.subject || "STD").slice(0, 3).toUpperCase();
    return `${prefix}.${n}`;
  }

  function add() {
    const c = code.trim() || suggestCode();
    const d = desc.trim();
    if (!d) return;
    onAddStandard({ id: c, desc: d, bloom, covered: false });
    setCode(""); setDesc(""); setBloom("bilish");
  }

  return (
    <Collapsible className="rounded-xl border border-border overflow-hidden">
      <div className="group/cs flex items-center gap-2 p-3 hover:bg-muted/40 transition-colors">
        <CollapsibleTrigger className="group/t flex flex-1 items-center gap-2.5 text-left min-w-0 cursor-pointer">
          <ChevronRight className="size-4 text-muted-foreground shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/t:rotate-90" aria-hidden />
          <div className="min-w-0">
            <span className="text-sm font-semibold truncate">{cs.name}</span>
            <span className="block text-caption text-muted-foreground">
              {t("customSetSummary", { subject: cs.subject, grade: cs.grade ? ` · ${cs.grade}` : "", count: cs.standards.length })}
            </span>
          </div>
        </CollapsibleTrigger>

        <button type="button" onClick={onEdit} aria-label={t("editAria")}
          className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover/cs:opacity-100 transition-opacity cursor-pointer">
          <PencilLine className="size-4" aria-hidden />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" aria-label={t("delete")}
              className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover/cs:opacity-100 transition-opacity cursor-pointer">
              <Trash2 className="size-4" aria-hidden />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("deleteSetTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteSetDescription", { name: cs.name, total: cs.standards.length })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={onDelete}>
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <span className="text-caption text-muted-foreground shrink-0 tabular-nums">{t("countUnit", { count: cs.standards.length })}</span>
        <AddBtn added={added} onClick={onAttach} />
      </div>

      <CollapsibleContent>
        <div className="border-t border-border">
          {cs.standards.length === 0 ? (
            <p className="text-center text-caption text-muted-foreground py-4">{t("noStandardsYetAddFirst")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {cs.standards.map((std) => {
                const bl = BLOOM_LEVELS.find((b) => b.id === std.bloom);
                return (
                  <li key={std.id} className="group/std flex items-center gap-3 px-4 py-2.5">
                    <span className="font-mono text-xs font-semibold text-foreground/70 shrink-0 w-24">{std.id}</span>
                    <div className="flex-1 min-w-0 space-y-1">
                      {bl && <Badge variant="secondary" className={cn("shadow-none", bl.color)}>{bl.label}</Badge>}
                      <p className="text-body text-foreground/90 leading-relaxed">{std.desc}</p>
                    </div>
                    <button type="button" onClick={() => onRemoveStandard(std.id)} aria-label={t("deleteStandardAria")}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover/std:opacity-100 transition-opacity shrink-0">
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {/* Inline add row — kod + Bloom + tavsif + qoʻshish */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-muted/20">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("codePlaceholder")} className="w-24 font-mono h-9 bg-background shrink-0" />
            <Select value={bloom} onValueChange={setBloom}>
              <SelectTrigger className="w-36 h-9 bg-background shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOOM_LEVELS.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder={t("fieldDescPlaceholder")}
              className="flex-1 h-9 bg-background"
            />
            <Button size="icon" className="size-9 shrink-0" onClick={add} disabled={!desc.trim()} aria-label={t("add")}>
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
