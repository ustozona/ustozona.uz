import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HELP_CATEGORIES, getFirstArticleHref, getHelpArticle } from "@/lib/help-content";
import { HelpIcon } from "./_components/HelpIcon";

export const metadata: Metadata = {
  title: "Yordam markazi | Ustozona EMS",
};

export default function HelpHubPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[820px] px-6 py-10 md:px-10">
        <p className="text-label text-primary">Yordam markazi</p>
        <h1 className="heading-page mt-2">Ustozonadan qanday foydalanish kerak?</h1>
        <p className="text-body mt-2 text-muted-foreground">
          Mavzuni chapdan tanlang yoki qidiruvdan foydalaning.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {HELP_CATEGORIES.map((cat) => {
            // HelpNav'dagi bilan bir xil qoida: kategoriyaning bironta ham
            // maqolasi yozilmagan boʻlsa (fayl yaratilmagan), karta 404'ga
            // olib bormasin — disabled holatda "Tez orada" koʻrsatiladi.
            const hasContent = cat.articles.some((a) => getHelpArticle(a.slug));
            if (!hasContent) {
              return (
                <div
                  key={cat.slug}
                  className="flex cursor-default items-center gap-3 rounded-lg border border-border p-4 opacity-60"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground/50">
                    <HelpIcon name={cat.icon} className="size-4.5" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-muted-foreground">{cat.label}</span>
                    <span className="block text-caption text-muted-foreground/70">Tez orada</span>
                  </span>
                </div>
              );
            }
            return (
              <Link
                key={cat.slug}
                href={getFirstArticleHref(cat.slug)}
                className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <HelpIcon name={cat.icon} className="size-4.5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">{cat.label}</span>
                  <span className="block text-caption">{cat.articles.length} ta maqola</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
