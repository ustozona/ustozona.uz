"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { completeTgSignupAction } from "@/server/actions/tg-signup";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

/* Telegram chiptasi bilan akkauntni yakunlash — BITTA ekran.

   Nega bu forma qisqa: ism-familiya Telegram profilidan keldi,
   biriktirish esa avtomatik. Foydalanuvchidan faqat parol soʻraladi
   (email — ixtiyoriy). Uzun forma aynan shu oqimning maʼnosini
   yoʻqotardi.

   ⛔ PAROL BOTDA SOʻRALMAYDI — u chat tarixida qolib ketardi. Shuning
   uchun aynan shu maydon, HTTPS ustida. Sabab: `dal/tg-signup.ts`. */

const ERRORS: Record<string, string> = {
  invalid: "Havola yaroqsiz. Botda /royxat buyrugʻini yuborib yangi havola oling.",
  expired: "Havolaning muddati oʻtdi (15 daqiqa). Botda /royxat bilan yangisini oling.",
  used: "Bu havola allaqachon ishlatilgan. Botda /royxat bilan yangisini oling.",
  taken_tg:
    "Bu Telegram akkaunt allaqachon boshqa Ustozona hisobiga bogʻlangan. " +
    "Botda /telegram_uzish bilan uzing yoki oʻsha hisobga kiring.",
  email_taken: "Bu email bilan hisob allaqachon bor. Kirish sahifasidan kiring.",
  weak_password: "Parol kamida 8 belgidan boʻlishi kerak.",
  bad_name: "Ism-familiyani toʻliq yozing.",
  failed: "Akkaunt yaratilmadi. Birozdan keyin qayta urinib koʻring.",
};

export function TgSignupForm({ token, fullName }: { token: string; fullName: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      setError(ERRORS.weak_password);
      return;
    }
    setPending(true);
    setError(null);

    let result;
    try {
      result = await completeTgSignupAction({
        token,
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password,
      });
    } catch (err) {
      // Xatoni JIM YUTMAYMIZ. 2026-08-08 da Server Action'ning CSRF
      // origin mosligi sababli yiqilishi soatlab auth va bazada
      // izlangan edi — konsolga chiqarish sababni darhol beradi.
      console.error("[tg-signup] amal yiqildi:", err);
      setPending(false);
      setError(ERRORS.failed);
      return;
    }

    if (result.status !== "ok") {
      setPending(false);
      setError(ERRORS[result.status] ?? ERRORS.failed);
      return;
    }

    // Sessiya cookie'si Server Action ichida yozildi (`nextCookies`),
    // yaʼni foydalanuvchi allaqachon kirgan. `refresh()` — serverdagi
    // yangi sessiyani RSC keshiga yetkazish uchun; busiz `/dashboard`
    // eski (kirmagan) holatni koʻrib login'ga qaytarib yuborardi.
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="tg-name">Ism va familiya</FieldLabel>
          <Input
            id="tg-name"
            name="name"
            type="text"
            defaultValue={fullName}
            autoComplete="name"
            required
            minLength={2}
          />
          <FieldDescription>
            Telegram profilingizdan olindi — xohlasangiz tuzatishingiz mumkin.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="tg-email">Email (ixtiyoriy)</FieldLabel>
          <Input
            id="tg-email"
            name="email"
            type="email"
            placeholder="siz@example.com"
            autoComplete="email"
          />
          <FieldDescription>
            Parolni tiklash uchun kerak boʻladi. Keyin ham qoʻshsa boʻladi.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="tg-password">Parol</FieldLabel>
          <PasswordInput
            id="tg-password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <FieldDescription>Kamida 8 belgi.</FieldDescription>
        </Field>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Field>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Yaratilmoqda…" : "Akkauntni yaratish"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export default TgSignupForm;
