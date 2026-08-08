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
import { Checkbox } from "@/components/ui/checkbox";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { GoogleIcon } from "@/components/google-icon";
import { TelegramIcon } from "@/components/telegram-icon";

export function LoginForm({
  className,
  telegramSignupUrl,
  ...props
}: React.ComponentProps<"form"> & { telegramSignupUrl?: string }) {
  const t = useTranslations("LoginForm");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const ERROR_MAP: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: t("errors.invalidEmailOrPassword"),
    USER_NOT_FOUND: t("errors.userNotFound"),
    INVALID_EMAIL: t("errors.invalidEmail"),
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      rememberMe,
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

        {/* Google eng tepada — bir bosishli kirish eng past ishqalanishli yoʻl. */}
        <Field>
          <Button variant="outline" type="button" onClick={handleGoogle}>
            <GoogleIcon className="h-4 w-4" />
            {t("continueWithGoogle")}
          </Button>
        </Field>

        {/* Telegram — LessonLab boti orqali.

            Kirish sahifasida ham turadi (nafaqat roʻyxatda): akkaunti
            YOʻQ odam koʻpincha shu yerga tushadi, «Roʻyxatdan oʻtish»
            havolasini izlab ketmasligi kerak. Bot allaqachon bogʻlangan
            odamni tanib oladi va uni ortiqcha qadamga yubormaydi.

            ⚠️ `<a>` — ataylab, `Link` emas: bu tashqi (t.me) havola. */}
        {telegramSignupUrl && (
          <Field>
            <Button variant="outline" type="button" asChild>
              <a href={telegramSignupUrl}>
                <TelegramIcon className="h-4 w-4" />
                {t("continueWithTelegram")}
              </a>
            </Button>
          </Field>
        )}

        <FieldSeparator>{t("orWithEmail")}</FieldSeparator>

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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
            <a href="/forgot-password" className="ml-auto text-sm underline-offset-2 hover:underline">
              {t("forgotPassword")}
            </a>
          </div>
          <PasswordInput
            id="password"
            name="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="current-password"
            required
          />
        </Field>

        <Field orientation="horizontal" className="items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(v) => setRememberMe(v === true)}
          />
          <FieldLabel htmlFor="remember" className="font-normal cursor-pointer">
            {t("rememberMe")}
          </FieldLabel>
        </Field>

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        <Field>
          <RainbowButton type="submit" disabled={pending} className="w-full h-9">
            {pending ? t("signingIn") : t("signIn")}
          </RainbowButton>
        </Field>

        <FieldDescription className="text-center">
          {t("noAccount")}{" "}
          <a href="/register" className="font-medium text-foreground hover:underline">
            {t("getStartedFree")}
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

export default LoginForm;
