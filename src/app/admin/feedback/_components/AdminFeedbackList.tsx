"use client";

import { cn } from "@/lib/utils";
import { useAdminNav, pendingClass } from "../../_components/use-admin-nav";
import { AdminPanelHeader } from "../../_components/AdminPanelHeader";
import { AdminPagination } from "../../_components/AdminPagination";
import { adminHref } from "../../_components/admin-href";
import { Panel } from "@/components/ui/panel";
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
import { MessageSquareText } from "lucide-react";
import {
  CATEGORY_META,
  STATUS_META,
  STATUS_ORDER,
  CATEGORY_ORDER,
} from "@/app/dashboard/(with-sidebar)/feedback/_components/feedback-meta";
import type { AdminFeedbackItem } from "@/server/dal/admin/feedback";
import AdminFeedbackCard from "./AdminFeedbackCard";

/* Admin fikrlar markazi — `Panel` + toolbar + karta lentasi. Oʻqituvchi
   tomonidagi Fikr-mulohaza sahifasi bilan bir xil lenta, faqat admin
   ehtiyojiga moslashtirilgan (kompozer/tab yoʻq, Turkum/Holat filtri
   Select bilan). */

const feedbackHref = (status: string, category: string, page = 1) =>
  adminHref("/admin/feedback", { status, category }, page);

export default function AdminFeedbackList({
  data,
  activeStatus,
  activeCategory,
}: {
  data: { items: AdminFeedbackItem[]; total: number; page: number; pageSize: number };
  activeStatus: string;
  activeCategory: string;
}) {
  /* Filtr/sahifa navigatsiyasi `useTransition` ichida — kutish
     koʻrinsin (_components/use-admin-nav.ts dagi izoh). */
  const { pending, go: navigate } = useAdminNav();
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const go = (status: string, category: string, page = 1) =>
    navigate(feedbackHref(status, category, page));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Panel>
        <AdminPanelHeader
          icon={<MessageSquareText />}
          title="Fikrlar markazi"
          count={`${data.total} ta fikr`}
          actions={
            <>
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
            </>
          }
        />

        {data.items.length === 0 ? (
          <div className={cn("p-4 md:p-5", pendingClass(pending))}>
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
          <div className={cn("space-y-3 bg-muted/25 p-3 md:p-4", pendingClass(pending))}>
            {data.items.map((row) => (
              <AdminFeedbackCard key={row.id} row={row} />
            ))}
          </div>
        )}

        <AdminPagination
          page={data.page}
          totalPages={totalPages}
          hrefFor={(p) => feedbackHref(activeStatus, activeCategory, p)}
          onNavigate={navigate}
          pending={pending}
        />
      </Panel>
    </div>
  );
}
