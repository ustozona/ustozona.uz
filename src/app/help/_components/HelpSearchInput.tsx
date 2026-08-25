"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useHelpSearch } from "./HelpSearchContext";

/** Headerdagi qidiruv maydoni — Stripe/Linear/Notion docs andozasi:
    qidiruv sidebar ichida emas, headerda. */
export function HelpSearchInput() {
  const { query, setQuery } = useHelpSearch();
  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Qidirish…"
        className="h-9 pl-8"
      />
    </div>
  );
}
