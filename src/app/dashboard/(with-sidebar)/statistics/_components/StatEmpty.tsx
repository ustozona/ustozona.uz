"use client";

import type { LucideIcon } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/** Statistika kartalari ichidagi kichik (illyustratsiyasiz) boʻsh holat —
    sarlavhadagi ikonka bilan izchil, faqat kompakt joy egallaydi. */
export function StatEmpty({
  icon: Icon,
  title,
  className,
}: {
  icon: LucideIcon;
  title: string;
  className?: string;
}) {
  return (
    <Empty className={cn("p-4 md:p-6", className)}>
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon" className="mb-1 size-9 [&_svg:not([class*='size-'])]:size-5">
          <Icon />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium">{title}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
