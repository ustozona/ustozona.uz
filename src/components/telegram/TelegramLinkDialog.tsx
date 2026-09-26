"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeaderBar } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { TelegramIcon } from "@/components/telegram-icon";
import {
  getLessonLabLinkStatusAction,
  startTelegramLinkAction,
} from "@/server/actions/account-link";

/* ════════════════════════════════════════════════════════════════════
   TELEGRAMNI ULASH — @uzlessonlabbot orqali (yagona bogʻlash yoʻli)

   Yaratuvchi qarori (2026-09-26): Ustozona'da Telegram bogʻlanishi
   TOʻLIQ @uzlessonlabbot'da. Keyingi bosqichda Ustozona boti
   funksiyalari ham shu botga koʻchadi va u yagona Ustozona botiga
   aylanadi. Shu sabab bu oyna Sozlamalar, Profil, bosh sahifa banneri
   va oʻyinlar — hammasida bitta.

   Oqim:
     sayt 4 xonali kod koʻrsatadi → odam botni ochadi (telefonda tugma,
     kompyuterda QR) → bot qaysi Ustozona akkaunti bogʻlanayotganini
     koʻrsatadi va SHU kodni uch variant ichidan tanlatadi → oyna
     2 soniyada bir holatni soʻraydi va bogʻlangach yopiladi.

   Kod nega kerak — `dal/account-link.ts: confirmCodeOf` izohi: begona
   yuborgan havolani koʻr-koʻrona bosgan odam bogʻlanib qolmasin.
   ════════════════════════════════════════════════════════════════════ */

type Ready = { deepLink: string; confirmCode: string; qrSvg: string; expiresAt: number };

type Phase =
  | { kind: "starting" }
  | { kind: "error" }
  | { kind: "waiting"; ready: Ready }
  | { kind: "linked" }
  | { kind: "expired" };

const POLL_MS = 2000;

export function TelegramLinkDialog({
  open,
  onOpenChange,
  onLinked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: () => void;
}) {
  const t = useTranslations("TelegramLink");
  const [phase, setPhase] = React.useState<Phase>({ kind: "starting" });
  const [attempt, setAttempt] = React.useState(0);
  const inflight = React.useRef(false);
  const onLinkedRef = React.useRef(onLinked);
  React.useEffect(() => {
    onLinkedRef.current = onLinked;
  }, [onLinked]);

  // Ochilganda (va «Qaytadan» bosilganda) — havola. Faol kod boʻlsa
  // oʻshani qaytaradi (server tomoni idempotent), yaʼni oynani qayta
  // ochish telefondagi ochiq havolani bekor qilmaydi.
  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    setPhase({ kind: "starting" });
    startTelegramLinkAction()
      .then((res) => {
        if (!alive) return;
        if ("failed" in res) return setPhase({ kind: "error" });
        if (res.linked) return setPhase({ kind: "linked" });
        setPhase({
          kind: "waiting",
          ready: {
            deepLink: res.deepLink,
            confirmCode: res.confirmCode,
            qrSvg: res.qrSvg,
            expiresAt: Date.now() + res.expiresInMinutes * 60_000,
          },
        });
      })
      .catch(() => alive && setPhase({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [open, attempt]);

  const waiting = phase.kind === "waiting";

  const poll = React.useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;
    try {
      const next = await getLessonLabLinkStatusAction();
      setPhase((p) => {
        if (p.kind !== "waiting") return p;
        if (!("failed" in next) && next.linked) return { kind: "linked" };
        return Date.now() > p.ready.expiresAt ? { kind: "expired" } : p;
      });
    } catch {
      // Tarmoq uzilishi — keyingi urinishda davom etadi.
    } finally {
      inflight.current = false;
    }
  }, []);

  React.useEffect(() => {
    if (!open || !waiting) return;
    const id = window.setInterval(poll, POLL_MS);
    // Telefonda odam Telegramga oʻtib qaytadi — qaytishi bilan darhol tekshiramiz.
    const onVisible = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, waiting, poll]);

  React.useEffect(() => {
    if (phase.kind === "linked") onLinkedRef.current?.();
  }, [phase.kind]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeaderBar
          icon={<TelegramIcon className="size-4" />}
          title={t("title")}
          description={t("description")}
        />

        {phase.kind === "starting" && (
          <div className="flex items-center justify-center gap-2 p-6 text-body text-muted-foreground">
            <Spinner />
            {t("starting")}
          </div>
        )}

        {phase.kind === "waiting" && <WaitingBody ready={phase.ready} />}
        {phase.kind === "linked" && <Outcome tone="ok" text={t("linked")} />}
        {phase.kind === "expired" && <Outcome tone="error" text={t("expired")} />}
        {phase.kind === "error" && <Outcome tone="error" text={t("failed")} />}

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          {(phase.kind === "error" || phase.kind === "expired") && (
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              {t("retry")}
            </Button>
          )}
          <Button variant={waiting ? "outline" : "default"} onClick={() => onOpenChange(false)}>
            {waiting ? t("cancel") : t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WaitingBody({ ready }: { ready: Ready }) {
  const t = useTranslations("TelegramLink");
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
          <span className="font-mono text-headline tracking-widest tabular-nums">{ready.confirmCode}</span>
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

      <p className="text-caption text-muted-foreground">{t("safety")}</p>

      <div className="flex items-center gap-2 text-body text-muted-foreground" aria-live="polite">
        <Spinner className="shrink-0" />
        {t("waiting")}
      </div>
    </div>
  );
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
