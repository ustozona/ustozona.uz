"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeaderBar } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { TelegramIcon } from "@/components/telegram-icon";
import { postAuthRedirect } from "@/lib/pending-link";
import {
  cancelTgAuthAction,
  pollTgAuthAction,
  startTgAuthAction,
} from "@/server/actions/tg-auth";
import type { TgAuthKind, TgAuthPoll } from "@/lib/tg-auth-types";

/* ════════════════════════════════════════════════════════════════════
   TELEGRAM ORQALI KIRISH / ULASH OYNASI

   Sayt kod koʻrsatadi → odam botni ochadi → botda SHU kodni tanlaydi →
   oyna 2 soniyada bir holatni soʻraydi va tasdiq kelgach davom etadi.

   Sessiya AYNAN shu brauzerda ochiladi (httpOnly cookie'dagi sir
   orqali) — Telegram ichidagi brauzerda emas. Toʻliq sabab:
   `server/db/schema/telegram.ts` → `tgAuthRequests`.
   ════════════════════════════════════════════════════════════════════ */

type Ready = { deepLink: string; code: string; qrSvg: string; expiresAt: number };

type Phase =
  | { kind: "starting" }
  | { kind: "error" }
  | { kind: "live"; ready: Ready; status: TgAuthPoll };

const POLL_MS = 2000;
const LIVE: TgAuthPoll[] = ["waiting", "awaiting_phone", "none"];

export function TelegramAuthDialog({
  kind,
  open,
  onOpenChange,
  onLinked,
}: {
  kind: TgAuthKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** link: ulangach (sozlamalar holatni qayta oʻqiydi). */
  onLinked?: () => void;
}) {
  const t = useTranslations("TelegramAuth");
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>({ kind: "starting" });
  const [attempt, setAttempt] = React.useState(0);
  const inflight = React.useRef(false);
  const onLinkedRef = React.useRef(onLinked);
  React.useEffect(() => {
    onLinkedRef.current = onLinked;
  }, [onLinked]);

  // Ochilganda (va «Qaytadan» bosilganda) — yangi soʻrov.
  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    setPhase({ kind: "starting" });
    startTgAuthAction(kind)
      .then((res) => {
        if (!alive) return;
        if (!res.ok) return setPhase({ kind: "error" });
        setPhase({
          kind: "live",
          status: "waiting",
          ready: {
            deepLink: res.deepLink,
            code: res.code,
            qrSvg: res.qrSvg,
            expiresAt: Date.now() + res.expiresInSeconds * 1000,
          },
        });
      })
      .catch(() => alive && setPhase({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [open, kind, attempt]);

  const status = phase.kind === "live" ? phase.status : null;
  const polling = status !== null && LIVE.includes(status);

  const poll = React.useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const next = await pollTgAuthAction();
      setPhase((p) => {
        if (p.kind !== "live") return p;
        // Muddat mijozda ham kuzatiladi — server «none» qaytarsa ham.
        const expired = LIVE.includes(next) && Date.now() > p.ready.expiresAt;
        return { ...p, status: expired ? "expired" : next };
      });
    } catch {
      // Tarmoq uzilishi — keyingi urinishda davom etadi.
    } finally {
      inflight.current = false;
    }
  }, []);

  React.useEffect(() => {
    if (!open || !polling) return;
    const id = window.setInterval(poll, POLL_MS);
    // Telefonda odam Telegramga oʻtib qaytadi — qaytishi bilan darhol tekshiramiz.
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, polling, poll]);

  React.useEffect(() => {
    if (status === "signed_in") {
      router.replace(postAuthRedirect("/dashboard"));
      router.refresh();
    }
    if (status === "linked") onLinkedRef.current?.();
  }, [status, router]);

  const handleOpenChange = (next: boolean) => {
    if (!next && polling) void cancelTgAuthAction();
    onOpenChange(next);
  };

  const title = kind === "login" ? t("titleLogin") : t("titleLink");
  const description = kind === "login" ? t("descLogin") : t("descLink");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeaderBar
          icon={<TelegramIcon className="size-[18px]" />}
          title={title}
          description={description}
        />

        {phase.kind === "starting" && (
          <div className="flex items-center justify-center gap-2 p-6 text-body text-muted-foreground">
            <Spinner />
            {t("starting")}
          </div>
        )}

        {phase.kind === "error" && (
          <Outcome tone="error" text={t("failed")} />
        )}

        {phase.kind === "live" && polling && <LiveBody ready={phase.ready} status={phase.status} />}

        {phase.kind === "live" && !polling && <Outcome {...outcomeOf(phase.status, t)} />}

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          {(phase.kind === "error" ||
            (phase.kind === "live" && ["expired", "rejected"].includes(phase.status))) && (
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              {t("retry")}
            </Button>
          )}
          <Button variant={polling ? "outline" : "default"} onClick={() => handleOpenChange(false)}>
            {polling ? t("cancel") : t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LiveBody({ ready, status }: { ready: Ready; status: TgAuthPoll }) {
  const t = useTranslations("TelegramAuth");
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center gap-5">
        {/* QR — faqat kompyuterda: telefonda odam shu qurilmaning oʻzida tugmani bosadi. */}
        <div
          aria-label={t("qrHint")}
          role="img"
          className="hidden size-36 shrink-0 overflow-hidden rounded-lg border border-border md:block [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: ready.qrSvg }}
        />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-label text-muted-foreground">{t("codeLabel")}</span>
          <span className="font-mono text-headline tracking-widest tabular-nums">{ready.code}</span>
          <p className="text-caption text-muted-foreground">{t("codeHint")}</p>
          <p className="hidden text-caption text-muted-foreground md:block">{t("qrHint")}</p>
        </div>
      </div>

      <Button asChild size="lg" className="w-full">
        <a href={ready.deepLink} target="_blank" rel="noopener noreferrer">
          <TelegramIcon className="size-4" />
          {t("openTelegram")}
        </a>
      </Button>

      <div className="flex items-center gap-2 text-body text-muted-foreground" aria-live="polite">
        <Spinner className="shrink-0" />
        {status === "awaiting_phone" ? t("awaitingPhone") : t("waiting")}
      </div>
    </div>
  );
}

function outcomeOf(
  status: TgAuthPoll,
  t: ReturnType<typeof useTranslations<"TelegramAuth">>
): { tone: "ok" | "error"; text: string } {
  switch (status) {
    case "signed_in":
      return { tone: "ok", text: t("signedIn") };
    case "linked":
      return { tone: "ok", text: t("linked") };
    case "rejected":
      return { tone: "error", text: t("rejected") };
    case "has_account":
      return { tone: "error", text: t("hasAccount") };
    case "taken_tg":
      return { tone: "error", text: t("takenTg") };
    case "taken_uz":
      return { tone: "error", text: t("takenUz") };
    case "banned":
      return { tone: "error", text: t("banned") };
    case "expired":
      return { tone: "error", text: t("expired") };
    default:
      return { tone: "error", text: t("failed") };
  }
}

function Outcome({ tone, text }: { tone: "ok" | "error"; text: string }) {
  const Icon = tone === "ok" ? CircleCheck : CircleAlert;
  return (
    <div className="flex items-start gap-3 p-6" aria-live="polite">
      <Icon
        aria-hidden
        className={tone === "ok" ? "mt-0.5 size-5 shrink-0 text-success" : "mt-0.5 size-5 shrink-0 text-destructive"}
      />
      <p className="text-body">{text}</p>
    </div>
  );
}
