"use client";

import { AuthLogo } from "@/components/auth-logo";
import { Card, CardContent } from "@/components/ui/card";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { ForgotPasswordForm } from "@/components/shadcn-space/blocks/forgot-password-01/forgot-password";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-muted p-6">
      <DotPattern
        className={cn("[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]")}
      />
      <Card className="relative w-full max-w-md">
        <CardContent className="flex flex-col gap-8">
          <div className="flex justify-center">
            <AuthLogo />
          </div>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
