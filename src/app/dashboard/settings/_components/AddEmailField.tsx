"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getEmailAddStateAction,
  requestEmailAddAction,
} from "@/server/actions/email-add";
import type { EmailAddRequestResult, EmailAddState } from "@/lib/email-add-types";

type Reason = Extract<EmailAddRequestResult, { ok: false }>["reason"];

const REASON_KEY: Record<Reason, string> = {
  invalid: "addEmailInvalid",
  taken: "addEmailTaken",
  too_soon: "addEmailTooSoon",
  too_many: "addEmailTooMany",
  has_email: "addEmailHasEmail",
  send_failed: "addEmailSendFailed",
};

/* Telegram orqali ochilgan (emailsiz) hisob — email qoʻshish.

   Hisobda haqiqiy email boʻlsa `fallback` (odatiy oʻqish-uchun maydon)
   koʻrsatiladi. Holat yuklanguncha ham oʻsha — forma sakrab chiqmasin. */
export function AddEmailField({ fallback }: { fallback: React.ReactNode }) {
  const t = useTranslations("ProfileSection");
  const [state, setState] = React.useState<EmailAddState | undefined>(undefined);
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    getEmailAddStateAction()
      .then(setState)
      .catch(() => setState(null));
  }, []);

  if (!state) return <>{fallback}</>;

  const send = async (target: string) => {
    setBusy(true);
    setError(null);
    const r = await requestEmailAddAction(target).catch(
      (): EmailAddRequestResult => ({ ok: false, reason: "send_failed" })
    );
    setBusy(false);
    if (!r.ok) return setError(t(REASON_KEY[r.reason]));
    setState({ pending: { email: r.email, sentAt: new Date().toISOString() } });
    setEditing(false);
    toast.success(t("addEmailSentToast"));
  };

  const pending = !editing ? state.pending : null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="profile-email">{t("emailLabel")}</Label>
      {pending ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <p className="flex items-start gap-2 text-sm text-foreground">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 break-words">{t("addEmailSentTo", { email: pending.email })}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => send(pending.email)}>
              {t("addEmailResend")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setEmail(pending.email);
                setEditing(true);
                setError(null);
                // Qator O'CHIRILMAYDI: unda sutkalik hisoblagich turadi.
                // Yangi yuborish uni almashtiradi va eski havolani o'ldiradi.
              }}
            >
              {t("addEmailChange")}
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) void send(email);
          }}
        >
          <Input
            id="profile-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("addEmailPlaceholder")}
            aria-invalid={!!error}
          />
          <Button type="submit" disabled={busy || !email.trim()} className="shrink-0">
            {t("addEmailButton")}
          </Button>
        </form>
      )}
      <p className={error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
        {error ?? t("addEmailNote")}
      </p>
    </div>
  );
}
