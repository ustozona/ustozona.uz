"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarRange, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

/* Darslar sahifasining sarlavhasi: nom + qisqa xulosa, pastida ikki koʻrinish
   tablari — tuzilma (sinf → boʻlim → mavzu) va oʻquv yili vaqt chizigʻi.
   Bir obyektning ikki koʻrinishi boʻlgani uchun segment emas, sahifa tablari. */
export function LessonsViewSwitch({ active, summary }: { active: "structure" | "year"; summary?: string }) {
  const t = useTranslations("LessonsYear");
  const tp = useTranslations("LessonsPage");
  const tab = (key: "structure" | "year", href: string, Icon: typeof Columns3, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={cn(
        "-mb-px flex h-9 items-center gap-1.5 border-b-2 px-1 text-sm font-medium transition-colors duration-fast ease-standard",
        active === key
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="min-w-0">
        <h1 className="heading-page truncate">{tp("pageTitle")}</h1>
        {summary && <p className="text-caption text-muted-foreground mt-0.5">{summary}</p>}
      </div>
      <nav className="flex items-center gap-6 border-b border-border">
        {tab("structure", "/dashboard/lessons", Columns3, t("viewStructure"))}
        {tab("year", "/dashboard/lessons/yil", CalendarRange, t("viewYear"))}
      </nav>
    </div>
  );
}
