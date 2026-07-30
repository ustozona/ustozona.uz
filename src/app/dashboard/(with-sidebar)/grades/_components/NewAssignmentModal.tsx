"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, CalendarIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import { TOPIC_COLOR_HEX, type Topic, type Assignment } from "@/lib/grades-data";

/** Select'da boʻsh qiymat ishlamaydi — "Toifasiz" shu sentinel bilan belgilanadi. */
export const NO_TOPIC_VALUE = "__no_topic__";

function buildFormSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("titleRequired")),
    maxScore: z.number().min(1, t("maxScoreMin")).max(1000, t("maxScoreMax")),
    /** "" / NO_TOPIC_VALUE = "Toifasiz" (topicId: null). */
    topicId: z.string(),
    date: z.string().min(1, t("dateRequired")),
    /** Topshirish muddati — ixtiyoriy; xulq avto-ball qoidasi shu muddatga qaraydi. */
    dueDate: z.string().optional(),
  });
}

export type AssignmentFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

type Props = {
  topics: Topic[];
  /** Mavjud topshiriqlar — maksimal ball takliflarini hisoblash uchun. */
  assignments?: Assignment[];
  initial?: Partial<Omit<AssignmentFormValues, "topicId">> & { topicId?: string | null };
  mode?: "create" | "edit";
  onClose: () => void;
  onSubmit: (input: AssignmentFormValues) => void;
};

/**
 * Maksimal ball takliflari: oʻqituvchi avval kiritgan qiymatlardan.
 * Saralash — (1) tanlangan toifada eng koʻp ishlatilgan, (2) global eng koʻp.
 */
function buildScoreSuggestions(
  assignments: Assignment[],
  selectedTopicId: string,
  limit = 3
): number[] {
  const sameTopic = new Map<number, number>();
  const global = new Map<number, number>();
  for (const a of assignments) {
    if (!a.topicId) continue;
    if (!a.maxScore || a.maxScore <= 0) continue;
    global.set(a.maxScore, (global.get(a.maxScore) ?? 0) + 1);
    if (a.topicId === selectedTopicId) {
      sameTopic.set(a.maxScore, (sameTopic.get(a.maxScore) ?? 0) + 1);
    }
  }
  const byFreq = (m: Map<number, number>) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
  const ordered: number[] = [];
  for (const v of [...byFreq(sameTopic), ...byFreq(global)]) {
    if (!ordered.includes(v)) ordered.push(v);
  }
  return ordered.slice(0, limit);
}

const today = () => new Date().toISOString().slice(0, 10);

const UZ_MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/** "2026-06-19" → "19-iyun, 2026". */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d}-${UZ_MONTHS[(m - 1) % 12]}, ${y}`;
}

export default function NewAssignmentModal({
  topics,
  assignments = [],
  initial,
  mode = "create",
  onClose,
  onSubmit: onSubmitProp,
}: Props) {
  const t = useTranslations("NewAssignmentModal");
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initial?.title ?? "",
      maxScore: initial?.maxScore ?? 100,
      topicId:
        initial && "topicId" in initial
          ? (initial.topicId ?? NO_TOPIC_VALUE)
          : (topics[0]?.id ?? NO_TOPIC_VALUE),
      date: initial?.date ?? today(),
      dueDate: initial?.dueDate ?? "",
    },
  });

  const watchTopicId = form.watch("topicId");

  const suggestions = useMemo(
    () => buildScoreSuggestions(assignments, watchTopicId),
    [assignments, topics, watchTopicId]
  );

  // Toifa oʻzgarganda eng mos taklifni avto-toʻldiramiz —
  // ammo faqat oʻqituvchi maydonni qoʻlda tegmagan boʻlsa (dirty emas).
  useEffect(() => {
    if (mode === "edit") return;
    if (form.formState.dirtyFields.maxScore) return;
    if (suggestions[0] != null) {
      form.setValue("maxScore", suggestions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTopicId, suggestions[0]]);

  function onSubmit(values: AssignmentFormValues) {
    onSubmitProp(values);
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-border text-left shrink-0">
          <DialogTitle>{mode === "edit" ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 flex flex-col gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-label">{t("titleLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("titlePlaceholder")}
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
                name="topicId"
                render={({ field }) => {
                  const selected = topics.find((t) => t.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel className="text-label">{t("topicLabel")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 rounded-lg bg-card text-sm w-full">
                            <SelectValue placeholder={t("topicPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {topics.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className="size-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: TOPIC_COLOR_HEX[t.color] }}
                                />
                                {t.name}
                              </span>
                            </SelectItem>
                          ))}
                          <SelectItem value={NO_TOPIC_VALUE}>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span className="size-2.5 rounded-full shrink-0 border border-dashed border-muted-foreground/50" />
                              {t("noTopic")}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {selected && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={selected.purpose === "formative" ? "outline" : "secondary"}
                            className={cn(
                              "text-[10px] font-medium",
                              selected.purpose === "formative" &&
                                "border-dashed border-muted-foreground/40 text-muted-foreground"
                            )}
                          >
                            {selected.purpose === "formative"
                              ? t("formativeBadge")
                              : t("summativeBadge")}
                          </Badge>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-label">{t("dateLabel")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-9 w-full justify-start gap-2 rounded-lg bg-card text-sm font-normal shadow-none",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="size-4 text-muted-foreground" />
                            {field.value ? formatDate(field.value) : t("datePlaceholder")}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) =>
                            field.onChange(d ? d.toISOString().slice(0, 10) : "")
                          }
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <FormLabel className="text-label">{t("dueDateLabel")}</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={t("dueDateAriaAbout")}
                          >
                            <Info className="size-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[240px] text-xs leading-snug">
                          {t("dueDateTooltip")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <DateKeyPicker
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          className="h-9 flex-1 rounded-lg bg-card text-sm shadow-none"
                          ariaLabel={t("dueDateLabel")}
                        />
                      </FormControl>
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 px-2 text-muted-foreground"
                          onClick={() => field.onChange("")}
                        >
                          {t("clear")}
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1.5">
                        <FormLabel className="text-label">{t("maxScoreLabel")}</FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground transition-colors hover:text-foreground"
                              aria-label={t("maxScoreAriaAbout")}
                            >
                              <Info className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px] text-xs leading-snug">
                            {t("maxScoreTooltip")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          className="h-9 rounded-lg bg-card text-sm"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.valueAsNumber)}
                        />
                      </FormControl>
                      {suggestions.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[11px] text-muted-foreground">{t("quickPick")}</span>
                          {suggestions.map((s) => {
                            const active = field.value === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  form.setValue("maxScore", s, { shouldDirty: true, shouldValidate: true })
                                }
                                className={cn(
                                  "rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums transition-colors",
                                  active
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
              <Button variant="outline" size="sm" type="button" onClick={onClose}>{t("cancel")}</Button>
              <Button size="sm" type="submit">
                <Plus className="size-4" />
                {mode === "edit" ? t("save") : t("create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
