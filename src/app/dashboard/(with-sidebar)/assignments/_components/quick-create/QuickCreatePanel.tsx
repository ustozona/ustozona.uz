"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowUpRight,
  DoorOpen,
  Info,
  LayoutGrid,
  Library,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  MonitorPlay,
  Network,
  NotebookPen,
  Plus,
  Presentation,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { MaterialKindPicker } from "@/components/materials/MaterialKindPicker";
import { useLessonStore } from "@/store/useLessonStore";
import { flushLessonsNow } from "@/components/sync/LessonsServerSync";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useNow } from "@/hooks/useNow";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { dateKeyToDate, dateToKey } from "@/lib/date-keys";
import { DAYS_UZ_SUN, MONTHS_UZ, MONTHS_UZ_SHORT } from "@/lib/localization";
import { classSessions } from "@/lib/lesson-flow";
import { subjectLabel } from "@/lib/standards-data";
import { workPlanFor, workPlanPrompt } from "@/lib/work-plan";
import {
  AI_LEVELS,
  AI_TEST_COUNTS,
  type AiLevel,
  type AiMaterial,
  type AiMaterialError,
  type AiMaterialKind,
} from "@/lib/ai-materials";
import { uploadEditorImageAction } from "@/server/actions/uploads";
import type { DraftQuestion } from "../test/builder/types";
import { deckDrafts, imageSlideDraft, mcqDraft, templateDrafts, type TemplateId } from "./materials-to-draft";
import { infographicSvg, mindMapSvg, svgToPng } from "./visuals";
import { VisualPreview, type VisualResult } from "./VisualPreview";

/* ════════════════════════════════════════════════════════════════════
   TEZKOR YARATISH — «+ Yaratish» muharririning markazi.

   Maqsad (loyiha egasining talabi, 2026-09-28): oʻqituvchi darsga
   tayyorgarliksiz kirgan boʻlsa ham 1–2 daqiqada bolalar uchun ish
   tayyorlay olsin. Shuning uchun bu yerda HAMMA yoʻl bitta joyda:

     • Vaqt — qurilma mintaqasida jonli soat, sana, hafta kuni va yil;
       sinfning bugungi darsi boʻlsa, qachon boshlanishi yoki qancha
       qolgani (ish rejadagi sessiyadan).
     • Mavzu — ish rejadagi bugungi (yoki keyingi) mavzu oʻzi turadi;
       oʻqituvchi istalgan mavzuni yoza oladi.
     • AI bilan: test · interaktiv dars (slaydlar + orada «tushundimi?»
       savollari) · taqdimot · aqliy xarita · infografika. Natija
       toʻplam muharririda ochiladi — oʻqituvchi koʻrib, tahrirlab,
       keyin «Darsda oʻtkazish» yoki «Uyga berish».
     • 45 daqiqalik dars rejasi — Darslar sahifasidagi Reja ustasi shu
       mavzuning darsida ochiladi (ikkinchi AI yoʻli ochilmaydi).
     • AI'siz shablonlar — dars boshi, oʻrtasi va oxiri uchun darhol.
     • Qoʻlda — boʻsh test/taqdimot yoki tayyor testni tanlash.

   Ilgari bu joyda «Baholash usuli: Qoʻlda | Avtomatik» tanlovi turardi
   va mazmun yaratish yoʻli «Avtomatik» ortida yashirin edi. Tanlov
   hech narsani saqlamasdi (u faqat yoʻl ochuvchi edi), endi esa yoʻl
   doim ochiq. Qoʻlda baholanadigan ish uchun hech narsa tanlash shart
   emas — «Yaratish» baribir jurnal ustunini tugʻdiradi (R214).

   Proyektorsiz sinf: test «Qogʻoz», «QR-kartalar» yoki «Pult» bilan
   oʻtadi (faqat oʻqituvchining telefoni kerak), aqliy xarita va
   infografika esa chop etiladi.
   ════════════════════════════════════════════════════════════════════ */

export type QuickTopic = { text: string; lessonId?: string };

export type BuilderInit = {
  questions: DraftQuestion[];
  title: string;
  firstShape: "mcq" | "slide";
};

const AI_CARDS: { kind: AiMaterialKind; icon: LucideIcon; color: ClassColor }[] = [
  { kind: "test", icon: ListChecks, color: "green" },
  { kind: "lesson", icon: MonitorPlay, color: "violet" },
  { kind: "slides", icon: Presentation, color: "orange" },
  { kind: "mindmap", icon: Network, color: "sky" },
  { kind: "infographic", icon: LayoutGrid, color: "rose" },
];

const TEMPLATES: { id: TemplateId; icon: LucideIcon }[] = [
  { id: "warmup", icon: Lightbulb },
  { id: "check", icon: MessageCircleQuestion },
  { id: "exit", icon: DoorOpen },
];

const PREFS_KEY = "ustozona-quickcreate";

type Prefs = { count: number; level: AiLevel };

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") as Partial<Prefs>;
    return {
      count: AI_TEST_COUNTS.some((c) => c === raw.count) ? (raw.count as number) : 10,
      level: AI_LEVELS.find((l) => l === raw.level) ?? "mixed",
    };
  } catch {
    return { count: 10, level: "mixed" };
  }
}

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

/** «Dushanba, 28-sentabr, 2026». Oʻzbekchada oʻz nomlarimiz: brauzerlarning
    bir qismida `uz` uchun ICU maʼlumoti yoʻq va «M09» chiqadi. */
function formatDay(now: Date, locale: string): string {
  if (locale === "uz") {
    return `${DAYS_UZ_SUN[now.getDay()]}, ${now.getDate()}-${MONTHS_UZ[now.getMonth()].toLowerCase()}, ${now.getFullYear()}`;
  }
  try {
    const s = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
    if (!/M\d/.test(s)) return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
  } catch {
    /* nomaʼlum til kodi — raqamga tushamiz */
  }
  return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
}

function formatShortDate(key: string, locale: string): string {
  const d = dateKeyToDate(key);
  if (locale.startsWith("uz")) return `${d.getDate()}-${MONTHS_UZ_SHORT[d.getMonth()]}`;
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d);
  } catch {
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
  }
}

function zoneLabel(now: Date): string {
  let zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    /* eski brauzer */
  }
  const off = -now.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "−";
  const abs = Math.abs(off);
  const utc = `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return zone ? `${zone} (${utc})` : utc;
}

export function QuickCreatePanel({
  classId,
  isDraft,
  hasContent = false,
  compact = false,
  topic,
  fallbackTitle,
  onTopicChange,
  onOpenBuilder,
  onManual,
  onAttachExisting,
  onPickBank,
}: {
  classId: string;
  isDraft: boolean;
  hasContent?: boolean;
  compact?: boolean;
  /** `null` — oʻqituvchi hali tanlamagan: ish rejadagi joriy mavzu turadi. */
  topic: QuickTopic | null;
  /** Ish reja boʻlmasa — topshiriq sarlavhasi mavzu boʻladi. */
  fallbackTitle: string;
  onTopicChange: (topic: QuickTopic) => void;
  onOpenBuilder: (init: BuilderInit) => void;
  onManual: (kind: "test" | "deck") => void;
  onAttachExisting: () => void;
  onPickBank: () => void;
}) {
  const t = useTranslations("QuickCreate");
  const ta = useTranslations("AssignmentsPage");
  const locale = useLocale();
  const router = useRouter();
  const topicId = useId();
  const topicRef = useRef<HTMLInputElement>(null);

  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const hydrated = useLessonStore((s) => s._hasHydrated);
  const addLesson = useLessonStore((s) => s.addLesson);
  const liveClasses = useLiveClasses();
  const cls = liveClasses.find((c) => c.id === classId);

  const now = useNow();
  const today = dateToKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Muharrir faqat mijozda chiziladi (portal) — localStorage darhol oʻqiladi.
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [busy, setBusy] = useState<AiMaterialKind | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [visual, setVisual] = useState<VisualResult | null>(null);
  const [visualBusy, setVisualBusy] = useState(false);

  // Oyna yopilsa ketayotgan soʻrov ham toʻxtaydi.
  useEffect(() => () => abortRef.current?.abort(), []);

  /* Ish reja — bugungi (boʻlmasa keyingi) mavzu va uning dars vaqti. */
  const plan = useMemo(
    () => (hydrated ? workPlanFor(lessons, units, classId, today) : null),
    [hydrated, lessons, units, classId, today],
  );
  const planRow = plan?.rows[plan.current] ?? null;
  const auto: QuickTopic = planRow
    ? { text: planRow.lesson.title, lessonId: planRow.lesson.id }
    : { text: fallbackTitle };
  const current = topic ?? auto;
  const topicText = current.text.trim();

  const session =
    planRow && plan?.anchor === "today"
      ? classSessions(planRow.lesson, classId).find((s) => s.date === today)
      : undefined;

  const lessonLine = (() => {
    if (session) {
      const range = `${hhmm(session.startMin)}–${hhmm(session.endMin)}`;
      if (nowMin < session.startMin) {
        const minutes = session.startMin - nowMin;
        return minutes <= 180 ? t("lessonStartsIn", { range, minutes }) : t("lessonAt", { range });
      }
      if (nowMin < session.endMin) return t("lessonNow", { range, minutes: session.endMin - nowMin });
      return t("lessonDone", { range });
    }
    if (plan?.anchor === "next" && planRow?.date) {
      return t("nextLessonOn", { date: formatShortDate(planRow.date, locale) });
    }
    return null;
  })();

  const source = (() => {
    if (current.lessonId && planRow && current.lessonId === planRow.lesson.id) {
      if (plan?.anchor === "today") return t("topicFromPlanToday");
      if (plan?.anchor === "next") return t("topicFromPlanNext");
    }
    if (current.lessonId) return t("topicFromPlan");
    return topicText ? t("topicCustom") : null;
  })();

  function changeTopic(text: string) {
    // Mavzu ish rejadagi dars nomiga aynan mos kelsa — bogʻlanish saqlanadi.
    const match = plan?.rows.find((r) => r.lesson.title.trim().toLowerCase() === text.trim().toLowerCase());
    onTopicChange(match && text.trim() ? { text, lessonId: match.lesson.id } : { text });
  }

  function savePrefs(next: Prefs) {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* saqlanmasa ham ishlaydi */
    }
  }

  function requireTopic(): boolean {
    if (topicText) return true;
    toast.error(t("topicRequired"));
    topicRef.current?.focus();
    return false;
  }

  /* ── AI ── */
  async function generate(kind: AiMaterialKind) {
    if (busy || !requireTopic()) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(kind);
    // Rejaning «joriy» nuqtasi — tanlangan mavzu (bugungisi boʻlmasligi mumkin).
    const anchored = current.lessonId ? workPlanFor(lessons, units, classId, today, current.lessonId) : null;
    try {
      const res = await fetch("/api/ustozona-ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          kind,
          topic: topicText,
          subject: subjectLabel(cls?.subject) || undefined,
          grade: cls?.grade ?? null,
          className: cls?.name,
          plan: anchored ? workPlanPrompt(anchored) : undefined,
          count: prefs.count,
          level: prefs.level,
          note: note.trim() || undefined,
          locale,
          durationMin: session ? session.endMin - session.startMin : undefined,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        material?: AiMaterial;
        remaining?: number;
        error?: AiMaterialError;
      } | null;
      if (!res.ok || !body?.material) {
        toast.error(t(`errors.${body?.error ?? "failed"}`));
        return;
      }
      await accept(body.material, body.remaining);
    } catch {
      if (!ctrl.signal.aborted) toast.error(t("errors.network"));
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setBusy(null);
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  async function accept(material: AiMaterial, remaining?: number) {
    const hint = typeof remaining === "number" ? { description: t("readyHint", { count: remaining }) } : undefined;
    switch (material.kind) {
      case "test":
        onOpenBuilder({ questions: material.data.questions.map(mcqDraft), title: material.data.title, firstShape: "mcq" });
        toast.success(t("ready"), hint);
        return;
      case "lesson":
      case "slides":
        onOpenBuilder({ questions: deckDrafts(material.data.items), title: material.data.title, firstShape: "slide" });
        toast.success(t("ready"), hint);
        return;
      case "mindmap":
      case "infographic": {
        try {
          const svg = material.kind === "mindmap" ? mindMapSvg(material.data) : infographicSvg(material.data);
          setVisual({ kind: material.kind, title: material.data.title, png: await svgToPng(svg) });
        } catch {
          toast.error(t("visual.renderFailed"));
        }
      }
    }
  }

  async function visualToDeck() {
    if (!visual) return;
    setVisualBusy(true);
    try {
      const { url } = await uploadEditorImageAction(visual.png);
      onOpenBuilder({ questions: [imageSlideDraft(visual.title, url)], title: visual.title, firstShape: "slide" });
      setVisual(null);
    } catch {
      toast.error(t("visual.uploadFailed"));
    } finally {
      setVisualBusy(false);
    }
  }

  /* ── 45 daqiqalik reja — Darslar sahifasidagi Reja ustasi ──
     Muharrir (topshiriq qoralamasi) global sessiyada turadi: «← Orqaga»
     bosilganda oʻqituvchi aynan shu oynaga qaytadi. */
  async function openLessonPlan() {
    if (!requireTopic()) return;
    let id = current.lessonId;
    if (!id) {
      // Ish rejada yoʻq mavzu — «Boʻlimsiz» ga yangi dars: boʻlimlar tartibi buzilmaydi.
      id = addLesson({ classId, unitId: null, title: topicText });
      // Sahifa almashganda sync qayta quriladi — yangi dars undan oldin serverga yetsin.
      await flushLessonsNow().catch(() => {});
    }
    router.push(`/lessons/${encodeURIComponent(id)}?panel=plan`);
  }

  /* ── Shablonlar ── */
  function applyTemplate(id: TemplateId) {
    const name = t(`templates.${id}`);
    const questions = templateDrafts(id, {
      warmupCloud: topicText ? t("tpl.warmupCloud", { topic: topicText }) : t("tpl.warmupCloudNoTopic"),
      warmupPoll: t("tpl.warmupPoll"),
      warmupPollOptions: [t("tpl.warmupOpt1"), t("tpl.warmupOpt2"), t("tpl.warmupOpt3")],
      checkPoll: t("tpl.checkPoll"),
      checkPollOptions: [t("tpl.checkOpt1"), t("tpl.checkOpt2"), t("tpl.checkOpt3")],
      exitCloud: t("tpl.exitCloud"),
      exitOpen: t("tpl.exitOpen"),
    });
    onOpenBuilder({
      questions,
      title: (topicText ? `${topicText} — ${name}` : name).slice(0, 200),
      firstShape: "mcq",
    });
  }

  const hints: Record<AiMaterialKind, string> = {
    test: t("kinds.test.hint", { count: prefs.count }),
    lesson: t("kinds.lesson.hint"),
    slides: t("kinds.slides.hint"),
    mindmap: t("kinds.mindmap.hint"),
    infographic: t("kinds.infographic.hint"),
  };

  return (
    <Panel className="h-auto">
      {/* Sarlavha — chapda nima, oʻngda qachon. Telefonda soat pastga oʻraladi. */}
      {!compact && <PanelHeader
        className="flex flex-wrap"
        icon={<Sparkles />}
        title={t("title")}
        description={t(hasContent ? "continueSubtitle" : "subtitle")}
        actions={
          <div className="min-w-0 text-left sm:text-right" title={t("timezone", { zone: zoneLabel(now) })}>
            <p className="text-sm font-medium tabular-nums text-foreground">
              {formatDay(now, locale)} · {hhmm(nowMin)}
            </p>
            {(cls || lessonLine) && (
              <p className="text-caption text-muted-foreground">
                {[cls?.name, lessonLine].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        }
      />}

      <PanelBody inset className="flex flex-col gap-5">
        {/* MAVZU */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={topicId} className="text-label text-muted-foreground">
            {t("topicLabel")}
          </label>
          <Input
            id={topicId}
            ref={topicRef}
            value={current.text}
            onChange={(e) => changeTopic(e.target.value)}
            placeholder={t("topicPlaceholder")}
            maxLength={200}
            className="h-auto rounded-xl bg-muted/40 px-4 py-2 text-sm font-medium shadow-none"
          />
          {source && <p className="text-caption text-muted-foreground">{source}</p>}
        </div>

        {/* AI BILAN */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-label text-muted-foreground">{t("aiLabel")}</span>
            {busy && (
              <span className="flex items-center gap-1.5 text-caption text-muted-foreground" role="status">
                <Loader2 className="size-3.5 animate-spin" />
                {t("generatingHint")}
                <button
                  type="button"
                  onClick={cancel}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {t("cancel")}
                </button>
              </span>
            )}
          </div>
          <div className={cn("grid gap-3", compact ? "grid-cols-1" : "[grid-template-columns:repeat(auto-fit,minmax(148px,1fr))]")}>
            {AI_CARDS.map(({ kind, icon, color }) => (
              <ActionCard
                key={kind}
                icon={icon}
                color={color}
                title={t(`kinds.${kind}.title`)}
                hint={busy === kind ? t("generating") : hints[kind]}
                loading={busy === kind}
                disabled={!!busy}
                onClick={() => void generate(kind)}
              />
            ))}
            <ActionCard
              icon={NotebookPen}
              color="blue"
              title={t("kinds.plan.title")}
              hint={current.lessonId || !topicText ? t("kinds.plan.hint") : t("kinds.plan.hintNew")}
              external
              disabled={!!busy}
              onClick={() => void openLessonPlan()}
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted-foreground">{t("countLabel")}</span>
              <SegmentedToggle
                variant="pill"
                aria-label={t("countLabel")}
                value={String(prefs.count)}
                onValueChange={(v) => savePrefs({ ...prefs, count: Number(v) })}
                options={AI_TEST_COUNTS.map((c) => ({ value: String(c), label: String(c) }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted-foreground">{t("levelLabel")}</span>
              <SegmentedToggle
                variant="pill"
                aria-label={t("levelLabel")}
                value={prefs.level}
                onValueChange={(v) => savePrefs({ ...prefs, level: v })}
                options={AI_LEVELS.map((l) => ({ value: l, label: t(`levels.${l}`) }))}
              />
            </div>
            {!noteOpen && (
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                className="inline-flex items-center gap-1 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Plus className="size-3.5" />
                {t("noteAdd")}
              </button>
            )}
          </div>
          {noteOpen && (
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={500}
              className="min-h-16 rounded-xl bg-muted/40 px-4 py-2 text-sm shadow-none"
            />
          )}
        </div>

        {/* SHABLONLAR — darhol, AI kerak emas */}
        <div className="flex flex-col gap-2">
          <span className="text-label text-muted-foreground">{t("templatesLabel")}</span>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map(({ id, icon: Icon }) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                className="gap-1.5 shadow-none"
                disabled={!!busy}
                onClick={() => applyTemplate(id)}
              >
                <Icon className="size-3.5" />
                {t(`templates.${id}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* QOʻLDA */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-label text-muted-foreground">{t("manualLabel")}</span>
            {!hasContent && (
              <button
                type="button"
                onClick={onAttachExisting}
                className="inline-flex items-center gap-1 text-caption font-medium text-foreground underline-offset-4 hover:underline"
              >
                <Library className="size-3.5" />
                {t("attachExisting")}
              </button>
            )}
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={onPickBank}>
            <Library className="size-4" /> {ta("attachFromBank")}
          </Button>
          <MaterialKindPicker
            onPick={(kind) => {
              if (kind === "test") onManual("test");
              else if (kind === "deck") onManual("deck");
            }}
          />
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-2">
          <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-caption text-muted-foreground">{t("noMonitor")}</p>
        </div>
        {isDraft && <p className="-mt-2 text-caption text-muted-foreground">{t("manualGrading")}</p>}
      </PanelBody>

      <VisualPreview
        visual={visual}
        busy={visualBusy}
        onClose={() => setVisual(null)}
        onToDeck={() => void visualToDeck()}
        onRegenerate={() => {
          const kind = visual?.kind;
          setVisual(null);
          if (kind) void generate(kind);
        }}
      />
    </Panel>
  );
}

/** AI / reja kartasi — `MaterialKindPicker` retsepti: oq karta, rangli
    plitka va uning ortida yumshoq dogʻ (rang = tur, sinf rangi emas). */
function ActionCard({
  icon: Icon,
  color,
  title,
  hint,
  onClick,
  disabled,
  loading,
  external,
}: {
  icon: LucideIcon;
  color: ClassColor;
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  external?: boolean;
}) {
  const tints = classTints(color);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative overflow-hidden rounded-card border border-border bg-card p-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-not-allowed",
        disabled && !loading && "opacity-60",
        loading && "border-foreground/30",
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-7 -top-7 size-28 rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: tints.solid }}
      />
      <span className="relative flex flex-col gap-0.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={tints.gradientTile}>
          {loading ? (
            <Loader2 className="size-[18px] animate-spin text-white" />
          ) : (
            <Icon className="size-[18px] text-white" />
          )}
        </span>
        <span className="mt-3 flex items-center gap-1 text-sm font-medium text-foreground">
          {title}
          {external && <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
