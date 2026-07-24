"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ListTodo,
  Sun,
  Sunrise,
  CalendarDays,
  CalendarClock,
  CalendarX2,
  Inbox,
  CheckCircle2,
  ChevronRight,
  Search,
  GraduationCap,
  X,
} from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ClassSwatch } from "@/components/ClassSwatch";
import { cn } from "@/lib/utils";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX, classTints } from "@/lib/class-colors";
import type { SmartListKey } from "@/lib/tasks-data";

function TagPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

export const SMART_LIST_ICONS: Record<SmartListKey, React.ComponentType<{ className?: string }>> = {
  today: Sun,
  tomorrow: Sunrise,
  week: CalendarDays,
  planned: CalendarClock,
  nodate: Inbox,
  done: CheckCircle2,
  overdue: CalendarX2,
};

export function TasksNav({
  listKey,
  classId,
  counts,
  search,
  onSearchChange,
  onSelectList,
  onSelectClass,
  allTags,
  activeTag,
  onSelectTag,
}: {
  listKey: SmartListKey | null;
  classId: string | null;
  counts: Record<SmartListKey, number>;
  search: string;
  onSearchChange: (v: string) => void;
  onSelectList: (list: SmartListKey) => void;
  onSelectClass: (id: string) => void;
  allTags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}) {
  const t = useTranslations("TasksPage.nav");
  const liveClasses = useLiveClasses();
  const [classesOpen, setClassesOpen] = useState(true);

  return (
    <Panel>
      <PanelHeader icon={<ListTodo />} title={t("title")} />
      <PanelBody>
        <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t("clearSearch")}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {(Object.keys(SMART_LIST_ICONS) as SmartListKey[]).map((key) => {
            const Icon = SMART_LIST_ICONS[key];
            const active = listKey === key;
            const count = counts[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectList(key)}
                style={active ? { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
                className={cn(
                  "list-row-compact w-full disabled:pointer-events-none disabled:opacity-50",
                  !active && "hover:bg-muted"
                )}
                data-active={active || undefined}
              >
                <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-primary-foreground" : "text-muted-foreground")} />
                <span
                  className={cn(
                    "flex-1 truncate text-left text-sm transition-colors",
                    active ? "font-semibold text-primary-foreground" : "text-foreground/70"
                  )}
                >
                  {t(key)}
                </span>
                {count > 0 && (
                  <Badge
                    variant={active ? "outline" : "secondary"}
                    className={cn(
                      "size-6 rounded-full p-0 text-xs tabular-nums",
                      active
                        ? "border-transparent bg-primary-foreground/15 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {liveClasses.length > 0 && (
          <Collapsible open={classesOpen} onOpenChange={setClassesOpen} className="flex flex-col gap-1">
            <CollapsibleTrigger className="group/classes list-row-compact w-full hover:bg-muted">
              <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-left text-sm text-foreground/70">
                {t("classesLabel")}
              </span>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/classes:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
              <div className="flex flex-col gap-1">
                {liveClasses.map((cls) => {
                  const hex = CLASS_COLOR_HEX[classColor(cls)];
                  const active = classId === cls.id;
                  const tints = classTints(classColor(cls));
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => onSelectClass(cls.id)}
                      style={active ? { ["--card-accent" as string]: hex, ...tints.tint } : undefined}
                      className="list-row-compact w-full disabled:pointer-events-none disabled:opacity-50"
                      data-active={active || undefined}
                      data-tint={active || undefined}
                    >
                      <ClassSwatch hex={hex} />
                      <span
                        className={cn(
                          "flex-1 truncate text-left text-sm transition-colors",
                          active ? "font-semibold text-foreground" : "text-foreground/70"
                        )}
                      >
                        {cls.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {allTags.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("tagsLabel")}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {allTags.map((tag) => (
                <TagPill
                  key={tag}
                  active={activeTag === tag}
                  onClick={() => onSelectTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </TagPill>
              ))}
            </div>
          </div>
        )}
        </div>
      </PanelBody>
    </Panel>
  );
}
