"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { MessageSquareText, ChevronLeft, ChevronRight } from "lucide-react";
import {
  CATEGORY_META,
  STATUS_META,
  STATUS_ORDER,
  CATEGORY_ORDER,
} from "@/app/dashboard/(with-sidebar)/feedback/_components/feedback-meta";
import type { AdminFeedbackItem } from "@/server/dal/admin/feedback";
import AdminFeedbackCard from "./AdminFeedbackCard";

/* Admin fikrlar markazi — oʻqituvchi tomonidagi Fikr-mulohaza sahifasi
   bilan bir xil vizual qobiq (rounded-2xl card + toolbar + karta lentasi),
   faqat admin ehtiyojiga moslashtirilgan (kompozer/tab yoʻq, Turkum/Holat
   filtri Select bilan). */

export default function AdminFeedbackList({
  data,
  activeStatus,
  activeCategory,
}: {
  data: { items: AdminFeedbackItem[]; total: number; page: number; pageSize: number };
  activeStatus: string;
  activeCategory: string;
}) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const go = (status: string, category: string, page = 1) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.push(`/admin/feedback${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 md:px-4">
          <SectionIcon>
            <MessageSquareText />
          </SectionIcon>
          <div className="min-w-0">
            <h2 className="heading-small">Fikrlar markazi</h2>
            <p className="text-caption text-muted-foreground">{data.total} ta fikr</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            <Select
              value={activeCategory || "all"}
              onValueChange={(v) => go(activeStatus, v === "all" ? "" : v)}
            >
              <SelectTrigger className="h-9 w-40 shadow-none" size="sm">
                <SelectValue placeholder="Turkum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha turkum</SelectItem>
                {CATEGORY_ORDER.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeStatus || "all"}
              onValueChange={(v) => go(v === "all" ? "" : v, activeCategory)}
            >
              <SelectTrigger className="h-9 w-44 shadow-none" size="sm">
                <SelectValue placeholder="Holat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha holat</SelectItem>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_META[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {data.items.length === 0 ? (
          <div className="p-4 md:p-5">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquareText />
                </EmptyMedia>
                <EmptyTitle>Fikrlar yoʻq</EmptyTitle>
                <EmptyDescription>
                  Oʻqituvchilar yuborgan fikr-mulohazalar shu yerda koʻrinadi.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="space-y-3 bg-muted/25 p-3 md:p-4">
            {data.items.map((row) => (
              <AdminFeedbackCard key={row.id} row={row} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-3 md:px-4">
            <span className="text-caption text-muted-foreground">
              {data.page}-sahifa / {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => go(activeStatus, activeCategory, data.page - 1)}
              >
                <ChevronLeft />
                Oldingi
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= totalPages}
                onClick={() => go(activeStatus, activeCategory, data.page + 1)}
              >
                Keyingi
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
