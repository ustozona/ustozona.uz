import Link from "next/link";
import { ArrowRightIcon, CalendarDaysIcon, EyeIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCountUz } from "@/lib/format-count";
import { formatFullDateUz } from "@/lib/localization";
import { initialsOf } from "@/store/useFeedbackStore";
import type { BlogPostSummary } from "@/server/dal/blog";

/* Dizayn manbai: @ss-blocks/blog-component-15 (ShadCN Studio) — karta
   uslubi va hover strelka olindi, tab/kategoriya/qidiruv qismi olinmadi
   (bizning modelimizda kategoriya yoʻq — MVP).

   Tuzilma (jahon tajribasi — Medium/Ghost karta):
   · muqova toʻliq enlikda (`py-0` + `gap-0`, kontent alohida `p-5`);
   · sana/koʻrish = izoh oʻlchami (12px), sarlavha = `heading-section`;
   · muallif = avatar + ism, pastki qatorda; keyinchalik muallifning
     ochiq profiliga havola boʻladi (hozircha havolasiz `<div>`). */
export function BlogGrid({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="group h-full gap-0 overflow-hidden py-0 shadow-none"
        >
          {post.coverImageUrl && (
            <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt=""
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </Link>
          )}

          <CardContent className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5" />
                {post.publishedAt ? formatFullDateUz(post.publishedAt) : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <EyeIcon className="size-3.5" />
                {formatCountUz(post.viewCount)}
              </span>
            </div>

            <h3 className="heading-section line-clamp-2 text-balance">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h3>
            {post.excerpt && (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between gap-3 pt-2">
              {/* Muallif bloki — keyinchalik `/blog` muallif profiliga havola */}
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="size-6 shrink-0">
                  {post.authorAvatarUrl && (
                    <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />
                  )}
                  <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                    {initialsOf(post.authorName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium text-foreground">
                  {post.authorName}
                </span>
              </div>
              <Button
                size="icon"
                variant="outline"
                className="shrink-0 transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
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
