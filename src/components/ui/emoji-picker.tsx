"use client";

import * as React from "react";
import { SearchIcon } from "lucide-react";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { cn } from "@/lib/utils";
import { loadEmojiCategories, type EmojiCategory, type EmojiEntry } from "@/lib/emoji-apple-data";

/* Telegram-uslub, faqat-Apple-sprite emoji tanlagich. frimousse'ga
   TAYANMAYDI — oʻz maʼlumot manbamiz (emoji-datasource-apple,
   has_img_apple filtri) bilan HAR bir koʻrsatilgan emoji uchun sprite
   kafolatlanadi. Oddiy overflow-y-auto div — sichqoncha gʻildiragi
   ishlaydi (virtualizatsiya yoʻq). Nomlar inglizcha boʻlgani va ilova
   hali haqiqiy koʻp tillilikni qoʻllab-quvvatlamagani (til tanlovi
   kosmetik) uchun matn-yorliqlar butunlay olib tashlangan — faqat
   turkum sarlavhalari oʻzbekcha. */

type PickedEmoji = { emoji: string };

type Ctx = {
  query: string;
  setQuery: (q: string) => void;
  onEmojiSelect: (emoji: PickedEmoji) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

const EmojiPickerCtx = React.createContext<Ctx | null>(null);

function useEmojiPickerCtx() {
  const ctx = React.useContext(EmojiPickerCtx);
  if (!ctx) throw new Error("EmojiPicker* komponentlari <EmojiPicker> ichida boʻlishi kerak");
  return ctx;
}

function EmojiPicker({
  className,
  onEmojiSelect,
  children,
}: {
  className?: string;
  onEmojiSelect: (emoji: PickedEmoji) => void;
  children: React.ReactNode;
}) {
  const [query, setQuery] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <EmojiPickerCtx.Provider value={{ query, setQuery, onEmojiSelect, scrollRef }}>
      <div
        data-slot="emoji-picker"
        className={cn(
          "bg-popover text-popover-foreground isolate flex h-full w-[320px] flex-col overflow-hidden rounded-md",
          className
        )}
      >
        {children}
      </div>
    </EmojiPickerCtx.Provider>
  );
}

function EmojiPickerSearch({ className }: { className?: string }) {
  const { query, setQuery } = useEmojiPickerCtx();
  return (
    <div className={cn("flex h-9 shrink-0 items-center gap-2 border-b border-border px-3", className)}>
      <SearchIcon className="size-4 shrink-0 opacity-50" aria-hidden />
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Emoji qidirish…"
        className="placeholder:text-muted-foreground flex h-9 w-full min-w-0 bg-transparent text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function EmojiCell({
  entry,
  onPick,
}: {
  entry: EmojiEntry;
  onPick: (emoji: PickedEmoji) => void;
}) {
  return (
    <button
      type="button"
      title={entry.char}
      onClick={() => onPick({ emoji: entry.char })}
      className="flex size-9 items-center justify-center rounded-lg transition-transform duration-100 hover:scale-125 hover:bg-muted active:scale-95"
    >
      <AppleEmoji code={entry.code} label={entry.char} className="size-6" />
    </button>
  );
}

function EmojiPickerContent({ className }: { className?: string }) {
  const { query, onEmojiSelect, scrollRef } = useEmojiPickerCtx();
  const [categories, setCategories] = React.useState<EmojiCategory[] | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadEmojiCategories().then((c) => alive && setCategories(c));
    return () => {
      alive = false;
    };
  }, []);

  const results = React.useMemo(() => {
    if (!categories) return null;
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits: EmojiEntry[] = [];
    outer: for (const cat of categories) {
      for (const e of cat.emojis) {
        if (e.search.includes(q)) hits.push(e);
        if (hits.length >= 180) break outer;
      }
    }
    return hits;
  }, [categories, query]);

  const scrollToCat = (key: string) => {
    scrollRef.current?.querySelector(`[data-cat="${key}"]`)?.scrollIntoView({ block: "start" });
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Turkum yorliqlari (Telegram-uslub) — qidiruv boʻsh boʻlganda */}
      {!results && categories && (
        <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.label}
              onClick={() => scrollToCat(c.key)}
              className="flex size-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-muted"
            >
              <AppleEmoji code={c.icon} label={c.label} className="size-[18px]" />
            </button>
          ))}
        </div>
      )}

      {/* Panjara — oddiy scroll konteyner, gʻildirak bilan ishlaydi */}
      <div ref={scrollRef} className="h-64 overflow-y-auto overscroll-contain p-2">
        {!categories ? (
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
                <EmojiCell key={e.code} entry={e} onPick={onEmojiSelect} />
              ))}
            </div>
          )
        ) : (
          categories.map((cat) => (
            <div key={cat.key} data-cat={cat.key} className="scroll-mt-1">
              <p className="sticky top-0 z-10 bg-popover/95 px-1 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur">
                {cat.label}
              </p>
              <div className="grid grid-cols-7 gap-0.5">
                {cat.emojis.map((e) => (
                  <EmojiCell key={e.code} entry={e} onPick={onEmojiSelect} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmojiPickerFooter() {
  return null;
}

export { EmojiPicker, EmojiPickerSearch, EmojiPickerContent, EmojiPickerFooter };
