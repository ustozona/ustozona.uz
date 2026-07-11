"use client";

import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";

export default function RegisterPage() {
  return (
    <AuthShell maxWidth="max-w-md">
      <SignupForm />
    </AuthShell>
  );
}
