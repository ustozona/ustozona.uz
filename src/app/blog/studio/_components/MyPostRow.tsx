"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { setPostStatusAction, deletePostAction } from "@/server/actions/blog";
import type { BlogPostSummary } from "@/server/dal/blog";

export function MyPostRow({ post }: { post: BlogPostSummary }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const published = post.status === "published";

  const toggleStatus = () => {
    startTransition(async () => {
      await setPostStatusAction({ id: post.id, status: published ? "draft" : "published" });
      toast.success(published ? "Qoralamaga oʻtkazildi" : "Nashr qilindi");
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

  return (
    <div className="flex items-center gap-3 border-b border-border p-3 last:border-b-0 md:p-4">
      <div className="min-w-0 flex-1">
        <Link href={`/blog/studio/${post.id}`} className="truncate font-medium hover:underline">
          {post.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-2">
          <Badge variant={published ? "default" : "outline"} className="h-5 px-1.5 text-[10px]">
            {published ? "Nashr qilingan" : "Qoralama"}
          </Badge>
          <TypographyMuted className="text-xs">
            {new Date(post.updatedAt).toLocaleDateString("uz-UZ")}
          </TypographyMuted>
        </div>
      </div>

      <Button variant="outline" size="sm" disabled={pending} onClick={toggleStatus}>
        {published ? "Qoralamaga" : "Nashr qilish"}
      </Button>

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
