"use client";

import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TOPIC_COLOR_HEX,
  type Assignment,
  type Topic,
} from "@/lib/grades-data";
import { Badge } from "@/components/ui/badge";
import { TypographySmall } from "@/components/ui/typography";

type Props = {
  assignment: Assignment;
  topic: Topic | undefined;
  dueDate?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

/**
 * Ustun sarlavhasidagi hover-karta — FAQAT maʼlumot + tahrir/oʻchirish.
 * Ommaviy amallar (baho toʻldirish, qolganlarni belgilash, qoralamalarni
 * nashr qilish) sarlavhaning oʻng-tugma menyusiga koʻchirilgan: hover-karta
 * qisqa va oʻqishga qulay qoladi.
 */
export default function AssignmentTooltip({
  assignment,
  topic,
  dueDate,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations("AssignmentTooltip");
  const kindLabel =
    assignment.kind === "test"
      ? t("kindTest")
      : assignment.kind === "deck"
        ? t("kindDeck")
        : null;

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <TypographySmall className="text-sm font-bold text-foreground leading-tight block">
            {assignment.title}
          </TypographySmall>
          {kindLabel && (
            <Badge variant="secondary" className="shrink-0 text-[10px] font-medium">
              {kindLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="size-6 rounded-md"
            aria-label={t("edit")}
          >
            <Pencil className="size-3.5 text-muted-foreground" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 rounded-md hover:bg-destructive/10"
                aria-label={t("delete")}
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteConfirmDescription", { title: assignment.title })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20"
                >
                  {t("delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-xs">
        {topic && (
          <div className="flex items-center gap-2">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: TOPIC_COLOR_HEX[topic.color] }}
            />
            <span className="text-muted-foreground">{topic.name}</span>
          </div>
        )}
        <div className="text-muted-foreground">{t("maxScore", { score: assignment.maxScore })}</div>
        {dueDate && (
          <div className="text-muted-foreground">{t("dueDate", { date: dueDate })}</div>
        )}
      </div>
    </div>
  );
}
