"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { postAuthRedirect } from "@/lib/pending-link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { GoogleIcon } from "@/components/google-icon";

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
  const t = useTranslations("SignupForm");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ERROR_MAP: Record<string, string> = {
    USER_ALREADY_EXISTS: t("errors.userAlreadyExists"),
    PASSWORD_TOO_SHORT: t("errors.passwordTooShort"),
    PASSWORD_TOO_LONG: t("errors.passwordTooLong"),
    INVALID_EMAIL: t("errors.invalidEmail"),
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const name = `${firstName} ${lastName}`.trim();
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      setError(ERROR_MAP.PASSWORD_TOO_SHORT);
      return;
    }
    setPending(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({
      name,
      email: String(form.get("email") ?? ""),
      password,
    });
    if (err) {
      setPending(false);
      setError(ERROR_MAP[err.code ?? ""] ?? t("errors.generic"));
      return;
    }
    // LessonLab botidan bog'lash kutilayotgan bo'lsa /bogla ga
    // yo'naltiramiz — aks holda foydalanuvchi shu yerda qolib
    // ketadi va bog'lash hech qachon yakunlanmaydi (2026-08-08).
    router.push(postAuthRedirect("/dashboard"));
    router.refresh();
  };

  const handleGoogle = async () => {
    const { error: err } = await authClient.signIn.social({
      provider: "google",
      callbackURL: postAuthRedirect("/dashboard"),
    });
    if (err) {
      toast.error(t("googleNotConfigured"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-2xl font-medium">{t("title")}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t("subtitle")}
          </p>
        </div>

        {/* Google eng tepada — parol oʻylab topish eng katta toʻsiq. */}
        <Field>
          <Button variant="outline" type="button" onClick={handleGoogle}>
            <GoogleIcon className="h-4 w-4" />
            {t("continueWithGoogle")}
          </Button>
        </Field>

        <FieldSeparator>{t("orWithEmail")}</FieldSeparator>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="firstName">{t("firstNameLabel")}</FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder={t("firstNamePlaceholder")}
              autoComplete="given-name"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName">{t("lastNameLabel")}</FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder={t("lastNamePlaceholder")}
              autoComplete="family-name"
              required
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
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
          <RainbowButton type="submit" disabled={pending} className="w-full h-9">
            {pending ? t("creating") : t("submit")}
          </RainbowButton>
        </Field>

        <FieldDescription className="text-center">
          {t("haveAccount")}{" "}
          <a href="/login" className="font-medium text-foreground hover:underline">
            {t("signIn")}
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

export default SignupForm;
