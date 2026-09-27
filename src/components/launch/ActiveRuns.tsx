"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BookCheck, ChevronDown, ChevronRight, Radio } from "lucide-react";
import { classTints } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import { findShell } from "@/lib/baholash-shells";
import type { RunSummary } from "@/lib/launch-types";
import { listClassRunsAction } from "@/server/actions/assess-runs";
import { RUN_KIND_META } from "./launch-modes";
import { formatDue } from "./format";

/* ════════════════════════════════════════════════════════════════════
   «HOZIR OCHIQ» — sinfning ochiq va natijasi kutilayotgan ishlari.

   Ish yoʻqolmasin: oʻqituvchi uy vazifasini berib ketdi, ertaga
   qaytdi — «qayerda edi?» deb qidirmaydi, sahifa tepasida turibdi.
   Uch guruh, shu tartibda:
     • Ochiq           — bolalar hozir ishlayapti;
     • Natija kutmoqda — tugagan, lekin jurnalga hali yozilmagan;
     • Soʻnggi         — jurnalga yozilgan yoki baholanmaydigan (yigʻiq).
   ════════════════════════════════════════════════════════════════════ */

const REFRESH_MS = 30_000;

/** Sinf ishlari roʻyxati — 30 soniyada bir va `refresh()` bilan yangilanadi. */
export function useClassRuns(classId: string | null) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!classId) {
      setRuns([]);
      return;
    }
    let alive = true;
    const load = () =>
      listClassRunsAction(classId)
        .then((res) => {
          if (alive && res.ok) setRuns(res.data);
        })
        .catch(() => {
          /* yordamchi roʻyxat — kelmasa sahifa oddiy holicha ishlayveradi */
        });
    void load();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [classId, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  return { runs, refresh };
}

type Bucket = "open" | "waiting" | "recent";

/** Bolalar HOZIR kira oladimi — ochiq, muddati bor boʻlsa oʻtmagan va
    eskirmagan (`stale`: kechagi tashlab ketilgan jonli dars «hozir» emas). */
function isLive(run: RunSummary): boolean {
  return run.state === "running" && !run.pastDue && !run.stale && run.kind !== "offline";
}

function bucketOf(run: RunSummary): Bucket {
  if (run.publishedAssignmentId || !run.gradable) {
    // Jurnalga yozilgan yoki yoziladigan narsa yoʻq — faqat ochiq boʻlsa tepada.
    return isLive(run) ? "open" : "recent";
  }
  if (run.kind === "offline") return "waiting"; // varaq/karta/pult — natija tayyor
  // Tugagan, muddati oʻtgan yoki eskirgan — natija tayyor; qolgani (ochiq,
  // toʻxtatilgan, rejalashtirilgan) hali davom etyapti.
  return run.state === "completed" || run.pastDue || run.stale ? "waiting" : "open";
}

export function ActiveRuns({
  runs,
  onOpen,
}: {
  runs: RunSummary[];
  onOpen: (sessionId: string) => void;
}) {
  const t = useTranslations("LaunchHub");
  const [showRecent, setShowRecent] = useState(false);

  const groups = useMemo(() => {
    const out: Record<Bucket, RunSummary[]> = { open: [], waiting: [], recent: [] };
    for (const run of runs) out[bucketOf(run)].push(run);
    return out;
  }, [runs]);

  if (runs.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {groups.open.length > 0 && (
        <RunGroup
          title={t("activeTitle")}
          icon={<Radio className="size-3.5" />}
          runs={groups.open}
          onOpen={onOpen}
        />
      )}
      {groups.waiting.length > 0 && (
        <RunGroup
          title={t("activeWaitingTitle")}
          icon={<BookCheck className="size-3.5" />}
          runs={groups.waiting}
          onOpen={onOpen}
        />
      )}
      {groups.recent.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showRecent}
            onClick={() => setShowRecent((v) => !v)}
            className="flex w-fit items-center gap-1.5 text-caption font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn("size-3.5 transition-transform duration-fast", !showRecent && "-rotate-90")}
            />
            {t("activeRecentTitle", { count: groups.recent.length })}
          </button>
          {showRecent && (
            <div className="flex flex-col gap-2">
              {groups.recent.map((run) => (
                <RunCard key={run.sessionId} run={run} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunGroup({
  title,
  icon,
  runs,
  onOpen,
}: {
  title: string;
  icon: React.ReactNode;
  runs: RunSummary[];
  onOpen: (sessionId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-caption text-muted-foreground">{runs.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {runs.map((run) => (
          <RunCard key={run.sessionId} run={run} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function RunCard({ run, onOpen }: { run: RunSummary; onOpen: (sessionId: string) => void }) {
  const t = useTranslations("LaunchHub");
  const locale = useLocale();
  const meta = RUN_KIND_META[run.kind];
  const Icon = meta.icon;
  const tints = classTints(meta.color);
  const shell = run.shellId ? findShell(run.shellId) : null;
  const live = isLive(run);

  const parts = [
    shell ? `${t(`kind_${run.kind}`)} · ${shell.name}` : t(`kind_${run.kind}`),
    run.kind === "offline"
      ? t("activeEntered", { count: run.joined })
      : run.finished > 0 || run.state === "completed"
        ? t("activeProgress", { done: run.finished, total: run.rosterSize })
        : t("activeJoined", { joined: run.joined, total: run.rosterSize }),
    run.dueAt && !run.pastDue ? t("activeDue", { date: formatDue(run.dueAt, locale) }) : null,
    run.pastDue && run.state !== "completed" ? t("state_pastDue") : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onOpen(run.sessionId)}
      className="list-card group flex w-full items-center gap-3 py-3 pl-4 pr-3 text-left"
      style={{ ["--card-accent" as string]: tints.solid }}
    >
      <span
        className="relative flex size-9 shrink-0 items-center justify-center rounded-full text-white"
        style={tints.gradientTile}
      >
        <Icon className="size-4" />
        {live && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-pulse rounded-full border-2 border-card bg-success" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{run.title}</span>
        <span className="block truncate text-caption text-muted-foreground">{parts.join(" · ")}</span>
      </span>
      {run.publishedAssignmentId ? (
        <span className="hidden shrink-0 items-center gap-1 text-caption text-success sm:inline-flex">
          <BookCheck className="size-3.5" />
          {t("activePublished")}
        </span>
      ) : (
        run.joinCode &&
        live && (
          <span className="hidden shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-caption tracking-widest text-foreground sm:inline">
            {run.joinCode}
          </span>
        )
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
