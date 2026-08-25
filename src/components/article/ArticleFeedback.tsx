"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Angry, Frown, Meh, Smile, Laugh, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { value: 1, Icon: Angry },
  { value: 2, Icon: Frown },
  { value: 3, Icon: Meh },
  { value: 4, Icon: Smile },
  { value: 5, Icon: Laugh },
] as const;

export default function ArticleFeedback({
  onPositive,
}: {
  onPositive?: () => void;
}) {
  const t = useTranslations("ArticleFeedback");
  const [voted, setVoted] = useState<number | null>(null);

  function vote(value: number) {
    setVoted(value);
    if (value >= 4) onPositive?.();
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 px-5 py-5 text-center">
      <AnimatePresence mode="wait" initial={false}>
        {voted ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <p className="text-sm text-foreground">
              {t("thanks")} {t("moreQuestions")}{" "}
              <Link
                href="/dashboard/feedback"
                // Standart holatda ham havola ekanligi bilinsin — nuqtali
                // tag'chizgʻich (faqat hoverda emas). Hoverda nuqtalar
                // tutash chiziqqa aylanadi va Button'ning `ghost` varianti
                // bilan bir xil fon+rang oʻzgarishi qoʻshiladi (rounded-md
                // px orqali "quti"si ko'rinadi).
                className="rounded-md px-1 py-0.5 -mx-1 font-medium text-primary underline decoration-dotted underline-offset-4 transition-colors hover:bg-accent hover:text-accent-foreground hover:decoration-solid"
              >
                {t("contactLink")}
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-sm font-medium text-foreground">{t("wasHelpful")}</p>
            <div className="flex items-center gap-1.5">
              {LEVELS.map(({ value, Icon }) => (
                <motion.button
                  key={value}
                  type="button"
                  aria-label={String(value)}
                  onClick={() => vote(value)}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground",
                    "transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Icon className="size-[18px] stroke-[1.75]" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
