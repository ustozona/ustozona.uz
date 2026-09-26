"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Compass, Zap, Target, PenLine, Gamepad2, History, NotebookPen, Presentation, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditorSidePanelHeader } from "@/components/ui/editor-side-panel";
import {
  LESSON_MODELS, EMPTY_CLASS_ENV, buildPlanPrompt, lessonModel, selectModel, skeletonHtml, stagePlan,
  type ClassEnvironment,
} from "@/lib/lesson-models";

/* ════════════════════════════════════════════════════════════════════
   REJA USTASI — «Mavzu markazi» (LessonLab Planner'dan koʻchirilgan).

   Planner yaratuvchi tomonidan qulflangach (2026-09-26) uning Ustozonada
   yoʻq imkoniyatlari shu panelga oʻtdi:

     • Jahon dars modellari (13 ta) — fan + mavzuga qarab TAVSIYA,
       oʻqituvchi xohlasa almashtiradi (`src/lib/lesson-models.ts`).
     • Rejani tuzishning 3 yoʻli: ⚡ tez (AI), 🎯 maqsaddan boshlab (AI,
       teskari loyihalash), ✍️ oʻzim yozaman (AI'siz shablon).
     • Sinf holati (smartdoska, proyektor, harakat joyi, telefonlar,
       oʻquvchilar soni, daraja) — AI rejani aynan shu sinfga moslaydi.
     • Oldingi dars mulohazasi va «Dars oʻtgach» refleksiyasi.
     • Taqdimot rejimi va mavzuni Ustozona-Games bilan mustahkamlash.

   AI chaqiruvi bu yerda EMAS — tayyor soʻrov mavjud AI yordamchisiga
   uzatiladi (`onAskAi`). Kvota, provayder zanjiri, chat tarixi va
   «Darsga qoʻshish» oʻsha yerda allaqachon bor — ikkinchi AI yoʻli
   ochilmaydi.

   Sinf holati HOZIRCHA brauzerda (localStorage, sinf boʻyicha): u kichik,
   faqat AI soʻrovi uchun kerak, va sinf sozlamalari hujjati
   (`teachers.prefs.classPrefs`) markaziy store orqali sinxronlanadi —
   unga maydon qoʻshish jamoa bilan kelishilgan alohida ish.
   ════════════════════════════════════════════════════════════════════ */

const ENV_KEY = (classId: string) => `ustozona-class-env:${classId}`;

function readEnv(classId: string | undefined): ClassEnvironment {
  if (!classId) return EMPTY_CLASS_ENV;
  try {
    const raw = localStorage.getItem(ENV_KEY(classId));
    return raw ? { ...EMPTY_CLASS_ENV, ...(JSON.parse(raw) as Partial<ClassEnvironment>) } : EMPTY_CLASS_ENV;
  } catch {
    return EMPTY_CLASS_ENV;
  }
}

type Way = "quick" | "goal" | "self";

export default function PlanWizardPanel({
  topic,
  subject,
  grade,
  classId,
  className,
  defaultDuration,
  previousLesson,
  reflection,
  onClose,
  onAskAi,
  onInsertSkeleton,
  onSaveReflection,
  onPresent,
}: {
  topic: string;
  /** Katalog `id` + nomi birga (`"english Ingliz tili"`) — tanlash qoidasi uchun. */
  subject: string;
  grade: number | null;
  classId?: string;
  className?: string;
  defaultDuration: number;
  previousLesson: { title: string; reflection?: string } | null;
  reflection: string;
  onClose: () => void;
  onAskAi: (prompt: string) => void;
  onInsertSkeleton: (html: string) => void;
  onSaveReflection: (text: string) => void;
  onPresent: () => void;
}) {
  const t = useTranslations("LessonPlanWizard");
  const recommended = useMemo(() => selectModel({ subject, topic, grade }), [subject, topic, grade]);
  const [modelKey, setModelKey] = useState<string>(recommended.key);
  const [touchedModel, setTouchedModel] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);
  const [way, setWay] = useState<Way>("quick");
  const [goal, setGoal] = useState("");
  const [env, setEnv] = useState<ClassEnvironment>(EMPTY_CLASS_ENV);
  const [reflectionDraft, setReflectionDraft] = useState(reflection);

  // Mavzu oʻzgarsa, oʻqituvchi hali qoʻlda tanlamagan boʻlsa — tavsiya yangilanadi.
  useEffect(() => {
    if (!touchedModel) setModelKey(recommended.key);
  }, [recommended.key, touchedModel]);
  useEffect(() => setEnv(readEnv(classId)), [classId]);
  useEffect(() => setReflectionDraft(reflection), [reflection]);
  useEffect(() => setDuration(defaultDuration), [defaultDuration]);

  const model = lessonModel(modelKey) ?? LESSON_MODELS[0];
  const reason = modelKey === recommended.key ? recommended.reason : t("teacherChoice");
  const safeDuration = Math.min(180, Math.max(10, Number.isFinite(duration) ? duration : 45));

  function patchEnv(patch: Partial<ClassEnvironment>) {
    setEnv((cur) => {
      const next = { ...cur, ...patch };
      if (classId) {
        try { localStorage.setItem(ENV_KEY(classId), JSON.stringify(next)); } catch { /* saqlanmasa ham soʻrovda ishlaydi */ }
      }
      return next;
    });
  }

  function run() {
    if (way === "self") {
      onInsertSkeleton(skeletonHtml({ modelKey, duration: safeDuration, goal }));
      toast.success(t("toast.skeleton"));
      return;
    }
    if (way === "goal" && !goal.trim()) {
      toast.error(t("toast.goalRequired"));
      return;
    }
    onAskAi(
      buildPlanPrompt({
        topic,
        modelKey,
        reason,
        duration: safeDuration,
        goal: way === "goal" ? goal : undefined,
        env,
        previousReflection: previousLesson?.reflection ?? null,
      }),
    );
  }

  const ways: { key: Way; icon: typeof Zap; title: string; desc: string }[] = [
    { key: "quick", icon: Zap, title: t("ways.quick.title"), desc: t("ways.quick.desc") },
    { key: "goal", icon: Target, title: t("ways.goal.title"), desc: t("ways.goal.desc") },
    { key: "self", icon: PenLine, title: t("ways.self.title"), desc: t("ways.self.desc") },
  ];

  return (
    <div className="flex h-full flex-col">
      <EditorSidePanelHeader
        icon={<Compass className="size-[18px]" />}
        title={t("title")}
        onClose={onClose}
        closeLabel={t("close")}
      />

      <div className="flex-1 min-h-0 scrollbar-hover space-y-6 overflow-y-auto px-5 py-5">
        {/* Oldingi dars — mulohaza keyingi rejaga esga soladi */}
        {previousLesson && (
          <section className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="flex items-center gap-2 text-label text-muted-foreground">
              <History className="size-3.5" /> {t("previous.title")}
            </p>
            <p className="mt-1 truncate text-body font-medium text-foreground">{previousLesson.title || t("untitled")}</p>
            <p className="mt-1 text-caption text-muted-foreground">
              {previousLesson.reflection?.trim() ? `«${previousLesson.reflection.trim()}»` : t("previous.empty")}
            </p>
          </section>
        )}

        {/* Dars modeli */}
        <section className="space-y-2">
          <Label className="text-label text-muted-foreground">{t("model.label")}</Label>
          <Select
            value={modelKey}
            onValueChange={(v) => { setModelKey(v); setTouchedModel(true); }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LESSON_MODELS.map((m) => (
                <SelectItem key={m.key} value={m.key}>
                  {m.name}
                  {m.key === recommended.key ? ` · ${t("model.recommended")}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-caption text-muted-foreground">
            <span className="font-medium text-foreground">{t("model.bestFor")}:</span> {model.bestFor}
          </p>
          <p className="text-caption text-muted-foreground">
            <span className="font-medium text-foreground">{t("model.why")}:</span> {reason}
          </p>
          <ol className="space-y-1 rounded-lg border border-border p-3">
            {stagePlan(model.key, safeDuration).map((st, i) => (
              <li key={st.code} className="flex items-baseline gap-2 text-caption">
                <span className="w-4 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 text-foreground">{st.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{st.minutes} {t("minutes")}</span>
              </li>
            ))}
          </ol>
          <div className="flex items-center gap-2">
            <Label htmlFor="pw-duration" className="text-caption text-muted-foreground">{t("duration")}</Label>
            <Input
              id="pw-duration"
              type="number"
              min={10}
              max={180}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-8 w-20"
            />
            <span className="text-caption text-muted-foreground">{t("minutes")}</span>
          </div>
        </section>

        {/* Rejani tuzishning uch yoʻli */}
        <section className="space-y-2">
          <Label className="text-label text-muted-foreground">{t("ways.label")}</Label>
          <div className="grid gap-2" role="radiogroup" aria-label={t("ways.label")}>
            {ways.map(({ key, icon: Icon, title, desc }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={way === key}
                onClick={() => setWay(key)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  way === key ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                )}
              >
                <Icon className={cn("mt-0.5 size-4 shrink-0", way === key ? "text-primary" : "text-muted-foreground")} />
                <span className="min-w-0">
                  <span className="block text-body font-medium text-foreground">{title}</span>
                  <span className="block text-caption text-muted-foreground">{desc}</span>
                </span>
              </button>
            ))}
          </div>

          {way === "goal" && (
            <div className="space-y-1">
              <Label htmlFor="pw-goal" className="text-caption text-muted-foreground">{t("goal.label")}</Label>
              <Textarea
                id="pw-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={t("goal.placeholder")}
                rows={3}
              />
            </div>
          )}
        </section>

        {/* Sinf holati */}
        <section className="space-y-3">
          <div>
            <Label className="text-label text-muted-foreground">
              {t("env.label")}{className ? ` · ${className}` : ""}
            </Label>
            <p className="mt-1 text-caption text-muted-foreground">{t("env.hint")}</p>
          </div>
          {(
            [
              ["smartboard", t("env.smartboard")],
              ["projector", t("env.projector")],
              ["movement", t("env.movement")],
              ["phones", t("env.phones")],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-3 text-body text-foreground">
              {label}
              <Switch checked={env[key]} onCheckedChange={(v) => patchEnv({ [key]: v } as Partial<ClassEnvironment>)} />
            </label>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="pw-count" className="text-caption text-muted-foreground">{t("env.count")}</Label>
              <Input
                id="pw-count"
                type="number"
                min={1}
                max={60}
                value={env.studentCount ?? ""}
                onChange={(e) => patchEnv({ studentCount: e.target.value ? Math.min(60, Math.max(1, Number(e.target.value))) : null })}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-caption text-muted-foreground">{t("env.level")}</Label>
              <Select
                value={env.level ?? "none"}
                onValueChange={(v) => patchEnv({ level: v === "none" ? null : (v as ClassEnvironment["level"]) })}
              >
                <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("env.levels.none")}</SelectItem>
                  <SelectItem value="strong">{t("env.levels.strong")}</SelectItem>
                  <SelectItem value="mixed">{t("env.levels.mixed")}</SelectItem>
                  <SelectItem value="weak">{t("env.levels.weak")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Resurslar: taqdimot va oʻyin */}
        <section className="space-y-2">
          <Label className="text-label text-muted-foreground">{t("resources.label")}</Label>
          <Button variant="outline" className="w-full justify-start" onClick={onPresent}>
            <Presentation /> {t("resources.present")}
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <a href="/games" target="_blank" rel="noopener noreferrer">
              <Gamepad2 /> {t("resources.games")}
              <ExternalLink className="ml-auto size-3.5 text-muted-foreground" />
            </a>
          </Button>
        </section>

        {/* Dars oʻtgach — keyingi darsning «Oldingi dars» qismida chiqadi */}
        <section className="space-y-2">
          <Label htmlFor="pw-reflect" className="flex items-center gap-2 text-label text-muted-foreground">
            <NotebookPen className="size-3.5" /> {t("reflect.label")}
          </Label>
          <Textarea
            id="pw-reflect"
            value={reflectionDraft}
            onChange={(e) => setReflectionDraft(e.target.value)}
            onBlur={() => { if (reflectionDraft !== reflection) onSaveReflection(reflectionDraft.trim()); }}
            placeholder={t("reflect.placeholder")}
            rows={3}
          />
          <p className="text-caption text-muted-foreground">{t("reflect.hint")}</p>
        </section>
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <Button className="w-full" onClick={run}>
          {way === "self" ? <PenLine /> : <Zap />}
          {way === "self" ? t("run.self") : t("run.ai")}
        </Button>
      </div>
    </div>
  );
}
