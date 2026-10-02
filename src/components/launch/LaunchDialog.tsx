"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  Gamepad2,
  House,
  Info,
  Library,
  Link2,
  MonitorPlay,
  Play,
  Plus,
  Presentation,
  Printer,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import { classTints, CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classColor } from "@/lib/grades-data";
import { cn } from "@/lib/utils";
import { unwrap } from "@/lib/action-result";
import { GAME_SHELLS, shellAvailability } from "@/lib/baholash-shells";
import { GAME_LABEL_KEYS, type GameFile } from "@/lib/games";
import { MARKER_CAPACITY } from "@/lib/cards/marker";
import { openBaholashPdf, type PrintKind } from "@/lib/baholash-print";
import type {
  LaunchIntent,
  LaunchMode,
  LaunchSetInfo,
  RunStartKind,
  RunSummary,
} from "@/lib/launch-types";
import type { ActivitySetRow } from "@/server/db/schema";
import { getSetDraftAction, listSetsAction, type SetDraft } from "@/server/actions/assess";
import { launchSetInfoAction, startRunAction } from "@/server/actions/assess-runs";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import ScanPanel from "@/components/scan/ScanPanel";
import { LAUNCH_GROUPS, LAUNCH_INTENTS, LAUNCH_MODES, launchModeIssue } from "./launch-modes";
import { ClassPreflight } from "./ClassPreflight";
import { dateKeyInTashkent, formatDue } from "./format";

/* ════════════════════════════════════════════════════════════════════
   OʻTKAZISH OYNASI — ikki kirish tugmasi, bitta oyna.

   docs/topshiriq-boshlash-markazi.md §4. Tugmalar oʻqituvchining ikki
   haqiqiy niyatini aytadi — «Darsda oʻtkazish» va «Uyga berish».
   Yolgʻiz «Boshlash» / «Sessiya» nimani boshlashini aytmasdi, shuning
   uchun ular olib tashlandi (2026-09-27, loyiha egasining fikri).

     Qaysi test?  →  Oʻquvchilar qayerda ishlaydi?  →  Qanday?
     (qatordan kelsa   (tugmadan kelsa oʻtkazib         (faqat darsda:
      oʻtkazib           yuboriladi)                      telefon / telefonsiz)
      yuboriladi)

   Uy vazifasi — bitta ekran: muddat va koʻrinishi (oddiy test yoki
   oʻyin). Darsda — usul: bir bosishda ishga tushadiganlar (Jonli dars
   Doskada, Mustaqil test, Pult) va bitta qator sozlamalilar (oʻyin
   turi, chop etish). Har usulning mosligi kontentdan HISOBLANADI va
   mos kelmasa SABABI yoziladi — oʻchiq tugma «nega?» degan savol
   qoldiradi, sabab esa nima qilishni aytadi.
   ════════════════════════════════════════════════════════════════════ */

export type LaunchPreset = {
  setId?: string;
  /** Maʼlumot yuklanguncha sarlavhada koʻrinadi. */
  title?: string;
  /** Qaysi tugmadan kelindi. Yoʻq boʻlsa oyna oʻzi soʻraydi
      (Oʻyinlar sahifasidan kelganda — oʻyin darsda ham, uyda ham boʻladi). */
  intent?: LaunchIntent;
  /** Oldindan tanlangan usul (Oʻyinlar sahifasidan — `game`). */
  mode?: LaunchMode;
  /** Oldindan tanlangan oʻyin qobigʻi. */
  shellId?: string;
  /** Topshiriqning muddati (`YYYY-MM-DD`) — uy vazifasi standarti. */
  dueDate?: string;
};

type Step = "set" | "where" | "mode" | "preflight" | "game" | "homework" | "paper" | "cards";

/** Baholanmaydigan oʻyinlar — oʻz savollari bilan, «mashq». */
const PRACTICE_GAMES: GameFile[] = ["xotira", "krossvord", "so-z-topish", "qaysi-katta"];

const DUE_CHIPS: { key: "today" | "tomorrow" | "3days" | "week"; offset: number }[] = [
  { key: "today", offset: 0 },
  { key: "tomorrow", offset: 1 },
  { key: "3days", offset: 3 },
  { key: "week", offset: 7 },
];

function hasWebSerial(): boolean {
  return typeof navigator !== "undefined" && "serial" in navigator;
}

/** Test tanlangach birinchi ekran — kirish tugmasi aytgan qarorga qarab. */
function stepAfterSet(intent: LaunchIntent | null, presetMode?: LaunchMode): Step {
  if (intent === "home") return "homework";
  // Dars studiyasidan usul allaqachon tanlangan boʻlib keladi (ssenariy
  // bloki) — qogʻoz va karta oʻz qadamidan ochiladi, «Orqaga» usullarga qaytaradi.
  if (intent === "class") {
    if (presetMode === "game" || presetMode === "paper" || presetMode === "cards") return presetMode;
    return "mode";
  }
  return "where";
}

export function LaunchDialog({
  classId: fixedClassId,
  preset,
  sameTab = false,
  onClose,
  onStarted,
  onPult,
  onOfflineApplied,
  onOpenBank,
  onCreateNew,
}: {
  /** Sinf sahifada tanlangan boʻlsa — oʻsha. `null` — oynaning oʻzida tanlanadi. */
  classId: string | null;
  preset?: LaunchPreset;
  sameTab?: boolean;
  onClose: () => void;
  /** Ish ochildi — natija ekranini ochish. */
  onStarted: (run: RunSummary) => void;
  onPult: (setId: string, classId: string) => void;
  /** Qogʻoz/karta javoblari yozildi — natija ekrani. */
  onOfflineApplied?: (sessionId: string) => void;
  /** Test tanlash qadamida — bankdan olish. */
  onOpenBank?: () => void;
  /** Test tanlash qadamida — yangi test tuzish. */
  onCreateNew?: () => void;
}) {
  const t = useTranslations("LaunchHub");
  const router = useRouter();
  const liveClasses = useLiveClasses();
  const [classId, setClassId] = useState<string | null>(
    fixedClassId ?? liveClasses[0]?.id ?? null,
  );
  const [setId, setSetId] = useState<string | null>(preset?.setId ?? null);
  const [intent, setIntent] = useState<LaunchIntent | null>(preset?.intent ?? null);
  const [step, setStep] = useState<Step>(
    preset?.setId ? stepAfterSet(preset.intent ?? null, preset.mode) : "set",
  );
  const [info, setInfo] = useState<LaunchSetInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [starting, setStarting] = useState<LaunchMode | null>(null);
  const [previewDraft, setPreviewDraft] = useState<SetDraft | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewRetry, setPreviewRetry] = useState(0);

  // Sinf roʻyxati kech kelsa (gidratsiya) — birinchisi tanlanadi.
  useEffect(() => {
    if (!classId && liveClasses[0]) setClassId(liveClasses[0].id);
  }, [classId, liveClasses]);

  useEffect(() => {
    if (!setId) {
      setInfo(null);
      return;
    }
    let alive = true;
    setInfo(null);
    setInfoError(null);
    launchSetInfoAction(setId)
      .then((res) => {
        if (!alive) return;
        if (res.ok) setInfo(res.data);
        else setInfoError(res.message);
      })
      .catch(() => alive && setInfoError(t("loadFailed")));
    return () => {
      alive = false;
    };
  }, [setId, t]);

  // Tarkib faqat oʻqituvchi koʻrikni ochganda olinadi; oddiy startga qoʻshimcha soʻrov yoʻq.
  useEffect(() => {
    if (step !== "preflight" || !setId) return;
    let alive = true;
    setPreviewDraft(null);
    setPreviewError(null);
    getSetDraftAction(setId)
      .then((draft) => {
        if (!alive) return;
        if (draft) setPreviewDraft(draft);
        else setPreviewError(t("loadFailed"));
      })
      .catch(() => { if (alive) setPreviewError(t("loadFailed")); });
    return () => { alive = false; };
  }, [step, setId, previewRetry, t]);

  const className = liveClasses.find((c) => c.id === classId)?.name ?? "";

  async function start(
    kind: RunStartKind,
    extra: { dueDate?: string; shellId?: string } | undefined,
    busy: LaunchMode,
  ) {
    if (!setId || !classId) return;
    setStarting(busy);
    try {
      const run = unwrap(await startRunAction({ setId, classId, kind, ...extra }));
      onStarted(run);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actionFailed"));
    } finally {
      setStarting(null);
    }
  }

  /** `cards` — QR-karta sinf testi sahnasi Doskada darhol ochiladi
      (docs/sinf-testi-spec.md); `live` — jonli sessiya. */
  function openDoska(live: boolean, mode?: "cards") {
    if (!setId || !classId) return;
    const q = new URLSearchParams({ setId, classId });
    if (live) q.set("live", "1");
    if (mode) q.set("mode", mode);
    const url = `/doska?${q.toString()}`;
    if (sameTab) {
      onClose();
      router.push(url);
      return;
    }
    const opened = window.open(url, "_blank");
    if (!opened) {
      // Yangi oyna bloklandi — shu oynada ochamiz (Doska toʻliq ekran).
      router.push(url);
      return;
    }
    if (live) {
      toast.success(t("liveOpened"), { description: t("liveOpenedHint") });
      onClose();
    }
  }

  function pick(mode: LaunchMode) {
    if (!setId || !classId) return;
    switch (mode) {
      case "live":
        openDoska(true);
        return;
      case "selfpaced":
        void start("selfpaced", undefined, "selfpaced");
        return;
      case "pult":
        onPult(setId, classId);
        return;
      default:
        setStep(mode);
    }
  }

  function chooseIntent(next: LaunchIntent) {
    setIntent(next);
    setStep(stepAfterSet(next, preset?.mode));
  }

  function changeSet() {
    setSetId(null);
    setStep("set");
  }

  /** «Orqaga» qayerga olib boradi — `null` boʻlsa tugma chiqmaydi. */
  const back: Step | null = (() => {
    switch (step) {
      case "game":
      case "paper":
      case "cards":
      case "preflight":
        return "mode";
      case "mode":
      case "homework":
        if (!preset?.intent) return "where";
        return preset.setId ? null : "set";
      case "where":
        return preset?.setId ? null : "set";
      default:
        return null;
    }
  })();

  const title =
    step === "set"
      ? t("pickSetTitle")
      : step === "where"
        ? t("whereTitle")
        : step === "mode"
          ? t("dialogTitle")
          : step === "preflight"
            ? t("preflightTitle")
            : t(`mode_${step}`);
  const description =
    step === "set"
      ? className
        ? t("pickSetDescription", { className })
        : undefined
      : [info?.title ?? preset?.title, className].filter(Boolean).join(" · ");
  const HeaderIcon =
    step === "set" || step === "where"
      ? ClipboardCheck
      : LAUNCH_INTENTS[step === "homework" ? "home" : "class"].icon;
  const needsInfo = step === "game" || step === "homework" || step === "paper" || step === "cards" || step === "preflight";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeaderBar icon={<HeaderIcon aria-hidden />} title={title} description={description} />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {back && (
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-3 text-muted-foreground"
              onClick={() => setStep(back)}
            >
              <ArrowLeft />
              {t("back")}
            </Button>
          )}

          {(step === "where" || step === "mode" || step === "homework" || step === "preflight") && info && (
            <SetMeta
              info={info}
              canChangeSet={!preset?.setId}
              onChangeSet={changeSet}
            />
          )}

          {step === "set" && (
            <SetStep
              fixedClass={fixedClassId !== null}
              classId={classId}
              onClassChange={setClassId}
              onPick={(set) => {
                setSetId(set.id);
                setStep(stepAfterSet(intent, preset?.mode));
              }}
              onOpenBank={onOpenBank}
              onCreateNew={onCreateNew}
            />
          )}

          {step === "where" && <WhereStep onPick={chooseIntent} />}

          {step === "mode" && (
            <ModeStep info={info} error={infoError} starting={starting} onPick={pick} onPreview={() => setStep("preflight")} />
          )}

          {step === "preflight" && info && (
            <ClassPreflight
              info={info}
              draft={previewDraft}
              className={className}
              loading={!previewDraft && !previewError}
              error={previewError}
              onRetry={() => setPreviewRetry((n) => n + 1)}
              onBack={() => setStep("mode")}
            />
          )}

          {needsInfo && !info && (
            infoError ? (
              <p className="text-sm text-muted-foreground">{infoError}</p>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <Spinner className="size-5 text-muted-foreground" />
              </div>
            )
          )}

          {step === "game" && info && (
            <GameStep
              info={info}
              preselect={preset?.shellId}
              starting={starting === "game"}
              onStart={(shellId) => void start("game", { shellId }, "game")}
            />
          )}

          {step === "homework" && info && (
            <HomeworkStep
              info={info}
              defaultDue={preset?.dueDate}
              preselectShell={preset?.mode === "game" ? preset.shellId : undefined}
              starting={starting === "homework"}
              onStart={(dueDate, shellId) =>
                void (shellId
                  ? start("game", { shellId, dueDate }, "homework")
                  : start("homework", { dueDate }, "homework"))
              }
            />
          )}

          {(step === "paper" || step === "cards") && info && setId && classId && (
            <OfflineStep
              kind={step}
              info={info}
              setId={setId}
              classId={classId}
              onShowOnBoard={() => openDoska(false, step === "cards" ? "cards" : undefined)}
              onApplied={(sessionId) => onOfflineApplied?.(sessionId)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Tanlangan test haqida bitta qator — savollar soni, mashq belgisi,
    «Boshqa test». Barcha qaror ekranlarida bir xil joyda. */
function SetMeta({
  info,
  canChangeSet,
  onChangeSet,
}: {
  info: LaunchSetInfo;
  canChangeSet: boolean;
  onChangeSet: () => void;
}) {
  const t = useTranslations("LaunchHub");
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
      <span>{t("questions", { count: info.itemCount })}</span>
      {info.purpose === "formative" && (
        <span className="inline-flex items-center gap-1 text-warning">
          <Info className="size-3.5" />
          {t("formativeNote")}
        </span>
      )}
      {canChangeSet && (
        <Button variant="link" size="sm" className="ml-auto h-auto p-0" onClick={onChangeSet}>
          {t("changeSet")}
        </Button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   1-QADAM — QAYSI TEST?
   ════════════════════════════════════════════════════════════════════ */

function SetStep({
  fixedClass,
  classId,
  onClassChange,
  onPick,
  onOpenBank,
  onCreateNew,
}: {
  fixedClass: boolean;
  classId: string | null;
  onClassChange: (id: string) => void;
  onPick: (set: ActivitySetRow) => void;
  onOpenBank?: () => void;
  onCreateNew?: () => void;
}) {
  const t = useTranslations("LaunchHub");
  const liveClasses = useLiveClasses();
  const [sets, setSets] = useState<ActivitySetRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    listSetsAction()
      .then((rows) => alive && setSets(rows))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  /* Test sinfga BOGʻLANMAGAN — oʻqituvchi bir marta tuzgan testni
     istalgan sinfida oʻtkazadi (sessiya sinfi — tanlangan sinf). Shu
     sinfda tuzilganlari tepada: oʻqituvchi odatda oʻshalarni izlaydi. */
  const { own, other } = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const list = (sets ?? [])
      .filter((s) => s.items.length > 0)
      .filter((s) => !q || s.title.toLocaleLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return {
      own: list.filter((s) => s.classId === classId),
      other: list.filter((s) => s.classId !== classId),
    };
  }, [sets, query, classId]);

  return (
    <div className="flex flex-col gap-4">
      {!fixedClass && liveClasses.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-label text-muted-foreground">{t("pickClass")}</span>
          <div className="flex flex-wrap gap-2">
            {liveClasses.map((c) => {
              const on = c.id === classId;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onClassChange(c.id)}
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors duration-fast",
                    on
                      ? "border-foreground/30 bg-muted text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: CLASS_COLOR_HEX[classColor(c)] }}
                  />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      {!sets && !failed && (
        <div className="flex h-32 items-center justify-center">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      )}
      {failed && <p className="text-sm text-muted-foreground">{t("loadFailed")}</p>}

      {sets && own.length === 0 && other.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
          <p className="text-sm font-medium text-foreground">{t("noSets")}</p>
          <p className="text-caption text-muted-foreground">{t("noSetsHint")}</p>
          {!onCreateNew && !onOpenBank && (
            <Button size="sm" variant="outline" className="mt-2 shadow-none" asChild>
              <Link href="/dashboard/assignments">{t("openAssignments")}</Link>
            </Button>
          )}
        </div>
      )}

      {own.length > 0 && <SetGroup label={t("fromThisClass")} sets={own} onPick={onPick} />}
      {other.length > 0 && <SetGroup label={t("fromOtherClasses")} sets={other} onPick={onPick} />}

      {(onOpenBank || onCreateNew) && (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {onOpenBank && (
            <Button size="sm" variant="outline" className="shadow-none" onClick={onOpenBank}>
              <Library />
              {t("fromBank")}
            </Button>
          )}
          {onCreateNew && (
            <Button size="sm" variant="outline" className="shadow-none" onClick={onCreateNew}>
              <Plus />
              {t("createNew")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SetGroup({
  label,
  sets,
  onPick,
}: {
  label: string;
  sets: ActivitySetRow[];
  onPick: (set: ActivitySetRow) => void;
}) {
  const t = useTranslations("LaunchHub");
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-muted-foreground">{label}</span>
      <div className="flex flex-col gap-2">
        {sets.map((set) => {
          const deck = set.containerKind === "deck";
          const Icon = deck ? Presentation : ClipboardCheck;
          const tints = classTints(deck ? "orange" : "green");
          return (
            <button
              key={set.id}
              type="button"
              onClick={() => onPick(set)}
              className="list-card flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                style={tints.gradientTile}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{set.title}</span>
                <span className="block text-caption text-muted-foreground">
                  {t("questions", { count: set.items.length })}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2-QADAM — OʻQUVCHILAR QAYERDA ISHLAYDI?
   Faqat kirish tugmasisiz kelinganda (Oʻyinlar sahifasi): qator,
   muharrir va test bankidagi tugmalar bu qarorni allaqachon aytadi.
   ════════════════════════════════════════════════════════════════════ */

function WhereStep({ onPick }: { onPick: (intent: LaunchIntent) => void }) {
  const t = useTranslations("LaunchHub");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <IntentTile
        intent="class"
        title={t("runInClass")}
        hint={t("runInClassHint")}
        onClick={() => onPick("class")}
      />
      <IntentTile
        intent="home"
        title={t("giveHomework")}
        hint={t("giveHomeworkHint")}
        onClick={() => onPick("home")}
      />
    </div>
  );
}

function IntentTile({
  intent,
  title,
  hint,
  onClick,
}: {
  intent: LaunchIntent;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  const meta = LAUNCH_INTENTS[intent];
  const Icon = meta.icon;
  const tints = classTints(meta.color);
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex min-h-32 flex-col items-start gap-3 overflow-hidden rounded-xl border border-border bg-card p-5 text-left transition-colors duration-fast hover:bg-muted/40"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-7 -top-7 size-28 rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: tints.solid }}
      />
      <span
        className="relative flex size-10 items-center justify-center rounded-lg text-white"
        style={tints.gradientTile}
      >
        <Icon className="size-5" />
      </span>
      <span className="relative flex flex-col gap-0.5">
        <span className="text-base font-semibold text-foreground">{title}</span>
        <span className="text-caption text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   3-QADAM — DARSDA QANDAY OʻTKAZAMIZ?
   ════════════════════════════════════════════════════════════════════ */

function ModeStep({
  info,
  error,
  starting,
  onPick,
  onPreview,
}: {
  info: LaunchSetInfo | null;
  error: string | null;
  starting: LaunchMode | null;
  onPick: (mode: LaunchMode) => void;
  onPreview: () => void;
}) {
  const t = useTranslations("LaunchHub");
  const serial = hasWebSerial();

  /** Usul nega ishlamaydi — `null` boʻlsa ishlaydi. */
  function blockedReason(mode: LaunchMode): string | null {
    if (!info) return null;
    const issue = launchModeIssue(mode, info, serial);
    return issue ? t(issue) : null;
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <Button variant="outline" className="self-start shadow-none" disabled={!info} onClick={onPreview}>
        <ShieldCheck className="size-4" />{t("preflightOpen")}
      </Button>
      {LAUNCH_GROUPS.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-label text-muted-foreground">{t(`group_${group.id}`)}</h3>
            <p className="text-caption text-muted-foreground">{t(`group_${group.id}Hint`)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {group.modes.map((mode) => {
              const reason = blockedReason(mode);
              return (
                <ModeTile
                  key={mode}
                  mode={mode}
                  loading={!info || starting === mode}
                  disabled={!info || Boolean(reason) || starting !== null}
                  reason={reason}
                  onClick={() => onPick(mode)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Usul plitkasi — `MaterialKindPicker` retsepti: oq karta, ikonka ortida
    yumshoq rang dogʻi (butun karta boʻyalmaydi — matn oʻqilishi uchun). */
function ModeTile({
  mode,
  loading,
  disabled,
  reason,
  onClick,
}: {
  mode: LaunchMode;
  loading: boolean;
  disabled: boolean;
  reason: string | null;
  onClick: () => void;
}) {
  const t = useTranslations("LaunchHub");
  const meta = LAUNCH_MODES[mode];
  const Icon = meta.icon;
  const tints = classTints(meta.color);
  const muted = Boolean(reason);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={reason ?? undefined}
      className={cn(
        "relative flex min-h-28 flex-col items-start gap-3 overflow-hidden rounded-xl border bg-card p-4 text-left transition-colors duration-fast",
        muted
          ? "cursor-not-allowed border-dashed border-border"
          : "border-border hover:bg-muted/40 disabled:cursor-wait",
      )}
    >
      {!muted && (
        <span
          aria-hidden
          className="pointer-events-none absolute -left-7 -top-7 size-28 rounded-full opacity-30 blur-2xl"
          style={{ backgroundColor: tints.solid }}
        />
      )}
      <span
        className={cn(
          "relative flex size-9 items-center justify-center rounded-lg",
          muted ? "bg-muted text-muted-foreground" : "text-white",
        )}
        style={muted ? undefined : tints.gradientTile}
      >
        {loading && !muted ? <Spinner className="size-4" /> : <Icon className="size-[18px]" />}
      </span>
      <span className="relative flex flex-col gap-0.5">
        <span className={cn("text-sm font-medium", muted ? "text-muted-foreground" : "text-foreground")}>
          {t(`mode_${mode}`)}
        </span>
        <span className="text-caption text-muted-foreground">{reason ?? t(`mode_${mode}Hint`)}</span>
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OʻYIN
   ════════════════════════════════════════════════════════════════════ */

function GameStep({
  info,
  preselect,
  starting,
  onStart,
}: {
  info: LaunchSetInfo;
  preselect?: string;
  starting: boolean;
  onStart: (shellId: string) => void;
}) {
  const t = useTranslations("LaunchHub");
  const tRoutes = useTranslations("RouteLabels");
  const shells = useMemo(
    () => GAME_SHELLS.map((shell) => ({ shell, state: shellAvailability(shell, info.content) })),
    [info.content],
  );
  const usable = shells.filter((s) => s.state.ok);
  const blocked = shells.filter((s) => !s.state.ok);
  const [picked, setPicked] = useState<string | null>(
    usable.some((s) => s.shell.id === preselect) ? (preselect ?? null) : null,
  );
  const shellId = picked ?? usable[0]?.shell.id ?? null;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h3 className="text-label text-muted-foreground">{t("gameTitle")}</h3>
        {usable.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {usable.map(({ shell }) => {
              const on = shell.id === shellId;
              return (
                <button
                  key={shell.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPicked(shell.id)}
                  className={cn(
                    "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors duration-fast",
                    on ? "border-foreground/40 bg-muted/60" : "border-border hover:bg-muted/40",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {on && <Check className="size-4" />}
                    {shell.name}
                  </span>
                  <span className="text-caption text-muted-foreground">{shell.description}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noGameFits")}</p>
        )}
        {/* Mos kelmagan oʻyin YASHIRILMAYDI — sababi bilan. Sabab
            oʻqituvchiga nima qilishni aytadi (savol qoʻshish, variant
            kamaytirish). */}
        {blocked.length > 0 && (
          <ul className="flex flex-col gap-1">
            {blocked.map(({ shell, state }) => (
              <li key={shell.id} className="text-caption text-muted-foreground">
                <span className="font-medium text-foreground/70">{shell.name}</span> —{" "}
                {state.ok ? "" : state.reason}
              </li>
            ))}
          </ul>
        )}
        <p className="text-caption text-muted-foreground">{t("gameGradedNote")}</p>
        {!info.gamesReady && (
          <p className="text-caption text-warning">{t("gamesMissing")}</p>
        )}
      </section>

      {usable.length > 0 && (
        <div>
          <Button
            loading={starting}
            disabled={!shellId || starting}
            onClick={() => shellId && onStart(shellId)}
          >
            {!starting && <Play />}
            {t("startGame")}
          </Button>
        </div>
      )}

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-label text-muted-foreground">{t("practiceTitle")}</h3>
          <p className="text-caption text-muted-foreground">{t("practiceHint")}</p>
        </div>
        <div className="flex flex-col gap-2">
          {PRACTICE_GAMES.map((game) => (
            <PracticeRow key={game} game={game} label={tRoutes(GAME_LABEL_KEYS[game])} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Mashq oʻyini — ochish yoki havolasini ulashish (uyda mashq uchun).
    Natija jurnalga tushmaydi — bu ochiq yozilgan (`practiceHint`). */
function PracticeRow({ game, label }: { game: GameFile; label: string }) {
  const t = useTranslations("LaunchHub");
  const [copied, setCopied] = useState(false);
  function share() {
    const url = `${window.location.origin}/games/${game}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={share}>
        {copied ? <Check /> : <Link2 />}
        {copied ? t("copied") : t("practiceShare")}
      </Button>
      <Button size="sm" variant="outline" className="shadow-none" asChild>
        <Link href={`/dashboard/games/${game}`}>
          <ExternalLink />
          {t("practiceOpen")}
        </Link>
      </Button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   UYGA VAZIFA
   ════════════════════════════════════════════════════════════════════ */

/** Standart muddat: topshiriqniki (kelajakda boʻlsa), aks holda ertaga. */
function defaultDueKey(fromAssignment?: string): string {
  const today = dateKeyInTashkent(0);
  if (fromAssignment && fromAssignment >= today) return fromAssignment;
  return dateKeyInTashkent(1);
}

function HomeworkStep({
  info,
  defaultDue,
  preselectShell,
  starting,
  onStart,
}: {
  info: LaunchSetInfo;
  defaultDue?: string;
  /** Oʻyinlar sahifasidan kelinganda — oʻsha oʻyin koʻrinishi tanlangan. */
  preselectShell?: string;
  starting: boolean;
  onStart: (dueDate: string, shellId?: string) => void;
}) {
  const t = useTranslations("LaunchHub");
  const [dueDate, setDueDate] = useState<string>(() => defaultDueKey(defaultDue));
  /* Koʻrinishi: oddiy test yoki shu testga MOS oʻyin. Mos kelmagan oʻyin
     bu yerda koʻrsatilmaydi — sababi darsdagi «Oʻyin» ekranida yozilgan. */
  const games = useMemo(
    () => GAME_SHELLS.filter((shell) => shellAvailability(shell, info.content).ok),
    [info.content],
  );
  const [shellId, setShellId] = useState<string | null>(
    games.some((g) => g.id === preselectShell) ? (preselectShell ?? null) : null,
  );
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">{t("homeworkHowTo")}</p>
      <DuePicker value={dueDate} onChange={setDueDate} />
      {games.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-label text-muted-foreground">{t("formatTitle")}</span>
          <div className="flex flex-wrap items-center gap-2">
            <ChoiceChip on={shellId === null} onClick={() => setShellId(null)}>
              <ClipboardCheck className="size-3.5" />
              {t("formatPlain")}
            </ChoiceChip>
            {games.map((game) => (
              <ChoiceChip key={game.id} on={shellId === game.id} onClick={() => setShellId(game.id)}>
                <Gamepad2 className="size-3.5" />
                {game.name}
              </ChoiceChip>
            ))}
          </div>
          {shellId && <p className="text-caption text-muted-foreground">{t("gameGradedNote")}</p>}
          {shellId && !info.gamesReady && (
            <p className="text-caption text-warning">{t("gamesMissing")}</p>
          )}
        </div>
      )}
      <div>
        <Button loading={starting} disabled={starting} onClick={() => onStart(dueDate, shellId ?? undefined)}>
          {!starting && <House />}
          {t("startHomework")}
        </Button>
      </div>
    </div>
  );
}

/** Tanlov «chipi» — muddat va koʻrinish bir xil koʻrinishda. */
function ChoiceChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors duration-fast",
        on
          ? "border-foreground/30 bg-muted text-foreground"
          : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DuePicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const t = useTranslations("LaunchHub");
  const locale = useLocale();
  const chips = DUE_CHIPS.map((c) => ({ ...c, date: dateKeyInTashkent(c.offset) }));
  const custom = !chips.some((c) => c.date === value);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label text-muted-foreground">{t("dueTitle")}</span>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <ChoiceChip key={chip.key} on={chip.date === value} onClick={() => onChange(chip.date)}>
            {t(`due_${chip.key}`)}
          </ChoiceChip>
        ))}
        <Input
          type="date"
          value={value}
          min={dateKeyInTashkent(0)}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          aria-label={t("dueCustom")}
          className={cn("h-8 w-40", custom && "border-foreground/30")}
        />
      </div>
      <p className="text-caption text-muted-foreground">
        {t("dueUntil", { date: formatDue(`${value}T23:59:00+05:00`, locale) })}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   QOGʻOZ TEST · QR-KARTALAR
   ════════════════════════════════════════════════════════════════════ */

function OfflineStep({
  kind,
  info,
  setId,
  classId,
  onShowOnBoard,
  onApplied,
}: {
  kind: "paper" | "cards";
  info: LaunchSetInfo;
  setId: string;
  classId: string;
  onShowOnBoard: () => void;
  onApplied: (sessionId: string) => void;
}) {
  const t = useTranslations("LaunchHub");
  const [busy, setBusy] = useState<PrintKind | null>(null);
  const [skippedCards, setSkippedCards] = useState(0);

  async function print(printKind: PrintKind) {
    setBusy(printKind);
    try {
      const res = await openBaholashPdf(printKind, setId, classId);
      if (printKind === "cards") setSkippedCards(res.skippedCards);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("printFailed"));
    } finally {
      setBusy(null);
    }
  }

  if (kind === "paper" && !info.engineReady) {
    return <p className="text-sm text-muted-foreground">{t("engineMissing")}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {kind === "paper" ? (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">{t("paperStep1")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <PrintCard
              title={t("paperClassSheets")}
              hint={t("paperClassSheetsHint")}
              loading={busy === "class"}
              disabled={busy !== null}
              onClick={() => void print("class")}
            />
            <PrintCard
              title={t("paperExamSheets")}
              hint={t("paperExamSheetsHint")}
              loading={busy === "exam"}
              disabled={busy !== null}
              onClick={() => void print("exam")}
            />
          </div>
          <p className="text-caption text-muted-foreground">{t("paperOrderNote")}</p>
        </section>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{t("cardsStep1")}</h3>
            <PrintCard
              title={t("cardsPrint")}
              hint={t("cardsPrintHint")}
              loading={busy === "cards"}
              disabled={busy !== null}
              onClick={() => void print("cards")}
            />
            {skippedCards > 0 && (
              <p className="text-caption text-warning">
                {t("cardsSkipped", { count: skippedCards, capacity: MARKER_CAPACITY })}
              </p>
            )}
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">{t("cardsStep2")}</h3>
            <p className="text-sm text-muted-foreground">{t("cardsHowTo")}</p>
            <div>
              <Button variant="outline" className="shadow-none" onClick={onShowOnBoard}>
                <MonitorPlay />
                {t("showOnBoard")}
              </Button>
            </div>
          </section>
        </>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          {kind === "paper" ? t("paperStep2") : t("cardsStep3")}
        </h3>
        <ScanPanel
          setId={setId}
          classId={classId}
          mode={kind === "cards" ? "cards" : "sheets"}
          onApplied={(report) => onApplied(report.sessionId)}
        />
      </section>
    </div>
  );
}

function PrintCard({
  title,
  hint,
  loading,
  disabled,
  onClick,
}: {
  title: string;
  hint: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors duration-fast hover:bg-muted/40 disabled:cursor-wait disabled:opacity-60"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {loading ? <Spinner className="size-4" /> : <Printer className="size-4" />}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="text-caption text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
