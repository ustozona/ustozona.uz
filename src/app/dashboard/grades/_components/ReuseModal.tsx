"use client";

import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLORS,
  type Assignment,
  type ClassData,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Topshiriqni qayta ishlatish
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Mavjud topshiriqni nusxalang. Nusxa shu sinfga qoralama sifatida
              tushadi.
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Yopish"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3 border-b border-border">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Topshiriqlarni qidirish..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
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

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Hech narsa topilmadi.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {filtered.map((it) => {
                const key = `${it.classId}::${it.assignment.id}`;
                const isSelected = selectedKey === key;
                const tc =
                  TOPIC_COLORS[
                    it.topicColor as keyof typeof TOPIC_COLORS
                  ] ?? TOPIC_COLORS.blue;
                return (
                  <li key={key}>
                    <button
                      onClick={() => setSelectedKey(key)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer border",
                        isSelected
                          ? "bg-muted border-foreground/20"
                          : "bg-card border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={cn("size-2 rounded-full shrink-0", tc.dot)} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {it.assignment.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {it.topicName} · {it.assignment.maxScore} ball ·{" "}
                            {it.className} sinfidan
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md",
                          isSelected
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {isSelected ? "Tanlandi" : "Tanlash"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 h-9 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleReuse}
            disabled={!selectedKey}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 h-9 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Qayta ishlatish
          </button>
        </div>
      </div>
    </div>
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
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
