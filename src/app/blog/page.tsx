import type { Metadata } from "next";
import { listPublishedPosts } from "@/server/dal/blog";
import { BlogGrid } from "./_components/BlogGrid";
import { BlogHeader } from "./_components/BlogHeader";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ustozona blogi — oʻqituvchilarning maqolalari.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts();

  return (
    <>
      {/* Sarlavha — «Yozish» va «Kirish/Roʻyxatdan oʻtish» tugmalari endi
          shu yerda (BlogHeader), sahifa ichidagi qatorda emas: oʻqish
          sahifalarining hammasida bir xil boshlanish boʻlishi kerak. */}
      <BlogHeader />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
        <h1 className="heading-page text-foreground">Blog</h1>
        <p className="mt-2 text-sm text-muted-foreground">Oʻqituvchilarning maqolalari.</p>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">Hozircha maqola yoʻq.</p>
        ) : (
          <div className="mt-8">
            <BlogGrid posts={posts} />
          </div>
        )}
      </div>
    </>
  );
}
