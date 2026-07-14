"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"form">) {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    setPending(true);
    setError(null);
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setPending(false);
    if (err) {
      setError("Xat yuborishda xatolik yuz berdi. Qayta urinib koʻring.");
      return;
    }
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-2xl font-medium">Parolni unutdingizmi?</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {sent
              ? "Havola yuborildi — elektron pochtangizni tekshiring."
              : "Elektron pochtangizni kiriting — parolni tiklash havolasini yuboramiz."}
          </p>
        </div>

        {!sent && (
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
        )}

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        {!sent && (
          <Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Yuborilmoqda…" : "Parolni tiklash"}
            </Button>
          </Field>
        )}

        <Field>
          <Button
            type="button"
            variant="ghost"
            className="w-full hover:bg-secondary hover:text-secondary-foreground"
            asChild
          >
            <a href="/login">
              <ChevronLeft className="size-4" />
              Kirish sahifasiga qaytish
            </a>
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default ForgotPasswordForm;
