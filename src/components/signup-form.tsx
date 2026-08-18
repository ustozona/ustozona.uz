"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { postAuthRedirect } from "@/lib/pending-link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { GoogleIcon } from "@/components/google-icon";
import { TelegramIcon } from "@/components/telegram-icon";

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parol kuchi — sof funksiya, uzunlik + belgi xilma-xilligi asosida.
    0–1 = zaif, 2 = oʻrtacha, 3 = kuchli. */
function getPasswordStrength(password: string): { score: 0 | 1 | 2 | 3; labelKey: "weak" | "medium" | "strong" } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password))) score++;
  const clamped = Math.min(score, 3) as 0 | 1 | 2 | 3;
  const labelKey = clamped <= 1 ? "weak" : clamped === 2 ? "medium" : "strong";
  return { score: clamped, labelKey };
}

export function SignupForm({
  className,
  telegramSignupUrl,
  ...props
}: React.ComponentProps<"form"> & { telegramSignupUrl?: string }) {
  const t = useTranslations("SignupForm");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [password, setPassword] = useState("");

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  /** Foydalanuvchi maydonni tuzata boshlagach xato darhol yoʻqoladi —
      aks holda u submit bosgunicha qizil xabar qarab turadi. */
  const clearError = (field: keyof FieldErrors) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

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
    const email = String(form.get("email") ?? "").trim();
    const name = `${firstName} ${lastName}`.trim();

    // Yagona validatsiya manbai — hamma tekshiruv shu yerda, natija
    // FieldError orqali tegishli maydon ostida chiqadi.
    const nextErrors: FieldErrors = {};
    if (!firstName) nextErrors.firstName = t("errors.required");
    if (!lastName) nextErrors.lastName = t("errors.required");
    if (!email) nextErrors.email = t("errors.required");
    else if (!EMAIL_PATTERN.test(email)) nextErrors.email = t("errors.invalidEmail");
    if (!password) nextErrors.password = t("errors.required");
    else if (password.length < 8) nextErrors.password = t("errors.passwordTooShort");

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setPending(true);
    setFieldErrors({});
    setGeneralError(null);
    const { error: err } = await authClient.signUp.email({ name, email, password });
    if (err) {
      setPending(false);
      const code = err.code ?? "";
      if (code === "USER_ALREADY_EXISTS" || code === "INVALID_EMAIL") {
        setFieldErrors({ email: ERROR_MAP[code] });
      } else if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
        setFieldErrors({ password: ERROR_MAP[code] });
      } else {
        setGeneralError(ERROR_MAP[code] ?? t("errors.generic"));
      }
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

  // noValidate — brauzerning oʻz popup validatsiyasini oʻchiradi, shunda
  // xabar bitta manbadan (fieldErrors → FieldError) chiqadi. Input'lardagi
  // `required`/`minLength` ATAYIN qoladi: noValidate faqat brauzer UI'sini
  // toʻxtatadi, atribut esa skrin-riderga maydon majburiyligini bildiradi.
  return (
    <form onSubmit={handleSubmit} noValidate className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-2xl font-medium">{t("title")}</h1>
        </div>

        {/* Tezkor kirish guruhi — Google va Telegram bir xil turdagi
            muqobillar, shuning uchun oralaridagi masofa FieldGroup'ning
            umumiy gap-7'idan kichikroq (gap-2). */}
        <div className="flex flex-col gap-2">
          {/* Google eng tepada — parol oʻylab topish eng katta toʻsiq. */}
          <Field>
            <Button variant="outline" type="button" onClick={handleGoogle}>
              <GoogleIcon className="h-4 w-4" />
              {t("continueWithGoogle")}
            </Button>
          </Field>

          {/* Telegram — LessonLab boti orqali.

              NEGA BU YERDA: LessonLab va Ustozona bitta bazada ishlaydi
              va oʻqituvchi uchun bogʻlanish MAJBURIY. Ilgari u alohida,
              keyingi qadam edi: odam bu formani toʻldirib `/dashboard` ga
              tushardi, botga qaytishni unutardi va bogʻlanish hech qachon
              yakunlanmasdi (2026-08-08 da real foydalanuvchida ushlangan).

              Bu tugma zanjirni teskari qiladi: botda ism-familiya va
              telegram kimligi oʻzi maʼlum, akkaunt esa bogʻlanish bilan
              BIR PAYTDA ochiladi — «keyin qilinadigan qadam» qolmaydi.

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
        </div>

        <FieldSeparator>{t("orWithEmail")}</FieldSeparator>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={Boolean(fieldErrors.firstName)}>
            <FieldLabel htmlFor="firstName">{t("firstNameLabel")}</FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder={t("firstNamePlaceholder")}
              autoComplete="given-name"
              required
              aria-invalid={Boolean(fieldErrors.firstName)}
              onChange={() => clearError("firstName")}
            />
            <FieldError>{fieldErrors.firstName}</FieldError>
          </Field>

          <Field data-invalid={Boolean(fieldErrors.lastName)}>
            <FieldLabel htmlFor="lastName">{t("lastNameLabel")}</FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder={t("lastNamePlaceholder")}
              autoComplete="family-name"
              required
              aria-invalid={Boolean(fieldErrors.lastName)}
              onChange={() => clearError("lastName")}
            />
            <FieldError>{fieldErrors.lastName}</FieldError>
          </Field>
        </div>

        <Field data-invalid={Boolean(fieldErrors.email)}>
          <FieldLabel htmlFor="email">{t("emailLabel")}</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            autoComplete="email"
            required
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={() => clearError("email")}
          />
          <FieldError>{fieldErrors.email}</FieldError>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.password)}>
          <FieldLabel htmlFor="password">{t("passwordLabel")}</FieldLabel>
          <PasswordInput
            id="password"
            name="password"
            placeholder={t("passwordPlaceholder")}
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={Boolean(fieldErrors.password)}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
          />
          {/* Jonli parol kuchi — foydalanuvchi submit bosgunicha kutmasdan
              zaif/oʻrtacha/kuchli ekanini koʻradi. Boʻsh parolda chiqmaydi. */}
          {password && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full bg-muted transition-colors",
                      i < strength.score &&
                        (strength.labelKey === "weak"
                          ? "bg-destructive"
                          : strength.labelKey === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"),
                    )}
                  />
                ))}
              </div>
              <span
                className={cn(
                  "text-xs",
                  strength.labelKey === "weak"
                    ? "text-destructive"
                    : strength.labelKey === "medium"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {t(`passwordStrength.${strength.labelKey}`)}
              </span>
            </div>
          )}
          <FieldError>{fieldErrors.password}</FieldError>
        </Field>

        {generalError && (
          <p className="text-sm text-destructive text-center" role="alert">
            {generalError}
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
