"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Ban,
  X,
  Plus,
  Tag,
  Info,
  Pencil,
  Trash2,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLOR_HEX,
  TOPIC_COLOR_ORDER,
  classColor,
  topicTints,
  type GradingScale,
  type InputMode,
  type TopicColor,
  type TopicPurpose,
  type ClassData,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";

function buildFormSchema(t: (key: string) => string) {
  return z.object({
    classIds: z.array(z.string()).min(1, t("classesRequired")),
    name: z.string().min(1, t("nameRequired")),
    color: z.enum(TOPIC_COLOR_ORDER as unknown as [string, ...string[]]),
    purpose: z.enum(["summative", "formative"]),
    inputMode: z.enum(["score", "select"]),
    weightPercent: z.number().min(0).max(100),
    scaleKind: z.string(),
    passLabel: z.string().min(1),
    failLabel: z.string().min(1),
  });
}

type TopicFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

/** page.tsx mavzu guruhini sinflar toʻplamiga moslash uchun oladigan yuk. */
export type TopicApplyPayload = {
  groupId: string;
  classIds: string[];
  name: string;
  color: TopicColor;
  purpose: TopicPurpose;
  inputMode: InputMode;
  scaleKind: GradingScale;
  weightPercent: number;
  passLabel: string;
  failLabel: string;
  isEdit: boolean;
};

type Props = {
  classDataMap: Record<string, ClassData>;
  currentClassId: string;
  onClose: () => void;
  onApply: (payload: TopicApplyPayload) => void;
  onDeleteGroup: (groupId: string) => void;
};

/** Sinflar aro birlashtirilgan toifa guruhi (roʻyxat uchun). */
type TopicGroup = {
  groupId: string;
  name: string;
  color: TopicColor;
  purpose: TopicPurpose;
  inputMode: InputMode;
  scaleKind: GradingScale;
  passLabel: string;
  failLabel: string;
  classIds: string[];
  weights: number[];
};

const ALL = "all";

const DEFAULTS: Omit<TopicFormValues, "classIds"> = {
  name: "",
  color: "orange",
  purpose: "summative",
  inputMode: "score",
  weightPercent: 20,
  scaleKind: "five",
  passLabel: "Bajardi",
  failLabel: "Bajarmadi",
};

export default function NewTopicModal({
  classDataMap,
  currentClassId,
  onClose,
  onApply,
  onDeleteGroup,
}: Props) {
  const t = useTranslations("NewTopicModal");
  const [filterClassId, setFilterClassId] = useState(ALL);
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; groupId: string } | null>(null);

  const classEntries = useMemo(() => Object.entries(classDataMap), [classDataMap]);
  const totalClasses = classEntries.length;
  const allHexes = classEntries
    .slice(0, 4)
    .map(([, cd]) => CLASS_COLOR_HEX[classColor(cd.info)]);

  // Barcha sinflar toifalarini groupId boʻyicha birlashtiramiz.
  const groups = useMemo<TopicGroup[]>(() => {
    const map = new Map<string, TopicGroup>();
    for (const [cid, cd] of classEntries) {
      for (const t of cd.topics) {
        const key = t.groupId ?? t.id;
        const g = map.get(key);
        if (g) {
          g.classIds.push(cid);
          g.weights.push(t.weightPercent);
        } else {
          map.set(key, {
            groupId: key,
            name: t.name,
            color: t.color,
            purpose: t.purpose ?? "summative",
            inputMode: t.inputMode,
            scaleKind: t.scaleKind ?? (t.inputMode === "score" ? "five" : "pass_fail"),
            passLabel: t.passLabel,
            failLabel: t.failLabel,
            classIds: [cid],
            weights: [t.weightPercent],
          });
        }
      }
    }
    return [...map.values()];
  }, [classEntries]);

  const visibleGroups =
    filterClassId === ALL
      ? groups
      : groups.filter((g) => g.classIds.includes(filterClassId));

  // Per-class vazn validatsiyasi: har sinfdagi summativ toifalar vazni yigʻindisi.
  const classTotals = useMemo(
    () =>
      classEntries.map(([, cd]) => ({
        name: cd.info.name,
        total: cd.topics.reduce(
          (s, t) => s + ((t.purpose ?? "summative") === "summative" ? t.weightPercent || 0 : 0),
          0
        ),
      })),
    [classEntries]
  );
  const overClasses = classTotals.filter((c) => c.total > 100);
  const underClasses = classTotals.filter((c) => c.total > 0 && c.total < 100);

  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { classIds: [currentClassId], ...DEFAULTS },
  });

  const watchPurpose = form.watch("purpose");
  const watchInputMode = form.watch("inputMode");
  const watchClassIds = form.watch("classIds");
  const watchWeight = form.watch("weightPercent");
  const isScore = watchInputMode === "score";
  const isSummative = watchPurpose === "summative";

  function openCreate() {
    const startClass = currentClassId && classDataMap[currentClassId] ? currentClassId : classEntries[0]?.[0];
    form.reset({ classIds: startClass ? [startClass] : [], ...DEFAULTS });
    setEditing({ mode: "create", groupId: `grp-${Date.now()}` });
  }

  function openEdit(g: TopicGroup) {
    const uniform = g.weights.every((w) => w === g.weights[0]);
    const weight = uniform ? g.weights[0] : Math.max(...g.weights);
    form.reset({
      classIds: [...g.classIds],
      name: g.name,
      color: g.color,
      purpose: g.purpose,
      inputMode: g.inputMode,
      weightPercent: weight > 0 ? weight : 20,
      scaleKind: g.scaleKind,
      passLabel: g.passLabel,
      failLabel: g.failLabel,
    });
    setEditing({ mode: "edit", groupId: g.groupId });
  }

  function onSubmit(values: TopicFormValues) {
    if (!editing) return;
    onApply({
      groupId: editing.groupId,
      classIds: values.classIds,
      name: values.name.trim(),
      color: values.color as TopicColor,
      purpose: values.purpose as TopicPurpose,
      inputMode: values.inputMode as InputMode,
      scaleKind: values.scaleKind as GradingScale,
      // Formativ toifa vaznsiz (faqat signal).
      weightPercent: values.purpose === "summative" ? values.weightPercent : 0,
      passLabel: values.passLabel.trim() || "Bajardi",
      failLabel: values.failLabel.trim() || "Bajarmadi",
      isEdit: editing.mode === "edit",
    });
    setEditing(null);
  }

  function toggleClass(id: string) {
    const set = new Set(watchClassIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    form.setValue("classIds", [...set], { shouldValidate: true });
  }

  function toggleAllClasses() {
    const all = watchClassIds.length === totalClasses;
    form.setValue("classIds", all ? [] : classEntries.map(([id]) => id), { shouldValidate: true });
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        width="920px"
        showCloseButton={false}
        className="p-0 gap-0 overflow-hidden bg-card"
        onInteractOutside={(e) => {
          if ((e.target as Element)?.closest?.("[data-sonner-toaster]")) e.preventDefault();
        }}
      >
        <div className="flex h-[min(600px,88vh)]">
          {/* Chap yoʻriqnoma */}
          <aside className="hidden md:flex w-[300px] shrink-0 flex-col border-r border-border bg-muted/30">
            <div className="px-7 pt-6 pb-5">
              <DialogTitle className="heading-section text-foreground">{t("sidebarTitle")}</DialogTitle>
              <DialogDescription className="text-caption mt-1">
                {t("sidebarDescription")}
              </DialogDescription>
            </div>
            <ScrollArea className="flex-1 min-h-0 px-7">
              <div className="space-y-5 pb-4">
                <HelpSection title={t("gradingTypeSection")}>
                  <HelpItem
                    title={t("summativeHelpTitle")}
                    tag={<WeightDonut percent={20} />}
                    text={t("summativeHelpText")}
                  />
                  <HelpItem
                    title={t("formativeHelpTitle")}
                    tag={<Ban className="size-4 text-muted-foreground" />}
                    text={t("formativeHelpText")}
                  />
                </HelpSection>

                <HelpSection title={t("inputModeSection")}>
                  <HelpItem
                    title={t("scoreHelpTitle")}
                    text={t("scoreHelpText")}
                  />
                  <HelpItem
                    title={t("selectHelpTitle")}
                    tag={
                      <span className="flex items-center gap-0.5 text-[9px] font-bold">
                        <span className="text-success">{t("passShort")}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-destructive">{t("failShort")}</span>
                      </span>
                    }
                    text={t("selectHelpText")}
                  />
                </HelpSection>

                <Link
                  href="/dashboard/grades/help"
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <span className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">{t("readMore")}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {t("readMoreDesc")}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </div>
            </ScrollArea>
          </aside>

          {/* Oʻng panel */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <SectionIcon>
                  <Tag />
                </SectionIcon>
                <CardTitle>
                  {editing ? (editing.mode === "edit" ? t("editTopicTitle") : t("newTopicTitle")) : t("allTopicsTitle")}
                </CardTitle>
                {!editing && (
                  <TypographyMuted className="text-sm">({visibleGroups.length})</TypographyMuted>
                )}
              </div>
              <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="size-4" />
                <span className="sr-only">{t("close")}</span>
              </DialogClose>
            </div>

            {/* Toolbar: sinf boʻyicha filtr + yangi toifa */}
            {!editing && (
              <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <Select value={filterClassId} onValueChange={setFilterClassId}>
                  <SelectTrigger className="h-9 w-[200px] rounded-lg bg-card text-sm font-medium">
                    <span className="flex items-center gap-2 truncate">
                      {filterClassId === ALL ? (
                        <AllClassesSwatch hexes={allHexes} />
                      ) : (
                        <ClassSwatch hex={CLASS_COLOR_HEX[classColor(classDataMap[filterClassId]!.info)]} />
                      )}
                      <span className="truncate">
                        {filterClassId === ALL ? t("allClasses") : classDataMap[filterClassId]?.info.name}
                      </span>
                    </span>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value={ALL}>
                      <span className="flex items-center gap-2">
                        <AllClassesSwatch hexes={allHexes} />
                        {t("allClasses")}
                      </span>
                    </SelectItem>
                    {classEntries.map(([id, cd]) => (
                      <SelectItem key={id} value={id}>
                        <span className="flex items-center gap-2">
                          <ClassSwatch hex={CLASS_COLOR_HEX[classColor(cd.info)]} />
                          {cd.info.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={openCreate} className="gap-1.5 font-semibold">
                  <Plus className="size-4" />
                  {t("newTopicButton")}
                </Button>
              </div>
            )}

            {/* Toifalar roʻyxati (orqada) + editor (ustida) */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-5">
                {visibleGroups.length === 0 ? (
                  <Empty className="min-h-[300px]">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Tag /></EmptyMedia>
                      <EmptyTitle>{t("noTopicsTitle")}</EmptyTitle>
                      <EmptyDescription>{t("noTopicsDescription")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-2 py-4">
                    {visibleGroups.map((g) => (
                      <GroupRow
                        key={g.groupId}
                        group={g}
                        totalClasses={totalClasses}
                        classDataMap={classDataMap}
                        onEdit={() => openEdit(g)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Editor overlay */}
              {editing && (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="absolute inset-0 z-20 flex flex-col bg-card animate-in fade-in-0 slide-in-from-right-4 duration-fast"
                  >
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="px-6 py-5 flex flex-col gap-5 max-w-[560px]">
                        {/* Nom + rang */}
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem className="flex-1 space-y-0">
                                <FormControl>
                                  <Input
                                    placeholder={t("namePlaceholder")}
                                    maxLength={100}
                                    autoFocus
                                    className="h-9 rounded-lg bg-card text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <ColorPicker selected={field.value as TopicColor} onSelect={field.onChange} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Sinflar */}
                        <FormField
                          control={form.control}
                          name="classIds"
                          render={() => (
                            <FormItem className="space-y-1.5">
                              <FieldLabel hint={t("classesFieldHint")}>
                                {t("classesFieldLabel")}
                              </FieldLabel>
                              <ClassMultiSelect
                                classEntries={classEntries}
                                selected={watchClassIds}
                                totalClasses={totalClasses}
                                allHexes={allHexes}
                                onToggle={toggleClass}
                                onToggleAll={toggleAllClasses}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Baholash turi */}
                        <FormField
                          control={form.control}
                          name="purpose"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FieldLabel hint={t("purposeFieldHint")}>
                                {t("purposeFieldLabel")}
                              </FieldLabel>
                              <ToggleGroup
                                type="single"
                                value={field.value}
                                onValueChange={(v) => v && field.onChange(v)}
                                className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1"
                              >
                                <PurposePill value="summative" label={t("summativeBadge")} hint={t("includedInTotal")} selected={field.value === "summative"} />
                                <PurposePill value="formative" label={t("formativeBadge")} hint={t("excludedFromTotal")} selected={field.value === "formative"} />
                              </ToggleGroup>
                            </FormItem>
                          )}
                        />

                        {/* Kiritish usuli */}
                        <FormField
                          control={form.control}
                          name="inputMode"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FieldLabel hint={t("inputModeFieldHint")}>
                                {t("inputModeFieldLabel")}
                              </FieldLabel>
                              <ToggleGroup
                                type="single"
                                value={field.value}
                                onValueChange={(v) => v && field.onChange(v)}
                                className="grid w-full grid-cols-2 gap-1 rounded-lg bg-muted p-1"
                              >
                                <ToggleGroupItem value="score" className="rounded-md text-sm data-[state=on]:bg-card data-[state=on]:shadow-sm">{t("scoreOption")}</ToggleGroupItem>
                                <ToggleGroupItem value="select" className="rounded-md text-sm data-[state=on]:bg-card data-[state=on]:shadow-sm">{t("selectOption")}</ToggleGroupItem>
                              </ToggleGroup>
                            </FormItem>
                          )}
                        />

                        {/* Toifa % — faqat summativda */}
                        {isSummative && (
                          <FormField
                            control={form.control}
                            name="weightPercent"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FieldLabel hint={t("weightFieldHint")}>
                                  {t("weightFieldLabel")}
                                </FieldLabel>
                                <div className="flex items-center gap-3">
                                  <div className="relative w-24 shrink-0">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      className="h-9 w-full rounded-lg bg-card pr-7 text-right text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      name={field.name}
                                      ref={field.ref}
                                      onBlur={field.onBlur}
                                      value={field.value}
                                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                      %
                                    </span>
                                  </div>
                                  <Progress value={Math.min(Math.max(watchWeight || 0, 0), 100)} className="h-2 flex-1" />
                                </div>
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Ikkilik + summativ ogohlantirishi (soxta aniqlik) */}
                        {!isScore && isSummative && (
                          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                            <TypographyMuted className="text-xs leading-snug text-foreground">
                              {t("binaryWarningPrefix")}{" "}
                              <span className="font-semibold">{t("binaryWarningEmphasis")}</span>{t("binaryWarningMiddle")}
                              <span className="font-semibold">{t("formativeBadge")}</span>{t("binaryWarningSuffix")}
                            </TypographyMuted>
                          </div>
                        )}

                        {/* Pass/Fail yorliqlari — faqat select rejimida */}
                        {!isScore && (
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="passLabel"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FieldLabel>{t("passLabelField")}</FieldLabel>
                                  <FormControl>
                                    <Input className="h-9 rounded-lg bg-card text-sm" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="failLabel"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FieldLabel>{t("failLabelField")}</FieldLabel>
                                  <FormControl>
                                    <Input className="h-9 rounded-lg bg-card text-sm" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
                      {editing.mode === "edit" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => {
                            onDeleteGroup(editing.groupId);
                            setEditing(null);
                          }}
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          {t("delete")}
                        </Button>
                      ) : (
                        <span />
                      )}
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" type="button" onClick={() => setEditing(null)}>
                          {t("cancel")}
                        </Button>
                        <Button size="sm" type="submit">
                          {editing.mode === "edit" ? t("save") : t("create")}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              )}
            </div>

            {/* Pastki holat paneli: per-class vazn validatsiyasi */}
            {!editing && (
              <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                <TypographyMuted className="text-xs">
                  {t("topicCount", { count: visibleGroups.length })}
                </TypographyMuted>
                <WeightStatus overClasses={overClasses} underClasses={underClasses} />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PurposePill({
  value,
  label,
  hint,
  selected,
}: {
  value: string;
  label: string;
  hint: string;
  selected: boolean;
}) {
  return (
    <ToggleGroupItem
      value={value}
      className={cn(
        "h-auto flex-col items-start gap-0.5 rounded-md px-3 py-1.5 text-left",
        "data-[state=on]:bg-card data-[state=on]:shadow-sm"
      )}
    >
      <span className={cn("text-sm font-medium", selected ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </ToggleGroupItem>
  );
}

/** Bitta toifa guruhi qatori — dedup qilingan, qaysi sinflar badge'i bilan. */
function GroupRow({
  group,
  totalClasses,
  classDataMap,
  onEdit,
}: {
  group: TopicGroup;
  totalClasses: number;
  classDataMap: Record<string, ClassData>;
  onEdit: () => void;
}) {
  const t = useTranslations("NewTopicModal");
  const hex = TOPIC_COLOR_HEX[group.color];
  const isFormative = group.purpose === "formative";
  const minW = Math.min(...group.weights);
  const maxW = Math.max(...group.weights);
  const uniform = minW === maxW;
  const weightLabel = uniform ? `${minW}%` : `${minW}–${maxW}%`;

  return (
    <div
      className="list-card group flex items-center gap-3 p-4"
      style={{ ["--card-accent" as string]: hex }}
    >
      <div
        className="list-card-icon size-11 shrink-0 flex items-center justify-center rounded-full text-white"
        style={topicTints(group.color).gradientTile}
      >
        <Tag className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="heading-small truncate text-foreground">{group.name}</h4>
          <ClassesBadge group={group} totalClasses={totalClasses} classDataMap={classDataMap} />
        </div>
        <TypographyMuted className="mt-0.5 text-xs">
          {group.inputMode === "score" ? t("scoreEnteredNotice") : t("labelSelectedNotice")}
        </TypographyMuted>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isFormative ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 border-dashed text-[10px] text-muted-foreground">
                <Ban className="size-3" /> {t("formativeBadge")}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{t("unweightedTooltip")}</TooltipContent>
          </Tooltip>
        ) : (
          <Badge variant="secondary" className="gap-1 tabular-nums text-[10px]">
            {weightLabel}
            {uniform && <WeightDonut percent={minW} compact />}
          </Badge>
        )}
        <button
          type="button"
          onClick={onEdit}
          title={t("edit")}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <Pencil className="size-4" />
        </button>
      </div>
    </div>
  );
}

function ClassesBadge({
  group,
  totalClasses,
  classDataMap,
}: {
  group: TopicGroup;
  totalClasses: number;
  classDataMap: Record<string, ClassData>;
}) {
  const t = useTranslations("NewTopicModal");
  const n = group.classIds.length;
  if (n === totalClasses) {
    return (
      <Badge variant="outline" className="shrink-0 text-[10px] font-normal text-muted-foreground">
        {t("allClasses")}
      </Badge>
    );
  }
  const names = group.classIds.map((id) => classDataMap[id]?.info.name ?? id);
  const label = n === 1 ? names[0] : t("nClasses", { count: n });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="shrink-0 text-[10px] font-normal text-muted-foreground">
          {label}
        </Badge>
      </TooltipTrigger>
      {n > 1 && <TooltipContent>{names.join(", ")}</TooltipContent>}
    </Tooltip>
  );
}

/** Per-class vazn yigʻindisi holati: 100% dan oshgan/kam sinflarni ogohlantiradi. */
function WeightStatus({
  overClasses,
  underClasses,
}: {
  overClasses: { name: string; total: number }[];
  underClasses: { name: string; total: number }[];
}) {
  const t = useTranslations("NewTopicModal");
  const bad = [...overClasses, ...underClasses];
  if (bad.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="gap-1.5 border-success/30 bg-success/10 text-success hover:bg-success/10">
            <CheckCircle2 className="size-3.5" />
            {t("weightsOk")}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">
          {t("weightsExplainer")}
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="destructive" className="gap-1.5 cursor-default">
          <AlertTriangle className="size-3.5" />
          {t("classesNot100", { count: bad.length })}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px]">
        <p className="mb-1.5">{t("weightsExplainer")}</p>
        <div className="space-y-0.5">
          {bad.map((c) => (
            <div key={c.name} className="flex items-center justify-between gap-4 tabular-nums">
              <span>{c.name}</span>
              <span className={cn("font-semibold", c.total > 100 ? "text-destructive" : "text-warning")}>{c.total}%</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/** Editor ichidagi sinf multiselect (checkbox dropdown). */
function ClassMultiSelect({
  classEntries,
  selected,
  totalClasses,
  allHexes,
  onToggle,
  onToggleAll,
}: {
  classEntries: [string, ClassData][];
  selected: string[];
  totalClasses: number;
  allHexes: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const t = useTranslations("NewTopicModal");
  const allSelected = selected.length === totalClasses && totalClasses > 0;
  const selSet = new Set(selected);
  const summary =
    selected.length === 0
      ? t("selectClasses")
      : allSelected
      ? t("allClasses")
      : selected.length === 1
      ? classEntries.find(([id]) => id === selected[0])?.[1].info.name ?? t("nClasses", { count: 1 })
      : t("nClasses", { count: selected.length });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between rounded-lg bg-card px-3 text-sm font-medium shadow-none"
        >
          <span className="flex items-center gap-2 truncate">
            {allSelected ? (
              <AllClassesSwatch hexes={allHexes} />
            ) : selected.length === 1 ? (
              <ClassSwatch hex={CLASS_COLOR_HEX[classColor(classEntries.find(([id]) => id === selected[0])![1].info)]} />
            ) : null}
            <span className="truncate">{summary}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>{t("whichClasses")}</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={allSelected} onCheckedChange={onToggleAll}>
          <AllClassesSwatch hexes={allHexes} />
          {t("allClasses")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[240px]">
          {classEntries.map(([id, cd]) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={selSet.has(id)}
              onCheckedChange={() => onToggle(id)}
              onSelect={(e) => e.preventDefault()}
            >
              <ClassSwatch hex={CLASS_COLOR_HEX[classColor(cd.info)]} />
              {cd.info.name}
            </DropdownMenuCheckboxItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ClassSwatch({ hex }: { hex: string }) {
  return (
    <span className="size-3 shrink-0 rounded-[4px]" style={{ backgroundColor: hex }} aria-hidden />
  );
}

function AllClassesSwatch({ hexes }: { hexes: string[] }) {
  const cells = [...hexes];
  while (cells.length < 4) cells.push("var(--muted-foreground)");
  return (
    <span className="grid size-3 shrink-0 grid-cols-2 gap-px overflow-hidden rounded-[4px]" aria-hidden>
      {cells.slice(0, 4).map((c, i) => (
        <span key={i} style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

function HelpSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <span className="text-label text-muted-foreground">{title}</span>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function HelpItem({
  title,
  tag,
  text,
}: {
  title: string;
  tag?: React.ReactNode;
  text: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <TypographySmall className="text-xs font-semibold text-foreground">{title}</TypographySmall>
        {tag && <span className="shrink-0">{tag}</span>}
      </div>
      <TypographyMuted className="mt-1.5 text-[11px] leading-snug">{text}</TypographyMuted>
    </div>
  );
}

function WeightDonut({ percent, compact }: { percent: number; compact?: boolean }) {
  const r = 5;
  const c = 2 * Math.PI * r;
  return (
    <span className="flex items-center gap-1">
      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-hidden>
        <circle cx="6" cy="6" r={r} fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/20" />
        <circle
          cx="6"
          cy="6"
          r={r}
          fill="none"
          stroke="var(--info)"
          strokeWidth="2"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          strokeLinecap="round"
          transform="rotate(-90 6 6)"
        />
      </svg>
      {!compact && <span className="text-[10px] font-bold tabular-nums text-foreground">{percent}%</span>}
    </span>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  const t = useTranslations("NewTopicModal");
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-label text-muted-foreground">{children}</span>
      {hint && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-muted-foreground transition-colors hover:text-foreground" aria-label={t("info")}>
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[220px]">{hint}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function ColorPicker({
  selected,
  onSelect,
}: {
  selected: TopicColor;
  onSelect: (c: TopicColor) => void;
}) {
  const t = useTranslations("NewTopicModal");
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="size-10 rounded-lg cursor-pointer p-0 min-h-0"
          style={{ backgroundColor: TOPIC_COLOR_HEX[selected] ?? TOPIC_COLOR_HEX.blue }}
          aria-label={t("selectColor")}
        />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2 grid grid-cols-4 gap-2 rounded-xl z-50">
        {TOPIC_COLOR_ORDER.map((c) => (
          <Button
            variant="ghost"
            key={c}
            onClick={() => {
              onSelect(c);
              setOpen(false);
            }}
            className={cn(
              "size-7 rounded-md cursor-pointer transition-transform hover:scale-110 p-0 min-h-0",
              c === selected && "ring-2 ring-foreground ring-offset-2 ring-offset-card"
            )}
            style={{ backgroundColor: TOPIC_COLOR_HEX[c] }}
            aria-label={c}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}
