"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type TocItem = { id: string; short: string };

export default function ArticleToc({ items }: { items: TocItem[] }) {
  const t = useTranslations("ArticleToc");
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // Scroll Radix ScrollArea viewport ichida boʻladi — observer root shu boʻlsin.
    const root = sections[0].closest<HTMLElement>("[data-radix-scroll-area-viewport]") ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root, rootMargin: "0px 0px -65% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    // Radix viewport ichida scrollIntoView ishonchsiz — viewport'ni qoʻlda siljitamiz.
    const vp = el.closest<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (vp) {
      const top = el.getBoundingClientRect().top - vp.getBoundingClientRect().top + vp.scrollTop - 24;
      vp.scrollTo({ top, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-0 self-start">
        <p className="text-label mb-3 text-muted-foreground">{t("tableOfContents")}</p>
        <ul className="space-y-1 border-l border-border">
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={(e) => handleClick(e, it.id)}
                className={cn(
                  "-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors",
                  active === it.id
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {it.short}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
