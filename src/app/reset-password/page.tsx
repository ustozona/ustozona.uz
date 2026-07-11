"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) {
      setError("Havola notoʻgʻri yoki muddati oʻtgan. Qayta soʻrov yuboring.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    if (newPassword.length < 8) {
      setError("Parol kamida 8 belgidan iborat boʻlsin.");
      return;
    }
    setPending(true);
    setError(null);
    const { error: err } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (err) {
      setError("Parolni yangilashda xatolik yuz berdi. Havola muddati oʻtgan boʻlishi mumkin.");
      return;
    }
    router.push("/login");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-2xl font-medium">Yangi parol oʻrnating</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Hisobingiz uchun yangi parol kiriting.
          </p>
        </div>

        {!token ? (
          <FieldDescription className="text-center text-destructive">
            Havola notoʻgʻri yoki muddati oʻtgan. <a href="/forgot-password">Qayta soʻrov yuboring</a>.
          </FieldDescription>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="password">Yangi parol</FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Kamida 8 belgi"
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
                {pending ? "Yangilanmoqda…" : "Parolni yangilash"}
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
