import Link from "next/link";
import { ArrowRightIcon, CalendarDaysIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { BlogPostSummary } from "@/server/dal/blog";

/* Dizayn manbai: @ss-blocks/blog-component-15 (ShadCN Studio) — karta
   uslubi va hover strelka olindi, tab/kategoriya/qidiruv qismi olinmadi
   (bizning modelimizda kategoriya yoʻq — MVP). */
export function BlogGrid({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post) => (
        <Card key={post.id} className="group h-full overflow-hidden shadow-none transition-all duration-300">
          <CardContent className="space-y-3.5">
            {post.coverImageUrl && (
              <div className="mb-3 overflow-hidden rounded-lg">
                <Link href={`/blog/${post.slug}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImageUrl}
                    alt=""
                    className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDaysIcon className="size-4" />
              <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("uz-UZ") : ""}</span>
            </div>

            <h3 className="line-clamp-2 text-lg font-semibold">
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h3>
            {post.excerpt && <p className="line-clamp-2 text-muted-foreground">{post.excerpt}</p>}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{post.authorName}</span>
              <Button
                size="icon"
                variant="outline"
                className="group-hover:bg-primary! group-hover:text-primary-foreground group-hover:border-primary hover:border-primary hover:bg-primary! hover:text-primary-foreground"
                asChild
              >
                <Link href={`/blog/${post.slug}`}>
                  <ArrowRightIcon className="size-4 -rotate-45" />
                  <span className="sr-only">Oʻqish: {post.title}</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
