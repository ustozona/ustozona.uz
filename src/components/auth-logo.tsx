"use client";

import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { AnimatedTextRoller } from "@/components/shadcn-space/animated-text/animated-text-04";
import { cn } from "@/lib/utils";

/** Auth sahifalarida (login/register/forgot-password/reset-password) takrorlanadigan brend logotipi. */
export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-1.5", className)}>
      <div
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-primary-foreground",
          "animate-rainbow bg-[length:200%]",
          "[border:calc(0.125rem)_solid_transparent] [background-clip:padding-box,border-box,border-box] [background-origin:border-box]",
          "bg-[linear-gradient(var(--primary),var(--primary)),linear-gradient(var(--primary)_50%,transparent_80%),linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))]",
          "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,var(--color-1),var(--color-5),var(--color-3),var(--color-4),var(--color-2))] before:bg-[length:200%] before:blur-md"
        )}
      >
        <GraduationCap className="relative z-10 size-4.5" strokeWidth={2} />
      </div>
      <span className="font-sans text-lg font-bold tracking-tight text-foreground">Ustozona</span>
      <AnimatedTextRoller className="-ml-0.5" />
    </Link>
  );
}

export default AuthLogo;
