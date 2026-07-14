"use client";

import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "@/components/shadcn-space/blocks/forgot-password-01/forgot-password";

export default function ForgotPasswordPage() {
  return (
    // Login/register/reset bilan bir xil qobiq (avval DotPattern + karta edi).
    <AuthShell showFeatureLoop={false}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
