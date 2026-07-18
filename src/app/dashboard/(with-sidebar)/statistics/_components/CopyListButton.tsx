"use client";

import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Roʻyxatni "Ism — ota-ona tel" satrlari sifatida clipboard'ga nusxalaydi
    (Canvas "Message Students Who..." analogi — xabar tizimisiz, oʻqituvchi
    matnni oʻzi SMS/Telegramga joylaydi). */
export function CopyListButton({ entries }: { entries: { name: string; parentPhone?: string }[] }) {
  const t = useTranslations("StatisticsPage");
  if (entries.length === 0) return null;

  const handleCopy = async () => {
    const text = entries.map((e) => (e.parentPhone ? `${e.name} — ${e.parentPhone}` : e.name)).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copyListSuccess", { count: entries.length }));
    } catch {
      toast.error(t("copyListError"));
    }
  };

  return (
    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleCopy}>
      <Copy className="size-3.5" />
      {t("copyList")}
    </Button>
  );
}
