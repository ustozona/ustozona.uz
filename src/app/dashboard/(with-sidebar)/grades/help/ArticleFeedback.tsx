"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ArticleFeedback({
  onPositive,
}: {
  onPositive?: () => void;
}) {
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
          Fikringiz uchun rahmat!
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-foreground">Bu maqola foydali boʻldimi?</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => vote("yes")}>
              <ThumbsUp className="size-4" />
              Ha
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => vote("no")}>
              <ThumbsDown className="size-4" />
              Yoʻq
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
