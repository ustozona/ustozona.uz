"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HELP_CATEGORIES, getHelpArticle } from "@/lib/help-content";
import { HelpIcon } from "./HelpIcon";
import { useHelpSearch } from "./HelpSearchContext";

/** Yordam markazi chap menyusi — sahifaning chap ustunini egallaydi
    (layout.tsx). Kategoriyalar yig'iladigan, joriy sahifa avtomatik
    ochiq va ajratib ko'rsatiladi. Qidiruv maydoni headerda
    (`HelpSearchInput`) — bu yerda faqat filtr natijasi ishlatiladi. */
export function HelpNav() {
  const pathname = usePathname();
  const activeSlug = pathname.split("/").pop() ?? "";
  const { query } = useHelpSearch();
  const [openSlug, setOpenSlug] = useState<string | null>(() => {
    const cat = HELP_CATEGORIES.find((c) => c.articles.some((a) => a.slug === activeSlug));
    return cat?.slug ?? HELP_CATEGORIES[0].slug;
  });

  const q = query.trim().toLowerCase();
  const filtered = q
    ? HELP_CATEGORIES.map((c) => ({
        ...c,
        articles: c.articles.filter((a) => a.title.toLowerCase().includes(q)),
      })).filter((c) => c.articles.length > 0)
    : HELP_CATEGORIES;

  return (
    <nav className="col-span-1 flex flex-col border-b border-border lg:sticky lg:top-14 lg:max-h-[calc(100svh-3.5rem)] lg:border-b-0 lg:border-r">
      {/* `max-h` — `h` EMAS: mazmun qisqa boʻlsa qatorni butun ekranga
          choʻzmasin (Footer ana shu qatordan keyin keladi). Uzun boʻlsa
          shu balandlikda cheklanadi va oʻzining ScrollArea'sida sirpanadi.
          Brauzerning oʻz scrollbar'i (`overflow-y-auto`) EMAS — u doim
          koʻrinib turadi. ScrollArea (`type="scroll"`) asosiy kontent
          bilan bir xil: faqat scroll paytida chiqadi. */}
      <ScrollArea className="lg:max-h-[calc(100svh-3.5rem)]">
        <div className="px-7 py-4">
        <p className="text-label px-1 py-1.5 text-muted-foreground">Mavzular</p>
        {filtered.map((cat) => {
          // Hali yozilmagan maqolalar `getHelpArticle`da yoʻq (fayl yaratilmagan) —
          // ular /help/[slug]da 404 beradi. Kategoriya butunlay yozilmagan boʻlsa
          // (bironta ham maqolasi yoʻq) — butun qator disabled, yigʻilmaydi.
          const hasContent = cat.articles.some((a) => getHelpArticle(a.slug));
          const isOpen = q ? true : hasContent && openSlug === cat.slug;
          return (
            <div key={cat.slug} className="mb-0.5">
              <button
                type="button"
                disabled={!hasContent}
                onClick={() => setOpenSlug(isOpen ? null : cat.slug)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm font-medium transition-colors",
                  hasContent ? "text-foreground hover:bg-muted" : "cursor-default text-muted-foreground/50"
                )}
              >
                <HelpIcon name={cat.icon} className={cn("size-4 shrink-0", hasContent ? "text-muted-foreground" : "text-muted-foreground/40")} />
                <span className="flex-1 truncate">{cat.label}</span>
                {hasContent ? (
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 text-muted-foreground transition-transform",
                      !isOpen && "-rotate-90"
                    )}
                  />
                ) : (
                  <span className="shrink-0 text-[10px] font-normal uppercase tracking-wide text-muted-foreground/50">
                    Tez orada
                  </span>
                )}
              </button>
              {isOpen && (
                <ul className="ml-[1.4rem] space-y-0.5 border-l border-border py-0.5 pl-3">
                  {cat.articles.map((a) => {
                    const active = a.slug === activeSlug;
                    const written = !!getHelpArticle(a.slug);
                    if (!written) {
                      return (
                        <li key={a.slug} className="flex items-center justify-between gap-2 rounded-md py-1 text-sm text-muted-foreground/50">
                          <span className="truncate">{a.title}</span>
                          <span className="shrink-0 text-[10px] uppercase tracking-wide">Tez orada</span>
                        </li>
                      );
                    }
                    return (
                      <li key={a.slug}>
                        <Link
                          href={`/help/${a.slug}`}
                          className={cn(
                            "block rounded-md py-1 text-sm transition-colors",
                            active
                              ? "font-medium text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {a.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        </div>
      </ScrollArea>
    </nav>
  );
}
