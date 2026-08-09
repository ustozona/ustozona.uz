"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopImpersonatingAction } from "@/server/actions/admin/users";

/* «Bu boʻlim yopiq» kartasidagi chiqish tugmasi.

   `ImpersonationBanner` dan farqi — u faqat dashboard'da mount qilingan
   ingichka qizil chiziq; bu esa aynan admin qobigʻidagi karta ichida
   turadi. Mantiq bir xil: server action + TOʻLIQ reload (zustand
   store'lar impersonatsiya qilingan hisob maʼlumotini ushlab turadi,
   client-side navigatsiya ularni tozalamaydi). */

export default function StopImpersonationButton() {
  const [busy, setBusy] = React.useState(false);

  return (
    <Button
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
      <LogOut className="size-4" />
      {busy ? "Chiqilmoqda…" : "Impersonatsiyani toʻxtatish"}
    </Button>
  );
}
