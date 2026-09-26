"use client";

import { createContext, useContext, useState } from "react";

type HelpSearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
};

const HelpSearchContext = createContext<HelpSearchContextValue | null>(null);

/** Headerdagi qidiruv maydoni va chap menyudagi filtr bir xil holatni
    ulashishi uchun — ikkalasi ham sahifa layoutida turli joyda
    render qilinadi (header vs. sidebar), shuning uchun oddiy prop
    o'tkazish o'rniga yengil context ishlatiladi. */
export function HelpSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState("");
  return <HelpSearchContext.Provider value={{ query, setQuery }}>{children}</HelpSearchContext.Provider>;
}

export function useHelpSearch() {
  const ctx = useContext(HelpSearchContext);
  if (!ctx) throw new Error("useHelpSearch faqat HelpSearchProvider ichida ishlatiladi");
  return ctx;
}
