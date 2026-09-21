"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarRange, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Darslar sahifasining ikki koʻrinishi: tuzilma (sinf → boʻlim → mavzu) va oʻquv yili xaritasi. */
export function LessonsViewSwitch({ active }: { active: "structure" | "year" }) {
  const t = useTranslations("LessonsYear");
  const item = (key: "structure" | "year", href: string, Icon: typeof Columns3, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-fast ease-standard",
        active === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1">
      {item("structure", "/dashboard/lessons", Columns3, t("viewStructure"))}
      {item("year", "/dashboard/lessons/yil", CalendarRange, t("viewYear"))}
    </div>
  );
}
