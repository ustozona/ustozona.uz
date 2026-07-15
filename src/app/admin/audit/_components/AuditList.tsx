"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import type { AuditLogPage } from "@/server/dal/admin/audit";

const ACTION_LABELS: Record<string, string> = {
  "user.set_role": "Rol oʻzgartirildi",
  "user.ban": "Bloklandi",
  "user.unban": "Blokdan chiqarildi",
  "user.delete": "Hisob oʻchirildi",
  "user.impersonate": "Sifatida kirildi",
  "user.reset_password": "Parol tiklash xati",
  "feedback.reply": "Fikrga javob",
  "feedback.status": "Fikr holati",
  "school.create": "Maktab yaratildi",
  "school.update": "Maktab yangilandi",
  "school.delete": "Maktab oʻchirildi",
  "school.assign_teacher": "Oʻqituvchi biriktirildi",
};

const DESTRUCTIVE_ACTIONS = new Set(["user.ban", "user.delete", "school.delete"]);

function fmtDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AuditList({
  data,
  activeAction,
}: {
  data: AuditLogPage;
  activeAction: string;
}) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const go = (action: string, page = 1) => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.push(`/admin/audit${qs ? `?${qs}` : ""}`);
  };

  return (
    <Card className="card-elevation gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <SectionIcon>
          <ScrollText />
        </SectionIcon>
        <div className="min-w-0">
          <h2 className="heading-small">Audit jurnali</h2>
          <p className="text-caption text-muted-foreground">{data.total} ta yozuv</p>
        </div>
        <div className="ml-auto">
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
        </div>
      </div>

      {data.items.length === 0 ? (
        <Empty>
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
        <ul className="divide-y divide-border">
          {data.items.map((log) => {
            const meta = log.meta as Record<string, unknown>;
            const hasMeta = meta && Object.keys(meta).length > 0;
            return (
              <li key={log.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
                <Badge
                  variant={DESTRUCTIVE_ACTIONS.has(log.action) ? "destructive" : "secondary"}
                  className="mt-0.5 shrink-0"
                >
                  {ACTION_LABELS[log.action] ?? log.action}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <span className="text-caption text-muted-foreground">
            {data.page}-sahifa / {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => go(activeAction, data.page - 1)}
            >
              <ChevronLeft />
              Oldingi
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= totalPages}
              onClick={() => go(activeAction, data.page + 1)}
            >
              Keyingi
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
