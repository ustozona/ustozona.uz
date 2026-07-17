"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ArticleFeedback({
  onPositive,
}: {
  onPositive?: () => void;
}) {
  const t = useTranslations("ArticleFeedback");
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  function vote(v: "yes" | "no") {
    setVoted(v);
    if (v === "yes") onPositive?.();
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 px-5 py-5 text-center">
      {voted ? (
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
          <CheckCircle2 className="size-4 text-success" />
          {t("thanks")}
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-foreground">{t("wasHelpful")}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => vote("yes")}>
              <ThumbsUp className="size-4" />
              {t("yes")}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => vote("no")}>
              <ThumbsDown className="size-4" />
              {t("no")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
