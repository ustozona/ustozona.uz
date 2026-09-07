"use client";

import * as React from "react";
import { Smartphone, Tablet, Monitor, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { listUserSessionsAction } from "@/server/actions/admin/users";
import { parseUserAgent, deviceLabel, type DeviceKind } from "@/lib/user-agent";

/* Foydalanuvchining oxirgi seanslari — qaysi qurilmadan kirgani.

   ⚠️ Bu «foydalanuvchining qurilmasi» EMAS, «kirishlar roʻyxati».
   Bitta odam telefondan ham, kompyuterdan ham kiradi; shuning uchun
   jadvalda «qurilma» ustuni yoʻq va bu yerda ham yagona yorliq
   chiqarilmaydi — har seans oʻz satrida turadi.

   Maʼlumot oyna ochilganda tortiladi (server action), sahifa yuki
   ortmasin uchun. */

const ICON: Record<DeviceKind, React.ComponentType<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: HelpCircle,
};

type Row = Awaited<ReturnType<typeof listUserSessionsAction>>[number];

function fmt(d: Date | string): string {
  return new Date(d).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionsDialog({
  user,
  onClose,
}: {
  user: { id: string; name: string | null; email: string } | null;
  onClose: () => void;
}) {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const userId = user?.id ?? null;
  React.useEffect(() => {
    if (!userId) return;
    let alive = true;
    setRows(null);
    setError(null);
    listUserSessionsAction({ userId })
      .then((r) => alive && setRows(r))
      .catch((e: unknown) => {
        if (alive)
          setError(e instanceof Error ? e.message : "Seanslarni olib boʻlmadi");
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seanslar</DialogTitle>
          <DialogDescription>
            {user?.name || user?.email} — oxirgi 10 ta kirish. Qurilma turi
            brauzer yuborgan maʼlumotdan aniqlanadi, shuning uchun taxminiy.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!error && rows === null && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {rows?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Faol seans yoʻq — foydalanuvchi hech qachon kirmagan yoki seanslari
            muddati tugagan.
          </p>
        )}

        {rows && rows.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {rows.map((s) => {
              const ua = parseUserAgent(s.userAgent);
              const Icon = ICON[ua.device];
              return (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {deviceLabel(ua.device)}
                      {ua.label !== deviceLabel(ua.device) && (
                        <span className="font-normal text-muted-foreground">
                          {" · "}
                          {ua.label}
                        </span>
                      )}
                    </div>
                    <div className="text-caption text-muted-foreground">
                      {fmt(s.updatedAt)}
                      {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
