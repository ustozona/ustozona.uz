"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Send, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
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
  draftCount?: number;
  ungradedCount?: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onFillColumn?: (score: number) => void;
  onMarkRemaining?: () => void;
};

export default function AssignmentTooltip({
  assignment,
  topic,
  dueDate,
  draftCount = 0,
  ungradedCount = 0,
  onEdit,
  onDelete,
  onPublish,
  onFillColumn,
  onMarkRemaining,
}: Props) {
  const t = useTranslations("AssignmentTooltip");
  const isFormative = (topic?.purpose ?? "summative") === "formative";
  const [fillVal, setFillVal] = useState("");

  function applyFill() {
    const n = Number(fillVal.trim());
    if (fillVal.trim() === "" || Number.isNaN(n) || !onFillColumn) return;
    onFillColumn(Math.max(0, Math.min(assignment.maxScore, n)));
    setFillVal("");
  }
  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 mb-3">
        <TypographySmall className="text-sm font-bold text-foreground leading-tight block">
          {assignment.title}
        </TypographySmall>
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
              className="size-2 rounded-full"
              style={{ backgroundColor: TOPIC_COLOR_HEX[topic.color] }}
            />
            <span className="text-muted-foreground">{topic.name}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Badge
            variant={isFormative ? "outline" : "secondary"}
            className={cn(
              "text-[10px] font-bold",
              isFormative && "border-dashed border-muted-foreground/40 text-muted-foreground"
            )}
          >
            {isFormative ? t("formative") : t("summative")}
          </Badge>
          <span className="text-muted-foreground">
            {isFormative ? t("excludedFromTotal") : t("includedInTotal")}
          </span>
        </div>
        <div className="text-muted-foreground">{t("maxScore", { score: assignment.maxScore })}</div>
        {dueDate && (
          <div className="text-muted-foreground">{t("dueDate", { date: dueDate })}</div>
        )}
      </div>

      {ungradedCount > 0 && (onFillColumn || onMarkRemaining) && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <TypographySmall className="text-xs font-medium text-muted-foreground">
            {t("ungradedCount", { count: ungradedCount })}
          </TypographySmall>
          {onFillColumn && (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={fillVal}
                onChange={(e) => setFillVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFill()}
                placeholder={`0–${assignment.maxScore}`}
                className="h-7 text-xs"
              />
              <Button
                onClick={applyFill}
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
              >
                {t("apply")}
              </Button>
            </div>
          )}
          {onMarkRemaining && (
            <Button
              onClick={onMarkRemaining}
              size="sm"
              variant="outline"
              className="w-full gap-2 text-xs"
            >
              <UserX className="size-3.5" />
              {t("markRemaining")}
            </Button>
          )}
        </div>
      )}

      {draftCount > 0 && onPublish && (
        <Button
          onClick={onPublish}
          size="sm"
          className="w-full gap-2 mt-1"
        >
          <Send className="size-3.5" />
          {t("publishDrafts", { count: draftCount })}
        </Button>
      )}
    </div>
  );
}
