import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { TELEGRAM_SIGNUP_URL } from "@/lib/lessonlab-bot";
import { isTelegramBotEnabled } from "@/server/telegram/config";

/* ⚠️ SERVER COMPONENT — ataylab («use client» EMAS).
   Sabab: `register/page.tsx` dagi bilan bir xil — `TELEGRAM_SIGNUP_URL`
   NEXT_PUBLIC boʻlmagan muhit oʻzgaruvchisidan yasaladi va mijozda
   `undefined` boʻlardi. */
export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm
        telegramSignupUrl={TELEGRAM_SIGNUP_URL}
        telegramBotEnabled={isTelegramBotEnabled()}
      />
    </AuthShell>
  );
}
