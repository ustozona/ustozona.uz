import Link from "next/link";
import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { listPublishedPosts } from "@/server/dal/blog";
import { getSession } from "@/server/session";
import { BlogGrid } from "./_components/BlogGrid";

export const metadata: Metadata = {
  title: "Blog",
  description: "Ustozona blogi — oʻqituvchilarning maqolalari.",
};

export default async function BlogIndexPage() {
  const [posts, session] = await Promise.all([listPublishedPosts(), getSession()]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <div className="flex items-center justify-between gap-2.5">
        <Link href="/" className="inline-flex">
          <BrandWordmark shieldClassName="size-7" textClassName="text-sm" gapClassName="gap-2" rollerSize="sm" />
        </Link>
        {session && (
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/blog/studio">
              <PenLine className="size-3.5" />
              Yozish
            </Link>
          </Button>
        )}
      </div>

      <h1 className="heading-page mt-8 text-foreground">Blog</h1>
      <p className="mt-1 text-sm text-muted-foreground">Oʻqituvchilarning maqolalari.</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Hozircha maqola yoʻq.</p>
      ) : (
        <div className="mt-8">
          <BlogGrid posts={posts} />
        </div>
      )}
    </div>
  );
}
