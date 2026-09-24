"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { PanelFooter } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { pendingClass } from "./use-admin-nav";

/* Admin roʻyxatlari uchun bitta sahifalash — foydalanuvchilar, fikrlar
   va audit jurnali shu komponentni ishlatadi.

   Ilgari uchala joyda bir xil kod nusxalangan edi va faqat «Oldingi /
   Keyingi» bor edi: 7-sahifaga oʻtish uchun olti marta bosish kerak
   boʻlardi. Endi raqamlar ham bor. Mobilda raqamlar yashiriladi, shuning
   uchun «Oldingi / Keyingi» matni u yerda ham koʻrinadi — umumiy
   `PaginationPrevious/Next` uni kichik ekranda yashirardi va faqat
   yalangʻoch strelka qolardi.

   Havolalar haqiqiy `<a href>` — yangi oynada ochiladi va nusxalanadi.
   Oddiy bosish esa `onNavigate` ga beriladi: u `useAdminNav().go`,
   yaʼni kutish `pending` bilan koʻrinadi (use-admin-nav.ts izohi). */

type PageSlot = number | "gap";

/** 1 … 4 5 6 … 12 — birinchi, oxirgi va joriy sahifa atrofi. */
function pageSlots(page: number, total: number): PageSlot[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const around = [page - 1, page, page + 1].filter((p) => p > 1 && p < total);
  const slots: PageSlot[] = [1];
  if (around.length && around[0] > 2) slots.push("gap");
  slots.push(...around);
  if (around.length && around[around.length - 1] < total - 1) slots.push("gap");
  slots.push(total);
  return slots;
}

export function AdminPagination({
  page,
  totalPages,
  hrefFor,
  onNavigate,
  pending,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  onNavigate: (href: string) => void;
  pending?: boolean;
}) {
  /* Joriy sahifa oxirgisidan keyin boʻlsa ham (eskirgan havola, yoki
     oxirgi sahifadagi yozuv oʻchirilgach `refresh`) sahifalash QOLADI:
     aks holda admin boʻsh sahifada qolib, orqaga qaytadigan tugma
     boʻlmasdi. */
  if (totalPages <= 1 && page <= 1) return null;

  const link = (target: number) => {
    const href = hrefFor(target);
    return {
      href,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Ctrl/Cmd/Shift bosilgan boʻlsa — brauzer oʻzi yangi oynada ochsin.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onNavigate(href);
      },
    };
  };

  /* Chegaradagi Oldingi/Keyingi — havolasiz, fokuslanmaydi. */
  const disabledProps = { "aria-disabled": true, tabIndex: -1 } as const;
  const edgeClass = (enabled: boolean) =>
    cn("gap-1 px-3", !enabled && "pointer-events-none opacity-50");

  /* Sahifa oxirgisidan keyin boʻlsa «Oldingi» oxirgi mavjud sahifaga
     olib boradi — bir-bir orqaga yurib chiqish shart emas. */
  const prevTarget = Math.min(page - 1, Math.max(totalPages, 1));

  return (
    <PanelFooter className={cn("justify-between gap-3 py-3", pendingClass(!!pending))}>
      <span className="text-caption text-muted-foreground tabular-nums">
        {page}-sahifa / {Math.max(totalPages, 1)}
      </span>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              size="default"
              aria-label="Oldingi sahifa"
              className={edgeClass(page > 1)}
              {...(page > 1 ? link(prevTarget) : disabledProps)}
            >
              <ChevronLeft />
              Oldingi
            </PaginationLink>
          </PaginationItem>
          {pageSlots(page, totalPages).map((slot, i) => (
            <PaginationItem key={slot === "gap" ? `gap-${i}` : slot} className="hidden sm:list-item">
              {slot === "gap" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={slot === page}
                  aria-label={`${slot}-sahifa`}
                  className="tabular-nums"
                  {...link(slot)}
                >
                  {slot}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationLink
              size="default"
              aria-label="Keyingi sahifa"
              className={edgeClass(page < totalPages)}
              {...(page < totalPages ? link(page + 1) : disabledProps)}
            >
              Keyingi
              <ChevronRight />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </PanelFooter>
  );
}
