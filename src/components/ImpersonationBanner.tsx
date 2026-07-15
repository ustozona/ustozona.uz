"use client";

import * as React from "react";
import { VenetianMask, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { stopImpersonatingAction } from "@/server/actions/admin/users";

/* Impersonatsiya paytida (session.impersonatedBy toʻlgan) dashboard
   tepasida doimiy ogohlantirish. Chiqishda TOʻLIQ reload — zustand
   store'lar impersonatsiya qilingan hisob maʼlumotini ushlab turadi. */

export default function ImpersonationBanner() {
  const { data } = authClient.useSession();
  const [busy, setBusy] = React.useState(false);

  if (!data?.session?.impersonatedBy) return null;

  return (
    <div className="flex shrink-0 items-center justify-center gap-3 bg-destructive px-4 py-1.5 text-sm text-white">
      <VenetianMask className="size-4 shrink-0" />
      <span className="truncate">
        <strong>{data.user.name}</strong> sifatida koʻrmoqdasiz — vaqtinchalik
        sessiya (1 soat)
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="h-6 px-2 text-xs"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await stopImpersonatingAction();
            window.location.href = "/admin/users";
          } catch {
            setBusy(false);
          }
        }}
      >
        <LogOut className="size-3.5" />
        Chiqish
      </Button>
    </div>
  );
}
