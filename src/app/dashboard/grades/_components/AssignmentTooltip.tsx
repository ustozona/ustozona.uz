"use client";

import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLORS,
  type Assignment,
  type Topic,
} from "@/lib/grades-data";

type Props = {
  assignment: Assignment;
  topic: Topic | undefined;
  dueDate?: string;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function AssignmentTooltip({
  assignment,
  topic,
  dueDate,
  onEdit,
  onDelete,
}: Props) {
  const tc = topic ? TOPIC_COLORS[topic.color] : null;
  return (
    <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-card border border-border rounded-xl shadow-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-bold text-foreground leading-tight">
          {assignment.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="size-6 rounded-md hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tahrirlash"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="size-6 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="O'chirish"
          >
            <Trash2 className="size-3.5 text-red-500" />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-xs">
        {topic && tc && (
          <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", tc.dot)} />
            <span className="text-muted-foreground">{topic.name}</span>
          </div>
        )}
        <div className="text-muted-foreground">{assignment.maxScore} ball</div>
        {dueDate && (
          <div className="text-muted-foreground">Muddat: {dueDate}</div>
        )}
      </div>
    </div>
  );
}
