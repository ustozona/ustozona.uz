"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ClassSwatch } from "@/components/ClassSwatch";
import { ROUTE_LABELS } from "@/lib/route-labels";
import { useGradesStore } from "@/store/useGradesStore";
import { useLessonStore } from "@/store/useLessonStore";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid, Users, Calendar, BookOpen, FileText, ClipboardCheck,
  Award, BarChart2, Target, CheckCircle, MessagesSquare, Settings, Home,
  Search,
  type LucideIcon,
} from "lucide-react";

const PAGE_ICONS: Record<string, LucideIcon> = {
  "/dashboard": Home,
  "/dashboard/classes": LayoutGrid,
  "/dashboard/students": Users,
  "/dashboard/timetable": Calendar,
  "/dashboard/planner": BookOpen,
  "/dashboard/lessons": FileText,
  "/dashboard/attendance": ClipboardCheck,
  "/dashboard/behavior": Award,
  "/dashboard/grades": BarChart2,
  "/dashboard/standards": Target,
  "/dashboard/tasks": CheckCircle,
  "/dashboard/feedback": MessagesSquare,
  "/dashboard/settings": Settings,
};

const PAGE_ROUTES = Object.keys(PAGE_ICONS);

export default function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const lessons = useLessonStore((s) => s.lessons);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const classes = React.useMemo(
    () => Object.values(classDataMap).map((cd) => cd.info).filter((c) => !c.archivedAt),
    [classDataMap]
  );

  const students = React.useMemo(() => {
    const rows: { id: string; name: string; initials: string; className: string; classId: string }[] = [];
    for (const [classId, data] of Object.entries(classDataMap)) {
      if (data.info.archivedAt) continue;
      for (const s of data.students) {
        rows.push({ id: s.id, name: s.name, initials: s.initials, className: data.info.name, classId });
      }
    }
    return rows;
  }, [classDataMap]);

  const go = React.useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={() => setOpen(true)}
          >
            <Search />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-1.5">
          Qidirish
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-background/10 px-1.5 font-mono text-[10px] font-medium">
            ⌘K
          </kbd>
        </TooltipContent>
      </Tooltip>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Qidirish"
        description="Sahifa, sinf, oʻquvchi yoki darsni qidiring"
      >
        <CommandInput placeholder="Qidirish…" />
        <CommandList>
          <CommandEmpty>Hech narsa topilmadi.</CommandEmpty>

          <CommandGroup heading="Sahifalar">
            {PAGE_ROUTES.map((href) => {
              const Icon = PAGE_ICONS[href];
              return (
                <CommandItem key={href} value={ROUTE_LABELS[href]} onSelect={() => go(href)}>
                  <Icon />
                  {ROUTE_LABELS[href]}
                </CommandItem>
              );
            })}
          </CommandGroup>

          {classes.length > 0 && (
            <CommandGroup heading="Sinflar">
              {classes.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.subject ?? ""}`}
                  onSelect={() => go(`/dashboard/classes/${encodeURIComponent(c.id)}`)}
                >
                  <ClassSwatch hex={CLASS_COLOR_HEX[classColor(c)]} />
                  {c.name}
                  {c.subject && <span className="text-muted-foreground">· {c.subject}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {students.length > 0 && (
            <CommandGroup heading="Oʻquvchilar">
              {students.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.className}`}
                  onSelect={() => go(`/dashboard/students/${encodeURIComponent(s.id)}`)}
                >
                  <Users />
                  {s.name}
                  <span className="text-muted-foreground">· {s.className}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {lessons.length > 0 && (
            <CommandGroup heading="Darslar">
              {lessons.map((l) => (
                <CommandItem
                  key={l.id}
                  value={l.title}
                  onSelect={() => go(`/lessons/${encodeURIComponent(l.id)}`)}
                >
                  <FileText />
                  {l.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
