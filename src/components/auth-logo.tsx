"use client";

import Link from "next/link";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { cn } from "@/lib/utils";

/** Auth sahifalarida (login/register/forgot-password/reset-password) takrorlanadigan brend logotipi. */
export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link href="/">
      <BrandWordmark className={cn(className)} shieldClassName="size-8" textClassName="text-lg" />
    </Link>
  );
}

export default AuthLogo;
