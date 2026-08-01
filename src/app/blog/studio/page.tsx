import Link from "next/link";
import { redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { listMyPosts } from "@/server/dal/blog";
import { createPostAction } from "@/server/actions/blog";
import { MyPostRow } from "./_components/MyPostRow";

/* /dashboard TASHQARISIDA — lesson-editor bilan bir xil sabab: yozish
   uchun chalgʻitmaydigan sirt, EMS sidebar bilan bogʻliq emas. Himoya
   proxy.ts PROTECTED_PREFIXES orqali (haqiqiy tekshiruv DAL'da
   requireTeacher). */
export default async function MyBlogPage() {
  const posts = await listMyPosts();

  async function handleCreate() {
    "use server";
    const { id } = await createPostAction();
    redirect(`/blog/studio/${id}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-14">
      <div className="flex items-center justify-between gap-2.5">
        <Link href="/blog" className="inline-flex">
          <BrandWordmark shieldClassName="size-7" textClassName="text-sm" gapClassName="gap-2" rollerSize="sm" />
        </Link>
        <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
          Ustozona ilovasi ↗
        </Link>
      </div>

      <div className="mt-8 flex items-center justify-between gap-2.5">
        <div>
          <h1 className="heading-page text-foreground">Mening maqolalarim</h1>
          <TypographyMuted className="text-sm">Yozing, saqlang va nashr qiling.</TypographyMuted>
        </div>
        <form action={handleCreate}>
          <Button type="submit" className="gap-1.5">
            <PenLine className="size-4" />
            Yangi maqola
          </Button>
        </form>
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card p-4 md:p-5">
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Illustration name="4" className="h-32 text-black dark:text-white" />
              </EmptyMedia>
              <EmptyTitle>Hali maqola yoʻq</EmptyTitle>
              <EmptyDescription>Birinchi maqolangizni yozib, jamoatchilik bilan ulashing.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card">
          {posts.map((p) => (
            <MyPostRow key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
