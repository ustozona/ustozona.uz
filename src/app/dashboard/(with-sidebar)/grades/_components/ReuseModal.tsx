"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormFieldGroup } from "@/components/ui/form-blocks";
import { TypographyList, TypographyMuted, TypographySmall } from "@/components/ui/typography";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  TOPIC_COLOR_HEX,
  type Assignment,
  type ClassData,
  type TopicColor,
} from "@/lib/grades-data";

type Props = {
  classDataMap: Record<string, ClassData>;
  currentClassId: string;
  onClose: () => void;
  onReuse: (sourceClassId: string, assignment: Assignment) => void;
};

export default function ReuseModal({
  classDataMap,
  currentClassId,
  onClose,
  onReuse,
}: Props) {
  const [query, setQuery] = useState("");
  const [filterClassId, setFilterClassId] = useState<string>(currentClassId);
  const [filterTopicId, setFilterTopicId] = useState<string>("__all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const allItems = useMemo(() => {
    const items: {
      classId: string;
      className: string;
      assignment: Assignment;
      topicName: string;
      topicColor: string;
    }[] = [];
    Object.entries(classDataMap).forEach(([cid, cd]) => {
      cd.assignments.forEach((a) => {
        const t = cd.topics.find((x) => x.id === a.topicId);
        items.push({
          classId: cid,
          className: cd.info.name,
          assignment: a,
          topicName: t?.name ?? "—",
          topicColor: t?.color ?? "blue",
        });
      });
    });
    return items;
  }, [classDataMap]);

  const filtered = useMemo(() => {
    return allItems.filter((it) => {
      if (filterClassId !== "__all" && it.classId !== filterClassId)
        return false;
      if (filterTopicId !== "__all" && it.assignment.topicId !== filterTopicId)
        return false;
      if (query && !it.assignment.title.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
  }, [allItems, filterClassId, filterTopicId, query]);

  const topicsForFilter = useMemo(() => {
    if (filterClassId === "__all") return [];
    return classDataMap[filterClassId]?.topics ?? [];
  }, [filterClassId, classDataMap]);

  function handleReuse() {
    if (!selectedKey) return;
    const [cid, aid] = selectedKey.split("::");
    const a = classDataMap[cid]?.assignments.find((x) => x.id === aid);
    if (a) onReuse(cid, a);
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 border-b border-border text-left shrink-0">
          <DialogTitle>Topshiriqni qayta ishlatish</DialogTitle>
          <DialogDescription>
            Mavjud topshiriqni nusxalang. Nusxa shu sinfga qoralama sifatida
            tushadi.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 flex flex-col gap-3 border-b border-border">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Topshiriqlarni qidirish..."
              className="w-full h-9 pl-9 rounded-lg bg-card text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FilterSelect
              label="SINF"
              value={filterClassId}
              onChange={(v) => {
                setFilterClassId(v);
                setFilterTopicId("__all");
              }}
              options={[
                { value: "__all", label: "Barcha sinflar" },
                ...Object.entries(classDataMap).map(([id, cd]) => ({
                  value: id,
                  label: cd.info.name,
                })),
              ]}
            />
            <FilterSelect
              label="MAVZU"
              value={filterTopicId}
              onChange={setFilterTopicId}
              options={[
                { value: "__all", label: "Barcha mavzular" },
                ...topicsForFilter.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 pt-0">
          {filtered.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Search /></EmptyMedia>
                <EmptyTitle>Topilmadi</EmptyTitle>
                <EmptyDescription>Sizning qidiruvingiz boʻyicha hech qanday topshiriq topilmadi.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <TypographyList className="my-0 ml-0 list-none flex flex-col gap-2 [&>li]:mt-0">
              {filtered.map((it) => {
                const key = `${it.classId}::${it.assignment.id}`;
                const isSelected = selectedKey === key;
                const dotHex =
                  TOPIC_COLOR_HEX[it.topicColor as TopicColor] ?? TOPIC_COLOR_HEX.blue;
                return (
                  <li key={key}>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedKey(key)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors cursor-pointer border h-auto min-h-0 hover:bg-transparent",
                        isSelected
                          ? "bg-muted border-foreground/20"
                          : "bg-card border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: dotHex }}
                        />
                        <div className="min-w-0">
                          <TypographySmall className="truncate text-foreground">{it.assignment.title}</TypographySmall>
                          <TypographyMuted className="truncate">
                            {it.topicName} · {it.assignment.maxScore} ball ·{" "}
                            {it.className} sinfidan
                          </TypographyMuted>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
                          isSelected
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {isSelected ? "Tanlandi" : "Tanlash"}
                      </span>
                    </Button>
                  </li>
                );
              })}
            </TypographyList>
          )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button size="sm" onClick={handleReuse} disabled={!selectedKey}>
            Qayta ishlatish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <FormFieldGroup label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 rounded-lg bg-card text-sm w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldGroup>
  );
}
