import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPosts } from "@/server/dal/blog";
import { BlogFooter, BlogGrid, BlogHero } from "./_components/BlogGrid";
import { BlogHeader } from "./_components/BlogHeader";
import { matchesBlogQuery } from "@/lib/blog-search";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ustozona blogi — ustozlar uchun har tomonlama kasbiy va shaxsiy rivojlanish maydoni.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  const all = await listPublishedPosts();
  const posts = q ? all.filter((p) => matchesBlogQuery(p, q)) : all;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <BlogHeader />

      <BlogHero>
        <h1 className="text-4xl font-medium tracking-tighter text-foreground md:text-5xl">
          Ustozona blogi
        </h1>
        <p className="text-sm text-muted-foreground md:text-base lg:text-lg">
          Ustozlar uchun har tomonlama kasbiy va shaxsiy rivojlanish maydoni.
        </p>
      </BlogHero>

      <main className="mx-auto w-full max-w-7xl flex-1">
        {q && (
          <div className="flex items-center justify-between gap-3 border-x border-border px-6 py-4 text-sm text-muted-foreground">
            <span>
              «<span className="text-foreground">{q}</span>» boʻyicha {posts.length} ta maqola
            </span>
            <Link href="/blog" className="text-foreground underline-offset-4 hover:underline">
              Tozalash
            </Link>
          </div>
        )}
        {posts.length === 0 ? (
          <p className="border-x border-t border-border p-6 text-sm text-muted-foreground">
            {q ? "Hech narsa topilmadi. Boshqa soʻz bilan qidirib koʻring." : "Hozircha maqola yoʻq."}
          </p>
        ) : (
          <BlogGrid posts={posts} />
        )}
      </main>

      <BlogFooter />
    </div>
  );
}
