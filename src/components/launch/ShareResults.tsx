"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, LoaderCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { shareResultsAction, shareStatusAction } from "@/server/actions/result-share";

/* ════════════════════════════════════════════════════════════════════
   NATIJANI TELEGRAMGA YUBORISH (docs/natija-telegram-spec.md).

   Ikki joyda, bitta mantiq:
     • `panel` — Topshiriqlardagi natija oynasi (`RunMonitor`), har qanday
       oʻtkazish turi uchun;
     • `board` — sinf testi sahnasining yakuniy ekrani (doim yorugʻ
       proyektor sahnasi, `class-test-board.css` tugmalari).

   Ikkala qabul qiluvchi alohida belgilanadi: ota-onalarga — farzandining
   natijasi; oʻqituvchiga — sinf xulosasi. Yuborish sessiya boʻyicha BIR
   MARTALIK: ekran ochilganda holat soʻraladi va yuborilgani koʻrsatiladi.
   ════════════════════════════════════════════════════════════════════ */

type Result = Awaited<ReturnType<typeof shareResultsAction>>;
type Status = Awaited<ReturnType<typeof shareStatusAction>>;
type Part = Extract<Result, { ok: true }>["teacher"];

export function ShareResults({ sessionId, variant = "panel" }: { sessionId: string; variant?: "panel" | "board" }) {
  const t = useTranslations("ResultShare");
  const [parents, setParents] = React.useState(true);
  const [teacher, setTeacher] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<Status | null>(null);
  const [result, setResult] = React.useState<Result | null>(null);

  React.useEffect(() => {
    let alive = true;
    shareStatusAction({ sessionId })
      .then((s) => alive && setStatus(s))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const parentsDone = Boolean(status?.parentsAt) || (result?.ok && result.parents.state === "sent");
  const teacherDone = Boolean(status?.teacherAt) || (result?.ok && result.teacher.state === "sent");

  async function send() {
    setBusy(true);
    try {
      const res = await shareResultsAction({ sessionId, parents: parents && !parentsDone, teacher: teacher && !teacherDone });
      setResult(res);
      if (res.ok) setStatus(await shareStatusAction({ sessionId }).catch(() => status));
    } catch {
      setResult({ ok: false, reason: "not_found" });
    } finally {
      setBusy(false);
    }
  }

  const lines: { tone: "ok" | "warn" | "err"; text: string }[] = [];
  const describe = (who: "parents" | "teacher", part: Part) => {
    switch (part.state) {
      case "sent":
        if (who === "teacher") lines.push({ tone: "ok", text: t("teacherSent") });
        else {
          lines.push({ tone: "ok", text: t("parentsSent", { sent: part.sent ?? 0, reached: part.reached ?? 0 }) });
          if (part.withoutParents) lines.push({ tone: "warn", text: t("withoutParents", { count: part.withoutParents }) });
        }
        return;
      case "off":
        return;
      default:
        lines.push({ tone: part.state === "already" || part.state === "empty" ? "warn" : "err", text: t(`state_${part.state}`) });
    }
  };
  if (result?.ok) {
    describe("parents", result.parents);
    describe("teacher", result.teacher);
  } else if (result && !result.ok) {
    lines.push({ tone: "err", text: t(result.reason === "impersonating" ? "impersonating" : "notFound") });
  } else {
    if (status?.parentsAt)
      lines.push({
        tone: "ok",
        text: status.parents
          ? t("parentsSent", { sent: status.parents.sent, reached: status.parents.reached })
          : t("parentsSentEarlier"),
      });
    if (status?.teacherAt) lines.push({ tone: "ok", text: t("teacherSent") });
  }

  const nothingLeft = Boolean(parentsDone && teacherDone);
  const canSend = !busy && !nothingLeft && ((parents && !parentsDone) || (teacher && !teacherDone));

  if (variant === "board") {
    return (
      <div className="ct-gc ct-save" style={{ flexDirection: "column", alignItems: "center" }}>
        <p>{t("boardTitle")}</p>
        {!nothingLeft && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem", justifyContent: "center" }}>
            <label className="ct-toggle">
              <input type="checkbox" checked={parents && !parentsDone} disabled={parentsDone} onChange={(e) => setParents(e.target.checked)} />
              {t("toParents")}
            </label>
            <label className="ct-toggle">
              <input type="checkbox" checked={teacher && !teacherDone} disabled={teacherDone} onChange={(e) => setTeacher(e.target.checked)} />
              {t("toMe")}
            </label>
            <button type="button" className="ct-btn" data-primary="true" disabled={!canSend} onClick={() => void send()}>
              {busy ? <LoaderCircle className="animate-spin" /> : <Send />}
              {busy ? t("sending") : t("send")}
            </button>
          </div>
        )}
        {lines.map((l, i) => (
          <p key={i} data-tone={l.tone === "ok" ? "ok" : l.tone === "err" ? "err" : undefined}>
            {l.text}
          </p>
        ))}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Send className="size-4" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="text-sm font-semibold text-foreground">{t("title")}</h3>
          <p className="text-caption text-muted-foreground">{t("hint")}</p>
        </div>
      </div>
      {!nothingLeft && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={parents && !parentsDone} disabled={parentsDone} onCheckedChange={(v) => setParents(v === true)} />
            {t("toParents")}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={teacher && !teacherDone} disabled={teacherDone} onCheckedChange={(v) => setTeacher(v === true)} />
            {t("toMe")}
          </label>
          <Button size="sm" className="ml-auto" loading={busy} disabled={!canSend} onClick={() => void send()}>
            {!busy && <Send />}
            {t("send")}
          </Button>
        </div>
      )}
      {lines.length > 0 && (
        <ul className="flex flex-col gap-1">
          {lines.map((l, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2 text-caption",
                l.tone === "ok" ? "text-success" : l.tone === "warn" ? "text-warning" : "text-destructive",
              )}
            >
              {l.tone === "ok" && <Check className="mt-0.5 size-3.5 shrink-0" />}
              {l.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
