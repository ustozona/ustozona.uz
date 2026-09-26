"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAdminNav, pendingClass } from "../../_components/use-admin-nav";
import { AdminPanelHeader } from "../../_components/AdminPanelHeader";
import { AdminPagination } from "../../_components/AdminPagination";
import { adminHref } from "../../_components/admin-href";
import { fmtDateTime } from "../../_components/admin-dates";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
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
import { ScrollText } from "lucide-react";
import type { AdminAuditAction, AuditLogPage } from "@/server/dal/admin/audit";

/* `Record<AdminAuditAction, …>` — yangi amal DAL ga qoʻshilsa, bu yerda
   yorliqsiz qolib ketmasin (tip xatosi beradi). Ilgari oddiy
   `Record<string, …>` edi va «statistikadan istisno» amallari yorliqsiz
   — xom kalit boʻlib — chiqardi, filtrda esa umuman yoʻq edi. */
const ACTION_LABELS: Record<AdminAuditAction, string> = {
  "user.set_role": "Rol oʻzgartirildi",
  "user.ban": "Bloklandi",
  "user.unban": "Blokdan chiqarildi",
  "user.delete": "Hisob oʻchirildi",
  "user.impersonate": "Sifatida kirildi",
  "user.reset_password": "Parol tiklash xati",
  "user.exclude_from_metrics": "Statistikadan chiqarildi",
  "user.include_in_metrics": "Statistikaga qaytarildi",
  "feedback.reply": "Fikrga javob",
  "feedback.status": "Fikr holati",
  "school.create": "Maktab yaratildi",
  "school.update": "Maktab yangilandi",
  "school.delete": "Maktab oʻchirildi",
  "school.assign_teacher": "Oʻqituvchi biriktirildi",
};

/** Bazadagi eski yoki notanish amal — xom kalit bilan koʻrsatiladi. */
function actionLabel(action: string): string {
  return (ACTION_LABELS as Record<string, string | undefined>)[action] ?? action;
}

const DESTRUCTIVE_ACTIONS = new Set(["user.ban", "user.delete", "school.delete"]);

/* Sana — `fmtDateTime` (../../_components/admin-dates.ts). Ilgari bu
   yerda `toLocaleString("uz-UZ")` edi: server (UTC, Node ICU) va brauzer
   boshqa satr chizib, gidratatsiyani buzardi. */

const auditHref = (action: string, page = 1) =>
  adminHref("/admin/audit", { action }, page);

export default function AuditList({
  data,
  activeAction,
}: {
  data: AuditLogPage;
  activeAction: string;
}) {
  /* Filtr/sahifa navigatsiyasi `useTransition` ichida — kutish
     koʻrinsin (_components/use-admin-nav.ts dagi izoh). */
  const { pending, go: navigate } = useAdminNav();
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const go = (action: string, page = 1) => navigate(auditHref(action, page));

  return (
    <Panel>
      <AdminPanelHeader
        icon={<ScrollText />}
        title="Audit jurnali"
        count={`${data.total} ta yozuv`}
        actions={
          <Select
            value={activeAction || "all"}
            onValueChange={(v) => go(v === "all" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-52" size="sm">
              <SelectValue placeholder="Harakat turi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barcha harakatlar</SelectItem>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {data.items.length === 0 ? (
        <Empty className={pendingClass(pending)}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScrollText />
            </EmptyMedia>
            <EmptyTitle>Yozuvlar yoʻq</EmptyTitle>
            <EmptyDescription>
              Admin harakatlari shu yerda xronologik koʻrinadi.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className={cn("divide-y divide-border", pendingClass(pending))}>
          {data.items.map((log) => {
            const meta = log.meta as Record<string, unknown>;
            const hasMeta = meta && Object.keys(meta).length > 0;
            return (
              <li key={log.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
                <Badge
                  variant={DESTRUCTIVE_ACTIONS.has(log.action) ? "destructive" : "secondary"}
                  className="mt-0.5 shrink-0"
                >
                  {actionLabel(log.action)}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{log.actorEmail}</span>
                    {log.targetLabel && (
                      <span className="text-muted-foreground"> → {log.targetLabel}</span>
                    )}
                    {!log.targetLabel && log.targetId && (
                      <span className="text-muted-foreground"> → {log.targetId}</span>
                    )}
                  </p>
                  {hasMeta && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Tafsilotlar
                      </summary>
                      <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-xs">
                        {JSON.stringify(meta, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {fmtDateTime(log.createdAt)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <AdminPagination
        page={data.page}
        totalPages={totalPages}
        hrefFor={(p) => auditHref(activeAction, p)}
        onNavigate={navigate}
        pending={pending}
      />
    </Panel>
  );
}
