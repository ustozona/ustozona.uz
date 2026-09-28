"use client";

import { useTranslations } from "next-intl";
import { Download, LayoutGrid, Loader2, Network, Presentation, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import { downloadPng, printPng } from "./visuals";

export type VisualResult = {
  kind: "mindmap" | "infographic";
  title: string;
  /** PNG data-URL — koʻrish, yuklab olish, chop etish va slayd uchun bitta manba. */
  png: string;
};

/**
 * Aqliy xarita / infografika — natijani koʻrish oynasi.
 *
 * Uch yoʻl, sinf imkoniyatiga qarab: smartdoska yoki proyektor boʻlsa —
 * «Taqdimotga qoʻshish» (slayd sifatida koʻrsatiladi va jonli darsda
 * ishlatiladi); proyektor yoʻq boʻlsa — «Chop etish» (A4 albom, doskaga
 * ilinadi); ulashish uchun — PNG.
 */
export function VisualPreview({
  visual,
  busy,
  onClose,
  onToDeck,
  onRegenerate,
}: {
  visual: VisualResult | null;
  busy: boolean;
  onClose: () => void;
  onToDeck: () => void;
  onRegenerate: () => void;
}) {
  const t = useTranslations("QuickCreate");
  const Icon = visual?.kind === "infographic" ? LayoutGrid : Network;

  return (
    <Dialog open={!!visual} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent showCloseButton={false} width="960px" className="gap-0 overflow-hidden p-0">
        {visual && (
          <>
            <DialogHeaderBar
              icon={<Icon className="size-[18px]" />}
              title={visual.title}
              description={visual.kind === "infographic" ? t("visual.titleInfographic") : t("visual.titleMindmap")}
            />
            <div className="bg-muted/40 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URL (PNG), optimizatsiya kerak emas */}
              <img
                src={visual.png}
                alt={visual.title}
                className="aspect-video w-full rounded-lg border border-border bg-card object-contain"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 shadow-none" onClick={() => printPng(visual.png, visual.title)}>
                  <Printer className="size-3.5" />
                  {t("visual.print")}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 shadow-none" onClick={() => downloadPng(visual.png, visual.title)}>
                  <Download className="size-3.5" />
                  {t("visual.download")}
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={onRegenerate} disabled={busy}>
                  <RefreshCw className="size-3.5" />
                  {t("visual.regenerate")}
                </Button>
              </div>
              <Button size="sm" className="gap-1.5" onClick={onToDeck} disabled={busy}>
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Presentation className="size-3.5" />}
                {busy ? t("visual.uploading") : t("visual.toDeck")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
