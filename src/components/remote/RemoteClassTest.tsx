"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Camera, Check, ChevronLeft, ChevronRight, Eye, IdCard, Loader2, Play, RadioReceiver, Save, Trophy, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CardScanner from "@/components/scan/CardScanner";
import type { ClassTestStatus, RemoteCommand } from "@/lib/doska/remote-protocol";
import { remoteScanTicketAction } from "@/server/actions/doska-remote";

/* ════════════════════════════════════════════════════════════════════
   SINF TESTI — telefon tomoni (docs/sinf-testi-spec.md).

   Doskada QR-karta yoki radio pult testi ochiq boʻlsa, telefon uni
   boshqaradi: boshlash, «Javobni koʻrsatish», keyingi/oldingi savol,
   yakunlash va jurnalga saqlash — hammasi Doskaning oʻz amallari.

   QR-kartada telefon — KAMERA: skaner Doskadagi joriy savolga
   ergashadi (`CardScanner` jonli rejimi), har tasdiqlangan karta darhol
   Doskaga ketadi va proyektorda oʻquvchi chipi yashil boʻladi. Toʻgʻri
   javob telefonga kelmaydi — baho Doskada (oʻqituvchi sessiyasi).

   Ismlar (kamerada «Ali · B») skaner chiptasi bilan olinadi — test
   egaligi serverda tekshiriladi (`remoteScanTicketAction`).
   ════════════════════════════════════════════════════════════════════ */

type Roster = Map<number, string>;

export function RemoteClassTest({
  status,
  ticket,
  command,
}: {
  status: ClassTestStatus;
  ticket: string;
  command: (cmd: RemoteCommand) => void;
}) {
  const t = useTranslations("Remote.test");
  const [camera, setCamera] = React.useState(false);
  const [roster, setRoster] = React.useState<{ key: string; names: Roster } | null>(null);
  const [rosterBusy, setRosterBusy] = React.useState(false);
  const [rosterError, setRosterError] = React.useState<string | null>(null);
  const rosterKey = `${status.setId}:${status.classId}`;
  const names = roster?.key === rosterKey ? roster.names : null;

  const test = (action: Extract<RemoteCommand, { type: "test" }>["action"]) => command({ type: "test", action });
  const last = status.index >= status.total - 1;
  const cards = status.source === "cards";

  async function openCamera() {
    if (names) {
      setCamera(true);
      return;
    }
    setRosterBusy(true);
    setRosterError(null);
    try {
      const res = await remoteScanTicketAction({ ticket, setId: status.setId, classId: status.classId });
      if (!res.ok) {
        setRosterError(t(res.reason === "expired" ? "errorExpired" : "errorRoster"));
        return;
      }
      setRoster({ key: rosterKey, names: new Map(res.plan.roster.map((r) => [r.no, r.name])) });
      setCamera(true);
    } catch {
      setRosterError(t("errorNetwork"));
    } finally {
      setRosterBusy(false);
    }
  }

  // Test yopilsa yoki saqlansa — kamera ham yopiladi.
  const cameraOpen = camera && names && cards && status.phase !== "final" && !status.saved;

  if (cameraOpen) {
    const lobby = status.phase === "lobby";
    const q = lobby ? 0 : status.questionNo;
    return (
      <CardScanner
        questionCount={Math.max(status.total, 1)}
        nameByRef={names}
        onFinish={() => setCamera(false)}
        onClose={() => setCamera(false)}
        live={{
          question: q,
          title: lobby
            ? t("checkCards")
            : t("questionOf", { current: status.index + 1, total: status.total }),
          onConfirm: (no, answer) => command({ type: "card", q, no, letter: answer }),
          actions: lobby ? (
            <Button size="lg" onClick={() => test("start")}>
              <Play className="size-4" /> {t("start")}
            </Button>
          ) : status.phase === "question" ? (
            <>
              {!status.revealed && (
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => {
                    test("reveal");
                    setCamera(false);
                  }}
                >
                  <Eye className="size-4" /> {t("reveal")}
                </Button>
              )}
              <Button size="lg" onClick={() => test("next")}>
                {last ? t("toFinal") : t("next")} <ChevronRight className="size-4" />
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => test("next")}>
              {last ? t("toFinal") : t("next")} <ChevronRight className="size-4" />
            </Button>
          ),
        }}
      />
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {cards ? (
          <IdCard className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <RadioReceiver className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{status.title}</span>
        <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
          {status.phase === "lobby" || status.phase === "final"
            ? t(`phase_${status.phase}`)
            : `${status.index + 1} / ${status.total}`}
        </span>
      </div>

      <p className="text-body text-foreground">
        {status.phase === "lobby"
          ? t(cards ? "presentCards" : "presentPult", { count: status.answered, total: status.rosterSize })
          : status.phase === "final"
            ? status.saved
              ? t("saved")
              : t("finalHint")
            : t("answered", { answered: status.answered, total: status.rosterSize })}
      </p>
      {!cards && !status.connected && <p className="text-caption text-warning">{t("pultNotConnected")}</p>}
      {rosterError && <p className="text-caption text-destructive">{rosterError}</p>}

      {/* ── Kutish zali ── */}
      {status.phase === "lobby" && (
        <>
          {cards && (
            <Button variant="outline" className="h-12 w-full gap-2 text-base shadow-none" disabled={rosterBusy} onClick={() => void openCamera()}>
              {rosterBusy ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
              {t("checkCards")}
            </Button>
          )}
          <Button className="h-16 w-full gap-2 text-lg" onClick={() => test("start")}>
            <Play className="size-6" /> {t("start")}
          </Button>
        </>
      )}

      {/* ── Savol ── */}
      {status.phase === "question" && (
        <>
          {cards && !status.revealed && (
            <Button className="h-16 w-full gap-2 text-lg" disabled={rosterBusy} onClick={() => void openCamera()}>
              {rosterBusy ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
              {t("scan")}
            </Button>
          )}
          {!status.revealed && (
            <Button variant="secondary" className="h-12 w-full gap-2 text-base" onClick={() => test("reveal")}>
              <Eye className="size-5" /> {t("reveal")}
            </Button>
          )}
          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <Button
              variant="outline"
              className="h-16 shadow-none"
              disabled={status.index <= 0}
              onClick={() => test("prev")}
              aria-label={t("prev")}
            >
              <ChevronLeft className="size-6" />
            </Button>
            <Button className="h-16 gap-1 text-lg" variant={cards && !status.revealed ? "outline" : "default"} onClick={() => test("next")}>
              {last ? t("toFinal") : t("next")} <ChevronRight className="size-6" />
            </Button>
          </div>
        </>
      )}

      {/* ── Savol natijasi ── */}
      {status.phase === "results" && (
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Button variant="outline" className="h-16 shadow-none" onClick={() => test("prev")} aria-label={t("backToQuestion")}>
            <ChevronLeft className="size-6" />
          </Button>
          <Button className="h-16 gap-1 text-lg" onClick={() => test("next")}>
            {last ? t("toFinal") : t("next")} <ChevronRight className="size-6" />
          </Button>
        </div>
      )}

      {/* ── Yakuniy natijalar ── */}
      {status.phase === "final" && (
        <>
          {status.saved ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <Check className="size-4" /> {t("savedShort")}
            </p>
          ) : (
            <Button className="h-16 w-full gap-2 text-lg" disabled={status.saving} onClick={() => test("save")}>
              {status.saving ? <Loader2 className="size-6 animate-spin" /> : <Save className="size-6" />}
              {status.saving ? t("saving") : t("save")}
            </Button>
          )}
          <Button variant="outline" className="h-12 w-full gap-2 shadow-none" onClick={() => test("prev")}>
            <ChevronLeft className="size-5" /> {t("backToQuestions")}
          </Button>
        </>
      )}

      {status.phase !== "lobby" && status.phase !== "final" && (
        <Button variant="ghost" className="h-10 w-full gap-2 text-muted-foreground" onClick={() => test("finish")}>
          <Trophy className="size-4" /> {t("finish")}
        </Button>
      )}
      {(status.phase === "lobby" || status.saved) && (
        <Button variant="ghost" className="h-10 w-full gap-2 text-muted-foreground" onClick={() => test("close")}>
          <X className="size-4" /> {t("close")}
        </Button>
      )}
    </section>
  );
}
