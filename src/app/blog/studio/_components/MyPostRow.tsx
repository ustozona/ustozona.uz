"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Link2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { viewsLabelUz } from "@/lib/format-count";
import { publishPostAction, unpublishPostAction, deletePostAction } from "@/server/actions/blog";
import type { BlogPostSummary } from "@/server/dal/blog";

export function MyPostRow({ post }: { post: BlogPostSummary }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const published = post.status === "published";
  const archived = post.status === "archived";

  const publish = () => {
    startTransition(async () => {
      await publishPostAction(post.id);
      toast.success("Nashr qilindi");
      router.refresh();
    });
  };

  const unpublish = () => {
    startTransition(async () => {
      await unpublishPostAction(post.id);
      toast.success("Nashrdan olindi");
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      await deletePostAction(post.id);
      toast.success("Maqola oʻchirildi");
      router.refresh();
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/blog/${post.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Havola nusxalandi");
    } catch {
      toast.error("Havolani nusxalab boʻlmadi");
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-border p-3 last:border-b-0 md:p-4">
      <div className="min-w-0 flex-1">
        <Link href={`/blog/studio/${post.id}`} className="truncate font-medium hover:underline">
          {post.title}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Badge
            variant={published ? "default" : "outline"}
            className="h-5 px-1.5 text-[10px]"
          >
            {published ? "Nashr qilingan" : archived ? "Arxivlangan" : "Qoralama"}
          </Badge>
          <TypographyMuted className="text-xs">
            {new Date(post.updatedAt).toLocaleDateString("uz-UZ")}
          </TypographyMuted>
          {(published || archived) && (
            <TypographyMuted className="text-xs">· {viewsLabelUz(post.viewCount)}</TypographyMuted>
          )}
        </div>
      </div>

      {published && (
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={copyLink}>
          {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
          <span className="hidden sm:inline">Havola</span>
        </Button>
      )}

      {published ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={unpublish}>
          Nashrdan olish
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled={pending} onClick={publish}>
          {archived ? "Qayta nashr" : "Nashr qilish"}
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Maqolani oʻchirish?</AlertDialogTitle>
            <AlertDialogDescription>Bu amalni qaytarib boʻlmaydi.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Oʻchirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
