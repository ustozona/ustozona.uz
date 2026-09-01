"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  X,
  Plus,
  Tag,
  Ban,
  Info,
  Pencil,
  Trash2,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
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
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import { ColorPickerButton } from "@/components/ui/color-picker-button";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLOR_HEX,
  TOPIC_COLOR_ORDER,
  DEFAULT_TOPIC_TEMPLATES,
  GRADING_SCALE_PRESETS,
  SCALE_SHORT_LABELS,
  classColor,
  topicTints,
  type GradingScale,
  type TopicColor,
  type TopicPurpose,
  type ClassData,
} from "@/lib/grades-data";
import { getScaleBoundaries } from "@/lib/grade-scale";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";

function buildFormSchema(t: (key: string) => string) {
  return z.object({
    classIds: z.array(z.string()).min(1, t("classesRequired")),
    name: z.string().min(1, t("nameRequired")),
    color: z.enum(TOPIC_COLOR_ORDER as unknown as [string, ...string[]]),
    purpose: z.enum(["summative", "formative"]),
    weightPercent: z.number().min(0).max(100),
    scaleKind: z.string(),
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
  scaleKind: GradingScale;
  weightPercent: number;
  isEdit: boolean;
};

type Props = {
  classDataMap: Record<string, ClassData>;
  currentClassId: string;
  onClose: () => void;
  onApply: (payload: TopicApplyPayload) => void;
  /** Boʻsh roʻyxatdagi "standart toifalar" taklifi — berilgan sinflarga qoʻshadi. */
  onSeedDefaults: (classIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
};

/** Sinflar aro birlashtirilgan toifa guruhi (roʻyxat uchun). */
type TopicGroup = {
  groupId: string;
  name: string;
  color: TopicColor;
  purpose: TopicPurpose;
  scaleKind: GradingScale;
  classIds: string[];
  weights: number[];
};

const ALL = "all";

const DEFAULTS: Omit<TopicFormValues, "classIds"> = {
  name: "",
  color: "orange",
  purpose: "summative",
  weightPercent: 20,
  scaleKind: "five",
};

export default function NewTopicModal({
  classDataMap,
  currentClassId,
  onClose,
  onApply,
  onSeedDefaults,
  onDeleteGroup,
}: Props) {
  const t = useTranslations("NewTopicModal");
  /* Modal joriy sinf jurnalidan ochiladi — kutubxona ham oʻsha sinf bilan
     doiralanib boshlanadi (taʼlim-boshqaruv tizimlarida xuddi shunday: toifalar
     kursga tegishli). "Barcha sinflar" ochiq variant boʻlib qolaveradi. */
  const [filterClassId, setFilterClassId] = useState(
    currentClassId && classDataMap[currentClassId] ? currentClassId : ALL
  );
  const [editing, setEditing] = useState<{ mode: "create" | "edit"; groupId: string } | null>(null);

  /* Arxivlangan sinflar chiqarib tashlanadi — sinf "oʻchirilganda" aslida
     `archivedAt` qoʻyiladi va yozuv `classDataMap` da qolaveradi. Filtrsiz
     oʻqilsa, oʻchirilgan sinflar filtr roʻyxatida ham, kartalardagi
     "N ta sinf" sanogʻida ham koʻrinib qolardi. */
  const classEntries = useMemo(
    () => Object.entries(classDataMap).filter(([, cd]) => !cd.info.archivedAt),
    [classDataMap]
  );
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
            scaleKind: t.scaleKind ?? "five",
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

  /* Taklif qaysi sinfga tushadi: filtr sinfga qoʻyilgan boʻlsa oʻshanga,
     aks holda joriy sinfga. Sinf umuman yoʻq boʻlsa taklif koʻrsatilmaydi. */
  const seedTargetIds = useMemo(() => {
    const id = filterClassId !== ALL ? filterClassId : currentClassId;
    return id && classDataMap[id] ? [id] : [];
  }, [filterClassId, currentClassId, classDataMap]);

  /* Taklif sharti — roʻyxat boʻshligi EMAS, joriy sinfda toifa yoʻqligi.
     Oʻqituvchining boshqa sinflarida toifa boʻlsa roʻyxat toʻla koʻrinadi,
     yangi sinf esa baribir toifasiz qoladi (aynan shu holat oʻtkazib
     yuborilgan edi). Qoʻshilganda mavjud guruhga nom boʻyicha ulanadi. */
  const needsDefaults =
    seedTargetIds.length > 0 && (classDataMap[seedTargetIds[0]]?.topics.length ?? 0) === 0;

  // Per-class vazn validatsiyasi: har sinfdagi summativ toifalar vazni yigʻindisi.
  const classTotals = useMemo(
    () =>
      classEntries.map(([, cd]) => ({
        name: cd.info.name,
        hasTopics: cd.topics.length > 0,
        total: cd.topics.reduce(
          (s, t) => s + ((t.purpose ?? "summative") === "summative" ? t.weightPercent || 0 : 0),
          0
        ),
      })),
    [classEntries]
  );
  const overClasses = classTotals.filter((c) => c.total > 100);
  /* Toifasi bor, lekin summativ vazni 100% ga yetmagan sinflar. `total === 0`
     ham shu yerga kiradi: hamma toifasi formativ boʻlgan sinfda yakuniy baho
     umuman hisoblanmaydi — bu "joyida" emas. Toifasi YOʻQ sinf bu roʻyxatda
     emas, uni taklif banneri qamrab oladi. */
  const underClasses = classTotals.filter((c) => c.hasTopics && c.total < 100);

  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const form = useForm<TopicFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { classIds: [currentClassId], ...DEFAULTS },
  });

  const watchPurpose = form.watch("purpose");
  const watchClassIds = form.watch("classIds");
  const watchWeight = form.watch("weightPercent");
  const watchScaleKind = form.watch("scaleKind") as GradingScale;
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
      weightPercent: weight > 0 ? weight : 20,
      scaleKind: g.scaleKind,
    });
    setEditing({ mode: "edit", groupId: g.groupId });
  }

  /* Mavjud toifani joriy sinfga ulash — muharrirni ochmasdan. Bu tahrir
     (isEdit): guruh maydonlari oʻzgarmaydi, faqat sinflar toʻplami kengayadi,
     shuning uchun `handleApplyTopic` ning oʻz mantigʻi yetarli. */
  function addGroupToTargetClass(g: TopicGroup) {
    const target = seedTargetIds[0];
    if (!target || g.classIds.includes(target)) return;
    const uniform = g.weights.every((w) => w === g.weights[0]);
    onApply({
      groupId: g.groupId,
      classIds: [...g.classIds, target],
      name: g.name,
      color: g.color,
      purpose: g.purpose,
      scaleKind: g.scaleKind,
      weightPercent: g.purpose === "summative" ? (uniform ? g.weights[0] : Math.max(...g.weights)) : 0,
      isEdit: true,
    });
  }

  function onSubmit(values: TopicFormValues) {
    if (!editing) return;
    onApply({
      groupId: editing.groupId,
      classIds: values.classIds,
      name: values.name.trim(),
      color: values.color as TopicColor,
      purpose: values.purpose as TopicPurpose,
      scaleKind: values.scaleKind as GradingScale,
      // Formativ toifa vaznsiz (faqat signal).
      weightPercent: values.purpose === "summative" ? values.weightPercent : 0,
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
        width="640px"
        showCloseButton={false}
        className="p-0 gap-0 overflow-hidden bg-card"
        onInteractOutside={(e) => {
          if ((e.target as Element)?.closest?.("[data-sonner-toaster]")) e.preventDefault();
        }}
      >
        <div className="flex h-[min(720px,88vh)]">
          {/* Oʻng panel */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <SectionIcon>
                  <Tag />
                </SectionIcon>
                <DialogTitle className="text-lg leading-none font-semibold tracking-tight">
                  {editing ? (editing.mode === "edit" ? t("editTopicTitle") : t("newTopicTitle")) : t("allTopicsTitle")}
                </DialogTitle>
                {!editing && (
                  <TypographyMuted className="text-sm">({visibleGroups.length})</TypographyMuted>
                )}
              </div>
              <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <X className="size-4" />
                <span className="sr-only">{t("close")}</span>
              </DialogClose>
            </div>

            {/* Toolbar: sinf boʻyicha filtr + koʻrinish + yangi toifa */}
            {!editing && (
              <div className="shrink-0 flex items-center gap-3 border-b border-border px-5 py-3">
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

                <Button size="sm" onClick={openCreate} className="ml-auto gap-1.5 font-semibold">
                  <Plus className="size-4" />
                  {t("newTopicButton")}
                </Button>
              </div>
            )}

            {/* Toifalar roʻyxati (orqada) + editor (ustida) */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full px-5">
                {/* Joriy sinf toifasiz — boshqa sinflarning toifalari BU YERDA
                    koʻrsatilmaydi. Birinchi qadam bitta boʻlishi kerak: shablonni
                    qoʻshish. Kartalar haqiqiy toifa kartasining koʻrinishini
                    takrorlaydi, shuning uchun natija oldindan koʻrinadi. */}
                {needsDefaults ? (
                  <div className="relative py-4">
                    {/* Fon: natijaning oldindan koʻrinishi. Soʻndirilgan va
                        klik oʻtkazmaydi; ekran oʻqigichlar uchun ham yashirin —
                        haqiqiy maʼlumot emas, illyustratsiya. */}
                    <div
                      aria-hidden
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-50 pointer-events-none select-none"
                    >
                      {DEFAULT_TOPIC_TEMPLATES.map((tpl) => (
                        <TemplateCard key={tpl.name} template={tpl} />
                      ))}
                    </div>
                    {/* Skrim + xuddi shu `Empty` primitivi (roʻyxat boʻsh
                        holatida ishlatilgani bilan bir xil koʻrinish) —
                        boshqa card/shadow ixtiro qilinmaydi, standart
                        boʻsh-holat qoliplanadi. */}
                    <div className="absolute inset-0 flex items-center justify-center bg-card/50">
                      <Empty className="min-h-0 border-none bg-transparent">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><Tag /></EmptyMedia>
                          <EmptyTitle>
                            {t("seedBannerText", { class: classDataMap[seedTargetIds[0]]?.info.name ?? "" })}
                          </EmptyTitle>
                          <EmptyDescription>{t("noTopicsDescription")}</EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                          <Button onClick={() => onSeedDefaults(seedTargetIds)}>
                            <Plus /> {t("seedDefaults")}
                          </Button>
                        </EmptyContent>
                      </Empty>
                    </div>
                  </div>
                ) : visibleGroups.length === 0 ? (
                  <Empty className="min-h-[300px]">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><Tag /></EmptyMedia>
                      <EmptyTitle>{t("noTopicsTitle")}</EmptyTitle>
                      <EmptyDescription>{t("noTopicsDescription")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-4">
                    {visibleGroups.map((g) => (
                      <GroupCard
                        key={g.groupId}
                        group={g}
                        totalClasses={totalClasses}
                        classDataMap={classDataMap}
                        onEdit={() => openEdit(g)}
                        isMember={seedTargetIds.length === 0 || g.classIds.includes(seedTargetIds[0])}
                        currentClassName={classDataMap[seedTargetIds[0]]?.info.name ?? ""}
                        onAdd={() => addGroupToTargetClass(g)}
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
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <div className="grid h-full grid-cols-1 md:grid-cols-2">
                        {/* Chap ustun: nom, sinflar, kiritish usuli, yakuniy bahoga */}
                        <ScrollArea className="h-full md:border-r md:border-border">
                          <div className="px-6 py-5 flex flex-col gap-5">
                            {/* Nom + rang */}
                            <div className="flex flex-col gap-1.5">
                              <FieldLabel>{t("nameFieldLabel")}</FieldLabel>
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

                            {/* Vazn */}
                            <FormItem className="space-y-1.5">
                              <FieldLabel hint={t("purposeFieldHint")}>
                                {t("purposeFieldLabel")}
                              </FieldLabel>
                              <div className="flex items-center gap-3">
                                <FormField
                                  control={form.control}
                                  name="purpose"
                                  render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className="h-9 flex-1 rounded-lg bg-card text-sm font-medium">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent position="popper">
                                        <SelectItem value="summative">{t("countsInLabel")}</SelectItem>
                                        <SelectItem value="formative">{t("countsOutLabel")}</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                {isSummative && (
                                  <FormField
                                    control={form.control}
                                    name="weightPercent"
                                    render={({ field }) => (
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
                                    )}
                                  />
                                )}
                              </div>
                              {isSummative && (
                                <Progress value={Math.min(Math.max(watchWeight || 0, 0), 100)} className="h-2" />
                              )}
                            </FormItem>

                            {/* Baholash shkalasi */}
                            <FormField
                              control={form.control}
                              name="scaleKind"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FieldLabel hint={t("scaleKindFieldHint")}>
                                    {t("scaleKindFieldLabel")}
                                  </FieldLabel>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="h-9 w-full rounded-lg bg-card text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                      {GRADING_SCALE_PRESETS.map((p) => (
                                        <SelectItem key={p.kind} value={p.kind}>
                                          {p.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>
                        </ScrollArea>

                        {/* Oʻng ustun: shkala preview (faqat oʻqish) */}
                        <ScrollArea className="h-full">
                          <div className="px-6 py-5 flex flex-col gap-5">
                            <FieldLabel>{t("scalePreviewLabel")}</FieldLabel>
                            <ScaleBoundaryPreview kind={watchScaleKind} />
                          </div>
                        </ScrollArea>
                      </div>
                    </div>

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
                {/* Joriy sinf toifasiz boʻlsa "Vaznlar joyida" yashili yolgʻon
                    boʻlardi — bu holatda gapni banner aytadi. */}
                {visibleGroups.length > 0 && !needsDefaults && (
                  <WeightStatus overClasses={overClasses} underClasses={underClasses} />
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Standart toifa shabloni kartasi — hali QOʻSHILMAGAN toifa koʻrinishi.
 * GroupCard bilan bir xil tuzilma, lekin interaktiv emas: punktir chegara va
 * "N ta sinf" chipining yoʻqligi buni "taklif" deb oʻqitadi.
 */
function TemplateCard({ template }: { template: (typeof DEFAULT_TOPIC_TEMPLATES)[number] }) {
  const t = useTranslations("NewTopicModal");
  const isFormative = template.purpose === "formative";

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4"
      style={{ ["--card-accent" as string]: TOPIC_COLOR_HEX[template.color] }}
    >
      <div
        className="size-10 shrink-0 flex items-center justify-center rounded-full text-white"
        style={topicTints(template.color).gradientTile}
      >
        <Tag className="size-4.5" />
      </div>
      <div className="min-w-0">
        <h4 className="heading-small truncate text-foreground">{template.name}</h4>
        <TypographyMuted className="mt-0.5 text-xs">
          {t("scoreEnteredNotice")}
          {" · "}
          {SCALE_SHORT_LABELS[template.scaleKind ?? "ten"]}
        </TypographyMuted>
      </div>
      <div className="flex items-center justify-end gap-2">
        {isFormative ? (
          <Badge variant="outline" className="gap-1 border-dashed text-[10px] text-muted-foreground">
            <Ban className="size-3" /> {t("formativeBadge")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 tabular-nums text-[10px]">
            {t("summativeBadge")} {template.weightPercent}%
            <WeightDonut percent={template.weightPercent} compact />
          </Badge>
        )}
      </div>
    </div>
  );
}

/** Toifa kartasi — grid koʻrinishi uchun (GroupRow bilan bir xil maʼlumot, tik joylashuv). */
function GroupCard({
  group,
  totalClasses,
  classDataMap,
  onEdit,
  isMember,
  currentClassName,
  onAdd,
}: {
  group: TopicGroup;
  totalClasses: number;
  classDataMap: Record<string, ClassData>;
  onEdit: () => void;
  /** Joriy sinf shu guruhga kiradimi. `false` → karta soʻndiriladi. */
  isMember: boolean;
  currentClassName: string;
  onAdd: () => void;
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
      className={cn(
        "list-card group flex flex-col gap-3 p-4 transition-opacity",
        // Joriy sinf kirmagan toifa — kutubxonada koʻrinadi, lekin "meniki
        // emas": soʻndiriladi va yagona harakati "qoʻshish" boʻladi.
        !isMember && "opacity-55 hover:opacity-100"
      )}
      style={{ ["--card-accent" as string]: hex }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "list-card-icon size-10 shrink-0 flex items-center justify-center rounded-full text-white",
            !isMember && "grayscale"
          )}
          style={topicTints(group.color).gradientTile}
        >
          <Tag className="size-4.5" />
        </div>
        {isMember ? (
          <button
            type="button"
            onClick={onEdit}
            title={t("edit")}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
          >
            <Pencil className="size-4" />
          </button>
        ) : (
          <Button type="button" size="sm" variant="outline" onClick={onAdd}>
            <Plus /> {currentClassName}
          </Button>
        )}
      </div>
      <div className="min-w-0">
        <h4 className="heading-small truncate text-foreground">{group.name}</h4>
        <TypographyMuted className="mt-0.5 text-xs">
          {t("scoreEnteredNotice")}
          {" · "}
          {SCALE_SHORT_LABELS[group.scaleKind]}
        </TypographyMuted>
      </div>
      <div className="flex items-center justify-between gap-2">
        <ClassesBadge group={group} totalClasses={totalClasses} classDataMap={classDataMap} />
        {isFormative ? (
          <Badge variant="outline" className="gap-1 border-dashed text-[10px] text-muted-foreground">
            <Ban className="size-3" /> {t("formativeBadge")}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 tabular-nums text-[10px]">
            {t("summativeBadge")} {weightLabel}
            {uniform && <WeightDonut percent={minW} compact />}
          </Badge>
        )}
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
    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: hex }} aria-hidden />
  );
}

function AllClassesSwatch({ hexes }: { hexes: string[] }) {
  const cells = hexes.slice(0, 3);
  while (cells.length < 3) cells.push("var(--muted-foreground)");
  return (
    <span className="flex shrink-0 items-center" aria-hidden>
      {cells.map((c, i) => (
        <span
          key={i}
          className="size-3 rounded-full ring-2 ring-card"
          style={{ backgroundColor: c, marginLeft: i === 0 ? 0 : -5 }}
        />
      ))}
    </span>
  );
}

/**
 * Tanlangan shkalaning chegara jadvali — faqat koʻrsatish uchun (tahrirlanmaydi).
 * Cut-score tahriri ataylab qulflangan (spec §11.1) — shkala qatorlari
 * saqlanmaydi, shuning uchun bu yerda faqat oʻqish.
 */
function ScaleBoundaryPreview({ kind }: { kind: GradingScale }) {
  const t = useTranslations("NewTopicModal");
  const boundaries = getScaleBoundaries(kind);

  if (!boundaries) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <TypographyMuted className="text-xs leading-snug">
          {t("scalePreviewFormulaNotice")}
        </TypographyMuted>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-label text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">{t("scaleColLabel")}</th>
            <th className="px-3 py-2 text-right font-medium">{t("scaleColMin")}</th>
            <th className="px-3 py-2 text-right font-medium">{t("scaleColMax")}</th>
          </tr>
        </thead>
        <tbody>
          {boundaries.map((tier, i) => {
            const max = i === 0 ? 100 : boundaries[i - 1]!.min - 1;
            return (
              <tr key={tier.label + i} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2 font-semibold text-foreground">{tier.label}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{tier.min}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{max}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
  return (
    <ColorPickerButton
      value={selected}
      onChange={onSelect}
      colors={TOPIC_COLOR_ORDER}
      hexOf={(c) => TOPIC_COLOR_HEX[c]}
      ariaLabel={t("selectColor")}
      columns={4}
    />
  );
}
