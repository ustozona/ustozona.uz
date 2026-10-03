"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAnimate, useReducedMotion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, CircleHelp, Maximize, Minimize, Play, Settings2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { useLessonStore } from "@/store/useLessonStore";
import { useStandardsStore } from "@/store/useStandardsStore";
import { useLiveClasses, useLiveClassData } from "@/hooks/useLiveClasses";
import { useClassEnv } from "@/hooks/useClassEnv";
import { flushLessonsNow } from "@/components/sync/LessonsServerSync";
import { classSessions, flowSequence } from "@/lib/lesson-flow";
import { isTaught, type Lesson } from "@/lib/lessons-data";
import { selectModel } from "@/lib/lesson-models";
import { subjectLabel } from "@/lib/standards-data";
import { classStandardIndex } from "@/lib/class-standards";
import { workPlanFor, workPlanPrompt } from "@/lib/work-plan";
import { dateKeyToDate, todayKey } from "@/lib/date-keys";
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import {
  normalizeStudio, patchBlock, studioBlocks, studioReadiness, templateStudio, blockReady,
  type LessonStudio as Studio, type StudioBlock,
} from "@/lib/lesson-studio";
import { envHint } from "@/lib/studio-advice";
import { buildLessonHandoff, writeLessonHandoff } from "@/lib/doska/lesson-handoff";
import type { AiMaterial, AiMaterialError, AiMaterialKind } from "@/lib/ai-materials";
import type { LaunchPreset } from "@/components/launch/LaunchDialog";
import { launchSetInfoAction } from "@/server/actions/assess-runs";
import type { LaunchSetInfo } from "@/lib/launch-types";
import SetBuilderOverlay from "../test/SetBuilderOverlay";
import AttachTestDialog from "../AttachTestDialog";
import type { DraftQuestion } from "../test/builder/types";
import { deckDrafts, mcqDraft, templateDrafts } from "../quick-create/materials-to-draft";
import { StudioPlanColumn, type PlanRequest } from "./StudioPlanColumn";
import { StudioFlowColumn } from "./StudioFlowColumn";
import { StudioAdviceColumn } from "./StudioAdviceColumn";
import { ClassEnvDialog } from "./ClassEnvDialog";
import { LessonConductor } from "./LessonConductor";
import { classInsightAction } from "@/server/actions/result-share";
import type { ClassInsight } from "@/lib/class-insight";
import { FlyDot, GuideBubble, Spotlight, useStudioGuide, type FlyPath, type GuideStep } from "./StudioGuide";
import { useStudioFocus } from "./useStudioFocus";

/* ════════════════════════════════════════════════════════════════════
   DARS STUDIYASI — Topshiriqlar sahifasining asosiy koʻrinishi.

   docs/dars-studiyasi-spec.md. Oʻqituvchining savoli: «shu sinfda
   keyingi darsda nima qilaman?». Shuning uchun sahifa DARS atrofida:

     1. Dars rejasi (chap)  — model, bosqichlar, daqiqalar, maqsad.
        AI sinf pasporti, standartlar va ish reja bilan taklif qiladi,
        oʻqituvchi qabul qiladi yoki oʻzgartiradi.
     2. Dars ssenariysi (oʻrta) — reja asosida bloklar: slayd, savol,
        oʻyin, guruh ishi, chiqish chiptasi, uy vazifasi. Har blok —
        «tayyor» yoki bir bosishda tayyorlanadi.
     3. Tavsiyalar (oʻng) — tanlangan blok uchun: qaysi usul bu sinfda
        ishlaydi va NEGA, qaysi oʻyin mos, tashqi manbalar.

   Yuqoridagi qator — BITTA panel: sinflar, dars tanlagich, amallar va
   koʻrinish (avval ikki alohida panel edi). «Fokus rejimi» va
   qadam-baqadam yoʻl-koʻrsatkich — `useStudioFocus`, `StudioGuide`.
   Ustunlar matni kattaroq (`.studio-scale`, DESIGN.md §3).

   «▶ Darsni boshlash» — dars pulti: bloklar ketma-ket, har biri
   mavjud yoʻl bilan ochiladi (Doska taqdimoti, jonli dars, QR-kartalar,
   oʻyin). Doskaning toʻliq «Dars rejimi» — keyingi bosqich (spec §8).

   Saqlanishi — dars hujjatida (`Lesson.studioByClass`), Darslar
   sahifasidagi oʻsha darsning oʻzi: ikkinchi nusxa yoʻq.
   ════════════════════════════════════════════════════════════════════ */

type BuilderState = {
  blockId: string;
  setId?: string;
  title?: string;
  questions?: DraftQuestion[];
  firstShape?: "mcq" | "slide";
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Ustun oʻrami: yoritish halqasi va ochilish animatsiyasi shu yerda. */
const COLUMN = "relative flex min-h-0 flex-col lg:h-full";

export function LessonStudio({
  classId,
  onLaunch,
  onOpenBank,
  onSetsChanged,
  classChips,
  viewToggle,
}: {
  classId: string;
  /** Sinf chiplari va koʻrinish tanlagichi — studiya qatoriga qoʻshiladi. */
  classChips?: ReactNode;
  viewToggle?: ReactNode;
  /** Sahifaning oʻtkazish oqimi («Darsda oʻtkazish» oynasi). */
  onLaunch: (preset: LaunchPreset) => void;
  onOpenBank: () => void;
  /** Yangi toʻplam saqlandi — «Barcha ishlar» roʻyxati yangilansin. */
  onSetsChanged: () => void;
}) {
  const t = useTranslations("LessonStudio");
  const tq = useTranslations("QuickCreate");
  const locale = useLocale();

  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const hydrated = useLessonStore((s) => s._hasHydrated);
  const updateLesson = useLessonStore((s) => s.updateLesson);
  const addLesson = useLessonStore((s) => s.addLesson);
  const standardSets = useStandardsStore((s) => s.sets);
  const cls = useLiveClasses().find((c) => c.id === classId);
  const classData = useLiveClassData(classId);
  const { env, isDefault: envDefault, save: saveEnv } = useClassEnv(classId);
  const hint = envHint(env);

  const today = todayKey();
  const sequence = useMemo(
    () => (hydrated ? flowSequence(lessons, units, classId) : []),
    [hydrated, lessons, units, classId],
  );
  const plan = useMemo(
    () => (hydrated ? workPlanFor(lessons, units, classId, today) : null),
    [hydrated, lessons, units, classId, today],
  );

  /* Tanlangan dars — standart: ish rejadagi bugungi/keyingi mavzu. */
  const [lessonId, setLessonId] = useState<string | null>(null);
  useEffect(() => setLessonId(null), [classId]);
  const lesson: Lesson | undefined =
    sequence.find((l) => l.id === lessonId) ?? plan?.rows[plan.current]?.lesson ?? sequence[0];
  const index = lesson ? sequence.findIndex((l) => l.id === lesson.id) : -1;

  const studio = useMemo(
    () => (lesson ? normalizeStudio(lesson.studioByClass?.[classId]) : null),
    [lesson, classId],
  );

  const saveStudio = useCallback(
    (next: Studio | null) => {
      if (!lesson) return;
      const map = { ...(lesson.studioByClass ?? {}) };
      if (next) map[classId] = next;
      else delete map[classId];
      updateLesson(lesson.id, { studioByClass: map });
    },
    [lesson, classId, updateLesson],
  );

  /* Dars vaqti va davomiyligi — sinfning shu darsdagi sessiyasidan. */
  const session = useMemo(() => {
    if (!lesson) return undefined;
    const list = classSessions(lesson, classId);
    return list.find((s) => s.date >= today) ?? list[list.length - 1];
  }, [lesson, classId, today]);
  const defaultDuration = session ? Math.max(10, Math.min(180, session.endMin - session.startMin)) : 45;

  const subject = subjectLabel(cls?.subject);
  const recommended = useMemo(
    () => selectModel({ subject: `${cls?.subject ?? ""} ${subject}`, topic: lesson?.title ?? "", grade: cls?.grade ?? null }),
    [cls?.subject, cls?.grade, subject, lesson?.title],
  );

  /* Darsga bogʻlangan standartlar — kod + tavsif (AI soʻrovi uchun). */
  const lessonStandards = useMemo(() => {
    const codes = lesson?.standards ?? [];
    if (!codes.length) return [];
    const index = classStandardIndex(standardSets, [classId]);
    return codes.map((code) => ({ code, desc: index.standards.find((s) => s.std.id === code)?.std.desc ?? "" }));
  }, [lesson?.standards, standardSets, classId]);

  const previousReflection = index > 0 ? sequence[index - 1].reflection : undefined;

  /* Sinfning oxirgi test natijasi — keyingi dars rejasi shunga moslanadi
     (docs/natija-keyingi-dars.md). Sinf almashsa qayta soʻraladi. */
  const [insight, setInsight] = useState<{ classId: string; data: ClassInsight | null } | null>(null);
  useEffect(() => {
    let alive = true;
    classInsightAction({ classId })
      .then((data) => alive && setInsight({ classId, data }))
      .catch(() => alive && setInsight({ classId, data: null }));
    return () => {
      alive = false;
    };
  }, [classId]);
  const classInsight = insight?.classId === classId ? insight.data : null;
  const studentCount = classData?.students.length ?? 0;

  /* ── Tanlangan blok ── */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blocks = useMemo(() => (studio ? studioBlocks(studio) : []), [studio]);
  const selected =
    blocks.find((b) => b.id === selectedId) ?? blocks.find((b) => !blockReady(b)) ?? blocks[0] ?? null;

  /* Tanlangan blok testi haqida maʼlumot — usul va oʻyin mosligi uchun. */
  const [setInfo, setSetInfo] = useState<LaunchSetInfo | null>(null);
  useEffect(() => {
    const setId = selected?.setId;
    if (!setId) {
      setSetInfo(null);
      return;
    }
    let alive = true;
    launchSetInfoAction(setId)
      .then((res) => alive && setSetInfo(res.ok ? res.data : null))
      .catch(() => alive && setSetInfo(null));
    return () => {
      alive = false;
    };
  }, [selected?.setId]);

  /* ── AI: reja + ssenariy ── */
  const [planBusy, setPlanBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function buildPlan(req: PlanRequest) {
    if (!lesson) return;
    if (!req.ai) {
      saveStudio(templateStudio({ modelKey: req.modelKey, duration: req.duration, env: hint, objective: req.objective }));
      toast.success(t("toast.template"));
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPlanBusy(true);
    const anchored = workPlanFor(lessons, units, classId, today, lesson.id);
    try {
      const res = await fetch("/api/ustozona-ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          kind: "studio",
          topic: lesson.title || t("untitledLesson"),
          subject: subject || undefined,
          grade: cls?.grade ?? null,
          className: cls?.name,
          plan: anchored ? workPlanPrompt(anchored) : undefined,
          modelKey: req.modelKey,
          duration: req.duration,
          objective: req.objective || undefined,
          env: { ...env, studentCount: env.studentCount ?? (studentCount || null) },
          standards: lessonStandards,
          reflection: previousReflection,
          // Ismsiz: sanoq va qiyin savollar (`lib/class-insight.ts`).
          insight:
            req.useInsight && classInsight
              ? {
                  title: classInsight.title,
                  classAccuracy: classInsight.classAccuracy,
                  students: classInsight.students,
                  needHelp: classInsight.needHelp,
                  hardest: classInsight.hardest.map((h) => ({ stem: h.stem, accuracy: h.accuracy })),
                }
              : undefined,
          note: req.note || undefined,
          locale,
        }),
      });
      const body = (await res.json().catch(() => null)) as {
        studio?: unknown;
        remaining?: number;
        error?: AiMaterialError;
      } | null;
      const next = normalizeStudio(body?.studio);
      if (!res.ok || !next) {
        toast.error(tq(`errors.${body?.error ?? "failed"}`));
        return;
      }
      saveStudio(next);
      setSelectedId(null);
      toast.success(t("toast.aiReady"), {
        description: typeof body?.remaining === "number" ? tq("readyHint", { count: body.remaining }) : undefined,
      });
    } catch {
      if (!ctrl.signal.aborted) toast.error(tq("errors.network"));
    } finally {
      if (abortRef.current === ctrl) abortRef.current = null;
      setPlanBusy(false);
    }
  }

  /* ── Material tayyorlash (blok → toʻplam) ── */
  const [builder, setBuilder] = useState<BuilderState | null>(null);
  const [attachFor, setAttachFor] = useState<string | null>(null);
  const [materialBusy, setMaterialBusy] = useState<string | null>(null);

  function update(blockId: string, patch: Partial<StudioBlock>) {
    if (studio) saveStudio(patchBlock(studio, blockId, patch));
  }

  function topicFor(block: StudioBlock): string {
    const base = lesson?.title || t("untitledLesson");
    return block.title ? `${base}: ${block.title}` : base;
  }

  async function generateMaterial(block: StudioBlock) {
    if (materialBusy) return;
    const kind: AiMaterialKind = block.kind === "explain" ? "slides" : "test";
    const count = block.kind === "check" ? 5 : 10;
    setMaterialBusy(block.id);
    try {
      const res = await fetch("/api/ustozona-ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          topic: topicFor(block).slice(0, 200),
          subject: subject || undefined,
          grade: cls?.grade ?? null,
          className: cls?.name,
          count,
          level: env.level === "strong" ? "hard" : env.level === "weak" ? "easy" : "mixed",
          note: block.brief,
          locale,
          durationMin: defaultDuration,
        }),
      });
      const body = (await res.json().catch(() => null)) as { material?: AiMaterial; error?: AiMaterialError } | null;
      const material = body?.material;
      if (!res.ok || !material) {
        toast.error(tq(`errors.${body?.error ?? "failed"}`));
        return;
      }
      if (material.kind === "test") {
        setBuilder({ blockId: block.id, title: material.data.title, questions: material.data.questions.map(mcqDraft), firstShape: "mcq" });
      } else if (material.kind === "slides" || material.kind === "lesson") {
        setBuilder({ blockId: block.id, title: material.data.title, questions: deckDrafts(material.data.items), firstShape: "slide" });
      }
      toast.success(tq("ready"));
    } catch {
      toast.error(tq("errors.network"));
    } finally {
      setMaterialBusy(null);
    }
  }

  function applyTemplate(block: StudioBlock) {
    const topic = lesson?.title ?? "";
    const id = block.kind === "exit" ? "exit" : block.kind === "warmup" ? "warmup" : "check";
    const questions = templateDrafts(id, {
      warmupCloud: topic ? tq("tpl.warmupCloud", { topic }) : tq("tpl.warmupCloudNoTopic"),
      warmupPoll: tq("tpl.warmupPoll"),
      warmupPollOptions: [tq("tpl.warmupOpt1"), tq("tpl.warmupOpt2"), tq("tpl.warmupOpt3")],
      checkPoll: tq("tpl.checkPoll"),
      checkPollOptions: [tq("tpl.checkOpt1"), tq("tpl.checkOpt2"), tq("tpl.checkOpt3")],
      exitCloud: tq("tpl.exitCloud"),
      exitOpen: tq("tpl.exitOpen"),
    });
    const name = t(`kind.${block.kind}`);
    setBuilder({
      blockId: block.id,
      title: (topic ? `${topic} — ${name}` : name).slice(0, 200),
      questions,
      firstShape: "mcq",
    });
  }

  /** Oʻyin bloki uchun — shu darsdagi tekshiruv testini qayta ishlatish. */
  const checkSet = useMemo(() => {
    const b = blocks.find((x) => x.kind === "check" && x.setId);
    return b?.setId ? { id: b.setId, title: b.setTitle ?? "" } : null;
  }, [blocks]);

  /* ── Blokni ishga tushirish ── */
  const openUrl = useCallback((url: string) => {
    // ⚠️ `window.open(…, "noopener")` spetsifikatsiya boʻyicha DOIM `null`
    // qaytaradi — «bloklandi» deb oʻylab joriy sahifa ham koʻchib ketardi.
    // Shuning uchun oddiy ochamiz va bogʻlanishni oʻzimiz uzamiz.
    const opened = window.open(url, "_blank");
    if (opened) opened.opener = null;
    else window.location.assign(url);
  }, []);

  const openDoska = useCallback(
    (setId: string, live: boolean) => {
      const q = new URLSearchParams({ setId, classId });
      if (live) q.set("live", "1");
      openUrl(`/doska?${q.toString()}`);
    },
    [classId, openUrl],
  );

  const runBlock = useCallback(
    (block: StudioBlock) => {
      const title = block.setTitle || block.title || lesson?.title || "";
      switch (block.kind) {
        case "activity":
          openUrl("/doska");
          return;
        case "game": {
          const g = block.game;
          if (!g) return toast.info(t("toast.pickGame"));
          if (g.type === "practice") return openUrl(`/dashboard/games/${g.file}`);
          if (g.type === "link") return openUrl(g.url);
          if (!block.setId) return toast.info(t("toast.gameNeedsTest"));
          return onLaunch({ setId: block.setId, title, intent: "class", mode: "game", shellId: g.id });
        }
        case "homework":
          if (!block.setId) return toast.info(t("toast.prepareFirst"));
          return onLaunch({ setId: block.setId, title, intent: "home" });
        case "check": {
          if (!block.setId) {
            if (block.method === "oral") return toast.info(t("toast.oralHint"));
            return toast.info(t("toast.prepareFirst"));
          }
          const m = block.method ?? "live";
          if (m === "live" && hint.phones && hint.screen) return openDoska(block.setId, true);
          if (m === "oral") return openDoska(block.setId, false);
          const mode =
            m === "cards" || m === "paper" || m === "pult" || m === "selfpaced" || m === "quick" ? m : undefined;
          return onLaunch({ setId: block.setId, title, intent: "class", mode });
        }
        default:
          if (!block.setId) return toast.info(t("toast.prepareFirst"));
          // Soʻz buluti va soʻrovnoma — telefon boʻlsa jonli, aks holda ekranda koʻrsatiladi.
          return openDoska(block.setId, block.kind !== "explain" && hint.phones && hint.screen);
      }
    },
    [lesson?.title, onLaunch, openDoska, openUrl, hint.phones, hint.screen, t],
  );

  /* ── «▶ Darsni boshlash» — Doska dars rejimi (docs/ustoz-pulti-spec.md §3) ──
     Ssenariy Doskaga beriladi: har blok — bitta ekran; Doska pult oynasini
     oʻzi ochadi, oʻqituvchi telefonini QR bilan ulaydi. */
  const startOnDoska = useCallback(() => {
    if (!studio || !lesson) return;
    const handoff = buildLessonHandoff(studio, {
      title: lesson.title || t("untitledLesson"),
      classId,
      className: cls?.name ?? "",
      env: hint,
      origin: window.location.origin,
      texts: {
        kind: (k) => t(`kind.${k}`),
        gameName: (b) =>
          b.game?.type === "shell" ? t(`game.${b.game.id}`) : b.game?.type === "practice" ? t(`game.${b.game.file}`) : b.game?.label ?? "",
        shellHint: t("doska.shellHint"),
        homeworkHint: t("doska.homeworkHint"),
      },
    });
    if (!writeLessonHandoff(handoff)) {
      toast.error(t("toast.doskaFailed"));
      return;
    }
    openUrl(`/doska?lesson=1`);
  }, [studio, lesson, classId, cls?.name, hint, openUrl, t]);

  /* ── Oynalar ── */
  const [envOpen, setEnvOpen] = useState(false);
  const [conductorOpen, setConductorOpen] = useState(false);

  /* ── Yoʻl-koʻrsatkich, fokus rejimi va ustunlar animatsiyasi ──
     docs/dars-studiyasi-spec.md §9.1. Har qadam oʻz vaqtida, bir marta. */
  const guide = useStudioGuide();
  const { offer: offerGuide, replay: replayGuide } = guide;
  const { focus, toggleFocus } = useStudioFocus();
  const reduce = useReducedMotion();
  const [flowScope, animateFlow] = useAnimate<HTMLDivElement>();
  const [adviceScope, animateAdvice] = useAnimate<HTMLDivElement>();
  const [spot, setSpot] = useState<Record<"plan" | "flow" | "advice", number>>({ plan: 0, flow: 0, advice: 0 });
  const [fly, setFly] = useState<FlyPath | null>(null);
  const pulse = useCallback((step: GuideStep) => {
    if (step !== "start") setSpot((s) => ({ ...s, [step]: s[step] + 1 }));
  }, []);

  const hasStudio = Boolean(studio);
  const readiness = useMemo(() => (studio ? studioReadiness(studio) : null), [studio]);
  const allReady = Boolean(readiness && readiness.total > 0 && readiness.ready === readiness.total);

  // 1 · reja hali yoʻq — qayerdan boshlashni aytish.
  useEffect(() => {
    if (hydrated && lesson && !hasStudio) offerGuide("plan");
  }, [hydrated, lesson, hasStudio, offerGuide]);

  // 2 · reja ENDI tuzildi (shu darsda yoʻq edi) — ssenariy va tavsiyalar
  // ustunlari «ochiladi»: koʻtarilib kattalashadi, ssenariy yonib turadi.
  const lastStudio = useRef<{ lessonId: string | null; has: boolean }>({ lessonId: null, has: false });
  useEffect(() => {
    const id = lesson?.id ?? null;
    const prev = lastStudio.current;
    lastStudio.current = { lessonId: id, has: hasStudio };
    if (!hasStudio || prev.has || prev.lessonId !== id) return;
    if (!reduce) {
      const from = { opacity: [0.25, 1], y: [28, 0], scale: [0.96, 1] };
      if (flowScope.current) void animateFlow(flowScope.current, from, { duration: 0.6, ease: [0.2, 0, 0, 1] });
      if (adviceScope.current) void animateAdvice(adviceScope.current, from, { duration: 0.6, delay: 0.15, ease: [0.2, 0, 0, 1] });
    }
    setSpot((s) => ({ ...s, flow: s.flow + 1 }));
    const timer = window.setTimeout(() => offerGuide("flow"), 700);
    return () => window.clearTimeout(timer);
  }, [hasStudio, lesson?.id, reduce, animateFlow, animateAdvice, flowScope, adviceScope, offerGuide]);

  // 4 · hamma blok tayyor — boshlash tugmasini koʻrsatish.
  useEffect(() => {
    if (allReady) offerGuide("start");
  }, [allReady, offerGuide]);

  // 3 · tayyor boʻlmagan blok tanlandi — nuqta tavsiyalar ustuniga «uchadi»
  // va ustun bir marta yonadi: «endi shu yerda sozlanadi».
  const selectBlock = useCallback(
    (id: string) => {
      setSelectedId(id);
      const block = blocks.find((b) => b.id === id);
      if (!block || blockReady(block)) return;
      const src = document.querySelector(`[data-block-id="${CSS.escape(id)}"]`);
      const dst = document.querySelector('[data-guide="advice"]');
      if (src && dst && !reduce && window.matchMedia("(min-width: 1024px)").matches) {
        const a = src.getBoundingClientRect();
        const b = dst.getBoundingClientRect();
        setFly({ key: Date.now(), from: { x: a.right - 28, y: a.top + a.height / 2 }, to: { x: b.left + 32, y: b.top + 30 } });
        return;
      }
      pulse("advice");
      offerGuide("advice");
    },
    [blocks, reduce, pulse, offerGuide],
  );
  const onFlyDone = useCallback(() => {
    setFly(null);
    pulse("advice");
    offerGuide("advice");
  }, [pulse, offerGuide]);

  /** «?» — hozirgi holatga mos qadamni qayta koʻrsatish. */
  const showGuide = useCallback(
    (step?: GuideStep) => {
      const next =
        step ?? (!studio ? "plan" : allReady ? "start" : selected && !blockReady(selected) ? "advice" : "flow");
      replayGuide(next);
      pulse(next);
    },
    [studio, allReady, selected, replayGuide, pulse],
  );

  /* ── Boʻsh holatlar ── */
  const [newTopic, setNewTopic] = useState("");
  async function startWithTopic() {
    const title = newTopic.trim();
    if (!title) return;
    const id = addLesson({ classId, unitId: null, title });
    setLessonId(id);
    setNewTopic("");
    await flushLessonsNow().catch(() => {});
  }

  /* ── Yuqori qator — BITTA panel ──
     < 2xl: 1-qator sinflar + koʻrinish, 2-qator dars + amallar;
     2xl+: hammasi bir qatorda. Tartib `order-*` bilan — element bir marta. */
  const bar = (lessonControls: ReactNode, actions: ReactNode) => (
    <Panel className="flex h-auto flex-row flex-wrap items-center gap-2 p-2">
      {classChips && <div className="order-1 flex min-w-0 flex-1 items-center">{classChips}</div>}
      {viewToggle && <div className="order-2 2xl:order-4">{viewToggle}</div>}
      <span aria-hidden className="order-3 h-0 basis-full 2xl:hidden" />
      {lessonControls}
      {actions}
      <div className="order-6 flex items-center gap-1 2xl:order-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("guide.help")} onClick={() => showGuide()}>
              <CircleHelp />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("guide.help")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={focus ? "secondary" : "ghost"}
              size="icon"
              aria-pressed={focus}
              aria-label={focus ? t("focus.off") : t("focus.on")}
              onClick={toggleFocus}
            >
              {focus ? <Minimize /> : <Maximize />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{focus ? t("focus.off") : t("focus.onHint")}</TooltipContent>
        </Tooltip>
      </div>
    </Panel>
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {bar(null, null)}
        <Panel className="min-h-[50svh] flex-1 animate-pulse" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {bar(null, null)}
        <Panel className="flex-1">
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
              <EmptyTitle>{t("noLessonsTitle")}</EmptyTitle>
              <EmptyDescription>{t("noLessonsDescription")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <form
                className="flex w-full max-w-md gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void startWithTopic();
                }}
              >
                <Input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder={t("topicPlaceholder")} maxLength={200} />
                <Button type="submit" disabled={!newTopic.trim()}>{t("startWithTopic")}</Button>
              </form>
              <Button asChild variant="link" className="text-muted-foreground">
                <a href="/dashboard/lessons">{t("importPlan")}</a>
              </Button>
            </EmptyContent>
          </Empty>
        </Panel>
      </div>
    );
  }

  const dateLabel = session
    ? (() => {
        const d = dateKeyToDate(session.date);
        const day = session.date === today ? t("today") : `${d.getDate()}-${MONTHS_UZ_SHORT[d.getMonth()]}`;
        return `${day} · ${pad(Math.floor(session.startMin / 60))}:${pad(session.startMin % 60)}`;
      })()
    : t("noDate");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {bar(
        /* Dars tanlagich — ish rejadagi mavzular, oldingi/keyingi. */
        <div className="order-4 flex min-w-0 flex-1 items-center gap-1 2xl:order-2 2xl:flex-none">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("prevLesson")}
            disabled={index <= 0}
            onClick={() => index > 0 && setLessonId(sequence[index - 1].id)}
          >
            <ChevronLeft />
          </Button>
          <Select value={lesson.id} onValueChange={(v) => { setLessonId(v); setSelectedId(null); }}>
            <SelectTrigger className="h-9 min-w-0 flex-1 sm:max-w-md 2xl:w-80 2xl:flex-none" aria-label={t("pickLesson")}>
              <BookOpen className="size-4 shrink-0 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sequence.map((l, i) => (
                <SelectItem key={l.id} value={l.id}>
                  {`${pad(i + 1)}. ${l.title || t("untitledLesson")}`}
                  {isTaught(l, classId) ? ` · ${t("taught")}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("nextLesson")}
            disabled={index < 0 || index >= sequence.length - 1}
            onClick={() => index < sequence.length - 1 && setLessonId(sequence[index + 1].id)}
          >
            <ChevronRight />
          </Button>
          <span className="hidden truncate text-caption text-muted-foreground lg:inline 2xl:hidden">
            {[dateLabel, subject].filter(Boolean).join(" · ")}
          </span>
        </div>,
        <div className="order-5 flex shrink-0 items-center gap-2 2xl:order-3">
          {readiness && (
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
              {t("readiness", { ready: readiness.ready, total: readiness.total })}
            </span>
          )}
          <Button variant="outline" onClick={() => setEnvOpen(true)} className="gap-1.5 shadow-none">
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">{t("envButton")}</span>
          </Button>
          <Button data-guide="start" onClick={startOnDoska} disabled={!studio} className="gap-1.5">
            <Play className="size-4" />
            {t("startLesson")}
          </Button>
        </div>,
      )}

      <div className="studio-scale grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        <div data-guide="plan" className={COLUMN}>
          <Spotlight pulse={spot.plan} />
        <StudioPlanColumn
          lesson={lesson}
          studio={studio}
          env={env}
          envDefault={envDefault}
          recommended={recommended}
          defaultDuration={defaultDuration}
          standards={lessonStandards}
          previousReflection={previousReflection}
          insight={classInsight}
          busy={planBusy}
          onBuild={(req) => void buildPlan(req)}
          onCancel={() => abortRef.current?.abort()}
          onChange={saveStudio}
          onOpenEnv={() => setEnvOpen(true)}
          copyFrom={Object.keys(lesson.studioByClass ?? {}).filter((c) => c !== classId)}
          onCopyFrom={(fromClassId) => {
            const src = normalizeStudio(lesson.studioByClass?.[fromClassId]);
            if (!src) return;
            // Material havolalari saqlanadi, usul esa SHU sinf sharoitiga qayta tanlanadi.
            saveStudio({ ...src, accepted: false, updatedAt: new Date().toISOString() });
            toast.success(t("toast.copied"));
          }}
        />
        </div>
        <div ref={flowScope} data-guide="flow" className={COLUMN}>
          <Spotlight pulse={spot.flow} />
        <StudioFlowColumn
          studio={studio}
          selectedId={selected?.id ?? null}
          busyBlockId={materialBusy}
          env={hint}
          onSelect={selectBlock}
          onChange={saveStudio}
          onRun={runBlock}
          onStart={startOnDoska}
          onStartList={() => setConductorOpen(true)}
        />
        </div>
        <div ref={adviceScope} data-guide="advice" className={COLUMN}>
          <Spotlight pulse={spot.advice} />
        <StudioAdviceColumn
          studio={studio}
          block={selected}
          env={env}
          envDefault={envDefault}
          subject={subject}
          topic={lesson.title}
          setInfo={setInfo}
          checkSet={checkSet}
          busy={materialBusy === selected?.id}
          onUpdate={update}
          onGenerate={(b) => void generateMaterial(b)}
          onTemplate={applyTemplate}
          onAttach={(b) => setAttachFor(b.id)}
          onOpenSet={(b) => b.setId && setBuilder({ blockId: b.id, setId: b.setId })}
          onRun={runBlock}
          onOpenEnv={() => setEnvOpen(true)}
          onOpenUrl={openUrl}
        />
        </div>
      </div>

      <GuideBubble step={guide.current} onClose={guide.dismiss} onNext={showGuide} />
      <FlyDot path={fly} onDone={onFlyDone} />

      {envOpen && (
        <ClassEnvDialog
          className={cls?.name ?? ""}
          env={env}
          studentCount={studentCount}
          onSave={(next) => saveEnv(next)}
          onClose={() => setEnvOpen(false)}
        />
      )}

      {builder && (
        <SetBuilderOverlay
          classId={classId}
          setId={builder.setId}
          initialTitle={builder.title}
          initialQuestions={builder.questions}
          firstShape={builder.firstShape}
          onSaved={(set) => {
            update(builder.blockId, { setId: set.id, setTitle: set.title });
            onSetsChanged();
          }}
          onClose={() => setBuilder(null)}
        />
      )}

      {attachFor && (
        <AttachTestDialog
          classId={classId}
          assignmentId=""
          onPick={(set) => {
            update(attachFor, { setId: set.id, setTitle: set.title });
            setAttachFor(null);
          }}
          onCreateNew={() => {
            const id = attachFor;
            setAttachFor(null);
            const block = blocks.find((b) => b.id === id);
            setBuilder({
              blockId: id,
              title: lesson.title,
              firstShape: block?.kind === "explain" ? "slide" : "mcq",
            });
          }}
          onPickBank={() => {
            setAttachFor(null);
            onOpenBank();
          }}
          onClose={() => setAttachFor(null)}
        />
      )}

      {conductorOpen && studio && (
        <LessonConductor
          lesson={lesson}
          classId={classId}
          className={cls?.name ?? ""}
          studio={studio}
          onRun={runBlock}
          onClose={() => setConductorOpen(false)}
        />
      )}
    </div>
  );
}
