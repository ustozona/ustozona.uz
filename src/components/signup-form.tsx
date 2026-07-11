"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

/** Better Auth xato kodlari → oʻzbekcha xabarlar. */
const ERROR_UZ: Record<string, string> = {
  USER_ALREADY_EXISTS: "Bu email bilan hisob allaqachon mavjud.",
  PASSWORD_TOO_SHORT: "Parol kamida 8 belgidan iborat boʻlsin.",
  PASSWORD_TOO_LONG: "Parol juda uzun.",
  INVALID_EMAIL: "Email manzili notoʻgʻri koʻrinishda.",
};

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const firstName = String(form.get("firstName") ?? "").trim();
    const lastName = String(form.get("lastName") ?? "").trim();
    const name = `${firstName} ${lastName}`.trim();
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      setError(ERROR_UZ.PASSWORD_TOO_SHORT);
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
      setError(
        ERROR_UZ[err.code ?? ""] ?? "Roʻyxatdan oʻtishda xatolik yuz berdi. Qayta urinib koʻring."
      );
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const handleGoogle = async () => {
    const { error: err } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    if (err) {
      toast.error("Google orqali kirish hozircha sozlanmagan.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-2xl font-medium">Roʻyxatdan oʻtish</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Roʻyxatdan oʻtish uchun quyidagi shaklni toʻldiring.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="firstName">Ism</FieldLabel>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Ismingiz"
              autoComplete="given-name"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName">Familiya</FieldLabel>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Familiyangiz"
              autoComplete="family-name"
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="email">Elektron pochta</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="falonchi@email.uz"
              autoComplete="email"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Parol</FieldLabel>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Kamida 8 belgi"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </Field>
        </div>

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Yaratilmoqda…" : "Roʻyxatdan oʻtish"}
          </Button>
        </Field>

        <FieldSeparator>yoki</FieldSeparator>

        <Field>
          <Button variant="outline" type="button" onClick={handleGoogle}>
            <img
              src="https://images.shadcnspace.com/assets/svgs/icon-google.svg"
              alt=""
              className="h-4 w-4"
            />
            Google orqali roʻyxatdan oʻtish
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Hisobingiz bormi? <a href="/login">Tizimga kirish</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

export default SignupForm;
