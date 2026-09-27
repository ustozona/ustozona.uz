"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BookCheck,
  CalendarClock,
  Info,
  MonitorPlay,
  RadioReceiver,
  RotateCcw,
  ScanLine,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeaderBar,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classTints } from "@/lib/class-colors";
import { gradeBadgeClass } from "@/lib/score-colors";
import { cn } from "@/lib/utils";
import { findShell } from "@/lib/baholash-shells";
import { unwrap } from "@/lib/action-result";
import type { RunMonitorData, RunRosterRow, RunTopic } from "@/lib/launch-types";
import {
  closeRunAction,
  publishRunAction,
  reopenRunAction,
  runMonitorAction,
} from "@/server/actions/assess-runs";
import { reloadGradesFromServer } from "@/components/sync/GradesServerSync";
import ScanPanel from "@/components/scan/ScanPanel";
import { JoinShare } from "./JoinShare";
import { OpenAnswersReview } from "./OpenAnswersReview";
import { RUN_KIND_META } from "./launch-modes";
import { formatDue } from "./format";

/* ════════════════════════════════════════════════════════════════════
   NATIJA EKRANI — bitta oʻtkazishning hammasi bitta joyda.

   Qaysi yoʻl bilan oʻtmasin (telefon, oʻyin, qogʻoz, karta, pult),
   oʻqituvchi shu ekranni koʻradi: kim qoʻshildi, kim tugatdi, kim
   necha foiz — va bitta «Jurnalga yozish» tugmasi.
   docs/topshiriq-boshlash-markazi.md §5.

   JURNALGA — BITTA BOSISH QOIDASI:
     • test topshiriqqa biriktirilgan → natija AYNAN oʻsha ustunga,
       uning toifasi bilan, savolsiz;
     • biriktirilmagan → bitta tanlov: qaysi toifa (oqilona standart
       bilan — uy vazifasi → «Uy ishi», test → birinchi summativ).
   Yarim natija yozilmaydi: sessiya yakunlangan yoki muddati oʻtgan
   boʻlishi shart (server ham tekshiradi — `runs.ts publishRun`).

   Ochiq sessiyada roʻyxat 5 soniyada yangilanadi — arxitektura
   qarori: realtime shart emas, polling yetarli (ost-loyihalar, F).
   ════════════════════════════════════════════════════════════════════ */

const POLL_MS = 5000;
const NO_TOPIC = "__none__";

/** Toifa uchun oqilona standart — oʻqituvchi bir bosishda oʻzgartira oladi. */
function suggestTopic(topics: RunTopic[], homework: boolean): string {
  if (topics.length === 0) return NO_TOPIC;
  if (homework) {
    const home = topics.find((t) => /(^|\s)uy(\s|$)|уй|дом|home/i.test(t.name));
    if (home) return home.id;
  }
  const summative = topics.find((t) => t.purpose === "summative");
  return (summative ?? topics[0]).id;
}

export function RunMonitor({
  sessionId,
  onClose,
  onChanged,
  onOpenPult,
}: {
  sessionId: string;
  onClose: () => void;
  /** Roʻyxat (Hozir ochiq) yangilanishi kerak boʻlgan har oʻzgarishda. */
  onChanged?: () => void;
  /** Qogʻoz sessiyasida pult bilan davom etish. */
  onOpenPult?: (setId: string, classId: string) => void;
}) {
  const t = useTranslations("LaunchHub");
  const locale = useLocale();
  const [data, setData] = useState<RunMonitorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"close" | "reopen" | "publish" | null>(null);
  const [topicChoice, setTopicChoice] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await runMonitorAction(sessionId).catch(() => null);
    if (!res) {
      setError(t("loadFailed"));
      return;
    }
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setError(null);
    setData(res.data);
  }, [sessionId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const running = data?.run.state === "running";
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      // Yashirin oynada soʻrov yuborilmaydi — bir necha oynada ochiq
      // qolgan natija ekrani serverni bekorga band qilmasin.
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [running, load]);

  const run = data?.run;
  const meta = run ? RUN_KIND_META[run.kind] : null;
  const KindIcon = meta?.icon ?? MonitorPlay;
  const tints = meta ? classTints(meta.color) : null;

  const topicValue =
    topicChoice ?? (data ? suggestTopic(data.topics, run?.kind === "homework") : NO_TOPIC);

  const stats = useMemo(() => {
    if (!data) return null;
    const joined = data.roster.filter((r) => r.status !== "waiting");
    const withPercent = joined.filter((r) => r.percent !== null);
    const average = withPercent.length
      ? Math.round(withPercent.reduce((s, r) => s + (r.percent ?? 0), 0) / withPercent.length)
      : null;
    return { average };
  }, [data]);

  async function close() {
    setBusy("close");
    try {
      unwrap(await closeRunAction(sessionId));
      await load();
      onChanged?.();
      toast.success(t("closedToast"), {
        action: {
          label: t("reopen"),
          onClick: () => void reopen(),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actionFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function reopen() {
    setBusy("reopen");
    try {
      unwrap(await reopenRunAction(sessionId));
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actionFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!data) return;
    setBusy("publish");
    try {
      const topicId =
        data.target.kind === "existing"
          ? undefined
          : topicValue === NO_TOPIC
            ? null
            : topicValue;
      const result = unwrap(await publishRunAction({ sessionId, topicId }));
      // Jurnal serverda yozildi — store qayta yuklanadi, aks holda baho
      // sahifa yangilanguncha koʻrinmasdi (va sync uni «oʻchirish» deb
      // oʻylamasligi uchun `rebase` ham shu funksiya ichida).
      await reloadGradesFromServer().catch(() => {});
      await load();
      onChanged?.();
      toast.success(t("published", { count: result.publishedCount }), {
        description: result.skippedAnonymous
          ? t("publishedSkipped", { count: result.skippedAnonymous })
          : undefined,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actionFailed"));
    } finally {
      setBusy(null);
    }
  }

  const kindLabel = run ? t(`kind_${run.kind}`) : "";
  const shell = run?.shellId ? findShell(run.shellId) : null;
  const stateLabel = !run
    ? ""
    : run.pastDue && run.state !== "completed"
      ? t("state_pastDue")
      : t(`state_${run.state}`);
  const acceptsJoins = Boolean(
    run && run.state === "running" && !run.pastDue && run.joinCode && run.kind !== "offline",
  );

  const shareText = run
    ? run.kind === "homework" && run.dueAt
      ? t("shareTextHomework", { title: run.title, due: formatDue(run.dueAt, locale) })
      : t("shareTextClass", { title: run.title, code: run.joinCode ?? "" })
    : "";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeaderBar
          icon={
            <span
              className="flex size-9 items-center justify-center rounded-lg text-white"
              style={tints?.gradientTile}
            >
              <KindIcon className="size-4" />
            </span>
          }
          title={run?.title ?? t("loading")}
          description={
            run
              ? [kindLabel, shell?.name, data?.className].filter(Boolean).join(" · ")
              : undefined
          }
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {!data && !error && (
            <div className="flex h-48 items-center justify-center">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          )}
          {error && !data && (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button size="sm" variant="outline" className="shadow-none" onClick={() => void load()}>
                {t("retry")}
              </Button>
            </div>
          )}

          {data && run && (
            <div className="flex flex-col gap-5 px-6 py-5">
              {/* Holat qatori — oʻqituvchi bir qarashda: ochiqmi, qachongacha,
                  nechta bola qoʻshildi va tugatdi. */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1.5",
                    run.state === "running" && !run.pastDue && "border-success/30 text-success",
                  )}
                >
                  {run.state === "running" && !run.pastDue && (
                    <span className="size-1.5 animate-pulse rounded-full bg-success" />
                  )}
                  {stateLabel}
                </Badge>
                {run.dueAt && (
                  <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {t("dueLine", { date: formatDue(run.dueAt, locale) })}
                  </span>
                )}
                <span className="ml-auto flex flex-wrap items-center gap-3 text-caption text-muted-foreground">
                  <span>{t("statsJoined", { joined: run.joined, total: run.rosterSize })}</span>
                  <span>{t("statsDone", { count: run.finished })}</span>
                  {stats?.average !== null && stats?.average !== undefined && (
                    <span>{t("statsAverage", { percent: stats.average })}</span>
                  )}
                </span>
              </div>

              {acceptsJoins && run.joinCode && (
                <JoinShare joinCode={run.joinCode} shellId={run.shellId} shareText={shareText} />
              )}

              {run.kind === "live" && run.state === "running" && (
                <Hint icon={MonitorPlay}>{t("liveManagedOnDoska")}</Hint>
              )}

              {/* Qogʻoz sessiyasi — yana varaq/karta kiritish yoki pult. */}
              {run.kind === "offline" && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {data.engineReady && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shadow-none"
                        aria-expanded={scanOpen}
                        onClick={() => setScanOpen((v) => !v)}
                      >
                        <ScanLine />
                        {t("offlineAddSheets")}
                      </Button>
                    )}
                    {onOpenPult && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shadow-none"
                        onClick={() => onOpenPult(run.setId, run.classId)}
                      >
                        <RadioReceiver />
                        {t("offlineContinuePult")}
                      </Button>
                    )}
                  </div>
                  {scanOpen && (
                    <ScanPanel
                      setId={run.setId}
                      classId={run.classId}
                      onApplied={() => {
                        void load();
                        onChanged?.();
                      }}
                    />
                  )}
                </div>
              )}

              <RosterList rows={data.roster} gradedTotal={data.gradedTotal} />

              {data.anonymous > 0 && <Hint icon={Info}>{t("anonymousNote", { count: data.anonymous })}</Hint>}

              {data.openAnswersPending > 0 && (
                <Hint icon={Info} tone="warn">
                  {t("openAnswersPending", { count: data.openAnswersPending })}
                </Hint>
              )}
              <OpenAnswersReview
                sessionId={sessionId}
                defaultOpen={data.openAnswersPending > 0 && run.state === "completed"}
                onGraded={() => void load()}
              />

              <p className="text-caption text-muted-foreground">{t("firstAttemptNote")}</p>
            </div>
          )}
        </div>

        {data && run && (
          <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <PublishTarget
              data={data}
              topicValue={topicValue}
              onTopicChange={setTopicChoice}
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {run.state === "running" && run.kind !== "offline" && (
                <Button
                  variant="outline"
                  className="shadow-none"
                  loading={busy === "close"}
                  disabled={busy !== null}
                  onClick={() => void close()}
                >
                  {busy !== "close" && <Square />}
                  {t("close")}
                </Button>
              )}
              {run.state === "completed" && !run.pastDue && run.kind !== "offline" && (
                <Button
                  variant="outline"
                  className="shadow-none"
                  loading={busy === "reopen"}
                  disabled={busy !== null}
                  onClick={() => void reopen()}
                >
                  {busy !== "reopen" && <RotateCcw />}
                  {t("reopen")}
                </Button>
              )}
              {run.publishedAssignmentId && (
                <Button variant="outline" className="shadow-none" asChild>
                  <Link href={`/dashboard/grades?classId=${encodeURIComponent(run.classId)}`}>
                    {t("openJournal")}
                  </Link>
                </Button>
              )}
              {run.gradable && (
                <Button
                  loading={busy === "publish"}
                  disabled={busy !== null || !data.canPublish}
                  disabledReason={!data.canPublish ? t("publishWaitHint") : undefined}
                  onClick={() => void publish()}
                >
                  {busy !== "publish" && <BookCheck />}
                  {run.publishedAssignmentId ? t("publishAgain") : t("publish")}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** «Qayerga yoziladi» — ekrandagi vaʼda serverdagi yozuv bilan bir xil
    (`findPublishTarget`). */
function PublishTarget({
  data,
  topicValue,
  onTopicChange,
}: {
  data: RunMonitorData;
  topicValue: string;
  onTopicChange: (value: string) => void;
}) {
  const t = useTranslations("LaunchHub");
  const { run } = data;

  if (!run.gradable) {
    return (
      <p className="text-caption text-muted-foreground">
        {data.gradedTotal === 0 ? t("publishNoQuestions") : t("publishFormative")}
      </p>
    );
  }
  if (run.publishedAssignmentId) {
    return (
      <p className="inline-flex items-center gap-1.5 text-caption text-success">
        <BookCheck className="size-3.5" />
        {t("inJournal")}
        {data.target.kind === "existing" ? ` · ${data.target.title}` : ""}
      </p>
    );
  }
  if (data.target.kind === "existing") {
    return (
      <p className="min-w-0 truncate text-caption text-muted-foreground">
        {t("publishTo", { title: data.target.title })}
      </p>
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-caption text-muted-foreground">{t("publishTopic")}</span>
      <Select value={topicValue} onValueChange={onTopicChange}>
        <SelectTrigger size="sm" className="w-52 max-w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {data.topics.map((topic) => (
            <SelectItem key={topic.id} value={topic.id}>
              {topic.name}
              {topic.purpose === "formative" ? ` · ${t("topicNotCounted")}` : ""}
            </SelectItem>
          ))}
          <SelectItem value={NO_TOPIC}>{t("publishNoTopic")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function RosterList({ rows, gradedTotal }: { rows: RunRosterRow[]; gradedTotal: number }) {
  const t = useTranslations("LaunchHub");
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noRoster")}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-label text-muted-foreground">{t("rosterTitle")}</h3>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {rows.map((row) => (
          <li key={row.studentId} className="flex items-center gap-3 px-4 py-2">
            <span className="w-6 shrink-0 text-right font-mono text-caption text-muted-foreground">
              {row.no > 0 ? row.no : "—"}
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                row.status === "waiting" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {row.name}
              {row.no === 0 && (
                <span className="ml-2 text-caption text-muted-foreground">{t("leftClass")}</span>
              )}
            </span>
            <StatusChip row={row} gradedTotal={gradedTotal} />
            <span className="w-14 shrink-0 text-right">
              {row.percent !== null ? (
                <Badge variant="outline" className={cn("tabular-nums", gradeBadgeClass(row.percent))}>
                  {row.percent}%
                </Badge>
              ) : (
                <span className="text-caption text-muted-foreground">—</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusChip({ row, gradedTotal }: { row: RunRosterRow; gradedTotal: number }) {
  const t = useTranslations("LaunchHub");
  if (row.status === "waiting") {
    return <span className="shrink-0 text-caption text-muted-foreground">{t("status_waiting")}</span>;
  }
  if (row.status === "done") {
    return <span className="shrink-0 text-caption text-success">{t("status_done")}</span>;
  }
  return (
    <span className="shrink-0 text-caption text-info">
      {t("status_working", { answered: row.answered, total: gradedTotal })}
    </span>
  );
}

function Hint({
  icon: Icon,
  tone = "info",
  children,
}: {
  icon: typeof Info;
  tone?: "info" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        tone === "warn" ? "border-warning/30 bg-warning/5" : "border-border bg-muted/40",
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", tone === "warn" ? "text-warning" : "text-muted-foreground")}
      />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
