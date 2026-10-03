"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, CheckCircle2, Compass, Copy, History, Loader2, RotateCcw, Sparkles, Target, Wand2, Printer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ClassInsight } from "@/lib/class-insight";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelFooter, PanelHeader } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { LESSON_MODELS, lessonModel, stagePlan, type ClassEnvironment } from "@/lib/lesson-models";
import { patchStage, studioMinutes, type LessonStudio } from "@/lib/lesson-studio";
import type { Lesson } from "@/lib/lessons-data";
import { EnvSummary } from "./ClassEnvDialog";

/* ════════════════════════════════════════════════════════════════════
   1-USTUN — DARS REJASI.

   Reja yoʻq: «nimadan tuzamiz» formasi — model (fan va mavzudan
   tavsiya), daqiqa, maqsad (ixtiyoriy, teskari loyihalash), sinf
   pasporti va standartlar koʻrinib turadi. Ikki yoʻl: AI bilan yoki
   AI'siz shablon (model bosqichlari + standart bloklar).

   Reja bor: maqsad, mezonlar va bosqichlar (daqiqasi tahrirlanadi).
   «Qabul qilish» — oʻqituvchi koʻrib chiqdi; taklif holati ochiq
   yoziladi, AI natijasi jimgina «tayyor» boʻlib qolmasin.
   ════════════════════════════════════════════════════════════════════ */

export type PlanRequest = {
  ai: boolean;
  modelKey: string;
  duration: number;
  objective: string;
  note: string;
  /** Sinfning oxirgi test natijasini AI rejaga hisobga olsin. */
  useInsight: boolean;
};

export function StudioPlanColumn({
  lesson,
  studio,
  env,
  envDefault,
  recommended,
  defaultDuration,
  standards,
  previousReflection,
  insight,
  busy,
  onBuild,
  onCancel,
  onChange,
  onOpenEnv,
  copyFrom,
  onCopyFrom,
  onIshlanma,
}: {
  lesson: Lesson;
  studio: LessonStudio | null;
  env: ClassEnvironment;
  envDefault: boolean;
  recommended: { key: string; reason: string };
  defaultDuration: number;
  standards: { code: string; desc: string }[];
  previousReflection?: string;
  /** Sinfning oxirgi test natijasi (`classInsightAction`) — yoʻq boʻlsa `null`. */
  insight: ClassInsight | null;
  busy: boolean;
  onBuild: (req: PlanRequest) => void;
  onCancel: () => void;
  onChange: (next: LessonStudio | null) => void;
  onOpenEnv: () => void;
  copyFrom: string[];
  onCopyFrom: (classId: string) => void;
  /** Dars ishlanmasi — koʻrish, chop etish, Word (`IshlanmaDialog`). */
  onIshlanma: () => void;
}) {
  const t = useTranslations("LessonStudio");
  const classes = useLiveClasses();
  const [modelKey, setModelKey] = useState(recommended.key);
  const [touched, setTouched] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);
  const [objective, setObjective] = useState("");
  const [note, setNote] = useState("");
  const [useInsight, setUseInsight] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!touched) setModelKey(recommended.key);
  }, [recommended.key, touched]);
  useEffect(() => setDuration(defaultDuration), [defaultDuration]);
  // Boshqa darsga oʻtilganda forma tozalanadi.
  useEffect(() => {
    setObjective("");
    setNote("");
    setTouched(false);
  }, [lesson.id]);

  const safeDuration = Math.min(180, Math.max(10, Number.isFinite(duration) ? duration : 45));
  const model = lessonModel(studio?.modelKey ?? modelKey) ?? LESSON_MODELS[0];

  const header = (
    <PanelHeader
      icon={<Compass />}
      title={t("plan.title")}
      description={lesson.title || t("untitledLesson")}
    />
  );

  if (!studio) {
    return (
      <Panel className="flex min-h-[60svh] flex-col lg:h-full lg:min-h-0">
        {header}
        <PanelBody inset className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
          <EnvSummary env={env} isDefault={envDefault} onEdit={onOpenEnv} />

          <section className="flex flex-col gap-2">
            <span className="text-label text-muted-foreground">{t("plan.model")}</span>
            <Select value={modelKey} onValueChange={(v) => { setModelKey(v); setTouched(true); }}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LESSON_MODELS.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.name}{m.key === recommended.key ? ` · ${t("plan.recommended")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground">
              {modelKey === recommended.key ? recommended.reason : model.bestFor}
            </p>
            <ol className="flex flex-col gap-1 rounded-lg border border-border p-3">
              {stagePlan(modelKey, safeDuration).map((st, i) => (
                <li key={st.code} className="flex items-baseline gap-2 text-caption">
                  <span className="w-4 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                  <span className="flex-1 text-foreground">{st.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{t("minutes", { count: st.minutes })}</span>
                </li>
              ))}
            </ol>
            <label className="flex items-center gap-2 text-caption text-muted-foreground">
              {t("plan.duration")}
              <Input
                type="number"
                min={10}
                max={180}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="h-9 w-20"
              />
              {t("plan.minutesUnit")}
            </label>
          </section>

          <section className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-label text-muted-foreground">
              <Target className="size-3.5" /> {t("plan.objective")}
            </span>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder={t("plan.objectivePlaceholder")}
              rows={2}
              maxLength={400}
            />
          </section>

          <section className="flex flex-col gap-2">
            <span className="text-label text-muted-foreground">{t("plan.standards")}</span>
            {standards.length ? (
              <div className="flex flex-wrap gap-1.5">
                {standards.map((s) => (
                  <Badge key={s.code} variant="outline" title={s.desc}>{s.code}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-caption text-muted-foreground">{t("plan.noStandards")}</p>
            )}
          </section>

          {previousReflection?.trim() && (
            <section className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-label text-muted-foreground">
                <History className="size-3.5" /> {t("plan.previous")}
              </p>
              <p className="mt-1 text-caption text-foreground">«{previousReflection.trim()}»</p>
            </section>
          )}

          {/* Maʼlumotga asoslangan rejalash: oxirgi test natijasi AI rejaga. */}
          {insight && (
            <section className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-label text-muted-foreground">
                <BarChart3 className="size-3.5" /> {t("insight.title")}
              </p>
              <p className="text-caption text-foreground">
                {t("insight.summary", {
                  title: insight.title,
                  accuracy: insight.classAccuracy,
                  students: insight.students,
                  needHelp: insight.needHelp,
                })}
              </p>
              {insight.hardest.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {insight.hardest.map((h) => (
                    <li key={h.no} className="flex gap-2 text-caption text-muted-foreground">
                      <span
                        className={cn(
                          "shrink-0 font-mono tabular-nums",
                          h.accuracy < 40 ? "text-destructive" : "text-warning",
                        )}
                      >
                        {h.accuracy}%
                      </span>
                      <span className="line-clamp-2">
                        {t("insight.question", { no: h.no })}
                        {h.stem ? ` — ${h.stem}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <label className="flex items-center gap-2 text-caption text-foreground">
                <Checkbox checked={useInsight} onCheckedChange={(v) => setUseInsight(v === true)} />
                {t("insight.use")}
              </label>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <span className="text-label text-muted-foreground">{t("plan.note")}</span>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("plan.notePlaceholder")}
              maxLength={500}
            />
          </section>

          {copyFrom.length > 0 && (
            <section className="flex flex-col gap-2">
              <span className="text-label text-muted-foreground">{t("plan.copyFrom")}</span>
              <div className="flex flex-wrap gap-2">
                {copyFrom.map((cid) => (
                  <Button key={cid} variant="outline" size="sm" className="gap-1.5 shadow-none" onClick={() => onCopyFrom(cid)}>
                    <Copy className="size-3.5" />
                    {classes.find((c) => c.id === cid)?.name ?? cid}
                  </Button>
                ))}
              </div>
            </section>
          )}
        </PanelBody>
        <PanelFooter className="flex flex-col gap-2">
          {busy ? (
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-caption text-muted-foreground" role="status">
              <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> {t("plan.generating")}</span>
              <button type="button" onClick={onCancel} className="font-medium text-foreground underline-offset-4 hover:underline">
                {t("cancel")}
              </button>
            </div>
          ) : (
            <Button className="w-full gap-1.5" onClick={() => onBuild({ ai: true, modelKey, duration: safeDuration, objective, note, useInsight })}>
              <Sparkles className="size-4" /> {t("plan.buildAi")}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full gap-1.5 shadow-none"
            disabled={busy}
            onClick={() => onBuild({ ai: false, modelKey, duration: safeDuration, objective, note, useInsight })}
          >
            <Wand2 className="size-4" /> {t("plan.buildTemplate")}
          </Button>
        </PanelFooter>
      </Panel>
    );
  }

  const total = studioMinutes(studio);
  const mismatch = Math.abs(total - studio.duration) > 2;

  return (
    <Panel className="flex min-h-[60svh] flex-col lg:h-full lg:min-h-0">
      {header}
      <PanelBody inset className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2">
          {studio.accepted ? (
            <Badge variant="outline" className="gap-1 border-success/40 text-success">
              <CheckCircle2 className="size-3" /> {t("plan.accepted")}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-warning/40 text-warning">{t("plan.proposal")}</Badge>
          )}
          <Badge variant="secondary">{studio.source === "ai" ? t("plan.sourceAi") : t("plan.sourceTemplate")}</Badge>
          <span className="truncate text-caption text-muted-foreground" title={model.name}>{model.name}</span>
        </div>

        <section className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-label text-muted-foreground">
            <Target className="size-3.5" /> {t("plan.objective")}
          </span>
          <Textarea
            key={`${lesson.id}-${studio.updatedAt}-obj`}
            defaultValue={studio.objective ?? ""}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (studio.objective ?? "")) onChange({ ...studio, objective: v || undefined, updatedAt: new Date().toISOString() });
            }}
            placeholder={t("plan.objectivePlaceholder")}
            rows={2}
            maxLength={400}
          />
          {studio.criteria?.length ? (
            <ul className="flex flex-col gap-1">
              {studio.criteria.map((c, i) => (
                <li key={i} className="flex gap-2 text-caption text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label text-muted-foreground">{t("plan.stages")}</span>
            <span className={cn("text-caption tabular-nums", mismatch ? "text-warning" : "text-muted-foreground")}>
              {t("plan.total", { total, duration: studio.duration })}
            </span>
          </div>
          <ol className="flex flex-col gap-2">
            {studio.stages.map((st, i) => (
              <li key={st.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{st.name}</span>
                  <Input
                    type="number"
                    min={1}
                    max={180}
                    value={st.minutes}
                    aria-label={t("plan.stageMinutes", { name: st.name })}
                    onChange={(e) => {
                      const v = Math.round(Number(e.target.value));
                      if (v >= 1 && v <= 180) onChange(patchStage(studio, st.id, { minutes: v }));
                    }}
                    className="h-8 w-16 text-right tabular-nums"
                  />
                  <span className="text-caption text-muted-foreground">{t("plan.minutesUnit")}</span>
                </div>
                <p className="mt-1 text-caption text-muted-foreground">{st.goal}</p>
                <details className="group mt-2">
                  <summary className="cursor-pointer text-caption font-medium text-foreground">
                    {st.teacher || st.students ? t("plan.whoDoesWhat") : t("plan.addNotes")}
                  </summary>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="flex flex-col gap-1 text-caption text-muted-foreground">
                      {t("plan.teacherDoes")}
                      <Textarea
                        key={`${st.id}-${studio.updatedAt}-t`}
                        defaultValue={st.teacher ?? ""}
                        rows={2}
                        maxLength={400}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (st.teacher ?? "")) onChange(patchStage(studio, st.id, { teacher: v || undefined }));
                        }}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-caption text-muted-foreground">
                      {t("plan.studentsDo")}
                      <Textarea
                        key={`${st.id}-${studio.updatedAt}-s`}
                        defaultValue={st.students ?? ""}
                        rows={2}
                        maxLength={400}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v !== (st.students ?? "")) onChange(patchStage(studio, st.id, { students: v || undefined }));
                        }}
                      />
                    </label>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </section>
      </PanelBody>
      <PanelFooter className="flex flex-col gap-2">
        {!studio.accepted && (
          <Button className="w-full gap-1.5" onClick={() => onChange({ ...studio, accepted: true, updatedAt: new Date().toISOString() })}>
            <CheckCircle2 className="size-4" /> {t("plan.accept")}
          </Button>
        )}
        <Button variant="outline" className="w-full gap-1.5 shadow-none" onClick={onIshlanma}>
          <Printer className="size-4" /> {t("ishlanma.button")}
        </Button>
        <Button variant="ghost" className="w-full gap-1.5 text-muted-foreground" onClick={() => setConfirmReset(true)}>
          <RotateCcw className="size-4" /> {t("plan.rebuild")}
        </Button>
      </PanelFooter>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("plan.rebuildTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("plan.rebuildDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onChange(null)}>{t("plan.rebuildConfirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Panel>
  );
}
