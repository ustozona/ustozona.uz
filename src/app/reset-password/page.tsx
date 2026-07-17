"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

function ResetPasswordForm() {
  const t = useTranslations("ResetPasswordPage");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      setError(t("errors.invalidLink"));
      return;
    }
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    if (newPassword.length < 8) {
      setError(t("errors.passwordTooShort"));
      return;
    }
    setPending(true);
    setError(null);
    const { error: err } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (err) {
      setError(t("errors.updateFailed"));
      return;
    }
    router.push("/login");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-2xl font-medium">{t("title")}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t("subtitle")}
          </p>
        </div>

        {!token ? (
          <FieldDescription className="text-center text-destructive">
            {t("errors.invalidLink")} <a href="/forgot-password">{t("requestNewLink")}</a>.
          </FieldDescription>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="password">{t("newPasswordLabel")}</FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </Field>

            {error && (
              <p className="text-sm text-destructive text-center" role="alert">
                {error}
              </p>
            )}

            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? t("updating") : t("submit")}
              </Button>
            </Field>
          </>
        )}
      </FieldGroup>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell showFeatureLoop={false}>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
