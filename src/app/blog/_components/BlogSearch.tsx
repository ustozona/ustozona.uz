"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileTextIcon, SearchIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { matchesBlogQuery } from "@/lib/blog-search";

export type BlogSearchItem = {
  slug: string;
  title: string;
  excerpt: string;
  authorName: string;
};

/* Qidiruv — ixcham tugma + Ctrl K / ⌘K oynasi. Maqolalar yozish bilan
   birga filtrlanadi (roʻyxat serverdan headerga prop boʻlib keladi —
   blogda maqola soni kam, alohida API shart emas). Enter tanlangan
   maqolani ochadi; birinchi qator doim «barcha natijalar» — u
   `/blog?q=…` sahifasiga olib boradi (havolani ulashish mumkin).

   Tugma hamma ekranda faqat ikonka (ghost) — tezkor tugma sichqoncha
   ustiga borganda `title` da koʻrinadi. */
export function BlogSearch({ posts }: { posts: BlogSearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const query = q.trim();
  const results = (query ? posts.filter((p) => matchesBlogQuery(p, query)) : posts).slice(0, 8);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Maqola qidirish"
        title="Qidirish (Ctrl K)"
        className="size-9 text-muted-foreground hover:text-foreground"
      >
        <SearchIcon className="size-4" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Maqola qidirish"
        description="Sarlavha, subtitr yoki muallif boʻyicha"
      >
        <CommandInput value={q} onValueChange={setQ} placeholder="Maqola qidirish…" />
        {/* Natija `matchesBlogQuery` bilan OLDINDAN filtrlanadi (apostrof
            qoidasi uchun). `CommandDialog` cmdk filtrini oʻchirishga imkon
            bermaydi, shuning uchun har qatorning `keywords` ida soʻrovning
            oʻzi turadi — cmdk filtri ularni doim oʻtkazib yuboradi. */}
        <CommandList>
          <CommandEmpty>Hech narsa topilmadi.</CommandEmpty>
          {query && (
            <CommandGroup>
              <CommandItem
                value={`__all ${query}`}
                keywords={[query]}
                onSelect={() => go(`/blog?q=${encodeURIComponent(query)}`)}
              >
                <SearchIcon />
                «{query}» boʻyicha barcha natijalar
              </CommandItem>
            </CommandGroup>
          )}
          {results.length > 0 && (
            <CommandGroup heading={query ? "Maqolalar" : "Soʻnggi maqolalar"}>
              {results.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={`${p.slug} ${query}`}
                  keywords={[query]}
                  onSelect={() => go(`/blog/${p.slug}`)}
                >
                  <FileTextIcon />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{p.title}</span>
                    <span className="text-caption truncate text-muted-foreground">{p.authorName}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
