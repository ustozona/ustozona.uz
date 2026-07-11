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
import { Checkbox } from "@/components/ui/checkbox";

/** Better Auth xato kodlari → oʻzbekcha xabarlar. */
const ERROR_UZ: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email yoki parol notoʻgʻri.",
  USER_NOT_FOUND: "Bunday hisob topilmadi.",
  INVALID_EMAIL: "Email manzili notoʻgʻri koʻrinishda.",
};

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

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
      setError(ERROR_UZ[err.code ?? ""] ?? "Kirishda xatolik yuz berdi. Qayta urinib koʻring.");
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
          <h1 className="text-2xl font-medium">Hisobingizga kiring</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Hisobingizga kirish uchun quyida elektron pochta va parolingizni kiriting.
          </p>
        </div>

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
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Parol</FieldLabel>
            <a href="/forgot-password" className="ml-auto text-sm underline-offset-2 hover:underline">
              Parolni unutdingizmi?
            </a>
          </div>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Parolingizni kiriting"
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
            Parolni eslab qolish
          </FieldLabel>
        </Field>

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Kirilmoqda…" : "Tizimga kirish"}
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
            Google orqali kirish
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Hisobingiz yoʻqmi? <a href="/register">Roʻyxatdan oʻtish</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

export default LoginForm;
