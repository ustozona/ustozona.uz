"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ustozona-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // localStorage yoʻq boʻlsa banner koʻrsatilmaydi
    }
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Saytdan foydalanish tajribasini yaxshilash uchun cookie fayllaridan
          foydalanamiz. Davom etish orqali bunga rozilik bildirasiz.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            className="h-9 rounded-full shadow-none cursor-pointer"
            onClick={() => decide("rejected")}
          >
            Rad etish
          </Button>
          <Button
            className="h-9 rounded-full cursor-pointer"
            onClick={() => decide("accepted")}
          >
            Qabul qilish
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
