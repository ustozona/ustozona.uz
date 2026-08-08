import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import { TELEGRAM_SIGNUP_URL } from "@/lib/lessonlab-bot";

/* ⚠️ SERVER COMPONENT — ataylab («use client» EMAS).
   `TELEGRAM_SIGNUP_URL` `LESSONLAB_BOT_USERNAME` muhit oʻzgaruvchisidan
   yasaladi va u NEXT_PUBLIC boʻlmagani uchun mijozda `undefined`
   boʻlardi. Shuning uchun qiymat shu yerda olinib, prop bilan
   uzatiladi. Formaning oʻzi avvalgidek mijoz komponenti. */
export default function RegisterPage() {
  return (
    <AuthShell maxWidth="max-w-md">
      <SignupForm telegramSignupUrl={TELEGRAM_SIGNUP_URL} />
    </AuthShell>
  );
}
