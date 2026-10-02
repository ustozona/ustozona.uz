"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft, ChevronRight, Eye, EyeOff, FileText, IdCard, Loader2, MonitorUp, Presentation, ScanLine, Smartphone, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ScanPanel from "@/components/scan/ScanPanel";
import type { RealtimeConfig } from "@/lib/live-session";
import { REMOTE_EVENTS, parseRemoteState, type RemoteCommand, type RemoteState } from "@/lib/doska/remote-protocol";
import { useRealtimeChannel } from "@/hooks/useRealtimeChannel";
import { remoteScanTicketAction } from "@/server/actions/doska-remote";

/* ════════════════════════════════════════════════════════════════════
   USTOZ PULTI — telefon tomoni (docs/ustoz-pulti-spec.md).

   Oʻqituvchi dars paytida telefonga qaraydi — demak hamma narsa YIRIK
   va bir qoʻl bilan: pastda katta «Keyingi», tepada holat. Telefon
   Doskaning holatini koʻrsatadi (Doska — hokimiyat) va buyruq yuboradi.

   Tekshirish shu yerda: Doskadagi taqdimot testi QR-karta yoki varaq
   skaneri bilan tekshiriladi (mavjud `ScanPanel` — Topshiriqlardagi
   bilan aynan bir xil yoʻl, natija `responses` ga, jurnalga yozish
   kompyuterda bitta tugma bilan). Skaner chiptasini server pult
   chiptasidan beradi va test egaligini tekshiradi.

   Ekran oʻchib qolmasin — Wake Lock (brauzer qoʻllasa).
   ════════════════════════════════════════════════════════════════════ */

const HELLO_MS = 20_000;

type ScanMode = "cards" | "sheets";
type ScanInfo = Extract<Awaited<ReturnType<typeof remoteScanTicketAction>>, { ok: true }>;

export function RemotePhone({ ticket, topic, config }: { ticket: string; topic: string; config: RealtimeConfig }) {
  const t = useTranslations("Remote");
  const [state, setState] = React.useState<RemoteState | null>(null);

  const onMessage = React.useCallback(
    (event: string, payload: unknown, reply: (event: string, payload: unknown) => boolean) => {
      if (event === "__joined") {
        reply(REMOTE_EVENTS.command, { type: "hello" } satisfies RemoteCommand);
        return;
      }
      if (event === REMOTE_EVENTS.state) {
        const next = parseRemoteState(payload);
        if (next) setState(next);
      }
    },
    [],
  );
  const { connected, send } = useRealtimeChannel(topic, config, onMessage);
  const command = React.useCallback((cmd: RemoteCommand) => send(REMOTE_EVENTS.command, cmd), [send]);

  // Davriy salom — Doska «telefon ulangan» belgisini ushlab tursin va holat yangilansin.
  React.useEffect(() => {
    if (!connected) return;
    const id = window.setInterval(() => command({ type: "hello" }), HELLO_MS);
    return () => window.clearInterval(id);
  }, [connected, command]);

  useWakeLock();

  /* ── Skaner ── */
  const [scan, setScan] = React.useState<{ mode: ScanMode; info: ScanInfo } | null>(null);
  const [scanBusy, setScanBusy] = React.useState<ScanMode | null>(null);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const pres = state?.presentation ?? null;

  async function openScanner(mode: ScanMode) {
    if (!pres?.classId) return;
    setScanBusy(mode);
    setScanError(null);
    try {
      const res = await remoteScanTicketAction({ ticket, setId: pres.setId, classId: pres.classId });
      if (!res.ok) {
        setScanError(res.reason === "expired" ? t("errors.expired") : t("errors.notFound"));
        return;
      }
      if (mode === "sheets" && !res.engineReady) {
        setScanError(t("errors.engine"));
        return;
      }
      setScan({ mode, info: res });
    } catch {
      setScanError(t("errors.network"));
    } finally {
      setScanBusy(null);
    }
  }

  if (scan && pres?.classId) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setScan(null)} aria-label={t("back")}>
            <X />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{scan.info.title}</p>
            <p className="truncate text-caption text-muted-foreground">
              {scan.info.className} · {t("questionCount", { count: scan.info.plan.questionCount })}
            </p>
          </div>
        </div>
        <ScanPanel
          setId={pres.setId}
          classId={pres.classId}
          ticket={scan.info.scanTicket}
          mode={scan.mode}
          plan={scan.info.plan}
          onApplied={(report) => command({ type: "scanned", added: report.studentsAdded, answers: report.answersSaved })}
        />
      </main>
    );
  }

  const screens = state?.screens ?? [];
  const activeIndex = state ? screens.findIndex((s) => s.id === state.activeId) : -1;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 px-4 pb-6 pt-4">
      {/* Holat */}
      <header className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Smartphone className="size-5 text-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-title-sm text-foreground">{state?.lessonTitle || t("title")}</p>
          <p className={cn("flex items-center gap-1.5 text-caption", connected && state ? "text-success" : "text-muted-foreground")}>
            <span className={cn("size-2 rounded-full", connected && state ? "bg-success" : "bg-muted-foreground/50")} />
            {connected ? (state ? t("connected") : t("waitingBoard")) : t("connecting")}
          </p>
        </div>
        {state && (
          <Button
            variant="outline"
            size="sm"
            className={cn("shrink-0 gap-1.5 shadow-none", state.curtain && "border-foreground/40 bg-muted")}
            onClick={() => command({ type: "curtain" })}
          >
            {state.curtain ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            {state.curtain ? t("curtainOff") : t("curtainOn")}
          </Button>
        )}
      </header>

      {!state && (
        <section className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-body text-muted-foreground">{t("waitingHint")}</p>
        </section>
      )}

      {/* Taqdimot — joriy qadam */}
      {state && pres && (
        <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Presentation className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{pres.title}</span>
            <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
              {pres.total ? pres.index + 1 : 0} / {pres.total}
            </span>
          </div>
          <p className="text-caption text-muted-foreground">
            {pres.shape === "slide" ? t("stepSlide") : t("stepQuestion")}
            {pres.live ? ` · ${t("live", { code: pres.live.joinCode, joined: pres.live.joined })}` : ""}
          </p>
          {pres.stepText && <p className="line-clamp-3 text-reading text-foreground">{pres.stepText}</p>}
          {pres.canReveal && (
            <Button variant={pres.revealed ? "outline" : "secondary"} className="h-12 w-full gap-2 text-base" onClick={() => command({ type: "reveal" })}>
              {pres.revealed ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              {pres.revealed ? t("hideAnswer") : t("revealAnswer")}
            </Button>
          )}
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <Button
              variant="outline"
              className="h-16 gap-1 text-base shadow-none"
              disabled={pres.index <= 0}
              onClick={() => command({ type: "step", to: "prev" })}
              aria-label={t("prevStep")}
            >
              <ChevronLeft className="size-6" />
            </Button>
            <Button
              className="h-16 gap-1 text-lg"
              disabled={pres.index >= pres.total - 1}
              onClick={() => command({ type: "step", to: "next" })}
            >
              {t("nextStep")} <ChevronRight className="size-6" />
            </Button>
          </div>
        </section>
      )}

      {state && !pres && (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-caption text-muted-foreground">{t("noPresentation")}</p>
      )}

      {/* Tekshirish — shu test telefon kamerasi bilan */}
      {state && pres?.classId && pres.mcqCount > 0 && (
        <section className="flex flex-col gap-2">
          <span className="text-label text-muted-foreground">{t("checkTitle")}</span>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-14 justify-start gap-2 shadow-none" disabled={!!scanBusy} onClick={() => void openScanner("cards")}>
              {scanBusy === "cards" ? <Loader2 className="size-5 animate-spin" /> : <IdCard className="size-5" />}
              {t("scanCards")}
            </Button>
            <Button variant="outline" className="h-14 justify-start gap-2 shadow-none" disabled={!!scanBusy} onClick={() => void openScanner("sheets")}>
              {scanBusy === "sheets" ? <Loader2 className="size-5 animate-spin" /> : <FileText className="size-5" />}
              {t("scanSheets")}
            </Button>
          </div>
          {scanError && <p className="text-caption text-destructive">{scanError}</p>}
          <p className="flex gap-2 text-caption text-muted-foreground">
            <ScanLine className="mt-0.5 size-3.5 shrink-0" /> {t("checkHint")}
          </p>
        </section>
      )}

      {/* Ekranlar */}
      {state && screens.length > 0 && (
        <section className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MonitorUp className="size-4 text-muted-foreground" />
            <span className="text-label text-muted-foreground">{t("screens")}</span>
            <span className="flex-1" />
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {activeIndex + 1} / {screens.length}
            </span>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {screens.map((sc, i) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => command({ type: "screen-goto", id: sc.id })}
                aria-current={sc.id === state.activeId ? "true" : undefined}
                className={cn(
                  "flex h-14 w-32 shrink-0 flex-col justify-center rounded-lg border px-3 text-left transition-colors",
                  sc.id === state.activeId ? "border-foreground/50 bg-muted" : "border-border hover:bg-muted/50",
                )}
              >
                <span className="text-caption tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="truncate text-sm text-foreground">{sc.label || t("screenEmpty")}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12 gap-1 shadow-none"
              disabled={activeIndex <= 0}
              onClick={() => command({ type: "screen", to: "prev" })}
            >
              <ChevronLeft className="size-5" /> {t("prevScreen")}
            </Button>
            <Button
              variant="outline"
              className="h-12 gap-1 shadow-none"
              disabled={activeIndex < 0 || activeIndex >= screens.length - 1}
              onClick={() => command({ type: "screen", to: "next" })}
            >
              {t("nextScreen")} <ChevronRight className="size-5" />
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}

/** Dars davomida telefon ekrani oʻchmasin (qoʻllanmasa — jim). */
function useWakeLock() {
  React.useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<Sentinel> } };
    if (!nav.wakeLock) return;
    let lock: Sentinel | null = null;
    let disposed = false;
    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      nav.wakeLock!
        .request("screen")
        .then((l) => {
          if (disposed) void l.release();
          else lock = l;
        })
        .catch(() => {});
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release().catch(() => {});
    };
  }, []);
}
