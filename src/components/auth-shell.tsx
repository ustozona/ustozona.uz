"use client";

import { AuthLogo } from "@/components/auth-logo";
import { AuthFeatureLoop } from "@/components/onboarding/AuthFeatureLoop";
import { PRODUCT_FEATURES } from "@/lib/product-features";
import { cn } from "@/lib/utils";

/** Login/register/forgot-password/reset-password — yagona vizual qobiq. */
export function AuthShell({
  children,
  maxWidth = "max-w-xs",
  showFeatureLoop = true,
}: {
  children: React.ReactNode;
  /** Forma konteynerining kengligi (register 2-ustunli maydonlar uchun kengroq). */
  maxWidth?: string;
  /** Oʻng tomondagi FeatureLoop paneli — faqat login/register'da kerak. */
  showFeatureLoop?: boolean;
}) {
  return (
    // `theme-landing-mono` — landing bilan bir xil mono palitra. Auth sahifasi
    // landing'ning davomi kabi koʻrinsin (avval oddiy temada edi).
    <div
      className={cn(
        "theme-landing-mono grid h-svh min-h-0 bg-background",
        showFeatureLoop && "lg:grid-cols-2",
      )}
    >
      <div className="scrollbar-thin relative flex h-svh min-h-0 flex-col gap-4 scrollbar-hover overflow-y-auto p-6 md:p-10">
        {/* Hero'dagi kabi yumshoq gradient — sahifalar bir oilaga oʻxshasin. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 bg-linear-to-r from-sky-100 via-white to-amber-100 blur-3xl dark:from-slate-800 dark:via-black dark:to-stone-700"
        />
        <div className="flex justify-center">
          <AuthLogo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className={cn("w-full", maxWidth)}>{children}</div>
        </div>
      </div>
      {showFeatureLoop && (
        <div className="relative hidden h-svh min-h-0 overflow-hidden bg-muted lg:flex lg:items-center lg:justify-center lg:p-10">
          <AuthFeatureLoop items={PRODUCT_FEATURES} visible={7} className="w-full max-w-md" />
        </div>
      )}
    </div>
  );
}

export default AuthShell;
