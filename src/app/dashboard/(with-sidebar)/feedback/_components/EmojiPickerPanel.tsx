"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import {
  loadEmojiGroups, EMOJI_CDN, type EmojiEntry, type EmojiGroup,
} from "./emoji-data";

/** Bitta Apple-emoji tugmasi (24px sprite). */
function EmojiButton({ e, onPick }: { e: EmojiEntry; onPick: (char: string) => void }) {
  return (
    <button
      type="button"
      aria-label={e.char}
      title={e.search.split(" ")[0]}
      onClick={() => onPick(e.char)}
      className="flex size-9 items-center justify-center rounded-lg transition-transform duration-100 hover:scale-125 hover:bg-muted active:scale-95"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${EMOJI_CDN}${e.image}`}
        alt={e.char}
        loading="lazy"
        draggable={false}
        className="size-6 object-contain"
      />
    </button>
  );
}

export default function EmojiPickerPanel({ onPick }: { onPick: (char: string) => void }) {
  const [groups, setGroups] = useState<EmojiGroup[] | null>(null);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    loadEmojiGroups().then((g) => alive && setGroups(g));
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!groups) return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits: EmojiEntry[] = [];
    for (const g of groups) {
      for (const e of g.emojis) {
        if (e.search.includes(q)) hits.push(e);
        if (hits.length >= 180) break;
      }
      if (hits.length >= 180) break;
    }
    return hits;
  }, [groups, query]);

  const scrollToCat = (key: string) => {
    scrollRef.current?.querySelector(`[data-cat="${key}"]`)?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="flex w-[320px] flex-col">
      {/* Qidiruv */}
      <div className="relative p-2">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Emoji qidirish…"
          className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary/50"
        />
      </div>

      {/* Kategoriya yorliqlari (qidiruv boʻsh boʻlganda) */}
      {!results && groups && (
        <div className="flex items-center gap-0.5 border-b border-border px-2 pb-1.5">
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              title={g.label}
              onClick={() => scrollToCat(g.key)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${EMOJI_CDN}${g.emojis[0]?.image}`} alt={g.label} className="size-[18px] object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Emoji panjarasi */}
      <div ref={scrollRef} className="h-64 overflow-y-auto overscroll-contain p-2">
        {!groups ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Yuklanmoqda…
          </div>
        ) : results ? (
          results.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Topilmadi
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {results.map((e) => (
                <EmojiButton key={e.image} e={e} onPick={onPick} />
              ))}
            </div>
          )
        ) : (
          groups.map((g) => (
            <div key={g.key} data-cat={g.key} className="scroll-mt-1">
              <p className="sticky top-0 z-10 bg-popover/95 px-1 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur">
                {g.label}
              </p>
              <div className="grid grid-cols-7 gap-0.5">
                {g.emojis.map((e) => (
                  <EmojiButton key={e.image} e={e} onPick={onPick} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
