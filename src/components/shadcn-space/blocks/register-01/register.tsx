"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Better Auth xato kodlari → oʻzbekcha xabarlar. */
const ERROR_UZ: Record<string, string> = {
  USER_ALREADY_EXISTS: "Bu email bilan hisob allaqachon mavjud.",
  PASSWORD_TOO_SHORT: "Parol kamida 8 belgidan iborat boʻlsin.",
  PASSWORD_TOO_LONG: "Parol juda uzun.",
  INVALID_EMAIL: "Email manzili notoʻgʻri koʻrinishda.",
};

const RegisterForm = () => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
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
    <section className="bg-foreground dark:bg-background min-h-screen relative flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 right-0 overflow-hidden md:block hidden">
        {/* Outer big circle */}
        <div className="absolute left-1/1 top-0 h-650 w-650 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
        {/* Inner circle */}
        <div className="absolute left-1/1 top-0 h-175 w-175 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground dark:bg-background" />
      </div>

      <div className="py-10 md:py-20 max-w-lg px-4 sm:px-0 mx-auto w-full">
        <Card className="max-w-lg px-6 py-8 sm:p-12 relative">
          <CardHeader className="text-center gap-6 p-0">
            <div className="mx-auto">
              <a href="/" className="text-3xl font-bold tracking-tight">
                Ustozona
              </a>
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-medium text-card-foreground">
                Tizimda roʻyxatdan oʻtish
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground font-normal">
                Platformadan foydalanish uchun hisob yarating
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              <FieldGroup className="gap-6">
                <Field>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogle}
                    className="text-sm text-medium text-card-foreground gap-2 cursor-pointer dark:bg-background rounded-lg h-9 shadow-xs"
                  >
                    <img
                      src="https://images.shadcnspace.com/assets/svgs/icon-google.svg"
                      alt="google icon"
                      className="h-4 w-4"
                    />
                    Google orqali roʻyxatdan oʻtish
                  </Button>
                </Field>
                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card text-sm text-muted-foreground bg-transparent">
                  <span className="px-4">yoki elektron pochta orqali</span>
                </FieldSeparator>

                <div className="flex flex-col gap-4">
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="name"
                      className="text-sm text-muted-foreground font-normal"
                    >
                      Ism va familiya*
                    </FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Ismingizni kiriting"
                      autoComplete="name"
                      required
                      className="dark:bg-background shadow-xs h-9"
                    />
                  </Field>
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="email"
                      className="text-sm text-muted-foreground font-normal"
                    >
                      Elektron pochta*
                    </FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="nomi@ustozona.uz"
                      autoComplete="email"
                      required
                      className="dark:bg-background shadow-xs h-9"
                    />
                  </Field>
                  <Field className="gap-1.5">
                    <FieldLabel
                      htmlFor="password"
                      className="text-sm text-muted-foreground font-normal"
                    >
                      Parol*
                    </FieldLabel>

                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Kamida 8 belgi"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="dark:bg-background shadow-xs h-9"
                    />
                  </Field>
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center" role="alert">
                    {error}
                  </p>
                )}

                <Field className="gap-4">
                  <Button
                    type="submit"
                    size={"lg"}
                    disabled={pending}
                    className="rounded-lg cursor-pointer h-10 hover:bg-primary/80"
                  >
                    {pending ? "Yaratilmoqda…" : "Roʻyxatdan oʻtish"}
                  </Button>
                  <FieldDescription className="text-center text-sm font-normal text-muted-foreground">
                    Hisobingiz bormi?{" "}
                    <a
                      href="/login"
                      className="font-medium text-card-foreground no-underline!"
                    >
                      Kirish
                    </a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default RegisterForm;
